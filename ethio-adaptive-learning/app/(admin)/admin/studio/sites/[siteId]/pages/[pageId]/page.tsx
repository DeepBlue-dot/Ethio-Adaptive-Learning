import { notFound } from "next/navigation"

import { WorkspaceShell } from "@/components/admin/studio/layout/workspace-shell"
import { PageBuilderWorkspace } from "@/components/admin/studio/site-builder/page-builder-workspace"
import { requireRole } from "@/lib/auth"
import { getUnifiedResources } from "@/lib/resources/unified-resources"
import { getPageBuilderData } from "@/lib/studio/site-builder"

export default async function SitePageBuilderPage({
  params,
}: {
  params: Promise<{ siteId: string; pageId: string }>
}) {
  await requireRole(["ADMIN", "COURSE_WRITER"])
  const { siteId, pageId } = await params
  const [data, resources] = await Promise.all([
    getPageBuilderData(siteId, pageId),
    getUnifiedResources(),
  ])

  if (!data) notFound()

  return (
    <WorkspaceShell fullBleed hasContextSidebar>
      <PageBuilderWorkspace data={data} resources={resources} />
    </WorkspaceShell>
  )
}
