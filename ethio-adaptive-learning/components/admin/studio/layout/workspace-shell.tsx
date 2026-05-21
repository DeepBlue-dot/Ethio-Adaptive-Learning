"use client"

import React from "react"
import { useStudioLayout } from "./studio-layout-provider"
import { cn } from "@/lib/utils"

export function WorkspaceShell({ 
  children, 
  hasContextSidebar = false 
}: { 
  children: React.ReactNode, 
  hasContextSidebar?: boolean 
}) {
  const { isContextPaneExpanded, isNexusCollapsed } = useStudioLayout()

  // Calculate final margin
  // If context sidebar is expanded, total margin is nexusWidth + contextWidth
  // If context sidebar is collapsed, total margin is nexusWidth (plus small gutter)
  
  return (
    <main className={cn(
      "flex-1 flex flex-col h-full bg-surface-container-lowest transition-all duration-300 overflow-hidden",
      isNexusCollapsed ? "lg:ml-[80px]" : "lg:ml-[240px]",
      hasContextSidebar && isContextPaneExpanded && (isNexusCollapsed ? "lg:ml-[400px]" : "lg:ml-[560px]"),
      hasContextSidebar && !isContextPaneExpanded && "lg:pl-10"
    )}>
      {children}
    </main>
  )
}
