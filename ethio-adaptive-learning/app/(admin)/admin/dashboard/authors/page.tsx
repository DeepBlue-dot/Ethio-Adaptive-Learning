import React from "react"
import { getDetailedActivityLog } from "@/lib/studio/governance"
import { MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default async function AuthorFeedbackPage() {
  const activity = await getDetailedActivityLog(10)

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div>
         <h1 className="text-3xl font-display font-black text-on-surface uppercase tracking-tight">Author Feedback</h1>
         <p className="text-secondary-foreground opacity-60 mt-1">Content specialist engagement and publication activity.</p>
      </div>
      
      <div className="bg-white border border-outline-variant rounded-[2.5rem] overflow-hidden shadow-sm">
         <div className="p-8 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
            <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Recent Editorial Activity</h3>
            <span className="text-[10px] font-black bg-primary/5 text-primary px-3 py-1 rounded-full border border-primary/10 uppercase tracking-tighter">Live Stream</span>
         </div>
         
         <div className="divide-y divide-outline-variant/30">
            {activity.map((log) => (
               <div key={log.id} className="p-6 hover:bg-surface-container-lowest transition-colors flex items-center justify-between gap-6 group">
                  <div className="flex items-center gap-4">
                     <div className="size-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 transition-transform group-hover:scale-110">
                        {log.user.username[0].toUpperCase()}
                     </div>
                     <div>
                        <p className="text-sm font-bold text-on-surface uppercase tracking-tight">{log.user.username}</p>
                        <p className="text-[10px] text-on-surface-variant opacity-40 uppercase tracking-widest">{log.action} &bull; {log.contentType}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-sm font-black text-on-surface truncate max-w-[200px]">{log.entityTitle || "Untitled"}</p>
                     <p className="text-[10px] text-on-surface-variant opacity-40 font-medium italic">{formatDistanceToNow(new Date(log.createdAt))} ago</p>
                  </div>
               </div>
            ))}
         </div>
      </div>

      <div className="bg-surface-container-lowest border border-dashed border-outline-variant rounded-[3rem] py-24 text-center">
          <MessageSquare className="size-12 mx-auto text-on-surface-variant opacity-20 mb-4" />
          <h3 className="text-lg font-black text-on-surface uppercase tracking-tight opacity-40">Collaboration Hub</h3>
          <p className="text-sm text-on-surface-variant opacity-30 mt-2 max-w-sm mx-auto">
             Advanced author peer-review tools and editorial discussion threads are currently initializing.
          </p>
      </div>
    </div>
  )
}
