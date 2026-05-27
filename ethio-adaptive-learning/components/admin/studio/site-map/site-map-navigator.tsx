"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronDown,
  ChevronRight,
  FilePlus2,
  Globe2,
  LayoutPanelLeft,
  Monitor,
  MoreVertical,
  Search,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"
import type { SiteMapProject } from "@/lib/studio/site-builder"

export function SiteMapNavigator({ projects }: { projects: SiteMapProject[] }) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedSiteId, setSelectedSiteId] = React.useState(projects[0]?.id ?? "")
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    () => new Set(projects.flatMap((project) => project.groups.map((group) => group.id)))
  )

  React.useEffect(() => {
    const activeSite = projects.find((project) => pathname.includes(`/admin/studio/sites/${project.id}`))
    if (activeSite) setSelectedSiteId(activeSite.id)
  }, [pathname, projects])

  const selectedSite = projects.find((project) => project.id === selectedSiteId) ?? projects[0]

  const filteredGroups = React.useMemo(() => {
    if (!selectedSite) return []
    const query = searchQuery.trim().toLowerCase()
    if (!query) return selectedSite.groups

    return selectedSite.groups
      .map((group) => {
        const pages = group.pages.filter((page) =>
          [page.title, page.slug, page.status].some((value) => value.toLowerCase().includes(query))
        )

        if (group.title.toLowerCase().includes(query) || pages.length > 0) {
          return { ...group, pages }
        }

        return null
      })
      .filter(Boolean) as typeof selectedSite.groups
  }, [selectedSite, searchQuery])

  React.useEffect(() => {
    if (!searchQuery) return
    setExpandedGroups(new Set(filteredGroups.map((group) => group.id)))
  }, [filteredGroups, searchQuery])

  const toggleGroup = (id: string) => {
    setExpandedGroups((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-outline-variant/30 bg-surface-container-lowest/70">
      <div className="relative z-10 shrink-0 space-y-5 border-b border-outline-variant/30 bg-surface-container-low/70 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-on-surface-variant/50">
              Course Builder
            </p>
            <h2 className="mt-1 truncate text-lg font-black tracking-tight text-on-surface">
              Curriculum Map
            </h2>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 text-primary">
            <LayoutPanelLeft className="size-5" />
          </div>
        </div>

        <label className="block">
          <span className="sr-only">Select course</span>
          <div className="relative">
            <Globe2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
            <select
              aria-label="Select course"
              value={selectedSite?.id ?? ""}
              onChange={(event) => setSelectedSiteId(event.target.value)}
              className="h-11 w-full appearance-none rounded-2xl border border-outline-variant bg-surface px-9 pr-10 text-xs font-black uppercase tracking-tight text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
          </div>
        </label>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant/40" />
          <input
            aria-label="Search concepts"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search concepts..."
            className="h-11 w-full rounded-2xl border border-outline-variant/50 bg-surface pl-10 pr-4 text-sm font-semibold text-on-surface outline-none transition placeholder:text-on-surface-variant/35 focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>

        {selectedSite ? (
          <Link
            href={`/admin/studio/sites/${selectedSite.id}/pages/new`}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 text-[10px] font-black uppercase tracking-[0.2em] text-primary transition hover:border-primary/60 hover:bg-primary/10"
          >
            <FilePlus2 className="size-4" />
            New Concept
          </Link>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-24 custom-scrollbar">
        {!selectedSite ? (
          <EmptyState label="No courses" />
        ) : filteredGroups.length === 0 ? (
          <EmptyState label="No concepts found" />
        ) : (
          <div className="space-y-3">
            <Link
              href={`/admin/studio/sites/${selectedSite.id}`}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3 transition",
                pathname === `/admin/studio/sites/${selectedSite.id}`
                  ? "border-primary/30 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "border-outline-variant/30 bg-surface hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              <Monitor className="size-4 shrink-0" />
              <span className="truncate text-xs font-black uppercase tracking-tight">Course Overview</span>
            </Link>

            {filteredGroups.map((group) => (
              <div key={group.id} className="space-y-1">
                <button
                  type="button"
                  aria-expanded={expandedGroups.has(group.id)}
                  aria-controls={`site-map-group-${group.id}`}
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left transition hover:border-outline-variant/40 hover:bg-surface-container-high"
                >
                  <ChevronRight
                    className={cn(
                      "size-3.5 shrink-0 text-on-surface-variant/50 transition-transform",
                      expandedGroups.has(group.id) && "rotate-90"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-on-surface-variant/40">
                      Unit {group.order}
                    </p>
                    <p className="truncate text-xs font-black text-on-surface">{group.title}</p>
                  </div>
                  <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[9px] font-black text-on-surface-variant">
                    {group.pages.length}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {expandedGroups.has(group.id) ? (
                    <motion.div
                      id={`site-map-group-${group.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pl-6"
                    >
                      <div className="space-y-1 border-l border-outline-variant/30 pl-3">
                        {group.pages.map((page) => {
                          const isActive = pathname === page.builderPath
                          return (
                            <Link
                              key={page.id}
                              href={page.builderPath}
                              className={cn(
                                "group flex items-center gap-3 rounded-xl border p-2.5 transition",
                                isActive
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : "border-transparent text-on-surface-variant hover:border-outline-variant/40 hover:bg-surface"
                              )}
                            >
                              <span
                                className={cn(
                                  "size-2 shrink-0 rounded-full",
                                  page.status === "PUBLISHED" ? "bg-emerald-500" : "bg-amber-500"
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold">{page.title}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-45">
                                  {page.blockCount} blocks
                                </p>
                              </div>
                              <MoreVertical className="size-3.5 opacity-0 transition group-hover:opacity-50" />
                            </Link>
                          )
                        })}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-20 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-on-surface-variant/35">
        {label}
      </p>
    </div>
  )
}
