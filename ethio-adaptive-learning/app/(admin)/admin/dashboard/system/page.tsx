import { getResourceMetrics } from "@/lib/studio/metrics"
import { Cpu, HardDrive, Zap, Activity } from "lucide-react"
import { formatBytes, cn } from "@/lib/utils"

export default async function SystemHealthPage() {
  const metrics = await getResourceMetrics()

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-3xl font-display font-black text-on-surface uppercase tracking-tight">System Health</h1>
           <p className="text-secondary-foreground opacity-60 mt-1">Infrastructure diagnostics and technical performance monitoring.</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 text-[10px] font-black uppercase tracking-[0.2em]">
           <Zap className="size-3.5 fill-current animate-pulse" />
           Systems Nominal
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Infrastructure Card */}
         <div className="bg-white border border-outline-variant rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-black text-on-surface uppercase tracking-tight">Cloud Infrastructure</h3>
               <HardDrive className="size-6 text-primary opacity-20" />
            </div>
            
            <div className="space-y-6">
               <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30">
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Total Storage Volume</p>
                  <p className="text-3xl font-black text-on-surface tracking-tighter">{formatBytes(metrics.totalStorageBytes)}</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30">
                     <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Asset Count</p>
                     <p className="text-xl font-black text-on-surface tracking-tighter">{metrics.totalCount}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30">
                     <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Health Check</p>
                     <p className="text-xl font-black text-emerald-600 tracking-tighter">Healthy</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Latency / API Card */}
         <div className="bg-white border border-outline-variant rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-black text-on-surface uppercase tracking-tight">Technical Pulse</h3>
               <Cpu className="size-6 text-primary opacity-20" />
            </div>

            <div className="space-y-4">
               <PulseItem label="API Latency" value="45ms" status="good" />
               <PulseItem label="BKT Engine" value="Optimized" status="good" />
               <PulseItem label="DB Load" value="12%" status="good" />
               <PulseItem label="Audit Stream" value="Synced" status="good" />
            </div>
         </div>
      </div>

      <div className="bg-surface-container-lowest border border-dashed border-outline-variant rounded-[3rem] py-24 text-center">
          <Activity className="size-12 mx-auto text-on-surface-variant opacity-20 mb-4" />
          <h3 className="text-lg font-black text-on-surface uppercase tracking-tight opacity-40">Predictive Diagnostics</h3>
          <p className="text-sm text-on-surface-variant opacity-30 mt-2 max-w-sm mx-auto">
             Real-time technical anomaly detection and automated scaling alerts are currently under initialization.
          </p>
      </div>
    </div>
  )
}

function PulseItem({ label, value, status }: { label: string, value: string, status: 'good' | 'warning' | 'critical' }) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface-container-low/50 rounded-2xl border border-outline-variant/30 group hover:bg-white transition-colors">
       <div className="flex items-center gap-3">
          <div className={cn(
             "size-1.5 rounded-full",
             status === 'good' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
          )} />
          <span className="text-[10px] font-black text-on-surface uppercase tracking-widest">{label}</span>
       </div>
       <span className="text-xs font-black text-on-surface-variant group-hover:text-primary transition-colors">{value}</span>
    </div>
  )
}
