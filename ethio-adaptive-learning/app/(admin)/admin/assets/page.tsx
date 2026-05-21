import { notFound } from "next/navigation"
import { ArrowLeft, PlusCircle, UploadCloud } from "lucide-react"
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

type AssetsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  await requireCmsAccess()

  const definition = resolveCmsContentType("media-asset")

  if (!definition) {
    notFound()
  }

  const query = (await searchParams) ?? {}
  const authors = await getCmsAuthors()

  const items = await listItems(definition.key, {
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
              <span>Assets</span>
              <ArrowLeft className="size-3" rotate={180} />
              <span className="text-on-surface font-medium">Library</span>
           </div>
           <h1 className="text-3xl font-display font-black text-on-surface tracking-tight">Media Library</h1>
           <p className="text-secondary-foreground opacity-60 mt-1">Manage and upload instructional media assets.</p>
        </div>

        <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
                <UploadCloud className="size-4" />
                Upload
            </Button>
            <Button asChild className="bg-primary hover:bg-primary-container">
              <Link href={`/admin/studio/media-asset/new`}>
                <PlusCircle className="size-4" />
                New Asset
              </Link>
            </Button>
        </div>
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
