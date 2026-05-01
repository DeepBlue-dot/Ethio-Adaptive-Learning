import { DifficultyTier, QuestionUsage } from "@prisma/client"

import { clampProbability } from "@/lib/adaptive/bkt"

export type Recommendation = "LEARN_RECOMMENDED" | "CHALLENGE_RECOMMENDED"

const EASY_FIRST_ORDER: Record<DifficultyTier, DifficultyTier[]> = {
  EASY: ["EASY", "MEDIUM", "HARD"],
  MEDIUM: ["MEDIUM", "EASY", "HARD"],
  HARD: ["HARD", "MEDIUM", "EASY"],
}

const CHALLENGE_ORDER: Record<DifficultyTier, DifficultyTier[]> = {
  EASY: ["EASY", "MEDIUM", "HARD"],
  MEDIUM: ["MEDIUM", "HARD", "EASY"],
  HARD: ["HARD", "MEDIUM", "EASY"],
}

export function getDifficultyTierForMastery(effectiveMastery: number) {
  const mastery = clampProbability(effectiveMastery)

  if (mastery < 0.5) {
    return DifficultyTier.EASY
  }

  if (mastery < 0.8) {
    return DifficultyTier.MEDIUM
  }

  return DifficultyTier.HARD
}

export function getConceptRecommendation(effectiveMastery: number): Recommendation {
  return clampProbability(effectiveMastery) >= 0.8 ? "CHALLENGE_RECOMMENDED" : "LEARN_RECOMMENDED"
}

export function getDifficultyPreferenceOrder({
  usage,
  targetDifficulty,
}: {
  usage: QuestionUsage
  targetDifficulty: DifficultyTier
}) {
  return usage === QuestionUsage.EXAM
    ? CHALLENGE_ORDER[targetDifficulty]
    : EASY_FIRST_ORDER[targetDifficulty]
}

export function pickDeterministicQuestions<TQuestion extends { id: string; difficulty: DifficultyTier }>(
  questions: TQuestion[],
  usageCounts: ReadonlyMap<string, number>,
  preferenceOrder: DifficultyTier[],
  limit = 1
) {
  const rankByTier = new Map(preferenceOrder.map((tier, index) => [tier, index]))

  return [...questions]
    .sort((left, right) => {
      const tierSort =
        (rankByTier.get(left.difficulty) ?? Number.MAX_SAFE_INTEGER) -
        (rankByTier.get(right.difficulty) ?? Number.MAX_SAFE_INTEGER)

      if (tierSort !== 0) {
        return tierSort
      }

      const usageSort = (usageCounts.get(left.id) ?? 0) - (usageCounts.get(right.id) ?? 0)

      if (usageSort !== 0) {
        return usageSort
      }

      return left.id.localeCompare(right.id)
    })
    .slice(0, limit)
}
