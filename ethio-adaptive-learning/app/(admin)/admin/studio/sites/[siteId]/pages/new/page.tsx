import { notFound, redirect } from "next/navigation"

import { requireRole } from "@/lib/auth-server"
import { getSiteMapData } from "@/lib/studio/site-builder"

type NewSitePageProps = {
  params: Promise<{ siteId: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function NewSitePage({
  params,
  searchParams,
}: NewSitePageProps) {
  await requireRole(["ADMIN", "COURSE_WRITER"])
  const { siteId } = await params
  const query = (await searchParams) ?? {}
  
  const unitId = getSingleValue(query.unitId)
  const returnTo = getSingleValue(query.returnTo) || `/admin/studio/sites/${siteId}`

  if (unitId) {
    redirect(`/admin/studio/editor/concept/new?unitId=${unitId}&returnTo=${returnTo}`)
  }

  const { projects } = await getSiteMapData(siteId)
  const site = projects[0]
  const firstGroup = site?.groups[0]

  if (!site || !firstGroup) {
    notFound()
  }

  redirect(`/admin/studio/editor/concept/new?unitId=${firstGroup.id}&returnTo=${returnTo}`)
}

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined
}
