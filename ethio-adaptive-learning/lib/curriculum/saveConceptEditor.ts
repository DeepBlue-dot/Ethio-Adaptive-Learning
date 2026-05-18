import { Prisma } from "@prisma/client"

import { validatePrerequisiteSelection } from "@/lib/adaptive/graph"
import { rebuildConceptClosureForCourse } from "@/lib/curriculum-graph"
import { prisma } from "@/lib/prisma"

import type {
  ConceptChunkEditorInput,
  SaveConceptEditorInput,
  WorkedExampleEditorInput,
} from "@/lib/curriculum/types"
import {
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

export async function saveConceptEditorTransaction(input: SaveConceptEditorInput) {
  const conceptId = requireId(input.conceptId, "Concept")
  const authorId = optionalId(input.authorId)

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
        chunks: {
          select: {
            id: true,
          },
        },
        workedExamples: {
          select: {
            id: true,
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

    await syncConceptChunks({
      tx,
      conceptId,
      inputChunks: input.chunks,
      existingChunkIds: concept.chunks.map((chunk) => chunk.id),
      authorId,
    })
    await syncWorkedExamples({
      tx,
      conceptId,
      inputExamples: input.workedExamples,
      existingExampleIds: concept.workedExamples.map((example) => example.id),
      authorId,
    })
    await rebuildConceptClosureForCourse(targetUnit.courseId, tx)

    return updatedConcept
  })
}

async function syncConceptChunks(args: {
  tx: Prisma.TransactionClient
  conceptId: string
  inputChunks: ConceptChunkEditorInput[]
  existingChunkIds: string[]
  authorId: string | null
}) {
  const validExistingIds = new Set(args.existingChunkIds)
  const submittedIds = args.inputChunks
    .map((chunk) => optionalId(chunk.id))
    .filter((value): value is string => Boolean(value))

  submittedIds.forEach((chunkId) => {
    if (!validExistingIds.has(chunkId)) {
      throw new Error("One or more explanation chunks do not belong to this concept.")
    }
  })

  const removedChunkIds = args.existingChunkIds.filter((chunkId) => !submittedIds.includes(chunkId))

  if (removedChunkIds.length) {
    await args.tx.conceptChunk.deleteMany({
      where: {
        conceptId: args.conceptId,
        id: {
          in: removedChunkIds,
        },
      },
    })
  }

  for (const chunk of args.inputChunks) {
    const chunkId = optionalId(chunk.id)
    const slug = await resolveConceptChunkSlug({
      conceptId: args.conceptId,
      title: chunk.title,
      slug: chunk.slug,
      excludeId: chunkId ?? undefined,
      db: args.tx,
    })

    if (chunkId) {
      await args.tx.conceptChunk.update({
        where: {
          id: chunkId,
        },
        data: {
          conceptId: args.conceptId,
          slug,
          title: requireText(chunk.title, "Chunk title"),
          bodyMd: requireText(chunk.bodyMd, "Chunk body"),
          order: requirePositiveInteger(chunk.order, "Chunk order"),
          authorId: args.authorId,
        },
      })
    } else {
      await args.tx.conceptChunk.create({
        data: {
          conceptId: args.conceptId,
          slug,
          title: requireText(chunk.title, "Chunk title"),
          bodyMd: requireText(chunk.bodyMd, "Chunk body"),
          order: requirePositiveInteger(chunk.order, "Chunk order"),
          authorId: args.authorId,
        },
      })
    }
  }
}

async function syncWorkedExamples(args: {
  tx: Prisma.TransactionClient
  conceptId: string
  inputExamples: WorkedExampleEditorInput[]
  existingExampleIds: string[]
  authorId: string | null
}) {
  const validExistingIds = new Set(args.existingExampleIds)
  const submittedIds = args.inputExamples
    .map((example) => optionalId(example.id))
    .filter((value): value is string => Boolean(value))

  submittedIds.forEach((exampleId) => {
    if (!validExistingIds.has(exampleId)) {
      throw new Error("One or more worked examples do not belong to this concept.")
    }
  })

  const removedExampleIds = args.existingExampleIds.filter((exampleId) => !submittedIds.includes(exampleId))

  if (removedExampleIds.length) {
    await args.tx.workedExample.deleteMany({
      where: {
        conceptId: args.conceptId,
        id: {
          in: removedExampleIds,
        },
      },
    })
  }

  for (const example of args.inputExamples) {
    const exampleId = optionalId(example.id)
    const slug = await resolveWorkedExampleSlug({
      conceptId: args.conceptId,
      title: example.title,
      slug: example.slug,
      excludeId: exampleId ?? undefined,
      db: args.tx,
    })

    if (exampleId) {
      await args.tx.workedExample.update({
        where: {
          id: exampleId,
        },
        data: {
          conceptId: args.conceptId,
          slug,
          title: requireText(example.title, "Worked example title"),
          problemMd: requireText(example.problemMd, "Worked example problem"),
          solutionMd: requireText(example.solutionMd, "Worked example solution"),
          order: requirePositiveInteger(example.order, "Worked example order"),
          authorId: args.authorId,
        },
      })
    } else {
      await args.tx.workedExample.create({
        data: {
          conceptId: args.conceptId,
          slug,
          title: requireText(example.title, "Worked example title"),
          problemMd: requireText(example.problemMd, "Worked example problem"),
          solutionMd: requireText(example.solutionMd, "Worked example solution"),
          order: requirePositiveInteger(example.order, "Worked example order"),
          authorId: args.authorId,
        },
      })
    }
  }
}
