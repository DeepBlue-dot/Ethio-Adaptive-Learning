"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireRole } from "@/lib/auth"
import {
  archiveCourse,
  createConcept,
  createCourse,
  createUnit,
  deleteConcept,
  deleteCourse,
  deleteUnit,
  restoreCourse,
  setConceptPrerequisites,
  updateConcept,
  updateCourse,
  updateUnit,
} from "@/lib/curriculum"

const CONCEPTS_PATH = "/admin/cms/concepts"

export async function saveCourseAction(formData: FormData) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const returnTo = getReturnTo(formData, CONCEPTS_PATH)
  const courseId = textField(formData, "courseId")

  try {
    if (courseId) {
      await updateCourse(courseId, {
        title: textField(formData, "title") ?? "",
        description: textField(formData, "description"),
        authorId: textField(formData, "authorId"),
      })
    } else {
      await createCourse({
        title: textField(formData, "title") ?? "",
        description: textField(formData, "description"),
        authorId: textField(formData, "authorId"),
      })
    }
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error))
  }

  revalidateCms()
  redirectWithMessage(returnTo, "status", courseId ? "Course updated." : "Course created.")
}

export async function toggleCourseArchiveAction(formData: FormData) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const returnTo = getReturnTo(formData, CONCEPTS_PATH)
  const courseId = textField(formData, "courseId")
  const archived = textField(formData, "archived")

  try {
    if (!courseId) {
      throw new Error("Course is required.")
    }

    if (archived === "true") {
      await restoreCourse(courseId)
    } else {
      await archiveCourse(courseId)
    }
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error))
  }

  revalidateCms()
  redirectWithMessage(returnTo, "status", archived === "true" ? "Course restored." : "Course archived.")
}

export async function deleteCourseAction(formData: FormData) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const returnTo = getReturnTo(formData, CONCEPTS_PATH)

  try {
    await deleteCourse(textField(formData, "courseId") ?? "")
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error))
  }

  revalidateCms()
  redirectWithMessage(returnTo, "status", "Course deleted.")
}

export async function saveUnitAction(formData: FormData) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const returnTo = getReturnTo(formData, CONCEPTS_PATH)
  const unitId = textField(formData, "unitId")

  try {
    const input = {
      courseId: textField(formData, "courseId") ?? "",
      title: textField(formData, "title") ?? "",
      order: numberField(formData, "order"),
    }

    if (unitId) {
      await updateUnit(unitId, input)
    } else {
      await createUnit(input)
    }
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error))
  }

  revalidateCms()
  redirectWithMessage(returnTo, "status", unitId ? "Unit updated." : "Unit created.")
}

export async function deleteUnitAction(formData: FormData) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const returnTo = getReturnTo(formData, CONCEPTS_PATH)

  try {
    await deleteUnit(textField(formData, "unitId") ?? "")
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error))
  }

  revalidateCms()
  redirectWithMessage(returnTo, "status", "Unit deleted.")
}

export async function saveConceptAction(formData: FormData) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const returnTo = getReturnTo(formData, CONCEPTS_PATH)
  const conceptId = textField(formData, "conceptId")

  try {
    const input = {
      unitId: textField(formData, "unitId") ?? "",
      title: textField(formData, "title") ?? "",
      description: textField(formData, "description"),
      contentBody: textField(formData, "contentBody"),
      unlockThreshold: decimalField(formData, "unlockThreshold"),
      pLo: decimalField(formData, "pLo"),
      pT: decimalField(formData, "pT"),
      pG: decimalField(formData, "pG"),
      pS: decimalField(formData, "pS"),
      decayLambda: decimalField(formData, "decayLambda"),
    }
    const prerequisiteConceptIds = formData
      .getAll("prerequisiteConceptIds")
      .map((value) => String(value))

    const concept = conceptId ? await updateConcept(conceptId, input) : await createConcept(input)

    await setConceptPrerequisites({
      conceptId: concept.id,
      prerequisiteConceptIds,
    })
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error))
  }

  revalidateCms()
  redirectWithMessage(returnTo, "status", conceptId ? "Concept updated." : "Concept created.")
}

export async function deleteConceptAction(formData: FormData) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const returnTo = getReturnTo(formData, CONCEPTS_PATH)

  try {
    await deleteConcept(textField(formData, "conceptId") ?? "")
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error))
  }

  revalidateCms()
  redirectWithMessage(returnTo, "status", "Concept deleted.")
}

function revalidateCms() {
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/cms/concepts")
  revalidatePath("/admin/cms/questions")
  revalidatePath("/concepts")
}

function getReturnTo(formData: FormData, fallback: string) {
  const rawValue = textField(formData, "returnTo")

  if (!rawValue || !rawValue.startsWith("/admin/")) {
    return fallback
  }

  return rawValue
}

function textField(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName)
  return typeof value === "string" ? value : null
}

function numberField(formData: FormData, fieldName: string) {
  return Number(textField(formData, fieldName))
}

function decimalField(formData: FormData, fieldName: string) {
  return Number(textField(formData, fieldName))
}

function redirectWithMessage(pathname: string, key: "status" | "error", message: string): never {
  const [basePath, search = ""] = pathname.split("?")
  const params = new URLSearchParams(search)

  params.set(key, message)

  redirect(`${basePath}?${params.toString()}`)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to save curriculum changes right now."
}
