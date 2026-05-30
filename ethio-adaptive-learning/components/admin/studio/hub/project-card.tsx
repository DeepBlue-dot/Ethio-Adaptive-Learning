"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  Clock, 
  Layers, 
  User,
  MoreVertical
} from "lucide-react"
import { type ProjectStats } from "@/lib/studio/builder-data"

export function ProjectCard({ project }: { project: ProjectStats }) {
  const progress = project.totalCount > 0 
    ? (project.publishedCount / project.totalCount) * 100 
    : 0

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group bg-surface border border-outline-variant rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
    >
      <Link href={`/admin/studio/builder/${project.id}`} className="block h-full">
        <div className="p-8 flex flex-col h-full space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start">
             <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <Layers className="size-7" />
             </div>
             <button className="p-2 hover:bg-surface-container-high rounded-xl text-on-surface-variant transition-colors">
                <MoreVertical className="size-5" />
             </button>
          </div>

          {/* Body */}
          <div className="flex-1">
             <h3 className="text-2xl font-black text-on-surface uppercase tracking-tight leading-tight group-hover:text-primary transition-colors duration-300">
               {project.title}
             </h3>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 mt-2 italic">
               Project ID: {project.slug}
             </p>
          </div>

          {/* Progress */}
          <div className="space-y-4">
             <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Completion</span>
                <span className="text-lg font-black text-on-surface tracking-tighter">{Math.round(progress)}%</span>
             </div>
             <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden shadow-inner p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(25,75,223,0.4)]" 
                />
             </div>
          </div>

          {/* Footer Stats */}
          <div className="pt-6 border-t border-outline-variant/30 grid grid-cols-2 gap-4">
             <div className="flex items-center gap-2">
                <User className="size-3 text-primary opacity-40" />
                <span className="text-[10px] font-black text-on-surface-variant truncate">{project.author.username}</span>
             </div>
             <div className="flex items-center gap-2 justify-end">
                <Clock className="size-3 text-primary opacity-40" />
                <span className="text-[10px] font-black text-on-surface-variant whitespace-nowrap italic">
                  {new Date(project.lastActivity || "").toLocaleDateString()}
                </span>
             </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
