"use client"

import { 
  Activity, 
  AlertTriangle, 
  ArrowUpRight, 
  Database, 
  History, 
  Network, 
  Users, 
  Zap 
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

import type { StudioIntelligence } from "@/lib/studio/intelligence"
import { cn } from "@/lib/utils"

export function StudioIntelligenceDashboard({ data }: { data: StudioIntelligence }) {
  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface">Intelligence</h1>
          <p className="text-secondary-foreground opacity-60 mt-1.5 text-lg">System-wide performance and curriculum health.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 text-sm font-bold">
           <Zap className="size-4 fill-current" />
           Live Pulse
        </div>
      </div>

      {/* 1. Pulse Metrics (Bento Row) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          label="Active Students" 
          value={data.global.activeStudents7d} 
          subValue={`of ${data.global.studentCount} total`}
          icon={<Users className="size-5" />}
          trend="+5%"
        />
        <MetricCard 
          label="Avg Mastery" 
          value={`${Math.round(data.global.avgMastery * 100)}%`} 
          subValue="Across population"
          icon={<Zap className="size-5 text-amber-500" />}
          trend="+2%"
        />
        <MetricCard 
          label="Interactions" 
          value={data.global.interactionCount7d} 
          subValue="Last 7 days"
          icon={<Activity className="size-5 text-primary" />}
        />
        <MetricCard 
          label="Content Vol." 
          value={data.content.conceptCount} 
          subValue={`${data.content.publishedCount} published`}
          icon={<Database className="size-5 text-teal-600" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* 2. Health Diagnostics (Integrity Pane) */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white border border-outline-variant rounded-[2.5rem] p-8 shadow-sm h-full">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
              <AlertTriangle className="size-5 text-rose-500" />
              Curriculum Health
            </h3>
            
            <div className="space-y-6">
              <HealthSection title="Struggle Points" items={data.health.strugglePoints} type="struggle" />
              <HealthSection title="Orphan Nodes" items={data.health.orphanConcepts} type="orphan" />
            </div>

            <button className="w-full mt-8 py-3 rounded-2xl bg-slate-50 border border-outline-variant text-xs font-bold text-secondary-foreground hover:bg-slate-100 transition-colors uppercase tracking-widest">
              Full Health Report
            </button>
          </div>
        </div>

        {/* 3. Recent Activity Feed */}
        <div className="xl:col-span-8">
          <div className="bg-white border border-outline-variant rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="p-8 border-b border-outline-variant flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <History className="size-5 text-primary" />
                Recent Pulse
              </h3>
              <Link href="/admin/governance" className="text-xs font-bold text-primary hover:underline">View Audit Trail</Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase tracking-widest font-black text-secondary-foreground/50 border-b border-outline-variant">
                    <th className="py-4 px-8">Actor</th>
                    <th className="py-4 px-4">Action</th>
                    <th className="py-4 px-4">Target</th>
                    <th className="py-4 px-8 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {data.activity.map((log) => (
                    <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer">
                      <td className="py-4 px-8">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">
                            {log.user.username[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold">{log.user.username}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          log.action === "PUBLISH" ? "bg-emerald-50 text-emerald-700" : 
                          log.action === "DELETE" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-primary"
                        )}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                           <span className="text-sm font-medium">{log.entityTitle}</span>
                           <span className="text-[10px] text-secondary-foreground opacity-50 uppercase tracking-tighter">{log.contentType}</span>
                        </div>
                      </td>
                      <td className="py-4 px-8 text-right text-xs text-secondary-foreground opacity-60">
                        {formatDistanceToNow(new Date(log.createdAt))} ago
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, subValue, icon, trend }: { label: string, value: string | number, subValue: string, icon: React.ReactNode, trend?: string }) {
  return (
    <div className="bg-white border border-outline-variant rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-xl bg-slate-50 text-secondary-foreground opacity-70 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-0.5 text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
            <ArrowUpRight className="size-3" />
            {trend}
          </div>
        )}
      </div>
      <div className="text-3xl font-display font-black text-on-surface">{value}</div>
      <div className="mt-1">
        <span className="text-[10px] uppercase font-bold text-secondary-foreground opacity-40 tracking-widest">{label}</span>
        <p className="text-xs text-secondary-foreground opacity-60 mt-0.5">{subValue}</p>
      </div>
    </div>
  )
}

function HealthSection({ title, items, type }: { title: string, items: { id?: string; conceptId?: string; title: string; failCount?: number }[], type: 'struggle' | 'orphan' }) {
  return (
    <div>
      <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary-foreground/40 mb-3">{title}</h4>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-outline-variant/30 hover:border-primary/20 transition-all cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
               {type === 'struggle' ? <Zap className="size-4 text-rose-400" /> : <Network className="size-4 text-amber-400" />}
               <span className="text-sm font-medium truncate">{item.title}</span>
            </div>
            {type === 'struggle' && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                {item.failCount} fails
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
