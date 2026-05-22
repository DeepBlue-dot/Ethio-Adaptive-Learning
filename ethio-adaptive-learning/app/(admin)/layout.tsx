import { NexusSidebar } from "@/components/admin/studio/layout/nexus-sidebar"
import { StudioLayoutProvider } from "@/components/admin/studio/layout/studio-layout-provider"
import { requireRole } from "@/lib/auth"

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])

  return (
    <StudioLayoutProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background text-on-surface font-body-md antialiased text-sm">
        <NexusSidebar user={session.user} />
        <div className="flex-1 flex overflow-hidden relative">
          {children}
        </div>
      </div>
    </StudioLayoutProvider>
  )
}
