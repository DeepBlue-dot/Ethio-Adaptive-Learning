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
  questionFindFirst: vi.fn(),
  prerequisiteFindMany: vi.fn(),
  transaction: vi.fn(),
  txConceptFindUnique: vi.fn(),
  txConceptFindMany: vi.fn(),
  txConceptFindFirst: vi.fn(),
  txConceptUpdate: vi.fn(),
  txUnitFindUnique: vi.fn(),
  txPrerequisiteFindMany: vi.fn(),
  txPrerequisiteDeleteMany: vi.fn(),
  txPrerequisiteCreateMany: vi.fn(),
  txChunkDeleteMany: vi.fn(),
  txChunkUpdate: vi.fn(),
  txChunkCreate: vi.fn(),
  txChunkFindFirst: vi.fn(),
  txExampleDeleteMany: vi.fn(),
  txExampleUpdate: vi.fn(),
  txExampleCreate: vi.fn(),
  txExampleFindFirst: vi.fn(),
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
  createConceptDraft,
  createCourse,
  saveConceptEditor,
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
    mocks.txConceptFindFirst.mockResolvedValue(null)
    mocks.txChunkFindFirst.mockResolvedValue(null)
    mocks.txExampleFindFirst.mockResolvedValue(null)
    mocks.rebuildConceptClosureForCourse.mockResolvedValue([])

    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        concept: {
          findUnique: mocks.txConceptFindUnique,
          findMany: mocks.txConceptFindMany,
          findFirst: mocks.txConceptFindFirst,
          update: mocks.txConceptUpdate,
        },
        unit: {
          findUnique: mocks.txUnitFindUnique,
        },
        conceptPrerequisite: {
          findMany: mocks.txPrerequisiteFindMany,
          deleteMany: mocks.txPrerequisiteDeleteMany,
          createMany: mocks.txPrerequisiteCreateMany,
        },
        conceptChunk: {
          findFirst: mocks.txChunkFindFirst,
          deleteMany: mocks.txChunkDeleteMany,
          update: mocks.txChunkUpdate,
          create: mocks.txChunkCreate,
        },
        workedExample: {
          findFirst: mocks.txExampleFindFirst,
          deleteMany: mocks.txExampleDeleteMany,
          update: mocks.txExampleUpdate,
          create: mocks.txExampleCreate,
        },
      })
    )
  })

  it("creates a course with a valid CMS author and preserves a provided slug", async () => {
    mocks.userFindUnique.mockResolvedValueOnce({ role: "COURSE_WRITER" })
    mocks.courseCreate.mockResolvedValueOnce({ id: "course_1" })

    await createCourse({
      title: " Grade 12 Mathematics ",
      description: " Core exam preparation ",
      authorId: "writer_1",
      slug: "grade-12-math-custom",
    })

    expect(mocks.courseCreate).toHaveBeenCalledWith({
      data: {
        slug: "grade-12-math-custom",
        title: "Grade 12 Mathematics",
        description: "Core exam preparation",
        authorId: "writer_1",
      },
    })
  })

  it("creates concept drafts with generated slugs and default adaptive parameters", async () => {
    mocks.conceptCreate.mockResolvedValueOnce({ id: "concept_1" })

    await createConceptDraft({
      unitId: "unit_1",
      title: " Limits ",
    })

    expect(mocks.conceptCreate).toHaveBeenCalledWith({
      data: {
        unitId: "unit_1",
        slug: "limits",
        title: "Limits",
        description: null,
        contentBody: null,
        unlockThreshold: 0.9,
        pLo: 0.15,
        pT: 0.1,
        pG: 0.2,
        pS: 0.1,
        decayLambda: 0.01,
      },
    })
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

  it("enforces same-course prerequisite selection during concept editor saves", async () => {
    mocks.txConceptFindUnique.mockResolvedValueOnce({
      id: "concept_1",
      unit: {
        courseId: "course_1",
      },
      chunks: [],
      workedExamples: [],
    })
    mocks.txUnitFindUnique.mockResolvedValueOnce({
      id: "unit_1",
      courseId: "course_1",
    })
    mocks.txConceptFindMany.mockResolvedValueOnce([
      {
        id: "concept_foreign",
        unit: {
          courseId: "course_2",
        },
      },
    ])

    await expect(
      saveConceptEditor({
        conceptId: "concept_1",
        unitId: "unit_1",
        title: "Limits",
        slug: null,
        description: null,
        contentBody: null,
        unlockThreshold: 0.9,
        pLo: 0.15,
        pT: 0.1,
        pG: 0.2,
        pS: 0.1,
        decayLambda: 0.01,
        prerequisiteConceptIds: ["concept_foreign"],
        chunks: [],
        workedExamples: [],
        authorId: "writer_1",
      })
    ).rejects.toThrow("Prerequisites must belong to the same course as the concept.")
  })

  it("rejects moves across courses during concept editor saves", async () => {
    mocks.txConceptFindUnique.mockResolvedValueOnce({
      id: "concept_1",
      unit: {
        courseId: "course_1",
      },
      chunks: [],
      workedExamples: [],
    })
    mocks.txUnitFindUnique.mockResolvedValueOnce({
      id: "unit_foreign",
      courseId: "course_2",
    })

    await expect(
      saveConceptEditor({
        conceptId: "concept_1",
        unitId: "unit_foreign",
        title: "Limits",
        slug: null,
        description: null,
        contentBody: null,
        unlockThreshold: 0.9,
        pLo: 0.15,
        pT: 0.1,
        pG: 0.2,
        pS: 0.1,
        decayLambda: 0.01,
        prerequisiteConceptIds: [],
        chunks: [],
        workedExamples: [],
        authorId: "writer_1",
      })
    ).rejects.toThrow("Concepts can only be moved within the same course.")
  })

  it("updates concept content atomically and rebuilds closure rows after prerequisite changes", async () => {
    mocks.txConceptFindUnique.mockResolvedValueOnce({
      id: "concept_1",
      unit: {
        courseId: "course_1",
      },
      chunks: [{ id: "chunk_1" }, { id: "chunk_2" }],
      workedExamples: [{ id: "example_1" }, { id: "example_2" }],
    })
    mocks.txUnitFindUnique.mockResolvedValueOnce({
      id: "unit_1",
      courseId: "course_1",
    })
    mocks.txConceptFindMany.mockResolvedValueOnce([
      {
        id: "concept_pre",
        unit: {
          courseId: "course_1",
        },
      },
    ])
    mocks.txPrerequisiteFindMany.mockResolvedValueOnce([])
    mocks.txConceptUpdate.mockResolvedValueOnce({ id: "concept_1" })

    await saveConceptEditor({
      conceptId: "concept_1",
      unitId: "unit_1",
      title: "Limits",
      slug: null,
      description: "Intro to limits",
      contentBody: "Markdown body",
      unlockThreshold: 0.9,
      pLo: 0.15,
      pT: 0.1,
      pG: 0.2,
      pS: 0.1,
      decayLambda: 0.01,
      prerequisiteConceptIds: ["concept_pre"],
      chunks: [
        {
          id: "chunk_1",
          title: "What a limit describes",
          slug: "what-a-limit-describes",
          bodyMd: "Updated chunk body",
          order: 1,
        },
        {
          title: "Direct substitution",
          slug: "",
          bodyMd: "New chunk body",
          order: 2,
        },
      ],
      workedExamples: [
        {
          id: "example_1",
          title: "Evaluate a polynomial limit",
          slug: "evaluate-a-polynomial-limit",
          problemMd: "Problem",
          solutionMd: "Updated solution",
          order: 1,
        },
        {
          title: "Estimate from a table",
          slug: "",
          problemMd: "New problem",
          solutionMd: "New solution",
          order: 2,
        },
      ],
      authorId: "writer_1",
    })

    expect(mocks.txConceptUpdate).toHaveBeenCalledWith({
      where: {
        id: "concept_1",
      },
      data: {
        unitId: "unit_1",
        slug: "limits",
        title: "Limits",
        description: "Intro to limits",
        contentBody: "Markdown body",
        unlockThreshold: 0.9,
        pLo: 0.15,
        pT: 0.1,
        pG: 0.2,
        pS: 0.1,
        decayLambda: 0.01,
      },
    })
    expect(mocks.txPrerequisiteDeleteMany).toHaveBeenCalledWith({
      where: {
        dependentConceptId: "concept_1",
      },
    })
    expect(mocks.txPrerequisiteCreateMany).toHaveBeenCalledWith({
      data: [
        {
          prerequisiteConceptId: "concept_pre",
          dependentConceptId: "concept_1",
        },
      ],
    })
    expect(mocks.txChunkDeleteMany).toHaveBeenCalledWith({
      where: {
        conceptId: "concept_1",
        id: {
          in: ["chunk_2"],
        },
      },
    })
    expect(mocks.txChunkUpdate).toHaveBeenCalledWith({
      where: {
        id: "chunk_1",
      },
      data: {
        conceptId: "concept_1",
        slug: "what-a-limit-describes",
        title: "What a limit describes",
        bodyMd: "Updated chunk body",
        order: 1,
        authorId: "writer_1",
      },
    })
    expect(mocks.txChunkCreate).toHaveBeenCalledWith({
      data: {
        conceptId: "concept_1",
        slug: "direct-substitution",
        title: "Direct substitution",
        bodyMd: "New chunk body",
        order: 2,
        authorId: "writer_1",
      },
    })
    expect(mocks.txExampleUpdate).toHaveBeenCalledWith({
      where: {
        id: "example_1",
      },
      data: {
        conceptId: "concept_1",
        slug: "evaluate-a-polynomial-limit",
        title: "Evaluate a polynomial limit",
        problemMd: "Problem",
        solutionMd: "Updated solution",
        order: 1,
        authorId: "writer_1",
      },
    })
    expect(mocks.txExampleDeleteMany).toHaveBeenCalledWith({
      where: {
        conceptId: "concept_1",
        id: {
          in: ["example_2"],
        },
      },
    })
    expect(mocks.txExampleCreate).toHaveBeenCalledWith({
      data: {
        conceptId: "concept_1",
        slug: "estimate-from-a-table",
        title: "Estimate from a table",
        problemMd: "New problem",
        solutionMd: "New solution",
        order: 2,
        authorId: "writer_1",
      },
    })
    expect(mocks.rebuildConceptClosureForCourse).toHaveBeenCalledWith(
      "course_1",
      expect.anything()
    )
  })
})
