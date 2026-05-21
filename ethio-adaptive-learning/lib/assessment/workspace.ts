import { QuestionUsage } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { getConceptRecommendation as deriveRecommendation } from "@/lib/adaptive/difficulty"
import { computeEffectiveMastery, deriveMasteryStatus, isReviewDue } from "@/lib/adaptive/retention"
import { getContentBlockReferences, normalizeContentBlocks } from "@/lib/cms/content-blocks"
import { loadCourseUserState } from "@/lib/curriculum-graph"

import { questionSelect, userMasterySelect } from "./constants"
import { serializeAttempt, serializeExamAttempt } from "./serialize"
import type { LearningWorkspace, ReviewQueueItem, StudentDashboardSummary } from "./types"

export async function getConceptLearningWorkspace(userId: string, conceptId: string): Promise<LearningWorkspace> {
  const concept = await prisma.concept.findFirst({
    where: {
      id: conceptId,
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
      userMasteries: {
        where: {
          userId,
        },
        select: userMasterySelect,
        take: 1,
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
      practiceAttempts: {
        where: {
          userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          question: {
            select: questionSelect,
          },
        },
      },
      checkpointAttempts: {
        where: {
          userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          question: {
            select: questionSelect,
          },
        },
      },
      examAttempts: {
        where: {
          userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  })

  if (!concept) {
    throw new Error("Concept not found.")
  }

  const courseState = await loadCourseUserState(concept.unit.course.id, userId)
  const conceptMastery = concept.userMasteries[0] ?? null
  const derivedStatus = courseState.statuses.get(concept.id)

  if (!derivedStatus) {
    throw new Error("Concept state could not be derived.")
  }

  const baselineMastery = conceptMastery?.pMastery ?? (derivedStatus.unlocked ? concept.pLo : null)

  const currentEffectiveMastery =
    conceptMastery != null
      ? computeEffectiveMastery({
          baselineMastery: conceptMastery.pMastery,
          lastAssessedAt: conceptMastery.lastAssessedAt,
          decayLambda: concept.decayLambda,
        })
      : derivedStatus.unlocked
      ? concept.pLo
      : null

  const recommendation = deriveRecommendation(currentEffectiveMastery ?? concept.pLo)
  const latestCheckpointAttempt = concept.checkpointAttempts[0]
    ? serializeAttempt(concept.checkpointAttempts[0])
    : null
  const latestPracticeAttempt = concept.practiceAttempts[0]
    ? serializeAttempt(concept.practiceAttempts[0])
    : null
  const latestExamAttempt = concept.examAttempts[0]
    ? await serializeExamAttempt(concept.examAttempts[0])
    : null
  const contentBlocks = normalizeContentBlocks(concept.contentBlocks)
  const contentBlockReferences = getContentBlockReferences(contentBlocks)
  const [contentBlockAssets, contentBlockQuestions, contentBlockSnippets] = await Promise.all([
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

  return {
    concept: {
      id: concept.id,
      slug: concept.slug,
      title: concept.title,
      description: concept.description,
      contentBlocks,
      unlockThreshold: concept.unlockThreshold,
      courseTitle: concept.unit.course.title,
      unitTitle: concept.unit.title,
      contentBlockAssets: Object.fromEntries(
        contentBlockAssets.map((asset) => [
          asset.id,
          {
            id: asset.id,
            title: asset.title ?? "",
            kind: asset.kind,
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
        contentBlockQuestions.map((question) => [
          question.id,
          {
            id: question.id,
            content: question.content,
          },
        ])
      ),
      contentBlockSnippets: Object.fromEntries(
        contentBlockSnippets.map((snippet) => [
          snippet.id,
          {
            id: snippet.id,
            title: snippet.title,
            contentBlocks: normalizeContentBlocks(snippet.contentBlocks),
          },
        ])
      ),
      questionCounts: concept.questions.reduce(
        (counts, question) => ({
          ...counts,
          [question.usage]: counts[question.usage] + 1,
        }),
        {
          PRACTICE: 0,
          CHECKPOINT: 0,
          EXAM: 0,
        } satisfies Record<QuestionUsage, number>
      ),
    },
    mastery: {
      baselineMastery,
      effectiveMastery: currentEffectiveMastery,
      status: derivedStatus.status,
      unlocked: derivedStatus.unlocked,
      nextReviewAt: conceptMastery?.nextReviewAt ?? null,
      dueForReview: isReviewDue(conceptMastery?.nextReviewAt ?? null),
    },
    recommendation,
    unmetPrerequisites: derivedStatus.unmetPrerequisites,
    latestPracticeAttempt,
    latestCheckpointAttempt,
    latestExamAttempt,
    canTakeLearnExam:
      derivedStatus.unlocked &&
      (latestCheckpointAttempt?.isCorrect === true ||
        derivedStatus.status === "MASTERED" ||
        derivedStatus.status === "REVIEW_NEEDED"),
    canTakeChallengeExam: derivedStatus.unlocked,
  }
}

export async function getConceptRecommendation(userId: string, conceptId: string) {
  const workspace = await getConceptLearningWorkspace(userId, conceptId)
  return workspace.recommendation
}

export async function getReviewQueue(userId: string): Promise<ReviewQueueItem[]> {
  const masteries = await prisma.userMastery.findMany({
    where: {
      userId,
      unlockedAt: {
        not: null,
      },
      nextReviewAt: {
        not: null,
        lte: new Date(),
      },
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

    return {
      conceptId: mastery.conceptId,
      title: mastery.concept.title,
      courseTitle: mastery.concept.unit.course.title,
      unitTitle: mastery.concept.unit.title,
      baselineMastery: mastery.pMastery,
      effectiveMastery,
      nextReviewAt: mastery.nextReviewAt ?? new Date(),
      status: deriveMasteryStatus({
        unlocked: true,
        storedStatus: mastery.status,
        baselineMastery: mastery.pMastery,
        effectiveMastery,
        unlockThreshold: mastery.concept.unlockThreshold,
      }) as "MASTERED" | "REVIEW_NEEDED",
    }
  })
}

export async function getStudentDashboardSummary(userId: string): Promise<StudentDashboardSummary> {
  const courses = await prisma.course.findMany({
    where: {
      archivedAt: null,
      status: "PUBLISHED",
    },
    select: {
      id: true,
    },
  })
  const courseStates = await Promise.all(courses.map((course) => loadCourseUserState(course.id, userId)))

  let unlockedConceptCount = 0
  let masteredConceptCount = 0
  let inProgressConceptCount = 0

  for (const courseState of courseStates) {
    for (const derivedStatus of courseState.statuses.values()) {
      if (derivedStatus.unlocked) {
        unlockedConceptCount += 1
      }

      if (derivedStatus.status === "MASTERED" || derivedStatus.status === "REVIEW_NEEDED") {
        masteredConceptCount += 1
      }

      if (derivedStatus.status === "IN_PROGRESS") {
        inProgressConceptCount += 1
      }
    }
  }

  const dueReviewCount = courseStates
    .flatMap((courseState) => courseState.masteries)
    .filter((mastery) => isReviewDue(mastery.nextReviewAt)).length

  return {
    dueReviewCount,
    unlockedConceptCount,
    masteredConceptCount,
    inProgressConceptCount,
  }
}
