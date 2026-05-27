import { notFound, redirect } from "next/navigation"

import { requireRole } from "@/lib/auth-server"
import { getSiteMapData } from "@/lib/studio/site-builder"

export default async function NewSitePage({
  params,
}: {
  params: Promise<{ siteId: string }>
}) {
  await requireRole(["ADMIN", "COURSE_WRITER"])
  const { siteId } = await params
  const { projects } = await getSiteMapData(siteId)
  const site = projects[0]
  const firstGroup = site?.groups[0]

  if (!site || !firstGroup) {
    notFound()
  }

  redirect(`/admin/studio/editor/concept/new?unitId=${firstGroup.id}&returnTo=/admin/studio/sites/${siteId}`)
}
