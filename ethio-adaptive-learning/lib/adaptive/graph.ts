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

export function assertAcyclicPrerequisiteSelection({
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
    throw new Error("A concept cannot depend on itself.")
  }

  const nextEdges = [
    ...existingEdges.filter((edge) => edge.dependentConceptId !== conceptId),
    ...uniquePrerequisiteIds.map((prerequisiteConceptId) => ({
      prerequisiteConceptId,
      dependentConceptId: conceptId,
    })),
  ]

  if (graphHasCycle(nextEdges)) {
    throw new Error("Prerequisite relationships cannot create cycles.")
  }
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

function graphHasCycle(edges: GraphEdge[]) {
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

  function depthFirstSearch(nodeId: string): boolean {
    if (visiting.has(nodeId)) {
      return true
    }

    if (visited.has(nodeId)) {
      return false
    }

    visiting.add(nodeId)

    for (const nextNodeId of adjacency.get(nodeId) ?? []) {
      if (depthFirstSearch(nextNodeId)) {
        return true
      }
    }

    visiting.delete(nodeId)
    visited.add(nodeId)

    return false
  }

  for (const nodeId of adjacency.keys()) {
    if (depthFirstSearch(nodeId)) {
      return true
    }
  }

  return false
}
