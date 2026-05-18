import { beforeEach, describe, expect, it, vi } from "vitest"

process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "demo"

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  destroy: vi.fn(),
}))

vi.mock("@/lib/cloudinary/cloudinary", () => ({
  default: {
    uploader: {
      upload: mocks.upload,
      destroy: mocks.destroy,
    },
  },
}))

import { buildCloudinaryImageUrl } from "@/lib/cloudinary/image-utils"
import { uploadImage } from "@/lib/cloudinary/upload-image"
import { deleteImage } from "@/lib/cloudinary/delete-image"

describe("Cloudinary module helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("uploads an image with the correct Cloudinary options", async () => {
    const uploadResponse = { public_id: "sample", secure_url: "https://example.com/sample.jpg" }
    mocks.upload.mockResolvedValue(uploadResponse)

    const result = await uploadImage("data:image/png;base64,abc123", { quality: "auto" })

    expect(mocks.upload).toHaveBeenCalledWith("data:image/png;base64,abc123", {
      resource_type: "image",
      quality: "auto",
    })
    expect(result).toEqual(uploadResponse)
  })

  it("deletes an image using the Cloudinary destroy endpoint", async () => {
    const deleteResponse = { result: "ok" }
    mocks.destroy.mockResolvedValue(deleteResponse)

    const result = await deleteImage("sample_public_id")

    expect(mocks.destroy).toHaveBeenCalledWith("sample_public_id", {
      resource_type: "image",
    })
    expect(result).toEqual(deleteResponse)
  })

  it("builds a Cloudinary image URL with transformations", () => {
    const url = buildCloudinaryImageUrl("folder/sample.png", {
      width: 400,
      height: 300,
      crop: "fill",
      quality: "auto",
      fetchFormat: "auto",
    })

    expect(url).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill,f_auto,q_auto/folder/sample.png"
    )
  })
})
