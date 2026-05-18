import { z } from "zod"

import { parseCmsInput } from "@/lib/cms/schemas/shared"
import type { CmsValidationResult } from "@/lib/cms/types"
import type { CurriculumFilters } from "@/lib/curriculum/types"

const filterValueSchema = z
  .union([z.string(), z.array(z.string()), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? value.trim() : null))
  .transform((value) => (value && value.length ? value : undefined))

export const questionFilterSchema = z.object({
  courseId: filterValueSchema,
  unitId: filterValueSchema,
  conceptId: filterValueSchema,
})

export function parseQuestionFilterInput(input: unknown): CmsValidationResult<CurriculumFilters> {
  return parseCmsInput(questionFilterSchema, input)
}
