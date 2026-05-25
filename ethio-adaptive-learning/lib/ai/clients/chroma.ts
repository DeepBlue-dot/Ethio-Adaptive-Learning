import { ChromaClient, type EmbeddingFunction } from "chromadb"

const CHROMA_URL = process.env.CHROMADB_BASE_URL || "http://localhost:8000"

let client: ChromaClient | null = null
const noopEmbeddingFunction: EmbeddingFunction = {
  generate: async (texts) => texts.map(() => []),
}

export function getChromaClient() {
  if (!client) {
    client = new ChromaClient({ path: CHROMA_URL })
  }
  return client
}

export async function getCollection(name: string) {
  const chroma = getChromaClient()
  try {
    return await chroma.getCollection({ 
      name,
      embeddingFunction: noopEmbeddingFunction,
    })
  } catch {
    return await chroma.createCollection({ 
      name,
      embeddingFunction: noopEmbeddingFunction,
    })
  }
}

/**
 * Checks if ChromaDB is healthy
 */
export async function checkChromaHealth() {
  const chroma = getChromaClient()
  try {
    const version = await chroma.version()
    return !!version
  } catch {
    return false
  }
}
