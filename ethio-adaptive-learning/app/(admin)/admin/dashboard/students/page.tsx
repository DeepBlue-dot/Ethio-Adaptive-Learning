import React from "react"
import { getStudioIntelligence } from "@/lib/studio/intelligence"
import { Users, GraduationCap, Target, Zap } from "lucide-react"

export default async function StudentSignalsPage() {
  const data = await getStudioIntelligence()

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-3xl font-display font-black text-on-surface uppercase tracking-tight">Student Signals</h1>
           <p className="text-secondary-foreground opacity-60 mt-1">Population-scale learning dynamics and retention metrics.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
           <Zap className="size-4" />
           <span className="text-xs font-black uppercase tracking-widest">{data.global.activeStudents7d} Active Students</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         <SignalCard 
            title="Total Scholars" 
            value={data.global.studentCount.toLocaleString()} 
            icon={<Users className="size-6 text-blue-600" />}
            description="Total verified student identities on platform."
         />
         <SignalCard 
            title="Average Mastery" 
            value={`${Math.round(data.global.avgMastery * 100)}%`} 
            icon={<Target className="size-6 text-emerald-600" />}
            description="Mean proficiency across all curriculum nodes."
         />
         <SignalCard 
            title="Interaction Load" 
            value={data.global.interactionCount7d.toLocaleString()} 
            icon={<Zap className="size-6 text-amber-600" />}
            description="Learning events captured in the last 7 days."
         />
      </div>

      <div className="bg-surface-container-lowest border border-dashed border-outline-variant rounded-[3rem] py-24 text-center">
          <GraduationCap className="size-12 mx-auto text-on-surface-variant opacity-20 mb-4" />
          <h3 className="text-lg font-black text-on-surface uppercase tracking-tight opacity-40">Cognitive Insights</h3>
          <p className="text-sm text-on-surface-variant opacity-30 mt-2 max-w-sm mx-auto">
             Advanced learning curve modeling and population-scale cognitive decay analysis are currently initializing.
          </p>
      </div>
    </div>
  )
}

function SignalCard({ title, value, icon, description }: { title: string, value: number | string, icon: React.ReactNode, description: string }) {
  return (
    <div className="bg-white border border-outline-variant rounded-[2rem] p-8 shadow-sm">
       <div className="size-12 rounded-2xl bg-surface-container-low flex items-center justify-center border border-outline-variant/30 mb-6">
          {icon}
       </div>
       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 mb-1">{title}</p>
       <p className="text-4xl font-black text-on-surface tracking-tighter mb-3">{value}</p>
       <p className="text-xs font-medium text-on-surface-variant opacity-60 leading-relaxed">{description}</p>
    </div>
  )
}
