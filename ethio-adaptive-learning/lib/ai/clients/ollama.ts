import { AiMessage, EmbeddingResult, OllamaOptions } from "../types"

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434"
const LLM_MODEL = process.env.OLLAMA_LLM_MODEL || "gemma3:4b"
const EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || "bge-small"

export async function generateEmbedding(prompt: string): Promise<EmbeddingResult> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ollama embedding error: ${error}`)
  }

  const data = await response.json()
  return data.embedding
}

export async function chat(
  messages: AiMessage[],
  options?: OllamaOptions
): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 0.9,
        seed: options?.seed,
        num_predict: options?.numPredict,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ollama chat error: ${error}`)
  }

  const data = await response.json()
  return data.message.content
}

/**
 * Returns a readable stream for chat completions
 */
export async function chatStream(
  messages: AiMessage[],
  options?: OllamaOptions
): Promise<ReadableStream> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      stream: true,
      options: {
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 0.9,
        seed: options?.seed,
        num_predict: options?.numPredict,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ollama stream error: ${error}`)
  }

  return response.body!
}
