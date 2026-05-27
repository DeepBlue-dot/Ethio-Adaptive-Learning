"use client"

import Link from "next/link"
import { ArrowUpRight, Eye, FilePlus2, RadioTower } from "lucide-react"

import type { AwaitedSiteProjectData } from "./types"
import { SiteProjectCard } from "./site-project-dashboard"

export function SiteProjectOverview({ data }: { data: AwaitedSiteProjectData }) {
  const firstPage = data.recentPages[0]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SiteProjectCard project={data.project} />

        <section className="rounded-[2rem] border border-outline-variant bg-surface p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Quick Actions</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-on-surface">Project control panel</h2>
            </div>
            <RadioTower className="size-6 text-primary" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Action href={firstPage?.builderPath ?? `/admin/studio/sites/${data.project.id}/pages/new`} label="Open Builder" icon={<ArrowUpRight className="size-4" />} primary />
            <Action href={`/admin/studio/sites/${data.project.id}/pages/new`} label="New Concept" icon={<FilePlus2 className="size-4" />} />
            <Action href={data.project.previewPath} label="Preview Course" icon={<Eye className="size-4" />} />
            <Action href="/admin/governance/review" label="Review Queue" icon={<RadioTower className="size-4" />} />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PageList title="Recent Concepts" pages={data.recentPages} emptyLabel="No concepts yet" />
        <PageList title="Publication Queue" pages={data.publishQueue} emptyLabel="No draft concepts waiting" />
      </div>
    </div>
  )
}

function PageList({
  title,
  pages,
  emptyLabel,
}: {
  title: string
  pages: AwaitedSiteProjectData["recentPages"]
  emptyLabel: string
}) {
  return (
    <section className="rounded-[2rem] border border-outline-variant bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xs font-black uppercase tracking-[0.25em] text-on-surface-variant/60">{title}</h2>
        <span className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-black text-on-surface-variant">
          {pages.length}
        </span>
      </div>

      <div className="mt-5 space-y-2">
        {pages.length === 0 ? (
          <p className="rounded-2xl bg-surface-container-low p-6 text-center text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
            {emptyLabel}
          </p>
        ) : (
          pages.map((page) => (
            <Link
              key={page.id}
              href={page.builderPath}
              className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low/40 p-4 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-on-surface">{page.title}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/45">
                  {page.groupTitle} / {page.blockCount} blocks
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/55">
                  {page.status}
                </span>
                <ArrowUpRight className="size-4 text-primary" />
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  )
}

function Action({ href, label, icon, primary = false }: { href: string; label: string; icon: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
          : "flex h-12 items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface text-xs font-black uppercase tracking-widest text-on-surface transition hover:border-primary/30 hover:text-primary"
      }
    >
      {icon}
      {label}
    </Link>
  )
}
