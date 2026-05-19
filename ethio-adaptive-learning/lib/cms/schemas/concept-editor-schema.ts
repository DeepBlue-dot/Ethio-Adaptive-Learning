import { z } from "zod"

import { contentBlocksSchema } from "@/lib/cms/content-blocks"
import {
  optionalTrimmedStringSchema,
  parseCmsInput,
  probabilitySchema,
  requiredIdSchema,
  requiredTextSchema,
  trimmedStringSchema,
} from "@/lib/cms/schemas/shared"
import type { CmsValidationResult } from "@/lib/cms/types"
import type { SaveConceptEditorInput } from "@/lib/curriculum/types"

export const conceptEditorFormSchema = z.object({
  conceptId: requiredIdSchema("Concept"),
  unitId: requiredIdSchema("Unit"),
  title: requiredTextSchema("Concept title"),
  slug: optionalTrimmedStringSchema,
  description: optionalTrimmedStringSchema,
  contentBlocks: contentBlocksSchema.default([]),
  unlockThreshold: probabilitySchema("Unlock threshold"),
  pLo: probabilitySchema("P(L0)"),
  pT: probabilitySchema("P(T)"),
  pG: probabilitySchema("P(G)"),
  pS: probabilitySchema("P(S)"),
  decayLambda: probabilitySchema("Decay lambda"),
  prerequisiteConceptIds: z.array(trimmedStringSchema).default([]),
  authorId: optionalTrimmedStringSchema,
})

export function parseConceptEditorFormInput(input: unknown): CmsValidationResult<SaveConceptEditorInput> {
  return parseCmsInput(conceptEditorFormSchema, input)
}
