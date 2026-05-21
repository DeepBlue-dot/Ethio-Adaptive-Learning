import { requireRole } from "@/lib/auth"
import { 
  Database, 
  BarChart3, 
  Library, 
  Gavel, 
  PlusCircle, 
  ArrowRight,
  Sparkles,
  Zap,
  LayoutGrid
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

import { WorkspaceHeader } from "@/components/admin/studio/layout/workspace-header"
import { WorkspaceShell } from "@/components/admin/studio/layout/workspace-shell"

export default async function AdminPortalPage() {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])

  return (
    <WorkspaceShell>
      <WorkspaceHeader 
        title="Portal" 
        username={session.user.username} 
        role={session.user.role}
        breadcrumbs={[{ label: "Home" }]}
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-surface/30 text-on-surface">
        <div className="max-w-6xl mx-auto space-y-10 md:space-y-16 py-4 md:py-10">
          {/* 1. Hero / Welcome */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-outline-variant pb-10 md:pb-12 text-on-surface">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                 <Sparkles className="size-3" />
                 Studio Portal
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight leading-tight">
                Welcome back, <span className="text-primary">{session.user.username}</span>.
              </h1>
              <p className="text-on-surface-variant text-base md:text-lg max-w-2xl leading-relaxed">
                EthioPrep Studio is your control center for building the next generation of adaptive learning in Ethiopia.
              </p>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 self-start md:self-end">
               <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest">System Status</p>
                  <p className="text-xs md:text-sm font-bold text-emerald-600">Operational</p>
               </div>
               <div className="size-10 md:size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                  <div className="size-2.5 md:size-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               </div>
            </div>
          </section>

          {/* 2. Core Modules Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <ModuleCard 
              title="Curriculum"
              description="Structure knowledge nodes, units, and courses."
              href="/admin/studio"
              icon={<Database className="size-6" />}
              color="bg-primary"
              stats="Manage Nodes"
            />
            <ModuleCard 
              title="Intelligence"
              description="Analyze student performance and decay metrics."
              href="/admin/dashboard"
              icon={<BarChart3 className="size-6" />}
              color="bg-amber-500"
              stats="View Pulse"
            />
            <ModuleCard 
              title="Asset Library"
              description="Manage instructional media and text snippets."
              href="/admin/assets"
              icon={<Library className="size-6" />}
              color="bg-teal-600"
              stats="Browse Media"
            />
            <ModuleCard 
              title="Governance"
              description="Audit logs, user roles, and system health."
              href="/admin/governance"
              icon={<Gavel className="size-6" />}
              color="bg-slate-600"
              stats="Audit Logs"
            />
          </section>

          {/* 3. Quick Actions & Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <LayoutGrid className="size-5 text-primary" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <ActionLink 
                   href="/admin/studio/course/new" 
                   title="Create New Course" 
                   description="Add a top-level curriculum container." 
                 />
                 <ActionLink 
                   href="/admin/studio/question/new" 
                   title="Write Assessment" 
                   description="Author a new adaptive question node." 
                 />
                 <ActionLink 
                   href="/admin/resources" 
                   title="Upload Media" 
                   description="Add images or video embeds." 
                 />
                 <ActionLink 
                   href="/admin/platform" 
                   title="Manage Team" 
                   description="Configure author permissions." 
                 />
              </div>
            </div>

            {/* Integration Card */}
            <div className="bg-surface-container-low border border-outline-variant rounded-[2rem] p-6 md:p-8 flex flex-col justify-between group cursor-pointer hover:border-primary/30 transition-all shadow-sm">
               <div>
                  <div className="size-12 rounded-2xl bg-on-tertiary-fixed-variant flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                     <Zap className="size-6 fill-current" />
                  </div>
                  <h4 className="text-xl font-bold text-on-surface">Adaptive Engine</h4>
                  <p className="text-sm text-on-surface-variant mt-2 leading-relaxed opacity-80">
                     The BKT engine is currently processing real-time interactions. All curriculum updates will be synchronized across the graph automatically.
                  </p>
               </div>
               <Link href="/admin/dashboard" className="mt-8 flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                  Engine Pulse <ArrowRight className="size-3" />
               </Link>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  )
}

function ModuleCard({ title, description, href, icon, color, stats }: { title: string, description: string, href: string, icon: React.ReactNode, color: string, stats: string }) {
  return (
    <Link href={href} className="bg-surface border border-outline-variant rounded-[2rem] p-6 group hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className={cn("size-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg transition-all group-hover:scale-110", color)}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-on-surface-variant mt-2 leading-relaxed opacity-70">{description}</p>
      </div>
      <div className="mt-8 pt-4 border-t border-outline-variant/30 flex items-center justify-between">
         <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{stats}</span>
         <ArrowRight className="size-4 text-on-surface-variant group-hover:translate-x-1 transition-transform group-hover:text-primary" />
      </div>
    </Link>
  )
}

function ActionLink({ href, title, description }: { href: string, title: string, description: string }) {
  return (
    <Link href={href} className="flex items-center justify-between p-5 bg-surface border border-outline-variant/50 rounded-2xl hover:bg-surface-container-high transition-colors group">
       <div className="min-w-0">
          <p className="text-sm font-bold text-on-surface truncate">{title}</p>
          <p className="text-[10px] text-on-surface-variant opacity-60 truncate uppercase tracking-tighter">{description}</p>
       </div>
       <PlusCircle className="size-5 text-on-surface-variant opacity-30 group-hover:text-primary group-hover:opacity-100 transition-all" />
    </Link>
  )
}
