"use client"

import React, { useEffect, useState } from "react"
import { 
  BarChart3, 
  Database, 
  Layers, 
  AlertTriangle, 
  Activity,
  ArrowUpRight,
  HardDrive
} from "lucide-react"
import { getResourceMetricsAction } from "@/app/(admin)/admin/studio/actions"
import { Button } from "@/components/ui/button"
import type { ResourceMetrics } from "@/lib/studio/metrics"

export default function IntelligencePage() {
  const [metrics, setMetrics] = useState<ResourceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    handleFetchMetrics()
  }, [])

  const handleFetchMetrics = async () => {
    setIsLoading(true)
    try {
      const result = await getResourceMetricsAction()
      if (result.ok && result.metrics) {
        setMetrics(result.metrics)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-surface-container-high rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-surface-container-high rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight flex items-center gap-3">
            <BarChart3 className="size-6 text-primary" />
            Content Intelligence
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 italic">Real-time health and scale metrics for your learning platform.</p>
        </div>
        <Button onClick={handleFetchMetrics} variant="outline" size="sm" className="rounded-xl gap-2">
          <Activity className="size-4" />
          Refresh Stats
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Total Resources" 
          value={metrics?.totalCount || 0} 
          icon={Layers}
          description={`${metrics?.mediaAssetCount || 0} Assets, ${metrics?.contentSnippetCount || 0} Snippets`}
        />
        <MetricCard 
          label="Orphaned Assets" 
          value={metrics?.unusedCount || 0} 
          icon={AlertTriangle}
          trend={(metrics?.orphanedRatio ?? 0) > 0.2 ? "negative" : "neutral"}
          description={`${Math.round((metrics?.orphanedRatio || 0) * 100)}% of library is unused`}
        />
        <MetricCard 
          label="Storage Growth" 
          value={formatBytes(metrics?.totalStorageBytes || 0)} 
          icon={HardDrive}
          description="Total Cloudinary usage"
        />
        <MetricCard 
          label="Recent Activity" 
          value={metrics?.recentActivityCount || 0} 
          icon={Activity}
          description="CMS actions in last 24h"
        />
      </div>

      {/* Storage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        <section className="bg-surface border border-outline-variant rounded-3xl p-6 glass-panel">
          <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-6 flex items-center gap-2">
            <Database className="size-4" />
            Storage Breakdown
          </h3>
          <div className="space-y-4">
            {Object.entries(metrics?.storageByKind || {}).map(([kind, bytes]) => (
              <div key={kind} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-tighter">
                  <span className="text-on-surface-variant">{kind.replace('_', ' ')}</span>
                  <span className="text-on-surface">{formatBytes(bytes)}</span>
                </div>
                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${metrics ? (bytes / metrics.totalStorageBytes) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface border border-outline-variant rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 tibeb-pattern">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary rotate-3">
             <ArrowUpRight className="size-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-on-surface uppercase tracking-tight">System Health</h3>
            <p className="text-sm text-on-surface-variant max-w-xs mt-2 italic">
              Your curriculum graph is currently optimized for high-speed delivery. Usage tracking is synchronized.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ label, value, description, icon: Icon, trend = "neutral" }: { 
  label: string, 
  value: string | number, 
  description?: string, 
  icon: React.ElementType,
  trend?: "positive" | "negative" | "neutral"
}) {
  return (
    <div className="bg-surface border border-outline-variant rounded-2xl p-5 space-y-3 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-xl bg-surface-container-high text-on-surface-variant">
          <Icon className="size-5" />
        </div>
        {trend !== "neutral" && (
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
            trend === "positive" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}>
            {trend === "positive" ? "+ Increase" : "Review Needed"}
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">{label}</p>
        <h4 className="text-3xl font-black text-on-surface tracking-tighter mt-1">{value}</h4>
        {description && <p className="text-[11px] text-on-surface-variant mt-2 font-medium italic opacity-70">{description}</p>}
      </div>
    </div>
  )
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
