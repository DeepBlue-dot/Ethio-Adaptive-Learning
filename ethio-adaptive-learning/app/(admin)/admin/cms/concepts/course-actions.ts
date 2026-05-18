"use server"

import { requireRole } from "@/lib/auth"
import {
  getErrorMessage,
  getReturnTo,
  redirectWithMessage,
  textField,
} from "@/lib/cms/forms"
import { parseCourseFormInput } from "@/lib/cms/schemas/course-schema"
import {
  archiveCourse,
  createCourse,
  deleteCourse as deleteCourseRecord,
  restoreCourse,
  updateCourse,
} from "@/lib/curriculum"

import { CONCEPTS_PATH, revalidateConceptsCms } from "./action-shared"

export async function saveCourse(formData: FormData) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const returnTo = getReturnTo(formData, CONCEPTS_PATH)
  const courseId = textField(formData, "courseId")
  const parsed = parseCourseFormInput({
    title: textField(formData, "title"),
    description: textField(formData, "description"),
    authorId: textField(formData, "authorId"),
    slug: textField(formData, "slug"),
  })

  if (!parsed.success) {
    redirectWithMessage(returnTo, "error", parsed.message)
  }

  try {
    if (courseId) {
      await updateCourse(courseId, parsed.data)
    } else {
      await createCourse(parsed.data)
    }
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error))
  }

  revalidateConceptsCms()
  redirectWithMessage(returnTo, "status", courseId ? "Course updated." : "Course created.")
}

export async function toggleCourseArchive(formData: FormData) {
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

  revalidateConceptsCms()
  redirectWithMessage(returnTo, "status", archived === "true" ? "Course restored." : "Course archived.")
}

export async function deleteCourse(formData: FormData) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const returnTo = getReturnTo(formData, CONCEPTS_PATH)

  try {
    await deleteCourseRecord(textField(formData, "courseId") ?? "")
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error))
  }

  revalidateConceptsCms()
  redirectWithMessage(returnTo, "status", "Course deleted.")
}
