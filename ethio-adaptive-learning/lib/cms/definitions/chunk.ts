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
  order: positiveIntegerSchema("Chunk order"),
  slug: optionalTrimmedStringSchema,
  bodyMd: requiredTextSchema("Chunk body"),
  authorId: optionalTrimmedStringSchema,
})

export type ChunkCmsInput = z.output<typeof chunkSchema>

export const chunkDefinition = {
  key: "chunk",
  aliases: ["chunks"],
  label: "Chunk",
  pluralLabel: "Chunks",
  description: "Ordered instructional Markdown blocks attached to a concept.",
  schema: chunkSchema,
  defaultValues: {
    order: 1,
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
      label: "Title",
      type: "text",
      required: true,
      section: "Identity",
    },
    {
      name: "order",
      label: "Order",
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
      label: "Body",
      type: "markdown",
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
    {
      name: "authorLabel",
      label: "Author",
    },
  ],
  getTitle: (entity) => entity.title,
  getSubtitle: (entity) => String(entity.data.conceptLabel ?? ""),
  getRevalidationPaths: ({ id, result }) => [
    "/admin/dashboard",
    "/admin/cms",
    "/admin/cms/chunk",
    "/admin/cms/concept",
    "/concepts",
    ...(id ? [`/admin/cms/chunk/${id}`] : []),
    ...(typeof result?.data.conceptId === "string" ? [`/learn/${result.data.conceptId}`] : []),
  ],
} satisfies CmsContentType<ChunkCmsInput>
