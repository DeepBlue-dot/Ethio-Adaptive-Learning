import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
})

function formatDate(date?: Date | null) {
  return date ? dateFormatter.format(date) : "No activity yet"
}

export default async function ProfilePage() {
  const session = await requireRole("STUDENT")

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      profile: true,
    },
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
          Identity
        </p>
        <h1 className="mt-4 text-3xl font-semibold">{user?.username}</h1>
        <div className="mt-8 space-y-4 text-sm text-muted-foreground">
          <p>Email: {user?.email}</p>
          <p>Role: {user?.role}</p>
          <p>Joined: {formatDate(user?.createdAt)}</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
          Learning Profile
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-secondary p-5">
            <p className="text-sm text-muted-foreground">Overall progress</p>
            <p className="mt-2 text-3xl font-semibold">{user?.profile?.overallProgress ?? 0}%</p>
          </div>
          <div className="rounded-3xl bg-secondary p-5">
            <p className="text-sm text-muted-foreground">Last login</p>
            <p className="mt-2 text-lg font-semibold">{formatDate(user?.profile?.lastLogin)}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
