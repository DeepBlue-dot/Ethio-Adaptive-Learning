"use server"

import { redirect } from "next/navigation"

import { requireRole } from "@/lib/auth"
import {
  getErrorMessage,
  getReturnTo,
  redirectWithMessage,
  textField,
} from "@/lib/cms/forms"
import { parseConceptDraftFormInput } from "@/lib/cms/schemas/concept-draft-schema"
import {
  createConceptDraft as createConceptDraftRecord,
  deleteConcept as deleteConceptRecord,
} from "@/lib/curriculum"

import { CONCEPTS_PATH, revalidateConceptsCms } from "./action-shared"

export async function createConceptDraft(formData: FormData) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const parsed = parseConceptDraftFormInput({
    unitId: textField(formData, "unitId"),
    title: textField(formData, "title"),
    slug: textField(formData, "slug"),
  })

  if (!parsed.success) {
    redirectWithMessage(CONCEPTS_PATH, "error", parsed.message)
  }

  try {
    const concept = await createConceptDraftRecord(parsed.data)
    revalidateConceptsCms(concept.id)
    redirect(`${CONCEPTS_PATH}/${concept.id}`)
  } catch (error) {
    redirectWithMessage(CONCEPTS_PATH, "error", getErrorMessage(error))
  }
}

export async function deleteConcept(formData: FormData) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const returnTo = getReturnTo(formData, CONCEPTS_PATH)

  try {
    await deleteConceptRecord(textField(formData, "conceptId") ?? "")
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error))
  }

  revalidateConceptsCms()
  redirectWithMessage(returnTo, "status", "Concept deleted.")
}
