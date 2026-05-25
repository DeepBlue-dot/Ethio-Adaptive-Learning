import { PathwayType, QuestionUsage, type MasteryStatus } from "@prisma/client"

import {
  buildLegacyContentBlocks,
  getContentBlockReferences,
  normalizeContentBlocks,
} from "@/lib/cms/content-blocks"
import { getStudentConceptCatalog } from "@/lib/curriculum"
import { loadCourseUserState } from "@/lib/curriculum-graph"
import { computeEffectiveMastery, isReviewDue } from "@/lib/adaptive/retention"
import {
  startCheckpointAttempt,
  startExamAttempt,
  startPracticeAttempt,
} from "@/lib/assessment"
import { serializeAttempt, serializeExamAttempt } from "@/lib/assessment/serialize"
import { prisma } from "@/lib/prisma"
import type {
  StudentConceptCard,
  StudentConceptDetail,
  StudentDashboard,
  StudentExamSession,
  StudentNavigation,
  StudentQuestion,
  StudentRecommendation,
  StudentReviewItem,
} from "@/lib/student/types"

const MS_PER_DAY = 1000 * 60 * 60 * 24

type ConceptAnalytics = {
  totalAttempts: number
  totalTimeSpentMs: number
  checkpointAttempts: number
  checkpointCorrect: number
  practiceAttempts: number
  practiceCorrect: number
  responseTimes: number[]
}

function emptyAnalytics(): ConceptAnalytics {
  return {
    totalAttempts: 0,
    totalTimeSpentMs: 0,
    checkpointAttempts: 0,
    checkpointCorrect: 0,
    practiceAttempts: 0,
    practiceCorrect: 0,
    responseTimes: [],
  }
}

function toIsoString(date: Date | null | undefined) {
  return date ? date.toISOString() : null
}

function roundProbability(value: number | null | undefined) {
  if (!Number.isFinite(value ?? Number.NaN)) {
    return 0
  }

  return Math.max(0, Math.min(1, Number((value ?? 0).toFixed(3))))
}

function average(values: number[]) {
  if (!values.length) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function attemptDurationMs(createdAt: Date, completedAt: Date | null) {
  if (!completedAt) {
    return 0
  }

  return Math.max(0, completedAt.getTime() - createdAt.getTime())
}

function getAnalyticsSummary(analytics: ConceptAnalytics) {
  return {
    totalAttempts: analytics.totalAttempts,
    totalTimeSpentMs: analytics.totalTimeSpentMs,
    checkpointPassRate: analytics.checkpointAttempts
      ? analytics.checkpointCorrect / analytics.checkpointAttempts
      : 0,
    practiceAccuracy: analytics.practiceAttempts
      ? analytics.practiceCorrect / analytics.practiceAttempts
      : 0,
    averageTimePerQuestion: average(analytics.responseTimes),
  }
}

function statusBucket(status: MasteryStatus) {
  if (status === "IN_PROGRESS") return "inProgress"
  if (status === "REVIEW_NEEDED") return "reviewNeeded"
  if (status === "MASTERED") return "mastered"
  if (status === "LOCKED") return "locked"
  return "fringe"
}

function getRecommendedAction(args: {
  status: MasteryStatus
  pMastery: number
  nextReviewAt?: Date | string | null
  locked: boolean
}): StudentRecommendation {
  if (args.locked) {
    return {
      type: "learn",
      isLocked: true,
      rationale: "Prerequisite concepts need more mastery before this concept opens.",
    }
  }

  if (args.status === "REVIEW_NEEDED" || isReviewDue(toDate(args.nextReviewAt))) {
    return {
      type: "review",
      isLocked: false,
      rationale: "Your retention signal says this concept is due for a quick refresh.",
    }
  }

  if (args.pMastery >= 0.7) {
    return {
      type: "challenge",
      isLocked: false,
      rationale: "Your mastery is strong enough to try the direct exam path.",
    }
  }

  return {
    type: "learn",
    isLocked: false,
    rationale: "Your mastery estimate is still building, so guided content and practice come first.",
  }
}

function toDate(value: Date | string | null | undefined) {
  if (!value) {
    return null
  }

  return value instanceof Date ? value : new Date(value)
}

async function getConceptAnalytics(userId: string, conceptIds: string[]) {
  const analytics = new Map(conceptIds.map((conceptId) => [conceptId, emptyAnalytics()] as const))

  if (!conceptIds.length) {
    return analytics
  }

  const [practiceAttempts, checkpointAttempts, examAttempts] = await Promise.all([
    prisma.practiceAttempt.findMany({
      where: {
        userId,
        conceptId: {
          in: conceptIds,
        },
        completedAt: {
          not: null,
        },
      },
      select: {
        conceptId: true,
        isCorrect: true,
        createdAt: true,
        completedAt: true,
      },
    }),
    prisma.checkpointAttempt.findMany({
      where: {
        userId,
        conceptId: {
          in: conceptIds,
        },
        completedAt: {
          not: null,
        },
      },
      select: {
        conceptId: true,
        isCorrect: true,
        createdAt: true,
        completedAt: true,
      },
    }),
    prisma.examAttempt.findMany({
      where: {
        userId,
        conceptId: {
          in: conceptIds,
        },
        completedAt: {
          not: null,
        },
      },
      select: {
        conceptId: true,
        questionCount: true,
        timeSpentSec: true,
      },
    }),
  ])

  for (const attempt of practiceAttempts) {
    const item = analytics.get(attempt.conceptId)
    if (!item) continue

    const duration = attemptDurationMs(attempt.createdAt, attempt.completedAt)
    item.totalAttempts += 1
    item.practiceAttempts += 1
    item.practiceCorrect += Number(attempt.isCorrect === true)
    item.totalTimeSpentMs += duration
    if (duration) item.responseTimes.push(duration)
  }

  for (const attempt of checkpointAttempts) {
    const item = analytics.get(attempt.conceptId)
    if (!item) continue

    const duration = attemptDurationMs(attempt.createdAt, attempt.completedAt)
    item.totalAttempts += 1
    item.checkpointAttempts += 1
    item.checkpointCorrect += Number(attempt.isCorrect === true)
    item.totalTimeSpentMs += duration
    if (duration) item.responseTimes.push(duration)
  }

  for (const attempt of examAttempts) {
    const item = analytics.get(attempt.conceptId)
    if (!item) continue

    const duration = (attempt.timeSpentSec ?? 0) * 1000
    item.totalAttempts += 1
    item.totalTimeSpentMs += duration
    if (duration && attempt.questionCount > 0) {
      item.responseTimes.push(duration / attempt.questionCount)
    }
  }

  return analytics
}

export async function getStudentNavigation(
  userId: string,
  username: string,
  role: string
): Promise<StudentNavigation> {
  const [profile, catalog] = await Promise.all([
    prisma.userProfile.findUnique({
      where: {
        userId,
      },
    }),
    getStudentConceptCatalog(userId),
  ])

  let totalConcepts = 0
  let unlockedConcepts = 0
  let masteredConcepts = 0
  let reviewDue = 0

  const courses = catalog.map((course) => ({
    id: course.id,
    title: course.title,
    units: course.units.map((unit) => ({
      id: unit.id,
      title: unit.title,
      concepts: unit.concepts.map((concept) => {
        totalConcepts += 1
        unlockedConcepts += Number(concept.unlocked)
        masteredConcepts += Number(concept.status === "MASTERED")
        reviewDue += Number(concept.status === "REVIEW_NEEDED" || isReviewDue(concept.nextReviewAt))

        return {
          id: concept.id,
          title: concept.title,
          status: concept.status,
          href: `/student/concept/${concept.id}`,
        }
      }),
    })),
  }))

  const derivedProgress = totalConcepts > 0 ? (masteredConcepts / totalConcepts) * 100 : 0

  return {
    profile: {
      username,
      role,
      totalXP: profile?.totalXP ?? 0,
      currentLevel: profile?.currentLevel ?? 1,
      dailyStreak: profile?.dailyStreak ?? 0,
      overallProgress: profile?.overallProgress || derivedProgress,
    },
    courses,
    summary: {
      totalConcepts,
      unlockedConcepts,
      masteredConcepts,
      reviewDue,
    },
  }
}

export async function getStudentDashboard(userId: string): Promise<StudentDashboard> {
  const [profile, courses] = await Promise.all([
    prisma.userProfile.findUnique({
      where: {
        userId,
      },
    }),
    prisma.course.findMany({
      where: {
        archivedAt: null,
        status: "PUBLISHED",
      },
      include: {
        units: {
          where: {
            status: "PUBLISHED",
          },
          orderBy: {
            order: "asc",
          },
          include: {
            concepts: {
              where: {
                status: "PUBLISHED",
              },
              orderBy: {
                title: "asc",
              },
              select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                unlockThreshold: true,
                pLo: true,
              },
            },
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    }),
  ])

  const courseStates = new Map(
    await Promise.all(
      courses.map(async (course) => [course.id, await loadCourseUserState(course.id, userId)] as const)
    )
  )

  const conceptIds = courses.flatMap((course) =>
    course.units.flatMap((unit) => unit.concepts.map((concept) => concept.id))
  )
  const analytics = await getConceptAnalytics(userId, conceptIds)
  const masteryByConceptId = new Map(
    [...courseStates.values()].flatMap((courseState) =>
      courseState.masteries.map((mastery) => [mastery.conceptId, mastery] as const)
    )
  )

  const cards: StudentConceptCard[] = []

  for (const course of courses) {
    const courseState = courseStates.get(course.id)

    for (const unit of course.units) {
      for (const concept of unit.concepts) {
        const derivedStatus = courseState?.statuses.get(concept.id)
        const mastery = masteryByConceptId.get(concept.id)
        const conceptAnalytics = getAnalyticsSummary(analytics.get(concept.id) ?? emptyAnalytics())
        const pMastery = roundProbability(
          derivedStatus?.masteryProbability ?? (derivedStatus?.unlocked ? concept.pLo : 0)
        )
        const prerequisiteTitles =
          courseState?.ancestorMap.get(concept.id)?.map((ancestor) => ancestor.title) ?? []

        cards.push({
          conceptId: concept.id,
          slug: concept.slug,
          title: concept.title,
          description: concept.description,
          unit: {
            id: unit.id,
            title: unit.title,
          },
          course: {
            id: course.id,
            title: course.title,
          },
          status: derivedStatus?.status ?? "LOCKED",
          pMastery,
          nextReviewAt: toIsoString(derivedStatus?.nextReviewAt),
          lastAssessedAt: toIsoString(mastery?.lastAssessedAt),
          unlockedAt: toIsoString(mastery?.unlockedAt),
          prerequisiteTitles,
          prerequisitesMet: (derivedStatus?.unmetPrerequisites.length ?? 0) === 0,
          ...conceptAnalytics,
        })
      }
    }
  }

  const conceptsByStatus = {
    fringe: [] as StudentConceptCard[],
    inProgress: [] as StudentConceptCard[],
    mastered: [] as StudentConceptCard[],
    reviewNeeded: [] as StudentConceptCard[],
    locked: [] as StudentConceptCard[],
  }

  for (const card of cards) {
    conceptsByStatus[statusBucket(card.status)].push(card)
  }

  const conceptsMastered = conceptsByStatus.mastered.length + conceptsByStatus.reviewNeeded.length
  const conceptsStarted = cards.filter(
    (card) => card.totalAttempts > 0 || card.status === "IN_PROGRESS" || card.status === "MASTERED"
  ).length
  const derivedProgress = cards.length > 0 ? (conceptsMastered / cards.length) * 100 : 0
  const timeSpentConcepts = cards.filter((card) => card.averageTimePerQuestion > 0)
  const averageTimePerConcept =
    timeSpentConcepts.length > 0
      ? average(timeSpentConcepts.map((card) => card.averageTimePerQuestion))
      : 0

  return {
    studentId: userId,
    profile: {
      totalXP: profile?.totalXP ?? 0,
      currentLevel: profile?.currentLevel ?? 1,
      dailyStreak: profile?.dailyStreak ?? 0,
      overallProgress: Number(((profile?.overallProgress || derivedProgress) ?? 0).toFixed(1)),
    },
    conceptsByStatus,
    analyticsSnapshot: {
      conceptsMastered,
      conceptsStarted,
      currentStreak: profile?.dailyStreak ?? 0,
      averageTimePerConcept,
      mostDifficultConcepts: [...cards]
        .filter((card) => card.status !== "LOCKED")
        .sort((left, right) => {
          const accuracyDelta = left.practiceAccuracy - right.practiceAccuracy
          if (accuracyDelta !== 0) return accuracyDelta
          return left.pMastery - right.pMastery
        })
        .slice(0, 3),
    },
  }
}

export async function getStudentConceptDetail(
  userId: string,
  conceptId: string
): Promise<StudentConceptDetail | null> {
  const concept = await prisma.concept.findFirst({
    where: {
      OR: [
        {
          id: conceptId,
        },
        {
          slug: conceptId,
        },
      ],
      status: "PUBLISHED",
      unit: {
        status: "PUBLISHED",
        course: {
          archivedAt: null,
          status: "PUBLISHED",
        },
      },
    },
    include: {
      unit: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      chunks: {
        where: {
          status: "PUBLISHED",
        },
        orderBy: {
          order: "asc",
        },
      },
      workedExamples: {
        where: {
          status: "PUBLISHED",
        },
        orderBy: {
          order: "asc",
        },
      },
      prerequisiteEdges: {
        include: {
          prerequisiteConcept: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      questions: {
        where: {
          status: "PUBLISHED",
        },
        select: {
          id: true,
          usage: true,
        },
      },
      userMasteries: {
        where: {
          userId,
        },
        take: 1,
      },
    },
  })

  if (!concept) {
    return null
  }

  const [courseState, analyticsByConcept, recentActivity] = await Promise.all([
    loadCourseUserState(concept.unit.course.id, userId),
    getConceptAnalytics(userId, [concept.id]),
    prisma.interactionLog.findMany({
      where: {
        userId,
        conceptId: concept.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        activityType: true,
        isCorrect: true,
        createdAt: true,
      },
    }),
  ])

  const prerequisiteIds = concept.prerequisiteEdges.map((edge) => edge.prerequisiteConceptId)
  const prerequisiteMasteries = prerequisiteIds.length
    ? await prisma.userMastery.findMany({
        where: {
          userId,
          conceptId: {
            in: prerequisiteIds,
          },
        },
        select: {
          conceptId: true,
          pMastery: true,
          status: true,
        },
      })
    : []
  const prerequisiteMasteryMap = new Map(
    prerequisiteMasteries.map((mastery) => [mastery.conceptId, mastery] as const)
  )
  const derivedStatus = courseState.statuses.get(concept.id)
  const mastery = concept.userMasteries[0] ?? null
  const pMastery = roundProbability(
    derivedStatus?.masteryProbability ?? (derivedStatus?.unlocked ? concept.pLo : 0)
  )
  const savedBlocks = normalizeContentBlocks(concept.contentBlocks)
  const legacyBlocks = buildLegacyContentBlocks({
    contentBody: concept.contentBody,
    chunks: concept.chunks,
    workedExamples: concept.workedExamples,
  })
  const contentBlocks = savedBlocks.length ? savedBlocks : legacyBlocks
  const contentBlockReferences = getContentBlockReferences(contentBlocks)
  const [assets, referencedQuestions, snippets] = await Promise.all([
    contentBlockReferences.assetIds.length
      ? prisma.mediaAsset.findMany({
          where: {
            id: {
              in: contentBlockReferences.assetIds,
            },
            status: "PUBLISHED",
          },
        })
      : [],
    contentBlockReferences.questionIds.length
      ? prisma.question.findMany({
          where: {
            id: {
              in: contentBlockReferences.questionIds,
            },
            status: "PUBLISHED",
          },
          select: {
            id: true,
            content: true,
          },
        })
      : [],
    contentBlockReferences.snippetIds.length
      ? prisma.contentSnippet.findMany({
          where: {
            id: {
              in: contentBlockReferences.snippetIds,
            },
            status: "PUBLISHED",
          },
          select: {
            id: true,
            title: true,
            contentBlocks: true,
          },
        })
      : [],
  ])
  const analytics = getAnalyticsSummary(analyticsByConcept.get(concept.id) ?? emptyAnalytics())
  const status = derivedStatus?.status ?? "LOCKED"
  const recommendation = getRecommendedAction({
    status,
    pMastery,
    nextReviewAt: derivedStatus?.nextReviewAt,
    locked: !derivedStatus?.unlocked,
  })
  const questionCounts = concept.questions.reduce(
    (counts, question) => {
      counts[question.usage] += 1
      return counts
    },
    {
      PRACTICE: 0,
      CHECKPOINT: 0,
      EXAM: 0,
    } satisfies Record<QuestionUsage, number>
  )

  return {
    conceptId: concept.id,
    slug: concept.slug,
    title: concept.title,
    description: concept.description,
    unit: {
      id: concept.unit.id,
      title: concept.unit.title,
    },
    course: {
      id: concept.unit.course.id,
      title: concept.unit.course.title,
    },
    contentBody: concept.contentBody,
    contentBlocks,
    contentBlockAssets: Object.fromEntries(
      assets.map((asset) => [
        asset.id,
        {
          id: asset.id,
          kind: asset.kind,
          title: asset.title,
          alt: asset.alt,
          caption: asset.caption,
          url: asset.url,
          width: asset.width,
          height: asset.height,
          videoId: asset.videoId,
        },
      ])
    ),
    contentBlockQuestions: Object.fromEntries(
      referencedQuestions.map((question) => [
        question.id,
        {
          id: question.id,
          content: question.content,
        },
      ])
    ),
    contentBlockSnippets: Object.fromEntries(
      snippets.map((snippet) => [
        snippet.id,
        {
          id: snippet.id,
          title: snippet.title,
          contentBlocks: normalizeContentBlocks(snippet.contentBlocks),
        },
      ])
    ),
    chunks: concept.chunks.map((chunk) => ({
      id: chunk.id,
      title: chunk.title,
      bodyMd: chunk.bodyMd,
      order: chunk.order,
    })),
    workedExamples: concept.workedExamples.map((example) => ({
      id: example.id,
      title: example.title,
      problemMd: example.problemMd,
      solutionMd: example.solutionMd,
      order: example.order,
    })),
    status,
    pMastery,
    unlockThreshold: concept.unlockThreshold,
    lastAssessedAt: toIsoString(mastery?.lastAssessedAt),
    nextReviewAt: toIsoString(derivedStatus?.nextReviewAt),
    prerequisiteConcepts: concept.prerequisiteEdges.map((edge) => {
      const prerequisiteMastery = prerequisiteMasteryMap.get(edge.prerequisiteConceptId)

      return {
        id: edge.prerequisiteConceptId,
        title: edge.prerequisiteConcept.title,
        pMastery: roundProbability(prerequisiteMastery?.pMastery),
        status: prerequisiteMastery?.status ?? "LOCKED",
      }
    }),
    unmetPrerequisites: derivedStatus?.unmetPrerequisites ?? [],
    recommendation,
    practiceQuestionCount: questionCounts.PRACTICE,
    checkpointQuestionId:
      concept.questions.find((question) => question.usage === "CHECKPOINT")?.id ?? null,
    examAvailable:
      Boolean(derivedStatus?.unlocked) &&
      questionCounts.EXAM > 0 &&
      (status === "MASTERED" || status === "REVIEW_NEEDED" || questionCounts.CHECKPOINT > 0),
    analyticsSnapshot: {
      ...analytics,
      recentActivityFeed: recentActivity.map((activity) => ({
        activityType: activity.activityType,
        isCorrect: activity.isCorrect,
        timestamp: activity.createdAt.toISOString(),
      })),
    },
  }
}

export async function getStudentReviewQueue(userId: string): Promise<StudentReviewItem[]> {
  const masteries = await prisma.userMastery.findMany({
    where: {
      userId,
      unlockedAt: {
        not: null,
      },
      OR: [
        {
          status: "REVIEW_NEEDED",
        },
        {
          nextReviewAt: {
            not: null,
            lte: new Date(),
          },
        },
      ],
      concept: {
        status: "PUBLISHED",
        unit: {
          status: "PUBLISHED",
          course: {
            archivedAt: null,
            status: "PUBLISHED",
          },
        },
      },
    },
    orderBy: {
      nextReviewAt: "asc",
    },
    include: {
      concept: {
        include: {
          unit: {
            include: {
              course: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return masteries.map((mastery) => {
    const effectiveMastery = computeEffectiveMastery({
      baselineMastery: mastery.pMastery,
      lastAssessedAt: mastery.lastAssessedAt,
      decayLambda: mastery.concept.decayLambda,
    })
    const daysSinceMastery = mastery.lastAssessedAt
      ? Math.floor((Date.now() - mastery.lastAssessedAt.getTime()) / MS_PER_DAY)
      : 0

    return {
      conceptId: mastery.conceptId,
      title: mastery.concept.title,
      courseTitle: mastery.concept.unit.course.title,
      unitTitle: mastery.concept.unit.title,
      lastAssessedAt: toIsoString(mastery.lastAssessedAt),
      nextReviewAt: toIsoString(mastery.nextReviewAt),
      daysSinceMastery,
      baselineMastery: roundProbability(mastery.pMastery),
      effectiveMastery: roundProbability(effectiveMastery),
      status: effectiveMastery < mastery.concept.unlockThreshold ? "REVIEW_NEEDED" : "MASTERED",
    }
  })
}

function serializeStudentQuestion(
  conceptId: string,
  usage: QuestionUsage,
  attempt: ReturnType<typeof serializeAttempt>
): StudentQuestion {
  return {
    attemptId: attempt.id,
    questionId: attempt.question.id,
    conceptId,
    content: attempt.question.content,
    usage,
    difficulty: attempt.question.difficulty,
    options: attempt.question.choices.map((choice) => ({
      id: choice,
      text: choice,
    })),
    hintText: attempt.question.hintText,
    explanation: attempt.question.explanation,
    selectedAnswer: attempt.selectedAnswer,
    isCorrect: attempt.isCorrect,
    completedAt: toIsoString(attempt.completedAt),
  }
}

export async function getPracticeQuestionForConcept(userId: string, conceptId: string) {
  const attempt = await startPracticeAttempt(userId, conceptId)
  return serializeStudentQuestion(conceptId, QuestionUsage.PRACTICE, serializeAttempt(attempt))
}

export async function getCheckpointQuestionForConcept(userId: string, conceptId: string) {
  const attempt = await startCheckpointAttempt(userId, conceptId)
  return serializeStudentQuestion(conceptId, QuestionUsage.CHECKPOINT, serializeAttempt(attempt))
}

export async function getStudentExamSession(
  userId: string,
  conceptId: string,
  pathway: PathwayType
): Promise<StudentExamSession> {
  const attempt = await startExamAttempt(userId, conceptId, pathway)
  const serializedAttempt = await serializeExamAttempt(attempt)

  return {
    attemptId: serializedAttempt.id,
    sessionId: serializedAttempt.id,
    conceptId,
    pathway: serializedAttempt.pathway,
    questionCount: serializedAttempt.questionCount,
    timeLimitSec: null,
    canUseHints: false,
    startedAt: serializedAttempt.createdAt.toISOString(),
    questions: serializedAttempt.questions.map((question) => ({
      questionId: question.id,
      content: question.content,
      usage: "EXAM",
      difficulty: question.difficulty,
      options: question.choices.map((choice) => ({
        id: choice,
        text: choice,
      })),
    })),
  }
}
