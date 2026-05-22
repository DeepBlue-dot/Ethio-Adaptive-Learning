import { requireRole } from "@/lib/auth"
import { getStudioIntelligence } from "@/lib/studio/intelligence"
import { getStudioHubData } from "@/lib/studio/builder-data"
import { HubContainer } from "@/components/admin/studio/hub/hub-container"

export default async function StudioOverviewPage() {
  await requireRole(["ADMIN", "COURSE_WRITER"])
  
  const [intelligence, hubData] = await Promise.all([
    getStudioIntelligence(),
    getStudioHubData()
  ])

  return (
    <div className="px-6 py-8 lg:px-10 lg:py-10">
      <HubContainer 
        intelligence={intelligence} 
        projects={hubData.projects} 
      />
    </div>
  )
}
