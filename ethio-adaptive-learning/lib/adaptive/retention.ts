import type { MasteryStatus } from "@prisma/client"

import { clampProbability } from "@/lib/adaptive/bkt"

export const REVIEW_THRESHOLD = 0.8
const MS_PER_DAY = 1000 * 60 * 60 * 24

export function getElapsedDays(from: Date | null | undefined, to = new Date()) {
  if (!from) {
    return 0
  }

  return Math.max(0, (to.getTime() - from.getTime()) / MS_PER_DAY)
}

export function computeEffectiveMastery({
  baselineMastery,
  lastAssessedAt,
  decayLambda,
  at = new Date(),
}: {
  baselineMastery: number
  lastAssessedAt?: Date | null
  decayLambda: number
  at?: Date
}) {
  const baseline = clampProbability(baselineMastery)

  if (!lastAssessedAt) {
    return baseline
  }

  if (!Number.isFinite(decayLambda) || decayLambda <= 0) {
    return baseline
  }

  const elapsedDays = getElapsedDays(lastAssessedAt, at)
  return clampProbability(baseline * Math.exp(-decayLambda * elapsedDays))
}

export function computeNextReviewAt({
  baselineMastery,
  lastAssessedAt,
  decayLambda,
  reviewThreshold = REVIEW_THRESHOLD,
}: {
  baselineMastery: number
  lastAssessedAt?: Date | null
  decayLambda: number
  reviewThreshold?: number
}) {
  if (!lastAssessedAt) {
    return null
  }

  const baseline = clampProbability(baselineMastery)
  const threshold = clampProbability(reviewThreshold)

  if (!Number.isFinite(decayLambda) || decayLambda <= 0 || baseline <= threshold) {
    return new Date(lastAssessedAt)
  }

  const elapsedDays = Math.log(baseline / threshold) / decayLambda

  return new Date(lastAssessedAt.getTime() + elapsedDays * MS_PER_DAY)
}

export function deriveMasteryStatus({
  unlocked,
  storedStatus,
  baselineMastery,
  effectiveMastery,
  unlockThreshold,
}: {
  unlocked: boolean
  storedStatus?: MasteryStatus | null
  baselineMastery: number | null
  effectiveMastery: number | null
  unlockThreshold: number
}): MasteryStatus {
  if (!unlocked) {
    return "LOCKED"
  }

  if (storedStatus === "FRINGE" || storedStatus === "LOCKED" || storedStatus == null) {
    return "FRINGE"
  }

  if (baselineMastery == null || effectiveMastery == null) {
    return "IN_PROGRESS"
  }

  if (baselineMastery >= unlockThreshold) {
    return effectiveMastery < REVIEW_THRESHOLD ? "REVIEW_NEEDED" : "MASTERED"
  }

  return "IN_PROGRESS"
}

export function isReviewDue(nextReviewAt?: Date | null, at = new Date()) {
  return Boolean(nextReviewAt && nextReviewAt.getTime() <= at.getTime())
}
