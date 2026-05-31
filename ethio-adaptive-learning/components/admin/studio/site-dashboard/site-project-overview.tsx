"use client"

import Link from "next/link"
import { 
  ArrowUpRight, 
  Eye, 
  FilePlus2, 
  RadioTower, 
  Sparkles, 
  LayoutGrid, 
  Target, 
  Zap, 
  Settings2, 
  Trash2, 
  Layers3,
  PlusCircle,
  ChevronRight,
  Monitor
} from "lucide-react"

import type { AwaitedSiteProjectData } from "./types"
import { SiteProjectCard } from "./site-project-dashboard"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { deleteCmsItem } from "@/app/(admin)/admin/studio/actions"

export function SiteProjectOverview({ data }: { data: AwaitedSiteProjectData }) {
  const firstPage = data.recentPages[0]

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Link href="/admin/studio" className="size-10 rounded-xl border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all">
               <ChevronRight className="size-5 rotate-180" />
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-on-surface">Course Designer</h1>
         </div>
         
         <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="rounded-xl h-10 border-outline-variant gap-2 text-[10px] font-black uppercase tracking-widest">
               <Link href={`/admin/studio/course/${data.project.id}/preview`} target="_blank">
                  <Monitor className="size-4" />
                  Preview Hierarchy
               </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-xl h-10 border-outline-variant gap-2 text-[10px] font-black uppercase tracking-widest">
               <Link href={`/admin/studio/editor/course/${data.project.id}?returnTo=/admin/studio/sites/${data.project.id}`}>
                  <Settings2 className="size-4" />
                  Course Settings
               </Link>
            </Button>
            <form action={deleteCmsItem} onSubmit={(e) => {
               if (!confirm("Are you sure you want to delete this course? This will delete all units and concepts within it.")) {
                  e.preventDefault();
               }
            }}>
               <input type="hidden" name="contentType" value="course" />
               <input type="hidden" name="id" value={data.project.id} />
               <input type="hidden" name="returnTo" value="/admin/studio" />
               <Button type="submit" variant="ghost" size="sm" className="rounded-xl h-10 text-rose-500 hover:bg-rose-50 gap-2 text-[10px] font-black uppercase tracking-widest">
                  <Trash2 className="size-4" />
                  Delete Course
               </Button>
            </form>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_1fr]">
        <SiteProjectCard project={data.project} />

        <section className="relative overflow-hidden rounded-[3rem] border border-outline-variant/30 bg-surface-container-lowest/40 backdrop-blur-xl p-8 lg:p-10 shadow-2xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
             <Target className="size-32" />
          </div>

          <div className="relative space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">
                 <Zap className="size-3" />
                 Quick Actions
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-on-surface">Management</h2>
              <p className="text-sm font-medium text-on-surface-variant/70 max-w-md">
                Directly add units or jump to the latest concept you were working on.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <OpAction 
                href={firstPage?.builderPath ?? `/admin/studio/sites/${data.project.id}/pages/new`} 
                label="Continue Editing" 
                icon={<LayoutGrid className="size-4" />} 
                primary 
              />
              <OpAction 
                href={`/admin/studio/unit/new?courseId=${data.project.id}&returnTo=/admin/studio/sites/${data.project.id}`} 
                label="Add New Unit" 
                icon={<PlusCircle className="size-4" />} 
              />
              <OpAction 
                href={data.project.previewPath} 
                label="View Public Page" 
                icon={<Eye className="size-4" />} 
              />
              <OpAction 
                href="/admin/studio/explorer" 
                label="Graph Explorer" 
                icon={<Layers3 className="size-4" />} 
              />
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-8">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Layers3 className="size-5" />
               </div>
               <h2 className="text-xl font-black tracking-tight text-on-surface">Curriculum Hierarchy</h2>
            </div>
            <Button asChild size="sm" className="rounded-xl h-9 bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest hover:bg-primary/20">
               <Link href={`/admin/studio/unit/new?courseId=${data.project.id}&returnTo=/admin/studio/sites/${data.project.id}`}>
                  <PlusCircle className="size-3.5 mr-2" />
                  Add Unit
               </Link>
            </Button>
         </div>

         <div className="space-y-6">
            {data.siteMap.groups.map((unit) => (
               <div key={unit.id} className="relative group/unit">
                  <div className="flex items-center justify-between p-5 rounded-[2rem] bg-surface border border-outline-variant/60 shadow-sm group-hover/unit:border-primary/30 transition-all">
                     <div className="flex items-center gap-5">
                        <div className="size-12 rounded-2xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-sm font-black shadow-inner group-hover/unit:bg-primary/5 group-hover/unit:text-primary transition-colors">
                           {unit.order}
                        </div>
                        <div>
                           <h3 className="text-lg font-black tracking-tight text-on-surface group-hover/unit:text-primary transition-colors">{unit.title}</h3>
                           <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mt-0.5">
                              {unit.pages.length} Concepts • {unit.status}
                           </p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="sm" className="rounded-xl h-9 px-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container">
                           <Link href={`/admin/studio/editor/unit/${unit.id}?returnTo=/admin/studio/sites/${data.project.id}`}>Edit Unit</Link>
                        </Button>
                        <form action={deleteCmsItem} onSubmit={(e) => {
                           if (!confirm("Are you sure you want to delete this unit? All concepts within it will also be deleted.")) {
                              e.preventDefault();
                           }
                        }}>
                           <input type="hidden" name="contentType" value="unit" />
                           <input type="hidden" name="id" value={unit.id} />
                           <input type="hidden" name="returnTo" value={`/admin/studio/sites/${data.project.id}`} />
                           <Button type="submit" variant="ghost" size="sm" className="rounded-xl h-9 px-4 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50">
                              Delete
                           </Button>
                        </form>
                        <Button asChild size="sm" className="rounded-xl h-9 px-4 bg-primary/5 text-primary border border-primary/10 text-[10px] font-black uppercase tracking-widest hover:bg-primary/10">
                           <Link href={`/admin/studio/sites/${data.project.id}/pages/new?unitId=${unit.id}&returnTo=/admin/studio/sites/${data.project.id}`}>
                              Add Concept
                           </Link>
                        </Button>
                     </div>
                  </div>

                  {unit.pages.length > 0 && (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pl-8 border-l-2 border-outline-variant/30 ml-6">
                        {unit.pages.map((concept) => (
                           <Link
                              key={concept.id}
                              href={concept.builderPath}
                              className="group/concept flex items-center justify-between p-4 rounded-2xl border border-outline-variant/40 bg-surface/50 hover:bg-primary/5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all"
                           >
                              <div className="min-w-0 flex items-center gap-3">
                                 <div className="size-8 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant/40 group-hover/concept:text-primary/60 transition-colors">
                                    <LayoutGrid className="size-4" />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-xs font-bold text-on-surface group-hover/concept:text-primary transition-colors truncate">{concept.title}</p>
                                    <span className={cn(
                                       "text-[8px] font-black uppercase tracking-widest",
                                       concept.status === 'PUBLISHED' ? 'text-emerald-500' : 'text-amber-500'
                                    )}>
                                       {concept.status}
                                    </span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 <ArrowUpRight className="size-4 text-on-surface-variant/20 group-hover/concept:text-primary group-hover/concept:translate-x-0.5 group-hover/concept:-translate-y-0.5 transition-all" />
                                 <form action={deleteCmsItem} onSubmit={(e) => {
                                    e.stopPropagation();
                                    if (!confirm("Are you sure you want to delete this concept?")) {
                                       e.preventDefault();
                                    }
                                 }}>
                                    <input type="hidden" name="contentType" value="concept" />
                                    <input type="hidden" name="id" value={concept.id} />
                                    <input type="hidden" name="returnTo" value={`/admin/studio/sites/${data.project.id}`} />
                                    <Button type="submit" variant="ghost" size="sm" className="size-8 p-0 rounded-lg text-rose-500/40 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover/concept:opacity-100 transition-all">
                                       <Trash2 className="size-3.5" />
                                    </Button>
                                 </form>
                              </div>
                           </Link>
                        ))}
                     </div>
                  )}
               </div>
            ))}

            {data.siteMap.groups.length === 0 && (
               <div className="py-24 text-center rounded-[3rem] border-2 border-dashed border-outline-variant/30 bg-surface-container-low/20">
                  <div className="size-20 rounded-full bg-surface-container border border-outline-variant/40 flex items-center justify-center mx-auto mb-6">
                     <PlusCircle className="size-10 text-on-surface-variant/20" />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-2">Build your curriculum</h3>
                  <p className="text-sm text-on-surface-variant/60 mb-8 max-w-xs mx-auto">
                     This course is currently empty. Start by adding your first unit.
                  </p>
                  <Button asChild className="rounded-2xl h-12 px-8 bg-primary text-on-primary shadow-xl shadow-primary/20">
                     <Link href={`/admin/studio/unit/new?courseId=${data.project.id}`}>
                        <PlusCircle className="size-4 mr-2" />
                        Create First Unit
                     </Link>
                  </Button>
               </div>
            )}
         </div>
      </div>
    </div>
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
