import { PathwayType, Prisma, QuestionUsage, type CheckpointAttempt, type DifficultyTier, type ExamAttempt, type PracticeAttempt } from "@prisma/client"
import type { CmsContentBlock } from "@/lib/cms/content-blocks"
import type { Recommendation } from "@/lib/adaptive/difficulty"

export type DbClient = Prisma.TransactionClient | typeof import("@/lib/prisma").prisma

export type AttemptQuestionRecord = Prisma.QuestionGetPayload<{
  select: typeof import("./constants").questionSelect
}>

export type WorkspaceAttemptQuestion = {
  id: string
  content: string
  difficulty: DifficultyTier
  hintText: string | null
  explanation: string | null
  choices: string[]
  submittedAnswer?: string | null
  isCorrect?: boolean | null
}

export type AttemptSummary = {
  id: string
  createdAt: Date
  completedAt: Date | null
  isCorrect: boolean | null
  selectedAnswer: string | null
  question: WorkspaceAttemptQuestion
}

export type ExamAttemptSummary = {
  id: string
  createdAt: Date
  completedAt: Date | null
  pathway: PathwayType
  questionCount: number
  correctCount: number | null
  score: number | null
  isPassed: boolean | null
  questions: WorkspaceAttemptQuestion[]
}

export type LearningWorkspace = {
  concept: {
    id: string
    slug: string
    title: string
    description: string | null
    contentBlocks: CmsContentBlock[]
    unlockThreshold: number
    courseTitle: string
    unitTitle: string
    questionCounts: Record<QuestionUsage, number>
    contentBlockAssets: Record<string, {
      id: string
      title: string
      kind: string
      alt: string | null
      caption: string | null
      url: string | null
      width: number | null
      height: number | null
      videoId: string | null
    }>
    contentBlockQuestions: Record<string, {
      id: string
      content: string
    }>
    contentBlockSnippets: Record<string, {
      id: string
      title: string
      contentBlocks: CmsContentBlock[]
    }>
  }
  mastery: {
    baselineMastery: number | null
    effectiveMastery: number | null
    status: "LOCKED" | "FRINGE" | "IN_PROGRESS" | "MASTERED" | "REVIEW_NEEDED"
    unlocked: boolean
    nextReviewAt: Date | null
    dueForReview: boolean
  }
  recommendation: Recommendation
  unmetPrerequisites: Array<{
    conceptId: string
    title: string
    currentMastery: number
  }>
  latestPracticeAttempt: AttemptSummary | null
  latestCheckpointAttempt: AttemptSummary | null
  latestExamAttempt: ExamAttemptSummary | null
  canTakeLearnExam: boolean
  canTakeChallengeExam: boolean
}

export type ReviewQueueItem = {
  conceptId: string
  title: string
  courseTitle: string
  unitTitle: string
  baselineMastery: number
  effectiveMastery: number
  nextReviewAt: Date
  status: "MASTERED" | "REVIEW_NEEDED"
}

export type StudentDashboardSummary = {
  dueReviewCount: number
  unlockedConceptCount: number
  masteredConceptCount: number
  inProgressConceptCount: number
}
