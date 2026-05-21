import { QuestionUsage } from "@prisma/client"
import type { DbClient } from "./types"
import { computeEffectiveMastery } from "@/lib/adaptive/retention"
import { getDifficultyPreferenceOrder, getDifficultyTierForMastery, pickDeterministicQuestions } from "@/lib/adaptive/difficulty"
import { questionSelect, userMasterySelect } from "./constants"

export async function selectQuestionsForAttempt(
  db: DbClient,
  {
    userId,
    concept,
    usage,
    limit,
  }: {
    userId: string
    concept: {
      id: string
      pLo: number
      decayLambda: number
    }
    usage: QuestionUsage
    limit: number
  }
) {
  const [mastery, questions] = await Promise.all([
    db.userMastery.findUnique({
      where: {
        userId_conceptId: {
          userId,
          conceptId: concept.id,
        },
      },
      select: userMasterySelect,
    }),
    db.question.findMany({
      where: {
        conceptId: concept.id,
        usage,
        status: "PUBLISHED",
      },
      select: questionSelect,
    }),
  ])

  if (!questions.length) {
    return []
  }

  const effectiveMastery =
    mastery != null
      ? computeEffectiveMastery({
          baselineMastery: mastery.pMastery,
          lastAssessedAt: mastery.lastAssessedAt,
          decayLambda: concept.decayLambda,
        })
      : concept.pLo
  const targetDifficulty = getDifficultyTierForMastery(effectiveMastery)
  const preferenceOrder = getDifficultyPreferenceOrder({
    usage,
    targetDifficulty,
  })
  const logs = await db.interactionLog.findMany({
    where: {
      userId,
      questionId: {
        in: questions.map((question) => question.id),
      },
    },
    select: {
      questionId: true,
    },
  })
  const usageCounts = logs.reduce((counts, log) => {
    if (!log.questionId) {
      return counts
    }

    counts.set(log.questionId, (counts.get(log.questionId) ?? 0) + 1)
    return counts
  }, new Map<string, number>())

  return pickDeterministicQuestions(questions, usageCounts, preferenceOrder, limit)
}
