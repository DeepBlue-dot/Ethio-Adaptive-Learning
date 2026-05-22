import { notFound } from "next/navigation"
import { getCourseBuilderData } from "@/lib/studio/builder-data"
import { getUnifiedResources } from "@/lib/resources/unified-resources"
import { BuilderWorkspace } from "@/components/admin/studio/builder/builder-workspace"
import { WorkspaceShell } from "@/components/admin/studio/layout/workspace-shell"
import { requireRole } from "@/lib/auth"

export default async function CourseBuilderPage({
  params,
}: {
  params: { courseId: string }
}) {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])
  const { courseId } = await params
  
  const [courseData, resources] = await Promise.all([
    getCourseBuilderData(courseId),
    getUnifiedResources()
  ])

  if (!courseData) {
    notFound()
  }

  return (
    <WorkspaceShell fullBleed hasContextSidebar>
       <BuilderWorkspace 
         courseData={courseData} 
         resources={resources} 
       />
    </WorkspaceShell>
  )
}
