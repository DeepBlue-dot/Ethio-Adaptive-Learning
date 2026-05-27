import { PlatformSidebar } from "@/components/admin/studio/modules/platform/platform-sidebar"
import { ContextSidebar } from "@/components/admin/studio/layout/context-sidebar"
import { WorkspaceHeader } from "@/components/admin/studio/layout/workspace-header"
import { WorkspaceShell } from "@/components/admin/studio/layout/workspace-shell"
import { requireRole } from "@/lib/auth-server"

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireRole("ADMIN")

  return (
    <>
      <ContextSidebar>
        <PlatformSidebar />
      </ContextSidebar>
      
      <WorkspaceShell hasContextSidebar>
        <WorkspaceHeader 
          title="Platform" 
          username={session.user.username} 
          role={session.user.role}
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Platform" }
          ]}
        />
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-surface/30 text-on-surface">
          {children}
        </div>
      </WorkspaceShell>
    </>
  )
}
