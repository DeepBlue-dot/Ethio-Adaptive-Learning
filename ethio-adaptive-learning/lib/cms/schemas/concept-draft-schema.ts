import { z } from "zod"

import {
  optionalTrimmedStringSchema,
  parseCmsInput,
  requiredIdSchema,
  requiredTextSchema,
} from "@/lib/cms/schemas/shared"
import type { CmsValidationResult } from "@/lib/cms/types"
import type { CreateConceptDraftInput } from "@/lib/curriculum/types"

export const conceptDraftFormSchema = z.object({
  unitId: requiredIdSchema("Unit"),
  title: requiredTextSchema("Concept title"),
  slug: optionalTrimmedStringSchema,
})

export function parseConceptDraftFormInput(input: unknown): CmsValidationResult<CreateConceptDraftInput> {
  return parseCmsInput(conceptDraftFormSchema, input)
}
