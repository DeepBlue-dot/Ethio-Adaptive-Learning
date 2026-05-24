import { prisma } from "@/lib/prisma"
import type { BadgeId } from "./types"

const XP_BADGES = [
  { id: "XP_BRONZE", threshold: 500 },
  { id: "XP_SILVER", threshold: 1500 },
  { id: "XP_GOLD", threshold: 5000 },
]

const STREAK_BADGES = [
  { id: "STREAK_7", threshold: 7 },
  { id: "STREAK_30", threshold: 30 },
]

export async function checkAndAwardXpBadges(userId: string): Promise<BadgeId[]> {
  const profile = await prisma.userProfile.findUnique({ where: { userId } })
  if (!profile) return []

  const awarded: BadgeId[] = []

  for (const badge of XP_BADGES) {
    if (profile.totalXP >= badge.threshold) {
      const existing = await prisma.activityLog.findFirst({
        where: {
          userId,
          action: "BADGE_AWARDED",
          contentType: "GAMIFICATION",
          entityId: badge.id,
        },
      })
      if (!existing) {
        await prisma.activityLog.create({
          data: {
            userId,
            action: "BADGE_AWARDED",
            contentType: "GAMIFICATION",
            entityId: badge.id,
            entityTitle: badge.id,
            details: { threshold: badge.threshold },
          },
        })
        awarded.push(badge.id as BadgeId)
      }
    }
  }

  return awarded
}

export async function checkAndAwardStreakBadges(userId: string, currentStreak: number): Promise<BadgeId[]> {
  const awarded: BadgeId[] = []

  for (const badge of STREAK_BADGES) {
    if (currentStreak >= badge.threshold) {
      const existing = await prisma.activityLog.findFirst({
        where: {
          userId,
          action: "BADGE_AWARDED",
          contentType: "GAMIFICATION",
          entityId: badge.id,
        },
      })
      if (!existing) {
        await prisma.activityLog.create({
          data: {
            userId,
            action: "BADGE_AWARDED",
            contentType: "GAMIFICATION",
            entityId: badge.id,
            entityTitle: badge.id,
            details: { streak: currentStreak },
          },
        })
        awarded.push(badge.id as BadgeId)
      }
    }
  }

  return awarded
}
