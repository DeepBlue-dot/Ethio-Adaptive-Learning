import { describe, expect, it } from "vitest"

import {
  deriveConceptStatus,
  type GraphMastery,
  validatePrerequisiteSelection,
} from "@/lib/adaptive/graph"

describe("lib/adaptive/graph", () => {
  it("rejects self-referential prerequisite selections", () => {
    expect(() =>
      validatePrerequisiteSelection({
        conceptId: "concept_a",
        prerequisiteConceptIds: ["concept_a"],
        existingEdges: [],
      })
    ).toThrow("A concept cannot depend on itself.")
  })

  it("rejects direct prerequisite cycles", () => {
    expect(() =>
      validatePrerequisiteSelection({
        conceptId: "concept_a",
        prerequisiteConceptIds: ["concept_b"],
        existingEdges: [
          {
            prerequisiteConceptId: "concept_a",
            dependentConceptId: "concept_b",
          },
        ],
      })
    ).toThrow("Saving prerequisites would create a cycle: concept_a -> concept_b -> concept_a.")
  })

  it("rejects transitive prerequisite cycles discovered by DFS", () => {
    expect(() =>
      validatePrerequisiteSelection({
        conceptId: "concept_a",
        prerequisiteConceptIds: ["concept_c"],
        existingEdges: [
          {
            prerequisiteConceptId: "concept_a",
            dependentConceptId: "concept_b",
          },
          {
            prerequisiteConceptId: "concept_b",
            dependentConceptId: "concept_c",
          },
        ],
      })
    ).toThrow("Saving prerequisites would create a cycle: concept_a -> concept_b -> concept_c -> concept_a.")
  })

  it("allows non-cycling prerequisite replacements", () => {
    expect(
      validatePrerequisiteSelection({
        conceptId: "concept_d",
        prerequisiteConceptIds: ["concept_b", "concept_c", "concept_b"],
        existingEdges: [
          {
            prerequisiteConceptId: "concept_a",
            dependentConceptId: "concept_b",
          },
          {
            prerequisiteConceptId: "concept_b",
            dependentConceptId: "concept_c",
          },
        ],
      })
    ).toEqual(["concept_b", "concept_c"])
  })

  it("derives lock status and unmet prerequisites from mastery values", () => {
    const masteries = new Map<string, GraphMastery>([
      [
        "concept_intro",
        {
          conceptId: "concept_intro",
          pMastery: 0.62,
          effectiveMastery: 0.58,
          status: "IN_PROGRESS",
          nextReviewAt: null,
          unlockedAt: new Date("2026-04-01T00:00:00.000Z"),
        },
      ],
    ])

    const derivedStatus = deriveConceptStatus(
      {
        id: "concept_quadratic",
        title: "Quadratic Functions",
        unlockThreshold: 0.9,
        prerequisiteEdges: [
          {
            prerequisiteConcept: {
              id: "concept_intro",
              title: "Linear Functions",
            },
          },
        ],
      },
      masteries
    )

    expect(derivedStatus).toEqual({
      status: "LOCKED",
      unlocked: false,
      masteryProbability: null,
      effectiveMastery: null,
      nextReviewAt: null,
      unmetPrerequisites: [
        {
          conceptId: "concept_intro",
          title: "Linear Functions",
          currentMastery: 0.62,
        },
      ],
    })
  })
})
