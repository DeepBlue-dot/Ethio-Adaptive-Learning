import { prisma } from "@/lib/prisma"

import { assertAcyclicPrerequisiteSelection } from "@/lib/adaptive/graph"
import { rebuildConceptClosureForCourse } from "@/lib/curriculum-graph"

import type {
  CreateConceptChunkInput,
  CreateConceptDraftInput,
  CreateConceptInput,
  CreateWorkedExampleInput,
  SetConceptPrerequisitesInput,
} from "@/lib/curriculum/types"
import {
  deleteConceptDependencies,
  optionalId,
  optionalText,
  requireId,
  requirePositiveInteger,
  requireProbability,
  requireText,
  resolveConceptChunkSlug,
  resolveConceptSlug,
  resolveWorkedExampleSlug,
} from "@/lib/curriculum/shared"

export async function createConceptDraft(input: CreateConceptDraftInput) {
  return createConcept({
    unitId: input.unitId,
    title: input.title,
    slug: input.slug,
    unlockThreshold: 0.9,
    pLo: 0.15,
    pT: 0.1,
    pG: 0.2,
    pS: 0.1,
    decayLambda: 0.01,
    description: null,
    contentBody: null,
  })
}

export async function createConcept(input: CreateConceptInput) {
  const unitId = requireId(input.unitId, "Unit")
  const title = requireText(input.title, "Concept title")
  const unlockThreshold = requireProbability(input.unlockThreshold, "Unlock threshold")
  const pLo = requireProbability(input.pLo, "P(L0)")
  const pT = requireProbability(input.pT, "P(T)")
  const pG = requireProbability(input.pG, "P(G)")
  const pS = requireProbability(input.pS, "P(S)")
  const decayLambda = requireProbability(input.decayLambda, "Decay lambda")
  const slug = await resolveConceptSlug({
    unitId,
    title,
    slug: input.slug,
  })

  return prisma.concept.create({
    data: {
      unitId,
      slug,
      title,
      description: optionalText(input.description),
      contentBody: optionalText(input.contentBody),
      unlockThreshold,
      pLo,
      pT,
      pG,
      pS,
      decayLambda,
    },
  })
}

export async function updateConcept(conceptId: string, input: CreateConceptInput) {
  const id = requireId(conceptId, "Concept")
  const unitId = requireId(input.unitId, "Unit")
  const title = requireText(input.title, "Concept title")
  const unlockThreshold = requireProbability(input.unlockThreshold, "Unlock threshold")
  const pLo = requireProbability(input.pLo, "P(L0)")
  const pT = requireProbability(input.pT, "P(T)")
  const pG = requireProbability(input.pG, "P(G)")
  const pS = requireProbability(input.pS, "P(S)")
  const decayLambda = requireProbability(input.decayLambda, "Decay lambda")
  const slug = await resolveConceptSlug({
    unitId,
    title,
    slug: input.slug,
    excludeId: id,
  })

  return prisma.concept.update({
    where: {
      id,
    },
    data: {
      unitId,
      slug,
      title,
      description: optionalText(input.description),
      contentBody: optionalText(input.contentBody),
      unlockThreshold,
      pLo,
      pT,
      pG,
      pS,
      decayLambda,
    },
  })
}

export async function deleteConcept(conceptId: string) {
  const id = requireId(conceptId, "Concept")
  const concept = await prisma.concept.findUnique({
    where: {
      id,
    },
    select: {
      unit: {
        select: {
          courseId: true,
        },
      },
    },
  })

  return prisma.$transaction(async (tx) => {
    await deleteConceptDependencies([id], tx)
    const deletedConcept = await tx.concept.delete({
      where: {
        id,
      },
    })

    if (concept) {
      await rebuildConceptClosureForCourse(concept.unit.courseId, tx)
    }

    return deletedConcept
  })
}

export async function setConceptPrerequisites(input: SetConceptPrerequisitesInput) {
  const conceptId = requireId(input.conceptId, "Concept")
  const prerequisiteConceptIds = [...new Set(input.prerequisiteConceptIds.map((id) => id.trim()).filter(Boolean))]

  const concept = await prisma.concept.findUnique({
    where: {
      id: conceptId,
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

  if (!concept) {
    throw new Error("Concept not found.")
  }

  const prerequisiteConcepts = prerequisiteConceptIds.length
    ? await prisma.concept.findMany({
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
      (prerequisiteConcept) => prerequisiteConcept.unit.courseId !== concept.unit.courseId
    )
  ) {
    throw new Error("Prerequisites must belong to the same course as the concept.")
  }

  const existingEdges = await prisma.conceptPrerequisite.findMany({
    where: {
      dependentConcept: {
        unit: {
          courseId: concept.unit.courseId,
        },
      },
    },
    select: {
      prerequisiteConceptId: true,
      dependentConceptId: true,
    },
  })

  assertAcyclicPrerequisiteSelection({
    conceptId,
    prerequisiteConceptIds,
    existingEdges,
  })

  return prisma.$transaction(async (tx) => {
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

    await rebuildConceptClosureForCourse(concept.unit.courseId, tx)

    return tx.conceptPrerequisite.findMany({
      where: {
        dependentConceptId: conceptId,
      },
    })
  })
}

export async function createConceptChunk(input: CreateConceptChunkInput) {
  const conceptId = requireId(input.conceptId, "Concept")
  const title = requireText(input.title, "Chunk title")
  const authorId = optionalId(input.authorId)
  const slug = await resolveConceptChunkSlug({
    conceptId,
    title,
    slug: input.slug,
  })

  return prisma.conceptChunk.create({
    data: {
      conceptId,
      slug,
      title,
      bodyMd: requireText(input.bodyMd, "Chunk body"),
      order: requirePositiveInteger(input.order, "Chunk order"),
      authorId,
    },
  })
}

export async function updateConceptChunk(chunkId: string, input: CreateConceptChunkInput) {
  const id = requireId(chunkId, "Explanation chunk")
  const conceptId = requireId(input.conceptId, "Concept")
  const title = requireText(input.title, "Chunk title")
  const authorId = optionalId(input.authorId)
  const slug = await resolveConceptChunkSlug({
    conceptId,
    title,
    slug: input.slug,
    excludeId: id,
  })

  return prisma.conceptChunk.update({
    where: {
      id,
    },
    data: {
      conceptId,
      slug,
      title,
      bodyMd: requireText(input.bodyMd, "Chunk body"),
      order: requirePositiveInteger(input.order, "Chunk order"),
      authorId,
    },
  })
}

export async function deleteConceptChunk(chunkId: string) {
  return prisma.conceptChunk.delete({
    where: {
      id: requireId(chunkId, "Explanation chunk"),
    },
  })
}

export async function createWorkedExample(input: CreateWorkedExampleInput) {
  const conceptId = requireId(input.conceptId, "Concept")
  const title = requireText(input.title, "Worked example title")
  const authorId = optionalId(input.authorId)
  const slug = await resolveWorkedExampleSlug({
    conceptId,
    title,
    slug: input.slug,
  })

  return prisma.workedExample.create({
    data: {
      conceptId,
      slug,
      title,
      problemMd: requireText(input.problemMd, "Worked example problem"),
      solutionMd: requireText(input.solutionMd, "Worked example solution"),
      order: requirePositiveInteger(input.order, "Worked example order"),
      authorId,
    },
  })
}

export async function updateWorkedExample(exampleId: string, input: CreateWorkedExampleInput) {
  const id = requireId(exampleId, "Worked example")
  const conceptId = requireId(input.conceptId, "Concept")
  const title = requireText(input.title, "Worked example title")
  const authorId = optionalId(input.authorId)
  const slug = await resolveWorkedExampleSlug({
    conceptId,
    title,
    slug: input.slug,
    excludeId: id,
  })

  return prisma.workedExample.update({
    where: {
      id,
    },
    data: {
      conceptId,
      slug,
      title,
      problemMd: requireText(input.problemMd, "Worked example problem"),
      solutionMd: requireText(input.solutionMd, "Worked example solution"),
      order: requirePositiveInteger(input.order, "Worked example order"),
      authorId,
    },
  })
}

export async function deleteWorkedExample(exampleId: string) {
  return prisma.workedExample.delete({
    where: {
      id: requireId(exampleId, "Worked example"),
    },
  })
}
