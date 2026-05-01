import { BookMarked, Database, Network, Users } from "lucide-react"

import { PlaceholderCard } from "@/components/shared/placeholder-card"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function AdminDashboardPage() {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])

  const [userCount, courseCount, conceptCount, questionCount] = await Promise.all([
    session.user.role === "ADMIN" ? prisma.user.count() : Promise.resolve(0),
    prisma.course.count(),
    prisma.concept.count(),
    prisma.question.count(),
  ])

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
          CMS Workspace
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          Curriculum control surface
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          The admin tree now supports both platform administrators and course writers. Content
          authoring, prerequisite management, and question-bank work all flow from this shell.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {session.user.role === "ADMIN" ? (
            <div className="rounded-3xl bg-secondary p-5">
              <p className="text-sm text-muted-foreground">Users</p>
              <p className="mt-2 text-3xl font-semibold">{userCount}</p>
            </div>
          ) : null}
          <div className="rounded-3xl bg-secondary p-5">
            <p className="text-sm text-muted-foreground">Courses</p>
            <p className="mt-2 text-3xl font-semibold">{courseCount}</p>
          </div>
          <div className="rounded-3xl bg-secondary p-5">
            <p className="text-sm text-muted-foreground">Concepts</p>
            <p className="mt-2 text-3xl font-semibold">{conceptCount}</p>
          </div>
          <div className="rounded-3xl bg-secondary p-5">
            <p className="text-sm text-muted-foreground">Questions</p>
            <p className="mt-2 text-3xl font-semibold">{questionCount}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <PlaceholderCard
          title="Curriculum graph"
          description="Create units, concepts, and unlock relationships with explicit prerequisite validation."
          meta="Knowledge structure"
          icon={<Network className="size-5" />}
        />
        <PlaceholderCard
          title="Content"
          description="Math lesson authoring, inline examples, and BKT defaults now live in the CMS routes."
          meta="Content management"
          icon={<BookMarked className="size-5" />}
        />
        <PlaceholderCard
          title="Question bank"
          description="Practice, checkpoint, and exam items can be filtered and maintained by course, unit, and concept."
          meta="Assessment authoring"
          icon={<Database className="size-5" />}
        />
        {session.user.role === "ADMIN" ? (
          <PlaceholderCard
            title="Users"
            description="Role-aware user management and learner oversight remain reserved for administrators."
            meta="Admin only"
            icon={<Users className="size-5" />}
          />
        ) : null}
      </section>
    </div>
  )
}
