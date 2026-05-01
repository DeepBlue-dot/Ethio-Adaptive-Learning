"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { PathwayType } from "@prisma/client"

import {
  startCheckpointAttempt,
  startExamAttempt,
  startPracticeAttempt,
  submitCheckpointAttempt,
  submitExamAttempt,
  submitPracticeAttempt,
} from "@/lib/assessment"
import { requireRole } from "@/lib/auth"

export async function startPracticeAttemptAction(formData: FormData) {
  const session = await requireRole("STUDENT")
  const conceptId = textField(formData, "conceptId") ?? ""

  try {
    await startPracticeAttempt(session.user.id, conceptId)
  } catch (error) {
    redirectWithMessage(conceptId, "error", getErrorMessage(error))
  }

  revalidateStudentPaths(conceptId)
  redirectWithMessage(conceptId, "status", "Practice question ready.")
}

export async function submitPracticeAttemptAction(formData: FormData) {
  const session = await requireRole("STUDENT")
  const attemptId = textField(formData, "attemptId") ?? ""
  const answer = textField(formData, "answer") ?? ""

  try {
    const result = await submitPracticeAttempt(session.user.id, attemptId, answer)

    revalidateStudentPaths(result.conceptId)
    redirectWithMessage(
      result.conceptId,
      "status",
      result.isCorrect ? "Practice question solved correctly." : "Practice question missed. Try another one."
    )
  } catch (error) {
    const conceptId = textField(formData, "conceptId") ?? ""
    redirectWithMessage(conceptId, "error", getErrorMessage(error))
  }
}

export async function startCheckpointAttemptAction(formData: FormData) {
  const session = await requireRole("STUDENT")
  const conceptId = textField(formData, "conceptId") ?? ""

  try {
    await startCheckpointAttempt(session.user.id, conceptId)
  } catch (error) {
    redirectWithMessage(conceptId, "error", getErrorMessage(error))
  }

  revalidateStudentPaths(conceptId)
  redirectWithMessage(conceptId, "status", "Checkpoint question ready.")
}

export async function submitCheckpointAttemptAction(formData: FormData) {
  const session = await requireRole("STUDENT")
  const attemptId = textField(formData, "attemptId") ?? ""
  const answer = textField(formData, "answer") ?? ""

  try {
    const result = await submitCheckpointAttempt(session.user.id, attemptId, answer)

    revalidateStudentPaths(result.conceptId)
    redirectWithMessage(
      result.conceptId,
      "status",
      result.isCorrect
        ? "Checkpoint passed. The mastery exam is now available."
        : "Checkpoint missed. Work another practice question before trying again."
    )
  } catch (error) {
    const conceptId = textField(formData, "conceptId") ?? ""
    redirectWithMessage(conceptId, "error", getErrorMessage(error))
  }
}

export async function startExamAttemptAction(formData: FormData) {
  const session = await requireRole("STUDENT")
  const conceptId = textField(formData, "conceptId") ?? ""
  const pathway = parsePathway(textField(formData, "pathway"))

  try {
    await startExamAttempt(session.user.id, conceptId, pathway)
  } catch (error) {
    redirectWithMessage(conceptId, "error", getErrorMessage(error))
  }

  revalidateStudentPaths(conceptId)
  redirectWithMessage(
    conceptId,
    "status",
    pathway === PathwayType.CHALLENGE ? "Challenge exam started." : "Mastery exam started."
  )
}

export async function submitExamAttemptAction(formData: FormData) {
  const session = await requireRole("STUDENT")
  const attemptId = textField(formData, "attemptId") ?? ""

  try {
    const answers = Object.fromEntries(
      [...formData.entries()]
        .filter((entry): entry is [string, string] => entry[0].startsWith("answer:") && typeof entry[1] === "string")
        .map(([key, value]) => [key.replace(/^answer:/, ""), value])
    )
    const result = await submitExamAttempt(session.user.id, attemptId, answers)

    revalidateStudentPaths(result.conceptId)
    redirectWithMessage(
      result.conceptId,
      "status",
      result.isPassed
        ? "Exam passed. Mastery updated and dependent concepts unlocked."
        : "Exam not passed. Your concept has been routed back into guided learning."
    )
  } catch (error) {
    const conceptId = textField(formData, "conceptId") ?? ""
    redirectWithMessage(conceptId, "error", getErrorMessage(error))
  }
}

function revalidateStudentPaths(conceptId: string) {
  revalidatePath("/dashboard")
  revalidatePath("/concepts")
  revalidatePath("/learn")
  revalidatePath(`/learn/${conceptId}`)
  revalidatePath("/review")
}

function redirectWithMessage(conceptId: string, key: "status" | "error", message: string): never {
  const pathname = conceptId ? `/learn/${conceptId}` : "/learn"
  const params = new URLSearchParams()

  params.set(key, message)

  redirect(`${pathname}?${params.toString()}`)
}

function textField(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName)
  return typeof value === "string" ? value : null
}

function parsePathway(value: string | null) {
  if (value === PathwayType.CHALLENGE) {
    return PathwayType.CHALLENGE
  }

  return PathwayType.LEARN
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "We couldn't complete that learning action right now."
}
