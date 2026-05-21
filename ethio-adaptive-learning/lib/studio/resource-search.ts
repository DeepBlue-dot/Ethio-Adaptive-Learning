import { prisma } from "@/lib/prisma"

export interface ResourceSearchResult {
  id: string
  score: number
}

interface RawSearchResult {
  id: string
  score: number
}

export async function searchResources(query: string): Promise<ResourceSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  const cleanQuery = query.trim().split(/\s+/).join(" & ")

  // Use PostgreSQL Full Text Search for better relevance and performance
  // Weighting: A (title) = 1.0, B (alt/caption) = 0.4, C (content) = 0.2
  const results = await prisma.$queryRaw<RawSearchResult[]>`
    (
      SELECT id, 
             ts_rank_cd(
               setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
               setweight(to_tsvector('english', coalesce(alt, '')), 'B') ||
               setweight(to_tsvector('english', coalesce(caption, '')), 'C'),
               to_tsquery('english', ${cleanQuery})
             ) as score
      FROM "MediaAsset"
      WHERE to_tsvector('english', coalesce(title, '') || ' ' || coalesce(alt, '') || ' ' || coalesce(caption, '')) @@ to_tsquery('english', ${cleanQuery})
    )
    UNION ALL
    (
      SELECT id, 
             ts_rank_cd(
               setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
               setweight(to_tsvector('english', "contentBlocks"::text), 'C'),
               to_tsquery('english', ${cleanQuery})
             ) as score
      FROM "ContentSnippet"
      WHERE to_tsvector('english', coalesce(title, '') || ' ' || "contentBlocks"::text) @@ to_tsquery('english', ${cleanQuery})
    )
    ORDER BY score DESC
    LIMIT 50
  `

  return results.map(r => ({
    id: r.id,
    score: Number(r.score)
  }))
}
