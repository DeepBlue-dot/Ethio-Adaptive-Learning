import { z } from "zod"

import {
  optionalTrimmedStringSchema,
  parseCmsInput,
  positiveIntegerSchema,
  probabilitySchema,
  requiredIdSchema,
  requiredTextSchema,
  trimmedStringSchema,
} from "@/lib/cms/schemas/shared"
import type { CmsContentType, CmsValidationResult } from "@/lib/cms/types"
import type { CreateConceptInput } from "@/lib/curriculum/types"

const conceptChunkEditorSchema = z.object({
  id: optionalTrimmedStringSchema,
  title: requiredTextSchema("Chunk title"),
  slug: optionalTrimmedStringSchema,
  bodyMd: requiredTextSchema("Chunk body"),
  order: positiveIntegerSchema("Chunk order"),
})

const workedExampleEditorSchema = z.object({
  id: optionalTrimmedStringSchema,
  title: requiredTextSchema("Worked example title"),
  slug: optionalTrimmedStringSchema,
  problemMd: requiredTextSchema("Worked example problem"),
  solutionMd: requiredTextSchema("Worked example solution"),
  order: positiveIntegerSchema("Worked example order"),
})

export const conceptSchema = z
  .object({
    unitId: requiredIdSchema("Unit"),
    title: requiredTextSchema("Concept title"),
    slug: optionalTrimmedStringSchema,
    description: optionalTrimmedStringSchema,
    contentBody: optionalTrimmedStringSchema,
    unlockThreshold: probabilitySchema("Unlock threshold").default(0.9),
    pLo: probabilitySchema("P(L0)").default(0.15),
    pT: probabilitySchema("P(T)").default(0.1),
    pG: probabilitySchema("P(G)").default(0.2),
    pS: probabilitySchema("P(S)").default(0.1),
    decayLambda: probabilitySchema("Decay lambda").default(0.01),
    prerequisiteConceptIds: z.array(trimmedStringSchema).default([]),
    chunks: z.array(conceptChunkEditorSchema).default([]),
    workedExamples: z.array(workedExampleEditorSchema).default([]),
    authorId: optionalTrimmedStringSchema,
  })
  .superRefine((value, ctx) => {
    ensureUniqueOrderValues(value.chunks, "chunks", "Chunk", ctx)
    ensureUniqueOrderValues(value.workedExamples, "workedExamples", "Worked example", ctx)
  })

export type ConceptCmsInput = z.output<typeof conceptSchema>

export const conceptDefinition = {
  key: "concept",
  aliases: ["concepts"],
  label: "Concept",
  pluralLabel: "Concepts",
  description: "Adaptive knowledge nodes with prerequisite and lesson content semantics.",
  schema: conceptSchema,
  defaultValues: {
    unlockThreshold: 0.9,
    pLo: 0.15,
    pT: 0.1,
    pG: 0.2,
    pS: 0.1,
    decayLambda: 0.01,
    prerequisiteConceptIds: [],
    chunks: [],
    workedExamples: [],
  },
  fields: [
    {
      name: "unitId",
      label: "Unit",
      type: "reference",
      referenceTo: "unit",
      required: true,
      section: "Hierarchy",
    },
    {
      name: "title",
      label: "Concept title",
      type: "text",
      required: true,
      placeholder: "Limits",
      section: "Identity",
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      section: "Identity",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      section: "Content",
    },
    {
      name: "contentBody",
      label: "Overview / summary",
      type: "markdown",
      placeholder: "Use Markdown and LaTeX for the concept overview or study guide.",
      section: "Content",
    },
    {
      name: "prerequisiteConceptIds",
      label: "Prerequisites",
      type: "multi-reference",
      referenceTo: "concept",
      section: "Graph",
    },
    {
      name: "unlockThreshold",
      label: "Unlock threshold",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
    },
    {
      name: "pLo",
      label: "P(L0)",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
    },
    {
      name: "pT",
      label: "P(T)",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
    },
    {
      name: "pG",
      label: "P(G)",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
    },
    {
      name: "pS",
      label: "P(S)",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
    },
    {
      name: "decayLambda",
      label: "Decay lambda",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
    },
    {
      name: "chunks",
      label: "Concept chunks",
      type: "embedded-list",
      section: "Instructional blocks",
      embeddedFields: [
        {
          name: "title",
          label: "Title",
          type: "text",
          required: true,
        },
        {
          name: "order",
          label: "Order",
          type: "number",
          required: true,
        },
        {
          name: "slug",
          label: "Slug",
          type: "text",
        },
        {
          name: "bodyMd",
          label: "Body",
          type: "markdown",
          required: true,
        },
      ],
    },
    {
      name: "workedExamples",
      label: "Worked examples",
      type: "embedded-list",
      section: "Instructional blocks",
      embeddedFields: [
        {
          name: "title",
          label: "Title",
          type: "text",
          required: true,
        },
        {
          name: "order",
          label: "Order",
          type: "number",
          required: true,
        },
        {
          name: "slug",
          label: "Slug",
          type: "text",
        },
        {
          name: "problemMd",
          label: "Problem",
          type: "markdown",
          required: true,
        },
        {
          name: "solutionMd",
          label: "Solution",
          type: "markdown",
          required: true,
        },
      ],
    },
  ],
  listFields: [
    {
      name: "courseLabel",
      label: "Course",
    },
    {
      name: "unitLabel",
      label: "Unit",
    },
    {
      name: "questionCount",
      label: "Questions",
    },
  ],
  getTitle: (entity) => entity.title,
  getSubtitle: (entity) => `${String(entity.data.courseLabel ?? "")} / ${String(entity.data.unitLabel ?? "")}`,
  getRevalidationPaths: ({ id }) => [
    "/admin/dashboard",
    "/admin/cms",
    "/admin/cms/concept",
    "/admin/cms/question",
    "/admin/cms/chunk",
    "/admin/cms/worked-example",
    "/concepts",
    ...(id ? [`/admin/cms/concept/${id}`, `/learn/${id}`] : []),
  ],
} satisfies CmsContentType<ConceptCmsInput>

export function parseConceptCmsInput(input: unknown): CmsValidationResult<ConceptCmsInput> {
  return parseCmsInput(conceptSchema, input)
}

export function conceptCmsInputToCreateInput(input: ConceptCmsInput): CreateConceptInput {
  return {
    unitId: input.unitId,
    title: input.title,
    slug: input.slug,
    description: input.description,
    contentBody: input.contentBody,
    unlockThreshold: input.unlockThreshold,
    pLo: input.pLo,
    pT: input.pT,
    pG: input.pG,
    pS: input.pS,
    decayLambda: input.decayLambda,
  }
}

function ensureUniqueOrderValues<
  TItem extends {
    order: number
  },
>(items: TItem[], fieldPrefix: "chunks" | "workedExamples", label: string, ctx: z.RefinementCtx) {
  const orders = new Map<number, number>()

  items.forEach((item, index) => {
    const previousIndex = orders.get(item.order)

    if (previousIndex !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: [fieldPrefix, index, "order"],
        message: `${label} order values must be unique.`,
      })
      ctx.addIssue({
        code: "custom",
        path: [fieldPrefix, previousIndex, "order"],
        message: `${label} order values must be unique.`,
      })
      return
    }

    orders.set(item.order, index)
  })
}
