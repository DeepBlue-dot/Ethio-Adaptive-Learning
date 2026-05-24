import React from "react"
import { getQualityGovernanceOverview } from "@/lib/studio/quality-governance"
import { ShieldAlert, AlertTriangle, Fingerprint, FileSearch } from "lucide-react"

export default async function QualityAlertsPage() {
  const quality = await getQualityGovernanceOverview()

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div>
         <h1 className="text-3xl font-display font-black text-on-surface uppercase tracking-tight">Quality Alerts</h1>
         <p className="text-secondary-foreground opacity-60 mt-1">Automated curriculum integrity and friction detection.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         <AlertCard 
            title="Integrity Score" 
            value={`${(quality.contentIntegrityScore * 100).toFixed(1)}%`} 
            icon={<ShieldAlert className="size-6 text-primary" />}
            description="Overall health of curriculum dependencies and resources."
         />
         <AlertCard 
            title="Orphan Nodes" 
            value={quality.orphanConceptCount} 
            icon={<Fingerprint className="size-6 text-amber-600" />}
            description="Concepts disconnected from the prerequisite DAG."
         />
         <AlertCard 
            title="Struggle Points" 
            value={quality.stuckConceptCount} 
            icon={<AlertTriangle className="size-6 text-rose-600" />}
            description="Concepts where students have unusually high failure rates."
         />
      </div>

      <div className="bg-surface-container-lowest border border-dashed border-outline-variant rounded-[3rem] py-24 text-center">
          <FileSearch className="size-12 mx-auto text-on-surface-variant opacity-20 mb-4" />
          <h3 className="text-lg font-black text-on-surface uppercase tracking-tight opacity-40">Integrity Engine</h3>
          <p className="text-sm text-on-surface-variant opacity-30 mt-2 max-w-sm mx-auto">
             Real-time automated link validation and readability auditing are currently running in the background.
          </p>
      </div>
    </div>
  )
}

function AlertCard({ title, value, icon, description }: { title: string, value: number | string, icon: React.ReactNode, description: string }) {
  return (
    <div className="bg-white border border-outline-variant rounded-[2rem] p-8 shadow-sm">
       <div className="size-12 rounded-2xl bg-surface-container-low flex items-center justify-center border border-outline-variant/30 mb-6">
          {icon}
       </div>
       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 mb-1">{title}</p>
       <p className="text-4xl font-black text-on-surface tracking-tighter mb-3">{value}</p>
       <p className="text-xs font-medium text-on-surface-variant opacity-60 leading-relaxed">{description}</p>
    </div>
  )
}
