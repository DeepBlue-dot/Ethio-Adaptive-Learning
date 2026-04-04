import { Network } from "lucide-react"

import { PlaceholderCard } from "@/components/shared/placeholder-card"
import { requireRole } from "@/lib/auth"

export default async function AdminConceptsPage() {
  await requireRole("ADMIN")

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
          CMS Concepts
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Concept authoring placeholder</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          This route is reserved for concept creation, prerequisite mapping, and curriculum structure
          management in Phase 2.
        </p>
      </section>

      <PlaceholderCard
        title="Concept management"
        description="Create, edit, and organize units and concepts here once the CMS implementation starts."
        meta="Phase 2 target"
        icon={<Network className="size-5" />}
      />
    </div>
  )
}
