import { prisma } from "@/lib/prisma"

type ConsumerType = "CONCEPT" | "QUESTION" | "CONTENT_SNIPPET"

/**
 * Scans content for resource references and updates the ResourceUsage table.
 * This should be called whenever a Concept, Question, or Snippet is saved.
 */
export async function syncUsage(
  consumerType: ConsumerType,
  consumerId: string,
  content: unknown // Can be JSON or string
) {
  const resourceIds = extractResourceIds(content)
  
  // 1. Get current links
  const currentLinks = await prisma.resourceUsage.findMany({
    where: {
      consumerType,
      consumerId
    }
  })

  const newMediaAssetIds = new Set(resourceIds.mediaAssets)
  const newContentSnippetIds = new Set(resourceIds.contentSnippets)

  // 2. Identify links to remove
  const toRemove = currentLinks.filter(link => {
    if (link.mediaAssetId) return !newMediaAssetIds.has(link.mediaAssetId)
    if (link.contentSnippetId) return !newContentSnippetIds.has(link.contentSnippetId)
    return true
  })

  // 3. Identify links to add
  const existingMediaAssetIds = new Set(currentLinks.map(l => l.mediaAssetId).filter(Boolean) as string[])
  const existingContentSnippetIds = new Set(currentLinks.map(l => l.contentSnippetId).filter(Boolean) as string[])

  const toAddMediaAsset = Array.from(newMediaAssetIds).filter(id => !existingMediaAssetIds.has(id))
  const toAddContentSnippet = Array.from(newContentSnippetIds).filter(id => !existingContentSnippetIds.has(id))

  // 4. Execute transactions
  await prisma.$transaction([
    prisma.resourceUsage.deleteMany({
      where: {
        id: { in: toRemove.map(l => l.id) }
      }
    }),
    ...toAddMediaAsset.map(id => prisma.resourceUsage.create({
      data: {
        mediaAssetId: id,
        consumerType,
        consumerId
      }
    })),
    ...toAddContentSnippet.map(id => prisma.resourceUsage.create({
      data: {
        contentSnippetId: id,
        consumerType,
        consumerId
      }
    }))
  ])
}

/**
 * Extracts potential MediaAsset and ContentSnippet IDs from content.
 * Looks for specific patterns in strings or JSON structures.
 */
function extractResourceIds(content: unknown): { mediaAssets: string[], contentSnippets: string[] } {
  const mediaAssets = new Set<string>()
  const contentSnippets = new Set<string>()

  const stringified = typeof content === "string" ? content : JSON.stringify(content || [])
  
  // This is a naive extraction. In a production system, we'd parse the blocks properly.
  // We look for patterns like "assetId":"c..." or "snippetId":"c..."
  
  // Media Assets
  const assetMatches = stringified.matchAll(/"assetId"\s*:\s*"([^"]+)"/g)
  for (const match of assetMatches) {
    const id = match[1]
    if (id !== "pending-asset") {
      mediaAssets.add(id)
    }
  }

  // Content Snippets (if referenced by ID)
  const snippetMatches = stringified.matchAll(/"snippetId"\s*:\s*"([^"]+)"/g)
  for (const match of snippetMatches) {
    const id = match[1]
    if (id !== "pending-snippet") {
      contentSnippets.add(id)
    }
  }

  // Question IDs (for quiz blocks)
  const questionMatches = stringified.matchAll(/"questionId"\s*:\s*"([^"]+)"/g)
  for (const match of questionMatches) {
    const id = match[1]
    if (id !== "pending-question") {
      // In this system, questions are currently synced as media assets for usage tracking
      // but let's see if we need a separate bucket.
      // For now, extractResourceIds returns mediaAssets and contentSnippets.
    }
  }

  // Also look for raw IDs if they are used in markdown or elsewhere
  // But we must be careful not to pick up random strings.
  // CUIDs usually start with 'c' and are ~25 chars.
  
  return {
    mediaAssets: Array.from(mediaAssets),
    contentSnippets: Array.from(contentSnippets)
  }
}

/**
 * Full re-sync of all usage relations.
 * Use this for the initial migration or maintenance.
 */
export async function fullReSync() {
  console.log("Starting full usage re-sync...")
  
  // 1. Clear all
  await prisma.resourceUsage.deleteMany({})

  // 2. Scan Concepts
  const concepts = await prisma.concept.findMany({ select: { id: true, contentBlocks: true } })
  for (const concept of concepts) {
    await syncUsage("CONCEPT", concept.id, concept.contentBlocks)
  }

  // 3. Scan Questions
  const questions = await prisma.question.findMany({ select: { id: true, content: true } })
  for (const question of questions) {
    await syncUsage("QUESTION", question.id, question.content)
  }

  // 4. Scan Content Snippets
  const snippets = await prisma.contentSnippet.findMany({ select: { id: true, contentBlocks: true } })
  for (const snippet of snippets) {
    await syncUsage("CONTENT_SNIPPET", snippet.id, snippet.contentBlocks)
  }
  
  console.log("Full usage re-sync completed.")
}
