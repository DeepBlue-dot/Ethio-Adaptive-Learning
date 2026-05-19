import { z } from "zod"

import type {
  CmsActionState,
  CmsContentType,
  CmsInvalidationContext,
  CmsValidationResult,
} from "@/lib/cms/types"

export function parseCmsFormData<TInput>(
  definition: CmsContentType<TInput>,
  formData: FormData,
  userId?: string
): CmsValidationResult<TInput> {
  const rawInput: Record<string, unknown> = {
    ...(definition.defaultValues ?? {}),
  }

  for (const field of definition.fields) {
    if (field.formHidden) {
      continue
    }

    if (field.type === "multi-reference") {
      rawInput[field.name] = formData.getAll(field.name).map((value) => String(value))
      continue
    }

    if (field.type === "embedded-list" || field.type === "content-blocks") {
      const parsed = parseEmbeddedListField(formData, field.name)

      if (parsed instanceof Error) {
        return {
          success: false,
          message: parsed.message,
          statusCode: 400,
          fieldErrors: {
            [field.name]: [parsed.message],
          },
        }
      }

      rawInput[field.name] = parsed
      continue
    }

    rawInput[field.name] = getTextField(formData, field.name)
  }

  if (!Object.hasOwn(rawInput, "authorId") && userId) {
    rawInput.authorId = userId
  }

  const parsed = definition.schema.safeParse(rawInput)

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

export function getCmsRevalidationPaths(definition: CmsContentType, context: CmsInvalidationContext) {
  const paths = definition.getRevalidationPaths?.(context) ?? [
    "/admin/dashboard",
    "/admin/cms",
    `/admin/cms/${definition.key}`,
  ]

  return [...new Set(paths)]
}

export function createCmsErrorState(error: unknown, fallback = "Unable to save CMS changes right now."): CmsActionState {
  const message = error instanceof Error ? error.message : fallback
  const field = inferCmsErrorField(message)

  return {
    ok: false,
    message,
    statusCode: 400,
    fieldErrors: {
      [field]: [message],
    },
  }
}

function parseEmbeddedListField(formData: FormData, fieldName: string) {
  const rawValue = getTextField(formData, fieldName)

  if (!rawValue) {
    return []
  }

  try {
    return JSON.parse(rawValue)
  } catch {
    return new Error(`${fieldName} payload is invalid.`)
  }
}

function getTextField(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName)
  return typeof value === "string" ? value : null
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

function inferCmsErrorField(message: string) {
  if (message.includes("Prerequisite") || message.includes("cycle")) {
    return "prerequisiteConceptIds"
  }

  if (message.includes("Concepts can only be moved within the same course")) {
    return "unitId"
  }

  if (message.includes("Course")) {
    return "courseId"
  }

  if (message.includes("Unit")) {
    return "unitId"
  }

  if (message.includes("Concept")) {
    return "conceptId"
  }

  if (message.includes("Question prompt")) {
    return "content"
  }

  if (message.includes("Correct answer")) {
    return "correctAnswer"
  }

  if (message.includes("Difficulty")) {
    return "difficulty"
  }

  if (message.includes("usage")) {
    return "usage"
  }

  return "form"
}
