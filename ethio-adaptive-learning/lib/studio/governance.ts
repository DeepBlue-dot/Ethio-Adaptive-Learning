import { prisma } from "@/lib/prisma"
import { subDays } from "date-fns"

export type GovernanceStats = {
  activeWriters: number
  pendingReviews: number
  totalActivity24h: number
  securityAlerts: number
}

export async function getGovernanceSummary(): Promise<GovernanceStats> {
  const oneDayAgo = subDays(new Date(), 1)
  
  const [activeWriters, pendingReviews, totalActivity24h] = await Promise.all([
    prisma.user.count({ where: { role: { in: ["ADMIN", "COURSE_WRITER"] } } }),
    prisma.cmsDraft.count(),
    prisma.activityLog.count({ where: { createdAt: { gte: oneDayAgo } } })
  ])

  return {
    activeWriters,
    pendingReviews,
    totalActivity24h,
    securityAlerts: 0 
  }
}

export async function getDetailedActivityLog(limit = 50) {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { username: true, name: true, image: true, role: true },
      },
    },
    take: limit,
  })
}

export async function getReviewQueue() {
  return prisma.cmsDraft.findMany({
    orderBy: { updatedAt: "desc" },
  })
}

export async function getGovernanceUsers() {
  return prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "COURSE_WRITER"] }
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          authoredCourses: true,
          authoredQuestions: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })
}
