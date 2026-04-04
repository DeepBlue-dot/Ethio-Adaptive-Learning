import { Network } from "lucide-react"

import { PlaceholderCard } from "@/components/shared/placeholder-card"
import { requireRole } from "@/lib/auth"

export default async function ConceptsPage() {
  await requireRole("STUDENT")

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
          Concepts
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Knowledge structure placeholder</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          This route is reserved for the KST graph, unit navigation, and concept unlocking views.
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <PlaceholderCard
          title="Unit list"
          description="Browse subject units and concepts here once the curriculum CMS is in place."
          meta="Curriculum navigation"
          icon={<Network className="size-5" />}
        />
        <PlaceholderCard
          title="Prerequisite graph"
          description="Visual progression and prerequisite relationships will surface here after KST integration."
          meta="Graph view"
          icon={<Network className="size-5" />}
        />
      </div>
    </div>
  )
}
