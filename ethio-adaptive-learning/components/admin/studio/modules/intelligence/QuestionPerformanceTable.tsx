"use client"

import React, { useState } from "react"
import { 
  Search, 
  ArrowUpRight, 
  Clock, 
  BarChart3, 
  AlertTriangle,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { QuestionPerformance } from "@/lib/studio/content-performance"

export function QuestionPerformanceTable({ questions }: { questions: QuestionPerformance[] }) {
  const [search, setSearch] = useState("")

  const filtered = questions.filter(q => 
    q.id.toLowerCase().includes(search.toLowerCase()) ||
    q.conceptTitle.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-white border border-outline-variant rounded-[2rem] overflow-hidden shadow-sm">
      <div className="p-8 border-b border-outline-variant bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div>
            <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Question Analytics</h3>
            <p className="text-xs text-on-surface-variant opacity-60 mt-1">Performance metrics and diagnostic health.</p>
         </div>
         
         <div className="relative group min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant opacity-40 group-focus-within:text-primary group-focus-within:opacity-100 transition-all" />
            <input 
              type="text"
              placeholder="Filter by concept or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-outline-variant rounded-2xl text-xs font-bold text-on-surface focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm"
            />
         </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-highest/30">
              <th className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Question ID / Concept</th>
              <th className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Success Rate</th>
              <th className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Avg Time</th>
              <th className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Discrimination</th>
              <th className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Status</th>
              <th className="px-8 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {filtered.map((q) => (
              <tr key={q.id} className="hover:bg-surface-container-lowest transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                      <BarChart3 className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">ID: {q.id.slice(-8)}</p>
                      <p className="text-sm font-bold text-on-surface">{q.conceptTitle}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                     <div className="flex-1 h-1.5 w-24 bg-surface-container-high rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            q.successRate > 0.7 ? "bg-emerald-500" : q.successRate > 0.4 ? "bg-amber-500" : "bg-rose-500"
                          )} 
                          style={{ width: `${q.successRate * 100}%` }}
                        />
                     </div>
                     <span className="text-xs font-black text-on-surface">{Math.round(q.successRate * 100)}%</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2 text-on-surface-variant">
                      <Clock className="size-3.5 opacity-40" />
                      <span className="text-xs font-bold">{Math.round(q.avgTimeSec)}s</span>
                   </div>
                </td>
                <td className="px-8 py-6">
                   <div className={cn(
                     "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                     q.discriminationIndex > 0.3 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                   )}>
                      {q.discriminationIndex > 0.3 ? "High" : "Low"}
                   </div>
                </td>
                <td className="px-8 py-6">
                   {q.successRate < 0.3 ? (
                      <div className="flex items-center gap-2 text-rose-600">
                         <AlertTriangle className="size-4" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Too Hard?</span>
                      </div>
                   ) : q.successRate > 0.9 ? (
                      <div className="flex items-center gap-2 text-amber-600">
                         <AlertTriangle className="size-4" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Too Easy?</span>
                      </div>
                   ) : (
                      <div className="flex items-center gap-2 text-emerald-600">
                         <CheckCircle2 className="size-4" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Optimal</span>
                      </div>
                   )}
                </td>
                <td className="px-8 py-6 text-right">
                  <Link 
                    href={`/admin/studio/question/${q.id}`}
                    className="size-8 rounded-lg hover:bg-primary/10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-all ml-auto"
                  >
                    <ArrowUpRight className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
