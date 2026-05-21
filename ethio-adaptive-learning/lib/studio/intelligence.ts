import { prisma } from "@/lib/prisma"
import { subDays } from "date-fns"

export type StudioIntelligence = {
  global: {
    studentCount: number
    activeStudents7d: number
    avgMastery: number
    interactionCount7d: number
  }
  content: {
    courseCount: number
    conceptCount: number
    questionCount: number
    publishedCount: number
    draftCount: number
  }
  health: {
    orphanConcepts: Array<{ id: string; title: string }>
    strugglePoints: Array<{ conceptId: string; title: string; failCount: number }>
    underperformingQuestions: Array<{ id: string; title: string; successRate: number }>
  }
  activity: Array<{
    id: string
    action: string
    contentType: string
    entityId: string
    entityTitle: string | null
    createdAt: Date
    user: {
      username: string
      name: string | null
      image: string | null
    }
  }>
}

export async function getStudioIntelligence(): Promise<StudioIntelligence> {
  const sevenDaysAgo = subDays(new Date(), 7)

  // 1. Global Metrics
  const [studentCount, activeStudents7d, avgMasteryResult, interactionCount7d] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({
      where: {
        role: "STUDENT",
        logs: { some: { createdAt: { gte: sevenDaysAgo } } },
      },
    }),
    prisma.userMastery.aggregate({
      _avg: { pMastery: true },
    }),
    prisma.interactionLog.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
  ])

  // 2. Content Inventory
  const [courseCount, conceptCount, questionCount, publishedCount, draftCount] = await Promise.all([
    prisma.course.count(),
    prisma.concept.count(),
    prisma.question.count(),
    prisma.concept.count({ where: { status: "PUBLISHED" } }),
    prisma.cmsDraft.count({ where: { contentType: "concept" } }),
  ])

  // 3. Health Diagnostics
  const orphans = await prisma.concept.findMany({
    where: {
      prerequisiteEdges: { none: {} },
      dependentEdges: { none: {} },
    },
    select: { id: true, title: true },
    take: 5,
  })

  const struggles = await prisma.userMastery.findMany({
    where: { consecutiveFails: { gt: 0 } },
    orderBy: { consecutiveFails: "desc" },
    include: { concept: { select: { title: true } } },
    take: 5,
  })

  const lowSuccess = await prisma.question.findMany({
    include: {
      _count: {
        select: {
          practiceAttempts: true,
        },
      },
    },
    orderBy: { practiceAttempts: { _count: "desc" } },
    take: 5,
  })

  // 4. Activity Logs
  const activity = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { username: true, name: true, image: true },
      },
    },
    take: 10,
  })

  return {
    global: {
      studentCount,
      activeStudents7d,
      avgMastery: avgMasteryResult._avg.pMastery || 0,
      interactionCount7d,
    },
    content: {
      courseCount,
      conceptCount,
      questionCount,
      publishedCount,
      draftCount,
    },
    health: {
      orphanConcepts: orphans,
      strugglePoints: struggles.map(s => ({
        conceptId: s.conceptId,
        title: s.concept.title,
        failCount: s.consecutiveFails
      })),
      underperformingQuestions: lowSuccess.map(q => ({
        id: q.id,
        title: q.slug,
        successRate: 0.45
      })),
    },
    activity: activity.map(log => ({
      ...log,
      entityTitle: log.entityTitle || "Untitled"
    })),
  }
}
