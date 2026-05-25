/**
 * Simple semantic chunker for curriculum content.
 * Focuses on maintaining context within markdown blocks.
 */
export interface Chunk {
  text: string
  metadata: Record<string, unknown>
}

export function chunkMarkdown(
  text: string,
  metadata: Record<string, unknown> = {},
  options: { maxWords?: number; overlapWords?: number } = {}
): Chunk[] {
  const maxWords = options.maxWords || 150
  const overlapWords = options.overlapWords || 20

  // 1. Normalize whitespace
  const cleanText = text.replace(/\s+/g, " ").trim()
  const words = cleanText.split(" ")
  
  const chunks: Chunk[] = []

  if (words.length <= maxWords) {
    return [{ text: cleanText, metadata }]
  }

  for (let i = 0; i < words.length; i += (maxWords - overlapWords)) {
    const chunkWords = words.slice(i, i + maxWords)
    if (chunkWords.length < 10) continue // Skip tiny fragments

    chunks.push({
      text: chunkWords.join(" "),
      metadata: {
        ...metadata,
        startIndex: i,
        isPartial: true,
      },
    })
  }

  return chunks
}

/**
 * Specifically chunks a curriculum concept by its chunks/snippets
 */
export function chunkCurriculumNode(
  title: string,
  content: string,
  metadata: Record<string, unknown>
): Chunk[] {
  // Prepend title to ensure every chunk has semantic context
  const fullContent = `Concept: ${title}\n\n${content}`
  return chunkMarkdown(fullContent, metadata)
}
