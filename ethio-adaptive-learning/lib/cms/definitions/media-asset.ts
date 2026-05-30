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
      name: "media_preview",
      label: "Preview",
      type: "preview",
      section: "Resource Preview",
    },
    {
      name: "kind",
      label: "Media kind",
      type: "select",
      required: true,
      section: "Configuration",
      options: Object.values(MediaAssetKind).map((kind) => ({
        label: kind === "YOUTUBE_EMBED" ? "YouTube embed" : kind === "PHET_SIMULATION" ? "PhET simulation" : "Cloudinary image",
        value: kind,
      })),
    },
    {
      name: "title",
      label: "Title",
      type: "text",
      section: "Configuration",
      placeholder: "e.g., Quadratic Formula visual",
    },
    {
      name: "url",
      label: "Resource URL",
      type: "text",
      section: "Configuration",
      placeholder: "YouTube or Simulation URL",
      visibleIf: { field: "kind", operator: "ne", value: "IMAGE" },
    },
    {
      name: "publicId",
      label: "Cloudinary public ID",
      type: "text",
      section: "Cloudinary Mapping",
      placeholder: "e.g., samples/animals/cat",
      visibleIf: { field: "kind", operator: "eq", value: "IMAGE" },
    },
    {
      name: "alt",
      label: "Accessibility Alt Text",
      type: "textarea",
      section: "Cloudinary Mapping",
      visibleIf: { field: "kind", operator: "eq", value: "IMAGE" },
      description: "Describe the image for screen readers.",
    },
    {
      name: "caption",
      label: "Display Caption",
      type: "textarea",
      section: "Configuration",
      placeholder: "Shown below the asset in lessons",
    },
    {
      name: "width",
      label: "Width (px)",
      type: "number",
      section: "Image Metadata",
      visibleIf: { field: "kind", operator: "eq", value: "IMAGE" },
    },
    {
      name: "height",
      label: "Height (px)",
      type: "number",
      section: "Image Metadata",
      visibleIf: { field: "kind", operator: "eq", value: "IMAGE" },
    },
    {
      name: "bytes",
      label: "File Size (bytes)",
      type: "number",
      section: "Image Metadata",
      visibleIf: { field: "kind", operator: "eq", value: "IMAGE" },
      readOnly: true,
    },
    {
      name: "videoId",
      label: "YouTube video ID",
      type: "text",
      section: "YouTube Auto-Metadata",
      visibleIf: { field: "kind", operator: "eq", value: "YOUTUBE_EMBED" },
      readOnly: true,
    },
    {
      name: "thumbnailUrl",
      label: "Thumbnail URL",
      type: "text",
      section: "YouTube Auto-Metadata",
      visibleIf: { field: "kind", operator: "eq", value: "YOUTUBE_EMBED" },
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
    return entity.lifecycle?.status ?? null
  },
  getRevalidationPaths: ({ id }) => [
    "/admin/dashboard",
    "/admin/studio",
    "/admin/studio/media-asset",
    ...(id ? [`/admin/studio/media-asset/${id}`] : []),
  ],
} satisfies CmsContentType<MediaAssetCmsInput>
