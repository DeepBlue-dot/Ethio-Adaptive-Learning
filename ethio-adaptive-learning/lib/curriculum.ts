import {
  DifficultyTier,
  Prisma,
  QuestionUsage,
  type MasteryStatus,
  type UserRole,
} from "@prisma/client"

import {
  assertAcyclicPrerequisiteSelection,
  deriveConceptStatus,
  type GraphMastery,
} from "@/lib/adaptive/graph"
import { computeEffectiveMastery } from "@/lib/adaptive/retention"
import { prisma } from "@/lib/prisma"

type DbClient = Prisma.TransactionClient | typeof prisma

export type CreateCourseInput = {
  title: string
  description?: string | null
  authorId?: string | null
}

export type CreateUnitInput = {
  courseId: string
  title: string
  order: number
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
}

export type CurriculumFilters = {
  courseId?: string
  unitId?: string
  conceptId?: string
}

type CmsRole = Extract<UserRole, "ADMIN" | "COURSE_WRITER">

const CMS_ROLES: CmsRole[] = ["ADMIN", "COURSE_WRITER"]

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
                  },
                },
                prerequisiteEdges: {
                  include: {
                    prerequisiteConcept: {
                      select: {
                        id: true,
                        title: true,
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
            include: {
              prerequisiteEdges: {
                include: {
                  prerequisiteConcept: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
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

  const conceptIds = courses.flatMap((course) =>
    course.units.flatMap((unit) => unit.concepts.map((concept) => concept.id))
  )

  const masteries = conceptIds.length
    ? await prisma.userMastery.findMany({
        where: {
          userId,
          conceptId: {
            in: conceptIds,
          },
        },
      })
    : []

  const masteryMap = new Map<string, GraphMastery>(
    masteries.map((mastery) => [
      mastery.conceptId,
      {
        conceptId: mastery.conceptId,
        pMastery: mastery.pMastery,
        effectiveMastery: computeEffectiveMastery({
          baselineMastery: mastery.pMastery,
          lastAssessedAt: mastery.lastAssessedAt,
          decayLambda:
            courses
              .flatMap((course) => course.units.flatMap((unit) => unit.concepts))
              .find((concept) => concept.id === mastery.conceptId)?.decayLambda ?? 0.01,
        }),
        status: mastery.status,
        nextReviewAt: mastery.nextReviewAt,
        unlockedAt: mastery.unlockedAt,
      },
    ])
  )

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    units: course.units.map((unit) => ({
      id: unit.id,
      title: unit.title,
      order: unit.order,
      concepts: unit.concepts.map((concept) => {
        const derivedStatus = deriveConceptStatus(concept, masteryMap)

        return {
          id: concept.id,
          title: concept.title,
          description: concept.description,
          questionCount: concept.questions.length,
          unlockThreshold: concept.unlockThreshold,
          ...derivedStatus,
        }
      }),
    })),
  }))
}

export async function createCourse(input: CreateCourseInput) {
  const authorId = await validateCmsAuthorId(input.authorId)

  return prisma.course.create({
    data: {
      title: requireText(input.title, "Course title"),
      description: optionalText(input.description),
      authorId,
    },
  })
}

export async function updateCourse(courseId: string, input: CreateCourseInput) {
  const authorId = await validateCmsAuthorId(input.authorId)

  return prisma.course.update({
    where: {
      id: requireId(courseId, "Course"),
    },
    data: {
      title: requireText(input.title, "Course title"),
      description: optionalText(input.description),
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
  return prisma.unit.create({
    data: {
      courseId: requireId(input.courseId, "Course"),
      title: requireText(input.title, "Unit title"),
      order: requirePositiveInteger(input.order, "Unit order"),
    },
  })
}

export async function updateUnit(unitId: string, input: CreateUnitInput) {
  return prisma.unit.update({
    where: {
      id: requireId(unitId, "Unit"),
    },
    data: {
      courseId: requireId(input.courseId, "Course"),
      title: requireText(input.title, "Unit title"),
      order: requirePositiveInteger(input.order, "Unit order"),
    },
  })
}

export async function deleteUnit(unitId: string) {
  const id = requireId(unitId, "Unit")

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

    return tx.unit.delete({
      where: {
        id,
      },
    })
  })
}

export async function createConcept(input: CreateConceptInput) {
  return prisma.concept.create({
    data: normalizeConceptInput(input),
  })
}

export async function updateConcept(conceptId: string, input: CreateConceptInput) {
  return prisma.concept.update({
    where: {
      id: requireId(conceptId, "Concept"),
    },
    data: normalizeConceptInput(input),
  })
}

export async function deleteConcept(conceptId: string) {
  const id = requireId(conceptId, "Concept")

  return prisma.$transaction(async (tx) => {
    await deleteConceptDependencies([id], tx)

    return tx.concept.delete({
      where: {
        id,
      },
    })
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

    if (!prerequisiteConceptIds.length) {
      return []
    }

    await tx.conceptPrerequisite.createMany({
      data: prerequisiteConceptIds.map((prerequisiteConceptId) => ({
        prerequisiteConceptId,
        dependentConceptId: conceptId,
      })),
    })

    return tx.conceptPrerequisite.findMany({
      where: {
        dependentConceptId: conceptId,
      },
    })
  })
}

export async function createQuestion(input: CreateQuestionInput) {
  return prisma.question.create({
    data: normalizeQuestionInput(input),
  })
}

export async function updateQuestion(questionId: string, input: CreateQuestionInput) {
  return prisma.question.update({
    where: {
      id: requireId(questionId, "Question"),
    },
    data: normalizeQuestionInput(input),
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

function normalizeConceptInput(input: CreateConceptInput) {
  return {
    unitId: requireId(input.unitId, "Unit"),
    title: requireText(input.title, "Concept title"),
    description: optionalText(input.description),
    contentBody: optionalText(input.contentBody),
    unlockThreshold: requireProbability(input.unlockThreshold, "Unlock threshold"),
    pLo: requireProbability(input.pLo, "P(L0)"),
    pT: requireProbability(input.pT, "P(T)"),
    pG: requireProbability(input.pG, "P(G)"),
    pS: requireProbability(input.pS, "P(S)"),
    decayLambda: requireProbability(input.decayLambda, "Decay lambda"),
  }
}

function normalizeQuestionInput(input: CreateQuestionInput) {
  const distractors = normalizeDistractors(input.distractors)

  return {
    conceptId: requireId(input.conceptId, "Concept"),
    usage: requireEnumValue(input.usage, QuestionUsage, "Question usage"),
    difficulty: requireEnumValue(input.difficulty, DifficultyTier, "Difficulty tier"),
    content: requireText(input.content, "Question prompt"),
    correctAnswer: requireText(input.correctAnswer, "Correct answer"),
    distractors: distractors ?? Prisma.JsonNull,
    hintText: optionalText(input.hintText),
    explanation: optionalText(input.explanation),
    authorId: optionalId(input.authorId),
  }
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
  await db.question.deleteMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
  })
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
