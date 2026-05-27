"use server"

import { revalidatePath } from "next/cache"
import { PathwayType } from "@prisma/client"

import {
  getCheckpointQuestionForConcept,
  getPracticeQuestionForConcept,
} from "@/lib/student/data"
import {
  submitCheckpointAttempt,
  submitExamAttempt,
  submitPracticeAttempt,
} from "@/lib/assessment"
import { awardXpForActivity, recordDailyActivity } from "@/lib/gamification"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-server"
import type { StudentExamResult, StudentQuestion } from "@/lib/student/types"

type ActionResult<T> =
  | {
      ok: true
      data: T
    }
  | {
      ok: false
      error: string
    }

async function getStudentSession() {
  return requireRole("STUDENT")
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong."
}

function revalidateStudentConcept(conceptId: string) {
  revalidatePath("/student")
  revalidatePath("/student/reviews")
  revalidatePath(`/student/concept/${conceptId}`)
  revalidatePath(`/student/concept/${conceptId}/learn`)
  revalidatePath(`/student/concept/${conceptId}/learn/checkpoint`)
  revalidatePath(`/student/concept/${conceptId}/challenge`)
  revalidatePath(`/student/concept/${conceptId}/review`)
}

export async function startPracticeQuestionAction(
  conceptId: string
): Promise<ActionResult<StudentQuestion>> {
  try {
    const session = await getStudentSession()
    const question = await getPracticeQuestionForConcept(session.user.id, conceptId)

    return {
      ok: true,
      data: question,
    }
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
    }
  }
}

export async function submitPracticeAnswerAction(
  attemptId: string,
  answer: string,
  responseTimeMs?: number
): Promise<ActionResult<{ conceptId: string; isCorrect: boolean }>> {
  try {
    const session = await getStudentSession()
    const result = await submitPracticeAttempt(session.user.id, attemptId, answer, responseTimeMs)

    revalidateStudentConcept(result.conceptId)

    return {
      ok: true,
      data: result,
    }
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
    }
  }
}

export async function startCheckpointQuestionAction(
  conceptId: string
): Promise<ActionResult<StudentQuestion>> {
  try {
    const session = await getStudentSession()
    const question = await getCheckpointQuestionForConcept(session.user.id, conceptId)

    return {
      ok: true,
      data: question,
    }
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
    }
  }
}

export async function submitCheckpointAnswerAction(
  attemptId: string,
  answer: string,
  responseTimeMs?: number
): Promise<ActionResult<{ conceptId: string; isCorrect: boolean }>> {
  try {
    const session = await getStudentSession()
    const result = await submitCheckpointAttempt(session.user.id, attemptId, answer, responseTimeMs)

    revalidateStudentConcept(result.conceptId)

    return {
      ok: true,
      data: result,
    }
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
    }
  }
}

export async function submitExamAnswersAction(
  attemptId: string,
  answers: Record<string, string>
): Promise<ActionResult<StudentExamResult>> {
  try {
    const session = await getStudentSession()
    const result = await submitExamAttempt(session.user.id, attemptId, answers)
    const attempt = await prisma.examAttempt.findUnique({
      where: {
        id: attemptId,
      },
      select: {
        correctCount: true,
        questionCount: true,
        score: true,
        timeSpentSec: true,
      },
    })

    revalidateStudentConcept(result.conceptId)

    return {
      ok: true,
      data: {
        conceptId: result.conceptId,
        isPassed: result.isPassed,
        unlockedNewConcepts: result.unlockedNewConcepts,
        correctCount: attempt?.correctCount ?? 0,
        questionCount: attempt?.questionCount ?? 0,
        score: Math.round((attempt?.score ?? 0) * 100),
        timeSpentSec: attempt?.timeSpentSec ?? 0,
      },
    }
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
    }
  }
}

export async function recordContentReadAction(conceptId: string): Promise<ActionResult<{ logged: boolean }>> {
  try {
    const session = await getStudentSession()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const existing = await prisma.interactionLog.findFirst({
      where: {
        userId: session.user.id,
        conceptId,
        activityType: "CONTENT_READ",
        createdAt: {
          gte: today,
        },
      },
      select: {
        id: true,
      },
    })

    if (existing) {
      return {
        ok: true,
        data: {
          logged: false,
        },
      }
    }

    await prisma.interactionLog.create({
      data: {
        userId: session.user.id,
        conceptId,
        activityType: "CONTENT_READ",
      },
    })
    await awardXpForActivity(session.user.id, "CONTENT_READ")
    await recordDailyActivity(session.user.id)

    revalidateStudentConcept(conceptId)

    return {
      ok: true,
      data: {
        logged: true,
      },
    }
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
    }
  }
}

export async function recordTutorHintAction(conceptId: string): Promise<ActionResult<{ logged: boolean }>> {
  try {
    const session = await getStudentSession()

    await prisma.interactionLog.create({
      data: {
        userId: session.user.id,
        conceptId,
        activityType: "SOCRATIC_HINT_USED",
      },
    })
    await awardXpForActivity(session.user.id, "SOCRATIC_HINT_USED")
    await recordDailyActivity(session.user.id)

    revalidateStudentConcept(conceptId)

    return {
      ok: true,
      data: {
        logged: true,
      },
    }
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
    }
  }
}

export async function normalizePathway(pathway?: string | null) {
  return pathway?.toUpperCase() === PathwayType.LEARN ? PathwayType.LEARN : PathwayType.CHALLENGE
}
