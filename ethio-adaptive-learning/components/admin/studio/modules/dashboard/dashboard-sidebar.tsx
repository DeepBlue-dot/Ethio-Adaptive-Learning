"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  HeartPulse, 
  Database, 
  Users, 
  MessageSquare,
  ShieldAlert,
  Zap,
  Activity
} from "lucide-react"
import { cn } from "@/lib/utils"

const DASHBOARD_NODES = [
  { id: "overview", label: "Overview", icon: HeartPulse, href: "/admin/dashboard" },
  { id: "curriculum", label: "Curriculum Pulse", icon: Database, href: "/admin/dashboard/curriculum" },
  { id: "students", label: "Student Signals", icon: Users, href: "/admin/dashboard/students" },
  { id: "authors", label: "Author Feedback", icon: MessageSquare, href: "/admin/dashboard/authors" },
  { id: "quality", label: "Quality Alerts", icon: ShieldAlert, href: "/admin/dashboard/quality" },
  { id: "system", label: "System Health", icon: Activity, href: "/admin/dashboard/system" },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-surface-container overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-outline-variant bg-surface-container-highest shrink-0 shadow-sm relative z-10">
        <div className="flex items-center gap-2 mb-1">
           <div className="size-1.5 rounded-full bg-primary animate-pulse" />
           <h2 className="text-[10px] font-black text-on-surface uppercase tracking-[0.3em]">
             Mission Control
           </h2>
        </div>
        <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">Operations Hub</p>
      </div>

      {/* Navigation View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1.5 bg-surface-container/30 backdrop-blur-sm">
        {DASHBOARD_NODES.map((node) => {
          const isActive = pathname === node.href
          
          return (
            <Link
              key={node.id}
              href={node.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-[13px] font-semibold transition-all duration-300 rounded-2xl relative overflow-hidden group",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              )}
            >
              <node.icon className={cn(
                "size-4.5 transition-all duration-300", 
                isActive ? "text-white stroke-[2.5px]" : "text-primary/60 group-hover:text-primary group-hover:scale-110"
              )} />
              <span className="truncate flex-1 tracking-tight">{node.label}</span>
              
              {isActive && (
                 <div className="absolute right-3 size-1.5 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          )
        })}
        
        <div className="pt-8 px-2">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40">Active Systems</h3>
              <Zap className="size-3.5 text-emerald-500 fill-current animate-pulse" />
           </div>
           
           <div className="space-y-3">
              <StatusIndicator label="Adaptive Engine" status="online" />
              <StatusIndicator label="Audit Pipeline" status="online" />
              <StatusIndicator label="Cloud Assets" status="online" />
           </div>
        </div>
      </div>
    </div>
  )
}

function StatusIndicator({ label, status }: { label: string, status: 'online' | 'busy' | 'offline' }) {
  return (
    <div className="flex items-center justify-between">
       <span className="text-[10px] font-bold text-on-surface-variant opacity-60 tracking-tight">{label}</span>
       <div className={cn(
         "size-1.5 rounded-full shadow-[0_0_8px]",
         status === 'online' ? "bg-emerald-500 shadow-emerald-500/40" : status === 'busy' ? "bg-amber-500 shadow-amber-500/40" : "bg-rose-500 shadow-rose-500/40"
       )} />
    </div>
  )
}
