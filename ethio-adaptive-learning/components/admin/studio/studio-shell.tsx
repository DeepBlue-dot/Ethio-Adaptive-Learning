"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import { 
  BarChart3, 
  Database, 
  History, 
  Layout, 
  Library, 
  Settings, 
  ShieldCheck, 
  User, 
  Users 
} from "lucide-react"

import { UserMenu } from "@/components/shared/user-menu"
import { cn } from "@/lib/utils"

export type StudioModule = "studio" | "assets" | "intelligence" | "governance" | "platform"

interface NexusItem {
  id: StudioModule
  label: string
  icon: any
  href: string
  adminOnly?: boolean
}

const NEXUS_ITEMS: NexusItem[] = [
  { id: "studio", label: "Studio", icon: Layout, href: "/admin/dashboard" },
  { id: "assets", label: "Assets", icon: Library, href: "/admin/cms/media-asset" },
  { id: "intelligence", label: "Intelligence", icon: BarChart3, href: "/admin/dashboard" }, // TODO: Analytics page
  { id: "governance", label: "Governance", icon: History, href: "/admin/cms/activity" },
  { id: "platform", label: "Platform", icon: Users, href: "/admin/users", adminOnly: true },
]

export function StudioShell({
  children,
  contextPane,
  role,
  username,
}: {
  children: ReactNode
  contextPane?: ReactNode
  role: string
  username: string
}) {
  const [activeModule, setActiveModule] = useState<StudioModule>("studio")

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-foreground">
      {/* 1. Global Nexus (Left Pane) */}
      <aside className="flex w-16 flex-col items-center border-r border-border bg-slate-950 py-4 text-white">
        <div className="mb-8 flex size-10 items-center justify-center rounded-xl bg-teal-600 font-bold text-white shadow-lg shadow-teal-900/20">
          EP
        </div>

        <nav className="flex flex-1 flex-col gap-4">
          {NEXUS_ITEMS.map((item) => {
            if (item.adminOnly && role !== "ADMIN") return null
            const isActive = activeModule === item.id

            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={cn(
                  "group relative flex size-10 items-center justify-center rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-white/10 text-white shadow-inner" 
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                )}
                title={item.label}
              >
                <item.icon className="size-5" />
                {isActive && (
                  <div className="absolute left-0 h-4 w-1 rounded-r-full bg-teal-500" />
                )}
                
                {/* Tooltip */}
                <div className="absolute left-full ml-4 hidden rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white shadow-xl group-hover:block z-50 whitespace-nowrap">
                  {item.label}
                </div>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <button className="flex size-10 items-center justify-center rounded-xl text-slate-500 hover:bg-white/5 hover:text-slate-200 transition-colors">
            <Settings className="size-5" />
          </button>
          <div className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 overflow-hidden">
            <User className="size-5 text-slate-400" />
          </div>
        </div>
      </aside>

      {/* 2. Context Pane (Secondary Left Pane) */}
      {contextPane && (
        <aside className="w-80 flex flex-col border-r border-border bg-slate-50/50">
          {contextPane}
        </aside>
      )}

      {/* 3. Workspace (Main Area) */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header / Command Bar Pulse */}
        <header className="flex h-14 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
              {activeModule}
            </span>
            <div className="h-4 w-px bg-border" />
            {/* TODO: Add Breadcrumbs here */}
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 rounded-lg border border-border bg-slate-50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-teal-600/30 hover:bg-white">
              <span className="flex size-4 items-center justify-center rounded bg-slate-200 text-[10px] text-slate-600 font-bold">⌘</span>
              <span>K</span>
              <span className="ml-2">Command Palette</span>
            </button>
            
            <div className="h-6 w-px bg-border" />
            
            <UserMenu username={username} role={role as any} />
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
