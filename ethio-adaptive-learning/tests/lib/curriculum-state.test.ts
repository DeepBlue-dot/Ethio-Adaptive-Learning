import { describe, expect, it } from "vitest"

import {
  buildConceptClosureRows,
  buildGraphMasteryMap,
  deriveStatusesForCourse,
} from "@/lib/curriculum-state"

describe("lib/curriculum-state", () => {
  it("builds closure rows with shortest-path depths across prerequisite chains", () => {
    const rows = buildConceptClosureRows(
      ["concept_a", "concept_b", "concept_c", "concept_d"],
      [
        {
          prerequisiteConceptId: "concept_a",
          dependentConceptId: "concept_b",
        },
        {
          prerequisiteConceptId: "concept_b",
          dependentConceptId: "concept_c",
        },
        {
          prerequisiteConceptId: "concept_a",
          dependentConceptId: "concept_c",
        },
      ]
    )

    expect(rows).toContainEqual({
      ancestorConceptId: "concept_a",
      descendantConceptId: "concept_a",
      depth: 0,
    })
    expect(rows).toContainEqual({
      ancestorConceptId: "concept_a",
      descendantConceptId: "concept_b",
      depth: 1,
    })
    expect(rows).toContainEqual({
      ancestorConceptId: "concept_a",
      descendantConceptId: "concept_c",
      depth: 1,
    })
    expect(rows).toContainEqual({
      ancestorConceptId: "concept_b",
      descendantConceptId: "concept_c",
      depth: 1,
    })
    expect(rows).toContainEqual({
      ancestorConceptId: "concept_d",
      descendantConceptId: "concept_d",
      depth: 0,
    })
  })

  it("derives locked, fringe, and mastered concept states from closure ancestors", () => {
    const masteryByConceptId = buildGraphMasteryMap(
      [
        {
          conceptId: "concept_linear",
          pMastery: 0.95,
          lastAssessedAt: null,
          nextReviewAt: null,
          status: "MASTERED",
          unlockedAt: new Date("2026-04-01T00:00:00.000Z"),
        },
        {
          conceptId: "concept_quadratic",
          pMastery: 0.15,
          lastAssessedAt: null,
          nextReviewAt: null,
          status: "FRINGE",
          unlockedAt: new Date("2026-04-04T00:00:00.000Z"),
        },
      ],
      new Map([
        ["concept_linear", 0.01],
        ["concept_quadratic", 0.01],
        ["concept_limits", 0.01],
      ])
    )

    const statuses = deriveStatusesForCourse({
      concepts: [
        {
          id: "concept_linear",
          title: "Linear Functions",
          unlockThreshold: 0.9,
          decayLambda: 0.01,
          pLo: 0.15,
        },
        {
          id: "concept_quadratic",
          title: "Quadratic Functions",
          unlockThreshold: 0.9,
          decayLambda: 0.01,
          pLo: 0.15,
        },
        {
          id: "concept_limits",
          title: "Limits",
          unlockThreshold: 0.9,
          decayLambda: 0.01,
          pLo: 0.15,
        },
      ],
      closureRows: buildConceptClosureRows(
        ["concept_linear", "concept_quadratic", "concept_limits"],
        [
          {
            prerequisiteConceptId: "concept_linear",
            dependentConceptId: "concept_quadratic",
          },
          {
            prerequisiteConceptId: "concept_quadratic",
            dependentConceptId: "concept_limits",
          },
        ]
      ),
      masteryByConceptId,
    })

    expect(statuses.get("concept_linear")).toMatchObject({
      status: "MASTERED",
      unlocked: true,
      unmetPrerequisites: [],
      masteryProbability: 0.95,
    })
    expect(statuses.get("concept_quadratic")).toMatchObject({
      status: "FRINGE",
      unlocked: true,
      unmetPrerequisites: [],
      masteryProbability: 0.15,
    })
    expect(statuses.get("concept_limits")).toEqual({
      status: "LOCKED",
      unlocked: false,
      unmetPrerequisites: [
        {
          conceptId: "concept_quadratic",
          title: "Quadratic Functions",
          currentMastery: 0.15,
        },
      ],
      masteryProbability: null,
      effectiveMastery: null,
      nextReviewAt: null,
    })
  })
})
