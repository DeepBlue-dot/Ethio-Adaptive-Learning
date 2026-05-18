import cloudinary from "@/lib/cloudinary/cloudinary"
import type { CloudinaryDeleteResult } from "@/lib/cloudinary/types"

export async function deleteImage(
  publicId: string,
  options?: { invalidate?: boolean; resource_type?: "image" | "raw" | "video" }
): Promise<CloudinaryDeleteResult> {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    ...options,
  })
}
