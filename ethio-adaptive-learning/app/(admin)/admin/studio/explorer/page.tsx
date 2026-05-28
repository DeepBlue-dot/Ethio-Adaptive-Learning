import { requireRole } from "@/lib/auth-server"
import { getSiteMapData } from "@/lib/studio/site-builder"
import { CurriculumExplorer } from "@/components/admin/studio/explorer/curriculum-explorer"

export default async function CurriculumExplorerPage() {
  await requireRole(["ADMIN", "COURSE_WRITER"])
  
  const { projects } = await getSiteMapData()

  // Map SiteMapProject to the format expected by CurriculumExplorer
  const courses = projects.map(project => ({
    id: project.id,
    title: project.title,
    slug: project.slug,
    status: project.status,
    units: project.groups.map(group => ({
      id: group.id,
      title: group.title,
      order: group.order,
      status: group.status,
      concepts: group.pages.map(page => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status
      }))
    }))
  }))

  return (
    <div className="h-full p-6 lg:p-10">
      <CurriculumExplorer courses={courses} />
    </div>
  )
}
