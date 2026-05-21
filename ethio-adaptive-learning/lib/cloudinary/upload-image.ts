import { getCloudinary } from "@/lib/cloudinary/cloudinary"
import type { CloudinaryUploadOptions, CloudinaryUploadResult } from "@/lib/cloudinary/types"

export async function uploadImage(
  source: string | Buffer,
  options?: CloudinaryUploadOptions & { resource_type?: "image" | "video" | "raw" | "auto" }
): Promise<CloudinaryUploadResult> {
  const { resource_type = "image", ...uploadOptions } = options || {}
  
  return getCloudinary().uploader.upload(source as string, {
    resource_type,
    ...uploadOptions,
  })
}
