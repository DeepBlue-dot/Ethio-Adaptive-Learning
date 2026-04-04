import { Clock3 } from "lucide-react"

import { PlaceholderCard } from "@/components/shared/placeholder-card"
import { requireRole } from "@/lib/auth"

export default async function ReviewPage() {
  await requireRole("STUDENT")

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
          Review
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Spaced repetition placeholder</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          Due concepts, memory-decay review scheduling, and retention outcomes will surface here later.
        </p>
      </section>

      <PlaceholderCard
        title="Review queue"
        description="This route is reserved for the retention subsystem and spaced repetition workflow."
        meta="Retention subsystem"
        icon={<Clock3 className="size-5" />}
      />
    </div>
  )
}
