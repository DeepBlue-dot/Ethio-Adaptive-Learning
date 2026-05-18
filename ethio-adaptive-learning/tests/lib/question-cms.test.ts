import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  courseFindMany: vi.fn(),
  questionCreate: vi.fn(),
  questionDelete: vi.fn(),
  questionFindFirst: vi.fn(),
  questionFindMany: vi.fn(),
  questionUpdate: vi.fn(),
  transaction: vi.fn(),
  txCheckpointAttemptDeleteMany: vi.fn(),
  txExamAttemptDeleteMany: vi.fn(),
  txInteractionLogDeleteMany: vi.fn(),
  txPracticeAttemptDeleteMany: vi.fn(),
  txQuestionDelete: vi.fn(),
  txQuestionFindUnique: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    course: {
      findMany: mocks.courseFindMany,
    },
    question: {
      create: mocks.questionCreate,
      delete: mocks.questionDelete,
      findFirst: mocks.questionFindFirst,
      findMany: mocks.questionFindMany,
      update: mocks.questionUpdate,
    },
    $transaction: mocks.transaction,
  },
}))

import {
  createQuestion,
  deleteQuestion,
  getQuestionBankCmsData,
  updateQuestion,
} from "@/lib/curriculum"

describe("question CMS services", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => {
      if ("mockReset" in mock) {
        mock.mockReset()
      }
    })

    mocks.questionFindFirst.mockResolvedValue(null)
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        checkpointAttempt: {
          deleteMany: mocks.txCheckpointAttemptDeleteMany,
        },
        examAttempt: {
          deleteMany: mocks.txExamAttemptDeleteMany,
        },
        interactionLog: {
          deleteMany: mocks.txInteractionLogDeleteMany,
        },
        practiceAttempt: {
          deleteMany: mocks.txPracticeAttemptDeleteMany,
        },
        question: {
          delete: mocks.txQuestionDelete,
          findUnique: mocks.txQuestionFindUnique,
        },
      })
    )
  })

  it("creates questions with normalized answer choices and preserves provided slugs", async () => {
    mocks.questionCreate.mockResolvedValueOnce({ id: "question_1" })

    await createQuestion({
      conceptId: " concept_1 ",
      usage: "PRACTICE",
      difficulty: "MEDIUM",
      content: " What is 2 + 2? ",
      correctAnswer: " 4 ",
      distractors: [" 1 ", " 3 ", " 5 "],
      hintText: " Count pairs ",
      explanation: " Basic addition ",
      authorId: " writer_1 ",
      slug: "addition-check",
    })

    expect(mocks.questionCreate).toHaveBeenCalledWith({
      data: {
        conceptId: "concept_1",
        slug: "addition-check",
        usage: "PRACTICE",
        difficulty: "MEDIUM",
        content: "What is 2 + 2?",
        correctAnswer: "4",
        distractors: ["1", "3", "5"],
        hintText: "Count pairs",
        explanation: "Basic addition",
        authorId: "writer_1",
      },
    })
  })

  it("updates questions and regenerates slugs within the concept scope", async () => {
    mocks.questionUpdate.mockResolvedValueOnce({ id: "question_1" })

    await updateQuestion("question_1", {
      conceptId: "concept_1",
      usage: "CHECKPOINT",
      difficulty: "HARD",
      content: " Solve for x ",
      correctAnswer: " x = 2 ",
      distractors: null,
      hintText: null,
      explanation: null,
      authorId: "writer_1",
      slug: null,
    })

    expect(mocks.questionUpdate).toHaveBeenCalledWith({
      where: {
        id: "question_1",
      },
      data: {
        conceptId: "concept_1",
        slug: "solve-for-x",
        usage: "CHECKPOINT",
        difficulty: "HARD",
        content: "Solve for x",
        correctAnswer: "x = 2",
        distractors: Prisma.JsonNull,
        hintText: null,
        explanation: null,
        authorId: "writer_1",
      },
    })
  })

  it("deletes question dependencies before deleting the question record", async () => {
    mocks.txQuestionFindUnique.mockResolvedValueOnce({
      conceptId: "concept_1",
    })
    mocks.txQuestionDelete.mockResolvedValueOnce({
      id: "question_1",
      conceptId: "concept_1",
    })

    await deleteQuestion("question_1")

    expect(mocks.txInteractionLogDeleteMany).toHaveBeenCalledWith({
      where: {
        questionId: "question_1",
      },
    })
    expect(mocks.txPracticeAttemptDeleteMany).toHaveBeenCalledWith({
      where: {
        questionId: "question_1",
      },
    })
    expect(mocks.txCheckpointAttemptDeleteMany).toHaveBeenCalledWith({
      where: {
        questionId: "question_1",
      },
    })
    expect(mocks.txExamAttemptDeleteMany).toHaveBeenCalledWith({
      where: {
        conceptId: "concept_1",
      },
    })
    expect(mocks.txQuestionDelete).toHaveBeenCalledWith({
      where: {
        id: "question_1",
      },
    })
  })

  it("sorts the question bank by course, unit order, concept, then prompt", async () => {
    mocks.courseFindMany.mockResolvedValueOnce([])
    mocks.questionFindMany.mockResolvedValueOnce([
      buildQuestionRecord({
        id: "question_3",
        courseTitle: "Algebra",
        unitOrder: 2,
        unitTitle: "Quadratics",
        conceptTitle: "Factoring",
        content: "B question",
      }),
      buildQuestionRecord({
        id: "question_1",
        courseTitle: "Algebra",
        unitOrder: 1,
        unitTitle: "Functions",
        conceptTitle: "Domain",
        content: "A question",
      }),
      buildQuestionRecord({
        id: "question_2",
        courseTitle: "Algebra",
        unitOrder: 1,
        unitTitle: "Functions",
        conceptTitle: "Domain",
        content: "B question",
      }),
    ])

    const result = await getQuestionBankCmsData({
      courseId: "course_1",
    })

    expect(result.questions.map((question) => question.id)).toEqual([
      "question_1",
      "question_2",
      "question_3",
    ])
  })
})

function buildQuestionRecord(args: {
  id: string
  courseTitle: string
  unitOrder: number
  unitTitle: string
  conceptTitle: string
  content: string
}) {
  return {
    id: args.id,
    slug: `${args.id}-slug`,
    usage: "PRACTICE",
    difficulty: "MEDIUM",
    content: args.content,
    correctAnswer: "Answer",
    distractors: null,
    hintText: null,
    explanation: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    author: null,
    conceptId: `${args.id}-concept`,
    concept: {
      title: args.conceptTitle,
      slug: `${args.id}-concept-slug`,
      unit: {
        order: args.unitOrder,
        title: args.unitTitle,
        course: {
          title: args.courseTitle,
        },
      },
    },
  }
}
