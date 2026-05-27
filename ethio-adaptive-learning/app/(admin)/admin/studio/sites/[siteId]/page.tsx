import { notFound } from "next/navigation"

import { SiteProjectOverview } from "@/components/admin/studio/site-dashboard/site-project-overview"
import { requireRole } from "@/lib/auth"
import { getSiteProjectData } from "@/lib/studio/site-builder"

export default async function SiteProjectPage({
  params,
}: {
  params: Promise<{ siteId: string }>
}) {
  await requireRole(["ADMIN", "COURSE_WRITER"])
  const { siteId } = await params
  const data = await getSiteProjectData(siteId)

  if (!data) notFound()

  return (
    <div className="px-6 py-8 lg:px-10 lg:py-10">
      <SiteProjectOverview data={data} />
    </div>
  )
}
