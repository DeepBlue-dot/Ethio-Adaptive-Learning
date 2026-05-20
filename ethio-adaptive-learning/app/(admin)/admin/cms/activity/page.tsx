import { formatDistanceToNow } from "date-fns"
import { Activity, Clock, FileText, User } from "lucide-react"

import { getActivityLogs } from "@/lib/cms/activity"
import { requireCmsAccess } from "@/lib/cms"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function CmsActivityPage() {
  await requireCmsAccess()
  const logs = await getActivityLogs()

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
            <Activity className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">CMS Activity Log</h1>
            <p className="mt-1 text-sm text-muted-foreground">Recent changes across the content management system.</p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-white overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {logs.length ? (
            logs.map((log) => (
              <div key={log.id} className="p-6 transition hover:bg-slate-50">
                <div className="flex items-start gap-4">
                  <Avatar className="size-10 border border-border">
                    <AvatarImage src={log.user.image ?? undefined} />
                    <AvatarFallback className="bg-teal-50 text-teal-700">
                      {log.user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-foreground">
                        <span className="font-bold text-teal-700">{log.user.name || log.user.username}</span>
                        {" "}
                        <ActionBadge action={log.action} />
                        {" "}
                        <span className="font-semibold">{log.contentType}</span>
                        {log.entityTitle ? (
                          <span className="text-muted-foreground">: {log.entityTitle}</span>
                        ) : (
                          <span className="text-muted-foreground italic"> (ID: {log.entityId})</span>
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                        <Clock className="size-3" />
                        {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                      </div>
                    </div>
                    {log.details && (
                      <div className="mt-3 rounded-xl bg-slate-100 p-3 text-xs text-muted-foreground font-mono overflow-x-auto">
                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center">
              <Activity className="mx-auto size-12 text-muted-foreground opacity-20" />
              <h3 className="mt-4 text-lg font-medium text-foreground">No activity recorded yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Recent actions will appear here as they occur.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function ActionBadge({ action }: { action: string }) {
  const styles = {
    CREATE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    UPDATE: "bg-blue-100 text-blue-700 border-blue-200",
    DELETE: "bg-rose-100 text-rose-700 border-rose-200",
    PUBLISH: "bg-teal-100 text-teal-700 border-teal-200",
    UNPUBLISH: "bg-amber-100 text-amber-700 border-amber-200",
    DRAFT_SAVE: "bg-slate-100 text-slate-700 border-slate-200",
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[action as keyof typeof styles] || "bg-secondary text-secondary-foreground"}`}>
      {action.replace("_", " ")}
    </span>
  )
}
