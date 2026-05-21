import type { Prisma } from "@prisma/client"
import type { AttemptQuestionRecord } from "./types"

export function getQuestionChoices(question: AttemptQuestionRecord) {
  const distractors = Array.isArray(question.distractors)
    ? question.distractors.filter((choice): choice is string => typeof choice === "string")
    : []

  return [...new Set([question.correctAnswer, ...distractors])].sort((left, right) =>
    left.localeCompare(right)
  )
}

export function isAnswerCorrect(question: AttemptQuestionRecord, answer: string) {
  return normalizeAnswer(question.correctAnswer) === normalizeAnswer(answer)
}

export function normalizeAnswer(answer: string | null | undefined) {
  return (answer ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
}

export function parseStringArray(value: Prisma.JsonValue | null) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

export function parseStringRecord(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  )
}

export function requireId(value: string | null | undefined, fieldLabel: string) {
  const normalized = value?.trim()

  if (!normalized) {
    throw new Error(`${fieldLabel} is required.`)
  }

  return normalized
}

export function requireText(value: string | null | undefined, fieldLabel: string) {
  const normalized = value?.trim()

  if (!normalized) {
    throw new Error(`${fieldLabel} is required.`)
  }

  return normalized
}
