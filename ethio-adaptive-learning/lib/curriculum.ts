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
  createConcept,
  createConceptChunk,
  createCourse,
  createQuestion,
  createUnit,
  createWorkedExample,
  deleteConcept,
  deleteConceptChunk,
  deleteCourse,
  deleteQuestion,
  deleteUnit,
  deleteWorkedExample,
  formatDistractorsForTextarea,
  getCmsAuthors,
  getConceptEditorCmsData,
  getCurriculumHierarchyCmsData,
  getDifficultyOptions,
  getQuestionBankCmsData,
  getQuestionBankCmsData as getQuestionCmsData,
  getQuestionDifficultyOptions,
  getQuestionEditorCmsData,
  getQuestionUsageOptions,
  restoreCourse,
  saveConceptEditor,
  saveQuestion,
  updateConceptChunk,
  updateCourse,
  updateQuestion,
  updateUnit,
  updateWorkedExample,
} from "@/lib/cms/adapters/curriculum"
export {
  createConceptDraft,
  setConceptPrerequisites,
  updateConcept,
} from "@/lib/curriculum/concept"
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
      status: "PUBLISHED",
    },
    include: {
      units: {
        where: {
          status: "PUBLISHED",
        },
        orderBy: {
          order: "asc",
        },
        include: {
          concepts: {
            where: {
              status: "PUBLISHED",
            },
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
                where: {
                  status: "PUBLISHED",
                },
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
