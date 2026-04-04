import type { ReactNode } from "react"

type PlaceholderCardProps = {
  title: string
  description: string
  meta: string
  icon?: ReactNode
}

export function PlaceholderCard({
  title,
  description,
  meta,
  icon,
}: PlaceholderCardProps) {
  return (
    <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground">
          {icon ?? <div className="size-5 rounded-full bg-current/20" />}
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          Phase 1
        </span>
      </div>

      <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {meta}
      </p>
    </article>
  )
}
