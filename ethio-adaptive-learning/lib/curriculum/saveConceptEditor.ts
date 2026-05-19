import { validatePrerequisiteSelection } from "@/lib/adaptive/graph"
import { rebuildConceptClosureForCourse } from "@/lib/curriculum-graph"
import { prisma } from "@/lib/prisma"

import type { SaveConceptEditorInput } from "@/lib/curriculum/types"
import {
  optionalText,
  requireId,
  requireProbability,
  requireText,
  resolveConceptSlug,
} from "@/lib/curriculum/shared"

export async function saveConceptEditorTransaction(input: SaveConceptEditorInput) {
  const conceptId = requireId(input.conceptId, "Concept")

  return prisma.$transaction(async (tx) => {
    const concept = await tx.concept.findUnique({
      where: {
        id: conceptId,
      },
      include: {
        unit: {
          select: {
            courseId: true,
          },
        },
      },
    })

    if (!concept) {
      throw new Error("Concept not found.")
    }

    const targetUnitId = requireId(input.unitId, "Unit")
    const targetUnit = await tx.unit.findUnique({
      where: {
        id: targetUnitId,
      },
      select: {
        id: true,
        courseId: true,
      },
    })

    if (!targetUnit) {
      throw new Error("Unit not found.")
    }

    if (targetUnit.courseId !== concept.unit.courseId) {
      throw new Error("Concepts can only be moved within the same course.")
    }

    const prerequisiteConceptIds = [...new Set(input.prerequisiteConceptIds.map((id) => id.trim()).filter(Boolean))]
    const prerequisiteConcepts = prerequisiteConceptIds.length
      ? await tx.concept.findMany({
          where: {
            id: {
              in: prerequisiteConceptIds,
            },
          },
          select: {
            id: true,
            unit: {
              select: {
                courseId: true,
              },
            },
          },
        })
      : []

    if (prerequisiteConcepts.length !== prerequisiteConceptIds.length) {
      throw new Error("One or more prerequisite concepts could not be found.")
    }

    if (
      prerequisiteConcepts.some(
        (prerequisiteConcept) => prerequisiteConcept.unit.courseId !== targetUnit.courseId
      )
    ) {
      throw new Error("Prerequisites must belong to the same course as the concept.")
    }

    const existingEdges = await tx.conceptPrerequisite.findMany({
      where: {
        dependentConcept: {
          unit: {
            courseId: targetUnit.courseId,
          },
        },
      },
      select: {
        prerequisiteConceptId: true,
        dependentConceptId: true,
      },
    })

    validatePrerequisiteSelection({
      conceptId,
      prerequisiteConceptIds,
      existingEdges,
    })

    const conceptSlug = await resolveConceptSlug({
      unitId: targetUnitId,
      title: input.title,
      slug: input.slug,
      excludeId: conceptId,
      db: tx,
    })

    const updatedConcept = await tx.concept.update({
      where: {
        id: conceptId,
      },
      data: {
        unitId: targetUnitId,
        slug: conceptSlug,
        title: requireText(input.title, "Concept title"),
        description: optionalText(input.description),
        contentBody: optionalText(input.contentBody),
        contentBlocks: input.contentBlocks ?? [],
        unlockThreshold: requireProbability(input.unlockThreshold, "Unlock threshold"),
        pLo: requireProbability(input.pLo, "P(L0)"),
        pT: requireProbability(input.pT, "P(T)"),
        pG: requireProbability(input.pG, "P(G)"),
        pS: requireProbability(input.pS, "P(S)"),
        decayLambda: requireProbability(input.decayLambda, "Decay lambda"),
      },
    })

    await tx.conceptPrerequisite.deleteMany({
      where: {
        dependentConceptId: conceptId,
      },
    })

    if (prerequisiteConceptIds.length) {
      await tx.conceptPrerequisite.createMany({
        data: prerequisiteConceptIds.map((prerequisiteConceptId) => ({
          prerequisiteConceptId,
          dependentConceptId: conceptId,
        })),
      })
    }

    await rebuildConceptClosureForCourse(targetUnit.courseId, tx)

    return updatedConcept
  })
}
