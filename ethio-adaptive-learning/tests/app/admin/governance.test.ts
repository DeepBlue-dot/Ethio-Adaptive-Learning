import { describe, it, expect, vi, beforeEach } from "vitest"
import { getGovernanceSummary, getDetailedActivityLog, getReviewQueue, getGovernanceUsers } from "@/lib/studio/governance"
import { prisma } from "@/lib/prisma"

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    cmsDraft: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    activityLog: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe("Governance Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getGovernanceSummary", () => {
    it("should aggregate correct metrics for the summary", async () => {
      // Setup mocks
      vi.mocked(prisma.user.count).mockResolvedValue(5)
      vi.mocked(prisma.cmsDraft.count).mockResolvedValue(12)
      vi.mocked(prisma.activityLog.count).mockResolvedValue(45)

      const stats = await getGovernanceSummary()

      expect(stats.activeWriters).toBe(5)
      expect(stats.pendingReviews).toBe(12)
      expect(stats.totalActivity24h).toBe(45)
      expect(stats.securityAlerts).toBe(0)
      
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { role: { in: ["ADMIN", "COURSE_WRITER"] } }
      })
    })
  })

  describe("getDetailedActivityLog", () => {
    it("should fetch activity logs with user details", async () => {
      const mockLogs = [
        {
          id: "log-1",
          action: "PUBLISH",
          contentType: "concept",
          entityId: "c1",
          entityTitle: "Test Concept",
          createdAt: new Date(),
          user: { username: "admin", name: "Admin User", image: null, role: "ADMIN" }
        }
      ]
      vi.mocked(prisma.activityLog.findMany).mockResolvedValue(mockLogs as unknown as never)

      const activity = await getDetailedActivityLog(10)

      expect(activity).toHaveLength(1)
      expect(activity[0].action).toBe("PUBLISH")
      expect(activity[0].user.username).toBe("admin")
      expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          orderBy: { createdAt: "desc" }
        })
      )
    })
  })

  describe("getReviewQueue", () => {
    it("should fetch pending drafts ordered by update time", async () => {
      const mockDrafts = [
        { id: "d1", contentType: "course", entityId: "e1", updatedAt: new Date() }
      ]
      vi.mocked(prisma.cmsDraft.findMany).mockResolvedValue(mockDrafts as unknown as never)

      const queue = await getReviewQueue()

      expect(queue).toHaveLength(1)
      expect(queue[0].contentType).toBe("course")
      expect(prisma.cmsDraft.findMany).toHaveBeenCalledWith({
        orderBy: { updatedAt: "desc" }
      })
    })
  })

  describe("getGovernanceUsers", () => {
    it("should fetch administrative users with content counts", async () => {
      const mockUsers = [
        {
          id: "u1",
          username: "writer1",
          email: "w1@example.com",
          role: "COURSE_WRITER",
          createdAt: new Date(),
          _count: { authoredCourses: 2, authoredQuestions: 15 }
        }
      ]
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as unknown as never)

      const users = await getGovernanceUsers()

      expect(users).toHaveLength(1)
      expect(users[0].role).toBe("COURSE_WRITER")
      expect(users[0]._count.authoredCourses).toBe(2)
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: { in: ["ADMIN", "COURSE_WRITER"] } }
        })
      )
    })
  })
})
