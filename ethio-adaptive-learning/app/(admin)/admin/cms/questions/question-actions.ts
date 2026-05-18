"use server"

import { requireRole } from "@/lib/auth"
import { getErrorMessage, getReturnTo, redirectWithMessage, textField } from "@/lib/cms/forms"
import { deleteQuestion as deleteQuestionRecord } from "@/lib/curriculum"

import { QUESTIONS_PATH, revalidateQuestionsCms } from "./action-shared"

export async function deleteQuestion(formData: FormData) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const returnTo = getReturnTo(formData, QUESTIONS_PATH)

  try {
    const question = await deleteQuestionRecord(textField(formData, "questionId") ?? "")
    revalidateQuestionsCms(question.id, question.conceptId)
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error, "Unable to delete question right now."))
  }

  redirectWithMessage(returnTo, "status", "Question deleted.")
}
