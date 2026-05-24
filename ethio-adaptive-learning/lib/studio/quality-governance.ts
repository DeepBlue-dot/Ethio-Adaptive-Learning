import { prisma } from "@/lib/prisma"
import { findBrokenResourceLinks, findOrphanConcepts } from "./content-integrity"
import { suggestBktCalibrationForConcept } from "./parameter-calibration"

export type ContentGovernanceSummary = {
  orphanConceptCount: number
  brokenResourceCount: number
  lowMasteryConceptCount: number
  autoCalibrationCandidates: Array<{ conceptId: string; title: string; averageMastery: number }>
}

export type QuestionAnalyticsSummaryItem = {
  questionId: string
  slug: string
  successRate: number
  attemptCount: number
  difficulty: string
}

export type ConceptHealthSummaryItem = {
  conceptId: string
  title: string
  percentMastered: number
  strugglePointCount: number
}

export async function getQualityGovernanceOverview() {
  const [orphans, brokenResources, lowMasteryGroups] = await Promise.all([
    findOrphanConcepts(100),
    findBrokenResourceLinks(),
    prisma.userMastery.groupBy({
      by: ["conceptId"],
      where: { consecutiveFails: { gt: 1 } },
      _count: true,
      orderBy: {
        conceptId: 'asc'
      }
    }),
  ])

  // Simple heuristic for integrity score
  const totalChecks = 100
  const failures = orphans.length + brokenResources.length
  const contentIntegrityScore = Math.max(0, (totalChecks - failures) / totalChecks)

  return {
    contentIntegrityScore,
    stuckConceptCount: lowMasteryGroups.length,
    calibrationCandidateCount: lowMasteryGroups.length, // Placeholder for actual candidate logic
    orphanConceptCount: orphans.length
  }
}

export async function getContentGovernanceSummary(): Promise<ContentGovernanceSummary> {
  const [orphans, brokenResources, lowMasteryGroups] = await Promise.all([
    findOrphanConcepts(25),
    findBrokenResourceLinks(),
    prisma.userMastery.groupBy({
      by: ["conceptId"],
      _avg: { pMastery: true },
      orderBy: { _avg: { pMastery: "asc" } },
      take: 15,
    }),
  ])

  const autoCalibrationCandidates = await Promise.all(
    lowMasteryGroups.slice(0, 10).map(async (group) => {
      const concept = await prisma.concept.findUnique({
        where: { id: group.conceptId },
        select: { title: true },
      })

      return {
        conceptId: group.conceptId,
        title: concept?.title ?? "Unknown Concept",
        averageMastery: Number(group._avg.pMastery ?? 0),
      }
    })
  )

  return {
    orphanConceptCount: orphans.length,
    brokenResourceCount: brokenResources.length,
    lowMasteryConceptCount: lowMasteryGroups.length,
    autoCalibrationCandidates,
  }
}

export async function getQuestionAnalyticsSummary(
  limit = 15
): Promise<QuestionAnalyticsSummaryItem[]> {
  const questions = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      difficulty: true,
      practiceAttempts: { select: { isCorrect: true } },
      checkpointAttempts: { select: { isCorrect: true } },
    },
    take: limit,
  })

  return questions.map((question) => {
    const attempts = [...question.practiceAttempts, ...question.checkpointAttempts]
      .filter((attempt) => attempt.isCorrect != null)
    const successRate = attempts.length
      ? attempts.filter((attempt) => attempt.isCorrect).length / attempts.length
      : 0

    return {
      questionId: question.id,
      slug: question.slug,
      successRate,
      attemptCount: attempts.length,
      difficulty: question.difficulty,
    }
  })
}

export async function getConceptHealthSummary(
  limit = 15
): Promise<ConceptHealthSummaryItem[]> {
  const health = await prisma.concept.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      userMasteries: {
        select: { status: true },
      },
    },
  })

  return health.map((concept) => {
    const total = concept.userMasteries.length
    const mastered = concept.userMasteries.filter((item) => item.status === "MASTERED").length
    const strugglePointCount = concept.userMasteries.filter((item) => item.status === "REVIEW_NEEDED").length

    return {
      conceptId: concept.id,
      title: concept.title,
      percentMastered: total ? Number(((mastered / total) * 100).toFixed(1)) : 0,
      strugglePointCount,
    }
  })
}

export async function getAutoCalibrationSuggestions(
  limit = 10
): Promise<BktCalibrationSuggestion[]> {
  const lowMasteryGroups = await prisma.userMastery.groupBy({
    by: ["conceptId"],
    _avg: { pMastery: true },
    orderBy: { _avg: { pMastery: "asc" } },
    take: limit,
  })

  const suggestions = [] as BktCalibrationSuggestion[]
  for (const group of lowMasteryGroups) {
    suggestions.push(await suggestBktCalibrationForConcept(group.conceptId))
  }

  return suggestions
}

import type { BktCalibrationSuggestion } from "./parameter-calibration"

export type { BktCalibrationSuggestion }
