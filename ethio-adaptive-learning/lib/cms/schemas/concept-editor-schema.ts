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
import type { CmsValidationResult } from "@/lib/cms/types"
import type { SaveConceptEditorInput } from "@/lib/curriculum/types"

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

export const conceptEditorFormSchema = z
  .object({
    conceptId: requiredIdSchema("Concept"),
    unitId: requiredIdSchema("Unit"),
    title: requiredTextSchema("Concept title"),
    slug: optionalTrimmedStringSchema,
    description: optionalTrimmedStringSchema,
    contentBody: optionalTrimmedStringSchema,
    unlockThreshold: probabilitySchema("Unlock threshold"),
    pLo: probabilitySchema("P(L0)"),
    pT: probabilitySchema("P(T)"),
    pG: probabilitySchema("P(G)"),
    pS: probabilitySchema("P(S)"),
    decayLambda: probabilitySchema("Decay lambda"),
    prerequisiteConceptIds: z.array(trimmedStringSchema).default([]),
    chunks: z.array(conceptChunkEditorSchema).default([]),
    workedExamples: z.array(workedExampleEditorSchema).default([]),
    authorId: optionalTrimmedStringSchema,
  })
  .superRefine((value, ctx) => {
    ensureUniqueOrderValues(value.chunks, "chunks", "Chunk", ctx)
    ensureUniqueOrderValues(value.workedExamples, "workedExamples", "Worked example", ctx)
  })

export function parseConceptEditorFormInput(input: unknown): CmsValidationResult<SaveConceptEditorInput> {
  return parseCmsInput(conceptEditorFormSchema, input)
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
