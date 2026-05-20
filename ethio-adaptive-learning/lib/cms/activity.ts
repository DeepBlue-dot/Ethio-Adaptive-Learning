import { prisma } from "@/lib/prisma"
import type { CmsContentTypeKey } from "@/lib/cms/types"

export type CmsActivityAction = "CREATE" | "UPDATE" | "DELETE" | "PUBLISH" | "UNPUBLISH" | "DRAFT_SAVE"

export async function logCmsActivity({
  userId,
  action,
  contentType,
  entityId,
  entityTitle,
  details,
}: {
  userId: string
  action: CmsActivityAction
  contentType: CmsContentTypeKey
  entityId: string
  entityTitle?: string | null
  details?: Record<string, unknown>
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        contentType,
        entityId,
        entityTitle,
        details: details as Record<string, unknown>,
      },
    })
  } catch (error) {
    // We don't want to fail the main operation if logging fails,
    // but we should log it to the console in development.
    console.error("Failed to log CMS activity:", error)
  }
}

export async function getActivityLogs(limit = 50) {
  return prisma.activityLog.findMany({
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
        },
      },
    },
  })
}
