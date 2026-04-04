import { Users } from "lucide-react"

import { PlaceholderCard } from "@/components/shared/placeholder-card"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function AdminUsersPage() {
  await requireRole("ADMIN")

  const totalUsers = await prisma.user.count()

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
          Users
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Learner management placeholder</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          Administrative oversight, support actions, and user listings will be implemented here as the
          platform grows.
        </p>

        <div className="mt-8 rounded-3xl bg-secondary p-5">
          <p className="text-sm text-muted-foreground">Registered users</p>
          <p className="mt-2 text-3xl font-semibold">{totalUsers}</p>
        </div>
      </section>

      <PlaceholderCard
        title="User operations"
        description="Role filters, account review, and support tooling will plug into this route later."
        meta="Admin workflow"
        icon={<Users className="size-5" />}
      />
    </div>
  )
}
