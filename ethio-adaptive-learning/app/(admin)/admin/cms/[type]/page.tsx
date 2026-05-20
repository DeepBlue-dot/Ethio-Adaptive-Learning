import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, PlusCircle } from "lucide-react"

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

type CmsTypePageProps = {
  params: Promise<{
    type: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function CmsTypePage({ params, searchParams }: CmsTypePageProps) {
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
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <Link
          href="/admin/cms"
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 transition hover:text-teal-800"
        >
          <ArrowLeft className="size-4" />
          Back to CMS
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
              {definition.label}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
              {definition.pluralLabel}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
              {definition.description}
            </p>
          </div>

          <Button asChild>
            <Link href={`/admin/cms/${definition.key}/new`}>
              <PlusCircle className="size-4" />
              New {definition.label.toLowerCase()}
            </Link>
          </Button>
        </div>
      </section>

      {getSingleValue(query.msg) ? <CmsFeedback message={getSingleValue(query.msg)!} tone="success" /> : null}
      {getSingleValue(query.error) ? <CmsFeedback message={getSingleValue(query.error)!} tone="error" /> : null}

      <CmsList
        definition={serializableDefinition}
        items={items}
        authors={authors.map((a) => ({ id: a.id, username: a.username }))}
      />
    </div>
  )
}

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined
}
