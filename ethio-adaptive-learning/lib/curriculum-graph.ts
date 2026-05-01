import { Prisma } from "@prisma/client"

import {
  buildAncestorMap,
  buildConceptClosureRows,
  buildDescendantMap,
  buildGraphMasteryMap,
  deriveStatusesForCourse,
  type ClosureRow,
  type ConceptSummary,
  type UserMasterySnapshot,
} from "@/lib/curriculum-state"
import { prisma } from "@/lib/prisma"

type DbClient = Prisma.TransactionClient | typeof prisma

const masterySelect = {
  conceptId: true,
  pMastery: true,
  lastAssessedAt: true,
  nextReviewAt: true,
  status: true,
  unlockedAt: true,
} satisfies Prisma.UserMasterySelect

export async function rebuildConceptClosureForCourse(courseId: string, db: DbClient = prisma) {
  const concepts = await db.concept.findMany({
    where: {
      unit: {
        courseId,
      },
    },
    select: {
      id: true,
    },
  })
  const conceptIds = concepts.map((concept) => concept.id)

  await db.conceptClosure.deleteMany({
    where: {
      OR: [
        {
          ancestorConceptId: {
            in: conceptIds,
          },
        },
        {
          descendantConceptId: {
            in: conceptIds,
          },
        },
      ],
    },
  })

  if (!conceptIds.length) {
    return []
  }

  const directEdges = await db.conceptPrerequisite.findMany({
    where: {
      dependentConcept: {
        unit: {
          courseId,
        },
      },
    },
    select: {
      prerequisiteConceptId: true,
      dependentConceptId: true,
    },
  })

  const rows = buildConceptClosureRows(conceptIds, directEdges)

  if (rows.length) {
    await db.conceptClosure.createMany({
      data: rows,
    })
  }

  return rows
}

export async function listCourseAncestors(courseId: string, db: DbClient = prisma) {
  const context = await loadCourseGraphContext(courseId, db)
  return context.ancestorMap
}

export async function listCourseDescendants(courseId: string, db: DbClient = prisma) {
  const context = await loadCourseGraphContext(courseId, db)
  return context.descendantMap
}

export async function getUnlockedConceptIds(args: {
  courseId: string
  userId: string
  db?: DbClient
}) {
  const context = await loadCourseUserState(args.courseId, args.userId, args.db ?? prisma)

  return [...context.statuses.entries()]
    .filter(([, status]) => status.unlocked)
    .map(([conceptId]) => conceptId)
}

export async function getFringeConceptIds(args: {
  courseId: string
  userId: string
  db?: DbClient
}) {
  const context = await loadCourseUserState(args.courseId, args.userId, args.db ?? prisma)

  return [...context.statuses.entries()]
    .filter(([, status]) => status.status === "FRINGE")
    .map(([conceptId]) => conceptId)
}

export async function loadCourseGraphContext(courseId: string, db: DbClient = prisma) {
  const [concepts, directEdges, storedClosureRows] = await Promise.all([
    db.concept.findMany({
      where: {
        unit: {
          courseId,
        },
      },
      select: {
        id: true,
        title: true,
        unlockThreshold: true,
        decayLambda: true,
        pLo: true,
      },
      orderBy: {
        title: "asc",
      },
    }),
    db.conceptPrerequisite.findMany({
      where: {
        dependentConcept: {
          unit: {
            courseId,
          },
        },
      },
      select: {
        prerequisiteConceptId: true,
        dependentConceptId: true,
      },
    }),
    db.conceptClosure.findMany({
      where: {
        ancestorConcept: {
          unit: {
            courseId,
          },
        },
      },
      select: {
        ancestorConceptId: true,
        descendantConceptId: true,
        depth: true,
      },
    }),
  ])

  const conceptIds = concepts.map((concept) => concept.id)
  const closureRows =
    storedClosureRows.length > 0 || conceptIds.length === 0
      ? storedClosureRows
      : buildConceptClosureRows(conceptIds, directEdges)

  return {
    concepts,
    directEdges,
    closureRows,
    ancestorMap: buildAncestorMap(concepts, closureRows),
    descendantMap: buildDescendantMap(concepts, closureRows),
  }
}

export async function loadCourseUserState(courseId: string, userId: string, db: DbClient = prisma) {
  const context = await loadCourseGraphContext(courseId, db)
  const conceptDecayMap = new Map(context.concepts.map((concept) => [concept.id, concept.decayLambda]))
  const masteries = context.concepts.length
    ? await db.userMastery.findMany({
        where: {
          userId,
          conceptId: {
            in: context.concepts.map((concept) => concept.id),
          },
        },
        select: masterySelect,
      })
    : []
  const masteryByConceptId = buildGraphMasteryMap(
    masteries as UserMasterySnapshot[],
    conceptDecayMap
  )

  return {
    ...context,
    masteries: masteries as UserMasterySnapshot[],
    masteryByConceptId,
    statuses: deriveStatusesForCourse({
      concepts: context.concepts as ConceptSummary[],
      closureRows: context.closureRows as ClosureRow[],
      masteryByConceptId,
    }),
  }
}
