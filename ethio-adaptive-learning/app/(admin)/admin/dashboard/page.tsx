import { BookMarked, Database, Users } from "lucide-react"

import { PlaceholderCard } from "@/components/shared/placeholder-card"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function AdminDashboardPage() {
  await requireRole("ADMIN")

  const [userCount, courseCount, conceptCount] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.concept.count(),
  ])

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
          Admin Workspace
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          Platform control surface
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          The admin tree now groups dashboard, CMS, and users under `/admin/...` so the structure stays
          distinct from the student dashboard route.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-secondary p-5">
            <p className="text-sm text-muted-foreground">Users</p>
            <p className="mt-2 text-3xl font-semibold">{userCount}</p>
          </div>
          <div className="rounded-3xl bg-secondary p-5">
            <p className="text-sm text-muted-foreground">Courses</p>
            <p className="mt-2 text-3xl font-semibold">{courseCount}</p>
          </div>
          <div className="rounded-3xl bg-secondary p-5">
            <p className="text-sm text-muted-foreground">Concepts</p>
            <p className="mt-2 text-3xl font-semibold">{conceptCount}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <PlaceholderCard
          title="Users"
          description="Role-aware user management and learner oversight will plug into this protected admin space."
          meta="Access control"
          icon={<Users className="size-5" />}
        />
        <PlaceholderCard
          title="Content"
          description="Course, unit, concept, and question authoring are intentionally deferred to Phase 2."
          meta="CMS shell"
          icon={<BookMarked className="size-5" />}
        />
        <PlaceholderCard
          title="System Health"
          description="Operational checks, logs, and deployment hygiene can land here as the product matures."
          meta="Platform visibility"
          icon={<Database className="size-5" />}
        />
      </section>
    </div>
  )
}
