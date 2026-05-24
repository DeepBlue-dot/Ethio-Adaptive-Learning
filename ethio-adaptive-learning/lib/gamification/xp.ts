import { prisma } from "@/lib/prisma"
import type { GamificationActivity, GamificationResult } from "./types"

const XP_MAP: Record<GamificationActivity, number> = {
  PRACTICE_COMPLETE: 5,
  CHECKPOINT_PASS: 15,
  EXAM_PASS: 50,
  DAILY_STREAK: 10,
  CONTENT_READ: 2,
  SOCRATIC_HINT_USED: 1,
}

export function computeLevelFromXp(totalXp: number) {
  // Simple level thresholds: every 100 XP = 1 level
  return Math.max(1, Math.floor(totalXp / 100) + 1)
}

export async function awardXpForActivity(
  userId: string,
  activity: GamificationActivity
): Promise<GamificationResult> {
  const xp = XP_MAP[activity] ?? 0

  const updated = await prisma.userProfile.upsert({
    where: { userId },
    update: {
      totalXP: { increment: xp },
      lastLogin: new Date(),
    },
    create: {
      userId,
      totalXP: xp,
      currentLevel: 1,
      lastLogin: new Date(),
    },
  })

  const newLevel = computeLevelFromXp(updated.totalXP)
  if (newLevel > (updated.currentLevel ?? 1)) {
    await prisma.userProfile.update({
      where: { userId },
      data: { currentLevel: newLevel },
    })
    // Log level-up
    await prisma.activityLog.create({
      data: {
        userId,
        action: "LEVEL_UP",
        contentType: "GAMIFICATION",
        entityId: String(newLevel),
        entityTitle: `Level ${newLevel}`,
        details: { previousLevel: updated.currentLevel ?? 1 },
      },
    })
  }

  return { xpAwarded: xp, totalXP: updated.totalXP, level: newLevel }
}
