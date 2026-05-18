import { Prisma, type UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { buildFallbackSlug, withNumericSuffix } from "@/lib/slugs"

export type DbClient = Prisma.TransactionClient | typeof prisma
export type CmsRole = Extract<UserRole, "ADMIN" | "COURSE_WRITER">

export const CMS_ROLES: CmsRole[] = ["ADMIN", "COURSE_WRITER"]

export async function validateCmsAuthorId(authorId?: string | null) {
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

export async function resolveCourseSlug(args: {
  title: string
  slug?: string | null
  excludeId?: string
  db?: DbClient
}) {
  const db = args.db ?? prisma

  return resolveScopedSlug({
    baseValue: optionalText(args.slug) ?? args.title,
    fallbackPrefix: "course",
    isTaken: async (slug) => {
      const existing = await db.course.findFirst({
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

export async function resolveUnitSlug(args: {
  courseId: string
  title: string
  slug?: string | null
  excludeId?: string
  db?: DbClient
}) {
  const db = args.db ?? prisma

  return resolveScopedSlug({
    baseValue: optionalText(args.slug) ?? args.title,
    fallbackPrefix: "unit",
    isTaken: async (slug) => {
      const existing = await db.unit.findFirst({
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

export async function resolveConceptSlug(args: {
  unitId: string
  title: string
  slug?: string | null
  excludeId?: string
  db?: DbClient
}) {
  const db = args.db ?? prisma

  return resolveScopedSlug({
    baseValue: optionalText(args.slug) ?? args.title,
    fallbackPrefix: "concept",
    isTaken: async (slug) => {
      const existing = await db.concept.findFirst({
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

export async function resolveConceptChunkSlug(args: {
  conceptId: string
  title: string
  slug?: string | null
  excludeId?: string
  db?: DbClient
}) {
  const db = args.db ?? prisma

  return resolveScopedSlug({
    baseValue: optionalText(args.slug) ?? args.title,
    fallbackPrefix: "chunk",
    isTaken: async (slug) => {
      const existing = await db.conceptChunk.findFirst({
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

export async function resolveWorkedExampleSlug(args: {
  conceptId: string
  title: string
  slug?: string | null
  excludeId?: string
  db?: DbClient
}) {
  const db = args.db ?? prisma

  return resolveScopedSlug({
    baseValue: optionalText(args.slug) ?? args.title,
    fallbackPrefix: "worked-example",
    isTaken: async (slug) => {
      const existing = await db.workedExample.findFirst({
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

export async function resolveQuestionSlug(args: {
  conceptId: string
  content: string
  slug?: string | null
  excludeId?: string
  db?: DbClient
}) {
  const db = args.db ?? prisma

  return resolveScopedSlug({
    baseValue: optionalText(args.slug) ?? args.content,
    fallbackPrefix: "question",
    isTaken: async (slug) => {
      const existing = await db.question.findFirst({
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

export async function deleteConceptDependencies(conceptIds: string[], db: DbClient) {
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

export function normalizeDistractors(distractors?: string[] | null) {
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

export function requireText(value: string | null | undefined, fieldLabel: string) {
  const normalized = value?.trim()

  if (!normalized) {
    throw new Error(`${fieldLabel} is required.`)
  }

  return normalized
}

export function optionalText(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

export function requireId(value: string | null | undefined, fieldLabel: string) {
  const normalized = value?.trim()

  if (!normalized) {
    throw new Error(`${fieldLabel} is required.`)
  }

  return normalized
}

export function optionalId(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

export function requirePositiveInteger(value: number, fieldLabel: string) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${fieldLabel} must be a positive whole number.`)
  }

  return value
}

export function requireProbability(value: number, fieldLabel: string) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${fieldLabel} must be between 0 and 1.`)
  }

  return value
}

export function requireEnumValue<TEnum extends Record<string, string>>(
  value: string,
  enumObject: TEnum,
  fieldLabel: string
) {
  if (!Object.values(enumObject).includes(value)) {
    throw new Error(`${fieldLabel} is invalid.`)
  }

  return value as TEnum[keyof TEnum]
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
