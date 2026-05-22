"use server"

import { revalidatePath } from "next/cache"
import { MediaAssetKind } from "@prisma/client"

import {
  bulkDeleteItems,
  bulkPublishItems,
  bulkUnpublishItems,
  createItem,
  updateItem,
  requireCmsAccess,
} from "@/lib/cms"
import { uploadImage } from "@/lib/cloudinary/upload-image"
import {
  scanResourceUsage as scanUsage,
  getUnusedResourcesCount as getUnusedCount,
} from "@/lib/studio/usage-tracking"
import { searchResources as runSearch } from "@/lib/studio/resource-search"
import { prisma } from "@/lib/prisma"
import { getResourceMetrics } from "@/lib/studio/metrics"
import { normalizeYouTubeUrl } from "@/lib/cms/youtube"
import { logCmsActivity } from "@/lib/cms/activity"

export async function createYouTubeResource(url: string, title?: string) {
  const session = await requireCmsAccess()
  const userId = session.user.id

  try {
    const normalized = normalizeYouTubeUrl(url)
    const result = await createItem("media-asset", {
      kind: MediaAssetKind.YOUTUBE_EMBED,
      title: title || `YouTube: ${normalized.videoId}`,
      url: normalized.url,
      videoId: normalized.videoId,
      thumbnailUrl: normalized.thumbnailUrl,
      createdById: userId,
    }, userId)

    revalidatePath("/admin/resources")
    return { ok: true, id: result.entity.id }
  } catch (error) {
    console.error("Failed to create YouTube resource:", error)
    return { ok: false, error: error instanceof Error ? error.message : "Invalid YouTube URL." }
  }
}

export async function createPhetResource(url: string, title?: string) {
  const session = await requireCmsAccess()
  const userId = session.user.id

  try {
    const phetUrl = new URL(url)
    if (!phetUrl.hostname.includes("phet.colorado.edu")) {
      throw new Error("Invalid PhET URL. Must be from phet.colorado.edu.")
    }

    // Try to extract a clean title from the URL slug if not provided
    // Example: .../number-pairs/latest/number-pairs_en.html -> number-pairs
    let inferredTitle = title
    if (!inferredTitle) {
      const parts = phetUrl.pathname.split("/")
      const slug = parts.find(p => p && p !== "sims" && p !== "html" && p !== "latest")
      inferredTitle = slug ? `PhET: ${slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}` : "PhET Simulation"
    }

    const result = await createItem("media-asset", {
      kind: "PHET_SIMULATION" as MediaAssetKind,
      title: inferredTitle,
      url: url,
      // We can use a standard PhET icon/image for thumbnails for now
      thumbnailUrl: "https://phet.colorado.edu/images/phet-logo-sim-page.png",
      createdById: userId,
    }, userId)

    revalidatePath("/admin/resources")
    return { ok: true, id: result.entity.id }
  } catch (error) {
    console.error("Failed to create PhET resource:", error)
    return { ok: false, error: error instanceof Error ? error.message : "Invalid PhET URL." }
  }
}

export async function searchResources(query: string) {
  await requireCmsAccess()
  try {
    const results = await runSearch(query)
    return { ok: true, results }
  } catch (error) {
    console.error("Search failed:", error)
    return { ok: false, error: "Search failed." }
  }
}

export async function getResourceUsage(resourceId: string) {
  await requireCmsAccess()
  try {
    const usage = await scanUsage(resourceId)
    return { ok: true, usage }
  } catch (error) {
    console.error("Failed to scan resource usage:", error)
    return { ok: false, error: "Usage scan failed." }
  }
}

export async function getResourceById(id: string) {
  await requireCmsAccess()

  // Try MediaAsset
  const asset = await prisma.mediaAsset.findUnique({
    where: { id }
  })

  if (asset) {
    let creatorName = "System"
    if (asset.createdById) {
      const user = await prisma.user.findUnique({ 
        where: { id: asset.createdById }, 
        select: { name: true, username: true } 
      })
      creatorName = user?.name || user?.username || "Nexus Admin"
    }

    return {
      ok: true,
      resource: {
        id: asset.id,
        type: "media-asset",
        kind: asset.kind,
        title: asset.title || "Untitled Asset",
        url: asset.url,
        thumbnailUrl: asset.thumbnailUrl,
        publicId: asset.publicId,
        videoId: asset.videoId,
        alt: asset.alt,
        caption: asset.caption,
        width: asset.width,
        height: asset.height,
        bytes: asset.bytes,
        status: asset.status,
        updatedAt: asset.updatedAt,
        createdById: asset.createdById,
        creatorName
      },
    }
  }

  // Try ContentSnippet
  const snippet = await prisma.contentSnippet.findUnique({
    where: { id },
    include: {
      author: { select: { name: true, username: true } }
    }
  })

  if (snippet) {
    return {
      ok: true,
      resource: {
        id: snippet.id,
        type: "content-snippet",
        title: snippet.title,
        status: snippet.status,
        updatedAt: snippet.updatedAt,
        contentBlocks: snippet.contentBlocks,
        authorId: snippet.authorId,
        creatorName: snippet.author?.name || snippet.author?.username || "Content Specialist"
      },
    }
  }

  return { ok: false, error: "Resource not found." }
}

export async function getUnusedResourcesCount() {
  await requireCmsAccess()
  try {
    const count = await getUnusedCount()
    return { ok: true, count }
  } catch (error) {
    console.error("Failed to get unused resources count:", error)
    return { ok: false, count: 0 }
  }
}

export async function updateResourceMetadata(id: string, type: "media-asset" | "content-snippet", data: { title?: string, alt?: string, caption?: string }) {
  const session = await requireCmsAccess()
  const userId = session.user.id

  try {
    const result = await updateItem(type, id, data, undefined, userId)
    
    await logCmsActivity({
      userId,
      action: "UPDATE",
      contentType: type,
      entityId: id,
      entityTitle: data.title || "Updated Metadata",
      details: { metadata: data }
    })

    revalidatePath("/admin/resources")
    return { ok: true, resource: result.entity }
  } catch (error) {
    console.error("Failed to update resource metadata:", error)
    return { ok: false, error: "Failed to update metadata." }
  }
}

export async function getResourceMetricsAction() {
  await requireCmsAccess()
  try {
    const metrics = await getResourceMetrics()
    return { ok: true, metrics }
  } catch (error) {
    console.error("Failed to get resource metrics:", error)
    return { ok: false, error: "Failed to fetch metrics." }
  }
}

export async function uploadResourceFile(formData: FormData) {
  const session = await requireCmsAccess()
  const userId = session.user.id

  const files = formData.getAll("files") as File[]
  if (!files || files.length === 0) {
    return { ok: false, error: "No files provided." }
  }

  type UploadResourceItemData =
    | {
        kind: MediaAssetKind
        title: string
        publicId: string
        url: string
        width: number
        height: number
        bytes: number
        thumbnailUrl: string
        createdById: string
      }
    | {
        title: string
        contentBlocks: Array<{ type: "paragraph"; text: string }>
        authorId: string
      }

  type UploadResourceResult =
    | { ok: true; id: string; title: string }
    | { ok: false; title: string; error: string }

  const results: UploadResourceResult[] = []

  for (const file of files) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      let contentType: "media-asset" | "content-snippet" = "media-asset"
      let itemData: UploadResourceItemData

      if (file.type.startsWith("image/")) {
        const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

        const uploadResult = await uploadImage(base64, {
          resource_type: "image",
          folder: "ethioprep/resources",
        })

        itemData = {
          kind: MediaAssetKind.IMAGE,
          title: file.name,
          publicId: uploadResult.public_id,
          url: uploadResult.secure_url,
          width: uploadResult.width,
          height: uploadResult.height,
          bytes: uploadResult.bytes,
          thumbnailUrl: uploadResult.thumbnail_url || uploadResult.secure_url,
          createdById: userId,
        }
      } else {
        const isTextFile =
          file.type === "text/plain" ||
          file.type === "text/markdown" ||
          file.name.toLowerCase().endsWith(".txt") ||
          file.name.toLowerCase().endsWith(".md")

        if (isTextFile) {
          contentType = "content-snippet"
          const text = buffer.toString("utf-8")
          itemData = {
            title: file.name,
            contentBlocks: [
              {
                type: "paragraph",
                text: text,
              },
            ],
            authorId: userId,
          }
        } else {
          throw new Error(`Unsupported file type: ${file.type || "unknown"} (${file.name})`)
        }
      }

      const createResult = await createItem(contentType, itemData, userId)
      results.push({ ok: true, id: createResult.entity.id, title: file.name })
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error)
      results.push({ ok: false, title: file.name, error: error instanceof Error ? error.message : "Process failed." })
    }
  }

  revalidatePath("/admin/resources")

  const successCount = results.filter((r) => r.ok).length
  return {
    ok: successCount > 0,
    results,
    message: `${successCount} of ${files.length} items processed successfully.`,
  }
}

export async function bulkActionResources(
  items: Array<{ id: string; type: "media-asset" | "content-snippet" }>,
  intent: "publish" | "unpublish" | "delete"
) {
  const session = await requireCmsAccess()
  const userId = session.user.id

  const grouped = items.reduce((acc, item) => {
    acc[item.type] = acc[item.type] || []
    acc[item.type].push(item.id)
    return acc
  }, {} as Record<string, string[]>)

  try {
    for (const [type, ids] of Object.entries(grouped)) {
      switch (intent) {
        case "publish":
          await bulkPublishItems(type, ids, userId)
          break
        case "unpublish":
          await bulkUnpublishItems(type, ids, userId)
          break
        case "delete":
          await bulkDeleteItems(type, ids, userId)
          break
      }
    }

    revalidatePath("/admin/resources")
    return { ok: true, message: `Bulk ${intent} completed.` }
  } catch (error) {
    console.error(`Bulk ${intent} failed:`, error)
    return { ok: false, error: `Bulk ${intent} failed.` }
  }
}
