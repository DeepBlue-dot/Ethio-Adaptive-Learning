import pLimit from "p-limit";
import { generateEmbedding } from "../clients/ollama";
import { EmbeddingResult } from "../types";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
// Limit to 3 concurrent requests to ensure Ollama doesn't crash
const CONCURRENCY_LIMIT = 3; 

/**
 * High-level service for managing embedding generation with resilience.
 */
export async function getEmbeddings(
  texts: string[]
): Promise<EmbeddingResult[]> {
  const limit = pLimit(CONCURRENCY_LIMIT);

  // Map each text to a promise that respects the concurrency limit
  const tasks = texts.map((text) =>
    limit(() => getEmbeddingWithRetry(text))
  );

  // Execute all tasks in parallel, but limited to CONCURRENCY_LIMIT at a time
  return Promise.all(tasks);
}

/**
 * Generates a single embedding with exponential backoff.
 */
export async function getEmbeddingWithRetry(
  text: string,
  attempt = 0
): Promise<EmbeddingResult> {
  try {
    return await generateEmbedding(text);
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      console.error(`Failed to generate embedding after ${MAX_RETRIES} attempts.`);
      throw error;
    }

    const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
    console.warn(`Ollama busy, retrying in ${delay}ms... (Attempt ${attempt + 1})`);
    
    await new Promise((resolve) => setTimeout(resolve, delay));
    return getEmbeddingWithRetry(text, attempt + 1);
  }
}