import { z } from "zod"

import {
  optionalTrimmedStringSchema,
  positiveIntegerSchema,
  requiredIdSchema,
  requiredTextSchema,
} from "@/lib/cms/schemas/shared"
import type { CmsContentType } from "@/lib/cms/types"

export const chunkSchema = z.object({
  conceptId: requiredIdSchema("Concept"),
  title: requiredTextSchema("Chunk title"),
  bodyMd: requiredTextSchema("Content (Markdown)"),
  order: positiveIntegerSchema("Display order"),
  slug: optionalTrimmedStringSchema,
})

export type ChunkCmsInput = z.output<typeof chunkSchema>

export const chunkDefinition = {
  key: "chunk",
  aliases: ["chunks", "concept-chunks"],
  label: "Concept Chunk",
  pluralLabel: "Concept Chunks",
  description: "Bite-sized instructional blocks linked to a concept.",
  schema: chunkSchema,
  defaultValues: {
    order: 1,
    bodyMd: "",
  },
  fields: [
    {
      name: "conceptId",
      label: "Concept",
      type: "reference",
      referenceTo: "concept",
      required: true,
      section: "Hierarchy",
    },
    {
      name: "title",
      label: "Chunk title",
      type: "text",
      required: true,
      placeholder: "Definition of a Limit",
      section: "Identity",
    },
    {
      name: "order",
      label: "Display order",
      type: "number",
      required: true,
      section: "Identity",
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      section: "Identity",
    },
    {
      name: "bodyMd",
      label: "Content (Markdown)",
      type: "textarea",
      required: true,
      section: "Content",
    },
  ],
  listFields: [
    {
      name: "conceptLabel",
      label: "Concept",
    },
    {
      name: "order",
      label: "Order",
    },
  ],
  getTitle: (entity) => String(entity.data.title ?? entity.title),
  getSubtitle: (entity) => String(entity.data.conceptLabel ?? ""),
  getStatus: (entity) => {
    if (entity.lifecycle?.hasDraft && entity.lifecycle.status === "PUBLISHED") {
      return "PUBLISHED + DRAFT"
    }

    return entity.lifecycle?.status ?? null
  },
  getRevalidationPaths: ({ id }) => [
    "/admin/dashboard",
    "/admin/studio",
    "/admin/studio/chunk",
    "/admin/studio/concept",
    ...(id ? [`/admin/studio/chunk/${id}`] : []),
  ],
} satisfies CmsContentType<ChunkCmsInput>
