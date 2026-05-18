import { z } from "zod"

import { parseCmsInput, optionalTrimmedStringSchema, requiredTextSchema } from "@/lib/cms/schemas/shared"
import type { CmsValidationResult } from "@/lib/cms/types"
import type { CreateCourseInput } from "@/lib/curriculum/types"

export const courseFormSchema = z.object({
  title: requiredTextSchema("Course title"),
  description: optionalTrimmedStringSchema,
  authorId: optionalTrimmedStringSchema,
  slug: optionalTrimmedStringSchema,
})

export function parseCourseFormInput(input: unknown): CmsValidationResult<CreateCourseInput> {
  return parseCmsInput(courseFormSchema, input)
}
