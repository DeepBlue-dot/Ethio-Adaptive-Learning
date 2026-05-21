"use client"

import React from "react"
import { ChevronRight } from "lucide-react"

import { useStudioLayout } from "./studio-layout-provider"
import { cn } from "@/lib/utils"

export function ContextSidebar({ children }: { children: React.ReactNode }) {
  const { isContextPaneExpanded, setIsContextPaneExpanded, isNexusCollapsed } = useStudioLayout()

  return (
    <aside className={cn(
      "bg-surface-container fixed h-full w-[320px] border-r border-outline-variant flex flex-col z-40 transition-all duration-300 lg:translate-x-0 hidden lg:flex",
      isNexusCollapsed ? "left-[80px]" : "left-[240px]",
      !isContextPaneExpanded && "-translate-x-[280px]"
    )}>
      <div className="flex-1 overflow-hidden flex flex-col">
         {children}
      </div>
      
      {/* Collapse Toggle for Context Pane */}
      <button 
        onClick={() => setIsContextPaneExpanded(!isContextPaneExpanded)}
        className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant bg-surface shadow-sm hover:bg-surface-container-high transition-colors"
      >
        <ChevronRight className={cn("size-3.5 transition-transform duration-300", isContextPaneExpanded && "rotate-180")} />
      </button>
    </aside>
  )
}
