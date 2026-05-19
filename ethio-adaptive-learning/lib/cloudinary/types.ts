import type { DeleteApiResponse, UploadApiOptions, UploadApiResponse } from "cloudinary"

export type CloudinaryUploadOptions = Omit<UploadApiOptions, "resource_type">

export type CloudinaryUploadResult = UploadApiResponse
export type CloudinaryDeleteResult = DeleteApiResponse

export type CloudinaryImageUrlOptions = {
  width?: number
  height?: number
  quality?: number | "auto"
  crop?: "fill" | "fit" | "limit" | "lfill" | "scale" | "thumb"
  fetchFormat?: "auto" | "png" | "jpg" | "webp" | "avif" | "gif"
  effect?: string
  dpr?: number | "auto"
  radius?: number | "max"
  background?: string
}
