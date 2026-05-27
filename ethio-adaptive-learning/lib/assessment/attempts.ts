import { PathwayType, QuestionUsage } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { applyObservation, getConceptBktParams } from "@/lib/adaptive/bkt"
import { computeEffectiveMastery, computeNextReviewAt, deriveMasteryStatus } from "@/lib/adaptive/retention"
import { getConceptAccessState, getUnlockedConceptOrThrow } from "./access"
import { ensureStartedMastery, syncUnlockedConceptsForCourse } from "./mastery"
import { selectQuestionsForAttempt } from "./selection"
import { EXAM_PASS_THRESHOLD, EXAM_QUESTION_LIMIT, questionSelect, userMasterySelect } from "./constants"
import { isAnswerCorrect, parseStringArray, parseStringRecord, requireId, requireText } from "./utils"
import {
  awardXpForActivity,
  recordDailyActivity,
  checkAndAwardXpBadges,
  checkAndAwardStreakBadges,
} from "@/lib/gamification"
import type { DbClient } from "./types"

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

export async function submitPracticeAttempt(
  userId: string,
  attemptId: string,
  answer: string,
  responseTimeMs?: number
) {
  const result = await prisma.$transaction(async (tx) => {
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
      return {
        conceptId: attempt.conceptId,
        isCorrect: attempt.isCorrect ?? false,
      }
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
        responseTimeMs: sanitizeResponseTime(responseTimeMs),
      },
    })

    await ensureStartedMastery(tx, userId, attempt.concept)

    return {
      conceptId: attempt.conceptId,
      isCorrect,
    }
  })

  // Award XP and record streak for practice completion
  await awardXpForActivity(userId, "PRACTICE_COMPLETE")
  const streak = await recordDailyActivity(userId)
  if (streak.streak >= 7) {
    await checkAndAwardStreakBadges(userId, streak.streak)
  }
  await checkAndAwardXpBadges(userId)

  return result
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

export async function submitCheckpointAttempt(
  userId: string,
  attemptId: string,
  answer: string,
  responseTimeMs?: number
) {
  const result = await prisma.$transaction(async (tx) => {
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
        responseTimeMs: sanitizeResponseTime(responseTimeMs),
      },
    })

    await ensureStartedMastery(tx, userId, attempt.concept)

    return {
      conceptId: attempt.conceptId,
      isCorrect,
    }
  })

  // Award XP and record streak if checkpoint passed
  if (result.isCorrect) {
    await awardXpForActivity(userId, "CHECKPOINT_PASS")
    const streak = await recordDailyActivity(userId)
    if (streak.streak >= 7) {
      await checkAndAwardStreakBadges(userId, streak.streak)
    }
    await checkAndAwardXpBadges(userId)
  }

  return result
}

function sanitizeResponseTime(responseTimeMs: number | undefined) {
  if (!Number.isFinite(responseTimeMs)) {
    return undefined
  }

  return Math.max(0, Math.round(responseTimeMs ?? 0))
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
  const result = await prisma.$transaction(async (tx) => {
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
        unlockedNewConcepts: attempt.isPassed ?? false,
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
        status: "PUBLISHED",
      },
      select: questionSelect,
    })

    const questionsById = new Map(questions.map((question) => [question.id, question]))
    const orderedQuestions = questionIds
      .map((questionId) => questionsById.get(questionId))
      .filter((question): question is import("@prisma/client").Question => Boolean(question))

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

  // Award XP, record streak, and check badges if exam passed
  if (result.isPassed) {
    await awardXpForActivity(userId, "EXAM_PASS")
    const streak = await recordDailyActivity(userId)
    if (streak.streak >= 7) {
      await checkAndAwardStreakBadges(userId, streak.streak)
    }
    await checkAndAwardXpBadges(userId)
  }

  return result
}
