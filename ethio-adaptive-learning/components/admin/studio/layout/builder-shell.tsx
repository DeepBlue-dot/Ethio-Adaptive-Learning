"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useWorkspaceStore } from "@/lib/studio/use-workspace-store"
import { cn } from "@/lib/utils"

interface BuilderShellProps {
  canvas: React.ReactNode
  inspector?: React.ReactNode
  className?: string
}

export function BuilderShell({ canvas, inspector, className }: BuilderShellProps) {
  const activeNodeId = useWorkspaceStore((state) => state.activeNodeId)
  const isInspectorOpen = !!activeNodeId

  return (
    <div className={cn("flex-1 flex overflow-hidden h-full relative bg-surface-container-low/20", className)}>
      {/* 1. Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col min-w-0 transition-all duration-500">
        {canvas}
      </div>

      {/* 2. Contextual Inspector (Right Panel) */}
      <AnimatePresence>
        {isInspectorOpen && (
          <motion.aside
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-[400px] border-l border-outline-variant bg-surface-container-lowest shadow-2xl z-20 flex flex-col relative"
          >
            {inspector || (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                 <p className="text-sm text-on-surface-variant italic opacity-40">
                   Inspector content for node: {activeNodeId}
                 </p>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
