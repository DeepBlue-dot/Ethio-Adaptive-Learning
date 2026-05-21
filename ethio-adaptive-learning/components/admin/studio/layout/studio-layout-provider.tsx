"use client"

import React, { createContext, useContext, useState } from "react"

export type MobileSidebarView = "nexus" | "context"

interface StudioLayoutContextType {
  isMobileNexusOpen: boolean
  setIsMobileNexusOpen: (open: boolean) => void
  isNexusCollapsed: boolean
  setIsNexusCollapsed: (collapsed: boolean) => void
  isContextPaneExpanded: boolean
  setIsContextPaneExpanded: (expanded: boolean) => void
  mobileSidebarView: MobileSidebarView
  setMobileSidebarView: (view: MobileSidebarView) => void
  contextContent: React.ReactNode | null
  setContextContent: (content: React.ReactNode | null) => void
}

const StudioLayoutContext = createContext<StudioLayoutContextType | undefined>(undefined)

export function StudioLayoutProvider({ children }: { children: React.ReactNode }) {
  const [isMobileNexusOpen, setIsMobileNexusOpen] = useState(false)
  const [isNexusCollapsed, setIsNexusCollapsed] = useState(false)
  const [isContextPaneExpanded, setIsContextPaneExpanded] = useState(true)
  const [mobileSidebarView, setMobileSidebarView] = useState<MobileSidebarView>("nexus")
  const [contextContent, setContextContent] = useState<React.ReactNode | null>(null)

  return (
    <StudioLayoutContext.Provider 
      value={{ 
        isMobileNexusOpen, 
        setIsMobileNexusOpen,
        isNexusCollapsed,
        setIsNexusCollapsed,
        isContextPaneExpanded,
        setIsContextPaneExpanded,
        mobileSidebarView,
        setMobileSidebarView,
        contextContent,
        setContextContent
      }}
    >
      {children}
    </StudioLayoutContext.Provider>
  )
}

export function useStudioLayout() {
  const context = useContext(StudioLayoutContext)
  if (context === undefined) {
    throw new Error("useStudioLayout must be used within a StudioLayoutProvider")
  }
  return context
}
