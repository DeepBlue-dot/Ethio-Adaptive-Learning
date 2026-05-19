import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, Trash2, UploadCloud } from "lucide-react"

import { deleteCmsItem, unpublishCmsItem } from "@/app/(admin)/admin/cms/actions"
import { Button } from "@/components/ui/button"
import type { CmsEntity, CmsSerializableContentType } from "@/lib/cms/types"

export function CmsEditorShell({
  children,
  definition,
  item,
  returnTo,
  status,
  error,
}: {
  children: ReactNode
  definition: CmsSerializableContentType
  item: CmsEntity | null
  returnTo: string
  status?: string
  error?: string
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <Link
          href={returnTo}
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 transition hover:text-teal-800"
        >
          <ArrowLeft className="size-4" />
          Back to {definition.pluralLabel.toLowerCase()}
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
              {definition.label} editor
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
              {item ? item.title : `Create ${definition.label.toLowerCase()}`}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
              {definition.description}
            </p>
            {item?.lifecycle ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <LifecycleBadge label={item.lifecycle.status} />
                {item.lifecycle.hasDraft ? <LifecycleBadge label="DRAFT CHANGES" /> : null}
              </div>
            ) : null}
          </div>

          {item ? (
            <div className="flex flex-wrap gap-3">
              {definition.key === "concept" ? (
                <Button asChild type="button" variant="outline">
                  <Link href={`/learn/${item.id}`}>
                    <Eye className="size-4" />
                    Preview
                  </Link>
                </Button>
              ) : null}
              {item.lifecycle?.status === "PUBLISHED" ? (
                <form action={unpublishCmsItem}>
                  <input name="contentType" type="hidden" value={definition.key} />
                  <input name="id" type="hidden" value={item.id} />
                  <input name="returnTo" type="hidden" value={returnTo} />
                  <Button type="submit" variant="outline">
                    <UploadCloud className="size-4" />
                    Unpublish
                  </Button>
                </form>
              ) : (
                <form action={deleteCmsItem}>
                  <input name="contentType" type="hidden" value={definition.key} />
                  <input name="id" type="hidden" value={item.id} />
                  <input name="returnTo" type="hidden" value={returnTo} />
                  <Button type="submit" variant="destructive">
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </form>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {status ? <Banner message={status} tone="success" /> : null}
      {error ? <Banner message={error} tone="error" /> : null}

      {children}
    </div>
  )
}

function LifecycleBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-foreground">
      {label}
    </span>
  )
}

function Banner({
  message,
  tone,
}: {
  message: string
  tone: "success" | "error"
}) {
  return (
    <div
      className={`rounded-3xl border px-5 py-4 text-sm shadow-sm ${
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900"
      }`}
    >
      {message}
    </div>
  )
}
