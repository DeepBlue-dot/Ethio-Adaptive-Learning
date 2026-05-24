import { requireCmsAccess } from "@/lib/cms"
import { getGovernanceSummary } from "@/lib/studio/governance"
import { GovernanceSummary } from "@/components/admin/studio/modules/governance/governance-summary"

export default async function GovernancePage() {
  await requireCmsAccess()
  const stats = await getGovernanceSummary()

  return (
    <div className="max-w-6xl mx-auto space-y-10">
        <div>
           <h1 className="text-3xl font-display font-black text-on-surface tracking-tight">Governance</h1>
           <p className="text-secondary-foreground opacity-60 mt-1">System-wide oversight, compliance, and audit trails.</p>
        </div>
        
        <GovernanceSummary stats={stats} />
    </div>
  )
}
