import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth"

export default async function CourseBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  await requireRole(["ADMIN", "COURSE_WRITER"])
  const { courseId } = await params
  redirect(`/admin/studio/sites/${courseId}`)
}
