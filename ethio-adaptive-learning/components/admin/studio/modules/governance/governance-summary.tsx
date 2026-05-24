"use client"

import React from "react"
import { 
  Users, 
  FileClock, 
  Activity, 
  ShieldAlert,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import type { GovernanceStats } from "@/lib/studio/governance"

export function GovernanceSummary({ stats }: { stats: GovernanceStats }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Active Writers" 
          value={stats.activeWriters} 
          icon={<Users className="size-5" />}
          href="/admin/governance/users"
          color="blue"
        />
        <StatCard 
          label="Pending Reviews" 
          value={stats.pendingReviews} 
          icon={<FileClock className="size-5" />}
          href="/admin/governance/review"
          color="amber"
        />
        <StatCard 
          label="Activity (24h)" 
          value={stats.totalActivity24h} 
          icon={<Activity className="size-5" />}
          href="/admin/governance/activity"
          color="emerald"
        />
        <StatCard 
          label="Security Events" 
          value={stats.securityAlerts} 
          icon={<ShieldAlert className="size-5" />}
          href="/admin/governance/security"
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white border border-outline-variant rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-black text-on-surface uppercase tracking-tight mb-4">Governance Overview</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              The Governance module provides centralized oversight of the EthioPrep curriculum lifecycle. 
              Monitor system health, track content authorship, and manage administrative access from this dashboard.
            </p>
            <div className="space-y-4">
               <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                  <div>
                     <p className="text-sm font-bold text-on-surface">Audit Trails</p>
                     <p className="text-xs text-on-surface-variant">Complete immutable record of all CMS operations.</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                  <div>
                     <p className="text-sm font-bold text-on-surface">Content Compliance</p>
                     <p className="text-xs text-on-surface-variant">Review and approve curriculum drafts before publication.</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <ShieldAlert className="size-32 text-primary" />
            </div>
            <h3 className="text-lg font-black text-primary uppercase tracking-tight mb-4">System Integrity</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-8 relative z-10">
               Automated compliance checks are currently monitoring 1,240 curriculum nodes. 
               Last validation cycle completed 12 minutes ago with zero critical failures detected.
            </p>
            <Link 
               href="/admin/governance/security"
               className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95"
            >
               View Security Logs
               <ArrowRight className="size-4" />
            </Link>
         </div>
      </div>
    </div>
  )
}

function StatCard({ 
  label, 
  value, 
  icon, 
  href, 
  color 
}: { 
  label: string, 
  value: number | string, 
  icon: React.ReactNode, 
  href: string,
  color: 'blue' | 'amber' | 'emerald' | 'rose'
}) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
  }

  return (
    <Link href={href} className="block group">
      <div className="bg-white border border-outline-variant rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
         <div className="flex items-center justify-between mb-4">
            <div className={`size-10 rounded-2xl flex items-center justify-center ${colors[color]} transition-transform group-hover:scale-110`}>
               {icon}
            </div>
            <ArrowRight className="size-4 text-on-surface-variant opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
         </div>
         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-60 mb-1">{label}</p>
         <p className="text-3xl font-black text-on-surface tracking-tighter">{value}</p>
      </div>
    </Link>
  )
}
