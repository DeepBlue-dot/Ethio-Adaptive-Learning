import { WorkspaceHeader } from "@/components/admin/studio/layout/workspace-header"
import { WorkspaceShell } from "@/components/admin/studio/layout/workspace-shell"
import { requireRole } from "@/lib/auth"

export default async function SettingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireRole("ADMIN")

  return (
    <WorkspaceShell>
      <WorkspaceHeader 
        title="Studio Settings" 
        username={session.user.username} 
        role={session.user.role} 
      />
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar bg-surface/30 text-on-surface">
        {children}
      </div>
    </WorkspaceShell>
  )
}
