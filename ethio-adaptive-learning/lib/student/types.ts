import type { DifficultyTier, MasteryStatus, PathwayType, QuestionUsage } from "@prisma/client"
import type { CmsContentBlock } from "@/lib/cms/content-blocks"
import type {
  RenderableMediaAsset,
  RenderableQuestion,
  RenderableSnippet,
} from "@/components/content/content-blocks-renderer"

export type StudentStatus = MasteryStatus

export type StudentConceptCard = {
  conceptId: string
  slug: string
  title: string
  description: string | null
  unit: {
    id: string
    title: string
  }
  course: {
    id: string
    title: string
  }
  status: StudentStatus
  pMastery: number
  nextReviewAt: string | null
  lastAssessedAt: string | null
  unlockedAt: string | null
  prerequisiteTitles: string[]
  prerequisitesMet: boolean
  totalAttempts: number
  checkpointPassRate: number
  practiceAccuracy: number
  averageTimePerQuestion: number
}

export type StudentDashboard = {
  studentId: string
  profile: {
    totalXP: number
    currentLevel: number
    dailyStreak: number
    overallProgress: number
  }
  conceptsByStatus: {
    fringe: StudentConceptCard[]
    inProgress: StudentConceptCard[]
    mastered: StudentConceptCard[]
    reviewNeeded: StudentConceptCard[]
    locked: StudentConceptCard[]
  }
  analyticsSnapshot: {
    conceptsMastered: number
    conceptsStarted: number
    currentStreak: number
    averageTimePerConcept: number
    mostDifficultConcepts: StudentConceptCard[]
  }
}

export type StudentActivityTimelineItem = {
  id: string
  activityType: string
  label: string
  conceptId: string
  conceptTitle: string
  unitTitle: string
  courseTitle: string
  isCorrect: boolean | null
  responseTimeMs: number | null
  timestamp: string
}

export type StudentActivityExamItem = {
  id: string
  conceptId: string
  conceptTitle: string
  pathway: PathwayType
  score: number | null
  isPassed: boolean | null
  questionCount: number
  timeSpentSec: number | null
  completedAt: string | null
}

export type StudentActivity = {
  summary: {
    totalActivities: number
    practiceCount: number
    checkpointCount: number
    examResponseCount: number
    contentReadCount: number
    hintCount: number
    correctCount: number
    incorrectCount: number
    activeDays30: number
  }
  timeline: StudentActivityTimelineItem[]
  recentExams: StudentActivityExamItem[]
}

export type StudentAnalytics = {
  profile: StudentDashboard["profile"]
  progress: {
    totalConcepts: number
    unlockedConcepts: number
    masteredConcepts: number
    reviewDue: number
    overallProgress: number
  }
  statusDistribution: Array<{
    status: StudentStatus
    label: string
    count: number
    percentage: number
  }>
  performance: {
    totalAttempts: number
    averagePracticeAccuracy: number
    averageCheckpointPassRate: number
    averageTimePerQuestion: number
    conceptsStarted: number
  }
  mostDifficultConcepts: StudentConceptCard[]
  strongestConcepts: StudentConceptCard[]
  courseProgress: Array<{
    courseId: string
    courseTitle: string
    totalConcepts: number
    masteredConcepts: number
    averageMastery: number
  }>
}

export type StudentNavigation = {
  profile: {
    username: string
    role: string
    totalXP: number
    currentLevel: number
    dailyStreak: number
    overallProgress: number
  }
  courses: Array<{
    id: string
    title: string
    units: Array<{
      id: string
      title: string
      concepts: Array<{
        id: string
        title: string
        status: StudentStatus
        href: string
      }>
    }>
  }>
  summary: {
    totalConcepts: number
    unlockedConcepts: number
    masteredConcepts: number
    reviewDue: number
  }
}

export type StudentRecommendation = {
  type: "learn" | "challenge" | "review"
  rationale: string
  isLocked: boolean
}

export type StudentConceptDetail = {
  conceptId: string
  slug: string
  title: string
  description: string | null
  unit: {
    id: string
    title: string
  }
  course: {
    id: string
    title: string
  }
  contentBody: string | null
  contentBlocks: CmsContentBlock[]
  contentBlockAssets: Record<string, RenderableMediaAsset>
  contentBlockQuestions: Record<string, RenderableQuestion>
  contentBlockSnippets: Record<string, RenderableSnippet>
  chunks: Array<{
    id: string
    title: string
    bodyMd: string
    order: number
  }>
  workedExamples: Array<{
    id: string
    title: string
    problemMd: string
    solutionMd: string
    order: number
  }>
  status: StudentStatus
  pMastery: number
  unlockThreshold: number
  lastAssessedAt: string | null
  nextReviewAt: string | null
  prerequisiteConcepts: Array<{
    id: string
    title: string
    pMastery: number
    status: StudentStatus
  }>
  unmetPrerequisites: Array<{
    conceptId: string
    title: string
    currentMastery: number
  }>
  recommendation: StudentRecommendation
  practiceQuestionCount: number
  checkpointQuestionId: string | null
  examAvailable: boolean
  analyticsSnapshot: {
    totalAttempts: number
    totalTimeSpentMs: number
    checkpointPassRate: number
    practiceAccuracy: number
    averageTimePerQuestion: number
    recentActivityFeed: Array<{
      activityType: string
      isCorrect: boolean | null
      timestamp: string
    }>
  }
}

export type StudentQuestion = {
  attemptId: string
  questionId: string
  conceptId: string
  content: string
  usage: QuestionUsage
  difficulty: DifficultyTier
  options: Array<{
    id: string
    text: string
  }>
  hintText: string | null
  explanation: string | null
  selectedAnswer: string | null
  isCorrect: boolean | null
  completedAt: string | null
}

export type StudentExamSession = {
  attemptId: string
  sessionId: string
  conceptId: string
  pathway: PathwayType
  questionCount: number
  timeLimitSec: number | null
  canUseHints: false
  startedAt: string
  questions: Array<{
    questionId: string
    content: string
    usage: "EXAM"
    difficulty: DifficultyTier
    options: Array<{
      id: string
      text: string
    }>
  }>
}

export type StudentExamResult = {
  conceptId: string
  isPassed: boolean
  unlockedNewConcepts: boolean
  correctCount: number
  questionCount: number
  score: number
  timeSpentSec: number
}

export type StudentReviewItem = {
  conceptId: string
  title: string
  courseTitle: string
  unitTitle: string
  lastAssessedAt: string | null
  nextReviewAt: string | null
  daysSinceMastery: number
  baselineMastery: number
  effectiveMastery: number
  status: "MASTERED" | "REVIEW_NEEDED"
}
