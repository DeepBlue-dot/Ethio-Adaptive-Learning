import { getCloudinary } from "@/lib/cloudinary/cloudinary"
import type { CloudinaryUploadOptions, CloudinaryUploadResult } from "@/lib/cloudinary/types"

export async function uploadImage(
  source: string | Buffer,
  options?: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult> {
  return getCloudinary().uploader.upload(source as string, {
    resource_type: "image",
    ...options,
  })
}
