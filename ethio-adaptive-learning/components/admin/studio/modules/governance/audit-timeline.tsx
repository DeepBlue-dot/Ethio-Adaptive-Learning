"use client"

import React from "react"
import { formatDistanceToNow } from "date-fns"
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  UploadCloud, 
  CloudOff,
  User,
  ExternalLink,
  Activity
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AuditLogEntry {
  id: string
  action: string
  contentType: string
  entityId: string
  entityTitle: string | null
  createdAt: Date
  user: {
    username: string
    name: string | null
    image: string | null
    role: string
  }
}

export function AuditTimeline({ activity }: { activity: AuditLogEntry[] }) {
  return (
    <div className="bg-white border border-outline-variant rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
         <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Global Activity Log</h3>
         <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-tighter border border-primary/10">
            {activity.length} Entries
         </span>
      </div>

      <div className="divide-y divide-outline-variant/30">
        {activity.length > 0 ? (
          activity.map((log) => (
            <div key={log.id} className="p-5 hover:bg-surface-container-lowest transition-colors group">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "size-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105",
                  getActionColor(log.action)
                )}>
                  {getActionIcon(log.action)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-on-surface">
                       {log.user.name || log.user.username}
                    </span>
                    <span className="text-xs text-on-surface-variant opacity-60 uppercase tracking-tighter">
                       {log.action.toLowerCase()}
                    </span>
                    <span className="text-sm font-black text-on-surface uppercase tracking-tight">
                       {log.contentType}
                    </span>
                    <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                       {log.entityTitle || "Untitled"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2">
                     <div className="flex items-center gap-1.5">
                        <User className="size-3 text-on-surface-variant opacity-40" />
                        <span className="text-[10px] font-bold text-on-surface-variant opacity-60 uppercase tracking-widest">{log.user.role}</span>
                     </div>
                     <span className="text-[10px] font-medium text-on-surface-variant opacity-40">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                     </span>
                  </div>
                </div>

                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Link 
                     href={`/admin/studio/${log.contentType}/${log.entityId}`}
                     className="size-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                     title="View Entity"
                   >
                     <ExternalLink className="size-3.5" />
                   </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-20 text-center space-y-4 opacity-40">
             <Activity className="size-12 mx-auto text-on-surface-variant" />
             <p className="text-xs font-black uppercase tracking-widest">No activity recorded yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

function getActionIcon(action: string) {
  switch (action) {
    case 'CREATE': return <Plus className="size-4" />
    case 'UPDATE': return <RefreshCw className="size-4" />
    case 'DELETE': return <Trash2 className="size-4" />
    case 'PUBLISH': return <UploadCloud className="size-4" />
    case 'UNPUBLISH': return <CloudOff className="size-4" />
    default: return <Activity className="size-4" />
  }
}

function getActionColor(action: string) {
  switch (action) {
    case 'CREATE': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
    case 'UPDATE': return 'bg-blue-50 text-blue-600 border-blue-100'
    case 'DELETE': return 'bg-rose-50 text-rose-600 border-rose-100'
    case 'PUBLISH': return 'bg-violet-50 text-violet-600 border-violet-100'
    case 'UNPUBLISH': return 'bg-amber-50 text-amber-600 border-amber-100'
    default: return 'bg-slate-50 text-slate-600 border-slate-100'
  }
}
