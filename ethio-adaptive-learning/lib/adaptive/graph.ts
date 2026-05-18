import type { MasteryStatus } from "@prisma/client"

import { deriveMasteryStatus } from "@/lib/adaptive/retention"

export type GraphEdge = {
  prerequisiteConceptId: string
  dependentConceptId: string
}

export type GraphConcept = {
  id: string
  title: string
  unlockThreshold: number
  prerequisiteEdges: Array<{
    prerequisiteConcept: {
      id: string
      title: string
    }
  }>
}

export type GraphMastery = {
  conceptId: string
  pMastery: number
  effectiveMastery: number
  status: MasteryStatus
  nextReviewAt: Date | null
  unlockedAt: Date | null
}

export type UnmetPrerequisite = {
  conceptId: string
  title: string
  currentMastery: number
}

export type DerivedConceptStatus = {
  status: MasteryStatus
  unlocked: boolean
  unmetPrerequisites: UnmetPrerequisite[]
  masteryProbability: number | null
  effectiveMastery: number | null
  nextReviewAt: Date | null
}

export class GraphValidationError extends Error {
  statusCode: number
  field: string
  cyclePath: string[] | null

  constructor(message: string, options?: { field?: string; statusCode?: number; cyclePath?: string[] | null }) {
    super(message)
    this.name = "GraphValidationError"
    this.statusCode = options?.statusCode ?? 400
    this.field = options?.field ?? "prerequisiteConceptIds"
    this.cyclePath = options?.cyclePath ?? null
  }
}

export function validatePrerequisiteSelection({
  conceptId,
  prerequisiteConceptIds,
  existingEdges,
}: {
  conceptId: string
  prerequisiteConceptIds: string[]
  existingEdges: GraphEdge[]
}) {
  const uniquePrerequisiteIds = [...new Set(prerequisiteConceptIds)]

  if (uniquePrerequisiteIds.includes(conceptId)) {
    throw new GraphValidationError("A concept cannot depend on itself.", {
      cyclePath: [conceptId, conceptId],
    })
  }

  const nextEdges = [
    ...existingEdges.filter((edge) => edge.dependentConceptId !== conceptId),
    ...uniquePrerequisiteIds.map((prerequisiteConceptId) => ({
      prerequisiteConceptId,
      dependentConceptId: conceptId,
    })),
  ]

  const cyclePath = findCyclePath(nextEdges)

  if (cyclePath) {
    throw new GraphValidationError(
      `Saving prerequisites would create a cycle: ${cyclePath.join(" -> ")}.`,
      {
        cyclePath,
      }
    )
  }

  return uniquePrerequisiteIds
}

export function assertAcyclicPrerequisiteSelection(args: {
  conceptId: string
  prerequisiteConceptIds: string[]
  existingEdges: GraphEdge[]
}) {
  validatePrerequisiteSelection(args)
}

export function deriveConceptStatus(
  concept: GraphConcept,
  masteries: ReadonlyMap<string, GraphMastery>
): DerivedConceptStatus {
  const mastery = masteries.get(concept.id)
  const unmetPrerequisites = concept.prerequisiteEdges
    .map(({ prerequisiteConcept }) => {
      const prerequisiteMastery = masteries.get(prerequisiteConcept.id)
      const currentMastery = prerequisiteMastery?.pMastery ?? 0

      return {
        conceptId: prerequisiteConcept.id,
        title: prerequisiteConcept.title,
        currentMastery,
        isMet: currentMastery >= concept.unlockThreshold,
      }
    })
    .filter((prerequisite) => !prerequisite.isMet)
    .map(({ conceptId, title, currentMastery }) => ({
      conceptId,
      title,
      currentMastery,
    }))

  const unlocked = Boolean(mastery?.unlockedAt) || unmetPrerequisites.length === 0
  const masteryProbability = mastery?.pMastery ?? null
  const effectiveMastery = mastery?.effectiveMastery ?? null

  return {
    status: deriveMasteryStatus({
      unlocked,
      storedStatus: mastery?.status,
      baselineMastery: masteryProbability,
      effectiveMastery,
      unlockThreshold: concept.unlockThreshold,
    }),
    unlocked,
    unmetPrerequisites,
    masteryProbability,
    effectiveMastery,
    nextReviewAt: mastery?.nextReviewAt ?? null,
  }
}

function findCyclePath(edges: GraphEdge[]) {
  const adjacency = new Map<string, string[]>()

  for (const edge of edges) {
    const next = adjacency.get(edge.prerequisiteConceptId) ?? []
    next.push(edge.dependentConceptId)
    adjacency.set(edge.prerequisiteConceptId, next)

    if (!adjacency.has(edge.dependentConceptId)) {
      adjacency.set(edge.dependentConceptId, [])
    }
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  const stack: string[] = []

  function depthFirstSearch(nodeId: string): string[] | null {
    if (visiting.has(nodeId)) {
      const cycleStartIndex = stack.indexOf(nodeId)
      const cycle = stack.slice(cycleStartIndex)
      cycle.push(nodeId)
      return cycle
    }

    if (visited.has(nodeId)) {
      return null
    }

    visiting.add(nodeId)
    stack.push(nodeId)

    for (const nextNodeId of adjacency.get(nodeId) ?? []) {
      const cycle = depthFirstSearch(nextNodeId)

      if (cycle) {
        return cycle
      }
    }

    stack.pop()
    visiting.delete(nodeId)
    visited.add(nodeId)

    return null
  }

  for (const nodeId of adjacency.keys()) {
    const cycle = depthFirstSearch(nodeId)

    if (cycle) {
      return cycle
    }
  }

  return null
}
