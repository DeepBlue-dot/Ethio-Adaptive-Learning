"use server"

import { revalidatePath } from "next/cache"
import { DifficultyTier, QuestionUsage } from "@prisma/client"

import { requireRole } from "@/lib/auth"
import {
  enumField,
  getErrorMessage,
  getReturnTo,
  redirectWithMessage,
  textField,
  textareaLines,
} from "@/lib/cms/forms"
import { createQuestion, deleteQuestion, updateQuestion } from "@/lib/curriculum"

const QUESTIONS_PATH = "/admin/cms/questions"

export async function saveQuestionAction(formData: FormData) {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])

  const returnTo = getReturnTo(formData, QUESTIONS_PATH)
  const questionId = textField(formData, "questionId")

  try {
    const input = {
      conceptId: textField(formData, "conceptId") ?? "",
      usage: enumField(formData, "usage", QuestionUsage),
      difficulty: enumField(formData, "difficulty", DifficultyTier),
      content: textField(formData, "content") ?? "",
      correctAnswer: textField(formData, "correctAnswer") ?? "",
      distractors: textareaLines(formData, "distractors"),
      hintText: textField(formData, "hintText"),
      explanation: textField(formData, "explanation"),
      authorId: session.user.id,
    }

    if (questionId) {
      await updateQuestion(questionId, input)
    } else {
      await createQuestion(input)
    }
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error, "Unable to save question changes right now."))
  }

  revalidateQuestions()
  redirectWithMessage(returnTo, "status", questionId ? "Question updated." : "Question created.")
}

export async function deleteQuestionAction(formData: FormData) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const returnTo = getReturnTo(formData, QUESTIONS_PATH)

  try {
    await deleteQuestion(textField(formData, "questionId") ?? "")
  } catch (error) {
    redirectWithMessage(returnTo, "error", getErrorMessage(error, "Unable to save question changes right now."))
  }

  revalidateQuestions()
  redirectWithMessage(returnTo, "status", "Question deleted.")
}

function revalidateQuestions() {
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/cms/questions")
}
