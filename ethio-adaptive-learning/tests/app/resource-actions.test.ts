import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireCmsAccess: vi.fn(),
  updateItem: vi.fn(),
  findUnique: vi.fn(),
  logCmsActivity: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms")
  return {
    ...actual,
    requireCmsAccess: mocks.requireCmsAccess,
    updateItem: mocks.updateItem,
  }
})

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mediaAsset: {
      findUnique: mocks.findUnique,
    },
  },
}))

vi.mock("@/lib/cms/activity", () => ({
  logCmsActivity: mocks.logCmsActivity,
}))

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}))

import { updateResourceMetadata } from "@/app/(admin)/admin/studio/actions/resource-actions"

describe("resource actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireCmsAccess.mockResolvedValue({
      user: {
        id: "user-1",
      },
    })
  })

  it("preserves existing media asset fields when updating metadata", async () => {
    mocks.findUnique.mockResolvedValue({
      kind: "IMAGE",
      title: "Existing title",
      alt: "Existing alt",
      caption: "Existing caption",
      publicId: "existing-public-id",
      url: "https://cdn.example.com/existing.jpg",
      width: 800,
      height: 600,
      bytes: 123456,
      videoId: null,
      thumbnailUrl: "https://cdn.example.com/existing-thumb.jpg",
    })

    mocks.updateItem.mockResolvedValue({ entity: { id: "asset-1" } })

    const result = await updateResourceMetadata("asset-1", "media-asset", {
      title: "Updated title",
      alt: "Updated alt",
    })

    expect(result).toEqual({ ok: true, resource: { id: "asset-1" } })
    expect(mocks.updateItem).toHaveBeenCalledWith(
      "media-asset",
      "asset-1",
      expect.objectContaining({
        kind: "IMAGE",
        title: "Updated title",
        alt: "Updated alt",
        caption: "Existing caption",
        publicId: "existing-public-id",
        url: "https://cdn.example.com/existing.jpg",
      }),
      undefined,
      "user-1"
    )
  })
})
