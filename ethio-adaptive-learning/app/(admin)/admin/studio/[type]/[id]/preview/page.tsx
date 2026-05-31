import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, Monitor, Layers3, LayoutGrid } from "lucide-react"

import { ContentBlocksRenderer } from "@/components/content/content-blocks-renderer"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth-server"
import { resolveCmsContentType } from "@/lib/cms"
import { getStudioContentPreview } from "@/lib/studio/site-builder"
import { cn } from "@/lib/utils"

type StudioPreviewPageProps = {
  params: Promise<{
    type: string
    id: string
  }>
}

export default async function StudioPreviewPage({ params }: StudioPreviewPageProps) {
  await requireRole(["ADMIN", "COURSE_WRITER"])
  const { type, id } = await params
  const definition = resolveCmsContentType(type)

  if (!definition) notFound()

  const preview = await getStudioContentPreview(definition.key, id) as any
  if (!preview) notFound()

  const returnTo =
    definition.key === "concept"
      ? `/admin/studio/editor/concept/${id}`
      : `/admin/studio/${definition.key}/${id}`

  return (
    <div className="min-h-full bg-surface-container-lowest">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-outline-variant bg-surface/90 px-6 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-4">
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href={returnTo}>
              <ArrowLeft className="size-4" />
              Exit Preview
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
              <Monitor className="size-3.5" />
              Draft Preview
            </p>
            <h1 className="truncate text-sm font-black text-on-surface">{preview.item.title}</h1>
          </div>
        </div>

        {preview.livePath ? (
          <Button asChild size="sm" className="rounded-xl">
            <Link href={preview.livePath} target="_blank">
              <ExternalLink className="size-4" />
              View Live
            </Link>
          </Button>
        ) : null}
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <article className="overflow-hidden rounded-[2rem] border border-outline-variant bg-surface shadow-xl">
          <div className="border-b border-outline-variant p-8 lg:p-10">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              {definition.label}
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-on-surface">{preview.item.title}</h2>
            {typeof preview.item.data.description === "string" && preview.item.data.description ? (
              <p className="mt-4 max-w-3xl text-base leading-7 text-on-surface-variant">
                {preview.item.data.description}
              </p>
            ) : null}
          </div>

          <div className="p-6 lg:p-8">
            {definition.key === "course" && preview.hierarchy ? (
               <div className="space-y-10">
                  <div className="flex items-center gap-4">
                     <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <Layers3 className="size-5" />
                     </div>
                     <h3 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant">Curriculum Map</h3>
                  </div>

                  <div className="space-y-6">
                    {preview.hierarchy.units.map((unit: any) => (
                      <div key={unit.id} className="relative pl-8">
                        {/* Vertical line for unit hierarchy */}
                        <div className="absolute left-4 top-5 bottom-0 w-px bg-outline-variant/60" />
                        
                        <div className="flex items-center gap-4 mb-4">
                           <div className="absolute left-0 top-1.5 size-8 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center text-xs font-black z-10 shadow-sm">
                              {unit.order}
                           </div>
                           <h4 className="text-lg font-black tracking-tight text-on-surface ml-4">{unit.title}</h4>
                           <span className="px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/70">
                              {unit.concepts.length} Concepts
                           </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                           {unit.concepts.map((concept: any) => (
                              <div key={concept.id} className="group relative flex items-center gap-4 p-4 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest/50 hover:bg-primary/5 hover:border-primary/30 transition-all">
                                 <div className="size-8 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant/40 group-hover:text-primary/60 transition-colors">
                                    <LayoutGrid className="size-4" />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">{concept.title}</p>
                                    <span className={cn(
                                       "text-[8px] font-black uppercase tracking-widest",
                                       concept.status === 'PUBLISHED' ? 'text-emerald-500' : 'text-amber-500'
                                    )}>
                                       {concept.status}
                                    </span>
                                 </div>
                              </div>
                           ))}
                           {unit.concepts.length === 0 && (
                              <div className="col-span-full py-4 text-center rounded-xl border border-dashed border-outline-variant/40">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/30 italic">No concepts in this unit</p>
                              </div>
                           )}
                        </div>
                      </div>
                    ))}
                    {preview.hierarchy.units.length === 0 && (
                       <div className="py-20 text-center rounded-[2.5rem] bg-surface-container-low/30 border-2 border-dashed border-outline-variant/40">
                          <p className="text-xs font-black uppercase tracking-[0.3em] text-on-surface-variant/30 italic">No units defined for this course</p>
                       </div>
                    )}
                  </div>
               </div>
            ) : definition.key === "unit" && preview.hierarchy ? (
               <div className="space-y-10">
                  <div className="flex items-center gap-4">
                     <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <Layers3 className="size-5" />
                     </div>
                     <h3 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant">Unit Map</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {preview.hierarchy.concepts.map((concept: any) => (
                        <div key={concept.id} className="group relative flex items-center gap-4 p-5 rounded-[2rem] border border-outline-variant/40 bg-surface-container-lowest/50 hover:bg-primary/5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all">
                           <div className="size-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant/40 group-hover:text-primary/60 transition-colors shadow-inner">
                              <LayoutGrid className="size-6" />
                           </div>
                           <div className="min-w-0">
                              <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">{concept.title}</p>
                              <span className={cn(
                                 "text-[10px] font-black uppercase tracking-widest",
                                 concept.status === 'PUBLISHED' ? 'text-emerald-500' : 'text-amber-500'
                              )}>
                                 {concept.status}
                              </span>
                           </div>
                        </div>
                     ))}
                     {preview.hierarchy.concepts.length === 0 && (
                        <div className="col-span-full py-20 text-center rounded-[2.5rem] bg-surface-container-low/30 border-2 border-dashed border-outline-variant/40">
                           <p className="text-xs font-black uppercase tracking-[0.3em] text-on-surface-variant/30 italic">No concepts in this unit</p>
                        </div>
                     )}
                  </div>
               </div>
            ) : definition.key === "concept" && preview.graphContext ? (
               <div className="space-y-12">
                  {/* Content Blocks Section */}
                  <div className="space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                           <LayoutGrid className="size-5" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant">Lesson Blocks</h3>
                     </div>
                     {preview.blocks.length ? (
                        <ContentBlocksRenderer
                           assets={preview.assets}
                           blocks={preview.blocks}
                           questions={preview.questions}
                           snippets={preview.snippets}
                        />
                     ) : (
                        <div className="rounded-3xl border-2 border-dashed border-outline-variant bg-surface-container-low p-10 text-center">
                           <p className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
                              This concept has no content blocks yet.
                           </p>
                        </div>
                     )}
                  </div>

                  {/* Graph Context Section */}
                  <div className="pt-12 border-t border-outline-variant/60 space-y-10">
                     <div className="flex items-center gap-4">
                        <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                           <Layers3 className="size-5" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant">Graph Context</h3>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Prerequisites */}
                        <div className="space-y-6">
                           <div className="flex items-center gap-3 px-1">
                              <div className="size-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                              <h4 className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant/60">Prerequisites</h4>
                           </div>
                           <div className="space-y-3">
                              {preview.graphContext.prerequisites.map((p: any) => (
                                 <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest/50 shadow-sm">
                                    <span className="text-xs font-bold text-on-surface truncate pr-4">{p.title}</span>
                                    <span className={cn(
                                       "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                       p.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                    )}>{p.status}</span>
                                 </div>
                              ))}
                              {preview.graphContext.prerequisites.length === 0 && (
                                 <div className="py-8 text-center rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low/20">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/30 italic">No prerequisites defined</p>
                                 </div>
                              )}
                           </div>
                        </div>

                        {/* Dependents */}
                        <div className="space-y-6">
                           <div className="flex items-center gap-3 px-1">
                              <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                              <h4 className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant/60">Unlocks (Dependents)</h4>
                           </div>
                           <div className="space-y-3">
                              {preview.graphContext.dependents.map((d: any) => (
                                 <div key={d.id} className="flex items-center justify-between p-4 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest/50 shadow-sm">
                                    <span className="text-xs font-bold text-on-surface truncate pr-4">{d.title}</span>
                                    <span className={cn(
                                       "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                       d.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                    )}>{d.status}</span>
                                 </div>
                              ))}
                              {preview.graphContext.dependents.length === 0 && (
                                 <div className="py-8 text-center rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low/20">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/30 italic">No dependent concepts</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            ) : preview.blocks.length ? (
              <ContentBlocksRenderer
                assets={preview.assets}
                blocks={preview.blocks}
                questions={preview.questions}
                snippets={preview.snippets}
              />
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-outline-variant bg-surface-container-low p-10 text-center">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
                  {definition.key === 'course' ? 'This course has no curriculum structure yet.' : 'This draft has no concept blocks yet.'}
                </p>
              </div>
            )}
          </div>
        </article>
      </main>
    </div>
  )
}
