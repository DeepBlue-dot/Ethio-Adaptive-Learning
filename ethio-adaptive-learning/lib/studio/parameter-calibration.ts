import { prisma } from "@/lib/prisma"
import { DifficultyTier, StudentGrade } from "@prisma/client"
import { getQuestionAnalytics } from "./content-performance"

export type BktCalibrationSuggestion = {
  conceptId: string
  currentPLo: number
  currentPT: number
  currentPG: number
  currentPS: number
  suggestedPLo: number
  suggestedPT: number
  suggestedPG: number
  suggestedPS: number
  confidence: number
  reason: string
}

export type DifficultyComparison = {
  questionId: string
  assignedTier: DifficultyTier
  computedTier: DifficultyTier
  successRate: number
  recommendation: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export type CalibrationCandidate = BktCalibrationSuggestion & {
  conceptTitle: string
  observationCount: number
}

export async function getCalibrationCandidates(): Promise<CalibrationCandidate[]> {
  const lowMasteryGroups = await prisma.userMastery.groupBy({
    by: ["conceptId"],
    _avg: { pMastery: true },
    where: { pMastery: { lt: 0.7 } },
    orderBy: {
      _avg: {
        pMastery: 'asc'
      }
    },
    take: 12,
  })

  return Promise.all(lowMasteryGroups.map(async (group) => {
    const [suggestion, concept] = await Promise.all([
      suggestBktCalibrationForConcept(group.conceptId),
      prisma.concept.findUnique({ where: { id: group.conceptId }, select: { title: true } })
    ])

    const observationCount = await prisma.practiceAttempt.count({ where: { conceptId: group.conceptId } })

    return {
      ...suggestion,
      conceptTitle: concept?.title ?? "Unknown",
      observationCount
    }
  }))
}

export async function suggestBktCalibrationForConcept(
  conceptId: string
): Promise<BktCalibrationSuggestion> {
  const [concept, attempts] = await Promise.all([
    prisma.concept.findUnique({
      where: { id: conceptId },
      select: { pLo: true, pT: true, pG: true, pS: true }
    }),
    prisma.practiceAttempt.findMany({
      where: { conceptId, isCorrect: { not: null }, completedAt: { not: null } },
      select: { userId: true, isCorrect: true, createdAt: true, completedAt: true },
      orderBy: [{ userId: "asc" }, { createdAt: "asc" }],
    })
  ])

  if (!concept) {
    throw new Error(`Concept not found: ${conceptId}`)
  }

  const byUser = new Map<string, Array<{ isCorrect: boolean }>>()
  for (const attempt of attempts) {
    const list = byUser.get(attempt.userId) ?? []
    list.push({ isCorrect: attempt.isCorrect ?? false })
    byUser.set(attempt.userId, list)
  }

  let firstAttemptCount = 0
  let firstAttemptCorrect = 0
  let learningPairCount = 0
  let slipCount = 0
  let learnerCount = 0

  for (const responses of byUser.values()) {
    if (responses.length === 0) continue
    learnerCount += 1
    if (responses[0].isCorrect) firstAttemptCorrect += 1
    firstAttemptCount += 1

    const foundIncorrectBeforeCorrect = responses.some((item, idx) => item.isCorrect && idx > 0)
    if (foundIncorrectBeforeCorrect) learningPairCount += 1

    const hadCorrectThenIncorrect = responses.some((item, idx) => item.isCorrect && responses.slice(idx + 1).some((later) => !later.isCorrect))
    if (hadCorrectThenIncorrect) slipCount += 1
  }

  const initialSuccess = firstAttemptCount ? firstAttemptCorrect / firstAttemptCount : 0
  const learningSuccess = firstAttemptCount ? learningPairCount / firstAttemptCount : 0
  const slipRate = firstAttemptCount ? slipCount / firstAttemptCount : 0

  const suggestedPLo = clamp(initialSuccess * 0.8, 0.05, 0.85)
  const suggestedPT = clamp(learningSuccess * 1.1 || 0.1, 0.05, 0.5)
  const suggestedPG = clamp(Math.max(0.05, 0.15 - initialSuccess * 0.1), 0.05, 0.35)
  const suggestedPS = clamp(Math.max(0.05, slipRate * 0.8), 0.05, 0.35)

  const reason = [
    `Baseline success on the first attempt is ${(initialSuccess * 100).toFixed(0)}%.`,
    `Observed learning transitions after initial errors on ${Math.round(learningSuccess * 100)}% of learner histories.`,
    `Slip events occurred in ${Math.round(slipRate * 100)}% of learner timelines.`,
  ].join(" ")

  return {
    conceptId,
    currentPLo: concept.pLo,
    currentPT: concept.pT,
    currentPG: concept.pG,
    currentPS: concept.pS,
    suggestedPLo,
    suggestedPT,
    suggestedPG,
    suggestedPS,
    confidence: learnerCount > 10 ? 0.8 : 0.45,
    reason,
  }
}

export async function compareDifficultyToPerformance(
  questionId: string
): Promise<DifficultyComparison> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { difficulty: true },
  })

  if (!question) {
    throw new Error(`Question not found: ${questionId}`)
  }

  const analytics = await getQuestionAnalytics(questionId)
  let computedTier: DifficultyTier

  if (analytics.successRate >= 0.85) {
    computedTier = "EASY"
  } else if (analytics.successRate >= 0.55) {
    computedTier = "MEDIUM"
  } else {
    computedTier = "HARD"
  }

  return {
    questionId,
    assignedTier: question.difficulty,
    computedTier,
    successRate: analytics.successRate,
    recommendation:
      computedTier !== question.difficulty
        ? `Student performance suggests ${computedTier} difficulty. Consider adjusting difficulty or reviewing distractors.`
        : `Assigned difficulty is consistent with learner outcomes.`,
  }
}

export function estimatedReadabilityThreshold(
  gradeLevel: StudentGrade
): number {
  switch (gradeLevel) {
    case "MIDDLE_SCHOOL":
      return 70
    case "GRADE_9":
      return 65
    case "GRADE_10":
      return 60
    case "GRADE_11":
      return 55
    case "GRADE_12":
      return 50
    case "ABOVE":
      return 45
    default:
      return 60
  }
}
