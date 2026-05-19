import type {
  DifficultyTier,
  QuestionUsage,
} from "@prisma/client"
import type { CmsContentBlock } from "@/lib/cms/content-blocks"

export type CreateCourseInput = {
  title: string
  description?: string | null
  authorId?: string | null
  slug?: string | null
}

export type CreateUnitInput = {
  courseId: string
  title: string
  order: number
  slug?: string | null
}

export type CreateConceptInput = {
  unitId: string
  title: string
  description?: string | null
  contentBody?: string | null
  contentBlocks?: CmsContentBlock[] | null
  unlockThreshold: number
  pLo: number
  pT: number
  pG: number
  pS: number
  decayLambda: number
  slug?: string | null
}

export type CreateConceptDraftInput = {
  unitId: string
  title: string
  slug?: string | null
}

export type CreateConceptChunkInput = {
  conceptId: string
  title: string
  bodyMd: string
  order: number
  authorId?: string | null
  slug?: string | null
}

export type CreateWorkedExampleInput = {
  conceptId: string
  title: string
  problemMd: string
  solutionMd: string
  order: number
  authorId?: string | null
  slug?: string | null
}

export type SetConceptPrerequisitesInput = {
  conceptId: string
  prerequisiteConceptIds: string[]
}

export type CreateQuestionInput = {
  conceptId: string
  usage: QuestionUsage
  difficulty: DifficultyTier
  content: string
  correctAnswer: string
  distractors?: string[] | null
  hintText?: string | null
  explanation?: string | null
  authorId?: string | null
  slug?: string | null
}

export type CurriculumFilters = {
  courseId?: string
  unitId?: string
  conceptId?: string
}

export type ConceptChunkEditorInput = {
  id?: string | null
  title: string
  slug?: string | null
  bodyMd: string
  order: number
}

export type WorkedExampleEditorInput = {
  id?: string | null
  title: string
  slug?: string | null
  problemMd: string
  solutionMd: string
  order: number
}

export type SaveConceptEditorInput = {
  conceptId: string
  unitId: string
  title: string
  slug?: string | null
  description?: string | null
  contentBody?: string | null
  unlockThreshold: number
  pLo: number
  pT: number
  pG: number
  pS: number
  decayLambda: number
  prerequisiteConceptIds: string[]
  contentBlocks?: CmsContentBlock[] | null
  chunks?: ConceptChunkEditorInput[]
  workedExamples?: WorkedExampleEditorInput[]
  authorId?: string | null
}
