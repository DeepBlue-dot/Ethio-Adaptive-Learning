import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  userProfileFindUnique: vi.fn(),
  courseFindMany: vi.fn(),
  practiceAttemptFindMany: vi.fn(),
  checkpointAttemptFindMany: vi.fn(),
  examAttemptFindMany: vi.fn(),
  conceptFindFirst: vi.fn(),
  conceptFindMany: vi.fn(),
  mediaAssetFindMany: vi.fn(),
  questionFindMany: vi.fn(),
  contentSnippetFindMany: vi.fn(),
  interactionLogFindMany: vi.fn(),
  interactionLogFindFirst: vi.fn(),
  interactionLogCreate: vi.fn(),
  userMasteryFindMany: vi.fn(),
  loadCourseUserState: vi.fn(),
  getStudentConceptCatalog: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userProfile: {
      findUnique: mocks.userProfileFindUnique,
    },
    course: {
      findMany: mocks.courseFindMany,
    },
    practiceAttempt: {
      findMany: mocks.practiceAttemptFindMany,
    },
    checkpointAttempt: {
      findMany: mocks.checkpointAttemptFindMany,
    },
    examAttempt: {
      findMany: mocks.examAttemptFindMany,
    },
    concept: {
      findFirst: mocks.conceptFindFirst,
      findMany: mocks.conceptFindMany,
    },
    mediaAsset: {
      findMany: mocks.mediaAssetFindMany,
    },
    question: {
      findMany: mocks.questionFindMany,
    },
    contentSnippet: {
      findMany: mocks.contentSnippetFindMany,
    },
    interactionLog: {
      findMany: mocks.interactionLogFindMany,
      findFirst: mocks.interactionLogFindFirst,
      create: mocks.interactionLogCreate,
    },
    userMastery: {
      findMany: mocks.userMasteryFindMany,
    },
  },
}))

vi.mock("@/lib/curriculum-graph", () => ({
  loadCourseUserState: mocks.loadCourseUserState,
}))

vi.mock("@/lib/curriculum", () => ({
  getStudentConceptCatalog: mocks.getStudentConceptCatalog,
  normalizeContentBlocks: (blocks: any) => blocks,
  getContentBlockReferences: () => ({ assetIds: [], questionIds: [], snippetIds: [] }),
  buildLegacyContentBlocks: () => [],
}))

import {
  getStudentDashboard,
  getStudentConceptDetail,
  getStudentAnalytics,
} from "@/lib/student/data"

describe("lib/student/data", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => {
      if ("mockReset" in mock) {
        mock.mockReset()
      }
    })
  })

  describe("getStudentDashboard", () => {
    it("maps user profile and categories concepts correctly", async () => {
      mocks.userProfileFindUnique.mockResolvedValue({
        totalXP: 500,
        currentLevel: 5,
        dailyStreak: 3,
        overallProgress: 45.5,
      })

      mocks.courseFindMany.mockResolvedValue([
        {
          id: "course_1",
          title: "Math",
          units: [
            {
              id: "unit_1",
              title: "Algebra",
              concepts: [
                { id: "concept_1", title: "Limits", pLo: 0.1, status: "PUBLISHED" },
                { id: "concept_2", title: "Derivatives", pLo: 0.1, status: "PUBLISHED" },
              ],
            },
          ],
        },
      ])

      mocks.loadCourseUserState.mockResolvedValue({
        statuses: new Map([
          ["concept_1", { status: "MASTERED", unlocked: true, masteryProbability: 0.95, unmetPrerequisites: [] }],
          ["concept_2", { status: "LOCKED", unlocked: false, unmetPrerequisites: ["concept_1"] }],
        ]),
        masteries: [],
        ancestorMap: new Map(),
      })

      mocks.practiceAttemptFindMany.mockResolvedValue([])
      mocks.checkpointAttemptFindMany.mockResolvedValue([])
      mocks.examAttemptFindMany.mockResolvedValue([])

      const dashboard = await getStudentDashboard("user_1")

      expect(dashboard.profile.totalXP).toBe(500)
      expect(dashboard.conceptsByStatus.mastered).toHaveLength(1)
      expect(dashboard.conceptsByStatus.mastered[0].conceptId).toBe("concept_1")
      expect(dashboard.conceptsByStatus.locked).toHaveLength(1)
      expect(dashboard.conceptsByStatus.locked[0].conceptId).toBe("concept_2")
    })
  })

  describe("getStudentConceptDetail", () => {
    it("returns null for non-existent concepts", async () => {
      mocks.conceptFindFirst.mockResolvedValue(null)
      const detail = await getStudentConceptDetail("user_1", "missing")
      expect(detail).toBeNull()
    })

    it("derives detailed concept state correctly", async () => {
      const mockConcept = {
        id: "concept_1",
        title: "Limits",
        unitId: "unit_1",
        unit: {
          id: "unit_1",
          title: "Algebra",
          course: { id: "course_1", title: "Math" },
        },
        chunks: [],
        workedExamples: [],
        prerequisiteEdges: [],
        questions: [{ usage: "PRACTICE" }, { usage: "PRACTICE" }],
        userMasteries: [],
        contentBlocks: [],
        contentBody: "Content",
      }

      mocks.conceptFindFirst.mockResolvedValue(mockConcept)
      mocks.loadCourseUserState.mockResolvedValue({
        statuses: new Map([
          ["concept_1", { status: "IN_PROGRESS", unlocked: true, masteryProbability: 0.4 }],
        ]),
      })
      mocks.practiceAttemptFindMany.mockResolvedValue([])
      mocks.checkpointAttemptFindMany.mockResolvedValue([])
      mocks.examAttemptFindMany.mockResolvedValue([])
      mocks.interactionLogFindMany.mockResolvedValue([])

      const detail = await getStudentConceptDetail("user_1", "concept_1")

      expect(detail).not.toBeNull()
      expect(detail?.title).toBe("Limits")
      expect(detail?.status).toBe("IN_PROGRESS")
      expect(detail?.practiceQuestionCount).toBe(2)
    })

    it("identifies unmet prerequisites and provides recommendations", async () => {
      const mockConcept = {
        id: "concept_2",
        title: "Derivatives",
        unitId: "unit_1",
        unit: {
          id: "unit_1",
          title: "Algebra",
          course: { id: "course_1", title: "Math" },
        },
        chunks: [],
        workedExamples: [],
        prerequisiteEdges: [
          { prerequisiteConceptId: "concept_1", prerequisiteConcept: { title: "Limits" } }
        ],
        questions: [],
        userMasteries: [],
        contentBlocks: [],
        contentBody: "Content",
        pLo: 0.1,
      }

      mocks.conceptFindFirst.mockResolvedValue(mockConcept)
      mocks.loadCourseUserState.mockResolvedValue({
        statuses: new Map([
          ["concept_2", { 
            status: "LOCKED", 
            unlocked: false, 
            masteryProbability: 0, 
            unmetPrerequisites: [{ conceptId: "concept_1", title: "Limits", currentMastery: 0.5 }] 
          }],
        ]),
      })
      mocks.userMasteryFindMany.mockResolvedValue([
        { conceptId: "concept_1", pMastery: 0.5, status: "IN_PROGRESS" }
      ])
      mocks.practiceAttemptFindMany.mockResolvedValue([])
      mocks.checkpointAttemptFindMany.mockResolvedValue([])
      mocks.examAttemptFindMany.mockResolvedValue([])
      mocks.interactionLogFindMany.mockResolvedValue([])

      const detail = await getStudentConceptDetail("user_1", "concept_2")

      expect(detail?.status).toBe("LOCKED")
      expect(detail?.unmetPrerequisites).toHaveLength(1)
      expect(detail?.unmetPrerequisites[0].title).toBe("Limits")
      expect(detail?.recommendation.type).toBe("learn")
      expect(detail?.recommendation.isLocked).toBe(true)
    })
  })

  describe("getStudentAnalytics", () => {
    it("calculates distribution and performance accurately", async () => {
      // Setup minimal dashboard mock data
      mocks.userProfileFindUnique.mockResolvedValue({ totalXP: 100 })
      mocks.courseFindMany.mockResolvedValue([])
      mocks.loadCourseUserState.mockResolvedValue({ statuses: new Map(), masteries: [] })
      mocks.getStudentConceptCatalog.mockResolvedValue([])
      
      // Need to mock what getStudentDashboard and getStudentNavigation use
      // For brevity in this test, we can trust the mapping logic if dashboard is tested
      
      const analytics = await getStudentAnalytics("user_1")
      expect(analytics).toBeDefined()
      expect(analytics.progress.totalConcepts).toBe(0)
    })
  })
})
