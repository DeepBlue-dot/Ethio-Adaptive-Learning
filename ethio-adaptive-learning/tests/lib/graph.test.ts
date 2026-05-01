import { describe, expect, it } from "vitest"

import {
  assertAcyclicPrerequisiteSelection,
  deriveConceptStatus,
  type GraphMastery,
} from "@/lib/adaptive/graph"

describe("lib/adaptive/graph", () => {
  it("rejects self-referential prerequisite selections", () => {
    expect(() =>
      assertAcyclicPrerequisiteSelection({
        conceptId: "concept_a",
        prerequisiteConceptIds: ["concept_a"],
        existingEdges: [],
      })
    ).toThrow("A concept cannot depend on itself.")
  })

  it("rejects prerequisite selections that create a cycle", () => {
    expect(() =>
      assertAcyclicPrerequisiteSelection({
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
    ).toThrow("Prerequisite relationships cannot create cycles.")
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

  it("uses the existing mastery state once a concept has started", () => {
    const masteries = new Map<string, GraphMastery>([
      [
        "concept_limits",
        {
          conceptId: "concept_limits",
          pMastery: 0.51,
          effectiveMastery: 0.49,
          status: "IN_PROGRESS",
          nextReviewAt: null,
          unlockedAt: new Date("2026-04-01T00:00:00.000Z"),
        },
      ],
      [
        "concept_quadratic",
        {
          conceptId: "concept_quadratic",
          pMastery: 0.94,
          effectiveMastery: 0.72,
          status: "MASTERED",
          nextReviewAt: new Date("2026-05-01T00:00:00.000Z"),
          unlockedAt: new Date("2026-03-01T00:00:00.000Z"),
        },
      ],
    ])

    const derivedStatus = deriveConceptStatus(
      {
        id: "concept_limits",
        title: "Limits",
        unlockThreshold: 0.9,
        prerequisiteEdges: [
          {
            prerequisiteConcept: {
              id: "concept_quadratic",
              title: "Quadratic Functions",
            },
          },
        ],
      },
      masteries
    )

    expect(derivedStatus).toEqual({
      status: "IN_PROGRESS",
      unlocked: true,
      masteryProbability: 0.51,
      effectiveMastery: 0.49,
      nextReviewAt: null,
      unmetPrerequisites: [],
    })
  })

  it("keeps a concept unlocked after prerequisite decay once unlockedAt is set", () => {
    const masteries = new Map<string, GraphMastery>([
      [
        "concept_linear",
        {
          conceptId: "concept_linear",
          pMastery: 0.7,
          effectiveMastery: 0.55,
          status: "REVIEW_NEEDED",
          nextReviewAt: new Date("2026-04-02T00:00:00.000Z"),
          unlockedAt: new Date("2026-03-01T00:00:00.000Z"),
        },
      ],
      [
        "concept_quadratic",
        {
          conceptId: "concept_quadratic",
          pMastery: 0.15,
          effectiveMastery: 0.15,
          status: "FRINGE",
          nextReviewAt: null,
          unlockedAt: new Date("2026-04-03T00:00:00.000Z"),
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
              id: "concept_linear",
              title: "Linear Functions",
            },
          },
        ],
      },
      masteries
    )

    expect(derivedStatus).toEqual({
      status: "FRINGE",
      unlocked: true,
      masteryProbability: 0.15,
      effectiveMastery: 0.15,
      nextReviewAt: null,
      unmetPrerequisites: [
        {
          conceptId: "concept_linear",
          title: "Linear Functions",
          currentMastery: 0.7,
        },
      ],
    })
  })
})
