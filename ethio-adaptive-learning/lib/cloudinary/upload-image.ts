import cloudinary from "@/lib/cloudinary/cloudinary"
import type { CloudinaryUploadOptions, CloudinaryUploadResult } from "@/lib/cloudinary/types"

export async function uploadImage(
  source: string | Buffer,
  options?: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult> {
  return cloudinary.uploader.upload(source as string, {
    resource_type: "image",
    ...options,
  })
}
