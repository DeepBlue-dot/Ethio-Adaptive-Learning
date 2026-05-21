import { Prisma } from "@prisma/client"

export const EXAM_QUESTION_LIMIT = 3
export const EXAM_PASS_THRESHOLD = 0.67

export const userMasterySelect = {
  userId: true,
  conceptId: true,
  pMastery: true,
  lastAssessedAt: true,
  nextReviewAt: true,
  unlockedAt: true,
  status: true,
  consecutiveFails: true,
} satisfies Prisma.UserMasterySelect

export const questionSelect = {
  id: true,
  content: true,
  correctAnswer: true,
  distractors: true,
  hintText: true,
  explanation: true,
  difficulty: true,
  usage: true,
} satisfies Prisma.QuestionSelect
