"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { DifficultyTier, QuestionUsage } from "@prisma/client"

import { requireRole } from "@/lib/auth"
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
    redirectWithMessage(returnTo, "error", getErrorMessage(error))
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
    redirectWithMessage(returnTo, "error", getErrorMessage(error))
  }

  revalidateQuestions()
  redirectWithMessage(returnTo, "status", "Question deleted.")
}

function revalidateQuestions() {
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/cms/questions")
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

function textareaLines(formData: FormData, fieldName: string) {
  const value = textField(formData, fieldName)

  if (!value) {
    return null
  }

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

function enumField<TEnum extends Record<string, string>>(
  formData: FormData,
  fieldName: string,
  enumObject: TEnum
) {
  const value = textField(formData, fieldName)

  if (!value || !Object.values(enumObject).includes(value)) {
    throw new Error(`${fieldName} is invalid.`)
  }

  return value as TEnum[keyof TEnum]
}

function redirectWithMessage(pathname: string, key: "status" | "error", message: string): never {
  const [basePath, search = ""] = pathname.split("?")
  const params = new URLSearchParams(search)

  params.set(key, message)

  redirect(`${basePath}?${params.toString()}`)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to save question changes right now."
}
