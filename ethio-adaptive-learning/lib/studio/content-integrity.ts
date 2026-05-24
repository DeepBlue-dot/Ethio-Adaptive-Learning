import { prisma } from "@/lib/prisma"
import { StudentGrade } from "@prisma/client"

export type OrphanConcept = {
  id: string
  title: string
}

export type BrokenResourceLink = {
  id: string
  kind: string
  url: string | null
  reason: string
}

export type ReadabilityAnalysis = {
  wordCount: number
  sentenceCount: number
  syllableCount: number
  readingEase: number
  gradeLevelThreshold: number
  isAboveThreshold: boolean
}

export type ContentIntegrityReport = {
  conceptId: string
  conceptTitle: string
  score: number
  orphan: boolean
  brokenResources: Array<{ id: string; type: string; context: string }>
  missingAssessment: boolean
}

export async function getContentIntegrityReports(): Promise<ContentIntegrityReport[]> {
  const concepts = await prisma.concept.findMany({
    take: 20,
    include: {
      _count: { select: { questions: true } }
    }
  })

  return Promise.all(concepts.map(async c => {
    const [broken, orphans] = await Promise.all([
      findBrokenResourceLinks(), // This is actually global right now, ideally filtered by concept
      findOrphanConcepts(100)
    ])

    const isOrphan = orphans.some(o => o.id === c.id)
    const hasBroken = broken.filter(b => b.id.includes(c.id)) // Heuristic

    let score = 1.0
    if (isOrphan) score -= 0.3
    if (c._count.questions === 0) score -= 0.4
    if (hasBroken.length > 0) score -= 0.2

    return {
      conceptId: c.id,
      conceptTitle: c.title,
      score: Math.max(0.1, score),
      orphan: isOrphan,
      brokenResources: hasBroken.map(b => ({ id: b.id, type: b.kind, context: b.reason })),
      missingAssessment: c._count.questions === 0
    }
  }))
}

export async function findOrphanConcepts(limit = 50): Promise<OrphanConcept[]> {
  return prisma.concept.findMany({
    where: {
      prerequisiteEdges: { none: {} },
      dependentEdges: { none: {} },
    },
    select: { id: true, title: true },
    take: limit,
  })
}

const isYouTubeUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    return ["youtube.com", "www.youtube.com", "youtu.be"].includes(parsed.hostname)
  } catch {
    return false
  }
}

export async function findBrokenResourceLinks(): Promise<BrokenResourceLink[]> {
  const assets = await prisma.mediaAsset.findMany({
    select: {
      id: true,
      kind: true,
      url: true,
      publicId: true,
    },
  })

  return assets.flatMap((asset) => {
    const problems: BrokenResourceLink[] = []
    const hasUrl = !!asset.url
    const hasPublicId = !!asset.publicId

    if (asset.kind === "YOUTUBE_EMBED") {
      if (!hasUrl || !isYouTubeUrl(asset.url ?? "")) {
        problems.push({
          id: asset.id,
          kind: asset.kind,
          url: asset.url,
          reason: hasUrl ? "Invalid YouTube URL" : "Missing embed URL",
        })
      }
    }

    if (asset.kind === "IMAGE" || asset.kind === "PHET_SIMULATION") {
      if (!hasUrl || !hasPublicId) {
        problems.push({
          id: asset.id,
          kind: asset.kind,
          url: asset.url,
          reason: "Missing Cloudinary asset metadata or URL",
        })
      }
    }

    return problems
  })
}

const countSyllables = (word: string) => {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, "")
  if (!normalized) return 0
  const syllables = normalized
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/g, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g)
  return syllables ? syllables.length : 1
}

const countSentences = (text: string) => {
  const matches = text.match(/[.!?]+/g)
  return matches ? matches.length : 1
}

const countWords = (text: string) => {
  const matches = text.trim().match(/\b\w+\b/g)
  return matches ? matches.length : 0
}

export function analyzeReadability(
  contentBody: string,
  gradeLevel: StudentGrade
): ReadabilityAnalysis {
  const text = contentBody.replace(/\s+/g, " ").trim()
  const wordCount = countWords(text)
  const sentenceCount = countSentences(text)
  const syllableCount = text
    .split(/\s+/)
    .filter(Boolean)
    .reduce((sum, word) => sum + countSyllables(word), 0)

  const readingEase = wordCount && sentenceCount
    ? Number(
        (206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount)).toFixed(1)
      )
    : 100

  const thresholds: Record<StudentGrade, number> = {
    MIDDLE_SCHOOL: 70,
    GRADE_9: 65,
    GRADE_10: 60,
    GRADE_11: 55,
    GRADE_12: 50,
    ABOVE: 45,
  }

  const gradeLevelThreshold = thresholds[gradeLevel] ?? 60
  return {
    wordCount,
    sentenceCount,
    syllableCount,
    readingEase,
    gradeLevelThreshold,
    isAboveThreshold: readingEase < gradeLevelThreshold,
  }
}
