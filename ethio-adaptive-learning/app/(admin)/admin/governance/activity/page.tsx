import { requireCmsAccess } from "@/lib/cms"
import { getDetailedActivityLog } from "@/lib/studio/governance"
import { AuditTimeline } from "@/components/admin/studio/modules/governance/audit-timeline"

export default async function GovernanceActivityPage() {
  await requireCmsAccess()
  const activity = await getDetailedActivityLog()

  return (
    <div className="max-w-6xl mx-auto space-y-10">
        <div>
           <h1 className="text-3xl font-display font-black text-on-surface tracking-tight">Audit Trail</h1>
           <p className="text-secondary-foreground opacity-60 mt-1">Real-time chronicle of all system and content modifications.</p>
        </div>
        
        <AuditTimeline activity={activity} />
    </div>
  )
}
