"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Settings, 
  Smartphone, 
  Palette, 
  Bell
} from "lucide-react"
import { cn } from "@/lib/utils"

const SETTING_NODES = [
  { id: "general", label: "General Settings", icon: Settings, href: "/admin/setting" },
  { id: "appearance", label: "Appearance", icon: Palette, href: "/admin/setting" },
  { id: "mobile", label: "Mobile Experience", icon: Smartphone, href: "/admin/setting" },
  { id: "notifications", label: "System Notifications", icon: Bell, href: "/admin/setting" },
]

export function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-surface-container overflow-hidden">
      <div className="p-4 border-b border-outline-variant bg-surface-container-highest shrink-0">
        <h2 className="text-[11px] font-bold text-on-surface uppercase tracking-wider mb-1">
          Settings
        </h2>
        <p className="text-on-surface-variant text-xs font-medium">Studio Preferences</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <div className="space-y-1">
          {SETTING_NODES.map((node) => {
            const isActive = pathname === node.href && node.id === "general"
            
            return (
              <Link
                key={node.id}
                href={node.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all rounded-lg",
                  isActive 
                    ? "bg-surface-variant text-on-surface border-l-2 border-primary shadow-sm" 
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
    </div>
  )
}
