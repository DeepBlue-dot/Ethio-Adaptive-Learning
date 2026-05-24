import { getStudioIntelligence } from "@/lib/studio/intelligence"
import { StudioIntelligenceDashboard } from "@/components/admin/studio/modules/intelligence/studio-intelligence-dashboard"

export default async function AdminDashboardPage() {
  const data = await getStudioIntelligence()

  return (
    <div className="animate-in fade-in duration-700">
      <StudioIntelligenceDashboard data={data} />
    </div>
  )
}
