import React from "react"
import { getConceptHealthMetrics } from "@/lib/studio/content-performance"
import { ConceptTroubleSpots } from "@/components/admin/studio/modules/intelligence/ConceptTroubleSpots"

export default async function ConceptHealthPage() {
  const concepts = await getConceptHealthMetrics()

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div>
         <h1 className="text-3xl font-display font-black text-on-surface uppercase tracking-tight">Concept Health</h1>
         <p className="text-secondary-foreground opacity-60 mt-1">Monitoring structural friction and student drop-off rates.</p>
      </div>
      
      <ConceptTroubleSpots concepts={concepts} />
    </div>
  )
}
