"use server"

import { requireRole } from "@/lib/auth"
import {
  getErrorMessage,
  getReturnTo,
  redirectWithMessage,
  textField,
} from "@/lib/cms/forms"
import { parseUnitFormInput } from "@/lib/cms/schemas/unit-schema"
import {
  createUnit as createUnitRecord,
  deleteUnit as deleteUnitRecord,
  updateUnit,
} from "@/lib/curriculum"

import { CONCEPTS_PATH, revalidateConceptsCms } from "./action-shared"

export async function saveUnit(formData: FormData) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const returnTo = getReturnTo(formData, CONCEPTS_PATH)
  const unitId = textField(formData, "unitId")
  const parsed = parseUnitFormInput({
    courseId: textField(formData, "courseId"),
    title: textField(formData, "title"),
    order: textField(formData, "order"),
    slug: textField(formData, "slug"),
  })

  if (!parsed.success) {
    redirectWithMessage(returnTo, "error", parsed.message)
  }

  try {
    if (unitId) {
      await updateUnit(unitId, parsed.data)
    } else {
      await createUnitRecord(parsed.data)
    }
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error))
  }

  revalidateConceptsCms()
  redirectWithMessage(returnTo, "status", unitId ? "Unit updated." : "Unit created.")
}

export async function deleteUnit(formData: FormData) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const returnTo = getReturnTo(formData, CONCEPTS_PATH)

  try {
    await deleteUnitRecord(textField(formData, "unitId") ?? "")
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error))
  }

  revalidateConceptsCms()
  redirectWithMessage(returnTo, "status", "Unit deleted.")
}
