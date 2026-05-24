import React from "react"
import { getCalibrationCandidates } from "@/lib/studio/parameter-calibration"
import { CalibrationSuggestionCard } from "@/components/admin/studio/modules/intelligence/CalibrationSuggestionCard"
import { FlaskConical, Sparkles } from "lucide-react"

export default async function CalibrationLabPage() {
  const candidates = await getCalibrationCandidates()

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <h1 className="text-3xl font-display font-black text-on-surface uppercase tracking-tight">Calibration Lab</h1>
            <p className="text-secondary-foreground opacity-60 mt-1">Adaptive parameter tuning based on live student observation data.</p>
         </div>
         <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-2xl border border-primary/10">
            <Sparkles className="size-4" />
            <span className="text-xs font-black uppercase tracking-widest">{candidates.length} Tuning Opportunities</span>
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {candidates.map((candidate) => (
          <CalibrationSuggestionCard key={candidate.conceptId} candidate={candidate} />
        ))}

        {candidates.length === 0 && (
          <div className="col-span-full py-32 bg-surface-container-lowest border border-dashed border-outline-variant rounded-[3rem] text-center">
             <div className="size-20 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-6 text-on-surface-variant opacity-20">
                <FlaskConical className="size-8" />
             </div>
             <h3 className="text-lg font-black text-on-surface uppercase tracking-tight opacity-40">System Stabilized</h3>
             <p className="text-sm text-on-surface-variant opacity-30 mt-2">All BKT parameters are currently aligned with student performance.</p>
          </div>
        )}
      </div>
    </div>
  )
}
