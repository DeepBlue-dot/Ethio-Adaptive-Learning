import type { CurriculumFilters } from "@/lib/curriculum/types"
import { prisma } from "@/lib/prisma"

import { requireId } from "./shared"

export async function getQuestionBankCmsData(filters: CurriculumFilters = {}) {
  const [courses, questions] = await Promise.all([
    prisma.course.findMany({
      where: {
        archivedAt: null,
      },
      include: {
        units: {
          orderBy: {
            order: "asc",
          },
          include: {
            concepts: {
              orderBy: {
                title: "asc",
              },
              select: {
                id: true,
                slug: true,
                title: true,
                unitId: true,
              },
            },
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    }),
    prisma.question.findMany({
      where: {
        conceptId: filters.conceptId,
        concept: {
          unitId: filters.unitId,
          unit: {
            courseId: filters.courseId,
            course: {
              archivedAt: null,
            },
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            role: true,
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
    }),
  ])

  const sortedQuestions = [...questions].sort((left, right) => {
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
  })

  return {
    courses,
    questions: sortedQuestions,
  }
}

export async function getQuestionEditorCmsData(questionId?: string) {
  const courses = await prisma.course.findMany({
    where: {
      archivedAt: null,
    },
    include: {
      units: {
        orderBy: {
          order: "asc",
        },
        include: {
          concepts: {
            orderBy: {
              title: "asc",
            },
            select: {
              id: true,
              slug: true,
              title: true,
              unitId: true,
            },
          },
        },
      },
    },
    orderBy: {
      title: "asc",
    },
  })

  const question = questionId
    ? await prisma.question.findUnique({
        where: {
          id: requireId(questionId, "Question"),
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              role: true,
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
    : null

  if (questionId && !question) {
    throw new Error("Question not found.")
  }

  const conceptOptions = courses.flatMap((course) =>
    course.units.flatMap((unit) =>
      unit.concepts.map((concept) => ({
        id: concept.id,
        title: concept.title,
        slug: concept.slug,
        courseId: course.id,
        courseTitle: course.title,
        unitId: unit.id,
        unitTitle: unit.title,
        unitOrder: unit.order,
      }))
    )
  )

  return {
    courses,
    conceptOptions,
    question,
  }
}
