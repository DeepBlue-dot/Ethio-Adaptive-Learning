import { 
  BatteryWarning, 
  ChevronRight, 
  CircleArrowOutUpRight, 
  Minus, 
  Plus, 
  Sparkles, 
  Zap 
} from "lucide-react"
import Image from "next/image"

import { getStudentDashboardSummary } from "@/lib/assessment"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

export default async function StudentDashboardPage() {
  const session = await requireRole("STUDENT")

  const [profile, summary] = await Promise.all([
    prisma.userProfile.findUnique({
      where: {
        userId: session.user.id,
      },
    }),
    getStudentDashboardSummary(session.user.id),
  ])

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Hero Section */}
      <section>
        <h1 className="text-3xl md:text-4xl font-bold text-on-surface mb-2">
          Welcome back, {session.user.username.split(' ')[0]}.
        </h1>
        <p className="text-lg text-on-surface-variant flex items-center gap-2">
          You are <strong className="text-primary">{summary.dueReviewCount + 1} concepts</strong> away from Mathematics Mastery. Let&apos;s close the gap.
        </p>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Main Workspace: Knowledge Graph */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/20 overflow-hidden relative min-h-[500px] flex flex-col">
            <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface/50 backdrop-blur-sm z-10">
              <h2 className="text-xl font-bold text-on-surface">Mathematics Knowledge Graph</h2>
              <div className="flex gap-2">
                <button className="bg-surface text-on-surface-variant px-3 py-1.5 rounded-xl text-xs font-bold border border-outline-variant/30 hover:bg-surface-container-high transition-colors">
                  Explore
                </button>
                <button className="bg-primary text-on-primary px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-opacity">
                  Progression
                </button>
              </div>
            </div>
            
            {/* Graph Visualization Area */}
            <div className="flex-1 relative bg-inverse-surface overflow-hidden group">
              {/* Placeholder image for graph - using a high-quality academic themed one */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-40 mix-blend-luminosity transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
              
              {/* Overlay UI Elements */}
              <div className="absolute top-6 left-6 glass-panel p-4 rounded-2xl shadow-xl">
                <div className="flex items-center gap-2 text-on-surface mb-1">
                  <div className="w-3 h-3 rounded-full bg-success-emerald shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" />
                  <span className="text-sm font-bold tracking-tight">Progression Fringe</span>
                </div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest">Focus areas for today</p>
              </div>

              <div className="absolute bottom-6 right-6 flex gap-3">
                <button className="glass-panel p-3 rounded-full hover:bg-white transition-colors shadow-lg">
                  <Plus className="size-5 text-on-surface" />
                </button>
                <button className="glass-panel p-3 rounded-full hover:bg-white transition-colors shadow-lg">
                  <Minus className="size-5 text-on-surface" />
                </button>
              </div>

              {/* Central Floating Nodes (Simulating a real graph) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative size-64">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 p-4 glass-panel rounded-2xl border-teal-500/50 shadow-2xl pointer-events-auto cursor-pointer hover:scale-110 transition-transform">
                      <span className="text-xs font-bold text-teal-700">Limits</span>
                   </div>
                   <div className="absolute bottom-10 left-0 p-4 glass-panel rounded-2xl border-primary/50 shadow-2xl pointer-events-auto cursor-pointer hover:scale-110 transition-transform">
                      <span className="text-xs font-bold text-primary">Derivatives</span>
                   </div>
                   <div className="absolute bottom-10 right-0 p-4 glass-panel rounded-2xl border-warning-gold/50 shadow-2xl pointer-events-auto cursor-pointer hover:scale-110 transition-transform">
                      <span className="text-xs font-bold text-warning-gold font-bold">Integrals</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Retention & Stats */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Retention Hunt Widget */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-error-rose">
                <BatteryWarning className="size-6" />
                <h3 className="text-xl font-bold text-on-surface">Retention Hunt</h3>
              </div>
              <span className="text-[10px] font-bold bg-error-container text-on-error-container px-2 py-1 rounded-full uppercase tracking-widest">
                Action Needed
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              These concepts are decaying from your memory. Review them to recharge your mastery battery.
            </p>

            <div className="space-y-4">
              <RetentionItem 
                title="Integrals" 
                category="Calculus II" 
                percentage={20} 
                status="critical" 
              />
              <RetentionItem 
                title="Trigonometric Identities" 
                category="Pre-Calculus" 
                percentage={45} 
                status="warning" 
              />
            </div>

            <button className="w-full mt-8 bg-primary text-on-primary text-sm font-bold py-4 rounded-2xl border-b-4 border-on-primary-fixed-variant active:border-b-0 active:translate-y-[4px] transition-all flex items-center justify-center gap-2 group">
              <Zap className="size-4 fill-current group-hover:animate-bounce" />
              Start Review Session
            </button>
          </div>

          {/* Daily Goal Card */}
          <div className="bg-gradient-to-br from-primary-container/20 to-surface-container-lowest rounded-3xl shadow-sm border border-primary/10 p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="size-4 text-primary" />
              <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">Daily Streak</h3>
            </div>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-black text-on-surface leading-none">{profile?.dailyStreak ?? 12}</span>
              <span className="text-sm font-bold text-on-surface-variant pb-1">Days</span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-2 mb-3">
              <div 
                className="bg-success-emerald h-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
                style={{ width: "80%" }} 
              />
            </div>
            <p className="text-xs font-medium text-on-surface-variant">Complete 1 more lab to maintain streak</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function RetentionItem({ 
  title, 
  category, 
  percentage, 
  status 
}: { 
  title: string
  category: string
  percentage: number
  status: 'critical' | 'warning'
}) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30 flex items-center justify-between hover:border-primary/40 transition-colors group cursor-pointer">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          status === 'critical' ? "bg-error-container/50 text-error-rose" : "bg-warning-gold/20 text-warning-gold"
        )}>
          {status === 'critical' ? <BatteryWarning className="size-5" /> : <ChevronRight className="size-5 rotate-90" />}
        </div>
        <div>
          <div className="text-sm font-bold text-on-surface">{title}</div>
          <div className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">{category}</div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className={cn(
          "text-xs font-black",
          status === 'critical' ? "text-error-rose" : "text-warning-gold"
        )}>{percentage}%</div>
        <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              status === 'critical' ? "bg-error-rose" : "bg-warning-gold"
            )} 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}
