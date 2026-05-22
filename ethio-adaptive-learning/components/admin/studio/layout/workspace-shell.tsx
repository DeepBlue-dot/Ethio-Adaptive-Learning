import React from "react"
import { cn } from "@/lib/utils"

export function WorkspaceShell({ 
  children, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasContextSidebar = false,
  fullBleed = false
}: { 
  children: React.ReactNode, 
  hasContextSidebar?: boolean,
  fullBleed?: boolean
}) {
  return (
    <main className={cn(
      "flex-1 flex flex-col h-full bg-surface-container-lowest transition-all duration-300 overflow-hidden min-w-0",
      fullBleed ? "p-0" : ""
    )}>
      {children}
    </main>
  )
}
