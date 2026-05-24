"use client"

import React from "react"
import { formatDistanceToNow } from "date-fns"
import { 
  FileEdit, 
  ArrowRight, 
  Clock,
  MessageSquare
} from "lucide-react"
import Link from "next/link"

interface DraftItem {
  id: string
  contentType: string
  entityId: string
  updatedAt: Date
}

export function ReviewQueue({ drafts }: { drafts: DraftItem[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-xl font-black text-on-surface uppercase tracking-tight">Pending Reviews</h2>
            <p className="text-sm text-on-surface-variant opacity-60">Content drafts awaiting approval or finalization.</p>
         </div>
         <div className="bg-amber-500/10 text-amber-600 px-4 py-2 rounded-2xl border border-amber-500/10 flex items-center gap-2">
            <Clock className="size-4" />
            <span className="text-xs font-black uppercase tracking-widest">{drafts.length} Pending</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {drafts.length > 0 ? (
          drafts.map((draft) => (
            <div key={draft.id} className="bg-white border border-outline-variant rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
               <div className="flex items-center justify-between mb-4">
                  <div className="size-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 transition-transform group-hover:scale-110">
                     <FileEdit className="size-5" />
                  </div>
                  <span className="text-[10px] font-black bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full uppercase tracking-widest border border-outline-variant">
                     {draft.contentType}
                  </span>
               </div>

               <div className="flex-1 min-w-0 mb-6">
                  <p className="text-sm font-black text-on-surface uppercase tracking-tight truncate mb-1">
                     Draft ID: {draft.entityId.slice(-8)}
                  </p>
                  <p className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">
                     Last updated {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
                  </p>
               </div>

               <div className="flex items-center gap-3 pt-6 border-t border-outline-variant/30 mt-auto">
                  <Link 
                    href={`/admin/studio/${draft.contentType}/${draft.entityId}`}
                    className="flex-1 h-10 rounded-xl bg-primary text-white flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                     Review <ArrowRight className="size-3.5" />
                  </Link>
                  <button className="size-10 rounded-xl border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all">
                     <MessageSquare className="size-4" />
                  </button>
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-32 bg-surface-container-lowest border border-dashed border-outline-variant rounded-[3rem] text-center">
             <div className="size-20 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center mx-auto mb-6">
                <FileEdit className="size-8" />
             </div>
             <h3 className="text-lg font-black text-on-surface uppercase tracking-tight mb-2">Queue is Clear</h3>
             <p className="text-sm text-on-surface-variant opacity-60">All content drafts have been processed.</p>
          </div>
        )}
      </div>
    </div>
  )
}
