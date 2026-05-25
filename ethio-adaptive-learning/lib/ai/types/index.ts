export type AiRole = "system" | "user" | "assistant"

export interface AiMessage {
  role: AiRole
  content: string
}

export interface RetrievalResult {
  id: string
  text: string
  score: number
  metadata: Record<string, unknown>
}

export type EmbeddingResult = number[]

export interface TutorResponse {
  content: string
  retrievedContextIds: string[]
  isFlagged?: boolean
  flagReason?: string
}

export interface OllamaOptions {
  temperature?: number
  topP?: number
  seed?: number
  numPredict?: number
}
