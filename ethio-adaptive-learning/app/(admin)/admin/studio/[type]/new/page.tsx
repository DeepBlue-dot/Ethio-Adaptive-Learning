import { redirect } from "next/navigation"
import { requireCmsAccess } from "@/lib/cms"

type StudioNewItemPageProps = {
  params: Promise<{
    type: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function StudioNewItemPage({ params, searchParams }: StudioNewItemPageProps) {
  await requireCmsAccess()
  const { type } = await params
  const query = (await searchParams) ?? {}
  
  const searchString = new URLSearchParams(query as Record<string, string>).toString()
  const redirectUrl = `/admin/studio/editor/${type}/new${searchString ? `?${searchString}` : ""}`
  
  redirect(redirectUrl)
}
