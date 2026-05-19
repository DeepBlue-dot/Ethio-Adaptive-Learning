import { z } from "zod"

import { optionalTrimmedStringSchema, requiredTextSchema } from "@/lib/cms/schemas/shared"
import type { CmsContentType } from "@/lib/cms/types"

export const courseSchema = z.object({
  title: requiredTextSchema("Course title"),
  slug: optionalTrimmedStringSchema,
  description: optionalTrimmedStringSchema,
  authorId: optionalTrimmedStringSchema,
  archived: z.enum(["active", "archived"]).default("active"),
})

export type CourseCmsInput = z.output<typeof courseSchema>

export const courseDefinition = {
  key: "course",
  aliases: ["courses"],
  label: "Course",
  pluralLabel: "Courses",
  description: "Top-level curriculum containers that group units and concepts.",
  schema: courseSchema,
  defaultValues: {
    archived: "active",
  },
  fields: [
    {
      name: "title",
      label: "Course title",
      type: "text",
      required: true,
      placeholder: "Grade 12 Mathematics",
      section: "Identity",
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      placeholder: "grade-12-mathematics",
      section: "Identity",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "A coherent Grade 12 mathematics course for adaptive study and exam preparation.",
      section: "Content",
    },
    {
      name: "authorId",
      label: "Author",
      type: "reference",
      referenceTo: "author",
      section: "Governance",
    },
    {
      name: "archived",
      label: "Publishing state",
      type: "select",
      section: "Governance",
      options: [
        {
          label: "Active",
          value: "active",
        },
        {
          label: "Archived",
          value: "archived",
        },
      ],
    },
  ],
  listFields: [
    {
      name: "slug",
      label: "Slug",
    },
    {
      name: "authorLabel",
      label: "Author",
    },
    {
      name: "unitCount",
      label: "Units",
    },
  ],
  getTitle: (entity) => entity.title,
  getSubtitle: (entity) => String(entity.data.slug ?? ""),
  getStatus: (entity) => String(entity.data.archived ?? "active"),
  getRevalidationPaths: () => ["/admin/dashboard", "/admin/cms", "/admin/cms/course", "/concepts"],
} satisfies CmsContentType<CourseCmsInput>
