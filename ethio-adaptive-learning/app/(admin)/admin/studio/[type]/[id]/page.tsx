import { redirect } from "next/navigation"
import { requireCmsAccess } from "@/lib/cms"

type StudioEditItemPageProps = {
  params: Promise<{
    type: string
    id: string
  }>
}

export default async function StudioEditItemPage({ params }: StudioEditItemPageProps) {
  await requireCmsAccess()
  const { type, id } = await params
  redirect(`/admin/studio/editor/${type}/${id}`)
}
