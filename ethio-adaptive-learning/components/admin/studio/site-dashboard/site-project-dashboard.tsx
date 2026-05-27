"use client"

import Link from "next/link"
import { ArrowUpRight, Blocks, Clock3, Eye, FilePlus2, Globe2, Layers3, RadioTower, Users } from "lucide-react"
import { motion, type Variants } from "framer-motion"

import { cn } from "@/lib/utils"
import type { SiteProjectSummary } from "@/lib/studio/site-builder"

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 18 } },
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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.08 }}
      className="space-y-8"
    >
      <motion.section variants={itemVariants} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Site projects" value={projects.length} icon={<Globe2 className="size-4" />} />
        <Metric label="Pages" value={totals.pages} icon={<Layers3 className="size-4" />} tone="blue" />
        <Metric label="Live pages" value={totals.live} icon={<RadioTower className="size-4" />} tone="green" />
        <Metric label="Draft pages" value={totals.drafts} icon={<Blocks className="size-4" />} tone="amber" />
      </motion.section>

      <motion.section
        variants={itemVariants}
        className="grid grid-cols-1 overflow-hidden rounded-[2rem] border border-outline-variant bg-surface shadow-sm lg:grid-cols-[1.1fr_0.9fr]"
      >
        <div className="p-8 lg:p-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Workspace</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-on-surface">
                Build learning pages like a site, publish them like a CMS.
              </h2>
            </div>
            <div className="hidden rounded-2xl border border-primary/15 bg-primary/10 p-4 text-primary lg:block">
              <Eye className="size-6" />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Action href={projects[0] ? `/admin/studio/sites/${projects[0].id}` : "/admin/studio"} label="Open Builder" icon={<ArrowUpRight className="size-4" />} primary />
            <Action href={projects[0] ? `/admin/studio/sites/${projects[0].id}/pages/new` : "/admin/studio"} label="New Page" icon={<FilePlus2 className="size-4" />} />
            <Action href="/concepts" label="Preview Live" icon={<Eye className="size-4" />} />
          </div>
        </div>

        <div className="border-t border-outline-variant bg-surface-container-low p-8 lg:border-l lg:border-t-0">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-on-surface-variant/50">Publishing Snapshot</p>
          <div className="mt-6 space-y-4">
            <Progress label="Live coverage" value={totals.pages ? (totals.live / totals.pages) * 100 : 0} />
            <Progress label="Block coverage" value={totals.pages ? Math.min(100, (totals.blocks / Math.max(totals.pages, 1)) * 12) : 0} />
            <Progress label="Draft queue" value={totals.pages ? (totals.drafts / totals.pages) * 100 : 0} inverse />
          </div>
        </div>
      </motion.section>

      <section className="space-y-4">
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <h2 className="text-xs font-black uppercase tracking-[0.25em] text-on-surface-variant/60">
            Site Projects
          </h2>
          <div className="h-px flex-1 bg-outline-variant/40" />
        </motion.div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {projects.map((project) => (
            <motion.div key={project.id} variants={itemVariants}>
              <SiteProjectCard project={project} />
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  )
}

export function SiteProjectCard({ project }: { project: SiteProjectSummary }) {
  const livePercent = project.pageCount ? Math.round((project.livePageCount / project.pageCount) * 100) : 0

  return (
    <div className="group rounded-[2rem] border border-outline-variant bg-surface p-6 shadow-sm transition hover:border-primary/30 hover:shadow-lg">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            <Globe2 className="size-3.5" />
            Site Project
          </div>
          <h3 className="mt-3 truncate text-2xl font-black tracking-tight text-on-surface group-hover:text-primary">
            {project.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm font-medium text-on-surface-variant">
            {project.description || `/${project.slug}`}
          </p>
        </div>
        <Link
          href={`/admin/studio/sites/${project.id}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-105"
          title="Open site project"
        >
          <ArrowUpRight className="size-5" />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat label="Pages" value={project.pageCount} />
        <MiniStat label="Live" value={project.livePageCount} />
        <MiniStat label="Draft" value={project.draftPageCount} />
        <MiniStat label="Blocks" value={project.blockCount} />
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/55">
          <span>Live coverage</span>
          <span>{livePercent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
          <div className="h-full rounded-full bg-primary" style={{ width: `${livePercent}%` }} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/40 pt-5">
        <div className="flex min-w-0 items-center gap-4 text-[10px] font-black uppercase tracking-wider text-on-surface-variant/60">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            {project.author.username}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock3 className="size-3.5" />
            {project.lastActivity ? new Date(project.lastActivity).toLocaleDateString() : "No edits"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={project.previewPath}
            className="rounded-full border border-outline-variant px-3 py-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
          >
            Preview
          </Link>
          <Link
            href={`/admin/studio/sites/${project.id}/pages/new`}
            className="rounded-full bg-primary/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-primary transition hover:bg-primary/15"
          >
            New page
          </Link>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, icon, tone = "default" }: { label: string; value: number; icon: React.ReactNode; tone?: "default" | "blue" | "green" | "amber" }) {
  return (
    <div className="rounded-3xl border border-outline-variant/50 bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl",
            tone === "blue" && "bg-sky-500/10 text-sky-600",
            tone === "green" && "bg-emerald-500/10 text-emerald-600",
            tone === "amber" && "bg-amber-500/10 text-amber-600",
            tone === "default" && "bg-primary/10 text-primary"
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/45">{label}</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-on-surface">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

function Action({ href, label, icon, primary = false }: { href: string; label: string; icon: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-12 items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-widest transition",
        primary
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
          : "border border-outline-variant bg-surface text-on-surface hover:border-primary/30 hover:text-primary"
      )}
    >
      {icon}
      {label}
    </Link>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/45">{label}</p>
      <p className="mt-1 text-lg font-black text-on-surface">{value}</p>
    </div>
  )
}

function Progress({ label, value, inverse = false }: { label: string; value: number; inverse?: boolean }) {
  const display = Math.round(value)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/55">
        <span>{label}</span>
        <span>{display}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-container-high">
        <div
          className={cn("h-full rounded-full", inverse ? "bg-amber-500" : "bg-primary")}
          style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  )
}
