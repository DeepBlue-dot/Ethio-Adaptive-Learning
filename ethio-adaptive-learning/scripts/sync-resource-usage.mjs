import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting full resource usage synchronization...")

  // 1. Clear existing links
  await prisma.resourceUsage.deleteMany({})

  function extractResourceIds(content) {
    const mediaAssets = new Set()
    const contentSnippets = new Set()
    const stringified = typeof content === "string" ? content : JSON.stringify(content || [])
    
    // assetId pattern
    const assetMatches = stringified.matchAll(/"assetId"\s*:\s*"([^"]+)"/g)
    for (const match of assetMatches) mediaAssets.add(match[1])

    // snippetId pattern
    const snippetMatches = stringified.matchAll(/"snippetId"\s*:\s*"([^"]+)"/g)
    for (const match of snippetMatches) contentSnippets.add(match[1])

    return { mediaAssets: Array.from(mediaAssets), contentSnippets: Array.from(contentSnippets) }
  }

  // 2. Scan Concepts
  const concepts = await prisma.concept.findMany({ select: { id: true, contentBlocks: true } })
  console.log(`Scanning ${concepts.length} concepts...`)
  for (const concept of concepts) {
    const ids = extractResourceIds(concept.contentBlocks)
    for (const id of ids.mediaAssets) {
      await prisma.resourceUsage.create({ data: { mediaAssetId: id, consumerType: "CONCEPT", consumerId: concept.id } }).catch(() => {})
    }
    for (const id of ids.contentSnippets) {
      await prisma.resourceUsage.create({ data: { contentSnippetId: id, consumerType: "CONCEPT", consumerId: concept.id } }).catch(() => {})
    }
  }

  // 3. Scan Questions
  const questions = await prisma.question.findMany({ select: { id: true, content: true } })
  console.log(`Scanning ${questions.length} questions...`)
  for (const question of questions) {
    const ids = extractResourceIds(question.content)
    for (const id of ids.mediaAssets) {
      await prisma.resourceUsage.create({ data: { mediaAssetId: id, consumerType: "QUESTION", consumerId: question.id } }).catch(() => {})
    }
  }

  // 4. Scan Snippets
  const snippets = await prisma.contentSnippet.findMany({ select: { id: true, contentBlocks: true } })
  console.log(`Scanning ${snippets.length} snippets...`)
  for (const snippet of snippets) {
    const ids = extractResourceIds(snippet.contentBlocks)
    for (const id of ids.mediaAssets) {
      await prisma.resourceUsage.create({ data: { mediaAssetId: id, consumerType: "CONTENT_SNIPPET", consumerId: snippet.id } }).catch(() => {})
    }
  }

  console.log("Full synchronization completed.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
