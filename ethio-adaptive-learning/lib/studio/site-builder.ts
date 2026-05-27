import { type CmsPublicationStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"

import {
  getContentBlockReferences,
  contentBlocksSchema,
  normalizeContentBlocks,
  type CmsContentBlock,
} from "@/lib/cms/content-blocks"
import { getItem, saveDraftItem } from "@/lib/cms/core"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-server"

export type SiteProjectSummary = {
  id: string
  title: string
  slug: string
  description: string
  status: CmsPublicationStatus
  pageCount: number
  livePageCount: number
  draftPageCount: number
  groupCount: number
  blockCount: number
  lastActivity: Date | null
  lastEditedPage: {
    id: string
    title: string
    updatedAt: Date
  } | null
  author: {
    username: string
  }
  previewPath: string
}

export type SiteMapPage = {
  id: string
  title: string
  slug: string
  status: CmsPublicationStatus
  blockCount: number
  updatedAt: Date
  builderPath: string
  livePath: string
}

export type SiteMapGroup = {
  id: string
  title: string
  slug: string
  order: number
  status: CmsPublicationStatus
  pages: SiteMapPage[]
}

export type SiteMapProject = {
  id: string
  title: string
  slug: string
  status: CmsPublicationStatus
  groups: SiteMapGroup[]
}

export type SiteBuilderBlock = {
  id: string
  type: CmsContentBlock["type"]
  label: string
  order: number
  status: "draft" | "synced"
  data: CmsContentBlock
}

export type PageBuilderData = {
  site: {
    id: string
    title: string
    slug: string
    previewPath: string
  }
  group: {
    id: string
    title: string
    slug: string
    order: number
  }
  page: {
    id: string
    title: string
    slug: string
    description: string
    status: CmsPublicationStatus
    updatedAt: Date
    livePath: string
    draftPreviewPath: string
  }
  blocks: SiteBuilderBlock[]
}

export async function getSiteProjectsData() {
  const sites = await prisma.course.findMany({
    where: { archivedAt: null },
    include: {
      author: { select: { username: true } },
      units: {
        include: {
          concepts: {
            select: {
              id: true,
              title: true,
              status: true,
              updatedAt: true,
              contentBlocks: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  const projects: SiteProjectSummary[] = sites.map((site) => {
    const pages = site.units.flatMap((unit) => unit.concepts)
    const livePageCount = pages.filter((page) => page.status === "PUBLISHED").length
    const draftPageCount = pages.length - livePageCount
    const lastEditedPage = pages.toSorted((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())[0] ?? null
    const lastActivity = lastEditedPage?.updatedAt ?? site.updatedAt
    const blockCount = pages.reduce((sum, page) => sum + normalizeContentBlocks(page.contentBlocks).length, 0)

    return {
      id: site.id,
      title: site.title,
      slug: site.slug,
      description: site.description ?? "",
      status: site.status,
      pageCount: pages.length,
      livePageCount,
      draftPageCount,
      groupCount: site.units.length,
      blockCount,
      lastActivity,
      lastEditedPage: lastEditedPage
        ? {
            id: lastEditedPage.id,
            title: lastEditedPage.title,
            updatedAt: lastEditedPage.updatedAt,
          }
        : null,
      author: {
        username: site.author?.username ?? "System",
      },
      previewPath: `/student`,
    }
  })

  return { projects }
}

export async function getSiteMapData(siteId?: string) {
  const sites = await prisma.course.findMany({
    where: {
      archivedAt: null,
      ...(siteId ? { id: siteId } : {}),
    },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: {
          concepts: {
            orderBy: { title: "asc" },
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              updatedAt: true,
              contentBlocks: true,
            },
          },
        },
      },
    },
    orderBy: { title: "asc" },
  })

  const projects: SiteMapProject[] = sites.map((site) => ({
    id: site.id,
    title: site.title,
    slug: site.slug,
    status: site.status,
    groups: site.units.map((unit) => ({
      id: unit.id,
      title: unit.title,
      slug: unit.slug,
      order: unit.order,
      status: unit.status,
      pages: unit.concepts.map((page) => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status,
        blockCount: normalizeContentBlocks(page.contentBlocks).length,
        updatedAt: page.updatedAt,
        builderPath: `/admin/studio/sites/${site.id}/pages/${page.id}`,
        livePath: `/student/concept/${page.id}/learn`,
      })),
    })),
  }))

  return { projects }
}

export async function getSiteProjectData(siteId: string) {
  const [{ projects }, { projects: siteMap }] = await Promise.all([
    getSiteProjectsData(),
    getSiteMapData(siteId),
  ])

  const project = projects.find((item) => item.id === siteId) ?? null
  const map = siteMap[0] ?? null

  if (!project || !map) return null

  const recentPages = map.groups
    .flatMap((group) => group.pages.map((page) => ({ ...page, groupTitle: group.title })))
    .toSorted((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
    .slice(0, 8)

  const publishQueue = recentPages.filter((page) => page.status !== "PUBLISHED").slice(0, 6)

  return {
    project,
    siteMap: map,
    recentPages,
    publishQueue,
  }
}

export async function getPageBuilderData(siteId: string, pageId: string): Promise<PageBuilderData | null> {
  const page = await prisma.concept.findUnique({
    where: { id: pageId },
    include: {
      unit: {
        include: {
          course: true,
        },
      },
    },
  })

  if (!page || page.unit.courseId !== siteId || page.unit.course.archivedAt) {
    return null
  }

  return {
    site: {
      id: page.unit.course.id,
      title: page.unit.course.title,
      slug: page.unit.course.slug,
      previewPath: "/student",
    },
    group: {
      id: page.unit.id,
      title: page.unit.title,
      slug: page.unit.slug,
      order: page.unit.order,
    },
    page: {
      id: page.id,
      title: page.title,
      slug: page.slug,
      description: page.description ?? "",
      status: page.status,
      updatedAt: page.updatedAt,
      livePath: `/student/concept/${page.id}/learn`,
      draftPreviewPath: `/admin/studio/concept/${page.id}/preview`,
    },
    blocks: normalizeBuilderBlocks(page.contentBlocks),
  }
}

export async function getStudioContentPreview(type: string, id: string) {
  const item = await getItem(type, id)
  if (!item) return null

  if (type !== "concept" && type !== "content-snippet") {
    return {
      item,
      blocks: [],
      assets: {},
      questions: {},
      snippets: {},
      livePath: type === "concept" ? `/student/concept/${id}/learn` : null,
    }
  }

  const blocks = normalizeContentBlocks(item.data.contentBlocks)
  const references = getContentBlockReferences(blocks)
  const [assets, questions, snippets] = await Promise.all([
    references.assetIds.length
      ? prisma.mediaAsset.findMany({
          where: { id: { in: references.assetIds } },
        })
      : [],
    references.questionIds.length
      ? prisma.question.findMany({
          where: { id: { in: references.questionIds } },
          select: { id: true, content: true },
        })
      : [],
    references.snippetIds.length
      ? prisma.contentSnippet.findMany({
          where: { id: { in: references.snippetIds } },
          select: { id: true, title: true, contentBlocks: true },
        })
      : [],
  ])

  return {
    item,
    blocks,
    assets: Object.fromEntries(
      assets.map((asset) => [
        asset.id,
        {
          id: asset.id,
          kind: asset.kind,
          title: asset.title,
          alt: asset.alt,
          caption: asset.caption,
          url: asset.url,
          width: asset.width,
          height: asset.height,
          videoId: asset.videoId,
        },
      ])
    ),
    questions: Object.fromEntries(questions.map((question) => [question.id, question])),
    snippets: Object.fromEntries(
      snippets.map((snippet) => [
        snippet.id,
        {
          id: snippet.id,
          title: snippet.title,
          contentBlocks: normalizeContentBlocks(snippet.contentBlocks),
        },
      ])
    ),
    livePath: type === "concept" ? `/student/concept/${id}/learn` : null,
  }
}

export async function updatePageBlocks(pageId: string, blocks: CmsContentBlock[]) {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])
  const parsed = contentBlocksSchema.safeParse(blocks)

  if (!parsed.success) {
    return { ok: false, message: "Page blocks contain invalid fields." }
  }

  try {
    const item = await getItem("concept", pageId)
    if (!item) {
      return { ok: false, message: "Page not found." }
    }

    const mergedData = {
      ...item.data,
      contentBlocks: parsed.data,
    }

    const result = await saveDraftItem("concept", pageId, mergedData, session.user.id)
    for (const path of result.revalidationPaths) {
      revalidatePath(path)
    }
    revalidatePath("/admin/studio")
    return {
      ok: true,
      message: "Page blocks saved.",
      updatedAt: result.entity.lifecycle?.updatedAt,
      blocks: normalizeBuilderBlocks(parsed.data),
    }
  } catch (error) {
    console.error(`Failed to update page blocks for ${pageId}:`, error)
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to update page blocks.",
    }
  }
}

export async function reorderPageBlocks(pageId: string, blockIds: string[]) {
  const page = await prisma.concept.findUnique({
    where: { id: pageId },
    select: { contentBlocks: true },
  })

  if (!page) {
    return { ok: false, message: "Page not found." }
  }

  const blocks = normalizeContentBlocks(page.contentBlocks)
  const order = new Map(blockIds.map((id, index) => [id, index]))
  const reordered = blocks.toSorted((left, right) => {
    const leftIndex = order.get(left.id ?? "") ?? Number.MAX_SAFE_INTEGER
    const rightIndex = order.get(right.id ?? "") ?? Number.MAX_SAFE_INTEGER
    return leftIndex - rightIndex
  })

  return updatePageBlocks(pageId, reordered)
}

export function normalizeBuilderBlocks(value: unknown): SiteBuilderBlock[] {
  return normalizeContentBlocks(value).map((block, index) => ({
    id: block.id ?? `block-${index + 1}`,
    type: block.type,
    label: getBlockLabel(block),
    order: index + 1,
    status: "synced",
    data: block,
  }))
}

export function getBlockLabel(block: CmsContentBlock) {
  switch (block.type) {
    case "heading":
      return block.text || "Heading"
    case "paragraph":
      return block.title || previewText(block.text) || "Paragraph"
    case "image":
      return block.caption || block.alt || "Image"
    case "video":
      return block.caption || "Video"
    case "embed":
      return block.title || "Embed"
    case "quiz":
      return "Quiz"
    case "code":
      return block.language ? `${block.language} code` : "Code"
    case "snippet":
      return "Content snippet"
    case "phet":
      return block.title || "Interactive simulation"
  }
}

function previewText(value: string) {
  return value.trim().split(/\s+/).slice(0, 6).join(" ")
}
