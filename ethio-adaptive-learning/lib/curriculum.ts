import {
  DifficultyTier,
  Prisma,
  QuestionUsage,
  type MasteryStatus,
  type UserRole,
} from "@prisma/client"

import { assertAcyclicPrerequisiteSelection } from "@/lib/adaptive/graph"
import {
  getFringeConceptIds as getClosureBackedFringeConceptIds,
  getUnlockedConceptIds as getClosureBackedUnlockedConceptIds,
  listCourseAncestors as getCourseAncestorLookup,
  listCourseDescendants as getCourseDescendantLookup,
  loadCourseUserState,
  rebuildConceptClosureForCourse,
} from "@/lib/curriculum-graph"
import { prisma } from "@/lib/prisma"
import { buildFallbackSlug, withNumericSuffix } from "@/lib/slugs"

type DbClient = Prisma.TransactionClient | typeof prisma
type CmsRole = Extract<UserRole, "ADMIN" | "COURSE_WRITER">

const CMS_ROLES: CmsRole[] = ["ADMIN", "COURSE_WRITER"]

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
  unlockThreshold: number
  pLo: number
  pT: number
  pG: number
  pS: number
  decayLambda: number
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

export async function getCmsAuthors() {
  return prisma.user.findMany({
    where: {
      role: {
        in: CMS_ROLES,
      },
    },
    select: {
      id: true,
      username: true,
      role: true,
    },
    orderBy: {
      username: "asc",
    },
  })
}

export async function getCurriculumCmsData() {
  const [authors, courses] = await Promise.all([
    getCmsAuthors(),
    prisma.course.findMany({
      include: {
        author: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        units: {
          orderBy: {
            order: "asc",
          },
          include: {
            concepts: {
              orderBy: {
                title: "asc",
              },
              include: {
                questions: {
                  select: {
                    id: true,
                    slug: true,
                  },
                },
                chunks: {
                  orderBy: {
                    order: "asc",
                  },
                  include: {
                    author: {
                      select: {
                        id: true,
                        username: true,
                        role: true,
                      },
                    },
                  },
                },
                workedExamples: {
                  orderBy: {
                    order: "asc",
                  },
                  include: {
                    author: {
                      select: {
                        id: true,
                        username: true,
                        role: true,
                      },
                    },
                  },
                },
                prerequisiteEdges: {
                  include: {
                    prerequisiteConcept: {
                      select: {
                        id: true,
                        title: true,
                        slug: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        {
          archivedAt: "asc",
        },
        {
          title: "asc",
        },
      ],
    }),
  ])

  return {
    authors,
    courses,
    activeCourses: courses.filter((course) => !course.archivedAt),
    archivedCourses: courses.filter((course) => course.archivedAt),
  }
}

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

export async function createCourse(input: CreateCourseInput) {
  const authorId = await validateCmsAuthorId(input.authorId)
  const title = requireText(input.title, "Course title")
  const description = optionalText(input.description)
  const slug = await resolveCourseSlug({
    title,
    slug: input.slug,
  })

  return prisma.course.create({
    data: {
      slug,
      title,
      description,
      authorId,
    },
  })
}

export async function updateCourse(courseId: string, input: CreateCourseInput) {
  const id = requireId(courseId, "Course")
  const authorId = await validateCmsAuthorId(input.authorId)
  const title = requireText(input.title, "Course title")
  const description = optionalText(input.description)
  const slug = await resolveCourseSlug({
    title,
    slug: input.slug,
    excludeId: id,
  })

  return prisma.course.update({
    where: {
      id,
    },
    data: {
      slug,
      title,
      description,
      authorId,
    },
  })
}

export async function archiveCourse(courseId: string) {
  return prisma.course.update({
    where: {
      id: requireId(courseId, "Course"),
    },
    data: {
      archivedAt: new Date(),
    },
  })
}

export async function restoreCourse(courseId: string) {
  return prisma.course.update({
    where: {
      id: requireId(courseId, "Course"),
    },
    data: {
      archivedAt: null,
    },
  })
}

export async function deleteCourse(courseId: string) {
  const id = requireId(courseId, "Course")

  return prisma.$transaction(async (tx) => {
    const units = await tx.unit.findMany({
      where: {
        courseId: id,
      },
      select: {
        id: true,
      },
    })
    const unitIds = units.map((unit) => unit.id)

    const concepts = unitIds.length
      ? await tx.concept.findMany({
          where: {
            unitId: {
              in: unitIds,
            },
          },
          select: {
            id: true,
          },
        })
      : []
    const conceptIds = concepts.map((concept) => concept.id)

    await deleteConceptDependencies(conceptIds, tx)
    await tx.unit.deleteMany({
      where: {
        courseId: id,
      },
    })

    return tx.course.delete({
      where: {
        id,
      },
    })
  })
}

export async function createUnit(input: CreateUnitInput) {
  const courseId = requireId(input.courseId, "Course")
  const title = requireText(input.title, "Unit title")
  const order = requirePositiveInteger(input.order, "Unit order")
  const slug = await resolveUnitSlug({
    courseId,
    title,
    slug: input.slug,
  })

  return prisma.unit.create({
    data: {
      courseId,
      slug,
      title,
      order,
    },
  })
}

export async function updateUnit(unitId: string, input: CreateUnitInput) {
  const id = requireId(unitId, "Unit")
  const courseId = requireId(input.courseId, "Course")
  const title = requireText(input.title, "Unit title")
  const order = requirePositiveInteger(input.order, "Unit order")
  const slug = await resolveUnitSlug({
    courseId,
    title,
    slug: input.slug,
    excludeId: id,
  })

  return prisma.unit.update({
    where: {
      id,
    },
    data: {
      courseId,
      slug,
      title,
      order,
    },
  })
}

export async function deleteUnit(unitId: string) {
  const id = requireId(unitId, "Unit")
  const unit = await prisma.unit.findUnique({
    where: {
      id,
    },
    select: {
      courseId: true,
    },
  })

  return prisma.$transaction(async (tx) => {
    const concepts = await tx.concept.findMany({
      where: {
        unitId: id,
      },
      select: {
        id: true,
      },
    })
    const conceptIds = concepts.map((concept) => concept.id)

    await deleteConceptDependencies(conceptIds, tx)
    const deletedUnit = await tx.unit.delete({
      where: {
        id,
      },
    })

    if (unit) {
      await rebuildConceptClosureForCourse(unit.courseId, tx)
    }

    return deletedUnit
  })
}

export async function createConcept(input: CreateConceptInput) {
  const unitId = requireId(input.unitId, "Unit")
  const title = requireText(input.title, "Concept title")
  const unlockThreshold = requireProbability(input.unlockThreshold, "Unlock threshold")
  const pLo = requireProbability(input.pLo, "P(L0)")
  const pT = requireProbability(input.pT, "P(T)")
  const pG = requireProbability(input.pG, "P(G)")
  const pS = requireProbability(input.pS, "P(S)")
  const decayLambda = requireProbability(input.decayLambda, "Decay lambda")
  const slug = await resolveConceptSlug({
    unitId,
    title,
    slug: input.slug,
  })

  return prisma.concept.create({
    data: {
      unitId,
      slug,
      title,
      description: optionalText(input.description),
      contentBody: optionalText(input.contentBody),
      unlockThreshold,
      pLo,
      pT,
      pG,
      pS,
      decayLambda,
    },
  })
}

export async function updateConcept(conceptId: string, input: CreateConceptInput) {
  const id = requireId(conceptId, "Concept")
  const unitId = requireId(input.unitId, "Unit")
  const title = requireText(input.title, "Concept title")
  const unlockThreshold = requireProbability(input.unlockThreshold, "Unlock threshold")
  const pLo = requireProbability(input.pLo, "P(L0)")
  const pT = requireProbability(input.pT, "P(T)")
  const pG = requireProbability(input.pG, "P(G)")
  const pS = requireProbability(input.pS, "P(S)")
  const decayLambda = requireProbability(input.decayLambda, "Decay lambda")
  const slug = await resolveConceptSlug({
    unitId,
    title,
    slug: input.slug,
    excludeId: id,
  })

  return prisma.concept.update({
    where: {
      id,
    },
    data: {
      unitId,
      slug,
      title,
      description: optionalText(input.description),
      contentBody: optionalText(input.contentBody),
      unlockThreshold,
      pLo,
      pT,
      pG,
      pS,
      decayLambda,
    },
  })
}

export async function deleteConcept(conceptId: string) {
  const id = requireId(conceptId, "Concept")
  const concept = await prisma.concept.findUnique({
    where: {
      id,
    },
    select: {
      unit: {
        select: {
          courseId: true,
        },
      },
    },
  })

  return prisma.$transaction(async (tx) => {
    await deleteConceptDependencies([id], tx)
    const deletedConcept = await tx.concept.delete({
      where: {
        id,
      },
    })

    if (concept) {
      await rebuildConceptClosureForCourse(concept.unit.courseId, tx)
    }

    return deletedConcept
  })
}

export async function setConceptPrerequisites(input: SetConceptPrerequisitesInput) {
  const conceptId = requireId(input.conceptId, "Concept")
  const prerequisiteConceptIds = [...new Set(input.prerequisiteConceptIds.map((id) => id.trim()).filter(Boolean))]

  const concept = await prisma.concept.findUnique({
    where: {
      id: conceptId,
    },
    select: {
      id: true,
      unit: {
        select: {
          courseId: true,
        },
      },
    },
  })

  if (!concept) {
    throw new Error("Concept not found.")
  }

  const prerequisiteConcepts = prerequisiteConceptIds.length
    ? await prisma.concept.findMany({
        where: {
          id: {
            in: prerequisiteConceptIds,
          },
        },
        select: {
          id: true,
          unit: {
            select: {
              courseId: true,
            },
          },
        },
      })
    : []

  if (prerequisiteConcepts.length !== prerequisiteConceptIds.length) {
    throw new Error("One or more prerequisite concepts could not be found.")
  }

  if (
    prerequisiteConcepts.some(
      (prerequisiteConcept) => prerequisiteConcept.unit.courseId !== concept.unit.courseId
    )
  ) {
    throw new Error("Prerequisites must belong to the same course as the concept.")
  }

  const existingEdges = await prisma.conceptPrerequisite.findMany({
    where: {
      dependentConcept: {
        unit: {
          courseId: concept.unit.courseId,
        },
      },
    },
    select: {
      prerequisiteConceptId: true,
      dependentConceptId: true,
    },
  })

  assertAcyclicPrerequisiteSelection({
    conceptId,
    prerequisiteConceptIds,
    existingEdges,
  })

  return prisma.$transaction(async (tx) => {
    await tx.conceptPrerequisite.deleteMany({
      where: {
        dependentConceptId: conceptId,
      },
    })

    if (prerequisiteConceptIds.length) {
      await tx.conceptPrerequisite.createMany({
        data: prerequisiteConceptIds.map((prerequisiteConceptId) => ({
          prerequisiteConceptId,
          dependentConceptId: conceptId,
        })),
      })
    }

    await rebuildConceptClosureForCourse(concept.unit.courseId, tx)

    return tx.conceptPrerequisite.findMany({
      where: {
        dependentConceptId: conceptId,
      },
    })
  })
}

export async function createConceptChunk(input: CreateConceptChunkInput) {
  const conceptId = requireId(input.conceptId, "Concept")
  const title = requireText(input.title, "Chunk title")
  const authorId = optionalId(input.authorId)
  const slug = await resolveConceptChunkSlug({
    conceptId,
    title,
    slug: input.slug,
  })

  return prisma.conceptChunk.create({
    data: {
      conceptId,
      slug,
      title,
      bodyMd: requireText(input.bodyMd, "Chunk body"),
      order: requirePositiveInteger(input.order, "Chunk order"),
      authorId,
    },
  })
}

export async function updateConceptChunk(chunkId: string, input: CreateConceptChunkInput) {
  const id = requireId(chunkId, "Explanation chunk")
  const conceptId = requireId(input.conceptId, "Concept")
  const title = requireText(input.title, "Chunk title")
  const authorId = optionalId(input.authorId)
  const slug = await resolveConceptChunkSlug({
    conceptId,
    title,
    slug: input.slug,
    excludeId: id,
  })

  return prisma.conceptChunk.update({
    where: {
      id,
    },
    data: {
      conceptId,
      slug,
      title,
      bodyMd: requireText(input.bodyMd, "Chunk body"),
      order: requirePositiveInteger(input.order, "Chunk order"),
      authorId,
    },
  })
}

export async function deleteConceptChunk(chunkId: string) {
  return prisma.conceptChunk.delete({
    where: {
      id: requireId(chunkId, "Explanation chunk"),
    },
  })
}

export async function createWorkedExample(input: CreateWorkedExampleInput) {
  const conceptId = requireId(input.conceptId, "Concept")
  const title = requireText(input.title, "Worked example title")
  const authorId = optionalId(input.authorId)
  const slug = await resolveWorkedExampleSlug({
    conceptId,
    title,
    slug: input.slug,
  })

  return prisma.workedExample.create({
    data: {
      conceptId,
      slug,
      title,
      problemMd: requireText(input.problemMd, "Worked example problem"),
      solutionMd: requireText(input.solutionMd, "Worked example solution"),
      order: requirePositiveInteger(input.order, "Worked example order"),
      authorId,
    },
  })
}

export async function updateWorkedExample(exampleId: string, input: CreateWorkedExampleInput) {
  const id = requireId(exampleId, "Worked example")
  const conceptId = requireId(input.conceptId, "Concept")
  const title = requireText(input.title, "Worked example title")
  const authorId = optionalId(input.authorId)
  const slug = await resolveWorkedExampleSlug({
    conceptId,
    title,
    slug: input.slug,
    excludeId: id,
  })

  return prisma.workedExample.update({
    where: {
      id,
    },
    data: {
      conceptId,
      slug,
      title,
      problemMd: requireText(input.problemMd, "Worked example problem"),
      solutionMd: requireText(input.solutionMd, "Worked example solution"),
      order: requirePositiveInteger(input.order, "Worked example order"),
      authorId,
    },
  })
}

export async function deleteWorkedExample(exampleId: string) {
  return prisma.workedExample.delete({
    where: {
      id: requireId(exampleId, "Worked example"),
    },
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

async function validateCmsAuthorId(authorId?: string | null) {
  const normalizedAuthorId = optionalId(authorId)

  if (!normalizedAuthorId) {
    return null
  }

  const author = await prisma.user.findUnique({
    where: {
      id: normalizedAuthorId,
    },
    select: {
      role: true,
    },
  })

  if (!author || !CMS_ROLES.includes(author.role as CmsRole)) {
    throw new Error("Course author must be an admin or course writer.")
  }

  return normalizedAuthorId
}

async function resolveCourseSlug(args: {
  title: string
  slug?: string | null
  excludeId?: string
}) {
  return resolveScopedSlug({
    baseValue: args.slug ?? args.title,
    fallbackPrefix: "course",
    isTaken: async (slug) => {
      const existing = await prisma.course.findFirst({
        where: {
          slug,
          ...(args.excludeId
            ? {
                NOT: {
                  id: args.excludeId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      })

      return Boolean(existing)
    },
  })
}

async function resolveUnitSlug(args: {
  courseId: string
  title: string
  slug?: string | null
  excludeId?: string
}) {
  return resolveScopedSlug({
    baseValue: args.slug ?? args.title,
    fallbackPrefix: "unit",
    isTaken: async (slug) => {
      const existing = await prisma.unit.findFirst({
        where: {
          courseId: args.courseId,
          slug,
          ...(args.excludeId
            ? {
                NOT: {
                  id: args.excludeId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      })

      return Boolean(existing)
    },
  })
}

async function resolveConceptSlug(args: {
  unitId: string
  title: string
  slug?: string | null
  excludeId?: string
}) {
  return resolveScopedSlug({
    baseValue: args.slug ?? args.title,
    fallbackPrefix: "concept",
    isTaken: async (slug) => {
      const existing = await prisma.concept.findFirst({
        where: {
          unitId: args.unitId,
          slug,
          ...(args.excludeId
            ? {
                NOT: {
                  id: args.excludeId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      })

      return Boolean(existing)
    },
  })
}

async function resolveConceptChunkSlug(args: {
  conceptId: string
  title: string
  slug?: string | null
  excludeId?: string
}) {
  return resolveScopedSlug({
    baseValue: args.slug ?? args.title,
    fallbackPrefix: "chunk",
    isTaken: async (slug) => {
      const existing = await prisma.conceptChunk.findFirst({
        where: {
          conceptId: args.conceptId,
          slug,
          ...(args.excludeId
            ? {
                NOT: {
                  id: args.excludeId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      })

      return Boolean(existing)
    },
  })
}

async function resolveWorkedExampleSlug(args: {
  conceptId: string
  title: string
  slug?: string | null
  excludeId?: string
}) {
  return resolveScopedSlug({
    baseValue: args.slug ?? args.title,
    fallbackPrefix: "worked-example",
    isTaken: async (slug) => {
      const existing = await prisma.workedExample.findFirst({
        where: {
          conceptId: args.conceptId,
          slug,
          ...(args.excludeId
            ? {
                NOT: {
                  id: args.excludeId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      })

      return Boolean(existing)
    },
  })
}

async function resolveQuestionSlug(args: {
  conceptId: string
  content: string
  slug?: string | null
  excludeId?: string
}) {
  return resolveScopedSlug({
    baseValue: args.slug ?? args.content,
    fallbackPrefix: "question",
    isTaken: async (slug) => {
      const existing = await prisma.question.findFirst({
        where: {
          conceptId: args.conceptId,
          slug,
          ...(args.excludeId
            ? {
                NOT: {
                  id: args.excludeId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      })

      return Boolean(existing)
    },
  })
}

async function resolveScopedSlug(args: {
  baseValue: string
  fallbackPrefix: string
  isTaken: (slug: string) => Promise<boolean>
}) {
  const baseSlug = buildFallbackSlug(args.baseValue, args.fallbackPrefix)

  for (let suffix = 1; suffix < Number.MAX_SAFE_INTEGER; suffix += 1) {
    const candidate = withNumericSuffix(baseSlug, suffix)

    if (!(await args.isTaken(candidate))) {
      return candidate
    }
  }

  throw new Error("Unable to allocate a unique slug.")
}

async function deleteConceptDependencies(conceptIds: string[], db: DbClient) {
  if (!conceptIds.length) {
    return
  }

  const questions = await db.question.findMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
    select: {
      id: true,
    },
  })
  const questionIds = questions.map((question) => question.id)

  await db.interactionLog.deleteMany({
    where: questionIds.length
      ? {
          OR: [
            {
              conceptId: {
                in: conceptIds,
              },
            },
            {
              questionId: {
                in: questionIds,
              },
            },
          ],
        }
      : {
          conceptId: {
            in: conceptIds,
          },
        },
  })
  await db.examAttempt.deleteMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
  })
  await db.practiceAttempt.deleteMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
  })
  await db.checkpointAttempt.deleteMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
  })
  await db.userMastery.deleteMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
  })
  await db.conceptClosure.deleteMany({
    where: {
      OR: [
        {
          ancestorConceptId: {
            in: conceptIds,
          },
        },
        {
          descendantConceptId: {
            in: conceptIds,
          },
        },
      ],
    },
  })
  await db.conceptPrerequisite.deleteMany({
    where: {
      OR: [
        {
          prerequisiteConceptId: {
            in: conceptIds,
          },
        },
        {
          dependentConceptId: {
            in: conceptIds,
          },
        },
      ],
    },
  })
  await db.conceptChunk.deleteMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
  })
  await db.workedExample.deleteMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
  })
  await db.question.deleteMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
  })
}

function normalizeDistractors(distractors?: string[] | null) {
  if (!distractors) {
    return null
  }

  if (!Array.isArray(distractors)) {
    throw new Error("Distractors must be provided as a list of answer choices.")
  }

  const values = distractors.map((value) => value.trim())

  if (values.some((value) => value.length === 0)) {
    throw new Error("Distractors cannot contain blank answer choices.")
  }

  return values.length ? values : null
}

function requireText(value: string | null | undefined, fieldLabel: string) {
  const normalized = value?.trim()

  if (!normalized) {
    throw new Error(`${fieldLabel} is required.`)
  }

  return normalized
}

function optionalText(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function requireId(value: string | null | undefined, fieldLabel: string) {
  const normalized = value?.trim()

  if (!normalized) {
    throw new Error(`${fieldLabel} is required.`)
  }

  return normalized
}

function optionalId(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function requirePositiveInteger(value: number, fieldLabel: string) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${fieldLabel} must be a positive whole number.`)
  }

  return value
}

function requireProbability(value: number, fieldLabel: string) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${fieldLabel} must be between 0 and 1.`)
  }

  return value
}

function requireEnumValue<TEnum extends Record<string, string>>(
  value: string,
  enumObject: TEnum,
  fieldLabel: string
) {
  if (!Object.values(enumObject).includes(value)) {
    throw new Error(`${fieldLabel} is invalid.`)
  }

  return value as TEnum[keyof TEnum]
}
