import { requireCmsAccess } from "@/lib/cms"
import { StudioIntelligenceDashboard } from "@/components/admin/studio/modules/intelligence/studio-intelligence-dashboard"
import { getStudioIntelligence } from "@/lib/studio/intelligence"

export default async function GovernancePage() {
  await requireCmsAccess()
  const data = await getStudioIntelligence()

  return (
    <div className="max-w-6xl mx-auto space-y-10">
        <div>
           <h1 className="text-3xl font-display font-black text-on-surface tracking-tight">Governance</h1>
           <p className="text-secondary-foreground opacity-60 mt-1">Audit trails and system lifecycle management.</p>
        </div>
        
        <StudioIntelligenceDashboard data={data} />
    </div>
  )
}
