"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  History, 
  ShieldCheck, 
  UserCircle,
  FileCheck
} from "lucide-react"
import { cn } from "@/lib/utils"

const GOVERNANCE_NODES = [
  { id: "summary", label: "Overview", icon: ShieldCheck, href: "/admin/governance" },
  { id: "activity", label: "Audit Trail", icon: History, href: "/admin/governance/activity" },
  { id: "review", label: "Review Queue", icon: FileCheck, href: "/admin/governance/review" },
  { id: "users", label: "User Access", icon: UserCircle, href: "/admin/governance/users" },
  { id: "security", label: "Security Logs", icon: ShieldCheck, href: "/admin/governance/security" },
]

export function GovernanceSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-surface-container overflow-hidden">
      <div className="p-4 border-b border-outline-variant bg-surface-container-highest shrink-0">
        <h2 className="text-[10px] font-bold text-on-surface uppercase tracking-wider mb-1">
          Governance
        </h2>
        <p className="text-on-surface-variant text-xs font-medium">Compliance & Audit</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 bg-surface-container/50">
        {GOVERNANCE_NODES.map((node) => {
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
      </div>
    </div>
  )
}
