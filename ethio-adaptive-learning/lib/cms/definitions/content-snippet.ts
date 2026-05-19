import { z } from "zod"

import { contentBlocksSchema } from "@/lib/cms/content-blocks"
import {
  optionalTrimmedStringSchema,
  requiredTextSchema,
} from "@/lib/cms/schemas/shared"
import type { CmsContentType } from "@/lib/cms/types"

export const contentSnippetSchema = z.object({
  title: requiredTextSchema("Snippet title"),
  slug: optionalTrimmedStringSchema,
  contentBlocks: contentBlocksSchema.default([]),
  authorId: optionalTrimmedStringSchema,
})

export type ContentSnippetCmsInput = z.output<typeof contentSnippetSchema>

export const contentSnippetDefinition = {
  key: "content-snippet",
  aliases: ["snippet", "snippets", "content-snippets"],
  label: "Content snippet",
  pluralLabel: "Content snippets",
  description: "Reusable modular content blocks that can be referenced from concepts.",
  schema: contentSnippetSchema,
  defaultValues: {
    contentBlocks: [],
  },
  fields: [
    {
      name: "title",
      label: "Title",
      type: "text",
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
      name: "contentBlocks",
      label: "Reusable content",
      type: "content-blocks",
      section: "Content",
    },
    {
      name: "authorId",
      label: "Author",
      type: "reference",
      referenceTo: "author",
      section: "Governance",
    },
  ],
  listFields: [
    {
      name: "slug",
      label: "Slug",
    },
    {
      name: "blockCount",
      label: "Blocks",
    },
    {
      name: "authorLabel",
      label: "Author",
    },
  ],
  getTitle: (entity) => String(entity.data.title ?? entity.title),
  getSubtitle: (entity) => String(entity.data.slug ?? ""),
  getStatus: (entity) => {
    if (entity.lifecycle?.hasDraft && entity.lifecycle.status === "PUBLISHED") {
      return "PUBLISHED + DRAFT"
    }

    return entity.lifecycle?.status ?? null
  },
  getRevalidationPaths: ({ id }) => [
    "/admin/dashboard",
    "/admin/cms",
    "/admin/cms/content-snippet",
    "/admin/cms/concept",
    "/concepts",
    ...(id ? [`/admin/cms/content-snippet/${id}`] : []),
  ],
} satisfies CmsContentType<ContentSnippetCmsInput>
