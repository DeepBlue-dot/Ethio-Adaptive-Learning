"use client"

import React from "react"
import { 
  Sparkles, 
  BarChart3,
  Rocket,
  Zap
} from "lucide-react"
import { motion, type Variants } from "framer-motion"
import { ProjectCard } from "./project-card"
import { type ProjectStats } from "@/lib/studio/builder-data"
import { type StudioIntelligence } from "@/lib/studio/intelligence"
import { cn } from "@/lib/utils"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

export function HubContainer({ 
  projects, 
  intelligence 
}: { 
  projects: ProjectStats[], 
  intelligence: StudioIntelligence 
}) {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-16"
    >
      {/* Header is provided by the layout's `WorkspaceHeader`. */}
      <div className="pt-6" />

      {/* 2. Intelligence Snapshot (Compact) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <motion.div variants={itemVariants}>
            <MiniMetric 
               label="Total Interactions" 
               value={intelligence.global.interactionCount7d.toLocaleString()} 
               icon={<Zap className="size-4" />}
            />
         </motion.div>
         <motion.div variants={itemVariants}>
            <MiniMetric 
               label="Active Students" 
               value={intelligence.global.activeStudents7d} 
               icon={<Rocket className="size-4" />}
            />
         </motion.div>
         <motion.div variants={itemVariants}>
            <MiniMetric 
               label="Draft Content" 
               value={intelligence.content.draftCount} 
               icon={<Sparkles className="size-4" />}
               variant="primary"
            />
         </motion.div>
         <motion.div variants={itemVariants}>
            <MiniMetric 
               label="System Health" 
               value={intelligence.health.strugglePoints.length === 0 ? "Nominal" : `${intelligence.health.strugglePoints.length} Alerts`} 
               icon={<BarChart3 className="size-4" />}
               variant={intelligence.health.strugglePoints.length > 0 ? "danger" : "default"}
            />
         </motion.div>
      </section>

      {/* 3. Project Grid */}
      <section className="space-y-8">
         <motion.div 
           variants={itemVariants}
           className="flex items-center justify-between"
         >
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-60">Active Course Projects</h2>
            <div className="h-px bg-outline-variant/30 flex-1 mx-8" />
            <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-3 py-1 rounded-full border border-primary/10">{projects.length} Total</span>
         </motion.div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {projects.map((project, i) => (
              <motion.div key={project.id} variants={itemVariants}>
                <ProjectCard project={project} />
              </motion.div>
            ))}
         </div>
      </section>
    </motion.div>
  )
}

function MiniMetric({ label, value, icon, variant = "default" }: { label: string, value: string | number, icon: React.ReactNode, variant?: "default" | "primary" | "danger" }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-5 flex items-center gap-4 group hover:border-primary/20 transition-all">
       <div className={cn(
         "size-10 rounded-xl flex items-center justify-center transition-all",
         variant === "primary" ? "bg-primary/10 text-primary" : 
         variant === "danger" ? "bg-rose-500/10 text-rose-600" :
         "bg-surface-container-highest text-on-surface-variant opacity-60"
       )}>
         {icon}
       </div>
       <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">{label}</p>
          <p className="text-lg font-black text-on-surface tracking-tighter mt-0.5">{value}</p>
       </div>
    </div>
  )
}
