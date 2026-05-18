import { DifficultyTier, Prisma, QuestionUsage, type MasteryStatus } from "@prisma/client"

import {
  getFringeConceptIds as getClosureBackedFringeConceptIds,
  getUnlockedConceptIds as getClosureBackedUnlockedConceptIds,
  listCourseAncestors as getCourseAncestorLookup,
  listCourseDescendants as getCourseDescendantLookup,
  loadCourseUserState,
} from "@/lib/curriculum-graph"
import { getCmsAuthors } from "@/lib/curriculum/course"
import {
  normalizeDistractors,
  optionalId,
  optionalText,
  requireEnumValue,
  requireId,
  requireText,
  resolveQuestionSlug,
} from "@/lib/curriculum/shared"
import type { CreateQuestionInput, CurriculumFilters } from "@/lib/curriculum/types"
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

export async function getQuestionCmsData(filters: CurriculumFilters = {}) {
  const [authors, courses, questions] = await Promise.all([
    getCmsAuthors(),
    prisma.course.findMany({
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
                unitId: true,
              },
            },
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    }),
    prisma.question.findMany({
      where: {
        conceptId: filters.conceptId,
        concept: {
          unitId: filters.unitId,
          unit: {
            courseId: filters.courseId,
            course: {
              archivedAt: null,
            },
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        concept: {
          include: {
            unit: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    }),
  ])
  const sortedQuestions = [...questions].sort((left, right) => {
    const courseSort = left.concept.unit.course.title.localeCompare(right.concept.unit.course.title)

    if (courseSort !== 0) {
      return courseSort
    }

    const unitSort = left.concept.unit.order - right.concept.unit.order

    if (unitSort !== 0) {
      return unitSort
    }

    const conceptSort = left.concept.title.localeCompare(right.concept.title)

    if (conceptSort !== 0) {
      return conceptSort
    }

    return left.content.localeCompare(right.content)
  })

  return {
    authors,
    courses,
    questions: sortedQuestions,
  }
}

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

export async function createQuestion(input: CreateQuestionInput) {
  const conceptId = requireId(input.conceptId, "Concept")
  const usage = requireEnumValue(input.usage, QuestionUsage, "Question usage")
  const difficulty = requireEnumValue(input.difficulty, DifficultyTier, "Difficulty tier")
  const content = requireText(input.content, "Question prompt")
  const correctAnswer = requireText(input.correctAnswer, "Correct answer")
  const distractors = normalizeDistractors(input.distractors) ?? Prisma.JsonNull
  const hintText = optionalText(input.hintText)
  const explanation = optionalText(input.explanation)
  const authorId = optionalId(input.authorId)
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

export async function updateQuestion(questionId: string, input: CreateQuestionInput) {
  const id = requireId(questionId, "Question")
  const conceptId = requireId(input.conceptId, "Concept")
  const usage = requireEnumValue(input.usage, QuestionUsage, "Question usage")
  const difficulty = requireEnumValue(input.difficulty, DifficultyTier, "Difficulty tier")
  const content = requireText(input.content, "Question prompt")
  const correctAnswer = requireText(input.correctAnswer, "Correct answer")
  const distractors = normalizeDistractors(input.distractors) ?? Prisma.JsonNull
  const hintText = optionalText(input.hintText)
  const explanation = optionalText(input.explanation)
  const authorId = optionalId(input.authorId)
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

export function getDifficultyOptions() {
  return Object.values(DifficultyTier)
}

export function getQuestionUsageOptions() {
  return Object.values(QuestionUsage)
}

export function getMasteryStatusLabel(status: MasteryStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

export function formatDistractorsForTextarea(distractors: Prisma.JsonValue | null) {
  return Array.isArray(distractors) ? distractors.join("\n") : ""
}
