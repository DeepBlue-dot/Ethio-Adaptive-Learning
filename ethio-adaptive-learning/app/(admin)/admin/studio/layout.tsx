import { CurriculumTree } from "@/components/admin/studio/curriculum-tree"
import { ContextSidebar } from "@/components/admin/studio/layout/context-sidebar"
import { WorkspaceHeader } from "@/components/admin/studio/layout/workspace-header"
import { WorkspaceShell } from "@/components/admin/studio/layout/workspace-shell"
import { requireRole } from "@/lib/auth"
import { getCurriculumHierarchyCmsData } from "@/lib/cms/adapters/curriculum"

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    <>
      <ContextSidebar>
        <CurriculumTree courses={treeData} />
      </ContextSidebar>
      
      <WorkspaceShell hasContextSidebar>
        <WorkspaceHeader 
          title="Studio" 
          username={session.user.username} 
          role={session.user.role}
          breadcrumbs={[
            { label: "Curriculum" },
            { label: "Grade 12 Mathematics" }
          ]}
        />
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar bg-surface/30 text-on-surface">
          {children}
        </div>
      </WorkspaceShell>
    </>
  )
}
