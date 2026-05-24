import { DashboardSidebar } from "@/components/admin/studio/modules/dashboard/dashboard-sidebar"
import { ContextSidebar } from "@/components/admin/studio/layout/context-sidebar"
import { WorkspaceHeader } from "@/components/admin/studio/layout/workspace-header"
import { WorkspaceShell } from "@/components/admin/studio/layout/workspace-shell"
import { requireRole } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])

  return (
    <>
      <ContextSidebar>
        <DashboardSidebar />
      </ContextSidebar>
      
      <WorkspaceShell hasContextSidebar>
        <WorkspaceHeader 
          title="Mission Control" 
          username={session.user.username} 
          role={session.user.role}
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Operations" }
          ]}
        />
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-surface/30 text-on-surface">
          {children}
        </div>
      </WorkspaceShell>
    </>
  )
}
