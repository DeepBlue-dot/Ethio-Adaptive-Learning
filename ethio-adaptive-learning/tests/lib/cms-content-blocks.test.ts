import { describe, expect, it } from "vitest"

import {
  buildLegacyContentBlocks,
  getContentBlockReferences,
  normalizeContentBlocks,
} from "@/lib/cms/content-blocks"
import { normalizeYouTubeUrl } from "@/lib/cms/youtube"

describe("CMS content blocks", () => {
  it("backfills legacy overview, chunks, and worked examples into paragraph blocks", () => {
    const blocks = buildLegacyContentBlocks({
      contentBody: "Overview",
      chunks: [
        {
          id: "chunk_1",
          title: "Chunk A",
          bodyMd: "Chunk body",
        },
      ],
      workedExamples: [
        {
          id: "example_1",
          title: "Example A",
          problemMd: "Problem",
          solutionMd: "Solution",
        },
      ],
    })

    expect(blocks).toEqual([
      {
        id: "legacy-overview",
        type: "paragraph",
        title: null,
        text: "Overview",
      },
      {
        id: "chunk_1",
        type: "paragraph",
        title: "Chunk A",
        text: "Chunk body",
      },
      {
        id: "example_1",
        type: "paragraph",
        title: "Example: Example A",
        text: "Problem\n\nProblem\n\nSolution\n\nSolution",
      },
    ])
  })

  it("extracts reusable references from structured blocks", () => {
    const blocks = normalizeContentBlocks([
      {
        id: "image_1",
        type: "image",
        assetId: "asset_1",
      },
      {
        id: "quiz_1",
        type: "quiz",
        questionId: "question_1",
      },
      {
        id: "snippet_1",
        type: "snippet",
        snippetId: "snippet_1",
      },
    ])

    expect(getContentBlockReferences(blocks)).toEqual({
      assetIds: ["asset_1"],
      questionIds: ["question_1"],
      snippetIds: ["snippet_1"],
    })
  })

  it("normalizes YouTube URLs and rejects non-YouTube embeds", () => {
    expect(normalizeYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      videoId: "dQw4w9WgXcQ",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    })

    expect(() => normalizeYouTubeUrl("https://example.com/video")).toThrow("Only YouTube video URLs are supported.")
  })
})
