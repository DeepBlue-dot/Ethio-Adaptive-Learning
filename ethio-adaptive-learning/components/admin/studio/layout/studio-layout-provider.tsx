"use client"

import React, { createContext, useContext, useState } from "react"

interface StudioLayoutContextType {
  isMobileNexusOpen: boolean
  setIsMobileNexusOpen: (open: boolean) => void
  isNexusCollapsed: boolean
  setIsNexusCollapsed: (collapsed: boolean) => void
  isContextPaneExpanded: boolean
  setIsContextPaneExpanded: (expanded: boolean) => void
  isContextMobileOpen: boolean
  setIsContextMobileOpen: (open: boolean) => void
}

const StudioLayoutContext = createContext<StudioLayoutContextType | undefined>(undefined)

export function StudioLayoutProvider({ children }: { children: React.ReactNode }) {
  const [isMobileNexusOpen, setIsMobileNexusOpen] = useState(false)
  const [isNexusCollapsed, setIsNexusCollapsed] = useState(false)
  const [isContextPaneExpanded, setIsContextPaneExpanded] = useState(true)
  const [isContextMobileOpen, setIsContextMobileOpen] = useState(false)

  return (
    <StudioLayoutContext.Provider 
      value={{ 
        isMobileNexusOpen, 
        setIsMobileNexusOpen,
        isNexusCollapsed,
        setIsNexusCollapsed,
        isContextPaneExpanded,
        setIsContextPaneExpanded,
        isContextMobileOpen,
        setIsContextMobileOpen
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
