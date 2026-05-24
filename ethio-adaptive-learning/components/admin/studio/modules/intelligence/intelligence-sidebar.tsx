"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Activity, 
  HeartPulse, 
  Search,
  FlaskConical,
  ShieldCheck
} from "lucide-react"
import { cn } from "@/lib/utils"

const INTELLIGENCE_NODES = [
  { id: "overview", label: "Global Pulse", icon: HeartPulse, href: "/admin/intelligence" },
  { id: "questions", label: "Question Analytics", icon: Search, href: "/admin/intelligence/questions" },
  { id: "concepts", label: "Concept Health", icon: Activity, href: "/admin/intelligence/concepts" },
  { id: "calibration", label: "Calibration Lab", icon: FlaskConical, href: "/admin/intelligence/calibration" },
  { id: "quality", label: "Quality Governance", icon: ShieldCheck, href: "/admin/intelligence/quality" },
]

export function IntelligenceSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-surface-container overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-outline-variant bg-surface-container-highest shrink-0 shadow-sm relative z-10">
        <div className="flex items-center gap-2 mb-1">
           <div className="size-1.5 rounded-full bg-primary animate-pulse" />
           <h2 className="text-[10px] font-black text-on-surface uppercase tracking-[0.3em]">
             Intelligence
           </h2>
        </div>
        <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">Engine Diagnostics</p>
      </div>

      {/* Navigation View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1.5 bg-surface-container/30 backdrop-blur-sm">
        {INTELLIGENCE_NODES.map((node) => {
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
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40">System Alerts</h3>
              <div className="size-4 rounded-full bg-rose-500/10 flex items-center justify-center">
                 <div className="size-1.5 rounded-full bg-rose-500 animate-ping" />
              </div>
           </div>
           
           <div className="space-y-2.5">
              <AlertItem label="Orphan Nodes Detected" type="warning" />
              <AlertItem label="Calibration Required" type="warning" />
           </div>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="p-4 bg-surface-container-low/50 border-t border-outline-variant/30 shrink-0">
         <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 italic">
            <Activity className="size-3" />
            Last Sync: Just Now
         </div>
      </div>
    </div>
  )
}

function AlertItem({ label, type }: { label: string, type: 'warning' | 'critical' }) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer border group",
      type === 'critical' 
        ? "bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10 hover:border-rose-500/20" 
        : "bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10 hover:border-amber-500/20"
    )}>
       <div className={cn(
         "size-2 rounded-full shrink-0",
         type === 'critical' 
           ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" 
           : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
       )} />
       <span className={cn(
         "text-[11px] font-bold tracking-tight transition-colors",
         type === 'critical' ? "text-rose-700 group-hover:text-rose-900" : "text-amber-700 group-hover:text-amber-900"
       )}>{label}</span>
    </div>
  )
}
