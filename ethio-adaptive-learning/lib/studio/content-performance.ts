import { prisma } from "@/lib/prisma"
import { DifficultyTier } from "@prisma/client"

export type QuestionAnalytics = {
  questionId: string
  successRate: number
  averageTimeMs: number
  discriminationIndex: number
  attemptCount: number
  userCount: number
}

export type ConceptHealth = {
  conceptId: string
  dropOffRate: number
  averageTimeMs: number
  strugglePointCount: number
  percentMastered: number
  activeLearnerCount: number
}

export type ConceptHealthMetrics = ConceptHealth & {
  id: string
  title: string
  struggleCount: number
  activeLearners: number
}

export type DifficultyValidation = {
  questionId: string
  assignedTier: DifficultyTier
  computedTier: DifficultyTier
  successRate: number
  flaggedMismatch: boolean
  recommendation: string
}

const computeDiscriminationIndex = (
  attempts: Array<{ userId: string; isCorrect: boolean | null }>
) => {
  const byUser = new Map<string, { wins: number; attempts: number }>()

  for (const attempt of attempts) {
    if (!attempt.userId || attempt.isCorrect == null) continue
    const current = byUser.get(attempt.userId) ?? { wins: 0, attempts: 0 }
    current.attempts += 1
    if (attempt.isCorrect) current.wins += 1
    byUser.set(attempt.userId, current)
  }

  const scores = Array.from(byUser.values())
    .filter((row) => row.attempts >= 2)
    .map((row) => row.wins / row.attempts)
    .sort((a, b) => a - b)

  if (scores.length < 4) {
    return 0
  }

  const quartile = Math.max(1, Math.floor(scores.length * 0.25))
  const bottom = average(scores.slice(0, quartile))
  const top = average(scores.slice(-quartile))

  return Number((top - bottom).toFixed(3))
}

const average = (values: number[]) => {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export type QuestionPerformance = {
  id: string
  conceptTitle: string
  successRate: number
  avgTimeSec: number
  discriminationIndex: number
}

export async function getQuestionPerformanceMetrics(): Promise<QuestionPerformance[]> {
  const questions = await prisma.question.findMany({
    take: 50,
    include: {
      concept: { select: { title: true } },
      practiceAttempts: { select: { isCorrect: true, createdAt: true, completedAt: true, userId: true } },
      checkpointAttempts: { select: { isCorrect: true, createdAt: true, completedAt: true, userId: true } },
    }
  })

  return questions.map(q => {
    const attempts = [...q.practiceAttempts, ...q.checkpointAttempts]
    const successRate = attempts.length ? attempts.filter(a => a.isCorrect).length / attempts.length : 0
    const durations = attempts.map(a => (a.completedAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)).filter(d => d > 0)
    const avgTimeSec = durations.length ? (durations.reduce((a, b) => a + b, 0) / durations.length) / 1000 : 0
    
    return {
      id: q.id,
      conceptTitle: q.concept.title,
      successRate,
      avgTimeSec,
      discriminationIndex: computeDiscriminationIndex(attempts)
    }
  })
}

export async function getConceptHealthMetrics(): Promise<ConceptHealthMetrics[]> {
  const concepts = await prisma.concept.findMany({
    take: 30,
    include: {
      userMasteries: { select: { status: true } },
    }
  })

  return Promise.all(concepts.map(async c => {
    const health = await getConceptHealth(c.id)
    return {
      ...health,
      id: c.id,
      title: c.title,
      struggleCount: health.strugglePointCount,
      activeLearners: health.activeLearnerCount
    }
  }))
}

export async function getQuestionAnalytics(
  questionId: string
): Promise<QuestionAnalytics> {
  const [practiceAttempts, checkpointAttempts] = await Promise.all([
    prisma.practiceAttempt.findMany({
      where: { questionId, isCorrect: { not: null }, completedAt: { not: null } },
      select: { userId: true, isCorrect: true, createdAt: true, completedAt: true },
    }),
    prisma.checkpointAttempt.findMany({
      where: { questionId, isCorrect: { not: null }, completedAt: { not: null } },
      select: { userId: true, isCorrect: true, createdAt: true, completedAt: true },
    }),
  ])

  const attempts = [...practiceAttempts, ...checkpointAttempts]
  const validAttempts = attempts.filter((attempt) => attempt.isCorrect != null)
  const successRate = validAttempts.length
    ? validAttempts.filter((attempt) => attempt.isCorrect).length / validAttempts.length
    : 0

  const durations = validAttempts
    .filter((attempt): attempt is (typeof attempt & { completedAt: Date; createdAt: Date }) =>
      Boolean(attempt.completedAt && attempt.createdAt)
    )
    .map((attempt) => attempt.completedAt.getTime() - attempt.createdAt.getTime())
    .filter((duration) => duration >= 0)

  const averageTimeMs = durations.length ? Math.round(average(durations)) : 0
  const discriminationIndex = computeDiscriminationIndex(validAttempts)
  const userCount = new Set(validAttempts.map((attempt) => attempt.userId)).size

  return {
    questionId,
    successRate,
    averageTimeMs,
    discriminationIndex,
    attemptCount: validAttempts.length,
    userCount,
  }
}

export async function getConceptHealth(
  conceptId: string
): Promise<ConceptHealth> {
  const [practiceAttempts, checkpointAttempts, masteryRecords] = await Promise.all([
    prisma.practiceAttempt.findMany({
      where: { conceptId, isCorrect: { not: null }, completedAt: { not: null } },
      select: { userId: true, isCorrect: true, createdAt: true, completedAt: true },
    }),
    prisma.checkpointAttempt.findMany({
      where: { conceptId, isCorrect: { not: null }, completedAt: { not: null } },
      select: { userId: true, isCorrect: true, createdAt: true, completedAt: true },
    }),
    prisma.userMastery.findMany({
      where: { conceptId },
      select: { status: true },
    }),
  ])

  const attempts = [...practiceAttempts, ...checkpointAttempts]
  const userAttempts = new Map<string, { hasCorrect: boolean; firstIncorrectOnly: boolean }>()

  for (const attempt of attempts) {
    const state = userAttempts.get(attempt.userId) ?? {
      hasCorrect: false,
      firstIncorrectOnly: true,
    }
    if (attempt.isCorrect) {
      state.hasCorrect = true
      state.firstIncorrectOnly = false
    } else {
      state.firstIncorrectOnly = state.firstIncorrectOnly && true
    }
    userAttempts.set(attempt.userId, state)
  }

  const activeLearnerCount = userAttempts.size
  const completedUsers = Array.from(userAttempts.values()).filter((item) => item.hasCorrect).length
  const dropOffRate = activeLearnerCount
    ? Number(((1 - completedUsers / activeLearnerCount) * 100).toFixed(1))
    : 0

  const durations = attempts
    .filter((attempt): attempt is (typeof attempt & { completedAt: Date; createdAt: Date }) =>
      Boolean(attempt.completedAt && attempt.createdAt)
    )
    .map((attempt) => attempt.completedAt.getTime() - attempt.createdAt.getTime())
    .filter((duration) => duration >= 0)

  const averageTimeMs = durations.length ? Math.round(average(durations)) : 0
  const strugglePointCount = masteryRecords.filter((record) => record.status === "REVIEW_NEEDED").length
  const masteredCount = masteryRecords.filter((record) => record.status === "MASTERED").length
  const percentMastered = masteryRecords.length
    ? Number(((masteredCount / masteryRecords.length) * 100).toFixed(1))
    : 0

  return {
    conceptId,
    dropOffRate,
    averageTimeMs,
    strugglePointCount,
    percentMastered,
    activeLearnerCount,
  }
}

export async function getQuestionDifficultyValidation(
  questionId: string
): Promise<DifficultyValidation> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { difficulty: true },
  })

  if (!question) {
    throw new Error(`Question not found: ${questionId}`)
  }

  const analytics = await getQuestionAnalytics(questionId)
  let computedTier: DifficultyTier

  if (analytics.successRate >= 0.8) {
    computedTier = "EASY"
  } else if (analytics.successRate >= 0.6) {
    computedTier = "MEDIUM"
  } else {
    computedTier = "HARD"
  }

  return {
    questionId,
    assignedTier: question.difficulty,
    computedTier,
    successRate: analytics.successRate,
    flaggedMismatch: computedTier !== question.difficulty,
    recommendation: computedTier !== question.difficulty
      ? `Success rate suggests ${computedTier} instead of ${question.difficulty}. Review the question and adjust difficulty or distractor quality.`
      : `Question difficulty is aligned with the observed success rate.`,
  }
}
