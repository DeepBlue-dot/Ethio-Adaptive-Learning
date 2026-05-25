import { getCollection } from "../clients/chroma"
import { generateEmbedding } from "../clients/ollama"
import { RetrievalResult } from "../types"

/**
 * Performs semantic search against ChromaDB curriculum chunks
 */
export async function retrieveCurriculumContext(
  query: string,
  limit = 3
): Promise<RetrievalResult[]> {
  const collection = await getCollection("curriculum_chunks")
  const queryEmbedding = await generateEmbedding(query)

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: limit,
  })

  const items: RetrievalResult[] = []
  
  if (results.ids[0]) {
    for (let i = 0; i < results.ids[0].length; i++) {
      items.push({
        id: results.ids[0][i],
        text: results.documents[0][i] || "",
        score: results.distances ? (results.distances[0][i] ?? 0) : 0,
        metadata: results.metadatas[0][i] || {},
      })
    }
  }

  return items
}
