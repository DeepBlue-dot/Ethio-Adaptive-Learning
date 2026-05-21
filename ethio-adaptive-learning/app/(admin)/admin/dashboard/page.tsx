import { requireRole } from "@/lib/auth"
import { getStudioIntelligence } from "@/lib/studio/intelligence"
import { StudioIntelligenceDashboard } from "@/components/admin/studio/modules/intelligence/studio-intelligence-dashboard"

export default async function AdminDashboardPage() {
  await requireRole(["ADMIN", "COURSE_WRITER"])
  
  const data = await getStudioIntelligence()

  return <StudioIntelligenceDashboard data={data} />
}
