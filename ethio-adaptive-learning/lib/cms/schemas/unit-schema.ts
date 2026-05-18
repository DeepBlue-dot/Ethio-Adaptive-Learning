import { z } from "zod"

import {
  optionalTrimmedStringSchema,
  parseCmsInput,
  positiveIntegerSchema,
  requiredIdSchema,
  requiredTextSchema,
} from "@/lib/cms/schemas/shared"
import type { CmsValidationResult } from "@/lib/cms/types"
import type { CreateUnitInput } from "@/lib/curriculum/types"

export const unitFormSchema = z.object({
  courseId: requiredIdSchema("Course"),
  title: requiredTextSchema("Unit title"),
  order: positiveIntegerSchema("Unit order"),
  slug: optionalTrimmedStringSchema,
})

export function parseUnitFormInput(input: unknown): CmsValidationResult<CreateUnitInput> {
  return parseCmsInput(unitFormSchema, input)
}
