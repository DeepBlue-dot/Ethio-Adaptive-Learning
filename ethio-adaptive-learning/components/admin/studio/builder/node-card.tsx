"use client"

import React from "react"
import { motion } from "framer-motion"
import { 
  FileText, 
  Layers, 
  MoreVertical,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type BuilderNode } from "@/lib/studio/builder-data"
import { useWorkspaceStore } from "@/lib/studio/use-workspace-store"

export function NodeCard({ node }: { node: BuilderNode }) {
  const setActiveNode = useWorkspaceStore(state => state.setActiveNode)
  const activeNodeId = useWorkspaceStore(state => state.activeNodeId)
  const isActive = activeNodeId === node.id

  const isUnit = node.type === "UNIT"

  return (
    <motion.div
      layoutId={node.id}
      onClick={() => setActiveNode(node.id)}
      className={cn(
        "group relative cursor-pointer transition-all duration-300",
        isUnit 
          ? "w-full py-6 px-8 bg-surface-container border-2 rounded-[2rem]" 
          : "w-full p-5 bg-surface border rounded-2xl shadow-sm hover:shadow-md",
        isActive 
          ? "border-primary ring-4 ring-primary/10" 
          : "border-outline-variant hover:border-primary/50"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className={cn(
            "size-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-sm",
            isUnit ? "bg-primary text-white" : "bg-primary/10 text-primary"
          )}>
            {isUnit ? <Layers className="size-5" /> : <FileText className="size-5" />}
          </div>
          
          <div className="min-w-0">
            <h4 className={cn(
              "font-black uppercase tracking-tight truncate",
              isUnit ? "text-lg text-on-surface" : "text-sm text-on-surface"
            )}>
              {isUnit && <span className="text-primary/40 mr-2">U{node.order}:</span>}
              {node.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
               <div className={cn(
                 "size-1.5 rounded-full",
                 node.status === "PUBLISHED" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
               )} />
               <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">
                 {node.status}
               </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
           <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-all">
              <MoreVertical className="size-4" />
           </button>
           <div className={cn(
             "size-8 rounded-full flex items-center justify-center transition-all",
             isActive ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant opacity-0 group-hover:opacity-100"
           )}>
              <ArrowRight className="size-4" />
           </div>
        </div>
      </div>
      
      {/* Connector line for Unit */}
      {isUnit && (
        <div className="absolute left-12 -bottom-6 w-0.5 h-6 bg-outline-variant/30" />
      )}
    </motion.div>
  )
}
