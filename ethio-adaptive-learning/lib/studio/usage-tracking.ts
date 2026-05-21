import { prisma } from "@/lib/prisma"

export interface UsageLocation {
  type: "concept" | "question" | "snippet"
  id: string
  title: string
  courseId?: string
  courseTitle?: string
  unitId?: string
  unitTitle?: string
  unitOrder?: number
  context?: string
}

export async function scanResourceUsage(resourceId: string): Promise<UsageLocation[]> {
  const usage: UsageLocation[] = []

  // Query the persisted usage table
  const links = await prisma.resourceUsage.findMany({
    where: {
      OR: [
        { mediaAssetId: resourceId },
        { contentSnippetId: resourceId }
      ]
    }
  })

  if (links.length === 0) return []

  // Group by type for efficient fetching
  const conceptIds = links.filter(l => l.consumerType === "CONCEPT").map(l => l.consumerId)
  const questionIds = links.filter(l => l.consumerType === "QUESTION").map(l => l.consumerId)
  const snippetIds = links.filter(l => l.consumerType === "CONTENT_SNIPPET").map(l => l.consumerId)

  // Fetch details
  const [concepts, questions, snippets] = await Promise.all([
    conceptIds.length > 0 ? prisma.concept.findMany({
      where: { id: { in: conceptIds } },
      include: { unit: { include: { course: true } } }
    }) : Promise.resolve([]),
    questionIds.length > 0 ? prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { concept: { include: { unit: { include: { course: true } } } } }
    }) : Promise.resolve([]),
    snippetIds.length > 0 ? prisma.contentSnippet.findMany({
      where: { id: { in: snippetIds } }
    }) : Promise.resolve([])
  ])

  // Map to unified format
  concepts.forEach(c => {
    usage.push({
      type: "concept",
      id: c.id,
      title: c.title,
      courseId: c.unit.course.id,
      courseTitle: c.unit.course.title,
      unitId: c.unit.id,
      unitTitle: c.unit.title,
      unitOrder: c.unit.order
    })
  })

  questions.forEach(q => {
    usage.push({
      type: "question",
      id: q.id,
      title: q.slug || q.id,
      courseId: q.concept.unit.course.id,
      courseTitle: q.concept.unit.course.title,
      unitId: q.concept.unit.id,
      unitTitle: q.concept.unit.title,
      unitOrder: q.concept.unit.order
    })
  })

  snippets.forEach(s => {
    usage.push({
      type: "snippet",
      id: s.id,
      title: s.title
    })
  })

  return usage
}

export async function getUnusedResourcesCount(): Promise<number> {
  try {
    // Count media assets not referenced in ResourceUsage
    const unusedMediaAssets = await prisma.mediaAsset.count({
      where: {
        usageLinks: { none: {} }
      }
    })

    // Count content snippets not referenced in ResourceUsage
    const unusedSnippets = await prisma.contentSnippet.count({
      where: {
        usageLinks: { none: {} }
      }
    })

    return unusedMediaAssets + unusedSnippets
  } catch (error) {
    console.error("Failed to get unused resources count:", error)
    return 0
  }
}
