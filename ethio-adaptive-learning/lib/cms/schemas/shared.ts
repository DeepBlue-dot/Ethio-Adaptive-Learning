import { z } from "zod"

import type { CmsValidationResult } from "@/lib/cms/types"

export const trimmedStringSchema = z.string().trim()

export const optionalTrimmedStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? value.trim() : null))
  .transform((value) => (value && value.length ? value : null))

export const requiredIdSchema = (fieldLabel: string) =>
  trimmedStringSchema.min(1, `${fieldLabel} is required.`)

export const requiredTextSchema = (fieldLabel: string) =>
  trimmedStringSchema.min(1, `${fieldLabel} is required.`)

export const positiveIntegerSchema = (fieldLabel: string) =>
  z.coerce
    .number()
    .int({ message: `${fieldLabel} must be a positive whole number.` })
    .min(1, { message: `${fieldLabel} must be a positive whole number.` })

export const probabilitySchema = (fieldLabel: string) =>
  z.coerce
    .number()
    .min(0, { message: `${fieldLabel} must be between 0 and 1.` })
    .max(1, { message: `${fieldLabel} must be between 0 and 1.` })

export function parseCmsInput<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown
): CmsValidationResult<z.output<TSchema>> {
  const parsed = schema.safeParse(input)

  if (parsed.success) {
    return {
      success: true,
      data: parsed.data,
    }
  }

  return {
    success: false,
    message: "Please correct the highlighted fields and try again.",
    statusCode: 400,
    fieldErrors: flattenZodFieldErrors(parsed.error),
  }
}

function flattenZodFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "form"
    const nextErrors = fieldErrors[key] ?? []
    nextErrors.push(issue.message)
    fieldErrors[key] = nextErrors
  }

  return fieldErrors
}
