import { BookMarked } from "lucide-react"

import { PlaceholderCard } from "@/components/shared/placeholder-card"
import { requireRole } from "@/lib/auth"

export default async function AdminQuestionsPage() {
  await requireRole("ADMIN")

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
          CMS Questions
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Question bank placeholder</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          Question creation, difficulty tagging, usage modes, and explanation authoring will live in
          this branch of the admin CMS.
        </p>
      </section>

      <PlaceholderCard
        title="Question management"
        description="Author and organize practice, checkpoint, and exam items here once the CMS lands."
        meta="Phase 2 target"
        icon={<BookMarked className="size-5" />}
      />
    </div>
  )
}
