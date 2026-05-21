"use client"

import React from "react"
import { ChevronRight } from "lucide-react"

import { useStudioLayout } from "./studio-layout-provider"
import { cn } from "@/lib/utils"

export function ContextSidebar({ children }: { children: React.ReactNode }) {
  const { 
    isContextPaneExpanded, 
    setIsContextPaneExpanded, 
    isNexusCollapsed,
    isContextMobileOpen,
    setIsContextMobileOpen
  } = useStudioLayout()

  return (
    <>
      {/* Mobile Overlay */}
      {isContextMobileOpen && (
        <div 
          className="fixed inset-0 z-[45] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsContextMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "bg-surface-container fixed h-full w-[320px] border-r border-outline-variant flex flex-col transition-all duration-300",
        // Desktop positioning
        "lg:z-40",
        isNexusCollapsed ? "lg:left-[80px]" : "lg:left-[240px]",
        !isContextPaneExpanded ? "lg:-translate-x-[280px]" : "lg:translate-x-0",
        // Mobile positioning
        "z-[50] left-0 shadow-2xl lg:shadow-none lg:flex",
        isContextMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        !isContextPaneExpanded && !isContextMobileOpen && "hidden lg:flex"
      )}>
        <div className="flex-1 overflow-hidden flex flex-col">
           {children}
        </div>
        
        {/* Collapse Toggle for Context Pane (Desktop Only) */}
        <button 
          onClick={() => setIsContextPaneExpanded(!isContextPaneExpanded)}
          className="absolute -right-3 top-20 z-50 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant bg-surface shadow-sm hover:bg-surface-container-high transition-colors"
        >
          <ChevronRight className={cn("size-3.5 transition-transform duration-300", isContextPaneExpanded && "rotate-180")} />
        </button>
      </aside>
    </>
  )
}
