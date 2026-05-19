import { z } from "zod"

import {
  optionalTrimmedStringSchema,
  positiveIntegerSchema,
  requiredIdSchema,
  requiredTextSchema,
} from "@/lib/cms/schemas/shared"
import type { CmsContentType } from "@/lib/cms/types"

export const unitSchema = z.object({
  courseId: requiredIdSchema("Course"),
  title: requiredTextSchema("Unit title"),
  order: positiveIntegerSchema("Unit order"),
  slug: optionalTrimmedStringSchema,
})

export type UnitCmsInput = z.output<typeof unitSchema>

export const unitDefinition = {
  key: "unit",
  aliases: ["units"],
  label: "Unit",
  pluralLabel: "Units",
  description: "Ordered curriculum sections inside a course.",
  schema: unitSchema,
  defaultValues: {
    order: 1,
  },
  fields: [
    {
      name: "courseId",
      label: "Course",
      type: "reference",
      referenceTo: "course",
      required: true,
      section: "Hierarchy",
    },
    {
      name: "title",
      label: "Unit title",
      type: "text",
      required: true,
      placeholder: "Functions and Graphs",
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
      placeholder: "functions-and-graphs",
      section: "Identity",
    },
  ],
  listFields: [
    {
      name: "courseLabel",
      label: "Course",
    },
    {
      name: "order",
      label: "Order",
    },
    {
      name: "conceptCount",
      label: "Concepts",
    },
  ],
  getTitle: (entity) => entity.title,
  getSubtitle: (entity) => String(entity.data.courseLabel ?? ""),
  getRevalidationPaths: () => ["/admin/dashboard", "/admin/cms", "/admin/cms/unit", "/admin/cms/concept", "/concepts"],
} satisfies CmsContentType<UnitCmsInput>
