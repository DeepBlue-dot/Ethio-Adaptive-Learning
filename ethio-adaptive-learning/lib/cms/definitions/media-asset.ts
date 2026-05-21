import { MediaAssetKind } from "@prisma/client"
import { z } from "zod"

import { optionalTrimmedStringSchema } from "@/lib/cms/schemas/shared"
import type { CmsContentType } from "@/lib/cms/types"
import { normalizeYouTubeUrl } from "@/lib/cms/youtube"

const optionalNumberSchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === "") {
      return null
    }

    return Number(value)
  })
  .pipe(z.number().int().positive().nullable())

export const mediaAssetSchema = z
  .object({
    kind: z.nativeEnum(MediaAssetKind, {
      message: "Media kind is invalid.",
    }),
    title: optionalTrimmedStringSchema,
    alt: optionalTrimmedStringSchema,
    caption: optionalTrimmedStringSchema,
    publicId: optionalTrimmedStringSchema,
    url: optionalTrimmedStringSchema,
    width: optionalNumberSchema,
    height: optionalNumberSchema,
    bytes: optionalNumberSchema,
    videoId: optionalTrimmedStringSchema,
    thumbnailUrl: optionalTrimmedStringSchema,
    createdById: optionalTrimmedStringSchema,
  })
  .superRefine((value, ctx) => {
    if (value.kind === "IMAGE" && !value.publicId && !value.url) {
      ctx.addIssue({
        code: "custom",
        path: ["publicId"],
        message: "Image assets need a Cloudinary public ID or URL.",
      })
    }

    if (value.kind === "YOUTUBE_EMBED") {
      if (!value.url) {
        ctx.addIssue({
          code: "custom",
          path: ["url"],
          message: "YouTube URL is required.",
        })
        return
      }

      try {
        normalizeYouTubeUrl(value.url)
      } catch (error) {
        ctx.addIssue({
          code: "custom",
          path: ["url"],
          message: error instanceof Error ? error.message : "YouTube URL is invalid.",
        })
      }
    }
  })
  .transform((value) => {
    if (value.kind !== "YOUTUBE_EMBED" || !value.url) {
      return value
    }

    const normalized = normalizeYouTubeUrl(value.url)

    return {
      ...value,
      url: normalized.url,
      videoId: normalized.videoId,
      thumbnailUrl: value.thumbnailUrl ?? normalized.thumbnailUrl,
    }
  })

export type MediaAssetCmsInput = z.output<typeof mediaAssetSchema>

export const mediaAssetDefinition = {
  key: "media-asset",
  aliases: ["media", "media-assets", "assets"],
  label: "Media asset",
  pluralLabel: "Media assets",
  description: "Reusable Cloudinary images and YouTube embeds for content blocks.",
  schema: mediaAssetSchema,
  defaultValues: {
    kind: "YOUTUBE_EMBED",
  },
  fields: [
    {
      name: "kind",
      label: "Media kind",
      type: "select",
      required: true,
      section: "Media",
      options: Object.values(MediaAssetKind).map((kind) => ({
        label: kind === "YOUTUBE_EMBED" ? "YouTube embed" : "Cloudinary image",
        value: kind,
      })),
    },
    {
      name: "title",
      label: "Title",
      type: "text",
      section: "Media",
    },
    {
      name: "url",
      label: "URL",
      type: "text",
      section: "Media",
    },
    {
      name: "publicId",
      label: "Cloudinary public ID",
      type: "text",
      section: "Image metadata",
    },
    {
      name: "alt",
      label: "Alt text",
      type: "textarea",
      section: "Image metadata",
    },
    {
      name: "caption",
      label: "Caption",
      type: "textarea",
      section: "Media",
    },
    {
      name: "width",
      label: "Width",
      type: "number",
      section: "Image metadata",
    },
    {
      name: "height",
      label: "Height",
      type: "number",
      section: "Image metadata",
    },
    {
      name: "bytes",
      label: "Bytes",
      type: "number",
      section: "Image metadata",
    },
    {
      name: "videoId",
      label: "YouTube video ID",
      type: "text",
      section: "YouTube metadata",
    },
    {
      name: "thumbnailUrl",
      label: "Thumbnail URL",
      type: "text",
      section: "YouTube metadata",
    },
  ],
  listFields: [
    {
      name: "kind",
      label: "Kind",
    },
    {
      name: "url",
      label: "URL",
    },
  ],
  getTitle: (entity) => String(entity.data.title ?? entity.data.videoId ?? entity.data.publicId ?? entity.title),
  getSubtitle: (entity) => String(entity.data.caption ?? ""),
  getStatus: (entity) => {
    if (entity.lifecycle?.hasDraft && entity.lifecycle.status === "PUBLISHED") {
      return "PUBLISHED + DRAFT"
    }

    return entity.lifecycle?.status ?? null
  },
  getRevalidationPaths: ({ id }) => [
    "/admin/dashboard",
    "/admin/studio",
    "/admin/studio/media-asset",
    ...(id ? [`/admin/studio/media-asset/${id}`] : []),
  ],
} satisfies CmsContentType<MediaAssetCmsInput>
