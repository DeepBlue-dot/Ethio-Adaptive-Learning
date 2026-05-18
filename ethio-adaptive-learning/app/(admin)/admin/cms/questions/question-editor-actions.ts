"use server"

import { redirect } from "next/navigation"

import { requireRole } from "@/lib/auth"
import { getErrorMessage, getReturnTo, textField } from "@/lib/cms/forms"
import { parseQuestionFormInput } from "@/lib/cms/schemas/question-schema"
import { initialCmsActionState, type CmsActionState } from "@/lib/cms/types"
import { saveQuestion as saveQuestionRecord } from "@/lib/curriculum"

import { QUESTIONS_PATH, revalidateQuestionsCms } from "./action-shared"

export { initialCmsActionState as initialQuestionEditorState }

export async function saveQuestion(
  _previousState: CmsActionState,
  formData: FormData
): Promise<CmsActionState> {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])
  const questionId = textField(formData, "questionId")
  const returnTo = getReturnTo(formData, QUESTIONS_PATH)

  const parsed = parseQuestionFormInput({
    conceptId: textField(formData, "conceptId"),
    usage: textField(formData, "usage"),
    difficulty: textField(formData, "difficulty"),
    content: textField(formData, "content"),
    correctAnswer: textField(formData, "correctAnswer"),
    distractors: textField(formData, "distractors"),
    hintText: textField(formData, "hintText"),
    explanation: textField(formData, "explanation"),
    authorId: session.user.id,
    slug: textField(formData, "slug"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.message,
      statusCode: parsed.statusCode,
      fieldErrors: parsed.fieldErrors,
    }
  }

  let question: Awaited<ReturnType<typeof saveQuestionRecord>>

  try {
    question = await saveQuestionRecord(parsed.data, questionId ?? undefined)
    revalidateQuestionsCms(question.id, question.conceptId)
  } catch (error) {
    const message = getErrorMessage(error, "Unable to save question changes right now.")

    return {
      ok: false,
      message,
      statusCode: 400,
      fieldErrors: buildQuestionEditorFieldErrors(message),
    }
  }

  redirect(buildQuestionEditorRedirectPath(question.id, returnTo, questionId ? "Question saved." : "Question created."))
}

function buildQuestionEditorRedirectPath(questionId: string, returnTo: string, status: string) {
  const params = new URLSearchParams()
  params.set("status", status)

  if (returnTo !== QUESTIONS_PATH) {
    params.set("returnTo", returnTo)
  }

  return `${QUESTIONS_PATH}/${questionId}?${params.toString()}`
}

function buildQuestionEditorFieldErrors(message: string) {
  const fieldErrors: Record<string, string[]> = {}

  if (message.includes("Concept")) {
    fieldErrors.conceptId = [message]
    return fieldErrors
  }

  if (message.includes("Correct answer")) {
    fieldErrors.correctAnswer = [message]
    return fieldErrors
  }

  if (message.includes("Question prompt")) {
    fieldErrors.content = [message]
    return fieldErrors
  }

  if (message.includes("Difficulty")) {
    fieldErrors.difficulty = [message]
    return fieldErrors
  }

  if (message.includes("usage")) {
    fieldErrors.usage = [message]
    return fieldErrors
  }

  fieldErrors.form = [message]
  return fieldErrors
}
