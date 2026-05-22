import { prisma } from "@/lib/prisma"
import { type CmsPublicationStatus } from "@/lib/cms/types"

export type ProjectStats = {
  id: string
  title: string
  slug: string
  publishedCount: number
  totalCount: number
  lastActivity: Date | null
  author: {
    username: string
  }
}

export async function getStudioHubData() {
  const courses = await prisma.course.findMany({
    where: { archivedAt: null },
    include: {
      author: { select: { username: true } },
      units: {
        include: {
          concepts: {
            select: { id: true, status: true, updatedAt: true }
          }
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  })

  const projects: ProjectStats[] = courses.map(course => {
    const allConcepts = course.units.flatMap(u => u.concepts)
    const publishedCount = allConcepts.filter(c => c.status === "PUBLISHED").length
    const totalCount = allConcepts.length
    
    // Find most recent update
    const dates = allConcepts.map(c => new Date(c.updatedAt).getTime())
    const lastActivity = dates.length > 0 ? new Date(Math.max(...dates)) : course.updatedAt

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      publishedCount,
      totalCount,
      lastActivity,
      author: {
        username: course.author?.username || "System"
      }
    }
  })

  return {
    projects
  }
}

export type BuilderNode = {
  id: string
  type: "UNIT" | "CONCEPT"
  title: string
  status: CmsPublicationStatus
  order?: number
}

export type BuilderUnit = BuilderNode & {
  concepts: BuilderNode[]
}

export async function getCourseBuilderData(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: {
          concepts: {
            orderBy: { title: "asc" },
            select: { id: true, title: true, status: true }
          }
        }
      }
    }
  })

  if (!course) return null

  const units: BuilderUnit[] = course.units.map(unit => ({
    id: unit.id,
    type: "UNIT",
    title: unit.title,
    status: "PUBLISHED", 
    order: unit.order,
    concepts: unit.concepts.map(concept => ({
      id: concept.id,
      type: "CONCEPT",
      title: concept.title,
      status: concept.status as CmsPublicationStatus
    }))
  }))

  return {
    id: course.id,
    title: course.title,
    units
  }
}
