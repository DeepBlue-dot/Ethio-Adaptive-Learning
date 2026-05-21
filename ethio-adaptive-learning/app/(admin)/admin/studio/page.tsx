import { requireRole } from "@/lib/auth"
import { getStudioIntelligence } from "@/lib/studio/intelligence"
import { StudioIntelligenceDashboard } from "@/components/admin/studio/modules/intelligence/studio-intelligence-dashboard"

export default async function StudioOverviewPage() {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])
  
  const data = await getStudioIntelligence(
    session.user.id, 
    session.user.role
  )

  return <StudioIntelligenceDashboard data={data} />
}
