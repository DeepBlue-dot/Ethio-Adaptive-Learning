import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import AccountPageContent from "./page-client"

export default async function AccountPage() {
  const session = await requireRole("STUDENT")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  })

  if (!user) {
    return (
      <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-center text-destructive">User data not found.</p>
      </div>
    )
  }

  return <AccountPageContent user={user} />
}
