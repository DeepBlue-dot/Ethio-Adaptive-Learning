"use server"

import { GraphValidationError } from "@/lib/adaptive/graph"
import { requireRole } from "@/lib/auth"
import {
  getErrorMessage,
  parseJsonField,
  textField,
} from "@/lib/cms/forms"
import { parseConceptEditorFormInput } from "@/lib/cms/schemas/concept-editor-schema"
import type { CmsActionState } from "@/lib/cms/types"
import { saveConceptEditor as saveConceptEditorRecord } from "@/lib/curriculum"

import { revalidateConceptsCms } from "./action-shared"

export async function saveConceptEditor(
  _previousState: CmsActionState,
  formData: FormData
): Promise<CmsActionState> {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])
  const rawChunks = parseJsonField(formData, "chunks")
  const rawWorkedExamples = parseJsonField(formData, "workedExamples")

  if (rawChunks instanceof Error) {
    return {
      ok: false,
      message: rawChunks.message,
      statusCode: 400,
      fieldErrors: {
        chunks: [rawChunks.message],
      },
    }
  }

  if (rawWorkedExamples instanceof Error) {
    return {
      ok: false,
      message: rawWorkedExamples.message,
      statusCode: 400,
      fieldErrors: {
        workedExamples: [rawWorkedExamples.message],
      },
    }
  }

  const parsed = parseConceptEditorFormInput({
    conceptId: textField(formData, "conceptId"),
    unitId: textField(formData, "unitId"),
    title: textField(formData, "title"),
    slug: textField(formData, "slug"),
    description: textField(formData, "description"),
    contentBody: textField(formData, "contentBody"),
    unlockThreshold: textField(formData, "unlockThreshold"),
    pLo: textField(formData, "pLo"),
    pT: textField(formData, "pT"),
    pG: textField(formData, "pG"),
    pS: textField(formData, "pS"),
    decayLambda: textField(formData, "decayLambda"),
    prerequisiteConceptIds: formData.getAll("prerequisiteConceptIds").map((value) => String(value)),
    chunks: rawChunks,
    workedExamples: rawWorkedExamples,
    authorId: session.user.id,
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.message,
      statusCode: parsed.statusCode,
      fieldErrors: parsed.fieldErrors,
    }
  }

  try {
    const concept = await saveConceptEditorRecord(parsed.data)
    revalidateConceptsCms(concept.id)

    return {
      ok: true,
      message: "Concept saved.",
      statusCode: 200,
      fieldErrors: {},
    }
  } catch (error) {
    return buildConceptEditorErrorState(error)
  }
}

function buildConceptEditorErrorState(error: unknown): CmsActionState {
  if (error instanceof GraphValidationError) {
    return {
      ok: false,
      message: error.message,
      statusCode: error.statusCode,
      fieldErrors: {
        [error.field]: [error.message],
      },
    }
  }

  if (error instanceof Error) {
    const field =
      error.message.includes("Prerequisite")
        ? "prerequisiteConceptIds"
        : error.message.includes("moved within the same course")
          ? "unitId"
          : "form"

    return {
      ok: false,
      message: error.message,
      statusCode: 400,
      fieldErrors: {
        [field]: [error.message],
      },
    }
  }

  const message = getErrorMessage(error)

  return {
    ok: false,
    message,
    statusCode: 500,
    fieldErrors: {
      form: [message],
    },
  }
}
