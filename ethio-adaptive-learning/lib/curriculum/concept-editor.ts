import { prisma } from "@/lib/prisma"

import { saveConceptEditorTransaction } from "@/lib/curriculum/saveConceptEditor"
import { requireId } from "@/lib/curriculum/shared"
import type { SaveConceptEditorInput } from "@/lib/curriculum/types"

export async function getConceptEditorCmsData(conceptId: string) {
  const id = requireId(conceptId, "Concept")
  const concept = await prisma.concept.findUnique({
    where: {
      id,
    },
    include: {
      unit: {
        include: {
          course: {
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
                      title: true,
                      slug: true,
                      unitId: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      prerequisiteEdges: {
        orderBy: {
          prerequisiteConcept: {
            title: "asc",
          },
        },
        include: {
          prerequisiteConcept: {
            select: {
              id: true,
              title: true,
              slug: true,
              unitId: true,
            },
          },
        },
      },
      chunks: {
        orderBy: {
          order: "asc",
        },
      },
      workedExamples: {
        orderBy: {
          order: "asc",
        },
      },
      questions: {
        select: {
          id: true,
        },
      },
    },
  })

  if (!concept) {
    throw new Error("Concept not found.")
  }

  const course = concept.unit.course
  const unitOptions = course.units.map((unit) => ({
    id: unit.id,
    title: unit.title,
    order: unit.order,
  }))
  const prerequisiteOptions = course.units.flatMap((unit) =>
    unit.concepts
      .filter((candidate) => candidate.id !== concept.id)
      .map((candidate) => ({
        id: candidate.id,
        title: candidate.title,
        slug: candidate.slug,
        unitTitle: unit.title,
        unitOrder: unit.order,
      }))
  )

  return {
    concept,
    course: {
      id: course.id,
      title: course.title,
      slug: course.slug,
      archivedAt: course.archivedAt,
    },
    unitOptions,
    prerequisiteOptions,
  }
}

export async function saveConceptEditor(input: SaveConceptEditorInput) {
  return saveConceptEditorTransaction(input)
}
