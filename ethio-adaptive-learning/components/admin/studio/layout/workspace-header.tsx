"use client"

import React from "react"
import { Bell, ChevronRight, History, Menu, Search } from "lucide-react"
import type { UserRole } from "@prisma/client"

import { useStudioLayout } from "./studio-layout-provider"
import { UserMenu } from "@/components/shared/user-menu"
import { cn } from "@/lib/utils"

export function WorkspaceHeader({ 
  title, 
  username, 
  role,
  breadcrumbs = [],
  children 
}: { 
  title: string, 
  username: string, 
  role: UserRole,
  breadcrumbs?: Array<{ label: string; href?: string }>
  children?: React.ReactNode
}) {
  const { setIsMobileNexusOpen } = useStudioLayout()

  return (
    <header className="bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant h-16 flex justify-between items-center px-4 lg:px-8 sticky top-0 z-30 shadow-sm shrink-0 transition-all">
      <div className="flex items-center gap-2 lg:gap-6 min-w-0">
        <div className="flex items-center gap-1 shrink-0">
          <button 
            className="lg:hidden p-2 text-on-surface hover:bg-surface-container rounded-xl transition-all active:scale-95"
            onClick={() => setIsMobileNexusOpen(true)}
            title="Open Menu"
          >
            <Menu className="size-5" />
          </button>
        </div>

        <div className="flex items-center gap-4 min-w-0">
          <h1 className="font-display text-sm lg:text-lg font-bold text-on-surface truncate hidden sm:block tracking-tight">
            {title}
          </h1>
          
          {breadcrumbs.length > 0 && (
            <>
              <div className="h-4 w-px bg-outline-variant hidden md:block opacity-40" />
              <nav className="flex items-center gap-2 text-xs font-medium min-w-0 overflow-hidden">
                {breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <ChevronRight className="size-3 text-outline-variant shrink-0" />}
                    <span className={cn(
                      "truncate py-1 px-2 rounded-lg transition-colors",
                      i === breadcrumbs.length - 1 
                        ? "text-on-surface bg-surface-container-high/50 font-bold" 
                        : "text-on-surface-variant opacity-60 hover:text-primary hover:bg-primary/5 cursor-pointer"
                    )}>
                      {crumb.label}
                    </span>
                  </React.Fragment>
                ))}
              </nav>
            </>
          )}
        </div>
        
        {children}
      </div>

      <div className="flex items-center gap-2 lg:gap-4 shrink-0">
        {/* Global Search */}
        <div className="relative hidden xl:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary size-[14px]" />
          <input
            className="pl-9 pr-10 py-2 bg-surface border border-outline-variant rounded-2xl text-xs w-48 xl:w-64 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
            placeholder="Search..."
            type="text"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-surface-variant rounded-md text-[10px] text-secondary font-mono border border-outline-variant/30 select-none pointer-events-none">⌘K</div>
        </div>

        <div className="flex items-center gap-1 lg:gap-2">
          <button className="text-secondary hover:text-primary transition-all p-2 rounded-full hover:bg-surface-container hidden sm:block active:scale-95">
            <Bell className="size-5" />
          </button>
          <button className="text-secondary hover:text-primary transition-all p-2 rounded-full hover:bg-surface-container active:scale-95">
            <History className="size-5" />
          </button>
        </div>
        
        <div className="w-px h-6 bg-outline-variant mx-1 lg:mx-2 opacity-40"></div>
        
        <UserMenu username={username} role={role} />
      </div>
    </header>
  )
}
