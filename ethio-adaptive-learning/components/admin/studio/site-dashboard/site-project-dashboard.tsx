"use client"

import Link from "next/link"
import { 
  ArrowUpRight, 
  Blocks, 
  Clock3, 
  Eye, 
  FilePlus2, 
  Globe2, 
  Layers3, 
  RadioTower, 
  Users, 
  Sparkles,
  Zap,
  Target,
  LayoutGrid
} from "lucide-react"
import { motion, type Variants, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import type { SiteProjectSummary } from "@/lib/studio/site-builder"
import { Button } from "@/components/ui/button"

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 20,
      mass: 0.8
    } 
  },
}

export function SiteProjectDashboard({ projects }: { projects: SiteProjectSummary[] }) {
  const totals = projects.reduce(
    (acc, project) => ({
      pages: acc.pages + project.pageCount,
      live: acc.live + project.livePageCount,
      drafts: acc.drafts + project.draftPageCount,
      blocks: acc.blocks + project.blockCount,
    }),
    { pages: 0, live: 0, drafts: 0, blocks: 0 }
  )

  const metrics = [
    { label: "Courses", value: projects.length, icon: <Globe2 className="size-5" />, color: "text-primary", bg: "bg-primary/10" },
    { label: "Concepts", value: totals.pages, icon: <Layers3 className="size-5" />, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Live concepts", value: totals.live, icon: <RadioTower className="size-5" />, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Draft concepts", value: totals.drafts, icon: <Blocks className="size-5" />, color: "text-amber-500", bg: "bg-amber-500/10" },
  ]

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.1 }}
      className="space-y-12"
    >
      {/* 1. High-Level Metrics */}
      <motion.section
        variants={itemVariants}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {metrics.map((metric) => (
          <div key={metric.label} className="group relative overflow-hidden rounded-[2.5rem] bg-surface border border-outline-variant/40 p-1 transition-all hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5">
             <div className="flex items-center gap-5 p-5">
                <div className={cn("size-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3", metric.bg, metric.color)}>
                   {metric.icon}
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 leading-none mb-2">{metric.label}</p>
                   <p className="text-3xl font-black tracking-tighter text-on-surface">{metric.value.toLocaleString()}</p>
                </div>
             </div>
             {/* Decorative background element */}
             <div className={cn("absolute -right-4 -bottom-4 size-24 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity", metric.color)}>
                {metric.icon}
             </div>
          </div>
        ))}
      </motion.section>

      {/* 2. Workspace Hero / Featured Action */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-[3rem] border border-outline-variant/30 bg-surface-container-lowest/40 backdrop-blur-xl shadow-2xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-10 lg:p-14 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">
                 <Sparkles className="size-3" />
                 Course Production
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-on-surface leading-[0.95]">
                Orchestrate <span className="text-primary italic">Intelligence</span>.
              </h2>
              <p className="max-w-xl text-lg font-medium text-on-surface-variant/70 leading-relaxed">
                Seamlessly transition from concept mapping to high-fidelity content delivery. Your curriculum is a living graph.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button asChild className="h-14 rounded-2xl bg-primary px-8 text-[11px] font-black uppercase tracking-widest text-on-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Link href="/admin/studio/course/new">
                   <FilePlus2 className="mr-2 size-4" />
                   New Course
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-14 rounded-2xl border-outline-variant/50 px-8 text-[11px] font-black uppercase tracking-widest text-on-surface hover:bg-surface-container transition-all">
                <Link href="/admin/studio/explorer">
                   <Layers3 className="mr-2 size-4" />
                   Explorer
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
               <QuickAction 
                 href={projects[0] ? `/admin/studio/sites/${projects[0].id}` : "/admin/studio"} 
                 label="Studio" 
                 icon={<LayoutGrid className="size-4" />} 
               />
               <QuickAction 
                 href="/admin/resources" 
                 label="Media" 
                 icon={<FilePlus2 className="size-4" />} 
               />
               <QuickAction 
                 href="/admin/dashboard" 
                 label="Stats" 
                 icon={<Zap className="size-4" />} 
               />
               <QuickAction 
                 href="/admin/governance" 
                 label="Logs" 
                 icon={<Target className="size-4" />} 
               />
            </div>
          </div>

          <div className="relative border-t lg:border-t-0 lg:border-l border-outline-variant/30 bg-surface-container-low/30 p-10 lg:p-14 overflow-hidden">
             {/* Abstract UI Decoration */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-80 bg-primary/5 rounded-full blur-3xl" />
             
             <div className="relative space-y-10">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/50 mb-6">Publishing Pulse</p>
                   <div className="space-y-6">
                     <PulseStat label="Concept Maturity" value={totals.pages ? (totals.live / totals.pages) * 100 : 0} color="text-primary" />
                     <PulseStat label="Content Density" value={totals.pages ? Math.min(100, (totals.blocks / Math.max(totals.pages, 1)) * 12) : 0} color="text-blue-500" />
                     <PulseStat label="Draft Velocity" value={totals.pages ? (totals.drafts / totals.pages) * 100 : 0} color="text-amber-500" />
                   </div>
                </div>
                
                <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-center gap-5">
                   <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
                      <RadioTower className="size-6 animate-pulse" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Live Status</p>
                      <p className="text-sm font-bold text-on-surface">Systems Operational</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </motion.section>

      {/* 3. Project Grid */}
      <section className="space-y-8">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <h2 className="text-xl font-black tracking-tight text-on-surface">Production Pipeline</h2>
              <span className="px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70">
                 {projects.length} Active
              </span>
           </div>
           <div className="flex items-center gap-2">
              <Button asChild variant="ghost" className="rounded-xl text-[10px] font-black uppercase tracking-widest text-primary">
                <Link href="/admin/studio/course/new">
                    <FilePlus2 className="mr-2 size-3" />
                    New Course
                </Link>
              </Button>
              <Button asChild variant="ghost" className="rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                <Link href="/admin/studio/sites">
                    View All <ArrowUpRight className="ml-1 size-3" />
                </Link>
              </Button>
           </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {projects.map((project, idx) => (
            <motion.div key={project.id} variants={itemVariants}>
              <SiteProjectCard project={project} index={idx} />
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  )
}

export function SiteProjectCard({ project, index = 0 }: { project: SiteProjectSummary, index?: number }) {
  const livePercent = project.pageCount ? Math.round((project.livePageCount / project.pageCount) * 100) : 0

  return (
    <div className="group relative overflow-hidden rounded-[3rem] border border-outline-variant/30 bg-surface transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-0">
             <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                   <Globe2 className="size-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Course Node</span>
             </div>
             <h3 className="text-3xl font-black tracking-tighter text-on-surface group-hover:text-primary transition-colors truncate">
                {project.title}
             </h3>
             <p className="text-sm font-medium text-on-surface-variant/70 line-clamp-1 italic">
                {project.description || `/${project.slug}`}
             </p>
          </div>
          
          <Link
            href={`/admin/studio/sites/${project.id}`}
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface-container border border-outline-variant/50 text-on-surface-variant transition-all hover:bg-primary hover:text-on-primary hover:border-primary hover:scale-105 active:scale-95 shadow-sm"
          >
            <ArrowUpRight className="size-6" />
          </Link>
        </div>

        {/* Core Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <DetailStat label="Concepts" value={project.pageCount} color="text-on-surface" />
           <DetailStat label="Live" value={project.livePageCount} color="text-emerald-500" />
           <DetailStat label="Drafts" value={project.draftPageCount} color="text-amber-500" />
           <DetailStat label="Blocks" value={project.blockCount} color="text-blue-500" />
        </div>

        {/* Progress */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Publication Maturity</span>
              <span className="text-sm font-black text-primary">{livePercent}%</span>
           </div>
           <div className="h-3 rounded-full bg-surface-container-high overflow-hidden p-1 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${livePercent}%` }}
                transition={{ duration: 1, delay: 0.2 + (index * 0.1) }}
                className="h-full rounded-full bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]"
              />
           </div>
        </div>

        {/* Footer Meta */}
        <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-outline-variant/20">
           <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                 <div className="size-6 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-[10px] font-black">
                    {project.author.username.charAt(0).toUpperCase()}
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">{project.author.username}</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant/40">
                 <Clock3 className="size-3" />
                 <span className="text-[10px] font-black uppercase tracking-wider">{project.lastActivity ? new Date(project.lastActivity).toLocaleDateString() : "Pending"}</span>
              </div>
           </div>
           
           <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="h-9 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container transition-all">
                <Link href={project.previewPath} target="_blank">Preview</Link>
              </Button>
              <Button asChild size="sm" className="h-9 rounded-xl px-4 bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 hover:scale-[1.05] transition-all">
                <Link href={`/admin/studio/sites/${project.id}/pages/new`}>Add Concept</Link>
              </Button>
           </div>
        </div>
      </div>
    </div>
  )
}

function DetailStat({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="p-4 rounded-3xl bg-surface-container-low/50 border border-outline-variant/10 shadow-inner group/stat hover:bg-surface-container-low transition-colors">
       <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/30 mb-1 group-hover/stat:text-primary transition-colors">{label}</p>
       <p className={cn("text-xl font-black tracking-tight", color)}>{value.toLocaleString()}</p>
    </div>
  )
}

function QuickAction({ href, label, icon }: { href: string, label: string, icon: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-outline-variant/40 text-on-surface-variant transition-all hover:border-primary/30 hover:text-primary group/qa">
       <div className="size-8 rounded-xl bg-surface-container-high flex items-center justify-center transition-transform group-hover/qa:scale-110">
          {icon}
       </div>
       <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </Link>
  )
}

function PulseStat({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-2">
       <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
          <span>{label}</span>
          <span className={color}>{Math.round(value)}%</span>
       </div>
       <div className="h-1.5 rounded-full bg-surface-container-highest/30 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn("h-full rounded-full bg-current", color)}
          />
       </div>
    </div>
  )
}

