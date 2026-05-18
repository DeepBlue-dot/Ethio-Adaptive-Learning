import { type MasteryStatus } from "@prisma/client"

import {
  getFringeConceptIds as getClosureBackedFringeConceptIds,
  getUnlockedConceptIds as getClosureBackedUnlockedConceptIds,
  listCourseAncestors as getCourseAncestorLookup,
  listCourseDescendants as getCourseDescendantLookup,
  loadCourseUserState,
} from "@/lib/curriculum-graph"
import { prisma } from "@/lib/prisma"

export {
  archiveCourse,
  createCourse,
  deleteCourse,
  getCmsAuthors,
  getCurriculumHierarchyCmsData,
  restoreCourse,
  updateCourse,
} from "@/lib/curriculum/course"
export {
  createConcept,
  createConceptChunk,
  createConceptDraft,
  createWorkedExample,
  deleteConcept,
  deleteConceptChunk,
  deleteWorkedExample,
  setConceptPrerequisites,
  updateConcept,
  updateConceptChunk,
  updateWorkedExample,
} from "@/lib/curriculum/concept"
export {
  getConceptEditorCmsData,
  saveConceptEditor,
} from "@/lib/curriculum/concept-editor"
export {
  formatDistractorsForTextarea,
  getQuestionDifficultyOptions,
  getQuestionDifficultyOptions as getDifficultyOptions,
  getQuestionUsageOptions,
  saveQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/lib/curriculum/question"
export {
  getQuestionBankCmsData,
  getQuestionBankCmsData as getQuestionCmsData,
  getQuestionEditorCmsData,
} from "@/lib/curriculum/question-bank"
export {
  createUnit,
  deleteUnit,
  updateUnit,
} from "@/lib/curriculum/unit"
export type {
  ConceptChunkEditorInput,
  CreateConceptChunkInput,
  CreateConceptDraftInput,
  CreateConceptInput,
  CreateCourseInput,
  CreateQuestionInput,
  CreateUnitInput,
  CreateWorkedExampleInput,
  CurriculumFilters,
  SaveConceptEditorInput,
  SetConceptPrerequisitesInput,
  WorkedExampleEditorInput,
} from "@/lib/curriculum/types"

export async function getStudentConceptCatalog(userId: string) {
  const courses = await prisma.course.findMany({
    where: {
      archivedAt: null,
    },
    include: {
      units: {
        orderBy: {
          order: "asc",
        },
        include: {
          concepts: {
            orderBy: {
              title: "asc",
            },
            select: {
              id: true,
              slug: true,
              title: true,
              description: true,
              unlockThreshold: true,
              questions: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      title: "asc",
    },
  })

  const courseStates = new Map(
    await Promise.all(
      courses.map(async (course) => [course.id, await loadCourseUserState(course.id, userId)] as const)
    )
  )

  return courses.map((course) => {
    const state = courseStates.get(course.id)

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      units: course.units.map((unit) => ({
        id: unit.id,
        slug: unit.slug,
        title: unit.title,
        order: unit.order,
        concepts: unit.concepts.map((concept) => {
          const derivedStatus = state?.statuses.get(concept.id)

          return {
            id: concept.id,
            slug: concept.slug,
            title: concept.title,
            description: concept.description,
            questionCount: concept.questions.length,
            unlockThreshold: concept.unlockThreshold,
            status: derivedStatus?.status ?? "LOCKED",
            unlocked: derivedStatus?.unlocked ?? false,
            unmetPrerequisites: derivedStatus?.unmetPrerequisites ?? [],
            masteryProbability: derivedStatus?.masteryProbability ?? null,
            effectiveMastery: derivedStatus?.effectiveMastery ?? null,
            nextReviewAt: derivedStatus?.nextReviewAt ?? null,
          }
        }),
      })),
    }
  })
}

export async function listCourseAncestors(courseId: string) {
  return getCourseAncestorLookup(courseId, prisma)
}

export async function listCourseDescendants(courseId: string) {
  return getCourseDescendantLookup(courseId, prisma)
}

export async function getUnlockedConceptIds(courseId: string, userId: string) {
  return getClosureBackedUnlockedConceptIds({
    courseId,
    userId,
    db: prisma,
  })
}

export async function getFringeConceptIds(courseId: string, userId: string) {
  return getClosureBackedFringeConceptIds({
    courseId,
    userId,
    db: prisma,
  })
}

export function getMasteryStatusLabel(status: MasteryStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}
