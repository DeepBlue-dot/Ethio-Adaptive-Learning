import { BookOpenCheck } from "lucide-react"

import { PlaceholderCard } from "@/components/shared/placeholder-card"
import { requireRole } from "@/lib/auth"

export default async function LearnPage() {
  await requireRole("STUDENT")

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
          Learn
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Adaptive loop placeholder</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          Instructional content, guided practice, checkpoint gating, and mastery exam flow will live
          here in later phases.
        </p>
      </section>

      <PlaceholderCard
        title="Adaptive study loop"
        description="This route is reserved for lesson content, adaptive practice, and mastery progression."
        meta="Phase 4 target"
        icon={<BookOpenCheck className="size-5" />}
      />
    </div>
  )
}
