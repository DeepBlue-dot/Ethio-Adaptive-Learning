import { generateEmbedding } from "../clients/ollama"
import { EmbeddingResult } from "../types"

const DEFAULT_BATCH_SIZE = 10
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

/**
 * High-level service for managing embedding generation with resilience.
 */
export async function getEmbeddings(
  texts: string[],
  options?: { batchSize?: number }
): Promise<EmbeddingResult[]> {
  const batchSize = options?.batchSize || DEFAULT_BATCH_SIZE
  const results: EmbeddingResult[] = []

  // Process in batches to avoid overwhelming local Ollama instance
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map((text) => getEmbeddingWithRetry(text))
    )
    results.push(...batchResults)
  }

  return results
}

/**
 * Generates a single embedding with exponential backoff.
 */
export async function getEmbeddingWithRetry(
  text: string,
  attempt = 0
): Promise<EmbeddingResult> {
  try {
    return await generateEmbedding(text)
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      console.error(`Failed to generate embedding after ${MAX_RETRIES} attempts.`)
      throw error
    }

    const delay = RETRY_DELAY_MS * Math.pow(2, attempt)
    console.warn(`Ollama busy, retrying in ${delay}ms... (Attempt ${attempt + 1})`)
    
    await new Promise((resolve) => setTimeout(resolve, delay))
    return getEmbeddingWithRetry(text, attempt + 1)
  }
}
