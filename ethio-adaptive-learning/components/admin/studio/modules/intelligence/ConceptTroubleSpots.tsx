"use client"

import React from "react"
import { 
  TrendingDown, 
  Award, 
  AlertCircle,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ConceptHealthMetrics } from "@/lib/studio/content-performance"

export function ConceptTroubleSpots({ concepts }: { concepts: ConceptHealthMetrics[] }) {
  // Sort by drop-off rate descending
  const sorted = [...concepts].sort((a, b) => b.dropOffRate - a.dropOffRate)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-xl font-black text-on-surface uppercase tracking-tight">Concept Health</h2>
            <p className="text-sm text-on-surface-variant opacity-60 mt-1">Identifying friction in the learning journey.</p>
         </div>
         <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
            <AlertCircle className="size-4" />
            <span className="text-xs font-black uppercase tracking-widest">{concepts.filter(c => c.dropOffRate > 0.3).length} High Friction Nodes</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sorted.map((c) => (
          <div key={c.id} className="bg-white border border-outline-variant rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                "size-10 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110",
                c.dropOffRate > 0.3 ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
              )}>
                {c.dropOffRate > 0.3 ? <TrendingDown className="size-5" /> : <Award className="size-5" />}
              </div>
              <div className="flex items-center gap-2">
                 <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                 <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{c.activeLearners} Active</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 mb-6">
               <h3 className="text-sm font-black text-on-surface uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">{c.title}</h3>
               
               <div className="space-y-3">
                  <div>
                     <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                        <span className="text-on-surface-variant opacity-60">Drop-off Rate</span>
                        <span className={c.dropOffRate > 0.3 ? "text-rose-600" : "text-emerald-600"}>{Math.round(c.dropOffRate * 100)}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            c.dropOffRate > 0.3 ? "bg-rose-500" : "bg-emerald-500"
                          )} 
                          style={{ width: `${c.dropOffRate * 100}%` }}
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                     <div className="bg-surface-container-low rounded-xl p-3">
                        <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Mastery</p>
                        <p className="text-xs font-black text-on-surface">{Math.round(c.percentMastered * 100)}%</p>
                     </div>
                     <div className="bg-surface-container-low rounded-xl p-3">
                        <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Struggles</p>
                        <p className="text-xs font-black text-on-surface">{c.struggleCount}</p>
                     </div>
                  </div>
               </div>
            </div>

            <button className="w-full h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all group-hover:shadow-lg group-hover:shadow-primary/20">
               Analyze Loop <Zap className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
