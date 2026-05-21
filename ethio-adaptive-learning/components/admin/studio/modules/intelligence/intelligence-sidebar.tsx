"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Activity, 
  HeartPulse, 
  Target, 
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"

const INTELLIGENCE_NODES = [
  { id: "overview", label: "Global Pulse", icon: HeartPulse, href: "/admin/dashboard" },
  { id: "health", label: "Curriculum Health", icon: Activity, href: "/admin/dashboard" },
  { id: "students", label: "Student Metrics", icon: Users, href: "/admin/dashboard" },
  { id: "mastery", label: "Mastery Trends", icon: Target, href: "/admin/dashboard" },
]

export function IntelligenceSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-surface-container overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-outline-variant bg-surface-container-highest shrink-0">
        <h2 className="text-[10px] font-bold text-on-surface uppercase tracking-[0.2em] mb-1">
          Intelligence
        </h2>
        <p className="text-xs text-on-surface-variant font-medium">Performance Engine</p>
      </div>

      {/* Navigation View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 bg-surface-container/50">
        {INTELLIGENCE_NODES.map((node) => {
          const isActive = pathname === node.href && node.id === "overview"
          
          return (
            <Link
              key={node.id}
              href={node.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-[13px] font-medium transition-all rounded-xl",
                isActive 
                  ? "bg-primary/10 text-primary border-l-2 border-primary shadow-sm font-bold" 
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              )}
            >

              <node.icon className={cn("size-4", isActive ? "text-primary" : "text-primary/50")} />
              <span className="truncate">{node.label}</span>
            </Link>
          )
        })}
        
        <div className="pt-6 px-3">
           <div className="h-px bg-outline-variant/30 mb-4" />
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-3">Recent Alerts</h3>
           <div className="space-y-3">
              <AlertItem label="3 Orphan Nodes" type="warning" />
              <AlertItem label="Low mastery in 'Limits'" type="critical" />
           </div>
        </div>
      </div>
    </div>
  )
}

function AlertItem({ label, type }: { label: string, type: 'warning' | 'critical' }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold group cursor-pointer">
       <div className={cn(
         "size-1.5 rounded-full animate-pulse",
         type === 'critical' 
           ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" 
           : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
       )} />
       <span className="text-on-surface-variant group-hover:text-on-surface transition-colors">{label}</span>
    </div>
  )
}
