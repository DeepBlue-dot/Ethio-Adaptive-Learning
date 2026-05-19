import Link from "next/link"
import { ImageUp, PencilLine, PlusCircle } from "lucide-react"

import { uploadCmsImageAsset } from "@/app/(admin)/admin/cms/actions"
import { Button } from "@/components/ui/button"
import type { CmsEntity, CmsSerializableContentType } from "@/lib/cms/types"

export function CmsList({
  definition,
  items,
}: {
  definition: CmsSerializableContentType
  items: CmsEntity[]
}) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Existing {definition.pluralLabel.toLowerCase()}</h2>
          <p className="text-sm text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"} in this content type.</p>
        </div>
        <Button asChild>
          <Link href={`/admin/cms/${definition.key}/new`}>
            <PlusCircle className="size-4" />
            New {definition.label.toLowerCase()}
          </Link>
        </Button>
      </div>

      {definition.key === "media-asset" ? (
        <form action={uploadCmsImageAsset} className="rounded-[2rem] border border-border bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <input
              aria-label="Image file"
              className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
              name="file"
              type="file"
              accept="image/*"
            />
            <input
              aria-label="Image title"
              className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
              name="title"
              placeholder="Title"
            />
            <input
              aria-label="Image alt text"
              className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
              name="alt"
              placeholder="Alt text"
            />
            <Button type="submit">
              <ImageUp className="size-4" />
              Upload
            </Button>
          </div>
        </form>
      ) : null}

      {items.length ? (
        <div className="space-y-4">
          {items.map((item) => (
            <Link
              key={item.id}
              className="block rounded-[2rem] border border-border bg-white p-6 shadow-sm transition hover:border-teal-300 hover:bg-teal-50/40"
              href={`/admin/cms/${definition.key}/${item.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-semibold tracking-tight text-foreground">{item.title}</h3>
                    {item.status ? (
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-foreground">
                        {item.status}
                      </span>
                    ) : null}
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
                    {definition.listFields.map((field) => (
                      <div key={field.name} className="rounded-2xl bg-slate-50 px-4 py-3">
                        <dt className="text-xs uppercase tracking-[0.2em]">{field.label}</dt>
                        <dd className="mt-1 font-medium text-foreground">{formatListValue(item.data[field.name])}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-teal-700">
                  Edit
                  <PencilLine className="size-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-border bg-white px-6 py-10 text-center shadow-sm">
          <h3 className="text-xl font-semibold text-foreground">No {definition.pluralLabel.toLowerCase()} yet</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Create the first {definition.label.toLowerCase()} to start filling this CMS type.
          </p>
        </div>
      )}
    </section>
  )
}

function formatListValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "None"
  }

  if (typeof value === "number") {
    return String(value)
  }

  if (typeof value === "string") {
    return value
  }

  return JSON.stringify(value)
}
