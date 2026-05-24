import { prisma } from "@/lib/prisma"
import { MediaAssetKind } from "@prisma/client"
import { type ResourceItem } from "@/components/admin/resources/resource-card"
import { 
  listItems,
  resolveCmsContentType,
} from "@/lib/cms"
import { type CmsEntity } from "@/lib/cms/types"
import { type CmsContentBlock, normalizeContentBlocks } from "@/lib/cms/content-blocks"

// ============================================================================
// YouTube Specialization Handler
// ============================================================================

interface YouTubeOEmbedResponse {
  title?: string
  author_name?: string
  author_url?: string
  type: string
  height: number
  width: number
  version: string
  provider_name: string
  provider_url: string
  thumbnail_height: number
  thumbnail_width: number
  thumbnail_url: string
  html: string
}

function parseDate(value?: string | Date | null): Date {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

async function fetchYouTubeMetadata(videoId: string, url: string) {
  // Add a short timeout and explicit abort so long network waits don't break
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
  const controller = new AbortController()
  const timeoutMs = 5000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(oembedUrl, {
      signal: controller.signal,
      next: { revalidate: 86400 },
      headers: {
        "Accept": "application/json",
      },
    })

    if (!response.ok) {
      console.warn(`YouTube oEmbed request failed: ${response.status} ${response.statusText}`)
      return { duration: undefined, author: undefined, publishedAt: undefined }
    }

    // Defensive JSON parse
    let data: YouTubeOEmbedResponse | null = null
    try {
      data = await response.json()
    } catch (err) {
      console.warn("YouTube oEmbed returned invalid JSON", err)
    }

    return {
      duration: undefined, // oEmbed doesn't provide duration, would need Data API
      author: data?.author_name || undefined,
      publishedAt: undefined, // oEmbed doesn't provide publication date
    }
  } catch (error: any) {
    if (error && error.name === "AbortError") {
      console.warn(`YouTube oEmbed request aborted after ${timeoutMs}ms: ${oembedUrl}`)
    } else {
      console.error("Failed to fetch YouTube metadata:", error)
    }

    return { duration: undefined, author: undefined, publishedAt: undefined }
  } finally {
    clearTimeout(timeout)
  }
}

// ============================================================================
// Snippet Validation Handler
// ============================================================================

type SnippetDebugBlock = {
  type: string
  text?: string
  title?: string | null
}

interface SnippetValidation {
  isValid: boolean
  errors: string[]
  preview: string
  validationStatus: "valid" | "invalid" | "warning"
}

function validateSnippet(blocks: SnippetDebugBlock[]): SnippetValidation {
  const errors: string[] = []
  let isValid = true

  // Check for empty blocks
  const emptyBlocks = blocks.filter(b => !b.text || b.text.trim() === "").length
  if (emptyBlocks > 0) {
    errors.push(`${emptyBlocks} empty block(s) detected`)
    isValid = false
  }

  // Check text length
  const totalLength = blocks.reduce((sum, b) => sum + (b.text?.length || 0), 0)
  if (totalLength === 0) {
    errors.push("No content found in snippet")
    isValid = false
  } else if (totalLength > 50000) {
    errors.push("Snippet exceeds 50KB limit")
    isValid = false
  }

  // Check for markdown validation issues
  const markdownPattern = /```[\s\S]*?```/g
  const codeBlocks = blocks
    .flatMap(b => b.text?.match(markdownPattern) || [])
    .filter(Boolean)

  codeBlocks.forEach((block) => {
    // Basic markdown validation - check for unclosed code blocks
    const backticks = (block.match(/```/g) || []).length
    if (backticks % 2 !== 0) {
      errors.push("Unclosed markdown code block detected")
      isValid = false
    }
  })

  // Generate preview
  const previewText = blocks
    .map(b => b.text || b.title || "")
    .filter(Boolean)
    .join(" ")
    .slice(0, 200)

  const validationStatus = isValid ? "valid" : errors.some(e => e.includes("Unclosed")) ? "warning" : "invalid"

  return {
    isValid,
    errors,
    preview: previewText,
    validationStatus
  }
}

// ============================================================================
// Snippet Preview Renderer (with basic syntax highlighting support)
// ============================================================================

function renderSnippetPreview(blocks: SnippetDebugBlock[], title?: string): string {
  if (blocks.length === 0) {
    return title ? `Snippet: ${title}` : "Snippet preview unavailable"
  }

  const textBlocks = blocks
    .map((block) => {
      if (block.title) {
        return `${block.title}: ${block.text || ""}`
      }

      const text = block.text || ""
      if (!text.trim()) return ""

      if (text.includes("```")) {
        const firstCode = text.match(/```[\s\S]*?```/)
        return firstCode ? firstCode[0] : text
      }

      if (text.includes("$")) {
        return text.replace(/\$(.*?)\$/g, "[$1]")
      }

      return text
    })
    .filter(Boolean)

  if (textBlocks.length === 0) {
    return title ? `Snippet: ${title}` : "Snippet preview unavailable"
  }

  return textBlocks.join("\n\n").slice(0, 300)
}

export async function getUnifiedResources(): Promise<ResourceItem[]> {
  const mediaAssetDefinition = resolveCmsContentType("media-asset")
  const contentSnippetDefinition = resolveCmsContentType("content-snippet")

  if (!mediaAssetDefinition || !contentSnippetDefinition) {
    return []
  }

  // Fetch both types of resources
  type MediaAssetEntity = CmsEntity<{
    kind?: MediaAssetKind
    url?: string
    thumbnailUrl?: string
    publicId?: string
    videoId?: string
    alt?: string
    caption?: string
    width?: number
    height?: number
    bytes?: number | null
  }>

  type ContentSnippetEntity = CmsEntity<{
    contentBlocks?: CmsContentBlock[]
  }>

  const [mediaAssets, contentSnippets] = await Promise.all([
    listItems("media-asset") as Promise<MediaAssetEntity[]>,
    listItems("content-snippet") as Promise<ContentSnippetEntity[]>
  ])

  // Map to unified ResourceItem type with specialization
  const mediaAssetItems = await Promise.allSettled(
    mediaAssets.map(async (asset) => {
      const baseItem: ResourceItem = {
        id: asset.id,
        type: "media-asset" as const,
        kind: asset.data.kind,
        title: asset.title,
        url: asset.data.url || undefined,
        thumbnailUrl: asset.data.thumbnailUrl || asset.data.url || undefined,
        publicId: asset.data.publicId || undefined,
        videoId: asset.data.videoId || undefined,
        alt: asset.data.alt || undefined,
        caption: asset.data.caption || undefined,
        width: typeof asset.data.width === "number" ? asset.data.width : undefined,
        height: typeof asset.data.height === "number" ? asset.data.height : undefined,
        bytes: asset.data.bytes,
        status: asset.lifecycle?.status ?? "DRAFT",
        updatedAt: parseDate(asset.lifecycle?.updatedAt)
      }

      // Specialize YouTube videos
      if (asset.data.kind === MediaAssetKind.YOUTUBE_EMBED && asset.data.videoId && asset.data.url) {
        try {
          const ytMetadata = await fetchYouTubeMetadata(asset.data.videoId, asset.data.url)
          return { ...baseItem, ...ytMetadata }
        } catch (mediaError) {
          console.error("Error while enriching YouTube metadata for media asset:", asset.id, mediaError)
          return baseItem
        }
      }

      return baseItem
    })
  )

  const normalizedMediaAssetItems = mediaAssetItems.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value
    }

    const asset = mediaAssets[index]
    console.error("Failed to map media asset to ResourceItem:", asset?.id, result.reason)

    return {
      id: asset.id,
      type: "media-asset" as const,
      kind: asset.data.kind,
      title: asset.title,
      status: asset.lifecycle?.status ?? "DRAFT",
      updatedAt: asset.lifecycle?.updatedAt ? new Date(asset.lifecycle.updatedAt) : new Date(),
    } as ResourceItem
  })

  const snippetItems = contentSnippets.map((snippet) => {
    const blocks = normalizeContentBlocks(snippet.data.contentBlocks ?? [])
    const debugBlocks = blocks.map((block) => ({
      type: block.type,
      text: "text" in block ? block.text : undefined,
      title: "title" in block ? block.title : undefined,
    }))

    const searchableContent = debugBlocks
      .map((b) => b.text || b.title || "")
      .filter(Boolean)
      .join(" ")

    // Validate snippet
    const validation = validateSnippet(debugBlocks)
    const preview = renderSnippetPreview(debugBlocks, snippet.title)

    return {
      id: snippet.id,
      type: "content-snippet" as const,
      title: snippet.title,
      status: snippet.lifecycle?.status ?? "DRAFT",
      updatedAt: parseDate(snippet.lifecycle?.updatedAt),
      searchableContent,
      ...validation,
      preview,
      contentBlocks: blocks
    }
  })

  const unifiedItems: ResourceItem[] = [...normalizedMediaAssetItems, ...snippetItems]

  // Sort by updatedAt descending
  unifiedItems.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  return unifiedItems
}
