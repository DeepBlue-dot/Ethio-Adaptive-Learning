"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  BarChart3, 
  Database, 
  Gavel, 
  HelpCircle, 
  History, 
  LayoutDashboard, 
  Library, 
  Bell, 
  Search, 
  Settings, 
  ShieldCheck,
  UserCircle 
} from "lucide-react"
import type { UserRole } from "@prisma/client"

import { UserMenu } from "@/components/shared/user-menu"
import { cn } from "@/lib/utils"

export type StudioModule = "dashboard" | "studio" | "assets" | "intelligence" | "governance" | "platform"

interface NexusItem {
  id: StudioModule
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  adminOnly?: boolean
}

const NEXUS_ITEMS: NexusItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { id: "studio", label: "Studio", icon: Database, href: "/admin/studio" },
  { id: "assets", label: "Assets", icon: Library, href: "/admin/assets" },
  { id: "intelligence", label: "Intelligence", icon: BarChart3, href: "/admin/dashboard" }, // TODO: Analytics
  { id: "governance", label: "Governance", icon: Gavel, href: "/admin/governance" },
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
  const pathname = usePathname()
  
  const getActiveModule = (): StudioModule => {
    if (pathname.includes("/admin/dashboard")) return "dashboard"
    if (pathname.includes("/admin/assets")) return "assets"
    if (pathname.includes("/admin/governance")) return "governance"
    if (pathname.includes("/admin/studio")) return "studio"
    if (pathname.includes("/admin/platform")) return "platform"
    return "dashboard"
  }

  const activeModule = getActiveModule()

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-on-surface font-body-md antialiased text-sm">
      {/* 1. Global Nexus (Primary Sidebar - 240px) */}
      <nav className="bg-inverse-surface text-primary-fixed dark:text-primary-fixed-dim fixed left-0 h-full w-[240px] border-r border-outline-variant flex flex-col z-50">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-on-surface/10 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
             <ShieldCheck className="size-6 text-on-primary-container" />
          </div>
          <div>
            <h1 className="font-display text-[20px] font-black text-primary-fixed tracking-tight">EthioPrep</h1>
            <p className="text-secondary-fixed-dim opacity-80 mt-1 text-[10px] uppercase font-bold tracking-widest">Studio Admin</p>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 px-2 space-y-1">
          {NEXUS_ITEMS.map((item) => {
            if (item.adminOnly && role !== "ADMIN") return null
            const isActive = activeModule === item.id

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 transition-all duration-75 group",
                  isActive 
                    ? "text-primary-fixed font-bold border-l-4 border-primary-fixed bg-on-tertiary-fixed-variant scale-95" 
                    : "text-secondary-fixed-dim font-medium hover:bg-on-tertiary-fixed-variant hover:text-primary-fixed scale-95"
                )}
              >
                <item.icon className={cn("size-5", isActive ? "text-primary-fixed" : "opacity-80 group-hover:opacity-100")} />
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}

          {role === "ADMIN" && (
            <Link
              href="/admin/platform"
              className={cn(
                "flex items-center gap-3 px-3 py-2 transition-all duration-75 group rounded-sm",
                activeModule === "platform" 
                  ? "text-primary-fixed font-bold border-l-4 border-primary-fixed bg-on-tertiary-fixed-variant scale-95" 
                  : "text-secondary-fixed-dim font-medium hover:bg-on-tertiary-fixed-variant hover:text-primary-fixed scale-95"
              )}
            >
              <UserCircle className="size-5 opacity-80 group-hover:opacity-100" />
              <span className="text-sm">Platform</span>
            </Link>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-2 border-t border-on-surface/10 space-y-1 mt-auto">
          <Link
            href="/admin/platform"
            className="flex items-center gap-3 px-3 py-2 text-secondary-fixed-dim font-medium hover:bg-on-tertiary-fixed-variant hover:text-primary-fixed transition-all rounded-sm scale-95"
          >
            <Settings className="size-5 opacity-70" />
            <span className="text-sm">Settings</span>
          </Link>
          <Link
            href="/admin/support"
            className="flex items-center gap-3 px-3 py-2 text-secondary-fixed-dim font-medium hover:bg-on-tertiary-fixed-variant hover:text-primary-fixed transition-all rounded-sm scale-95"
          >
            <HelpCircle className="size-5 opacity-80" />
            <span className="text-sm">Support</span>
          </Link>
        </div>
      </nav>

      {/* 2. Context Pane (Secondary Sidebar - 320px) */}
      <aside className={cn(
        "bg-surface-container fixed left-[240px] h-full w-[320px] border-r border-outline-variant flex flex-col z-40 transition-transform duration-300",
        !contextPane && "-translate-x-full"
      )}>
        {contextPane}
      </aside>

      {/* 3. Workspace (Main Area) */}
      <main className={cn(
        "flex-1 flex flex-col h-full bg-surface-container-lowest transition-all duration-300",
        contextPane ? "ml-[560px]" : "ml-[240px]"
      )}>
        {/* TopAppBar */}
        <header className="bg-surface-container-lowest border-b border-outline-variant h-16 flex justify-between items-center px-8 sticky top-0 z-30 shadow-sm shrink-0">
          <div className="flex items-center gap-6">
            <h1 className="font-display text-[18px] font-bold text-on-surface">Curriculum Architect</h1>
            
            {/* Contextual Sub-Nav */}
            <nav className="hidden md:flex gap-4 ml-8 text-sm">
              <Link href="/admin/studio" className="text-on-surface-variant font-medium hover:text-primary transition-all py-4 opacity-80 active:opacity-100">Drafts</Link>
              <Link href="/admin/studio" className="text-primary font-bold border-b-2 border-primary pb-1 py-4">Review</Link>
              <Link href="/admin/studio" className="text-on-surface-variant font-medium hover:text-primary transition-all py-4 opacity-80 active:opacity-100">Archive</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Search */}
            <div className="relative hidden lg:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary size-[18px]" />
              <input
                className="pl-9 pr-3 py-1.5 bg-surface border border-outline-variant rounded-full text-sm w-64 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow"
                placeholder="Search curriculum..."
                type="text"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-surface-variant rounded text-[10px] text-secondary font-mono border border-outline-variant/30">⌘K</div>
            </div>

            {/* Actions */}
            <button className="text-secondary hover:text-primary transition-colors p-1 rounded-full">
              <Bell className="size-5" />
            </button>
            <button className="text-secondary hover:text-primary transition-colors p-1 rounded-full">
              <History className="size-5" />
            </button>
            
            <div className="w-px h-6 bg-outline-variant mx-2"></div>
            
            <UserMenu username={username} role={role as UserRole} />
          </div>
        </header>

        {/* Canvas Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  )
}
