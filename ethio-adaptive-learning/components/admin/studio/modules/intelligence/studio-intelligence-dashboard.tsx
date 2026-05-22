"use client"

import React from "react"
import { 
  Activity, 
  AlertTriangle, 
  ArrowUpRight, 
  Database, 
  Network, 
  Users, 
  Zap,
  Target,
  Layers,
  ArrowRight,
  Clock
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

import type { StudioIntelligence } from "@/lib/studio/intelligence"
import { cn } from "@/lib/utils"

export function StudioIntelligenceDashboard({ data }: { data: StudioIntelligence }) {
  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-outline-variant relative">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <div className="size-2 rounded-full bg-primary animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">System Intelligence</span>
          </div>
          <h1 className="font-display text-5xl font-black tracking-tighter text-on-surface uppercase leading-none">
            Global Pulse <span className="text-primary/20 text-3xl ml-1">v4.2</span>
          </h1>
          <p className="text-on-surface-variant font-medium text-lg italic opacity-60 max-w-2xl">
            Synthesized curriculum health and population-scale learning dynamics.
          </p>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/10 text-emerald-600 rounded-[1.25rem] border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm group cursor-default">
           <Zap className="size-3.5 fill-current animate-pulse" />
           Systems Nominal
        </div>
      </div>

      {/* 1. Bento Grid - Mission Control Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {/* Primary: Active Students */}
        <div className="md:col-span-2 lg:col-span-3 h-full">
          <MetricCard 
            label="Active Students" 
            value={data.global.activeStudents7d} 
            subValue={`Retained of ${data.global.studentCount.toLocaleString()} verified accounts`}
            icon={<Users className="size-7" />}
            trend="+5.2%"
            variant="primary"
          />
        </div>
        
        {/* Primary: Avg Mastery */}
        <div className="md:col-span-2 lg:col-span-3 h-full">
          <MetricCard 
            label="Average Mastery" 
            value={`${Math.round(data.global.avgMastery * 100)}%`} 
            subValue="Average proficiency across all tracked concepts"
            icon={<Target className="size-7" />}
            trend="+2.1%"
            variant="secondary"
          />
        </div>

        {/* Secondary Cluster */}
        <div className="md:col-span-2 lg:col-span-2">
          <MetricCard 
            label="Interactions" 
            value={data.global.interactionCount7d.toLocaleString()} 
            subValue="Learning events logged in last 7 days"
            icon={<Activity className="size-5" />}
          />
        </div>

        <div className="md:col-span-2 lg:col-span-2">
          <MetricCard 
            label="Curriculum" 
            value={data.content.conceptCount} 
            subValue={`${data.content.publishedCount} Published, ${data.content.draftCount} Drafts`}
            icon={<Database className="size-5" />}
          />
        </div>

        <div className="md:col-span-2 lg:col-span-2">
          <MetricCard 
            label="Assessment" 
            value={data.content.questionCount} 
            subValue="Verified question bank items"
            icon={<Layers className="size-5" />}
          />
        </div>
      </div>

      {/* 2. Middle Row: Sentinel & Pulse Timeline */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* Health Sentinel (Integrity Pane) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-surface border border-outline-variant rounded-[3rem] p-10 shadow-sm relative overflow-hidden h-full group border-b-4 border-b-rose-500/20">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
               <AlertTriangle className="size-48 text-rose-500 -rotate-12" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-on-surface uppercase tracking-tight">Sentinel</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">Curriculum Health Monitor</p>
                </div>
                <div className="size-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 border border-rose-500/20">
                   <AlertTriangle className="size-6" />
                </div>
              </div>
              
              <div className="space-y-10">
                <HealthSection title="Struggle Points" items={data.health.strugglePoints} type="struggle" />
                <HealthSection title="Orphan Nodes" items={data.health.orphanConcepts} type="orphan" />
              </div>

              <button className="w-full mt-12 py-4 rounded-2xl bg-surface-container-low border border-outline-variant text-[10px] font-black text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 group">
                Full Diagnostic Report
                <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Pulse Timeline (Activity Feed) */}
        <div className="xl:col-span-7">
          <div className="bg-surface border border-outline-variant rounded-[3rem] overflow-hidden shadow-sm flex flex-col h-full relative group/timeline">
            <div className="p-10 border-b border-outline-variant flex items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-20">
              <div>
                <h3 className="text-2xl font-black text-on-surface uppercase tracking-tight">Pulse</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">Connected Event Stream</p>
              </div>
              <Link 
                href="/admin/governance" 
                className="px-5 py-2.5 rounded-xl border border-outline-variant text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                Full Audit Trail
              </Link>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 relative">
               {/* Vertical Timeline Line */}
               <div className="absolute left-[3.25rem] top-10 bottom-10 w-0.5 bg-outline-variant/30 group-hover/timeline:bg-primary/10 transition-colors" />

               <div className="space-y-12 relative z-10">
                  {data.activity.map((log) => (
                    <div key={log.id} className="flex gap-8 group/item">
                       {/* Timeline Marker (Actor) */}
                       <div className="relative shrink-0">
                          <div className={cn(
                            "size-12 rounded-2xl bg-surface border-2 flex items-center justify-center text-[11px] font-black shadow-sm transition-all duration-300 group-hover/item:scale-110 group-hover/item:border-primary group-hover/item:shadow-lg group-hover/item:shadow-primary/10",
                            log.action === "PUBLISH" ? "border-emerald-500/20" : 
                            log.action === "DELETE" ? "border-rose-500/20" : 
                            "border-outline-variant/50"
                          )}>
                            {log.user.username[0].toUpperCase()}
                          </div>
                          <div className="absolute -bottom-2 -right-1 size-5 rounded-lg bg-white border border-outline-variant shadow-sm flex items-center justify-center">
                             {log.action === "PUBLISH" ? <Zap className="size-2.5 text-emerald-600 fill-current" /> : 
                              log.action === "DELETE" ? <Layers className="size-2.5 text-rose-600" /> : 
                              <Clock className="size-2.5 text-primary" />}
                          </div>
                       </div>

                       {/* Content */}
                       <div className="flex-1 space-y-3 pt-1">
                          <div className="flex items-center justify-between gap-4">
                             <div>
                                <span className="text-sm font-black text-on-surface uppercase tracking-tight group-hover/item:text-primary transition-colors">{log.user.username}</span>
                                <span className="text-xs text-on-surface-variant opacity-40 ml-2 font-medium italic">
                                  {formatDistanceToNow(new Date(log.createdAt))} ago
                                </span>
                             </div>
                             <span className={cn(
                               "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-[0.2em] border",
                               log.action === "PUBLISH" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                               log.action === "DELETE" ? "bg-rose-50 text-rose-700 border-rose-100" : 
                               "bg-primary/5 text-primary border-primary/10"
                             )}>
                               {log.action}
                             </span>
                          </div>

                          <div className="bg-surface-container-low/50 border border-outline-variant/30 rounded-2xl p-4 group-hover/item:bg-surface transition-colors group-hover/item:shadow-md group-hover/item:border-primary/10 relative">
                             <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                   <p className="text-sm font-bold text-on-surface truncate">{log.entityTitle}</p>
                                   <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 mt-1">{log.contentType.replace('-', ' ')}</p>
                                </div>
                                <div className="size-8 rounded-xl bg-surface-container-high/50 flex items-center justify-center text-on-surface-variant group-hover/item:text-primary transition-colors">
                                   <ArrowUpRight className="size-4" />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            
            {/* Table Footer */}
            <div className="p-6 bg-surface-container-low/20 border-t border-outline-variant/30 flex justify-center sticky bottom-0 z-20 backdrop-blur-md">
               <button className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant hover:text-primary transition-colors">
                  Load Older Horizon
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ 
  label, 
  value, 
  subValue, 
  icon, 
  trend, 
  variant = "ghost",
  className
}: { 
  label: string, 
  value: string | number, 
  subValue: string, 
  icon: React.ReactNode, 
  trend?: string,
  variant?: "primary" | "secondary" | "ghost",
  className?: string
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-[2.5rem] border transition-all duration-500 group",
      variant === "primary" ? "bg-primary text-white border-primary shadow-2xl shadow-primary/20 hover:scale-[1.01]" :
      variant === "secondary" ? "bg-surface-container-highest border-outline-variant shadow-lg hover:border-primary/30" :
      "bg-surface border-outline-variant shadow-sm hover:shadow-md hover:border-primary/20",
      className
    )}>
      {/* Visual Accents */}
      {variant === "primary" && (
         <div className="absolute inset-0 tibeb-pattern opacity-10 pointer-events-none" />
      )}
      
      <div className="relative p-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-10">
          <div className={cn(
            "p-3.5 rounded-2xl border transition-all duration-300 shadow-sm",
            variant === "primary" ? "bg-white/10 border-white/20 text-white" : "bg-primary/5 border-primary/10 text-primary"
          )}>
            {icon}
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300",
              variant === "primary" ? "bg-white/10 border-white/20 text-white" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
            )}>
              <ArrowUpRight className="size-3 stroke-[3px]" />
              {trend}
            </div>
          )}
        </div>

        <div className="mt-auto">
           <div className={cn(
             "text-6xl font-display font-black tracking-tighter mb-3 leading-none",
             variant === "primary" ? "text-white" : "text-on-surface"
           )}>
             {value}
           </div>
           <div className="space-y-3">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.3em]",
                variant === "primary" ? "text-white/60" : "text-on-surface-variant/40"
              )}>
                {label}
              </span>
              <p className={cn(
                "text-xs font-bold leading-relaxed",
                variant === "primary" ? "text-white/40 italic" : "text-on-surface-variant opacity-40 italic"
              )}>
                {subValue}
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}

function HealthSection({ title, items, type }: { title: string, items: { id?: string; conceptId?: string; title: string; failCount?: number }[], type: 'struggle' | 'orphan' }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
         <div className={cn("size-1.5 rounded-full", type === 'struggle' ? "bg-rose-500" : "bg-amber-500")} />
         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">{title}</h4>
      </div>
      <div className="space-y-3">
        {items.length > 0 ? items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low/50 border border-outline-variant/30 hover:border-primary/20 transition-all cursor-pointer text-on-surface group/item">
            <div className="flex items-center gap-4 min-w-0">
               <div className={cn(
                 "size-8 rounded-xl flex items-center justify-center transition-all",
                 type === 'struggle' ? "bg-rose-500/5 text-rose-500 group-hover/item:bg-rose-500 group-hover/item:text-white" : "bg-amber-500/5 text-amber-500 group-hover/item:bg-amber-500 group-hover/item:text-white"
               )}>
                  {type === 'struggle' ? <Zap className="size-4" /> : <Network className="size-4" />}
               </div>
               <span className="text-sm font-bold truncate tracking-tight">{item.title}</span>
            </div>
            {type === 'struggle' && (
              <div className="text-right shrink-0">
                 <span className="text-[10px] font-black text-rose-600 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/10">
                   {item.failCount} Critical Fails
                 </span>
              </div>
            )}
            {type === 'orphan' && (
               <ArrowRight className="size-3.5 text-on-surface-variant opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
            )}
          </div>
        )) : (
          <div className="p-8 rounded-3xl border border-dashed border-outline-variant text-center">
             <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-30">No Issues Detected</p>
          </div>
        )}
      </div>
    </div>
  )
}
