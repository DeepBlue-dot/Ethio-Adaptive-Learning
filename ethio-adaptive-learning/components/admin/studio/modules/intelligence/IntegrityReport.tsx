"use client"

import React from "react"
import { 
  AlertTriangle, 
  Link2Off, 
  FileSearch, 
  Hash,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { ContentIntegrityReport } from "@/lib/studio/content-integrity"

export function IntegrityReport({ reports }: { reports: ContentIntegrityReport[] }) {
  const criticalCount = reports.filter(r => r.score < 0.5).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-xl font-black text-on-surface uppercase tracking-tight">Quality Governance</h2>
            <p className="text-sm text-on-surface-variant opacity-60 mt-1">Automated content integrity and structure auditing.</p>
         </div>
         <div className={cn(
           "flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all animate-pulse",
           criticalCount > 0 ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100 animate-none"
         )}>
            {criticalCount > 0 ? <AlertTriangle className="size-4" /> : <ShieldCheck className="size-4" />}
            <span className="text-xs font-black uppercase tracking-widest">{criticalCount} Critical Issues Detected</span>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reports.map((report) => (
          <div key={report.conceptId} className="bg-white border border-outline-variant rounded-[2rem] p-8 shadow-sm group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
               <div className="flex items-center gap-4">
                  <div className={cn(
                    "size-12 rounded-2xl flex items-center justify-center border shadow-sm",
                    report.score > 0.8 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : report.score > 0.5 ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100"
                  )}>
                    <FileSearch className="size-6" />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors">{report.conceptTitle}</h3>
                     <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-40 mt-1">Integrity Score: {Math.round(report.score * 100)}%</p>
                  </div>
               </div>
               
               <Link 
                 href={`/admin/studio/concept/${report.conceptId}`}
                 className="px-6 py-3 bg-surface-container-high rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2"
               >
                 Open Node <ArrowUpRight className="size-3.5" />
               </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <IssueCard 
                  label="Prerequisites" 
                  value={report.orphan ? "Orphan Detected" : "Structural Valid"} 
                  icon={<Hash className="size-4" />}
                  status={report.orphan ? "error" : "success"}
               />
               <IssueCard 
                  label="Broken Links" 
                  value={`${report.brokenResources.length} Found`} 
                  icon={<Link2Off className="size-4" />}
                  status={report.brokenResources.length > 0 ? "error" : "success"}
               />
               <IssueCard 
                  label="Assessment Health" 
                  value={report.missingAssessment ? "Missing Exam" : "Assessment Ready"} 
                  icon={<ShieldCheck className="size-4" />}
                  status={report.missingAssessment ? "error" : "success"}
               />
            </div>

            {report.brokenResources.length > 0 && (
               <div className="mt-8 p-6 bg-rose-50/30 border border-rose-100 rounded-2xl">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3">Broken Asset References</p>
                  <div className="space-y-2">
                     {report.brokenResources.map((res, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-bold text-rose-800/60 uppercase tracking-tight">
                           <div className="size-1 rounded-full bg-rose-400" />
                           {res.type}: {res.id.slice(-8)} (Context: {res.context})
                        </div>
                     ))}
                  </div>
               </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function IssueCard({ label, value, icon, status }: { label: string, value: string, icon: React.ReactNode, status: 'success' | 'error' | 'warning' }) {
  const colors = {
    success: "text-emerald-600 bg-emerald-50 border-emerald-100",
    error: "text-rose-600 bg-rose-50 border-rose-100",
    warning: "text-amber-600 bg-amber-50 border-amber-100"
  }

  return (
    <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/50">
       <div className="flex items-center gap-3 mb-2">
          <div className={cn("size-8 rounded-xl flex items-center justify-center", colors[status])}>
             {icon}
          </div>
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">{label}</span>
       </div>
       <p className={cn("text-xs font-black uppercase tracking-tight", status === 'error' ? "text-rose-600" : "text-on-surface")}>{value}</p>
    </div>
  )
}
