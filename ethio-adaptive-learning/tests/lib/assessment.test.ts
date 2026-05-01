import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  topLevelUserMasteryFindMany: vi.fn(),
  practiceAttemptFindUnique: vi.fn(),
  practiceAttemptUpdate: vi.fn(),
  checkpointAttemptFindFirst: vi.fn(),
  examAttemptFindUnique: vi.fn(),
  examAttemptUpdate: vi.fn(),
  questionFindMany: vi.fn(),
  interactionLogCreate: vi.fn(),
  interactionLogCreateMany: vi.fn(),
  userMasteryFindUnique: vi.fn(),
  userMasteryCreate: vi.fn(),
  userMasteryUpdate: vi.fn(),
  userMasteryUpsert: vi.fn(),
  unitFindUnique: vi.fn(),
  loadCourseUserState: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    userMastery: {
      findMany: mocks.topLevelUserMasteryFindMany,
    },
  },
}))

vi.mock("@/lib/curriculum-graph", () => ({
  loadCourseUserState: mocks.loadCourseUserState,
}))

import { getReviewQueue, submitExamAttempt, submitPracticeAttempt } from "@/lib/assessment"

describe("lib/assessment", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => {
      if ("mockReset" in mock) {
        mock.mockReset()
      }
    })

    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        practiceAttempt: {
          findUnique: mocks.practiceAttemptFindUnique,
          update: mocks.practiceAttemptUpdate,
        },
        checkpointAttempt: {
          findFirst: mocks.checkpointAttemptFindFirst,
        },
        examAttempt: {
          findUnique: mocks.examAttemptFindUnique,
          update: mocks.examAttemptUpdate,
        },
        question: {
          findMany: mocks.questionFindMany,
        },
        interactionLog: {
          create: mocks.interactionLogCreate,
          createMany: mocks.interactionLogCreateMany,
        },
        userMastery: {
          findUnique: mocks.userMasteryFindUnique,
          create: mocks.userMasteryCreate,
          update: mocks.userMasteryUpdate,
          upsert: mocks.userMasteryUpsert,
        },
        unit: {
          findUnique: mocks.unitFindUnique,
        },
      })
    )
  })

  it("keeps practice submissions from changing permanent mastery", async () => {
    mocks.practiceAttemptFindUnique.mockResolvedValueOnce({
      id: "practice_attempt_1",
      userId: "student_1",
      conceptId: "concept_linear",
      questionId: "question_linear_1",
      completedAt: null,
      question: {
        id: "question_linear_1",
        content: "If f(x) = 2x + 3, what is the slope?",
        correctAnswer: "2",
        distractors: ["1", "3", "4"],
        hintText: "The slope is the coefficient of x.",
        explanation: "The coefficient of x is 2.",
        difficulty: "EASY",
        usage: "PRACTICE",
      },
      concept: {
        id: "concept_linear",
        pLo: 0.15,
        unlockThreshold: 0.9,
        decayLambda: 0.01,
      },
    })
    mocks.userMasteryFindUnique.mockResolvedValueOnce({
      userId: "student_1",
      conceptId: "concept_linear",
      pMastery: 0.15,
      lastAssessedAt: null,
      nextReviewAt: null,
      unlockedAt: new Date("2026-04-01T00:00:00.000Z"),
      status: "FRINGE",
      consecutiveFails: 0,
    })

    const result = await submitPracticeAttempt("student_1", "practice_attempt_1", "2")

    expect(result).toEqual({
      conceptId: "concept_linear",
      isCorrect: true,
    })
    expect(mocks.userMasteryUpdate).toHaveBeenCalledWith({
      where: {
        userId_conceptId: {
          userId: "student_1",
          conceptId: "concept_linear",
        },
      },
      data: expect.objectContaining({
        status: "IN_PROGRESS",
      }),
    })
    expect(mocks.userMasteryUpdate.mock.calls[0][0].data).not.toHaveProperty("pMastery")
  })

  it("updates mastery and unlocks dependent concepts after a passed exam", async () => {
    mocks.examAttemptFindUnique.mockResolvedValueOnce({
      id: "exam_attempt_1",
      userId: "student_1",
      conceptId: "concept_quadratic",
      pathway: "LEARN",
      questionIds: ["question_exam_1", "question_exam_2", "question_exam_3"],
      questionCount: 3,
      correctCount: null,
      score: null,
      timeSpentSec: null,
      isPassed: null,
      createdAt: new Date("2026-04-04T00:00:00.000Z"),
      completedAt: null,
      submittedAnswers: null,
      concept: {
        id: "concept_quadratic",
        unitId: "unit_calculus",
        pLo: 0.15,
        pT: 0.1,
        pG: 0.2,
        pS: 0.1,
        decayLambda: 0.01,
        unlockThreshold: 0.9,
      },
    })
    mocks.questionFindMany.mockResolvedValueOnce([
      {
        id: "question_exam_1",
        content: "Question 1",
        correctAnswer: "A",
        distractors: ["B", "C"],
        hintText: null,
        explanation: null,
        difficulty: "HARD",
        usage: "EXAM",
      },
      {
        id: "question_exam_2",
        content: "Question 2",
        correctAnswer: "B",
        distractors: ["A", "C"],
        hintText: null,
        explanation: null,
        difficulty: "HARD",
        usage: "EXAM",
      },
      {
        id: "question_exam_3",
        content: "Question 3",
        correctAnswer: "C",
        distractors: ["A", "B"],
        hintText: null,
        explanation: null,
        difficulty: "HARD",
        usage: "EXAM",
      },
    ])
    mocks.userMasteryFindUnique.mockResolvedValueOnce({
      userId: "student_1",
      conceptId: "concept_quadratic",
      pMastery: 0.15,
      lastAssessedAt: null,
      nextReviewAt: null,
      unlockedAt: new Date("2026-04-03T00:00:00.000Z"),
      status: "IN_PROGRESS",
      consecutiveFails: 0,
    })
    mocks.unitFindUnique.mockResolvedValueOnce({
      courseId: "course_math",
    })
    mocks.userMasteryCreate.mockResolvedValueOnce({
      userId: "student_1",
      conceptId: "concept_limits",
      pMastery: 0.15,
      lastAssessedAt: null,
      nextReviewAt: null,
      unlockedAt: new Date("2026-04-04T00:00:00.000Z"),
      status: "FRINGE",
      consecutiveFails: 0,
    })
    mocks.loadCourseUserState.mockResolvedValueOnce({
      concepts: [
        {
          id: "concept_quadratic",
          pLo: 0.15,
        },
        {
          id: "concept_limits",
          pLo: 0.15,
        },
      ],
      masteries: [
        {
          userId: "student_1",
          conceptId: "concept_quadratic",
          pMastery: 0.9,
          lastAssessedAt: new Date("2026-04-04T00:00:00.000Z"),
          nextReviewAt: new Date("2026-04-20T00:00:00.000Z"),
          unlockedAt: new Date("2026-04-03T00:00:00.000Z"),
          status: "MASTERED",
          consecutiveFails: 0,
        },
      ],
      statuses: new Map([
        [
          "concept_quadratic",
          {
            unlocked: true,
            status: "MASTERED",
          },
        ],
        [
          "concept_limits",
          {
            unlocked: true,
            status: "FRINGE",
          },
        ],
      ]),
    })

    const result = await submitExamAttempt("student_1", "exam_attempt_1", {
      question_exam_1: "A",
      question_exam_2: "B",
      question_exam_3: "C",
    })

    expect(result).toEqual({
      conceptId: "concept_quadratic",
      isPassed: true,
      unlockedNewConcepts: true,
    })
    expect(mocks.userMasteryUpsert).toHaveBeenCalledWith({
      where: {
        userId_conceptId: {
          userId: "student_1",
          conceptId: "concept_quadratic",
        },
      },
      update: expect.objectContaining({
        pMastery: expect.any(Number),
        status: "MASTERED",
      }),
      create: expect.objectContaining({
        conceptId: "concept_quadratic",
        status: "MASTERED",
      }),
    })
    expect(mocks.userMasteryUpsert.mock.calls[0][0].update.pMastery).toBeGreaterThanOrEqual(0.9)
    expect(mocks.userMasteryCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "student_1",
        conceptId: "concept_limits",
        status: "FRINGE",
        pMastery: 0.15,
      }),
    })
  })

  it("returns due review concepts ordered by next review time", async () => {
    mocks.topLevelUserMasteryFindMany.mockResolvedValueOnce([
      {
        userId: "student_1",
        conceptId: "concept_linear",
        pMastery: 0.95,
        lastAssessedAt: new Date("2026-03-20T00:00:00.000Z"),
        nextReviewAt: new Date("2026-04-01T00:00:00.000Z"),
        unlockedAt: new Date("2026-03-01T00:00:00.000Z"),
        status: "MASTERED",
        consecutiveFails: 0,
        concept: {
          title: "Linear Functions",
          decayLambda: 0.02,
          unlockThreshold: 0.9,
          unit: {
            title: "Functions and Graphs",
            course: {
              title: "Grade 12 Mathematics",
            },
          },
        },
      },
    ])

    const queue = await getReviewQueue("student_1")

    expect(mocks.topLevelUserMasteryFindMany).toHaveBeenCalledWith({
      where: {
        userId: "student_1",
        unlockedAt: {
          not: null,
        },
        nextReviewAt: {
          not: null,
          lte: expect.any(Date),
        },
      },
      orderBy: {
        nextReviewAt: "asc",
      },
      include: {
        concept: {
          include: {
            unit: {
              include: {
                course: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    })
    expect(queue[0]).toMatchObject({
      conceptId: "concept_linear",
      title: "Linear Functions",
      courseTitle: "Grade 12 Mathematics",
      unitTitle: "Functions and Graphs",
      baselineMastery: 0.95,
      status: "REVIEW_NEEDED",
    })
  })
})
