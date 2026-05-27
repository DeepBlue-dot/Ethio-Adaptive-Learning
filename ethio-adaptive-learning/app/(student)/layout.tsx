import { StudentHeader } from "@/components/student/student-header"
import { StudentSidebar } from "@/components/student/student-sidebar"
import { requireRole } from "@/lib/auth-server"
import { getStudentNavigation } from "@/lib/student/data"

export default async function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireRole("STUDENT")
  const navigation = await getStudentNavigation(
    session.user.id,
    session.user.username ?? session.user.name ?? "learner",
    session.user.role
  )

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <StudentSidebar navigation={navigation} />
      <div className="min-h-screen lg:pl-72">
        <StudentHeader navigation={navigation} />
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
