"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Users, 
  Shield, 
  Key, 
  Globe
} from "lucide-react"
import { cn } from "@/lib/utils"

const PLATFORM_NODES = [
  { id: "users", label: "User Accounts", icon: Users, href: "/admin/platform" },
  { id: "roles", label: "Roles & Permissions", icon: Shield, href: "/admin/platform" },
  { id: "api", label: "API Configuration", icon: Key, href: "/admin/platform" },
  { id: "locales", label: "Regional Settings", icon: Globe, href: "/admin/platform" },
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
          const isActive = pathname === node.href && node.id === "users"
          
          return (
            <Link
              key={node.id}
              href={node.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-[13px] font-medium transition-all rounded-lg",
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
      </div>
    </div>
  )
}
