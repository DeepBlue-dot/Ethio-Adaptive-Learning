import { DifficultyTier, QuestionUsage } from "@prisma/client"
import { describe, expect, it } from "vitest"

import {
  applyObservation,
  computeEffectiveMastery,
  computeNextReviewAt,
  evidenceUpdateCorrect,
  evidenceUpdateIncorrect,
  getConceptBktParams,
  getConceptRecommendation,
  getDifficultyPreferenceOrder,
  getDifficultyTierForMastery,
  pickDeterministicQuestions,
  transitUpdate,
} from "@/lib/adaptive"

describe("Phase 3 adaptive engines", () => {
  it("applies BKT evidence and transit updates for correct answers", () => {
    const params = getConceptBktParams({
      pLo: 0.15,
      pT: 0.1,
      pG: 0.2,
      pS: 0.1,
    })

    const posteriorEvidence = evidenceUpdateCorrect(0.15, params)
    const posteriorNext = transitUpdate(posteriorEvidence, params)
    const combined = applyObservation({
      prior: 0.15,
      isCorrect: true,
      params,
    })

    expect(posteriorEvidence).toBeCloseTo(0.4426, 4)
    expect(posteriorNext).toBeCloseTo(0.4983, 3)
    expect(combined).toEqual({
      posteriorEvidence,
      posteriorNext,
    })
  })

  it("applies the incorrect-answer BKT update without exceeding bounds", () => {
    const params = getConceptBktParams({
      pLo: 0.8,
      pT: 0.15,
      pG: 0.2,
      pS: 0.1,
    })

    const posteriorEvidence = evidenceUpdateIncorrect(0.8, params)
    const posteriorNext = transitUpdate(posteriorEvidence, params)

    expect(posteriorEvidence).toBeGreaterThanOrEqual(0)
    expect(posteriorEvidence).toBeLessThan(0.8)
    expect(posteriorNext).toBeLessThanOrEqual(1)
  })

  it("computes decay-driven effective mastery and next review time", () => {
    const lastAssessedAt = new Date("2026-04-01T00:00:00.000Z")
    const effectiveMastery = computeEffectiveMastery({
      baselineMastery: 0.95,
      lastAssessedAt,
      decayLambda: 0.1,
      at: new Date("2026-04-06T00:00:00.000Z"),
    })
    const nextReviewAt = computeNextReviewAt({
      baselineMastery: 0.95,
      lastAssessedAt,
      decayLambda: 0.1,
    })

    expect(effectiveMastery).toBeCloseTo(0.5762, 4)
    expect(nextReviewAt?.getTime()).toBeGreaterThan(lastAssessedAt.getTime())
  })

  it("maps exact mastery thresholds to the correct tiers and recommendations", () => {
    expect(getDifficultyTierForMastery(0.49)).toBe(DifficultyTier.EASY)
    expect(getDifficultyTierForMastery(0.5)).toBe(DifficultyTier.MEDIUM)
    expect(getDifficultyTierForMastery(0.8)).toBe(DifficultyTier.HARD)
    expect(getConceptRecommendation(0.79)).toBe("LEARN_RECOMMENDED")
    expect(getConceptRecommendation(0.8)).toBe("CHALLENGE_RECOMMENDED")
  })

  it("picks questions deterministically using difficulty fallback and prior usage counts", () => {
    const preferenceOrder = getDifficultyPreferenceOrder({
      usage: QuestionUsage.CHECKPOINT,
      targetDifficulty: DifficultyTier.MEDIUM,
    })
    const selected = pickDeterministicQuestions(
      [
        { id: "question_hard", difficulty: DifficultyTier.HARD },
        { id: "question_easy", difficulty: DifficultyTier.EASY },
        { id: "question_medium_1", difficulty: DifficultyTier.MEDIUM },
        { id: "question_medium_2", difficulty: DifficultyTier.MEDIUM },
      ],
      new Map([
        ["question_medium_1", 3],
        ["question_medium_2", 1],
        ["question_easy", 0],
      ]),
      preferenceOrder,
      2
    )

    expect(selected).toEqual([
      { id: "question_medium_2", difficulty: DifficultyTier.MEDIUM },
      { id: "question_medium_1", difficulty: DifficultyTier.MEDIUM },
    ])
  })
})
