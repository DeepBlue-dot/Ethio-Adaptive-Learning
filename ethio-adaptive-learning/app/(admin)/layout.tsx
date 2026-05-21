import { CurriculumTree } from "@/components/admin/studio/curriculum-tree"
import { StudioShell } from "@/components/admin/studio/studio-shell"
import { requireRole } from "@/lib/auth"
import { getCurriculumHierarchyCmsData } from "@/lib/cms/adapters/curriculum"

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])
  const hierarchy = await getCurriculumHierarchyCmsData()

  // Transform data for the tree browser
  const treeData = hierarchy.courses.map(course => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    units: course.units.map(unit => ({
      id: unit.id,
      title: unit.title,
      order: unit.order,
      concepts: unit.concepts.map(concept => ({
        id: concept.id,
        title: concept.title,
        slug: concept.slug
      }))
    }))
  }))

  return (
    <StudioShell
      role={session.user.role}
      username={session.user.username}
      contextPane={<CurriculumTree courses={treeData} />}
    >
      {children}
    </StudioShell>
  )
}
