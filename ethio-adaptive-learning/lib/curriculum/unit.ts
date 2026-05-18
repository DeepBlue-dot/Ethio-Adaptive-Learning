import { rebuildConceptClosureForCourse } from "@/lib/curriculum-graph"
import { prisma } from "@/lib/prisma"

import type { CreateUnitInput } from "@/lib/curriculum/types"
import {
  deleteConceptDependencies,
  requireId,
  requirePositiveInteger,
  requireText,
  resolveUnitSlug,
} from "@/lib/curriculum/shared"

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
