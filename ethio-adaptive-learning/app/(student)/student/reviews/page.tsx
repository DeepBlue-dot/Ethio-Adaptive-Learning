import Link from "next/link"
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  RotateCcw,
  ShieldAlert,
} from "lucide-react"

import { MasteryBar, ReviewAlert, formatDate, formatPercent } from "@/components/student/student-status"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth"
import { getStudentReviewQueue } from "@/lib/student/data"
import type { StudentReviewItem } from "@/lib/student/types"

export default async function StudentReviewsPage() {
  const session = await requireRole("STUDENT")
  const reviews = await getStudentReviewQueue(session.user.id)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-sm font-semibold text-primary">Review queue</p>
            <h1 className="mt-2 text-3xl font-extrabold text-on-surface">Refresh due mastery</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Concepts appear here when retention signals suggest the mastery estimate may have
              decayed. Refresh practice keeps older skills available for new unlocks.
            </p>
          </div>
          <div className="rounded-lg border border-outline-variant/50 bg-muted p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
              <RotateCcw className="size-4 text-primary" />
              Due now
            </div>
            <p className="mt-3 text-3xl font-extrabold text-primary">{reviews.length}</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {reviews.length === 1 ? "concept needs review" : "concepts need review"}
            </p>
          </div>
        </div>
      </section>

      {reviews.length ? (
        <>
          <ReviewAlert />
          <section className="grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard key={review.conceptId} review={review} />
            ))}
          </section>
        </>
      ) : (
        <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-8 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <CheckCircle2 className="size-6" />
          </div>
          <h2 className="mt-4 text-xl font-extrabold text-on-surface">Nothing due right now</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-on-surface-variant">
            Your review queue is clear. Keep learning from the dashboard or challenge mastered
            concepts when you want a confidence check.
          </p>
          <Button asChild className="mt-5">
            <Link href="/student">
              Back to dashboard
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      )}
    </div>
  )
}

function ReviewCard({ review }: { review: StudentReviewItem }) {
  const decayDelta = Math.max(0, review.baselineMastery - review.effectiveMastery)

  return (
    <article className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary">{review.courseTitle}</p>
          <h2 className="mt-1 text-lg font-extrabold text-on-surface">{review.title}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{review.unitTitle}</p>
        </div>
        <span className="inline-flex h-7 items-center gap-1.5 rounded-md border border-error-rose/20 bg-error-container px-2 text-xs font-semibold text-on-error-container">
          <ShieldAlert className="size-3.5" />
          Review due
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ReviewMetric
          icon={Clock3}
          label="Since mastery"
          value={review.daysSinceMastery ? `${review.daysSinceMastery}d` : "Today"}
        />
        <ReviewMetric icon={CalendarClock} label="Last assessed" value={formatDate(review.lastAssessedAt)} />
        <ReviewMetric icon={RotateCcw} label="Next review" value={formatDate(review.nextReviewAt)} />
      </div>

      <div className="mt-5 rounded-lg bg-muted p-4">
        <div className="flex items-center justify-between text-xs font-medium text-on-surface-variant">
          <span>Effective mastery</span>
          <span>{formatPercent(review.effectiveMastery)}</span>
        </div>
        <MasteryBar className="mt-2" label={`Effective mastery for ${review.title}`} value={review.effectiveMastery} />
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">
          Baseline mastery was {formatPercent(review.baselineMastery)}. Retention decay is currently
          estimated at {formatPercent(decayDelta)}, so a quick refresh is recommended.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/student/concept/${review.conceptId}/review`}>
            Refresh now
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/student/concept/${review.conceptId}/challenge`}>Retry exam</Link>
        </Button>
      </div>
    </article>
  )
}

function ReviewMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-outline-variant/50 bg-background p-3">
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <Icon className="size-3.5 text-primary" />
        {label}
      </div>
      <p className="mt-1 text-sm font-bold text-on-surface">{value}</p>
    </div>
  )
}
