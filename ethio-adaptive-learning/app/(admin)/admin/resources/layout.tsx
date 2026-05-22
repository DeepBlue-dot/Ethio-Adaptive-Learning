import { ResourceSidebar } from "@/components/admin/resources/resource-sidebar"
import { ContextSidebar } from "@/components/admin/studio/layout/context-sidebar"
import { WorkspaceHeader } from "@/components/admin/studio/layout/workspace-header"
import { WorkspaceShell } from "@/components/admin/studio/layout/workspace-shell"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUnusedResourcesCount } from "@/app/(admin)/admin/studio/actions"

export default async function ResourcesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])

  const [courses, unusedCountResult] = await Promise.all([
    prisma.course.findMany({
      where: { archivedAt: null },
      select: {
        id: true,
        title: true,
        units: {
          select: {
            id: true,
            title: true,
            order: true,
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { title: "asc" },
    }),
    getUnusedResourcesCount()
  ])

  return (
    <>
      <ContextSidebar>
        <ResourceSidebar 
          courses={courses} 
          unusedCount={unusedCountResult.count} 
        />
      </ContextSidebar>
      
      <WorkspaceShell hasContextSidebar>
        <WorkspaceHeader 
          title="Resources" 
          username={session.user.username} 
          role={session.user.role}
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Resources" }
          ]}
        />
        <div className="flex-1 overflow-hidden relative flex">
          {children}
        </div>
      </WorkspaceShell>
    </>
  )
}
