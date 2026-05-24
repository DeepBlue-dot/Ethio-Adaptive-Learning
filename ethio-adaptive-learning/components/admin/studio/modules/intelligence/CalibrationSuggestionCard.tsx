"use client"

import React from "react"
import { 
  Wand2, 
  ArrowRight, 
  Settings2,
  RefreshCcw
} from "lucide-react"
import type { CalibrationCandidate } from "@/lib/studio/parameter-calibration"

export function CalibrationSuggestionCard({ candidate }: { candidate: CalibrationCandidate }) {
  return (
    <div className="bg-white border border-outline-variant rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group flex flex-col h-full border-l-[6px] border-l-primary">
      <div className="flex items-center justify-between mb-4">
        <div className="size-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 transition-transform group-hover:scale-110">
          <Settings2 className="size-5" />
        </div>
        <div className="bg-primary/5 text-primary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-primary/10 flex items-center gap-1.5">
           <RefreshCcw className="size-3" />
           {candidate.confidence > 0.8 ? "High Confidence" : "Calibration Advised"}
        </div>
      </div>

      <div className="flex-1 min-w-0 mb-6">
         <h3 className="text-sm font-black text-on-surface uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">{candidate.conceptTitle}</h3>
         
         <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
               <div className="flex-1 bg-surface-container-low rounded-xl p-3 border border-outline-variant/30">
                  <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Current P(Lo)</p>
                  <p className="text-xs font-black text-on-surface-variant opacity-40">{candidate.currentPLo.toFixed(2)}</p>
               </div>
               <ArrowRight className="size-4 text-primary animate-pulse" />
               <div className="flex-1 bg-primary/5 rounded-xl p-3 border border-primary/10">
                  <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-1">Target P(Lo)</p>
                  <p className="text-xs font-black text-primary">{candidate.suggestedPLo.toFixed(2)}</p>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="flex-1 bg-surface-container-low rounded-xl p-3 border border-outline-variant/30">
                  <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Current P(T)</p>
                  <p className="text-xs font-black text-on-surface-variant opacity-40">{candidate.currentPT.toFixed(2)}</p>
               </div>
               <ArrowRight className="size-4 text-primary animate-pulse" />
               <div className="flex-1 bg-primary/5 rounded-xl p-3 border border-primary/10">
                  <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-1">Target P(T)</p>
                  <p className="text-xs font-black text-primary">{candidate.suggestedPT.toFixed(2)}</p>
               </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
               <p className="text-[9px] font-bold text-amber-800 leading-relaxed italic">
                  &quot;Based on {candidate.observationCount} recent attempts, students are learning faster than predicted.&quot;
               </p>
            </div>
         </div>
      </div>

      <button className="w-full h-11 rounded-xl bg-primary text-white flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
         Apply Calibration <Wand2 className="size-4" />
      </button>
    </div>
  )
}
