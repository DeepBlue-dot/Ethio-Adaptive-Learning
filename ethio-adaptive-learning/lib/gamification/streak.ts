import { prisma } from "@/lib/prisma"
import type { StreakResult } from "./types"

const MS_PER_DAY = 1000 * 60 * 60 * 24

export async function recordDailyActivity(userId: string, activityDate = new Date()): Promise<StreakResult> {
  const profile = await prisma.userProfile.findUnique({ where: { userId } })

  if (!profile) {
    await prisma.userProfile.create({
      data: { userId, totalXP: 0, currentLevel: 1, dailyStreak: 1, lastLogin: activityDate },
    })
    return { streak: 1, isContinuing: true }
  }

  const lastActivityDate = profile.lastLogin ?? new Date()
  const todayStart = new Date(activityDate)
  todayStart.setHours(0, 0, 0, 0)
  
  const lastActivityStart = new Date(lastActivityDate)
  lastActivityStart.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((todayStart.getTime() - lastActivityStart.getTime()) / MS_PER_DAY)

  if (diffDays === 1) {
    // Continuing streak
    const updated = await prisma.userProfile.update({
      where: { userId },
      data: { dailyStreak: { increment: 1 }, lastLogin: activityDate },
    })
    return { streak: updated.dailyStreak, isContinuing: true }
  }

  if (diffDays === 0) {
    // Already recorded today
    return { streak: profile.dailyStreak, isContinuing: true }
  }

  // Gap or first day -> reset streak
  const updated = await prisma.userProfile.update({
    where: { userId },
    data: { dailyStreak: 1, lastLogin: activityDate },
  })
  return { streak: updated.dailyStreak, isContinuing: false }
}
