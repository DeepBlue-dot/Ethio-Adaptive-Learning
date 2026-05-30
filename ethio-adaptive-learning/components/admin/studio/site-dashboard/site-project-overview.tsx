"use client"

import Link from "next/link"
import { ArrowUpRight, Eye, FilePlus2, RadioTower, Sparkles, LayoutGrid, Target, Zap } from "lucide-react"

import type { AwaitedSiteProjectData } from "./types"
import { SiteProjectCard } from "./site-project-dashboard"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SiteProjectOverview({ data }: { data: AwaitedSiteProjectData }) {
  const firstPage = data.recentPages[0]

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <SiteProjectCard project={data.project} />

        <section className="relative overflow-hidden rounded-[3rem] border border-outline-variant/30 bg-surface-container-lowest/40 backdrop-blur-xl p-8 lg:p-10 shadow-2xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
             <Target className="size-32" />
          </div>

          <div className="relative space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">
                 <Zap className="size-3" />
                 Control Center
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-on-surface">Project Operations</h2>
              <p className="text-sm font-medium text-on-surface-variant/70 max-w-md">
                Directly manage the lifecycle of this course node. Transitions from draft to live are instant.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <OpAction 
                href={firstPage?.builderPath ?? `/admin/studio/sites/${data.project.id}/pages/new`} 
                label="Open Builder" 
                icon={<LayoutGrid className="size-4" />} 
                primary 
              />
              <OpAction 
                href={`/admin/studio/sites/${data.project.id}/pages/new`} 
                label="New Concept" 
                icon={<FilePlus2 className="size-4" />} 
              />
              <OpAction 
                href={data.project.previewPath} 
                label="Preview Live" 
                icon={<Eye className="size-4" />} 
              />
              <OpAction 
                href="/admin/governance/review" 
                label="Review Queue" 
                icon={<RadioTower className="size-4" />} 
              />
            </div>
          </div>

          <div className="mt-10 p-6 rounded-[2rem] bg-surface-container-high/50 border border-outline-variant/20 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                   <Sparkles className="size-5" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Auto-Optimization</p>
                   <p className="text-xs font-bold text-on-surface">BKT Engine Active</p>
                </div>
             </div>
             <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <PageList title="Recent Concepts" pages={data.recentPages} emptyLabel="No concepts yet" icon={<LayoutGrid className="size-4" />} />
        <PageList title="Publication Queue" pages={data.publishQueue} emptyLabel="No draft concepts waiting" icon={<RadioTower className="size-4" />} color="amber" />
      </div>
    </div>
  )
}

function PageList({
  title,
  pages,
  emptyLabel,
  icon,
  color = "primary"
}: {
  title: string
  pages: AwaitedSiteProjectData["recentPages"]
  emptyLabel: string
  icon: React.ReactNode
  color?: "primary" | "amber"
}) {
  return (
    <section className="relative overflow-hidden rounded-[3rem] border border-outline-variant/30 bg-surface p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={cn(
            "size-8 rounded-lg flex items-center justify-center",
            color === "amber" ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
          )}>
             {icon}
          </div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant/60">{title}</h2>
        </div>
        <span className="rounded-full bg-surface-container-high px-4 py-1 text-[10px] font-black text-on-surface-variant border border-outline-variant/30">
          {pages.length}
        </span>
      </div>

      <div className="space-y-3">
        {pages.length === 0 ? (
          <div className="py-12 text-center rounded-[2rem] bg-surface-container-low/30 border border-dashed border-outline-variant/40">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/30 italic">
              {emptyLabel}
            </p>
          </div>
        ) : (
          pages.map((page) => (
            <Link
              key={page.id}
              href={page.builderPath}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-outline-variant/30 bg-surface p-4 transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="min-w-0 flex items-center gap-4">
                <div className="size-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant/40 group-hover:text-primary/60 group-hover:bg-primary/10 transition-colors">
                   <LayoutGrid className="size-5" />
                </div>
                <div>
                  <p className="truncate text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{page.title}</p>
                  <p className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
                    {page.groupTitle} • {page.blockCount} Blocks
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                  page.status === "PUBLISHED" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                )}>
                  {page.status}
                </span>
                <div className="size-8 rounded-lg border border-outline-variant/40 flex items-center justify-center text-on-surface-variant/30 group-hover:text-primary group-hover:border-primary/30 transition-all">
                   <ArrowUpRight className="size-4" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  )
}

function OpAction({ href, label, icon, primary = false }: { href: string, label: string, icon: React.ReactNode, primary?: boolean }) {
  return (
    <Button asChild className={cn(
      "h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
      primary 
        ? "bg-primary text-on-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]" 
        : "bg-surface border border-outline-variant/50 text-on-surface hover:bg-surface-container-high hover:border-primary/30"
    )}>
      <Link href={href}>
        {icon}
        <span className="ml-2">{label}</span>
      </Link>
    </Button>
  )
}
