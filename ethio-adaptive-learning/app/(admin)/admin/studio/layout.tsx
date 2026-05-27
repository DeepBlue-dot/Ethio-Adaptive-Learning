import { ContextSidebar } from "@/components/admin/studio/layout/context-sidebar"
import { SiteMapNavigator } from "@/components/admin/studio/site-map/site-map-navigator"
import { WorkspaceHeader } from "@/components/admin/studio/layout/workspace-header"
import { WorkspaceShell } from "@/components/admin/studio/layout/workspace-shell"
import { requireRole } from "@/lib/auth-server"
import { getSiteMapData } from "@/lib/studio/site-builder"

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])
  const siteMap = await getSiteMapData()

  return (
    <>
      <ContextSidebar>
        <SiteMapNavigator projects={siteMap.projects} />
      </ContextSidebar>
      
      <WorkspaceShell hasContextSidebar>
        <WorkspaceHeader 
          title="Studio" 
          username={session.user.username} 
          role={session.user.role}
          breadcrumbs={[
            { label: "Site Builder" },
            { label: "Projects" }
          ]}
        />
        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-surface/30 text-on-surface">
          {children}
        </div>
      </WorkspaceShell>
    </>
  )
}
