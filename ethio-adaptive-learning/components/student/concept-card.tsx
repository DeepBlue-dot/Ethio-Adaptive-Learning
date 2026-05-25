import Link from "next/link"
import { ArrowRight, Clock3, LockKeyhole, Target, TimerReset } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  MasteryBar,
  StatusBadge,
  formatDuration,
  formatPercent,
  formatRelativeDate,
} from "@/components/student/student-status"
import type { StudentConceptCard } from "@/lib/student/types"
import { cn } from "@/lib/utils"

export function ConceptCard({ concept }: { concept: StudentConceptCard }) {
  const isLocked = concept.status === "LOCKED"
  const actionLabel = getActionLabel(concept.status)

  return (
    <article
      data-disabled={isLocked ? true : undefined}
      className={cn(
        "flex h-full flex-col rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-4 shadow-sm transition",
        isLocked ? "opacity-70" : "hover:border-primary/40"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-on-surface-variant">{concept.unit.title}</p>
          <h3 className="mt-1 text-base font-bold text-on-surface">{concept.title}</h3>
        </div>
        <StatusBadge status={concept.status} />
      </div>

      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-on-surface-variant">
        {concept.description ?? "Build mastery through guided practice, checkpoint checks, and exam readiness."}
      </p>
      {isLocked && concept.prerequisiteTitles.length ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-on-surface-variant">
          Requires {concept.prerequisiteTitles.slice(0, 2).join(", ")}
          {concept.prerequisiteTitles.length > 2 ? ` +${concept.prerequisiteTitles.length - 2} more` : ""}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-on-surface-variant">
          <span>Mastery</span>
          <span>{formatPercent(concept.pMastery)}</span>
        </div>
        <MasteryBar value={concept.pMastery} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <Metric icon={Target} label="Attempts" value={String(concept.totalAttempts)} />
        <Metric icon={TimerReset} label="Avg" value={formatDuration(concept.averageTimePerQuestion)} />
        <Metric icon={Clock3} label="Last" value={formatRelativeDate(concept.lastAssessedAt)} />
      </div>

      <div className="mt-auto pt-4">
        {isLocked ? (
          <Button className="w-full justify-between" disabled variant="outline">
            <LockKeyhole className="size-4" />
            Locked
          </Button>
        ) : (
          <Button asChild className="w-full justify-between">
            <Link href={`/student/concept/${concept.conceptId}`}>
              {actionLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    </article>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target
  label: string
  value: string
}) {
  return (
    <div className="min-w-0 rounded-md bg-muted p-2">
      <div className="flex items-center gap-1 text-on-surface-variant">
        <Icon className="size-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <p className="mt-1 truncate font-semibold text-on-surface">{value}</p>
    </div>
  )
}

function getActionLabel(status: StudentConceptCard["status"]) {
  if (status === "REVIEW_NEEDED") return "Review"
  if (status === "IN_PROGRESS") return "Continue"
  if (status === "MASTERED") return "Challenge"
  return "Learn"
}
