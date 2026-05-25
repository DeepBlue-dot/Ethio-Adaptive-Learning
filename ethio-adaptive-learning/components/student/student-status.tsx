import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  LockKeyhole,
  RotateCcw,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { StudentStatus } from "@/lib/student/types"

const statusMeta: Record<
  StudentStatus,
  {
    label: string
    className: string
    icon: typeof CircleDot
  }
> = {
  LOCKED: {
    label: "Locked",
    className: "border-outline-variant bg-muted text-muted-foreground",
    icon: LockKeyhole,
  },
  FRINGE: {
    label: "Available",
    className: "border-primary/20 bg-primary-fixed text-on-primary-fixed",
    icon: CircleDot,
  },
  IN_PROGRESS: {
    label: "Continue",
    className: "border-warning-gold/30 bg-warning-gold/15 text-on-tertiary-fixed",
    icon: CircleDot,
  },
  MASTERED: {
    label: "Complete",
    className: "border-secondary/20 bg-secondary/15 text-secondary",
    icon: CheckCircle2,
  },
  REVIEW_NEEDED: {
    label: "Review Due",
    className: "border-error-rose/20 bg-error-container text-on-error-container",
    icon: RotateCcw,
  },
}

export function getStatusLabel(status: StudentStatus) {
  return statusMeta[status].label
}

export function StatusBadge({
  className,
  status,
}: {
  className?: string
  status: StudentStatus
}) {
  const meta = statusMeta[status]
  const Icon = meta.icon

  return (
    <span
      aria-label={`Concept status: ${meta.label}`}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-semibold",
        meta.className,
        className
      )}
    >
      <Icon className="size-3.5" />
      {meta.label}
    </span>
  )
}

export function MasteryBar({
  className,
  value,
  label = "Mastery progress",
}: {
  className?: string
  value: number
  label?: string
}) {
  const percent = Math.max(0, Math.min(100, Math.round(value * 100)))

  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={percent}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{
          width: `${percent}%`,
        }}
      />
    </div>
  )
}

export function ReviewAlert({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-error-rose/20 bg-error-container/70 p-3 text-sm text-on-error-container",
        className
      )}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p>Mastery may have decayed. Review is recommended before moving on.</p>
    </div>
  )
}

export function formatPercent(value: number) {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`
}

export function formatDuration(ms: number) {
  if (!ms) {
    return "0s"
  }

  const seconds = Math.max(1, Math.round(ms / 1000))
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return remainingSeconds ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Not assessed yet"
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export function formatRelativeDate(value: string | null) {
  if (!value) {
    return "No activity yet"
  }

  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return "Today"
  }

  if (diffDays === 1) {
    return "Yesterday"
  }

  return `${diffDays} days ago`
}
