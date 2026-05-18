import { DifficultyTier, Prisma, QuestionUsage } from "@prisma/client"

import type { CreateQuestionInput } from "@/lib/curriculum/types"
import {
  normalizeDistractors,
  optionalId,
  optionalText,
  requireEnumValue,
  requireId,
  requireText,
  resolveQuestionSlug,
} from "@/lib/curriculum/shared"
import { prisma } from "@/lib/prisma"

export async function saveQuestion(input: CreateQuestionInput, questionId?: string) {
  const conceptId = requireId(input.conceptId, "Concept")
  const usage = requireEnumValue(input.usage, QuestionUsage, "Question usage")
  const difficulty = requireEnumValue(input.difficulty, DifficultyTier, "Difficulty tier")
  const content = requireText(input.content, "Question prompt")
  const correctAnswer = requireText(input.correctAnswer, "Correct answer")
  const distractors = normalizeDistractors(input.distractors) ?? Prisma.JsonNull
  const hintText = optionalText(input.hintText)
  const explanation = optionalText(input.explanation)
  const authorId = optionalId(input.authorId)

  if (questionId) {
    const id = requireId(questionId, "Question")
    const slug = await resolveQuestionSlug({
      conceptId,
      content,
      slug: input.slug,
      excludeId: id,
    })

    return prisma.question.update({
      where: {
        id,
      },
      data: {
        conceptId,
        slug,
        usage,
        difficulty,
        content,
        correctAnswer,
        distractors,
        hintText,
        explanation,
        authorId,
      },
    })
  }

  const slug = await resolveQuestionSlug({
    conceptId,
    content,
    slug: input.slug,
  })

  return prisma.question.create({
    data: {
      conceptId,
      slug,
      usage,
      difficulty,
      content,
      correctAnswer,
      distractors,
      hintText,
      explanation,
      authorId,
    },
  })
}

export async function createQuestion(input: CreateQuestionInput) {
  return saveQuestion(input)
}

export async function updateQuestion(questionId: string, input: CreateQuestionInput) {
  return saveQuestion(input, questionId)
}

export async function deleteQuestion(questionId: string) {
  const id = requireId(questionId, "Question")

  return prisma.$transaction(async (tx) => {
    const question = await tx.question.findUnique({
      where: {
        id,
      },
      select: {
        conceptId: true,
      },
    })

    await tx.interactionLog.deleteMany({
      where: {
        questionId: id,
      },
    })
    await tx.practiceAttempt.deleteMany({
      where: {
        questionId: id,
      },
    })
    await tx.checkpointAttempt.deleteMany({
      where: {
        questionId: id,
      },
    })

    if (question) {
      await tx.examAttempt.deleteMany({
        where: {
          conceptId: question.conceptId,
        },
      })
    }

    return tx.question.delete({
      where: {
        id,
      },
    })
  })
}

export function getQuestionDifficultyOptions() {
  return Object.values(DifficultyTier)
}

export function getQuestionUsageOptions() {
  return Object.values(QuestionUsage)
}

export function formatDistractorsForTextarea(distractors: Prisma.JsonValue | null) {
  return Array.isArray(distractors) ? distractors.join("\n") : ""
}
