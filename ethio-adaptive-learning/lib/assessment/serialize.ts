import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

import { questionSelect } from "./constants"
import { getQuestionChoices, isAnswerCorrect, parseStringArray, parseStringRecord } from "./utils"
import type { AttemptQuestionRecord, AttemptSummary, ExamAttemptSummary, WorkspaceAttemptQuestion } from "./types"

export function serializeAttempt(
  attempt:
    | (import("@prisma/client").PracticeAttempt & {
        question: AttemptQuestionRecord
      })
    | (import("@prisma/client").CheckpointAttempt & {
        question: AttemptQuestionRecord
      })
): AttemptSummary {
  return {
    id: attempt.id,
    createdAt: attempt.createdAt,
    completedAt: attempt.completedAt,
    isCorrect: attempt.isCorrect,
    selectedAnswer: attempt.selectedAnswer,
    question: serializeQuestion(attempt.question, {
      submittedAnswer: attempt.selectedAnswer,
      isCorrect: attempt.isCorrect,
    }),
  }
}

export async function serializeExamAttempt(attempt: import("@prisma/client").ExamAttempt): Promise<ExamAttemptSummary> {
  const questionIds = parseStringArray(attempt.questionIds)
  const questions = questionIds.length
    ? await prisma.question.findMany({
        where: {
          id: {
            in: questionIds,
          },
          status: "PUBLISHED",
        },
        select: questionSelect,
      })
    : []
  const questionsById = new Map(questions.map((question) => [question.id, question]))
  const submittedAnswers = parseStringRecord(attempt.submittedAnswers)

  return {
    id: attempt.id,
    createdAt: attempt.createdAt,
    completedAt: attempt.completedAt,
    pathway: attempt.pathway,
    questionCount: attempt.questionCount,
    correctCount: attempt.correctCount,
    score: attempt.score,
    isPassed: attempt.isPassed,
    questions: questionIds
      .map((questionId) => questionsById.get(questionId))
      .filter((question): question is AttemptQuestionRecord => Boolean(question))
      .map((question) =>
        serializeQuestion(question, {
          submittedAnswer: submittedAnswers[question.id],
          isCorrect:
            attempt.completedAt != null
              ? isAnswerCorrect(question, submittedAnswers[question.id] ?? "")
              : null,
        })
      ),
  }
}

export function serializeQuestion(
  question: AttemptQuestionRecord,
  options: {
    submittedAnswer?: string | null
    isCorrect?: boolean | null
  } = {}
): WorkspaceAttemptQuestion {
  return {
    id: question.id,
    content: question.content,
    difficulty: question.difficulty,
    hintText: question.hintText,
    explanation: question.explanation,
    choices: getQuestionChoices(question),
    submittedAnswer: options.submittedAnswer,
    isCorrect: options.isCorrect,
  }
}
