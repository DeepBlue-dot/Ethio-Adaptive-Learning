import { z } from "zod"

import {
  optionalTrimmedStringSchema,
  positiveIntegerSchema,
  requiredIdSchema,
  requiredTextSchema,
} from "@/lib/cms/schemas/shared"
import type { CmsContentType } from "@/lib/cms/types"

export const workedExampleSchema = z.object({
  conceptId: requiredIdSchema("Concept"),
  title: requiredTextSchema("Worked example title"),
  order: positiveIntegerSchema("Worked example order"),
  slug: optionalTrimmedStringSchema,
  problemMd: requiredTextSchema("Worked example problem"),
  solutionMd: requiredTextSchema("Worked example solution"),
  authorId: optionalTrimmedStringSchema,
})

export type WorkedExampleCmsInput = z.output<typeof workedExampleSchema>

export const workedExampleDefinition = {
  key: "worked-example",
  aliases: ["worked-examples"],
  label: "Worked example",
  pluralLabel: "Worked examples",
  description: "Sequenced problem-and-solution examples attached to a concept.",
  schema: workedExampleSchema,
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
      name: "problemMd",
      label: "Problem",
      type: "markdown",
      required: true,
      section: "Content",
    },
    {
      name: "solutionMd",
      label: "Solution",
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
    "/admin/cms/worked-example",
    "/admin/cms/concept",
    "/concepts",
    ...(id ? [`/admin/cms/worked-example/${id}`] : []),
    ...(typeof result?.data.conceptId === "string" ? [`/learn/${result.data.conceptId}`] : []),
  ],
} satisfies CmsContentType<WorkedExampleCmsInput>
