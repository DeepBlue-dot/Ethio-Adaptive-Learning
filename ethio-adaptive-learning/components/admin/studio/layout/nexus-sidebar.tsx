"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  BarChart3, 
  Database, 
  Gavel, 
  HelpCircle, 
  LayoutDashboard, 
  Library, 
  Settings, 
  ShieldCheck,
  Home,
  UserCircle,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

import { useStudioLayout } from "./studio-layout-provider"
import { cn } from "@/lib/utils"

export type StudioModule = "dashboard" | "studio" | "assets" | "intelligence" | "governance" | "platform" | ""

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
  { id: "intelligence", label: "Intelligence", icon: BarChart3, href: "/admin/dashboard" },
  { id: "governance", label: "Governance", icon: Gavel, href: "/admin/governance" },
]

export function NexusSidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const { 
    isMobileNexusOpen, 
    setIsMobileNexusOpen, 
    isNexusCollapsed, 
    setIsNexusCollapsed 
  } = useStudioLayout()

  const getActiveModule = (): StudioModule => {
    if (pathname.includes("/admin/dashboard")) return "dashboard"
    if (pathname.includes("/admin/assets")) return "assets"
    if (pathname.includes("/admin/governance")) return "governance"
    if (pathname.includes("/admin/studio")) return "studio"
    if (pathname.includes("/admin/platform")) return "platform"
    return ""
  }

  const activeModule = getActiveModule()
  const sidebarWidth = isNexusCollapsed ? "w-[80px]" : "w-[80px] lg:w-[240px]"

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileNexusOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileNexusOpen(false)}
        />
      )}

      <nav className={cn(
        "bg-surface border-r border-outline-variant fixed left-0 h-full flex flex-col z-[70] transition-all duration-300 lg:translate-x-0",
        sidebarWidth,
        isMobileNexusOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between border-b border-outline-variant mb-4 shrink-0 transition-all",
          isNexusCollapsed ? "p-4 justify-center lg:justify-between" : "p-6"
        )}>
          <Link
            href="/admin/"
            className={cn("flex items-center gap-3 overflow-hidden", !isNexusCollapsed && "flex-1")}
            onClick={() => setIsMobileNexusOpen(false)}
            title="Go to admin dashboard"
          >
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
               <ShieldCheck className="size-6 text-white" />
            </div>
            {!isNexusCollapsed && (
              <div className="hidden lg:block animate-in fade-in slide-in-from-left-2 duration-300">
                <h1 className="font-display text-lg font-black text-on-surface tracking-tight leading-none">EthioPrep</h1>
                <p className="text-on-surface-variant opacity-60 text-[10px] uppercase font-bold tracking-widest mt-1">Studio Admin</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setIsNexusCollapsed(!isNexusCollapsed)}
            className="hidden lg:flex p-2 text-on-surface hover:bg-surface-container-high rounded-lg transition-all"
            title={isNexusCollapsed ? "Expand" : "Collapse"}
          >
            {isNexusCollapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
          </button>
          <button 
            className="lg:hidden p-2 text-on-surface hover:bg-surface-container-high rounded-lg"
            onClick={() => setIsMobileNexusOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Main Navigation */}
        <div className={cn(
          "flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar transition-all",
          isNexusCollapsed ? "px-2" : "px-3"
        )}>
          {/* Mobile-only Home link (visible in the hidden/mobile navbar) */}
          <Link
            href="/admin"
            onClick={() => setIsMobileNexusOpen(false)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl text-on-surface-variant hover:bg-surface-container-high"
            title="Home"
            aria-label="Home"
          >
            <Home className="size-5" aria-hidden="true" />
            <span className="sr-only">Home</span>
          </Link>
          {NEXUS_ITEMS.map((item) => {
            if (item.adminOnly && role !== "ADMIN") return null
            const isActive = activeModule === item.id

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setIsMobileNexusOpen(false)}
                title={isNexusCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 transition-all duration-200 group rounded-xl relative",
                  isActive 
                    ? "text-primary font-bold" 
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
                  isNexusCollapsed && "justify-center px-0"
                )}
              >
                <item.icon className={cn(
                  "size-5 transition-transform duration-200",
                  isActive ? "text-primary" : "opacity-70 group-hover:opacity-100 group-hover:scale-110"
                )} />
                {!isNexusCollapsed && (
                  <span className="hidden lg:inline text-sm animate-in fade-in slide-in-from-left-1 duration-200">
                    {item.label}
                  </span>
                )}
                {isActive && (
                  <div className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(25,75,223,0.4)]",
                    isNexusCollapsed ? "left-0" : "left-0"
                  )} />
                )}
              </Link>
            )
          })}

          {role === "ADMIN" && (
            <Link
              href="/admin/platform"
              onClick={() => setIsMobileNexusOpen(false)}
              title={isNexusCollapsed ? "Platform" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 transition-all duration-200 group rounded-2xl relative",
                activeModule === "platform" 
                  ? "text-primary font-bold" 
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
                isNexusCollapsed && "justify-center px-0"
              )}
            >
              <UserCircle className={cn(
                "size-5 transition-transform duration-200",
                activeModule === "platform" ? "text-primary" : "opacity-70 group-hover:opacity-100 group-hover:scale-110"
              )} />
              {!isNexusCollapsed && (
                <span className="hidden lg:inline text-sm animate-in fade-in slide-in-from-left-1 duration-200">
                  Platform
                </span>
              )}
              {activeModule === "platform" && (
                <div className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(25,75,223,0.4)]",
                  isNexusCollapsed ? "left-0" : "left-0"
                )} />
              )}
            </Link>
          )}
        </div>

        {/* Footer Navigation */}
        <div className={cn(
          "p-4 border-t border-outline-variant space-y-2 mt-auto bg-surface shrink-0 transition-all",
          isNexusCollapsed ? "p-2 items-center" : "p-4"
        )}>
          <Link
            href="/admin/setting"
            onClick={() => setIsMobileNexusOpen(false)}
            title={isNexusCollapsed ? "Settings" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-on-surface-variant font-medium hover:bg-surface-container-high hover:text-on-surface transition-all rounded-xl relative",
              pathname === "/admin/setting" && "text-primary font-bold",
              isNexusCollapsed && "justify-center px-0"
            )}
          >
            <Settings className={cn(
              "size-5 transition-transform duration-200",
              pathname === "/admin/setting" ? "text-primary" : "opacity-70 group-hover:opacity-100 group-hover:scale-110"
            )} />
            {!isNexusCollapsed && <span className="hidden lg:inline text-sm">Settings</span>}
            {pathname === "/admin/setting" && (
              <div className={cn(
                "absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(25,75,223,0.4)]",
                isNexusCollapsed ? "left-0" : "left-0"
              )} />
            )}
          </Link>

          <Link
            href="/admin/support"
            onClick={() => setIsMobileNexusOpen(false)}
            title={isNexusCollapsed ? "Support" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-on-surface-variant font-medium hover:bg-surface-container-high hover:text-on-surface transition-all rounded-xl",
              isNexusCollapsed && "justify-center px-0"
            )}
          >
            <HelpCircle className="size-5 opacity-70 group-hover:opacity-100" />
            {!isNexusCollapsed && <span className="hidden lg:inline text-sm font-semibold">Support</span>}
          </Link>
        </div>
      </nav>
    </>
  )
}
