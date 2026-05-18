import { prisma } from "@/lib/prisma"

import type { CreateCourseInput } from "@/lib/curriculum/types"
import {
  CMS_ROLES,
  deleteConceptDependencies,
  optionalText,
  requireId,
  requireText,
  resolveCourseSlug,
  validateCmsAuthorId,
} from "@/lib/curriculum/shared"

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

export async function getCurriculumHierarchyCmsData() {
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
              select: {
                id: true,
                title: true,
                slug: true,
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
