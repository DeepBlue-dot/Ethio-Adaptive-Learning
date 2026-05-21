import React from "react"

export function WorkspaceShell({ 
  children, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasContextSidebar = false 
}: { 
  children: React.ReactNode, 
  hasContextSidebar?: boolean 
}) {
  return (
    <main className="flex-1 flex flex-col h-full bg-surface-container-lowest transition-all duration-300 overflow-hidden min-w-0">
      {children}
    </main>
  )
}
