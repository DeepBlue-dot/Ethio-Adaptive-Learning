import React from "react"
import { 
  ArrowUpRight, 
  ShieldCheck, 
  Zap, 
  Target, 
  AlertTriangle 
} from "lucide-react"
import Link from "next/link"
import { getStudioIntelligence } from "@/lib/studio/intelligence"
import { getQualityGovernanceOverview } from "@/lib/studio/quality-governance"
import { cn } from "@/lib/utils"

export default async function IntelligenceOverviewPage() {
  const [intelligence, quality] = await Promise.all([
    getStudioIntelligence(),
    getQualityGovernanceOverview()
  ])

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* 1. Module Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-3">
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Engine Live</span>
           </div>
           <h1 className="text-4xl font-black text-on-surface uppercase tracking-tight leading-none">Global Pulse</h1>
           <p className="text-on-surface-variant opacity-60 mt-3 max-w-xl font-medium">
              Real-time pedagogical health and adaptive engine diagnostics for the EthioPrep curriculum.
           </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="px-5 py-2.5 bg-surface-container-high rounded-2xl border border-outline-variant/30 text-right">
              <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Integrity Score</p>
              <p className="text-xl font-black text-on-surface tracking-tighter">{(quality.contentIntegrityScore * 100).toFixed(1)}%</p>
           </div>
        </div>
      </div>

      {/* 2. Top Level Signals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <SignalCard 
            label="Active Learners" 
            value={intelligence.global.activeStudents7d} 
            trend="+12%"
            icon={<Zap className="size-5" />}
            color="blue"
         />
         <SignalCard 
            label="Avg Mastery" 
            value={(intelligence.global.avgMastery * 100).toFixed(0) + "%"} 
            trend="+3%"
            icon={<Target className="size-5" />}
            color="emerald"
         />
         <SignalCard 
            label="Struggle Points" 
            value={quality.stuckConceptCount} 
            icon={<AlertTriangle className="size-5" />}
            color="rose"
            isAlert={quality.stuckConceptCount > 0}
         />
         <SignalCard 
            label="Calibration Nodes" 
            value={quality.calibrationCandidateCount} 
            icon={<ShieldCheck className="size-5" />}
            color="amber"
         />
      </div>

      {/* 3. Actionable Workspaces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <WorkspaceLink 
            title="Question Analytics"
            description="Deep dive into EHSLCE question performance, success rates, and discrimination indexes."
            href="/admin/intelligence/questions"
            metrics={[`${intelligence.content.questionCount} Tracked Questions`, "45% Avg Success"]}
         />
         <WorkspaceLink 
            title="Concept Health"
            description="Visualize drop-off rates and identifying friction points in the adaptive learning loop."
            href="/admin/intelligence/concepts"
            metrics={[`${intelligence.content.conceptCount} Curriculum Nodes`, `${quality.stuckConceptCount} Struggle Points`]}
         />
         <WorkspaceLink 
            title="Calibration Lab"
            description="Fine-tune BKT parameters and difficulty levels using live student observation data."
            href="/admin/intelligence/calibration"
            metrics={[`${quality.calibrationCandidateCount} Tuning Candidates`, "AI-Powered Suggestions"]}
         />
         <WorkspaceLink 
            title="Quality Governance"
            description="Automated auditing for orphan concepts, broken resources, and structural gaps."
            href="/admin/intelligence/quality"
            metrics={[`${quality.orphanConceptCount} Orphan Nodes`, "Structural Validated"]}
         />
      </div>
    </div>
  )
}

function SignalCard({ label, value, trend, icon, color, isAlert }: { label: string, value: string | number, trend?: string, icon: React.ReactNode, color: 'blue' | 'emerald' | 'rose' | 'amber', isAlert?: boolean }) {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100"
  }

  return (
    <div className={cn(
      "bg-white border border-outline-variant rounded-[2rem] p-6 shadow-sm relative overflow-hidden",
      isAlert && "ring-2 ring-rose-500/20 border-rose-200"
    )}>
       <div className="flex items-center justify-between mb-4">
          <div className={cn("size-10 rounded-2xl flex items-center justify-center border transition-transform", colors[color])}>
             {icon}
          </div>
          {trend && (
             <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{trend}</span>
          )}
       </div>
       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-60 mb-1">{label}</p>
       <p className="text-3xl font-black text-on-surface tracking-tighter">{value}</p>
    </div>
  )
}

function WorkspaceLink({ title, description, href, metrics }: { title: string, description: string, href: string, metrics: string[] }) {
  return (
    <Link href={href} className="group">
       <div className="bg-white border border-outline-variant rounded-[2.5rem] p-8 shadow-sm group-hover:shadow-xl group-hover:border-primary/20 transition-all group-hover:-translate-y-1 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-black text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors">{title}</h3>
             <div className="size-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-all">
                <ArrowUpRight className="size-5" />
             </div>
          </div>
          <p className="text-sm text-on-surface-variant font-medium leading-relaxed flex-1 mb-8">
             {description}
          </p>
          <div className="flex flex-wrap gap-2">
             {metrics.map((m, i) => (
                <span key={i} className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/30">
                   {m}
                </span>
             ))}
          </div>
       </div>
    </Link>
  )
}
