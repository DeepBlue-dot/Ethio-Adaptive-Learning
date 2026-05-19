import { formatDistractorsForTextarea } from "@/lib/curriculum/question"
import {
  createCurriculumCmsItem,
  deleteCurriculumCmsItem,
  getCmsAuthors,
  getConceptEditorCmsData,
  updateCurriculumCmsItem,
} from "@/lib/cms/adapters/curriculum"
import type {
  CmsContentTypeKey,
  CmsEntity,
  CmsListFilter,
  CmsReferenceOptions,
  CmsRepository,
} from "@/lib/cms/types"
import { prisma } from "@/lib/prisma"

export const prismaCmsRepository: CmsRepository = {
  async createItem(type, data) {
    const result = await createCurriculumCmsItem(type, data)
    const entity = await getCmsItem(type, result.id)

    if (!entity) {
      throw new Error(`${type} was saved but could not be loaded.`)
    }

    return entity
  },
  async updateItem(type, id, data) {
    await updateCurriculumCmsItem(type, id, data)
    const entity = await getCmsItem(type, id)

    if (!entity) {
      throw new Error(`${type} was saved but could not be loaded.`)
    }

    return entity
  },
  async deleteItem(type, id) {
    const entity = await getCmsItem(type, id)

    if (!entity) {
      throw new Error(`${type} not found.`)
    }

    await deleteCurriculumCmsItem(type, id)

    return entity
  },
  getItem: getCmsItem,
  listItems: listCmsItems,
  getReferenceOptions,
}

async function listCmsItems(type: CmsContentTypeKey, filter: CmsListFilter = {}) {
  switch (type) {
    case "course":
      return listCourses()
    case "unit":
      return listUnits(filter)
    case "concept":
      return listConcepts(filter)
    case "question":
      return listQuestions(filter)
    case "chunk":
      return listChunks(filter)
    case "worked-example":
      return listWorkedExamples(filter)
  }
}

async function getCmsItem(type: CmsContentTypeKey, id: string) {
  switch (type) {
    case "course":
      return getCourseItem(id)
    case "unit":
      return getUnitItem(id)
    case "concept":
      return getConceptItem(id)
    case "question":
      return getQuestionItem(id)
    case "chunk":
      return getChunkItem(id)
    case "worked-example":
      return getWorkedExampleItem(id)
  }
}

async function listCourses() {
  const courses = await prisma.course.findMany({
    include: {
      author: {
        select: {
          username: true,
        },
      },
      _count: {
        select: {
          units: true,
        },
      },
    },
    orderBy: [
      {
        archivedAt: "asc",
      },
      {
        title: "asc",
      },
    ],
  })

  return courses.map((course) =>
    createEntity("course", course.id, course.title, {
      slug: course.slug,
      title: course.title,
      description: course.description ?? "",
      authorId: course.authorId ?? "",
      authorLabel: course.author?.username ?? "Unassigned",
      archived: course.archivedAt ? "archived" : "active",
      unitCount: course._count.units,
    })
  )
}

async function getCourseItem(id: string) {
  const course = await prisma.course.findUnique({
    where: {
      id,
    },
    include: {
      author: {
        select: {
          username: true,
        },
      },
      _count: {
        select: {
          units: true,
        },
      },
    },
  })

  if (!course) {
    return null
  }

  return createEntity("course", course.id, course.title, {
    slug: course.slug,
    title: course.title,
    description: course.description ?? "",
    authorId: course.authorId ?? "",
    authorLabel: course.author?.username ?? "Unassigned",
    archived: course.archivedAt ? "archived" : "active",
    unitCount: course._count.units,
  })
}

async function listUnits(filter: CmsListFilter) {
  const units = await prisma.unit.findMany({
    where: {
      courseId: filter.courseId,
    },
    include: {
      course: true,
      _count: {
        select: {
          concepts: true,
        },
      },
    },
    orderBy: [
      {
        course: {
          title: "asc",
        },
      },
      {
        order: "asc",
      },
    ],
  })

  return units.map((unit) =>
    createEntity("unit", unit.id, unit.title, {
      courseId: unit.courseId,
      courseLabel: unit.course.title,
      title: unit.title,
      slug: unit.slug,
      order: unit.order,
      conceptCount: unit._count.concepts,
    })
  )
}

async function getUnitItem(id: string) {
  const unit = await prisma.unit.findUnique({
    where: {
      id,
    },
    include: {
      course: true,
      _count: {
        select: {
          concepts: true,
        },
      },
    },
  })

  if (!unit) {
    return null
  }

  return createEntity("unit", unit.id, unit.title, {
    courseId: unit.courseId,
    courseLabel: unit.course.title,
    title: unit.title,
    slug: unit.slug,
    order: unit.order,
    conceptCount: unit._count.concepts,
  })
}

async function listConcepts(filter: CmsListFilter) {
  const concepts = await prisma.concept.findMany({
    where: {
      unitId: filter.unitId,
      unit: {
        courseId: filter.courseId,
      },
    },
    include: {
      unit: {
        include: {
          course: true,
        },
      },
      _count: {
        select: {
          prerequisiteEdges: true,
          chunks: true,
          workedExamples: true,
          questions: true,
        },
      },
    },
    orderBy: [
      {
        unit: {
          course: {
            title: "asc",
          },
        },
      },
      {
        unit: {
          order: "asc",
        },
      },
      {
        title: "asc",
      },
    ],
  })

  return concepts.map((concept) =>
    createEntity("concept", concept.id, concept.title, {
      unitId: concept.unitId,
      unitLabel: `Unit ${concept.unit.order}: ${concept.unit.title}`,
      courseLabel: concept.unit.course.title,
      title: concept.title,
      slug: concept.slug,
      description: concept.description ?? "",
      contentBody: concept.contentBody ?? "",
      unlockThreshold: concept.unlockThreshold,
      pLo: concept.pLo,
      pT: concept.pT,
      pG: concept.pG,
      pS: concept.pS,
      decayLambda: concept.decayLambda,
      prerequisiteCount: concept._count.prerequisiteEdges,
      chunkCount: concept._count.chunks,
      workedExampleCount: concept._count.workedExamples,
      questionCount: concept._count.questions,
    })
  )
}

async function getConceptItem(id: string) {
  const data = await getConceptEditorCmsData(id)
  const concept = data.concept

  return createEntity("concept", concept.id, concept.title, {
    unitId: concept.unitId,
    unitLabel: `Unit ${concept.unit.order}: ${concept.unit.title}`,
    courseLabel: data.course.title,
    title: concept.title,
    slug: concept.slug,
    description: concept.description ?? "",
    contentBody: concept.contentBody ?? "",
    unlockThreshold: concept.unlockThreshold,
    pLo: concept.pLo,
    pT: concept.pT,
    pG: concept.pG,
    pS: concept.pS,
    decayLambda: concept.decayLambda,
    prerequisiteConceptIds: concept.prerequisiteEdges.map((edge) => edge.prerequisiteConceptId),
    chunks: concept.chunks.map((chunk) => ({
      id: chunk.id,
      title: chunk.title,
      slug: chunk.slug,
      bodyMd: chunk.bodyMd,
      order: chunk.order,
    })),
    workedExamples: concept.workedExamples.map((example) => ({
      id: example.id,
      title: example.title,
      slug: example.slug,
      problemMd: example.problemMd,
      solutionMd: example.solutionMd,
      order: example.order,
    })),
    questionCount: concept.questions.length,
  })
}

async function listQuestions(filter: CmsListFilter) {
  const questions = await prisma.question.findMany({
    where: {
      conceptId: filter.conceptId,
      concept: {
        unitId: filter.unitId,
        unit: {
          courseId: filter.courseId,
        },
      },
    },
    include: {
      author: {
        select: {
          username: true,
        },
      },
      concept: {
        include: {
          unit: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  })

  return questions
    .sort(sortByConceptPath)
    .map((question) =>
      createEntity("question", question.id, preview(question.content), {
        conceptId: question.conceptId,
        conceptLabel: question.concept.title,
        unitLabel: `Unit ${question.concept.unit.order}: ${question.concept.unit.title}`,
        courseLabel: question.concept.unit.course.title,
        usage: question.usage,
        difficulty: question.difficulty,
        content: question.content,
        correctAnswer: question.correctAnswer,
        distractors: formatDistractorsForTextarea(question.distractors),
        hintText: question.hintText ?? "",
        explanation: question.explanation ?? "",
        slug: question.slug,
        authorLabel: question.author?.username ?? "Unassigned",
      })
    )
}

async function getQuestionItem(id: string) {
  const question = await prisma.question.findUnique({
    where: {
      id,
    },
    include: {
      author: {
        select: {
          username: true,
        },
      },
      concept: {
        include: {
          unit: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  })

  if (!question) {
    return null
  }

  return createEntity("question", question.id, preview(question.content), {
    conceptId: question.conceptId,
    conceptLabel: question.concept.title,
    unitLabel: `Unit ${question.concept.unit.order}: ${question.concept.unit.title}`,
    courseLabel: question.concept.unit.course.title,
    usage: question.usage,
    difficulty: question.difficulty,
    content: question.content,
    correctAnswer: question.correctAnswer,
    distractors: formatDistractorsForTextarea(question.distractors),
    hintText: question.hintText ?? "",
    explanation: question.explanation ?? "",
    slug: question.slug,
    authorLabel: question.author?.username ?? "Unassigned",
  })
}

async function listChunks(filter: CmsListFilter) {
  const chunks = await prisma.conceptChunk.findMany({
    where: {
      conceptId: filter.conceptId,
      concept: {
        unitId: filter.unitId,
        unit: {
          courseId: filter.courseId,
        },
      },
    },
    include: {
      author: {
        select: {
          username: true,
        },
      },
      concept: {
        include: {
          unit: {
            include: {
              course: true,
            },
          },
        },
      },
    },
    orderBy: [
      {
        concept: {
          title: "asc",
        },
      },
      {
        order: "asc",
      },
    ],
  })

  return chunks.map((chunk) =>
    createEntity("chunk", chunk.id, chunk.title, {
      conceptId: chunk.conceptId,
      conceptLabel: chunk.concept.title,
      unitLabel: `Unit ${chunk.concept.unit.order}: ${chunk.concept.unit.title}`,
      courseLabel: chunk.concept.unit.course.title,
      title: chunk.title,
      slug: chunk.slug,
      bodyMd: chunk.bodyMd,
      order: chunk.order,
      authorLabel: chunk.author?.username ?? "Unassigned",
    })
  )
}

async function getChunkItem(id: string) {
  const chunk = await prisma.conceptChunk.findUnique({
    where: {
      id,
    },
    include: {
      author: {
        select: {
          username: true,
        },
      },
      concept: {
        include: {
          unit: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  })

  if (!chunk) {
    return null
  }

  return createEntity("chunk", chunk.id, chunk.title, {
    conceptId: chunk.conceptId,
    conceptLabel: chunk.concept.title,
    unitLabel: `Unit ${chunk.concept.unit.order}: ${chunk.concept.unit.title}`,
    courseLabel: chunk.concept.unit.course.title,
    title: chunk.title,
    slug: chunk.slug,
    bodyMd: chunk.bodyMd,
    order: chunk.order,
    authorLabel: chunk.author?.username ?? "Unassigned",
  })
}

async function listWorkedExamples(filter: CmsListFilter) {
  const examples = await prisma.workedExample.findMany({
    where: {
      conceptId: filter.conceptId,
      concept: {
        unitId: filter.unitId,
        unit: {
          courseId: filter.courseId,
        },
      },
    },
    include: {
      author: {
        select: {
          username: true,
        },
      },
      concept: {
        include: {
          unit: {
            include: {
              course: true,
            },
          },
        },
      },
    },
    orderBy: [
      {
        concept: {
          title: "asc",
        },
      },
      {
        order: "asc",
      },
    ],
  })

  return examples.map((example) =>
    createEntity("worked-example", example.id, example.title, {
      conceptId: example.conceptId,
      conceptLabel: example.concept.title,
      unitLabel: `Unit ${example.concept.unit.order}: ${example.concept.unit.title}`,
      courseLabel: example.concept.unit.course.title,
      title: example.title,
      slug: example.slug,
      problemMd: example.problemMd,
      solutionMd: example.solutionMd,
      order: example.order,
      authorLabel: example.author?.username ?? "Unassigned",
    })
  )
}

async function getWorkedExampleItem(id: string) {
  const example = await prisma.workedExample.findUnique({
    where: {
      id,
    },
    include: {
      author: {
        select: {
          username: true,
        },
      },
      concept: {
        include: {
          unit: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  })

  if (!example) {
    return null
  }

  return createEntity("worked-example", example.id, example.title, {
    conceptId: example.conceptId,
    conceptLabel: example.concept.title,
    unitLabel: `Unit ${example.concept.unit.order}: ${example.concept.unit.title}`,
    courseLabel: example.concept.unit.course.title,
    title: example.title,
    slug: example.slug,
    problemMd: example.problemMd,
    solutionMd: example.solutionMd,
    order: example.order,
    authorLabel: example.author?.username ?? "Unassigned",
  })
}

async function getReferenceOptions(type: CmsContentTypeKey, id?: string): Promise<CmsReferenceOptions> {
  const [authors, courses, units, concepts] = await Promise.all([
    getCmsAuthors(),
    prisma.course.findMany({
      orderBy: [
        {
          archivedAt: "asc",
        },
        {
          title: "asc",
        },
      ],
    }),
    prisma.unit.findMany({
      include: {
        course: true,
      },
      orderBy: [
        {
          course: {
            title: "asc",
          },
        },
        {
          order: "asc",
        },
      ],
    }),
    prisma.concept.findMany({
      include: {
        unit: {
          include: {
            course: true,
          },
        },
      },
      orderBy: [
        {
          unit: {
            course: {
              title: "asc",
            },
          },
        },
        {
          unit: {
            order: "asc",
          },
        },
        {
          title: "asc",
        },
      ],
    }),
  ])

  const referenceOptions: CmsReferenceOptions = {
    authorId: [
      {
        label: "Unassigned",
        value: "",
      },
      ...authors.map((author) => ({
        label: `${author.username} (${author.role.replace("_", " ")})`,
        value: author.id,
      })),
    ],
    courseId: courses.map((course) => ({
      label: course.archivedAt ? `${course.title} (archived)` : course.title,
      value: course.id,
      description: course.slug,
    })),
    unitId: units.map((unit) => ({
      label: `${unit.course.title} / Unit ${unit.order}: ${unit.title}`,
      value: unit.id,
      description: unit.slug,
    })),
    conceptId: concepts.map((concept) => ({
      label: `${concept.unit.course.title} / Unit ${concept.unit.order}: ${concept.unit.title} / ${concept.title}`,
      value: concept.id,
      description: concept.slug,
    })),
    prerequisiteConceptIds: concepts.map((concept) => ({
      label: `${concept.unit.course.title} / Unit ${concept.unit.order}: ${concept.unit.title} / ${concept.title}`,
      value: concept.id,
      description: concept.slug,
    })),
  }

  if (type === "concept" && id) {
    const conceptEditorData = await getConceptEditorCmsData(id)
    referenceOptions.unitId = conceptEditorData.unitOptions.map((unit) => ({
      label: `Unit ${unit.order}: ${unit.title}`,
      value: unit.id,
    }))
    referenceOptions.prerequisiteConceptIds = conceptEditorData.prerequisiteOptions.map((concept) => ({
      label: `Unit ${concept.unitOrder}: ${concept.unitTitle} / ${concept.title}`,
      value: concept.id,
      description: concept.slug,
    }))
  }

  return referenceOptions
}

function createEntity<TData extends Record<string, unknown>>(
  type: CmsContentTypeKey,
  id: string,
  title: string,
  data: TData
): CmsEntity<TData> {
  return {
    id,
    type,
    title,
    data,
  }
}

function preview(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim()
  return normalized.length > 90 ? `${normalized.slice(0, 90)}...` : normalized
}

function sortByConceptPath<
  TQuestion extends {
    content: string
    concept: {
      title: string
      unit: {
        order: number
        title: string
        course: {
          title: string
        }
      }
    }
  },
>(left: TQuestion, right: TQuestion) {
  const courseSort = left.concept.unit.course.title.localeCompare(right.concept.unit.course.title)

  if (courseSort !== 0) {
    return courseSort
  }

  const unitSort = left.concept.unit.order - right.concept.unit.order

  if (unitSort !== 0) {
    return unitSort
  }

  const conceptSort = left.concept.title.localeCompare(right.concept.title)

  if (conceptSort !== 0) {
    return conceptSort
  }

  return left.content.localeCompare(right.content)
}
