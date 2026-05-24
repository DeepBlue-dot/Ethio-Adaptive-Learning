import React from "react"
import { getContentIntegrityReports } from "@/lib/studio/content-integrity"
import { IntegrityReport } from "@/components/admin/studio/modules/intelligence/IntegrityReport"

export default async function QualityGovernancePage() {
  const reports = await getContentIntegrityReports()

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div>
         <h1 className="text-3xl font-display font-black text-on-surface uppercase tracking-tight">Quality Governance</h1>
         <p className="text-secondary-foreground opacity-60 mt-1">Automated content auditing for structural integrity and pedagogical compliance.</p>
      </div>
      
      <IntegrityReport reports={reports} />
    </div>
  )
}
