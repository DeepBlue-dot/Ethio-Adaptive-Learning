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
  title: requiredTextSchema("Example title"),
  problemMd: requiredTextSchema("Problem (Markdown)"),
  solutionMd: requiredTextSchema("Solution (Markdown)"),
  order: positiveIntegerSchema("Display order"),
  slug: optionalTrimmedStringSchema,
})

export type WorkedExampleCmsInput = z.output<typeof workedExampleSchema>

export const workedExampleDefinition = {
  key: "worked-example",
  aliases: ["worked-examples"],
  label: "Worked Example",
  pluralLabel: "Worked Examples",
  description: "Step-by-step problem solutions linked to a concept.",
  schema: workedExampleSchema,
  defaultValues: {
    order: 1,
    problemMd: "",
    solutionMd: "",
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
      label: "Example title",
      type: "text",
      required: true,
      placeholder: "Calculating a simple limit",
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
      name: "problemMd",
      label: "Problem (Markdown)",
      type: "textarea",
      required: true,
      section: "Content",
    },
    {
      name: "solutionMd",
      label: "Solution (Markdown)",
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
    return entity.lifecycle?.status ?? null
  },
  getRevalidationPaths: ({ id }) => [
    "/admin/dashboard",
    "/admin/studio",
    "/admin/studio/worked-example",
    "/admin/studio/concept",
    ...(id ? [`/admin/studio/worked-example/${id}`] : []),
  ],
} satisfies CmsContentType<WorkedExampleCmsInput>
