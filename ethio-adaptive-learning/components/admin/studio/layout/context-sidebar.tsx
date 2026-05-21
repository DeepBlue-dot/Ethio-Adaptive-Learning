"use client"

import React from "react"
import { ChevronRight } from "lucide-react"

import { useStudioLayout } from "./studio-layout-provider"
import { cn } from "@/lib/utils"

export function ContextSidebar({ children }: { children: React.ReactNode }) {
  const { 
    isContextPaneExpanded, 
    setIsContextPaneExpanded, 
    setContextContent,
    setMobileSidebarView
  } = useStudioLayout()

  // Register children for mobile drawer
  React.useEffect(() => {
    setContextContent(children)
    setMobileSidebarView("context")

    return () => {
      setContextContent(null)
      setMobileSidebarView("nexus")
    }
  }, [children, setContextContent, setMobileSidebarView])

  return (
    <aside className={cn(
      "bg-surface-container h-full border-r border-outline-variant flex-col transition-all duration-300 hidden lg:flex shrink-0 z-40 shadow-sm sticky top-0",
      isContextPaneExpanded ? "w-[320px]" : "w-[40px]"
    )}>
      <div className={cn(
        "flex-1 overflow-hidden flex flex-col transition-opacity duration-200",
        !isContextPaneExpanded && "opacity-0 pointer-events-none"
      )}>
         {children}
      </div>

      {/* Collapse Toggle for Context Pane */}
      <button 
        onClick={() => setIsContextPaneExpanded(!isContextPaneExpanded)}
        className={cn(
          "absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant bg-surface shadow-md hover:bg-surface-container-high transition-all hover:scale-110",
        )}
        title={isContextPaneExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        <ChevronRight className={cn("size-3.5 transition-transform duration-500 text-primary font-bold", isContextPaneExpanded && "rotate-180")} />
      </button>
    </aside>
  )
}
