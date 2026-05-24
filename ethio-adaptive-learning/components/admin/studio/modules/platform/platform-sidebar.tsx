"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Users, 
  Shield, 
  Key, 
  Globe,
  LayoutDashboard,
  ShieldCheck,
  Activity
} from "lucide-react"
import { cn } from "@/lib/utils"

const PLATFORM_NODES = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/admin/platform" },
  { id: "users", label: "User Accounts", icon: Users, href: "/admin/platform/users" },
  { id: "roles", label: "Roles & Permissions", icon: Shield, href: "/admin/platform/roles" },
  { id: "api", label: "API Configuration", icon: Key, href: "/admin/platform/api" },
  { id: "locales", label: "Regional Settings", icon: Globe, href: "/admin/platform/locales" },
  { id: "security", label: "Security & Audit", icon: ShieldCheck, href: "/admin/platform/security" },
]

export function PlatformSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-surface-container overflow-hidden">
      <div className="p-4 border-b border-outline-variant bg-surface-container-highest shrink-0">
        <h2 className="text-[11px] font-bold text-on-surface uppercase tracking-wider mb-1">
          Platform
        </h2>
        <p className="text-on-surface-variant text-xs font-medium">Infrastructure</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 bg-surface-container/50">
        {PLATFORM_NODES.map((node) => {
          const isActive = pathname === node.href
          
          return (
            <Link
              key={node.id}
              href={node.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-[13px] font-medium transition-all rounded-lg",
                isActive 
                  ? "bg-primary text-white shadow-sm font-bold" 
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              )}
            >
              <node.icon className={cn("size-4", isActive ? "text-white" : "text-primary/50")} />
              <span className="truncate">{node.label}</span>
            </Link>
          )
        })}
        
        <div className="pt-8 px-2">
           <div className="flex items-center justify-between mb-3">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40">System Health</h3>
              <Activity className="size-3 text-emerald-500 animate-pulse" />
           </div>
           <div className="space-y-2">
              <HealthStatus label="API Engine" status="online" />
              <HealthStatus label="Database Cluster" status="online" />
           </div>
        </div>
      </div>
    </div>
  )
}

function HealthStatus({ label, status }: { label: string, status: 'online' | 'degraded' | 'offline' }) {
  return (
    <div className="flex items-center justify-between">
       <span className="text-[10px] font-bold text-on-surface-variant opacity-60">{label}</span>
       <div className={cn(
         "size-1.5 rounded-full",
         status === 'online' ? "bg-emerald-500" : status === 'degraded' ? "bg-amber-500" : "bg-rose-500"
       )} />
    </div>
  )
}
