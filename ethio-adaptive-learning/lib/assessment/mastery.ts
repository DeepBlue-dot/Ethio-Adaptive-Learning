import { loadCourseUserState } from "@/lib/curriculum-graph"

import type { DbClient } from "./types"

export async function ensureStartedMastery(
  db: DbClient,
  userId: string,
  concept: {
    id: string
    pLo: number
    unlockThreshold: number
    decayLambda: number
  }
) {
  const existingMastery = await db.userMastery.findUnique({
    where: {
      userId_conceptId: {
        userId,
        conceptId: concept.id,
      },
    },
    select: {
      userId: true,
      conceptId: true,
      pMastery: true,
      lastAssessedAt: true,
      nextReviewAt: true,
      unlockedAt: true,
      status: true,
      consecutiveFails: true,
    },
  })

  if (existingMastery) {
    if (existingMastery.status === "FRINGE" || existingMastery.status === "LOCKED") {
      await db.userMastery.update({
        where: {
          userId_conceptId: {
            userId,
            conceptId: concept.id,
          },
        },
        data: {
          status: "IN_PROGRESS",
          unlockedAt: existingMastery.unlockedAt ?? new Date(),
        },
      })
    } else if (!existingMastery.unlockedAt) {
      await db.userMastery.update({
        where: {
          userId_conceptId: {
            userId,
            conceptId: concept.id,
          },
        },
        data: {
          unlockedAt: new Date(),
        },
      })
    }

    return
  }

  await db.userMastery.create({
    data: {
      userId,
      conceptId: concept.id,
      pMastery: concept.pLo,
      status: "IN_PROGRESS",
      unlockedAt: new Date(),
    },
  })
}

export async function syncUnlockedConceptsForCourse(db: DbClient, userId: string, unitId: string) {
  const unit = await db.unit.findUnique({
    where: {
      id: unitId,
    },
    select: {
      courseId: true,
    },
  })

  if (!unit) {
    return
  }

  const courseState = await loadCourseUserState(unit.courseId, userId, db)
  const masteryByConceptId = new Map(
    courseState.masteries.map((mastery) => [mastery.conceptId, mastery] as const)
  )

  for (const concept of courseState.concepts) {
    const existingMastery = masteryByConceptId.get(concept.id)
    const derivedStatus = courseState.statuses.get(concept.id)

    if (!derivedStatus?.unlocked || existingMastery?.unlockedAt) {
      continue
    }

    const unlockedAt = new Date()

    if (existingMastery) {
      await db.userMastery.update({
        where: {
          userId_conceptId: {
            userId,
            conceptId: concept.id,
          },
        },
        data: {
          unlockedAt,
          status: existingMastery.status === "LOCKED" ? "FRINGE" : existingMastery.status,
        },
      })

      continue
    }

    await db.userMastery.create({
      data: {
        userId,
        conceptId: concept.id,
        pMastery: concept.pLo,
        unlockedAt,
        status: "FRINGE",
      },
    })
  }
}
