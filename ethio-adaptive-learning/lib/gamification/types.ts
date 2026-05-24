import type { DifficultyTier } from "@prisma/client"

export type GamificationActivity =
  | "PRACTICE_COMPLETE"
  | "CHECKPOINT_PASS"
  | "EXAM_PASS"
  | "DAILY_STREAK"
  | "CONTENT_READ"
  | "SOCRATIC_HINT_USED"

export type BadgeId =
  | "FIRST_ATTEMPT"
  | "STREAK_7"
  | "STREAK_30"
  | "XP_BRONZE"
  | "XP_SILVER"
  | "XP_GOLD"

export type GamificationResult = {
  xpAwarded: number
  totalXP: number
  level: number
}

export type StreakResult = {
  streak: number
  isContinuing: boolean
}
