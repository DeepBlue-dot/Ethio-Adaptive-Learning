import {
  PathwayType,
  Prisma,
  QuestionUsage,
  type CheckpointAttempt,
  type DifficultyTier,
  type ExamAttempt,
  type PracticeAttempt,
} from "@prisma/client"

import { applyObservation, getConceptBktParams } from "@/lib/adaptive/bkt"
import {
  getConceptRecommendation as deriveRecommendation,
  getDifficultyPreferenceOrder,
  getDifficultyTierForMastery,
  pickDeterministicQuestions,
  type Recommendation,
} from "@/lib/adaptive/difficulty"
import {
  computeEffectiveMastery,
  computeNextReviewAt,
  deriveMasteryStatus,
  isReviewDue,
} from "@/lib/adaptive/retention"
import { loadCourseUserState } from "@/lib/curriculum-graph"
import { prisma } from "@/lib/prisma"

type DbClient = Prisma.TransactionClient | typeof prisma

const EXAM_QUESTION_LIMIT = 3
const EXAM_PASS_THRESHOLD = 0.67

const userMasterySelect = {
  userId: true,
  conceptId: true,
  pMastery: true,
  lastAssessedAt: true,
  nextReviewAt: true,
  unlockedAt: true,
  status: true,
  consecutiveFails: true,
} satisfies Prisma.UserMasterySelect

const questionSelect = {
  id: true,
  content: true,
  correctAnswer: true,
  distractors: true,
  hintText: true,
  explanation: true,
  difficulty: true,
  usage: true,
} satisfies Prisma.QuestionSelect

type AttemptQuestionRecord = Prisma.QuestionGetPayload<{
  select: typeof questionSelect
}>

type WorkspaceAttemptQuestion = {
  id: string
  content: string
  difficulty: DifficultyTier
  hintText: string | null
  explanation: string | null
  choices: string[]
  submittedAnswer?: string | null
  isCorrect?: boolean | null
}

type AttemptSummary = {
  id: string
  createdAt: Date
  completedAt: Date | null
  isCorrect: boolean | null
  selectedAnswer: string | null
  question: WorkspaceAttemptQuestion
}

type ExamAttemptSummary = {
  id: string
  createdAt: Date
  completedAt: Date | null
  pathway: PathwayType
  questionCount: number
  correctCount: number | null
  score: number | null
  isPassed: boolean | null
  questions: WorkspaceAttemptQuestion[]
}

export type LearningWorkspace = {
  concept: {
    id: string
    slug: string
    title: string
    description: string | null
    contentBody: string | null
    unlockThreshold: number
    courseTitle: string
    unitTitle: string
    questionCounts: Record<QuestionUsage, number>
    chunks: Array<{
      id: string
      slug: string
      title: string
      bodyMd: string
      order: number
    }>
    workedExamples: Array<{
      id: string
      slug: string
      title: string
      problemMd: string
      solutionMd: string
      order: number
    }>
  }
  mastery: {
    baselineMastery: number | null
    effectiveMastery: number | null
    status: "LOCKED" | "FRINGE" | "IN_PROGRESS" | "MASTERED" | "REVIEW_NEEDED"
    unlocked: boolean
    nextReviewAt: Date | null
    dueForReview: boolean
  }
  recommendation: Recommendation
  unmetPrerequisites: Array<{
    conceptId: string
    title: string
    currentMastery: number
  }>
  latestPracticeAttempt: AttemptSummary | null
  latestCheckpointAttempt: AttemptSummary | null
  latestExamAttempt: ExamAttemptSummary | null
  canTakeLearnExam: boolean
  canTakeChallengeExam: boolean
}

export type ReviewQueueItem = {
  conceptId: string
  title: string
  courseTitle: string
  unitTitle: string
  baselineMastery: number
  effectiveMastery: number
  nextReviewAt: Date
  status: "MASTERED" | "REVIEW_NEEDED"
}

export type StudentDashboardSummary = {
  dueReviewCount: number
  unlockedConceptCount: number
  masteredConceptCount: number
  inProgressConceptCount: number
}

export async function getConceptLearningWorkspace(userId: string, conceptId: string): Promise<LearningWorkspace> {
  const concept = await prisma.concept.findUnique({
    where: {
      id: conceptId,
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
      chunks: {
        orderBy: {
          order: "asc",
        },
      },
      workedExamples: {
        orderBy: {
          order: "asc",
        },
      },
      questions: {
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
  const latestPracticeAttempt = concept.practiceAttempts[0] ? serializeAttempt(concept.practiceAttempts[0]) : null
  const latestExamAttempt = concept.examAttempts[0]
    ? await serializeExamAttempt(concept.examAttempts[0])
    : null

  return {
    concept: {
      id: concept.id,
      slug: concept.slug,
      title: concept.title,
      description: concept.description,
      contentBody: concept.contentBody,
      unlockThreshold: concept.unlockThreshold,
      courseTitle: concept.unit.course.title,
      unitTitle: concept.unit.title,
      chunks: concept.chunks.map((chunk) => ({
        id: chunk.id,
        slug: chunk.slug,
        title: chunk.title,
        bodyMd: chunk.bodyMd,
        order: chunk.order,
      })),
      workedExamples: concept.workedExamples.map((example) => ({
        id: example.id,
        slug: example.slug,
        title: example.title,
        problemMd: example.problemMd,
        solutionMd: example.solutionMd,
        order: example.order,
      })),
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
      baselineMastery: baselineMastery,
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

export async function startPracticeAttempt(userId: string, conceptId: string) {
  return prisma.$transaction(async (tx) => {
    const concept = await getUnlockedConceptOrThrow(tx, userId, conceptId)
    const openAttempt = await tx.practiceAttempt.findFirst({
      where: {
        userId,
        conceptId,
        completedAt: null,
      },
      include: {
        question: {
          select: questionSelect,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (openAttempt) {
      await ensureStartedMastery(tx, userId, concept)
      return openAttempt
    }

    const [question] = await selectQuestionsForAttempt(tx, {
      userId,
      concept,
      usage: QuestionUsage.PRACTICE,
      limit: 1,
    })

    if (!question) {
      throw new Error("No practice questions are available for this concept yet.")
    }

    await ensureStartedMastery(tx, userId, concept)

    return tx.practiceAttempt.create({
      data: {
        userId,
        conceptId,
        questionId: question.id,
      },
      include: {
        question: {
          select: questionSelect,
        },
      },
    })
  })
}

export async function submitPracticeAttempt(userId: string, attemptId: string, answer: string) {
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.practiceAttempt.findUnique({
      where: {
        id: requireId(attemptId, "Practice attempt"),
      },
      include: {
        question: {
          select: questionSelect,
        },
        concept: true,
      },
    })

    if (!attempt || attempt.userId !== userId) {
      throw new Error("Practice attempt not found.")
    }

    if (attempt.completedAt) {
      return attempt
    }

    const selectedAnswer = requireText(answer, "Answer")
    const isCorrect = isAnswerCorrect(attempt.question, selectedAnswer)

    await tx.practiceAttempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        selectedAnswer,
        isCorrect,
        completedAt: new Date(),
      },
    })

    await tx.interactionLog.create({
      data: {
        userId,
        conceptId: attempt.conceptId,
        questionId: attempt.questionId,
        activityType: "PRACTICE_QUESTION",
        isCorrect,
      },
    })

    await ensureStartedMastery(tx, userId, attempt.concept)

    return {
      conceptId: attempt.conceptId,
      isCorrect,
    }
  })
}

export async function startCheckpointAttempt(userId: string, conceptId: string) {
  return prisma.$transaction(async (tx) => {
    const concept = await getUnlockedConceptOrThrow(tx, userId, conceptId)
    const openAttempt = await tx.checkpointAttempt.findFirst({
      where: {
        userId,
        conceptId,
        completedAt: null,
      },
      include: {
        question: {
          select: questionSelect,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (openAttempt) {
      await ensureStartedMastery(tx, userId, concept)
      return openAttempt
    }

    const [question] = await selectQuestionsForAttempt(tx, {
      userId,
      concept,
      usage: QuestionUsage.CHECKPOINT,
      limit: 1,
    })

    if (!question) {
      throw new Error("No checkpoint questions are available for this concept yet.")
    }

    await ensureStartedMastery(tx, userId, concept)

    return tx.checkpointAttempt.create({
      data: {
        userId,
        conceptId,
        questionId: question.id,
      },
      include: {
        question: {
          select: questionSelect,
        },
      },
    })
  })
}

export async function submitCheckpointAttempt(userId: string, attemptId: string, answer: string) {
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.checkpointAttempt.findUnique({
      where: {
        id: requireId(attemptId, "Checkpoint attempt"),
      },
      include: {
        question: {
          select: questionSelect,
        },
        concept: true,
      },
    })

    if (!attempt || attempt.userId !== userId) {
      throw new Error("Checkpoint attempt not found.")
    }

    if (attempt.completedAt) {
      return {
        conceptId: attempt.conceptId,
        isCorrect: attempt.isCorrect ?? false,
      }
    }

    const selectedAnswer = requireText(answer, "Answer")
    const isCorrect = isAnswerCorrect(attempt.question, selectedAnswer)

    await tx.checkpointAttempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        selectedAnswer,
        isCorrect,
        completedAt: new Date(),
      },
    })

    await tx.interactionLog.create({
      data: {
        userId,
        conceptId: attempt.conceptId,
        questionId: attempt.questionId,
        activityType: "CHECKPOINT_QUESTION",
        isCorrect,
      },
    })

    await ensureStartedMastery(tx, userId, attempt.concept)

    return {
      conceptId: attempt.conceptId,
      isCorrect,
    }
  })
}

export async function startExamAttempt(userId: string, conceptId: string, pathway: PathwayType) {
  return prisma.$transaction(async (tx) => {
    const concept = await getUnlockedConceptOrThrow(tx, userId, conceptId)
    const access = await getConceptAccessState(tx, userId, conceptId)

    if (pathway === PathwayType.LEARN) {
      const latestCheckpoint = await tx.checkpointAttempt.findFirst({
        where: {
          userId,
          conceptId,
          completedAt: {
            not: null,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      const canTakeLearnExam =
        latestCheckpoint?.isCorrect === true ||
        access.derivedStatus.status === "MASTERED" ||
        access.derivedStatus.status === "REVIEW_NEEDED"

      if (!canTakeLearnExam) {
        throw new Error("Pass the checkpoint before starting the mastery exam.")
      }
    }

    const openAttempt = await tx.examAttempt.findFirst({
      where: {
        userId,
        conceptId,
        completedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (openAttempt) {
      await ensureStartedMastery(tx, userId, concept)
      return openAttempt
    }

    const questions = await selectQuestionsForAttempt(tx, {
      userId,
      concept,
      usage: QuestionUsage.EXAM,
      limit: EXAM_QUESTION_LIMIT,
    })

    if (!questions.length) {
      throw new Error("No exam questions are available for this concept yet.")
    }

    await ensureStartedMastery(tx, userId, concept)

    return tx.examAttempt.create({
      data: {
        userId,
        conceptId,
        pathway,
        questionIds: questions.map((question) => question.id),
        questionCount: questions.length,
      },
    })
  })
}

export async function submitExamAttempt(
  userId: string,
  attemptId: string,
  answers: Record<string, string>
) {
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.examAttempt.findUnique({
      where: {
        id: requireId(attemptId, "Exam attempt"),
      },
      include: {
        concept: true,
      },
    })

    if (!attempt || attempt.userId !== userId) {
      throw new Error("Exam attempt not found.")
    }

    if (attempt.completedAt) {
      return {
        conceptId: attempt.conceptId,
        isPassed: attempt.isPassed ?? false,
      }
    }

    const questionIds = parseStringArray(attempt.questionIds)

    if (!questionIds.length) {
      throw new Error("This exam attempt does not have any questions assigned.")
    }

    const questions = await tx.question.findMany({
      where: {
        id: {
          in: questionIds,
        },
      },
      select: questionSelect,
    })

    const questionsById = new Map(questions.map((question) => [question.id, question]))
    const orderedQuestions = questionIds
      .map((questionId) => questionsById.get(questionId))
      .filter((question): question is AttemptQuestionRecord => Boolean(question))

    if (!orderedQuestions.length) {
      throw new Error("The authored exam questions could not be loaded.")
    }

    const normalizedAnswers = Object.fromEntries(
      orderedQuestions.map((question) => [question.id, answers[question.id] ?? ""])
    )
    const correctCount = orderedQuestions.reduce((count, question) => {
      return count + Number(isAnswerCorrect(question, normalizedAnswers[question.id] ?? ""))
    }, 0)
    const questionCount = orderedQuestions.length
    const score = questionCount > 0 ? correctCount / questionCount : 0
    const isPassed = score >= EXAM_PASS_THRESHOLD
    const completedAt = new Date()
    const timeSpentSec = Math.max(1, Math.round((completedAt.getTime() - attempt.createdAt.getTime()) / 1000))

    await tx.examAttempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        submittedAnswers: normalizedAnswers,
        correctCount,
        questionCount,
        score,
        isPassed,
        timeSpentSec,
        completedAt,
      },
    })

    await tx.interactionLog.createMany({
      data: orderedQuestions.map((question) => ({
        userId,
        conceptId: attempt.conceptId,
        questionId: question.id,
        activityType: "EXAM_RESPONSE",
        isCorrect: isAnswerCorrect(question, normalizedAnswers[question.id] ?? ""),
      })),
    })

    const previousMastery = await tx.userMastery.findUnique({
      where: {
        userId_conceptId: {
          userId,
          conceptId: attempt.conceptId,
        },
      },
      select: userMasterySelect,
    })
    const priorMastery = previousMastery?.pMastery ?? attempt.concept.pLo
    const { posteriorNext } = applyObservation({
      prior: priorMastery,
      isCorrect: isPassed,
      params: getConceptBktParams(attempt.concept),
    })

    // A passed mastery exam should move the learner into the mastered band for MVP flow consistency.
    const baselineMastery = isPassed
      ? Math.max(posteriorNext, attempt.concept.unlockThreshold)
      : posteriorNext
    const nextReviewAt =
      baselineMastery >= attempt.concept.unlockThreshold
        ? computeNextReviewAt({
            baselineMastery,
            lastAssessedAt: completedAt,
            decayLambda: attempt.concept.decayLambda,
          })
        : null
    const effectiveMastery = computeEffectiveMastery({
      baselineMastery,
      lastAssessedAt: completedAt,
      decayLambda: attempt.concept.decayLambda,
      at: completedAt,
    })
    const unlockedAt = previousMastery?.unlockedAt ?? completedAt
    const status = deriveMasteryStatus({
      unlocked: true,
      storedStatus: previousMastery?.status ?? "IN_PROGRESS",
      baselineMastery,
      effectiveMastery,
      unlockThreshold: attempt.concept.unlockThreshold,
    })

    await tx.userMastery.upsert({
      where: {
        userId_conceptId: {
          userId,
          conceptId: attempt.conceptId,
        },
      },
      update: {
        pMastery: baselineMastery,
        lastAssessedAt: completedAt,
        nextReviewAt,
        unlockedAt,
        status,
        consecutiveFails: isPassed ? 0 : (previousMastery?.consecutiveFails ?? 0) + 1,
      },
      create: {
        userId,
        conceptId: attempt.conceptId,
        pMastery: baselineMastery,
        lastAssessedAt: completedAt,
        nextReviewAt,
        unlockedAt,
        status,
        consecutiveFails: isPassed ? 0 : 1,
      },
    })

    if (isPassed) {
      await syncUnlockedConceptsForCourse(tx, userId, attempt.concept.unitId)
    }

    return {
      conceptId: attempt.conceptId,
      isPassed,
      unlockedNewConcepts: isPassed,
    }
  })
}

function serializeAttempt(
  attempt:
    | (PracticeAttempt & {
        question: AttemptQuestionRecord
      })
    | (CheckpointAttempt & {
        question: AttemptQuestionRecord
      })
): AttemptSummary {
  return {
    id: attempt.id,
    createdAt: attempt.createdAt,
    completedAt: attempt.completedAt,
    isCorrect: attempt.isCorrect,
    selectedAnswer: attempt.selectedAnswer,
    question: serializeQuestion(attempt.question, {
      submittedAnswer: attempt.selectedAnswer,
      isCorrect: attempt.isCorrect,
    }),
  }
}

async function serializeExamAttempt(attempt: ExamAttempt): Promise<ExamAttemptSummary> {
  const questionIds = parseStringArray(attempt.questionIds)
  const questions = questionIds.length
    ? await prisma.question.findMany({
        where: {
          id: {
            in: questionIds,
          },
        },
        select: questionSelect,
      })
    : []
  const questionsById = new Map(questions.map((question) => [question.id, question]))
  const submittedAnswers = parseStringRecord(attempt.submittedAnswers)

  return {
    id: attempt.id,
    createdAt: attempt.createdAt,
    completedAt: attempt.completedAt,
    pathway: attempt.pathway,
    questionCount: attempt.questionCount,
    correctCount: attempt.correctCount,
    score: attempt.score,
    isPassed: attempt.isPassed,
    questions: questionIds
      .map((questionId) => questionsById.get(questionId))
      .filter((question): question is AttemptQuestionRecord => Boolean(question))
      .map((question) =>
        serializeQuestion(question, {
          submittedAnswer: submittedAnswers[question.id],
          isCorrect:
            attempt.completedAt != null
              ? isAnswerCorrect(question, submittedAnswers[question.id] ?? "")
              : null,
        })
      ),
  }
}

function serializeQuestion(
  question: AttemptQuestionRecord,
  options: {
    submittedAnswer?: string | null
    isCorrect?: boolean | null
  } = {}
): WorkspaceAttemptQuestion {
  return {
    id: question.id,
    content: question.content,
    difficulty: question.difficulty,
    hintText: question.hintText,
    explanation: question.explanation,
    choices: getQuestionChoices(question),
    submittedAnswer: options.submittedAnswer,
    isCorrect: options.isCorrect,
  }
}

async function getUnlockedConceptOrThrow(db: DbClient, userId: string, conceptId: string) {
  const access = await getConceptAccessState(db, userId, conceptId)

  if (!access.derivedStatus.unlocked) {
    throw new Error("This concept is still locked by prerequisite mastery requirements.")
  }

  return access.concept
}

async function getConceptAccessState(db: DbClient, userId: string, conceptId: string) {
  const concept = await db.concept.findUnique({
    where: {
      id: requireId(conceptId, "Concept"),
    },
    include: {
      unit: {
        select: {
          courseId: true,
        },
      },
      userMasteries: {
        where: {
          userId,
        },
        select: userMasterySelect,
        take: 1,
      },
    },
  })

  if (!concept) {
    throw new Error("Concept not found.")
  }

  const courseState = await loadCourseUserState(concept.unit.courseId, userId, db)
  const derivedStatus = courseState.statuses.get(concept.id)

  if (!derivedStatus) {
    throw new Error("Concept state could not be derived.")
  }

  return {
    concept,
    conceptMastery: concept.userMasteries[0] ?? null,
    derivedStatus,
  }
}

async function ensureStartedMastery(
  db: DbClient,
  userId: string,
  concept: {
    id: string
    pLo: number
    unlockThreshold: number
    decayLambda: number
  }
) {
  const existingMastery = await db.userMastery.findUnique({
    where: {
      userId_conceptId: {
        userId,
        conceptId: concept.id,
      },
    },
    select: userMasterySelect,
  })

  if (existingMastery) {
    if (existingMastery.status === "FRINGE" || existingMastery.status === "LOCKED") {
      await db.userMastery.update({
        where: {
          userId_conceptId: {
            userId,
            conceptId: concept.id,
          },
        },
        data: {
          status: "IN_PROGRESS",
          unlockedAt: existingMastery.unlockedAt ?? new Date(),
        },
      })
    } else if (!existingMastery.unlockedAt) {
      await db.userMastery.update({
        where: {
          userId_conceptId: {
            userId,
            conceptId: concept.id,
          },
        },
        data: {
          unlockedAt: new Date(),
        },
      })
    }

    return
  }

  await db.userMastery.create({
    data: {
      userId,
      conceptId: concept.id,
      pMastery: concept.pLo,
      status: "IN_PROGRESS",
      unlockedAt: new Date(),
    },
  })
}

async function selectQuestionsForAttempt(
  db: DbClient,
  {
    userId,
    concept,
    usage,
    limit,
  }: {
    userId: string
    concept: {
      id: string
      pLo: number
      decayLambda: number
    }
    usage: QuestionUsage
    limit: number
  }
) {
  const [mastery, questions] = await Promise.all([
    db.userMastery.findUnique({
      where: {
        userId_conceptId: {
          userId,
          conceptId: concept.id,
        },
      },
      select: userMasterySelect,
    }),
    db.question.findMany({
      where: {
        conceptId: concept.id,
        usage,
      },
      select: questionSelect,
    }),
  ])

  if (!questions.length) {
    return []
  }

  const effectiveMastery =
    mastery != null
      ? computeEffectiveMastery({
          baselineMastery: mastery.pMastery,
          lastAssessedAt: mastery.lastAssessedAt,
          decayLambda: concept.decayLambda,
        })
      : concept.pLo
  const targetDifficulty = getDifficultyTierForMastery(effectiveMastery)
  const preferenceOrder = getDifficultyPreferenceOrder({
    usage,
    targetDifficulty,
  })
  const logs = await db.interactionLog.findMany({
    where: {
      userId,
      questionId: {
        in: questions.map((question) => question.id),
      },
    },
    select: {
      questionId: true,
    },
  })
  const usageCounts = logs.reduce((counts, log) => {
    if (!log.questionId) {
      return counts
    }

    counts.set(log.questionId, (counts.get(log.questionId) ?? 0) + 1)
    return counts
  }, new Map<string, number>())

  return pickDeterministicQuestions(questions, usageCounts, preferenceOrder, limit)
}

async function syncUnlockedConceptsForCourse(db: DbClient, userId: string, unitId: string) {
  const unit = await db.unit.findUnique({
    where: {
      id: unitId,
    },
    select: {
      courseId: true,
    },
  })

  if (!unit) {
    return
  }

  const courseState = await loadCourseUserState(unit.courseId, userId, db)
  const masteryByConceptId = new Map(
    courseState.masteries.map((mastery) => [mastery.conceptId, mastery] as const)
  )

  for (const concept of courseState.concepts) {
    const existingMastery = masteryByConceptId.get(concept.id)
    const derivedStatus = courseState.statuses.get(concept.id)

    if (!derivedStatus?.unlocked || existingMastery?.unlockedAt) {
      continue
    }

    const unlockedAt = new Date()

    if (existingMastery) {
      await db.userMastery.update({
        where: {
          userId_conceptId: {
            userId,
            conceptId: concept.id,
          },
        },
        data: {
          unlockedAt,
          status: existingMastery.status === "LOCKED" ? "FRINGE" : existingMastery.status,
        },
      })

      continue
    }

    await db.userMastery.create({
      data: {
        userId,
        conceptId: concept.id,
        pMastery: concept.pLo,
        unlockedAt,
        status: "FRINGE",
      },
    })
  }
}

function getQuestionChoices(question: AttemptQuestionRecord) {
  const distractors = Array.isArray(question.distractors)
    ? question.distractors.filter((choice): choice is string => typeof choice === "string")
    : []

  return [...new Set([question.correctAnswer, ...distractors])].sort((left, right) =>
    left.localeCompare(right)
  )
}

function isAnswerCorrect(question: AttemptQuestionRecord, answer: string) {
  return normalizeAnswer(question.correctAnswer) === normalizeAnswer(answer)
}

function normalizeAnswer(answer: string | null | undefined) {
  return (answer ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
}

function parseStringArray(value: Prisma.JsonValue | null) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function parseStringRecord(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  )
}

function requireId(value: string | null | undefined, fieldLabel: string) {
  const normalized = value?.trim()

  if (!normalized) {
    throw new Error(`${fieldLabel} is required.`)
  }

  return normalized
}

function requireText(value: string | null | undefined, fieldLabel: string) {
  const normalized = value?.trim()

  if (!normalized) {
    throw new Error(`${fieldLabel} is required.`)
  }

  return normalized
}
