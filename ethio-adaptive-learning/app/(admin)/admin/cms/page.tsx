import Link from "next/link"
import { BookMarked, Database, Image, Network, PlusCircle, ScrollText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  getContentTypeCounts,
  getContentTypes,
  requireCmsAccess,
} from "@/lib/cms"

const iconByType = {
  course: BookMarked,
  unit: Database,
  concept: Network,
  question: BookMarked,
  "media-asset": Image,
  "content-snippet": ScrollText,
}

export default async function CmsIndexPage() {
  await requireCmsAccess()

  const [definitions, counts] = await Promise.all([
    Promise.resolve(getContentTypes()),
    getContentTypeCounts(),
  ])

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
          Global CMS
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Content type registry</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          Manage curriculum content through one metadata-driven CMS framework with draft publishing,
          reusable media, content snippets, and block-based lesson authoring.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {definitions.map((definition) => {
          const Icon = iconByType[definition.key]

          return (
            <Link
              key={definition.key}
              className="block rounded-[2rem] border border-border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
              href={`/admin/cms/${definition.key}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
                    {definition.label}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    {definition.pluralLabel}
                  </h2>
                </div>
                <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground">
                  <Icon className="size-5" />
                </div>
              </div>
              <p className="mt-5 text-base leading-7 text-muted-foreground">{definition.description}</p>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                  {counts[definition.key]} item{counts[definition.key] === 1 ? "" : "s"}
                </span>
                <Button asChild size="sm" variant="outline">
                  <span>
                    <PlusCircle className="size-4" />
                    Open
                  </span>
                </Button>
              </div>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
