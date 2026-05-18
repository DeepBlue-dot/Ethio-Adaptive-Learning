import type { CloudinaryImageUrlOptions } from "@/lib/cloudinary/types"

function getCloudinaryCloudName(): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME

  if (!cloudName) {
    throw new Error("Missing required Cloudinary environment variable: CLOUDINARY_CLOUD_NAME")
  }

  return cloudName
}

function encodePublicId(publicId: string) {
  return publicId
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
}

function buildTransformationString(options?: CloudinaryImageUrlOptions): string {
  if (!options) {
    return ""
  }

  const parts: string[] = []

  if (options.width) {
    parts.push(`w_${options.width}`)
  }

  if (options.height) {
    parts.push(`h_${options.height}`)
  }

  if (options.crop) {
    parts.push(`c_${options.crop}`)
  }

  if (options.fetchFormat) {
    parts.push(`f_${options.fetchFormat}`)
  }

  if (options.quality) {
    parts.push(`q_${options.quality}`)
  }

  if (options.effect) {
    parts.push(`e_${options.effect}`)
  }

  if (options.dpr) {
    parts.push(`dpr_${options.dpr}`)
  }

  if (options.radius) {
    parts.push(`r_${options.radius}`)
  }

  if (options.background) {
    parts.push(`b_${options.background}`)
  }

  return parts.join(",")
}

export function buildCloudinaryImageUrl(
  publicId: string,
  options?: CloudinaryImageUrlOptions
): string {
  if (!publicId) {
    throw new Error("Cloudinary publicId is required.")
  }

  const cloudName = getCloudinaryCloudName()
  const transformation = buildTransformationString(options)
  const transformationSegment = transformation ? `${transformation}/` : ""
  const encodedPublicId = encodePublicId(publicId)

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationSegment}${encodedPublicId}`
}
