import { loadCourseUserState } from "@/lib/curriculum-graph"

import { requireId } from "./utils"
import { userMasterySelect } from "./constants"
import type { DbClient } from "./types"

export async function getUnlockedConceptOrThrow(db: DbClient, userId: string, conceptId: string) {
  const access = await getConceptAccessState(db, userId, conceptId)

  if (!access.derivedStatus.unlocked) {
    throw new Error("This concept is still locked by prerequisite mastery requirements.")
  }

  return access.concept
}

export async function getConceptAccessState(db: DbClient, userId: string, conceptId: string) {
  const concept = await db.concept.findFirst({
    where: {
      id: requireId(conceptId, "Concept"),
      status: "PUBLISHED",
      unit: {
        status: "PUBLISHED",
        course: {
          status: "PUBLISHED",
        },
      },
    },
    include: {
      unit: {
        select: {
          courseId: true,
        },
      },
      userMasteries: {
        where: {
          userId,
        },
        select: userMasterySelect,
        take: 1,
      },
    },
  })

  if (!concept) {
    throw new Error("Concept not found.")
  }

  const courseState = await loadCourseUserState(concept.unit.courseId, userId, db)
  const derivedStatus = courseState.statuses.get(concept.id)

  if (!derivedStatus) {
    throw new Error("Concept state could not be derived.")
  }

  return {
    concept,
    conceptMastery: concept.userMasteries[0] ?? null,
    derivedStatus,
  }
}
