import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, Monitor } from "lucide-react"

import { ContentBlocksRenderer } from "@/components/content/content-blocks-renderer"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth"
import { resolveCmsContentType } from "@/lib/cms"
import { getStudioContentPreview } from "@/lib/studio/site-builder"

type StudioPreviewPageProps = {
  params: Promise<{
    type: string
    id: string
  }>
}

export default async function StudioPreviewPage({ params }: StudioPreviewPageProps) {
  await requireRole(["ADMIN", "COURSE_WRITER"])
  const { type, id } = await params
  const definition = resolveCmsContentType(type)

  if (!definition) notFound()

  const preview = await getStudioContentPreview(definition.key, id)
  if (!preview) notFound()

  const returnTo =
    definition.key === "concept"
      ? `/admin/studio/editor/concept/${id}`
      : `/admin/studio/${definition.key}/${id}`

  return (
    <div className="min-h-full bg-surface-container-lowest">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-outline-variant bg-surface/90 px-6 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-4">
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href={returnTo}>
              <ArrowLeft className="size-4" />
              Exit Preview
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
              <Monitor className="size-3.5" />
              Draft Preview
            </p>
            <h1 className="truncate text-sm font-black text-on-surface">{preview.item.title}</h1>
          </div>
        </div>

        {preview.livePath ? (
          <Button asChild size="sm" className="rounded-xl">
            <Link href={preview.livePath} target="_blank">
              <ExternalLink className="size-4" />
              View Live
            </Link>
          </Button>
        ) : null}
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <article className="overflow-hidden rounded-[2rem] border border-outline-variant bg-surface shadow-xl">
          <div className="border-b border-outline-variant p-8 lg:p-10">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              {definition.label}
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-on-surface">{preview.item.title}</h2>
            {typeof preview.item.data.description === "string" && preview.item.data.description ? (
              <p className="mt-4 max-w-3xl text-base leading-7 text-on-surface-variant">
                {preview.item.data.description}
              </p>
            ) : null}
          </div>

          <div className="p-6 lg:p-8">
            {preview.blocks.length ? (
              <ContentBlocksRenderer
                assets={preview.assets}
                blocks={preview.blocks}
                questions={preview.questions}
                snippets={preview.snippets}
              />
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-outline-variant bg-surface-container-low p-10 text-center">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
                  This draft has no page blocks yet.
                </p>
              </div>
            )}
          </div>
        </article>
      </main>
    </div>
  )
}
