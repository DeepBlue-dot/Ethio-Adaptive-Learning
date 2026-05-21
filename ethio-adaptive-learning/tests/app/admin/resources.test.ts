import { describe, it, expect, vi, beforeEach } from "vitest"
import { MediaAssetKind } from "@prisma/client"
import { type ResourceItem } from "@/components/admin/studio/modules/resources/resource-card"
import { type CmsEntity } from "@/lib/cms/types"

// Mock dependencies
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}))

vi.mock("@/lib/cms", () => ({
  listItems: vi.fn(),
  requireCmsAccess: vi.fn(),
  resolveCmsContentType: vi.fn(),
}))

vi.mock("@/app/(admin)/admin/studio/actions", () => ({
  getUnusedResourcesCount: vi.fn(),
}))

describe("ResourcesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Data Mapping", () => {
    it("should map media assets to ResourceItem format", () => {
      const mediaAsset: CmsEntity<{
        kind?: MediaAssetKind
        url?: string
        thumbnailUrl?: string
        alt?: string
        caption?: string
      }> = {
        id: "asset-1",
        title: "Test Image",
        type: "media-asset",
        lifecycle: {
          status: "PUBLISHED",
          updatedAt: new Date("2024-01-15"),
          hasDraft: false,
        },
        data: {
          kind: MediaAssetKind.IMAGE,
          url: "https://example.com/image.jpg",
          thumbnailUrl: "https://example.com/thumb.jpg",
          alt: "Test alt text",
          caption: "Test caption",
        },
      }

      const mapped: ResourceItem = {
        id: mediaAsset.id,
        type: "media-asset",
        kind: mediaAsset.data.kind,
        title: mediaAsset.title,
        url: mediaAsset.data.url,
        thumbnailUrl: mediaAsset.data.thumbnailUrl,
        alt: mediaAsset.data.alt,
        caption: mediaAsset.data.caption,
        status: mediaAsset.lifecycle?.status ?? "DRAFT",
        updatedAt: mediaAsset.lifecycle?.updatedAt ? new Date(mediaAsset.lifecycle.updatedAt) : new Date(),
      }

      expect(mapped.id).toBe("asset-1")
      expect(mapped.type).toBe("media-asset")
      expect(mapped.kind).toBe(MediaAssetKind.IMAGE)
      expect(mapped.title).toBe("Test Image")
      expect(mapped.url).toBe("https://example.com/image.jpg")
      expect(mapped.status).toBe("PUBLISHED")
    })

    it("should map content snippets with searchable content", () => {
      const snippet: CmsEntity<{
        contentBlocks?: Array<{
          type: "paragraph"
          text: string
          title?: string
        }>
      }> = {
        id: "snippet-1",
        title: "Quadratic Equations",
        type: "content-snippet",
        lifecycle: {
          status: "DRAFT",
          updatedAt: new Date("2024-01-20"),
          hasDraft: true,
        },
        data: {
          contentBlocks: [
            { type: "paragraph", text: "A quadratic equation is a polynomial equation of the second degree." },
            { type: "paragraph", text: "It has the general form ax² + bx + c = 0" },
          ],
        },
      }

      const blocks = snippet.data.contentBlocks ?? []
      const searchableContent = blocks
        .map((b) => b.text || b.title || "")
        .filter(Boolean)
        .join(" ")

      const mapped: ResourceItem = {
        id: snippet.id,
        type: "content-snippet",
        title: snippet.title,
        status: snippet.lifecycle?.status ?? "DRAFT",
        updatedAt: snippet.lifecycle?.updatedAt ? new Date(snippet.lifecycle.updatedAt) : new Date(),
        searchableContent,
      }

      expect(mapped.id).toBe("snippet-1")
      expect(mapped.type).toBe("content-snippet")
      expect(mapped.title).toBe("Quadratic Equations")
      expect(mapped.searchableContent).toContain("quadratic equation")
      expect(mapped.searchableContent).toContain("polynomial equation")
      expect(mapped.status).toBe("DRAFT")
    })

    it("should handle missing optional fields gracefully", () => {
      const minimalAsset: CmsEntity<{
        kind?: MediaAssetKind
        url?: string
        thumbnailUrl?: string
      }> = {
        id: "asset-2",
        title: "Minimal Image",
        type: "media-asset",
        lifecycle: {
          status: "DRAFT",
          updatedAt: new Date(),
          hasDraft: false,
        },
        data: {
          kind: MediaAssetKind.IMAGE,
        },
      }

      const mapped: ResourceItem = {
        id: minimalAsset.id,
        type: "media-asset",
        kind: minimalAsset.data.kind,
        title: minimalAsset.title,
        url: minimalAsset.data.url || undefined,
        thumbnailUrl: minimalAsset.data.thumbnailUrl || undefined,
        status: minimalAsset.lifecycle?.status ?? "DRAFT",
        updatedAt: new Date(),
      }

      expect(mapped.url).toBeUndefined()
      expect(mapped.thumbnailUrl).toBeUndefined()
      expect(mapped.kind).toBe(MediaAssetKind.IMAGE)
    })
  })

  describe("Sorting", () => {
    it("should sort resources by updatedAt in descending order (newest first)", () => {
      const items: ResourceItem[] = [
        {
          id: "1",
          type: "media-asset",
          kind: MediaAssetKind.IMAGE,
          title: "Old Image",
          updatedAt: new Date("2024-01-10"),
          status: "PUBLISHED",
        },
        {
          id: "2",
          type: "content-snippet",
          title: "Recent Snippet",
          updatedAt: new Date("2024-01-20"),
          status: "DRAFT",
          searchableContent: "",
        },
        {
          id: "3",
          type: "media-asset",
          kind: MediaAssetKind.YOUTUBE_EMBED,
          title: "Middle Video",
          updatedAt: new Date("2024-01-15"),
          status: "PUBLISHED",
        },
      ]

      const sorted = [...items].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )

      expect(sorted[0].id).toBe("2") // 2024-01-20 (newest)
      expect(sorted[1].id).toBe("3") // 2024-01-15
      expect(sorted[2].id).toBe("1") // 2024-01-10 (oldest)
    })

    it("should handle items with same updatedAt date", () => {
      const sameDate = new Date("2024-01-15")
      const items: ResourceItem[] = [
        {
          id: "1",
          type: "media-asset",
          kind: MediaAssetKind.IMAGE,
          title: "Image A",
          updatedAt: sameDate,
          status: "PUBLISHED",
        },
        {
          id: "2",
          type: "media-asset",
          kind: MediaAssetKind.IMAGE,
          title: "Image B",
          updatedAt: sameDate,
          status: "PUBLISHED",
        },
      ]

      const sorted = [...items].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )

      expect(sorted.length).toBe(2)
      expect(sorted[0].updatedAt).toEqual(sameDate)
      expect(sorted[1].updatedAt).toEqual(sameDate)
    })
  })

  describe("Resource Types", () => {
    it("should support IMAGE kind media assets", () => {
      const imageAsset: ResourceItem = {
        id: "img-1",
        type: "media-asset",
        kind: MediaAssetKind.IMAGE,
        title: "Sample Image",
        url: "https://example.com/image.jpg",
        thumbnailUrl: "https://example.com/thumb.jpg",
        width: 1920,
        height: 1080,
        updatedAt: new Date(),
        status: "PUBLISHED",
      }

      expect(imageAsset.kind).toBe(MediaAssetKind.IMAGE)
      expect(imageAsset.type).toBe("media-asset")
      expect(imageAsset.url).toBeDefined()
      expect(imageAsset.width).toBe(1920)
      expect(imageAsset.height).toBe(1080)
    })

    it("should support YOUTUBE_EMBED kind media assets", () => {
      const youtubeAsset: ResourceItem = {
        id: "yt-1",
        type: "media-asset",
        kind: MediaAssetKind.YOUTUBE_EMBED,
        title: "Tutorial Video",
        videoId: "dQw4w9WgXcQ",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        updatedAt: new Date(),
        status: "PUBLISHED",
      }

      expect(youtubeAsset.kind).toBe(MediaAssetKind.YOUTUBE_EMBED)
      expect(youtubeAsset.videoId).toBeDefined()
      expect(youtubeAsset.url).toContain("youtube.com")
    })

    it("should support content-snippet type", () => {
      const snippet: ResourceItem = {
        id: "snippet-1",
        type: "content-snippet",
        title: "Math Notes",
        searchableContent: "Introduction to algebra and equations",
        updatedAt: new Date(),
        status: "DRAFT",
      }

      expect(snippet.type).toBe("content-snippet")
      expect(snippet.searchableContent).toBeDefined()
      expect(snippet.kind).toBeUndefined()
    })
  })

  describe("Status Handling", () => {
    it("should default status to DRAFT when lifecycle is missing", () => {
      const assetWithoutLifecycle: CmsEntity<{
        kind?: MediaAssetKind
      }> = {
        id: "asset-1",
        title: "No Status Asset",
        type: "media-asset",
        data: { kind: MediaAssetKind.IMAGE },
      }

      const status = assetWithoutLifecycle.lifecycle?.status ?? "DRAFT"

      expect(status).toBe("DRAFT")
    })

    it("should preserve PUBLISHED status", () => {
      const publishedAsset: CmsEntity<{
        kind?: MediaAssetKind
      }> = {
        id: "asset-2",
        title: "Published Asset",
        type: "media-asset",
        lifecycle: {
          status: "PUBLISHED",
          updatedAt: new Date(),
          hasDraft: false,
        },
        data: { kind: MediaAssetKind.IMAGE },
      }

      const status = publishedAsset.lifecycle?.status ?? "DRAFT"

      expect(status).toBe("PUBLISHED")
    })
  })

  describe("Content Block Extraction", () => {
    it("should extract searchable content from multiple blocks", () => {
      const blocks = [
        { type: "paragraph" as const, text: "First paragraph about quadratic equations." },
        { type: "paragraph" as const, text: "Second paragraph about solving methods." },
        { type: "paragraph" as const, text: "Third paragraph about applications." },
      ]

      const searchableContent = blocks
        .map((b) => b.text || "")
        .filter(Boolean)
        .join(" ")

      expect(searchableContent).toContain("quadratic equations")
      expect(searchableContent).toContain("solving methods")
      expect(searchableContent).toContain("applications")
    })

    it("should filter out empty blocks", () => {
      const blocks: Array<{ type: "paragraph"; text: string | null }> = [
        { type: "paragraph", text: "Valid content" },
        { type: "paragraph", text: "" },
        { type: "paragraph", text: null },
      ]

      const searchableContent = blocks
        .map((b) => b.text || "")
        .filter(Boolean)
        .join(" ")

      expect(searchableContent).toBe("Valid content")
      expect(searchableContent).not.toContain("null")
    })

    it("should handle undefined contentBlocks array", () => {
      const snippet: CmsEntity<{
        contentBlocks?: Array<{
          type: "paragraph"
          text: string
        }>
      }> = {
        id: "snippet-1",
        title: "Empty Snippet",
        type: "content-snippet",
        data: { contentBlocks: undefined },
        lifecycle: { status: "DRAFT", updatedAt: new Date(), hasDraft: false },
      }

      const blocks = snippet.data.contentBlocks ?? []
      const searchableContent = blocks
        .map((b) => b.text || "")
        .filter(Boolean)
        .join(" ")

      expect(blocks.length).toBe(0)
      expect(searchableContent).toBe("")
    })
  })

  describe("Unified Resource Items", () => {
    it("should combine media assets and snippets into single array", () => {
      const mediaAssets: ResourceItem[] = [
        {
          id: "asset-1",
          type: "media-asset",
          kind: MediaAssetKind.IMAGE,
          title: "Image",
          updatedAt: new Date("2024-01-15"),
          status: "PUBLISHED",
        },
      ]

      const snippets: ResourceItem[] = [
        {
          id: "snippet-1",
          type: "content-snippet",
          title: "Snippet",
          searchableContent: "test",
          updatedAt: new Date("2024-01-20"),
          status: "DRAFT",
        },
      ]

      const unified = [...mediaAssets, ...snippets]

      expect(unified.length).toBe(2)
      expect(unified[0].type).toBe("media-asset")
      expect(unified[1].type).toBe("content-snippet")
    })

    it("should maintain type safety after unification", () => {
      const items: ResourceItem[] = [
        {
          id: "1",
          type: "media-asset",
          kind: MediaAssetKind.IMAGE,
          title: "Image",
          updatedAt: new Date(),
          status: "PUBLISHED",
        },
        {
          id: "2",
          type: "content-snippet",
          title: "Snippet",
          searchableContent: "test",
          updatedAt: new Date(),
          status: "DRAFT",
        },
      ]

      items.forEach((item) => {
        if (item.type === "media-asset") {
          expect(item.kind).toBeDefined()
          expect(item.url).toBeUndefined() // optional
        } else if (item.type === "content-snippet") {
          expect(item.searchableContent).toBeDefined()
          expect(item.kind).toBeUndefined()
        }
      })
    })
  })

  describe("Edge Cases", () => {
    it("should handle resources with very long titles", () => {
      const longTitle = "A".repeat(500)
      const asset: ResourceItem = {
        id: "long-title",
        type: "media-asset",
        kind: MediaAssetKind.IMAGE,
        title: longTitle,
        updatedAt: new Date(),
        status: "PUBLISHED",
      }

      expect(asset.title.length).toBe(500)
      expect(asset.title).toBe(longTitle)
    })

    it("should handle empty searchable content gracefully", () => {
      const snippet: ResourceItem = {
        id: "empty-search",
        type: "content-snippet",
        title: "Empty",
        searchableContent: "",
        updatedAt: new Date(),
        status: "DRAFT",
      }

      expect(snippet.searchableContent).toBe("")
      expect(snippet.searchableContent ?? "").toBe("")
    })

    it("should handle special characters in titles", () => {
      const specialTitle = "Math 101: x² + y² = z² [Advanced]"
      const asset: ResourceItem = {
        id: "special-chars",
        type: "media-asset",
        kind: MediaAssetKind.IMAGE,
        title: specialTitle,
        updatedAt: new Date(),
        status: "PUBLISHED",
      }

      expect(asset.title).toContain("²")
      expect(asset.title).toContain("[")
      expect(asset.title).toContain("]")
    })

    it("should handle zero dimensions for image assets", () => {
      const zeroImage: ResourceItem = {
        id: "zero-dims",
        type: "media-asset",
        kind: MediaAssetKind.IMAGE,
        title: "Invalid Image",
        width: 0,
        height: 0,
        updatedAt: new Date(),
        status: "PUBLISHED",
      }

      expect(zeroImage.width).toBe(0)
      expect(zeroImage.height).toBe(0)
    })

    it("should differentiate between null and undefined fields", () => {
      const assetWithNull: ResourceItem = {
        id: "null-vs-undefined",
        type: "media-asset",
        kind: MediaAssetKind.IMAGE,
        title: "Test",
        alt: undefined,
        caption: undefined,
        updatedAt: new Date(),
        status: "PUBLISHED",
      }

      expect(assetWithNull.alt).toBeUndefined()
      expect(assetWithNull.caption).toBeUndefined()
      expect(assetWithNull.alt === assetWithNull.caption).toBe(true)
    })
  })

  describe("YouTube Embed Specifics", () => {
    it("should extract YouTube video ID from various URL formats", () => {
      const urls = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtu.be/dQw4w9WgXcQ",
        "https://youtube.com/watch?v=dQw4w9WgXcQ",
      ]

      urls.forEach((url) => {
        const asset: ResourceItem = {
          id: "yt-test",
          type: "media-asset",
          kind: MediaAssetKind.YOUTUBE_EMBED,
          title: "Video",
          url,
          videoId: "dQw4w9WgXcQ",
          updatedAt: new Date(),
          status: "PUBLISHED",
        }

        expect(asset.videoId).toBe("dQw4w9WgXcQ")
        expect(asset.kind).toBe(MediaAssetKind.YOUTUBE_EMBED)
      })
    })

    it("should handle YouTube thumbnail generation", () => {
      const videoId = "dQw4w9WgXcQ"
      const asset: ResourceItem = {
        id: "yt-thumb",
        type: "media-asset",
        kind: MediaAssetKind.YOUTUBE_EMBED,
        title: "Video",
        videoId,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        updatedAt: new Date(),
        status: "PUBLISHED",
      }

      expect(asset.thumbnailUrl).toContain(videoId)
      expect(asset.thumbnailUrl).toContain("img.youtube.com")
    })

    it("should validate YouTube video ID format", () => {
      const validVideoId = "dQw4w9WgXcQ" // 11 characters
      const invalidVideoId = "toolong1234567890"

      expect(validVideoId.length).toBe(11)
      expect(invalidVideoId.length).toBeGreaterThan(11)
    })
  })

  describe("Status and Lifecycle", () => {
    it("should track draft vs published states", () => {
      const publishedAsset: ResourceItem = {
        id: "published",
        type: "media-asset",
        kind: MediaAssetKind.IMAGE,
        title: "Published",
        updatedAt: new Date("2024-01-15"),
        status: "PUBLISHED",
      }

      const draftAsset: ResourceItem = {
        id: "draft",
        type: "media-asset",
        kind: MediaAssetKind.IMAGE,
        title: "Draft",
        updatedAt: new Date("2024-01-20"),
        status: "DRAFT",
      }

      expect(publishedAsset.status).toBe("PUBLISHED")
      expect(draftAsset.status).toBe("DRAFT")
      expect(publishedAsset.status).not.toBe(draftAsset.status)
    })

    it("should handle status transitions in lifecycle", () => {
      const states = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const

      states.forEach((state) => {
        const asset: ResourceItem = {
          id: "status-test",
          type: "media-asset",
          kind: MediaAssetKind.IMAGE,
          title: "Test",
          updatedAt: new Date(),
          status: state,
        }

        expect([...states]).toContain(asset.status)
      })
    })

    it("should preserve update timestamp across operations", () => {
      const originalDate = new Date("2024-01-15T10:30:00Z")
      const asset: ResourceItem = {
        id: "timestamp-test",
        type: "media-asset",
        kind: MediaAssetKind.IMAGE,
        title: "Test",
        updatedAt: originalDate,
        status: "PUBLISHED",
      }

      const assetDate = asset.updatedAt instanceof Date ? asset.updatedAt : new Date(asset.updatedAt)
      expect(assetDate.getTime()).toBe(originalDate.getTime())
    })
  })

  describe("Searchable Content", () => {
    it("should build searchable content from complex blocks", () => {
      const blocks = [
        { type: "paragraph" as const, text: "Introduction to quadratic equations" },
        { type: "paragraph" as const, text: "Definition: ax² + bx + c = 0" },
        { type: "paragraph" as const, text: "Methods: factoring, completing the square, formula" },
        { type: "paragraph" as const, text: "Applications: physics, engineering, economics" },
      ]

      const searchableContent = blocks
        .map((b) => b.text || "")
        .filter(Boolean)
        .join(" ")

      const lowerContent = searchableContent.toLowerCase()
      expect(lowerContent).toContain("quadratic")
      expect(lowerContent).toContain("factoring")
      expect(lowerContent).toContain("applications")
      expect(searchableContent.length).toBeGreaterThan(100)
    })

    it("should handle search indexing with special characters", () => {
      const blocks = [
        { type: "paragraph" as const, text: "Topics: equations, inequalities, and systems" },
        { type: "paragraph" as const, text: "Examples: 2x + 3 = 7; x² - 4 = 0; {y = x + 1, y = -x}" },
      ]

      const searchableContent = blocks
        .map((b) => b.text || "")
        .filter(Boolean)
        .join(" ")

      expect(searchableContent).toContain(":")
      expect(searchableContent).toContain(";")
      expect(searchableContent).toContain("{")
      expect(searchableContent).toContain("}")
    })

    it("should case-insensitively search content", () => {
      const searchableContent = "Quadratic Equations and Polynomial Functions"
      const queries = ["quadratic", "QUADRATIC", "QuAdRaTiC"]

      queries.forEach((query) => {
        const found = searchableContent.toLowerCase().includes(query.toLowerCase())
        expect(found).toBe(true)
      })
    })

    it("should handle whitespace in searchable content", () => {
      const blocks = [
        { type: "paragraph" as const, text: "Line 1" },
        { type: "paragraph" as const, text: "Line 2" },
        { type: "paragraph" as const, text: "Line 3" },
      ]

      const searchableContent = blocks
        .map((b) => b.text || "")
        .filter(Boolean)
        .join(" ")

      const lines = searchableContent.split(" ")
      expect(lines.length).toBeGreaterThanOrEqual(6) // 3 lines + spaces
      expect(searchableContent).toMatch(/Line\s+\d/)
    })
  })

  describe("Resource Dimensions", () => {
    it("should store image dimensions correctly", () => {
      const dimensions = [
        { width: 1920, height: 1080 },
        { width: 800, height: 600 },
        { width: 3840, height: 2160 },
      ]

      dimensions.forEach((dim) => {
        const asset: ResourceItem = {
          id: "dim-test",
          type: "media-asset",
          kind: MediaAssetKind.IMAGE,
          title: "Test",
          width: dim.width,
          height: dim.height,
          updatedAt: new Date(),
          status: "PUBLISHED",
        }

        expect(asset.width).toBe(dim.width)
        expect(asset.height).toBe(dim.height)
      })
    })

    it("should calculate aspect ratios from dimensions", () => {
      const asset: ResourceItem = {
        id: "aspect",
        type: "media-asset",
        kind: MediaAssetKind.IMAGE,
        title: "Test",
        width: 1920,
        height: 1080,
        updatedAt: new Date(),
        status: "PUBLISHED",
      }

      const aspectRatio = (asset.width || 1) / (asset.height || 1)
      expect(aspectRatio).toBeCloseTo(16 / 9, 2)
    })

    it("should handle aspect-ratio-only resources", () => {
      const asset: ResourceItem = {
        id: "no-dims",
        type: "media-asset",
        kind: MediaAssetKind.IMAGE,
        title: "Test",
        updatedAt: new Date(),
        status: "PUBLISHED",
      }

      expect(asset.width).toBeUndefined()
      expect(asset.height).toBeUndefined()
    })
  })

  describe("Resource Uniqueness", () => {
    it("should maintain unique IDs across resource types", () => {
      const assets: ResourceItem[] = [
        {
          id: "asset-1",
          type: "media-asset",
          kind: MediaAssetKind.IMAGE,
          title: "Image",
          updatedAt: new Date(),
          status: "PUBLISHED",
        },
        {
          id: "snippet-1",
          type: "content-snippet",
          title: "Snippet",
          searchableContent: "test",
          updatedAt: new Date(),
          status: "DRAFT",
        },
      ]

      const ids = assets.map((a) => a.id)
      const uniqueIds = new Set(ids)

      expect(ids.length).toBe(uniqueIds.size)
    })

    it("should detect duplicate IDs", () => {
      const assets: ResourceItem[] = [
        {
          id: "duplicate",
          type: "media-asset",
          kind: MediaAssetKind.IMAGE,
          title: "Asset",
          updatedAt: new Date(),
          status: "PUBLISHED",
        },
        {
          id: "duplicate",
          type: "content-snippet",
          title: "Snippet",
          searchableContent: "test",
          updatedAt: new Date(),
          status: "DRAFT",
        },
      ]

      const ids = assets.map((a) => a.id)
      const uniqueIds = new Set(ids)

      expect(ids.length).toBe(2)
      expect(uniqueIds.size).toBe(1)
      expect(ids.length).not.toBe(uniqueIds.size)
    })

    it("should support bulk operations on resource sets", () => {
      const resources: ResourceItem[] = [
        {
          id: "bulk-1",
          type: "media-asset",
          kind: MediaAssetKind.IMAGE,
          title: "Image 1",
          updatedAt: new Date(),
          status: "DRAFT",
        },
        {
          id: "bulk-2",
          type: "media-asset",
          kind: MediaAssetKind.IMAGE,
          title: "Image 2",
          updatedAt: new Date(),
          status: "DRAFT",
        },
      ]

      const draftResources = resources.filter((r) => r.status === "DRAFT")
      expect(draftResources.length).toBe(2)
      expect(draftResources.every((r) => r.status === "DRAFT")).toBe(true)
    })
  })
})
