import type { MasteryStatus } from "@prisma/client"

import { computeEffectiveMastery, deriveMasteryStatus } from "@/lib/adaptive/retention"

export type CurriculumEdge = {
  prerequisiteConceptId: string
  dependentConceptId: string
}

export type ClosureRow = {
  ancestorConceptId: string
  descendantConceptId: string
  depth: number
}

export type ConceptSummary = {
  id: string
  title: string
  unlockThreshold: number
  decayLambda: number
  pLo: number
}

export type UserMasterySnapshot = {
  conceptId: string
  pMastery: number
  lastAssessedAt: Date | null
  nextReviewAt: Date | null
  status: MasteryStatus
  unlockedAt: Date | null
}

export type GraphMasterySnapshot = {
  conceptId: string
  pMastery: number
  effectiveMastery: number
  status: MasteryStatus
  nextReviewAt: Date | null
  unlockedAt: Date | null
}

export type ConceptStatus = {
  status: MasteryStatus
  unlocked: boolean
  unmetPrerequisites: Array<{
    conceptId: string
    title: string
    currentMastery: number
  }>
  masteryProbability: number | null
  effectiveMastery: number | null
  nextReviewAt: Date | null
}

export function buildConceptClosureRows(
  conceptIds: string[],
  directEdges: CurriculumEdge[]
): ClosureRow[] {
  const adjacency = new Map<string, string[]>()

  for (const conceptId of conceptIds) {
    adjacency.set(conceptId, [])
  }

  for (const edge of directEdges) {
    const dependents = adjacency.get(edge.prerequisiteConceptId) ?? []
    dependents.push(edge.dependentConceptId)
    adjacency.set(edge.prerequisiteConceptId, dependents)

    if (!adjacency.has(edge.dependentConceptId)) {
      adjacency.set(edge.dependentConceptId, [])
    }
  }

  const rows: ClosureRow[] = []

  for (const ancestorConceptId of conceptIds) {
    const visitedDepths = new Map<string, number>([[ancestorConceptId, 0]])
    const queue: Array<{
      conceptId: string
      depth: number
    }> = [{ conceptId: ancestorConceptId, depth: 0 }]

    while (queue.length) {
      const current = queue.shift()

      if (!current) {
        continue
      }

      rows.push({
        ancestorConceptId,
        descendantConceptId: current.conceptId,
        depth: current.depth,
      })

      for (const nextConceptId of adjacency.get(current.conceptId) ?? []) {
        const nextDepth = current.depth + 1
        const previousDepth = visitedDepths.get(nextConceptId)

        if (previousDepth != null && previousDepth <= nextDepth) {
          continue
        }

        visitedDepths.set(nextConceptId, nextDepth)
        queue.push({
          conceptId: nextConceptId,
          depth: nextDepth,
        })
      }
    }
  }

  return rows
}

export function buildGraphMasteryMap(
  masteries: UserMasterySnapshot[],
  conceptDecayMap: ReadonlyMap<string, number>
) {
  return new Map<string, GraphMasterySnapshot>(
    masteries.map((mastery) => [
      mastery.conceptId,
      {
        conceptId: mastery.conceptId,
        pMastery: mastery.pMastery,
        effectiveMastery: computeEffectiveMastery({
          baselineMastery: mastery.pMastery,
          lastAssessedAt: mastery.lastAssessedAt,
          decayLambda: conceptDecayMap.get(mastery.conceptId) ?? 0.01,
        }),
        status: mastery.status,
        nextReviewAt: mastery.nextReviewAt,
        unlockedAt: mastery.unlockedAt,
      },
    ])
  )
}

export function buildAncestorMap(
  concepts: ConceptSummary[],
  closureRows: ClosureRow[]
) {
  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]))
  const ancestorRowsByDescendant = new Map<string, ClosureRow[]>()

  for (const row of closureRows) {
    if (row.depth === 0) {
      continue
    }

    const rows = ancestorRowsByDescendant.get(row.descendantConceptId) ?? []
    rows.push(row)
    ancestorRowsByDescendant.set(row.descendantConceptId, rows)
  }

  return new Map(
    concepts.map((concept) => [
      concept.id,
      (ancestorRowsByDescendant.get(concept.id) ?? [])
        .sort((left, right) => {
          if (left.depth !== right.depth) {
            return left.depth - right.depth
          }

          return (
            conceptById.get(left.ancestorConceptId)?.title.localeCompare(
              conceptById.get(right.ancestorConceptId)?.title ?? ""
            ) ?? 0
          )
        })
        .map((row) => ({
          conceptId: row.ancestorConceptId,
          title: conceptById.get(row.ancestorConceptId)?.title ?? row.ancestorConceptId,
        })),
    ])
  )
}

export function buildDescendantMap(
  concepts: ConceptSummary[],
  closureRows: ClosureRow[]
) {
  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]))
  const descendantRowsByAncestor = new Map<string, ClosureRow[]>()

  for (const row of closureRows) {
    if (row.depth === 0) {
      continue
    }

    const rows = descendantRowsByAncestor.get(row.ancestorConceptId) ?? []
    rows.push(row)
    descendantRowsByAncestor.set(row.ancestorConceptId, rows)
  }

  return new Map(
    concepts.map((concept) => [
      concept.id,
      (descendantRowsByAncestor.get(concept.id) ?? [])
        .sort((left, right) => {
          if (left.depth !== right.depth) {
            return left.depth - right.depth
          }

          return (
            conceptById.get(left.descendantConceptId)?.title.localeCompare(
              conceptById.get(right.descendantConceptId)?.title ?? ""
            ) ?? 0
          )
        })
        .map((row) => ({
          conceptId: row.descendantConceptId,
          title: conceptById.get(row.descendantConceptId)?.title ?? row.descendantConceptId,
        })),
    ])
  )
}

export function deriveConceptStatusFromClosure(args: {
  concept: Pick<ConceptSummary, "id" | "title" | "unlockThreshold">
  masteryByConceptId: ReadonlyMap<string, GraphMasterySnapshot>
  ancestors: Array<{
    conceptId: string
    title: string
  }>
}) {
  const mastery = args.masteryByConceptId.get(args.concept.id)
  const unmetPrerequisites = args.ancestors
    .map((ancestor) => {
      const currentMastery = args.masteryByConceptId.get(ancestor.conceptId)?.pMastery ?? 0

      return {
        conceptId: ancestor.conceptId,
        title: ancestor.title,
        currentMastery,
      }
    })
    .filter((ancestor) => ancestor.currentMastery < args.concept.unlockThreshold)

  const unlocked = Boolean(mastery?.unlockedAt) || unmetPrerequisites.length === 0
  const masteryProbability = mastery?.pMastery ?? null
  const effectiveMastery = mastery?.effectiveMastery ?? null

  return {
    status: deriveMasteryStatus({
      unlocked,
      storedStatus: mastery?.status,
      baselineMastery: masteryProbability,
      effectiveMastery,
      unlockThreshold: args.concept.unlockThreshold,
    }),
    unlocked,
    unmetPrerequisites,
    masteryProbability,
    effectiveMastery,
    nextReviewAt: mastery?.nextReviewAt ?? null,
  } satisfies ConceptStatus
}

export function deriveStatusesForCourse(args: {
  concepts: ConceptSummary[]
  closureRows: ClosureRow[]
  masteryByConceptId: ReadonlyMap<string, GraphMasterySnapshot>
}) {
  const ancestorMap = buildAncestorMap(args.concepts, args.closureRows)

  return new Map(
    args.concepts.map((concept) => [
      concept.id,
      deriveConceptStatusFromClosure({
        concept,
        masteryByConceptId: args.masteryByConceptId,
        ancestors: ancestorMap.get(concept.id) ?? [],
      }),
    ])
  )
}
