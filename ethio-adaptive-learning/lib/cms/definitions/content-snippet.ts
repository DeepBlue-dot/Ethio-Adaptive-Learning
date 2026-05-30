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
      label: "Snippet Title",
      type: "text",
      required: true,
      section: "Identification",
      placeholder: "e.g., Socratic Mastery Formula",
    },
    {
      name: "slug",
      label: "System Identifier (Slug)",
      type: "text",
      section: "Identification",
      placeholder: "mastery-formula",
      description: "Unique string used to reference this snippet in lessons.",
    },
    {
      name: "contentBlocks",
      label: "Modular Content Blocks",
      type: "content-blocks",
      section: "Lesson Workspace",
      description: "Design the reusable instructional content here. Changes will reflect everywhere this snippet is used.",
    },
    {
      name: "authorId",
      label: "Assigned Author",
      type: "reference",
      referenceTo: "author",
      section: "Governance & Metadata",
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
    return entity.lifecycle?.status ?? null
  },
  getRevalidationPaths: ({ id }) => [
    "/admin/dashboard",
    "/admin/studio",
    "/admin/studio/content-snippet",
    "/admin/studio/concept",
    "/concepts",
    ...(id ? [`/admin/studio/content-snippet/${id}`] : []),
  ],
} satisfies CmsContentType<ContentSnippetCmsInput>
