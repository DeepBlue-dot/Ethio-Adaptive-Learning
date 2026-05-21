import { prisma } from "@/lib/prisma"

export interface ResourceMetrics {
  totalCount: number
  mediaAssetCount: number
  contentSnippetCount: number
  unusedCount: number
  orphanedRatio: number
  totalStorageBytes: number
  storageByKind: Record<string, number>
  recentActivityCount: number // Last 24h
}

export async function getResourceMetrics(): Promise<ResourceMetrics> {
  const [
    totalMedia,
    totalSnippets,
    unusedMedia,
    unusedSnippets,
    storageStats,
    recentActivity
  ] = await Promise.all([
    prisma.mediaAsset.count(),
    prisma.contentSnippet.count(),
    prisma.mediaAsset.count({ where: { usageLinks: { none: {} } } }),
    prisma.contentSnippet.count({ where: { usageLinks: { none: {} } } }),
    prisma.mediaAsset.aggregate({
      _sum: { bytes: true },
      _count: { id: true }
    }),
    prisma.activityLog.count({
      where: {
        contentType: { in: ["media-asset", "content-snippet"] },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    })
  ])

  const totalCount = totalMedia + totalSnippets
  const unusedCount = unusedMedia + unusedSnippets
  const orphanedRatio = totalCount > 0 ? unusedCount / totalCount : 0

  // Kind distribution for storage
  const kindStats = await prisma.mediaAsset.groupBy({
    by: ["kind"],
    _sum: { bytes: true }
  })

  const storageByKind = kindStats.reduce((acc, curr) => {
    acc[curr.kind] = curr._sum.bytes || 0
    return acc
  }, {} as Record<string, number>)

  return {
    totalCount,
    mediaAssetCount: totalMedia,
    contentSnippetCount: totalSnippets,
    unusedCount,
    orphanedRatio,
    totalStorageBytes: storageStats._sum.bytes || 0,
    storageByKind,
    recentActivityCount: recentActivity
  }
}
