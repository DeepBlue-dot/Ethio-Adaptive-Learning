"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  BarChart3, 
  Database, 
  Gavel, 
  LayoutDashboard, 
  Library, 
  ShieldCheck,
  UserCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Home
} from "lucide-react"

import { useStudioLayout } from "./studio-layout-provider"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export type StudioModule = "dashboard" | "studio" | "resources" | "intelligence" | "governance" | "platform" | "portal"

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
  { id: "resources", label: "Resources", icon: Library, href: "/admin/resources" },
  { id: "intelligence", label: "Intelligence", icon: BarChart3, href: "/admin/intelligence" },
  { id: "governance", label: "Governance", icon: Gavel, href: "/admin/governance" },
  { id: "portal", label: "Home", icon: Home, href: "/admin" },
  { id: "platform", label: "Platform", icon: UserCircle, href: "/admin/platform", adminOnly: true },
]

interface NexusSidebarProps {
  user: {
    id: string
    name?: string | null
    username: string
    email?: string | null
    role: string
    image?: string | null
  }
}

export function NexusSidebar({ user }: NexusSidebarProps) {
  const pathname = usePathname()
  const { 
    isMobileNexusOpen, 
    setIsMobileNexusOpen, 
    isNexusCollapsed, 
    setIsNexusCollapsed,
    contextContent
  } = useStudioLayout()

  const getActiveModule = (): StudioModule => {
    if (pathname === "/admin") return "portal"
    if (pathname.includes("/admin/dashboard")) return "dashboard"
    if (pathname.includes("/admin/resources")) return "resources"
    if (pathname.includes("/admin/governance")) return "governance"
    if (pathname.includes("/admin/intelligence")) return "intelligence"
    if (pathname.includes("/admin/studio")) return "studio"
    if (pathname.includes("/admin/platform")) return "platform"
    return "dashboard"
  }

  const activeModule = getActiveModule()

  const isFocusMode = pathname.includes("/admin/studio/editor/")
  if (isFocusMode) return null

  const roleLabel = user.role === "ADMIN" ? "Systems Admin" : "Content Specialist"

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileNexusOpen && (
        <div 
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileNexusOpen(false)}
        />
      )}

      <nav className={cn(
        "bg-surface border-r border-outline-variant h-full flex transition-all duration-300 z-[90]",
        // Desktop positioning: Flex-item
        "lg:sticky lg:top-0 lg:left-0 lg:shrink-0 lg:shadow-none lg:flex-col",
        isNexusCollapsed ? "lg:w-[72px]" : "lg:w-[260px]",
        // Mobile positioning: Fixed Drawer
        "fixed left-0 shadow-2xl lg:shadow-none",
        isMobileNexusOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        contextContent ? "w-full sm:w-[360px]" : "w-[260px]"
      )}>
        
        {/* Pane 1: Global Nexus (Icon Strip on Mobile with context) */}
        <div className={cn(
          "flex flex-col border-r border-outline-variant bg-surface shrink-0 transition-all duration-300 h-full",
          contextContent ? "w-[72px] lg:w-full lg:border-r-0" : "w-full"
        )}>
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between border-b border-outline-variant mb-6 shrink-0 transition-all bg-surface/50 backdrop-blur-md",
            (isNexusCollapsed || (contextContent && !isNexusCollapsed)) ? "p-4 justify-center" : "p-6",
            // Always center on mobile if context exists
            contextContent && "p-4 justify-center lg:p-6 lg:justify-between"
          )}>
            <Link 
              href="/admin" 
              className={cn(
                "flex items-center gap-3 group",
                // when collapsed, center and allow overflow so the icon isn't clipped
                isNexusCollapsed ? "overflow-visible justify-center" : "overflow-hidden"
              )}
              onClick={() => setIsMobileNexusOpen(false)}
            >
              <div className={cn(
                "rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-xl shadow-primary/30 group-hover:scale-105 transition-all duration-300 text-white",
                isNexusCollapsed ? "size-9" : "size-11"
              )}>
                <ShieldCheck className="size-6 stroke-[2.5px]" />
              </div>
              <div className={cn(
                "animate-in fade-in slide-in-from-left-2 duration-500",
                // Always hide title when collapsed; otherwise follow context visibility
                isNexusCollapsed ? "hidden" : (contextContent ? "lg:block hidden" : "block")
              )}>
                <h1 className="font-display text-xl font-black text-on-surface tracking-tight leading-none group-hover:text-primary transition-colors">EthioPrep</h1>
                <p className="text-on-surface-variant opacity-60 text-[9px] uppercase font-black tracking-[0.2em] mt-1.5">Mission Control</p>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
            <Link
              href="/admin"
              onClick={() => setIsMobileNexusOpen(false)}
              title="Home"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 transition-all duration-300 group rounded-xl relative overflow-hidden",
                pathname === "/admin" 
                  ? "text-primary font-bold bg-primary/5 shadow-[0_0_20px_rgba(25,75,223,0.05)]" 
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
                // Mobile behavior: center icons only if we have context (thin rail)
                contextContent ? "justify-center" : "justify-start",
                // Desktop overrides
                "lg:justify-start",
                isNexusCollapsed && "lg:justify-center px-0"
              )}
            >
              <Home className={cn(
                "size-5 transition-all duration-300",
                pathname === "/admin" ? "text-primary stroke-[2.5px]" : "opacity-70 group-hover:opacity-100 group-hover:scale-110"
              )} />
              <span className={cn(
                "text-sm font-semibold animate-in fade-in slide-in-from-left-1 duration-300",
                // Mobile visibility: show if no context, hide if context (to make space for rail)
                contextContent ? "hidden" : "block",
                // Desktop behavior: show by default, hide if collapsed
                "lg:block",
                isNexusCollapsed && "lg:hidden"
              )}>
                Home
              </span>
              {pathname === "/admin" && (
                <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-7 bg-primary rounded-r-full shadow-[0_0_12px_rgba(25,75,223,0.6)]" />
              )}
            </Link>

            {NEXUS_ITEMS.map((item) => {
              if (item.id === "portal") return null
              if (item.adminOnly && user.role !== "ADMIN") return null
              const isActive = activeModule === item.id
              const isCurrentPath = pathname === item.href

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsMobileNexusOpen(false)}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 transition-all duration-300 group rounded-xl relative overflow-hidden",
                    (isActive || isCurrentPath)
                      ? "text-primary font-bold bg-primary/5 shadow-[0_0_20px_rgba(25,75,223,0.05)]" 
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
                    // Mobile behavior: center icons only if we have context (thin rail)
                    contextContent ? "justify-center" : "justify-start",
                    // Desktop overrides
                    "lg:justify-start",
                    isNexusCollapsed && "lg:justify-center px-0"
                  )}
                >
                  <item.icon className={cn(
                    "size-5 transition-all duration-300",
                    (isActive || isCurrentPath) ? "text-primary stroke-[2.5px]" : "opacity-70 group-hover:opacity-100 group-hover:scale-110"
                  )} />
                  <span className={cn(
                    "text-sm font-semibold animate-in fade-in slide-in-from-left-1 duration-300",
                    // Mobile visibility: show if no context, hide if context (to make space for rail)
                    contextContent ? "hidden" : "block",
                    // Desktop behavior: show by default, hide if collapsed
                    "lg:block",
                    isNexusCollapsed && "lg:hidden"
                  )}>
                    {item.label}
                  </span>
                  {(isActive || isCurrentPath) && (
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-7 bg-primary rounded-r-full shadow-[0_0_12px_rgba(25,75,223,0.6)]" />
                  )}
                </Link>
              )
            })}

            
          </div>

          {/* User Profile & Collapse */}
          <div className="p-3 border-t border-outline-variant space-y-1 mt-auto shrink-0 bg-surface/50 backdrop-blur-md">
              {/* User Profile Card */}
              <div className={cn(
                "flex items-center gap-3 p-2 rounded-2xl bg-surface-container-low/50 border border-outline-variant/30 mb-2 transition-all duration-300 group hover:bg-surface-container-high hover:border-primary/20 cursor-pointer",
                isNexusCollapsed ? "justify-center px-1" : "px-3"
              )}>
                <Avatar className={cn(
                  "border-2 border-surface transition-all group-hover:border-primary/20 shadow-sm",
                  isNexusCollapsed ? "size-8" : "size-10"
                )}>
                  <AvatarImage src={user.image || undefined} alt={user.username} />
                  <AvatarFallback className="bg-primary/10 text-primary font-black">
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {!isNexusCollapsed && (
                   <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-500">
                      <p className="text-xs font-black text-on-surface truncate leading-none mb-1">
                        {user.name || user.username}
                      </p>
                      <div className="flex items-center gap-1">
                         <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                         <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
                           {roleLabel}
                         </p>
                      </div>
                   </div>
                )}
              </div>

              <button
                onClick={() => setIsNexusCollapsed(!isNexusCollapsed)}
                className={cn(
                  "hidden lg:flex w-full items-center gap-3 px-3 py-2 text-on-surface-variant font-medium hover:bg-surface-container-high hover:text-on-surface transition-all rounded-xl",
                  isNexusCollapsed ? "justify-center" : "justify-start"
                )}
              >
                {isNexusCollapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
                {!isNexusCollapsed && <span className="text-sm font-bold uppercase tracking-widest text-[10px]">Collapse View</span>}
              </button>
          </div>
        </div>

        {/* Pane 2: Context Content (Visible on Mobile) */}
        {contextContent && (
          <div className="flex-1 flex flex-col min-w-0 bg-surface-container-low/80 backdrop-blur-xl lg:hidden border-l border-outline-variant/50 shadow-2xl animate-in slide-in-from-left-4 duration-300">
             <div className="flex items-center justify-between p-5 border-b border-outline-variant shrink-0 bg-surface-container-highest/30">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 leading-none italic">System Navigator</span>
                <button 
                  onClick={() => setIsMobileNexusOpen(false)}
                  className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-high transition-all"
                >
                  <X className="size-4" />
                </button>
             </div>
             <div className="flex-1 overflow-hidden flex flex-col">
                {contextContent}
             </div>
          </div>
        )}
      </nav>
    </>
  )
}
