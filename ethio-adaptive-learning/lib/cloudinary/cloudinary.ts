import { v2 as cloudinary } from "cloudinary"

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required Cloudinary environment variable: ${name}`)
  }

  return value
}

const CLOUDINARY_CLOUD_NAME = getRequiredEnv("CLOUDINARY_CLOUD_NAME")
const CLOUDINARY_API_KEY = getRequiredEnv("CLOUDINARY_API_KEY")
const CLOUDINARY_API_SECRET = getRequiredEnv("CLOUDINARY_API_SECRET")

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
})

export default cloudinary