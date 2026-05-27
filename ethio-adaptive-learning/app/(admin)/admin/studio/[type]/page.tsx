import { notFound } from "next/navigation"

import { CmsList } from "@/components/cms/cms-list"
import { requireCmsAccess, listItems, resolveCmsContentType, toSerializableContentType } from "@/lib/cms"
import { getCmsAuthors } from "@/lib/curriculum/course"

type StudioTypePageProps = {
  params: Promise<{
    type: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function StudioTypePage({ params, searchParams }: StudioTypePageProps) {
  await requireCmsAccess()
  const { type } = await params
  const definition = resolveCmsContentType(type)

  if (!definition) {
    notFound()
  }

  const query = (await searchParams) ?? {}
  const [items, authors] = await Promise.all([
    listItems(definition.key, {
      query: getSingleValue(query.query) ?? undefined,
      status: getSingleValue(query.status) ?? undefined,
      authorId: getSingleValue(query.authorId) ?? undefined,
      startDate: getSingleValue(query.startDate) ?? undefined,
      endDate: getSingleValue(query.endDate) ?? undefined,
    }),
    getCmsAuthors(),
  ])

  return (
    <div className="px-6 py-8 lg:px-10 lg:py-10">
      <CmsList definition={toSerializableContentType(definition)} items={items} authors={authors} />
    </div>
  )
}

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined
}
