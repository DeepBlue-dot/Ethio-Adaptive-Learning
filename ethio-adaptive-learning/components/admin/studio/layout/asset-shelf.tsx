"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChevronDown, 
  Library, 
  X,
  Maximize2,
} from "lucide-react"
import { useWorkspaceStore } from "@/lib/studio/use-workspace-store"
import { cn } from "@/lib/utils"
import { useStudioLayout } from "@/components/admin/studio/layout/studio-layout-provider"
import { Button } from "@/components/ui/button"

interface AssetShelfProps {
  children: React.ReactNode // The Resource Browser content
}

export function AssetShelf({ children }: AssetShelfProps) {
  const isShelfOpen = useWorkspaceStore((state) => state.shelfOpen)
  const setShelfOpen = useWorkspaceStore((state) => state.setShelfOpen)
  const { isNexusCollapsed } = useStudioLayout()
  const shelfSidebarOffset = isNexusCollapsed ? 72 : 260
  
  // Local state for temporary height adjustments
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none">
      <AnimatePresence>
        {isShelfOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{ "--asset-shelf-offset": `${shelfSidebarOffset}px` } as React.CSSProperties}
            className={cn(
              "absolute left-0 right-0 mx-auto w-full max-w-[min(1400px,calc(100vw-2rem))] lg:left-[var(--asset-shelf-offset)] lg:right-4 bg-surface border-t border-outline-variant shadow-[0_-8px_40px_rgba(0,0,0,0.12)] flex flex-col transition-all duration-500 glass-panel pointer-events-auto",
              isExpanded ? "h-[80vh]" : "h-[400px]"
            )}
          >
            {/* Shelf Handle / Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-outline-variant bg-surface-container-highest/30 shrink-0">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                     <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <Library className="size-4" />
                     </div>
                     <h3 className="text-xs font-black uppercase tracking-widest text-on-surface">Asset Library</h3>
                  </div>
                  <div className="h-4 w-px bg-outline-variant" />
                  <div className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                     <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Mission Control Online</span>
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="size-8 p-0 rounded-lg hover:bg-surface-container-high transition-all"
                    title={isExpanded ? "Collapse" : "Expand"}
                  >
                     {isExpanded ? <ChevronDown className="size-4" /> : <Maximize2 className="size-3.5" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShelfOpen(false)}
                    className="size-8 p-0 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 transition-all"
                    title="Close Shelf"
                  >
                     <X className="size-4" />
                  </Button>
               </div>
            </div>

            {/* Shelf Content (The Resource Grid) */}
            <div className="flex-1 overflow-hidden relative flex">
               <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto custom-scrollbar p-6 bg-surface-container-low/20">
                  {children}
               </div>
            </div>

            {/* Bottom Safe Area */}
            <div className="h-safe-bottom" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger (when closed) */}
      {!isShelfOpen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={() => setShelfOpen(true)}
              className="rounded-full h-14 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/40 gap-4 border-4 border-white/20 dark:border-white/5 backdrop-blur-md"
            >
              <Library className="size-5" />
              Open Media Library
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
