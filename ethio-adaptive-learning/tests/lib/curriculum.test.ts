import { DifficultyTier, Prisma, QuestionUsage } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  courseCreate: vi.fn(),
  courseFindMany: vi.fn(),
  unitCreate: vi.fn(),
  conceptCreate: vi.fn(),
  questionCreate: vi.fn(),
  conceptFindUnique: vi.fn(),
  conceptFindMany: vi.fn(),
  prerequisiteFindMany: vi.fn(),
  userMasteryFindMany: vi.fn(),
  transactionDeleteMany: vi.fn(),
  transactionCreateMany: vi.fn(),
  transactionFindMany: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
    userMastery: {
      findMany: mocks.userMasteryFindMany,
    },
    course: {
      create: mocks.courseCreate,
      findMany: mocks.courseFindMany,
    },
    unit: {
      create: mocks.unitCreate,
    },
    concept: {
      create: mocks.conceptCreate,
      findUnique: mocks.conceptFindUnique,
      findMany: mocks.conceptFindMany,
    },
    question: {
      create: mocks.questionCreate,
    },
    conceptPrerequisite: {
      findMany: mocks.prerequisiteFindMany,
    },
    $transaction: mocks.transaction,
  },
}))

import {
  createConcept,
  createCourse,
  createQuestion,
  createUnit,
  getStudentConceptCatalog,
  setConceptPrerequisites,
} from "@/lib/curriculum"

describe("lib/curriculum", () => {
  beforeEach(() => {
    mocks.userFindUnique.mockReset()
    mocks.courseCreate.mockReset()
    mocks.courseFindMany.mockReset()
    mocks.unitCreate.mockReset()
    mocks.conceptCreate.mockReset()
    mocks.questionCreate.mockReset()
    mocks.conceptFindUnique.mockReset()
    mocks.conceptFindMany.mockReset()
    mocks.prerequisiteFindMany.mockReset()
    mocks.userMasteryFindMany.mockReset()
    mocks.transactionDeleteMany.mockReset()
    mocks.transactionCreateMany.mockReset()
    mocks.transactionFindMany.mockReset()
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        conceptPrerequisite: {
          deleteMany: mocks.transactionDeleteMany,
          createMany: mocks.transactionCreateMany,
          findMany: mocks.transactionFindMany,
        },
      })
    )
  })

  it("creates a course with a valid CMS author", async () => {
    mocks.userFindUnique.mockResolvedValueOnce({ role: "COURSE_WRITER" })
    mocks.courseCreate.mockResolvedValueOnce({ id: "course_1" })

    await createCourse({
      title: " Grade 12 Mathematics ",
      description: " Core exam preparation ",
      authorId: "writer_1",
    })

    expect(mocks.courseCreate).toHaveBeenCalledWith({
      data: {
        title: "Grade 12 Mathematics",
        description: "Core exam preparation",
        authorId: "writer_1",
      },
    })
  })

  it("rejects course authors that are not admins or course writers", async () => {
    mocks.userFindUnique.mockResolvedValueOnce({ role: "STUDENT" })

    await expect(
      createCourse({
        title: "Grade 12 Mathematics",
        authorId: "student_1",
      })
    ).rejects.toThrow("Course author must be an admin or course writer.")
  })

  it("validates unit ordering before creating a unit", async () => {
    await expect(
      createUnit({
        courseId: "course_1",
        title: "Functions",
        order: 0,
      })
    ).rejects.toThrow("Unit order must be a positive whole number.")
  })

  it("validates concept probabilities before creating a concept", async () => {
    await expect(
      createConcept({
        unitId: "unit_1",
        title: "Limits",
        unlockThreshold: 1.2,
        pLo: 0.15,
        pT: 0.1,
        pG: 0.2,
        pS: 0.1,
        decayLambda: 0.01,
      })
    ).rejects.toThrow("Unlock threshold must be between 0 and 1.")
  })

  it("rejects malformed distractors before creating a question", async () => {
    await expect(
      createQuestion({
        conceptId: "concept_1",
        usage: QuestionUsage.PRACTICE,
        difficulty: DifficultyTier.MEDIUM,
        content: "Solve x + 2 = 5",
        correctAnswer: "3",
        distractors: ["2", ""],
      })
    ).rejects.toThrow("Distractors cannot contain blank answer choices.")
  })

  it("stores valid question payloads with structured distractors", async () => {
    mocks.questionCreate.mockResolvedValueOnce({ id: "question_1" })

    await createQuestion({
      conceptId: "concept_1",
      usage: QuestionUsage.CHECKPOINT,
      difficulty: DifficultyTier.HARD,
      content: "Factor x^2 - 5x + 6",
      correctAnswer: "(x - 2)(x - 3)",
      distractors: ["x(x - 5) + 6", "(x + 2)(x + 3)"],
      hintText: "Think about two numbers that multiply to 6 and add to -5.",
      explanation: "The two numbers are -2 and -3.",
      authorId: "writer_1",
    })

    expect(mocks.questionCreate).toHaveBeenCalledWith({
      data: {
        conceptId: "concept_1",
        usage: QuestionUsage.CHECKPOINT,
        difficulty: DifficultyTier.HARD,
        content: "Factor x^2 - 5x + 6",
        correctAnswer: "(x - 2)(x - 3)",
        distractors: ["x(x - 5) + 6", "(x + 2)(x + 3)"],
        hintText: "Think about two numbers that multiply to 6 and add to -5.",
        explanation: "The two numbers are -2 and -3.",
        authorId: "writer_1",
      },
    })
  })

  it("stores Prisma.JsonNull when distractors are omitted", async () => {
    mocks.questionCreate.mockResolvedValueOnce({ id: "question_2" })

    await createQuestion({
      conceptId: "concept_2",
      usage: QuestionUsage.EXAM,
      difficulty: DifficultyTier.MEDIUM,
      content: "Find the limit of x^2 as x approaches 2.",
      correctAnswer: "4",
      explanation: "Substitute directly because the function is continuous.",
    })

    expect(mocks.questionCreate).toHaveBeenCalledWith({
      data: {
        conceptId: "concept_2",
        usage: QuestionUsage.EXAM,
        difficulty: DifficultyTier.MEDIUM,
        content: "Find the limit of x^2 as x approaches 2.",
        correctAnswer: "4",
        distractors: Prisma.JsonNull,
        hintText: null,
        explanation: "Substitute directly because the function is continuous.",
        authorId: null,
      },
    })
  })

  it("builds the student concept catalog with derived unlock states", async () => {
    mocks.courseFindMany.mockResolvedValueOnce([
      {
        id: "course_math",
        title: "Grade 12 Mathematics",
        units: [
          {
            id: "unit_functions",
            title: "Functions and Graphs",
            order: 1,
            concepts: [
              {
                id: "concept_linear",
                title: "Linear Functions",
                description: "Slope and intercept form",
                unlockThreshold: 0.9,
                prerequisiteEdges: [],
                questions: [{ id: "question_linear_1" }],
              },
              {
                id: "concept_quadratic",
                title: "Quadratic Functions",
                description: "Parabolas and factoring",
                unlockThreshold: 0.9,
                prerequisiteEdges: [
                  {
                    prerequisiteConcept: {
                      id: "concept_linear",
                      title: "Linear Functions",
                    },
                  },
                ],
                questions: [{ id: "question_quadratic_1" }, { id: "question_quadratic_2" }],
              },
              {
                id: "concept_limits",
                title: "Limits",
                description: "Approaching a value",
                unlockThreshold: 0.9,
                prerequisiteEdges: [
                  {
                    prerequisiteConcept: {
                      id: "concept_quadratic",
                      title: "Quadratic Functions",
                    },
                  },
                ],
                questions: [],
              },
            ],
          },
        ],
      },
    ])
    mocks.userMasteryFindMany.mockResolvedValueOnce([
      {
        conceptId: "concept_linear",
        pMastery: 0.96,
        lastAssessedAt: null,
        nextReviewAt: null,
        unlockedAt: new Date("2026-04-01T00:00:00.000Z"),
        status: "MASTERED",
      },
    ])

    const catalog = await getStudentConceptCatalog("student_1")

    expect(mocks.userMasteryFindMany).toHaveBeenCalledWith({
      where: {
        userId: "student_1",
        conceptId: {
          in: ["concept_linear", "concept_quadratic", "concept_limits"],
        },
      },
    })

    expect(catalog).toEqual([
      {
        id: "course_math",
        title: "Grade 12 Mathematics",
        units: [
          {
            id: "unit_functions",
            title: "Functions and Graphs",
            order: 1,
            concepts: [
              {
                id: "concept_linear",
                title: "Linear Functions",
                description: "Slope and intercept form",
                questionCount: 1,
                unlockThreshold: 0.9,
                status: "MASTERED",
                unlocked: true,
                unmetPrerequisites: [],
                masteryProbability: 0.96,
                effectiveMastery: 0.96,
                nextReviewAt: null,
              },
              {
                id: "concept_quadratic",
                title: "Quadratic Functions",
                description: "Parabolas and factoring",
                questionCount: 2,
                unlockThreshold: 0.9,
                status: "FRINGE",
                unlocked: true,
                unmetPrerequisites: [],
                masteryProbability: null,
                effectiveMastery: null,
                nextReviewAt: null,
              },
              {
                id: "concept_limits",
                title: "Limits",
                description: "Approaching a value",
                questionCount: 0,
                unlockThreshold: 0.9,
                status: "LOCKED",
                unlocked: false,
                unmetPrerequisites: [
                  {
                    conceptId: "concept_quadratic",
                    title: "Quadratic Functions",
                    currentMastery: 0,
                  },
                ],
                masteryProbability: null,
                effectiveMastery: null,
                nextReviewAt: null,
              },
            ],
          },
        ],
      },
    ])
  })

  it("rejects prerequisites from a different course", async () => {
    mocks.conceptFindUnique.mockResolvedValueOnce({
      id: "concept_target",
      unit: {
        courseId: "course_math",
      },
    })
    mocks.conceptFindMany.mockResolvedValueOnce([
      {
        id: "concept_foreign",
        unit: {
          courseId: "course_physics",
        },
      },
    ])

    await expect(
      setConceptPrerequisites({
        conceptId: "concept_target",
        prerequisiteConceptIds: ["concept_foreign"],
      })
    ).rejects.toThrow("Prerequisites must belong to the same course as the concept.")
  })

  it("replaces prerequisite edges after validation succeeds", async () => {
    mocks.conceptFindUnique.mockResolvedValueOnce({
      id: "concept_target",
      unit: {
        courseId: "course_math",
      },
    })
    mocks.conceptFindMany.mockResolvedValueOnce([
      {
        id: "concept_intro",
        unit: {
          courseId: "course_math",
        },
      },
    ])
    mocks.prerequisiteFindMany.mockResolvedValueOnce([
      {
        prerequisiteConceptId: "concept_intro",
        dependentConceptId: "concept_existing",
      },
    ])
    mocks.transactionDeleteMany.mockResolvedValueOnce({ count: 1 })
    mocks.transactionCreateMany.mockResolvedValueOnce({ count: 1 })
    mocks.transactionFindMany.mockResolvedValueOnce([
      {
        prerequisiteConceptId: "concept_intro",
        dependentConceptId: "concept_target",
      },
    ])

    await setConceptPrerequisites({
      conceptId: "concept_target",
      prerequisiteConceptIds: ["concept_intro"],
    })

    expect(mocks.transactionDeleteMany).toHaveBeenCalledWith({
      where: {
        dependentConceptId: "concept_target",
      },
    })
    expect(mocks.transactionCreateMany).toHaveBeenCalledWith({
      data: [
        {
          prerequisiteConceptId: "concept_intro",
          dependentConceptId: "concept_target",
        },
      ],
    })
  })
})
