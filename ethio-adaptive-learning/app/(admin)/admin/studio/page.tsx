import { requireRole } from "@/lib/auth"
import { getSiteProjectsData } from "@/lib/studio/site-builder"
import { SiteProjectDashboard } from "@/components/admin/studio/site-dashboard/site-project-dashboard"

export default async function StudioOverviewPage() {
  await requireRole(["ADMIN", "COURSE_WRITER"])
  
  const hubData = await getSiteProjectsData()

  return (
    <div className="px-6 py-8 lg:px-10 lg:py-10">
      <SiteProjectDashboard projects={hubData.projects} />
    </div>
  )
}
