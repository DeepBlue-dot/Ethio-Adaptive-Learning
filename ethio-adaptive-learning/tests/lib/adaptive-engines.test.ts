import { DifficultyTier, QuestionUsage } from "@prisma/client"
import { describe, expect, it } from "vitest"

import {
  applyObservation,
  computeEffectiveMastery,
  computeNextReviewAt,
  deriveMasteryStatus,
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

  it("calculates lower effective mastery for higher decay rates (lambda)", () => {
    const lastAssessedAt = new Date("2026-05-01T12:00:00.000Z")
    const now = new Date("2026-05-06T12:00:00.000Z") // 5 days later
    const baseline = 0.98

    const slowDecay = computeEffectiveMastery({
      baselineMastery: baseline,
      lastAssessedAt,
      decayLambda: 0.05,
      at: now,
    })

    const fastDecay = computeEffectiveMastery({
      baselineMastery: baseline,
      lastAssessedAt,
      decayLambda: 0.2,
      at: now,
    })

    // Slow decay (lambda 0.05) over 5 days: 0.98 * e^(-0.25) ≈ 0.763
    // Fast decay (lambda 0.2) over 5 days: 0.98 * e^(-1.0) ≈ 0.360
    expect(slowDecay).toBeCloseTo(0.7632, 3)
    expect(fastDecay).toBeCloseTo(0.3605, 3)
    expect(fastDecay).toBeLessThan(slowDecay)
  })

  it("schedules the exact next review date using the logarithmic formula", () => {
    const lastAssessedAt = new Date("2026-06-01T10:00:00.000Z")
    const baseline = 0.95
    const lambda = 0.1
    const threshold = 0.8

    // days = ln(0.95 / 0.8) / 0.1 ≈ 1.7185 days
    const nextReviewAt = computeNextReviewAt({
      baselineMastery: baseline,
      lastAssessedAt,
      decayLambda: lambda,
      reviewThreshold: threshold,
    })

    const expectedDays = Math.log(0.95 / 0.8) / 0.1
    const expectedMs = expectedDays * 24 * 60 * 60 * 1000
    const expectedDate = new Date(lastAssessedAt.getTime() + expectedMs)

    expect(nextReviewAt?.getTime()).toBeCloseTo(expectedDate.getTime(), -1)
  })

  it("requires immediate review if current mastery is at or below threshold", () => {
    const lastAssessedAt = new Date("2026-06-01T10:00:00.000Z")
    
    // Exactly at threshold
    const atThreshold = computeNextReviewAt({
      baselineMastery: 0.8,
      lastAssessedAt,
      decayLambda: 0.1,
      reviewThreshold: 0.8
    })
    expect(atThreshold?.getTime()).toBe(lastAssessedAt.getTime())

    // Below threshold
    const belowThreshold = computeNextReviewAt({
      baselineMastery: 0.75,
      lastAssessedAt,
      decayLambda: 0.1,
      reviewThreshold: 0.8
    })
    expect(belowThreshold?.getTime()).toBe(lastAssessedAt.getTime())
  })

  it("derives the correct mastery status based on effective vs baseline mastery", () => {
    // 1. Mastered (High baseline, High effective)
    expect(deriveMasteryStatus({
      unlocked: true,
      storedStatus: "IN_PROGRESS",
      baselineMastery: 0.9,
      effectiveMastery: 0.85,
      unlockThreshold: 0.8,
    })).toBe("MASTERED")

    // 2. Review Needed (High baseline, Low effective)
    expect(deriveMasteryStatus({
      unlocked: true,
      storedStatus: "MASTERED",
      baselineMastery: 0.9,
      effectiveMastery: 0.75,
      unlockThreshold: 0.8,
    })).toBe("REVIEW_NEEDED")

    // 3. In Progress (Low baseline)
    expect(deriveMasteryStatus({
      unlocked: true,
      storedStatus: "IN_PROGRESS",
      baselineMastery: 0.7,
      effectiveMastery: 0.7,
      unlockThreshold: 0.8,
    })).toBe("IN_PROGRESS")

    // 4. Locked (Graph dependency)
    expect(deriveMasteryStatus({
      unlocked: false,
      unlockThreshold: 0.8,
      baselineMastery: 0.9,
      effectiveMastery: 0.9
    })).toBe("LOCKED")
  })

  it("gracefully handles invalid parameters and missing data", () => {
    const baseline = 0.9

    // Missing date
    expect(computeEffectiveMastery({
      baselineMastery: baseline,
      decayLambda: 0.1,
      lastAssessedAt: null
    })).toBe(baseline)

    // Negative lambda (should default to no decay)
    expect(computeEffectiveMastery({
      baselineMastery: baseline,
      lastAssessedAt: new Date(),
      decayLambda: -1
    })).toBe(baseline)
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

  it("simulates sequential mastery over multiple correct answers", () => {
    const params = getConceptBktParams({
      pLo: 0.15,
      pT: 0.1,
      pG: 0.2,
      pS: 0.1,
    })

    let mastery = 0.15
    for (let i = 0; i < 5; i++) {
      const result = applyObservation({ prior: mastery, isCorrect: true, params })
      mastery = result.posteriorNext
    }

    // After 5 correct answers, the student should be well on their way to mastery (> 0.9)
    expect(mastery).toBeGreaterThan(0.9)
    expect(mastery).toBeCloseTo(0.9984, 4)
  })

  it("demonstrates recovery from an incorrect answer", () => {
    const params = getConceptBktParams({
      pLo: 0.5,
      pT: 0.1,
      pG: 0.2,
      pS: 0.1,
    })

    // 1. Initial knowledge 0.5
    // 2. Get one wrong
    const afterIncorrect = applyObservation({ prior: 0.5, isCorrect: false, params })
    expect(afterIncorrect.posteriorNext).toBeLessThan(0.5)

    // 3. Get three right
    let mastery = afterIncorrect.posteriorNext
    for (let i = 0; i < 3; i++) {
      mastery = applyObservation({ prior: mastery, isCorrect: true, params }).posteriorNext
    }

    // Student should have recovered and exceeded initial knowledge
    expect(mastery).toBeGreaterThan(0.5)
  })

  it("adjusts learning speed based on guess probability (pG)", () => {
    // Scenario A: Hard to guess (Low pG)
    const paramsA = getConceptBktParams({ pG: 0.1, pLo: 0.3 })
    // Scenario B: Easy to guess (High pG - like 4 options MCQ)
    const paramsB = getConceptBktParams({ pG: 0.25, pLo: 0.3 })

    const resultA = applyObservation({ prior: 0.3, isCorrect: true, params: paramsA })
    const resultB = applyObservation({ prior: 0.3, isCorrect: true, params: paramsB })

    // A correct answer in a hard-to-guess question provides STRONGER evidence of knowledge
    expect(resultA.posteriorNext).toBeGreaterThan(resultB.posteriorNext)
  })

  it("maintains mathematical stability at the probability boundaries (0 and 1)", () => {
    const params = getConceptBktParams()

    // Test from absolute 0
    const fromZero = applyObservation({ prior: 0, isCorrect: true, params })
    expect(fromZero.posteriorNext).toBeGreaterThanOrEqual(0)
    expect(fromZero.posteriorNext).toBeLessThanOrEqual(1)
    expect(Number.isNaN(fromZero.posteriorNext)).toBe(false)

    // Test from absolute 1
    const fromOne = applyObservation({ prior: 1, isCorrect: true, params })
    expect(fromOne.posteriorNext).toBeCloseTo(1, 5)

    // Test incorrect at absolute 1 (should decrease but stay safe)
    const incorrectAtOne = applyObservation({ prior: 1, isCorrect: false, params })
    expect(incorrectAtOne.posteriorNext).toBeGreaterThanOrEqual(0)
    expect(incorrectAtOne.posteriorNext).toBeLessThanOrEqual(1)
  })
})
