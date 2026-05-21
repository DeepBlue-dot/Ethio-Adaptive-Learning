import { notFound } from "next/navigation"

import { ResourceHubClient } from "@/components/admin/studio/modules/resources/resource-hub-client"
import { type ResourceItem } from "@/components/admin/studio/modules/resources/resource-card"
import { type CmsEntity } from "@/lib/cms/types"
import { MediaAssetKind } from "@prisma/client"
import {
  listItems,
  requireCmsAccess,
  resolveCmsContentType,
} from "@/lib/cms"

export default async function ResourcesPage() {
  await requireCmsAccess()

  const mediaAssetDefinition = resolveCmsContentType("media-asset")
  const contentSnippetDefinition = resolveCmsContentType("content-snippet")

  if (!mediaAssetDefinition || !contentSnippetDefinition) {
    notFound()
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
  }>

  type ContentSnippetEntity = CmsEntity<{
    contentBlocks?: Array<{
      type: "paragraph"
      text: string
      title?: string
    }>
  }>

  const [mediaAssets, contentSnippets] = await Promise.all([
    listItems("media-asset") as Promise<MediaAssetEntity[]>,
    listItems("content-snippet") as Promise<ContentSnippetEntity[]>
  ])

  // Map to unified ResourceItem type
  const unifiedItems: ResourceItem[] = [
    ...mediaAssets.map((asset) => ({
      id: asset.id,
      type: "media-asset" as const,
      kind: asset.data.kind,
      title: asset.title,
      url: asset.data.url || undefined,
      thumbnailUrl: asset.data.thumbnailUrl || undefined,
      publicId: asset.data.publicId || undefined,
      videoId: asset.data.videoId || undefined,
      alt: asset.data.alt || undefined,
      caption: asset.data.caption || undefined,
      width: typeof asset.data.width === "number" ? asset.data.width : undefined,
      height: typeof asset.data.height === "number" ? asset.data.height : undefined,
      status: asset.lifecycle?.status ?? "DRAFT",
      updatedAt: asset.lifecycle?.updatedAt ? new Date(asset.lifecycle.updatedAt) : new Date()
    })),
    ...contentSnippets.map((snippet) => {
      const blocks = snippet.data.contentBlocks ?? []
      const searchableContent = blocks
        .map((b) => b.text || b.title || "")
        .filter(Boolean)
        .join(" ")

      return {
        id: snippet.id,
        type: "content-snippet" as const,
        title: snippet.title,
        status: snippet.lifecycle?.status ?? "DRAFT",
        updatedAt: snippet.lifecycle?.updatedAt ? new Date(snippet.lifecycle.updatedAt) : new Date(),
        searchableContent
      }
    })
  ]

  // Sort by updatedAt descending
  unifiedItems.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  return <ResourceHubClient initialItems={unifiedItems} />
}
