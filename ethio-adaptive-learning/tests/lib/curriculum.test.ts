import { DifficultyTier, Prisma, QuestionUsage } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  courseCreate: vi.fn(),
  courseFindMany: vi.fn(),
  courseFindFirst: vi.fn(),
  unitCreate: vi.fn(),
  unitFindFirst: vi.fn(),
  conceptCreate: vi.fn(),
  conceptFindUnique: vi.fn(),
  conceptFindMany: vi.fn(),
  conceptFindFirst: vi.fn(),
  questionCreate: vi.fn(),
  questionFindFirst: vi.fn(),
  prerequisiteFindMany: vi.fn(),
  transactionDeleteMany: vi.fn(),
  transactionCreateMany: vi.fn(),
  transactionFindMany: vi.fn(),
  transaction: vi.fn(),
  loadCourseUserState: vi.fn(),
  rebuildConceptClosureForCourse: vi.fn(),
  listCourseAncestors: vi.fn(),
  listCourseDescendants: vi.fn(),
  getUnlockedConceptIds: vi.fn(),
  getFringeConceptIds: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
    course: {
      create: mocks.courseCreate,
      findMany: mocks.courseFindMany,
      findFirst: mocks.courseFindFirst,
    },
    unit: {
      create: mocks.unitCreate,
      findFirst: mocks.unitFindFirst,
    },
    concept: {
      create: mocks.conceptCreate,
      findUnique: mocks.conceptFindUnique,
      findMany: mocks.conceptFindMany,
      findFirst: mocks.conceptFindFirst,
    },
    question: {
      create: mocks.questionCreate,
      findFirst: mocks.questionFindFirst,
    },
    conceptPrerequisite: {
      findMany: mocks.prerequisiteFindMany,
    },
    $transaction: mocks.transaction,
  },
}))

vi.mock("@/lib/curriculum-graph", () => ({
  loadCourseUserState: mocks.loadCourseUserState,
  rebuildConceptClosureForCourse: mocks.rebuildConceptClosureForCourse,
  listCourseAncestors: mocks.listCourseAncestors,
  listCourseDescendants: mocks.listCourseDescendants,
  getUnlockedConceptIds: mocks.getUnlockedConceptIds,
  getFringeConceptIds: mocks.getFringeConceptIds,
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
    Object.values(mocks).forEach((mock) => {
      if ("mockReset" in mock) {
        mock.mockReset()
      }
    })

    mocks.courseFindFirst.mockResolvedValue(null)
    mocks.unitFindFirst.mockResolvedValue(null)
    mocks.conceptFindFirst.mockResolvedValue(null)
    mocks.questionFindFirst.mockResolvedValue(null)
    mocks.rebuildConceptClosureForCourse.mockResolvedValue([])
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
        slug: "grade-12-mathematics",
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
        slug: "factor-x-2-5x-6",
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
        slug: "find-the-limit-of-x-2-as-x-approaches-2",
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

  it("builds the student concept catalog with closure-backed unlock states", async () => {
    mocks.courseFindMany.mockResolvedValueOnce([
      {
        id: "course_math",
        slug: "grade-12-mathematics",
        title: "Grade 12 Mathematics",
        units: [
          {
            id: "unit_functions",
            slug: "functions-and-graphs",
            title: "Functions and Graphs",
            order: 1,
            concepts: [
              {
                id: "concept_linear",
                slug: "linear-functions",
                title: "Linear Functions",
                description: "Slope and intercept form",
                unlockThreshold: 0.9,
                questions: [{ id: "question_linear_1" }],
              },
              {
                id: "concept_quadratic",
                slug: "quadratic-functions",
                title: "Quadratic Functions",
                description: "Parabolas and factoring",
                unlockThreshold: 0.9,
                questions: [{ id: "question_quadratic_1" }, { id: "question_quadratic_2" }],
              },
              {
                id: "concept_limits",
                slug: "limits",
                title: "Limits",
                description: "Approaching a value",
                unlockThreshold: 0.9,
                questions: [],
              },
            ],
          },
        ],
      },
    ])
    mocks.loadCourseUserState.mockResolvedValueOnce({
      statuses: new Map([
        [
          "concept_linear",
          {
            status: "MASTERED",
            unlocked: true,
            unmetPrerequisites: [],
            masteryProbability: 0.96,
            effectiveMastery: 0.96,
            nextReviewAt: null,
          },
        ],
        [
          "concept_quadratic",
          {
            status: "FRINGE",
            unlocked: true,
            unmetPrerequisites: [],
            masteryProbability: null,
            effectiveMastery: null,
            nextReviewAt: null,
          },
        ],
        [
          "concept_limits",
          {
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
      ]),
    })

    const catalog = await getStudentConceptCatalog("student_1")

    expect(mocks.loadCourseUserState).toHaveBeenCalledWith("course_math", "student_1")
    expect(catalog).toEqual([
      {
        id: "course_math",
        slug: "grade-12-mathematics",
        title: "Grade 12 Mathematics",
        units: [
          {
            id: "unit_functions",
            slug: "functions-and-graphs",
            title: "Functions and Graphs",
            order: 1,
            concepts: [
              {
                id: "concept_linear",
                slug: "linear-functions",
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
                slug: "quadratic-functions",
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
                slug: "limits",
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

  it("replaces prerequisite edges and refreshes closure rows after validation succeeds", async () => {
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
    expect(mocks.rebuildConceptClosureForCourse).toHaveBeenCalledWith(
      "course_math",
      expect.any(Object)
    )
  })
})
