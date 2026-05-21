import { notFound } from "next/navigation"
import { ArrowLeft, PlusCircle } from "lucide-react"
import Link from "next/link"

import { CmsList } from "@/components/cms/cms-list"
import { CmsFeedback } from "@/components/cms/cms-feedback"
import { Button } from "@/components/ui/button"
import {
  listItems,
  requireCmsAccess,
  resolveCmsContentType,
  toSerializableContentType,
} from "@/lib/cms"
import { getCmsAuthors } from "@/lib/cms/adapters/curriculum"

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
  const authors = await getCmsAuthors()

  const items = await listItems(definition.key, {
    courseId: getSingleValue(query.courseId),
    unitId: getSingleValue(query.unitId),
    conceptId: getSingleValue(query.conceptId),
    authorId: getSingleValue(query.authorId),
    startDate: getSingleValue(query.startDate),
    endDate: getSingleValue(query.endDate),
    query: getSingleValue(query.query),
    status: getSingleValue(query.status),
  })
  const serializableDefinition = toSerializableContentType(definition)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <div className="flex items-center gap-2 text-sm text-secondary mb-2">
              <Link href="/admin/studio" className="hover:text-primary">Studio</Link>
              <ArrowLeft className="size-3" />
              <span className="text-on-surface font-medium">{definition.pluralLabel}</span>
           </div>
           <h1 className="text-3xl font-display font-black text-on-surface tracking-tight">{definition.pluralLabel}</h1>
           <p className="text-secondary-foreground opacity-60 mt-1">{definition.description}</p>
        </div>

        <Button asChild className="bg-primary hover:bg-primary-container">
          <Link href={`/admin/studio/${definition.key}/new`}>
            <PlusCircle className="size-4" />
            New {definition.label}
          </Link>
        </Button>
      </div>

      {getSingleValue(query.msg) ? <CmsFeedback message={getSingleValue(query.msg)!} tone="success" /> : null}
      {getSingleValue(query.error) ? <CmsFeedback message={getSingleValue(query.error)!} tone="error" /> : null}

      <div className="bg-white border border-outline-variant rounded-[2rem] overflow-hidden shadow-sm">
         <CmsList
            definition={serializableDefinition}
            items={items}
            authors={authors.map((a) => ({ id: a.id, username: a.username }))}
          />
      </div>
    </div>
  )
}

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined
}
