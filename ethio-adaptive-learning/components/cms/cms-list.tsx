"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckSquare, Eye, ImageUp, PencilLine, Play, PlusCircle, Search, Square, Trash2, UploadCloud, Video, XCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { uploadCmsImageAsset, saveCmsItem, unpublishCmsItem, bulkActionCmsItems } from "@/app/(admin)/admin/studio/actions"
import { Button } from "@/components/ui/button"
import type { CmsEntity, CmsSerializableContentType } from "@/lib/cms/types"

export function CmsList({
  definition,
  items,
  authors = [],
}: {
  definition: CmsSerializableContentType
  items: CmsEntity[]
  authors?: Array<{ id: string; username: string }>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "")

  const isMedia = definition.key === "media-asset"

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters({ query: searchQuery })
  }

  const applyFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    router.push(`/admin/studio/${definition.key}?${params.toString()}`)
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)))
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Existing {definition.pluralLabel.toLowerCase()}
          </h2>
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length === 1 ? "" : "s"} in this content type.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push(`/admin/studio/${definition.key}`)}>
            Clear Filters
          </Button>
          <Button asChild>
            <Link href={`/admin/studio/${definition.key}/new`}>
              <PlusCircle className="size-4" />
              New {definition.label.toLowerCase()}
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-[2rem] border border-border bg-slate-50 p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-6">
          <form onSubmit={handleSearch} className="relative flex-1 min-w-75">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search ${definition.pluralLabel.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-border bg-white pl-11 pr-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-300 focus:shadow-sm"
            />
          </form>

          <div className="flex items-center gap-4">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status:</label>
            <div className="flex gap-1.5">
              {["PUBLISHED", "DRAFT", "UNPUBLISHED"].map((s) => (
                <button
                  key={s}
                  onClick={() => applyFilters({ status: searchParams.get("status") === s ? null : s })}
                  className={`rounded-full border px-4 py-1.5 text-[10px] font-bold transition ${
                    searchParams.get("status") === s
                      ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                      : "border-border bg-white text-foreground hover:border-teal-300 hover:bg-teal-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-6 border-t border-border pt-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Author</label>
            <select
              value={searchParams.get("authorId") || ""}
              onChange={(e) => applyFilters({ authorId: e.target.value || null })}
              className="rounded-xl border border-border bg-white px-3 py-2 text-xs text-foreground outline-none focus:border-teal-300"
            >
              <option value="">All Authors</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.username}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Created After</label>
            <input
              type="date"
              value={searchParams.get("startDate") || ""}
              onChange={(e) => applyFilters({ startDate: e.target.value || null })}
              className="rounded-xl border border-border bg-white px-3 py-2 text-xs text-foreground outline-none focus:border-teal-300"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Created Before</label>
            <input
              type="date"
              value={searchParams.get("endDate") || ""}
              onChange={(e) => applyFilters({ endDate: e.target.value || null })}
              className="rounded-xl border border-border bg-white px-3 py-2 text-xs text-foreground outline-none focus:border-teal-300"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end py-2 border-b border-border pb-4">

        {items.length > 0 && !isMedia && (
          <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="text-xs">
            {selectedIds.size === items.length ? <CheckSquare className="mr-2 size-4" /> : <Square className="mr-2 size-4" />}
            {selectedIds.size === items.length ? "Deselect All" : "Select All"}
          </Button>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-teal-900 p-4 text-white shadow-lg animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-teal-800 px-3 py-1 text-xs font-bold">
              {selectedIds.size} selected
            </span>
            <p className="text-sm font-medium">Bulk Actions</p>
          </div>
          <form action={bulkActionCmsItems} className="flex items-center gap-2">
            <input type="hidden" name="contentType" value={definition.key} />
            {[...selectedIds].map((id) => (
              <input key={id} type="hidden" name="ids" value={id} />
            ))}
            <Button size="sm" variant="ghost" name="intent" value="bulk-publish" type="submit" className="text-white hover:bg-teal-800">
              <UploadCloud className="size-4" />
              Publish
            </Button>
            <Button size="sm" variant="ghost" name="intent" value="bulk-unpublish" type="submit" className="text-white hover:bg-teal-800">
              <XCircle className="size-4" />
              Unpublish
            </Button>
            <Button size="sm" variant="ghost" name="intent" value="bulk-delete" type="submit" className="text-rose-200 hover:bg-rose-900/50 hover:text-rose-100">
              <Trash2 className="size-4" />
              Delete
            </Button>
            <div className="mx-2 h-4 w-px bg-teal-800" />
            <Button size="sm" variant="ghost" type="button" onClick={() => setSelectedIds(new Set())} className="text-white hover:bg-teal-800">
              Cancel
            </Button>
          </form>
        </div>
      )}
      {isMedia ? <MediaCreationControls /> : null}

      {items.length ? (
        isMedia ? (
          <MediaGrid items={items} />
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-[2rem] border border-border bg-white p-6 shadow-sm transition hover:border-teal-300 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleSelect(item.id)}
                      className={`flex size-6 items-center justify-center rounded-lg border transition ${
                        selectedIds.has(item.id)
                          ? "bg-teal-600 border-teal-600 text-white"
                          : "border-border bg-white text-transparent group-hover:border-teal-300"
                      }`}
                    >
                      <CheckSquare className="size-4" />
                    </button>
                    <div className="flex-1 min-w-70">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link 
                          href={`/admin/studio/${definition.key}/${item.id}`}
                          className="text-2xl font-semibold tracking-tight text-foreground hover:text-teal-700 transition"
                        >
                          {item.title}
                        </Link>
                        <LifecycleBadge label={item.status || "UNKNOWN"} />
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                        {definition.listFields.map((field) => (
                          <div key={field.name} className="flex items-baseline gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              {field.label}:
                            </span>
                            <span className="text-sm font-medium text-foreground">
                              {formatListValue(item.data[field.name])}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/studio/${definition.key}/${item.id}/preview`} target="_blank">
                        <Eye className="size-4" />
                        Preview
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/studio/${definition.key}/${item.id}`}>
                        <PencilLine className="size-4" />
                        Edit
                      </Link>
                    </Button>
                    <QuickActions item={item} definition={definition} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
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

function QuickActions({ item, definition }: { item: CmsEntity, definition: CmsSerializableContentType }) {
  if (item.status === "PUBLISHED") {
    return (
      <form action={unpublishCmsItem}>
        <input name="contentType" type="hidden" value={definition.key} />
        <input name="id" type="hidden" value={item.id} />
        <Button size="sm" variant="ghost" type="submit" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
          <XCircle className="size-4" />
          Unpublish
        </Button>
      </form>
    )
  }

  return (
    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled>
      <UploadCloud className="size-4" />
      Quick Publish
    </Button>
  )
}

function LifecycleBadge({ label }: { label: string }) {
  const colors = {
    DRAFT: "bg-slate-100 text-slate-700",
    PUBLISHED: "bg-emerald-100 text-emerald-700",
    UNPUBLISHED: "bg-rose-100 text-rose-700",
    "PUBLISHED + DRAFT": "bg-amber-100 text-amber-700",
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
        colors[label as keyof typeof colors] || "bg-secondary text-secondary-foreground"
      }`}
    >
      {label}
    </span>
  )
}

function MediaCreationControls() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <form
        action={uploadCmsImageAsset}
        className="flex flex-col rounded-[2rem] border border-border bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-teal-700">
          <ImageUp className="size-4" />
          Upload Image
        </div>
        <div className="mt-4 grid gap-4">
          <input
            aria-label="Image file"
            className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground"
            name="file"
            required
            type="file"
            accept="image/*"
          />
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
          <Button type="submit">Upload to Cloudinary</Button>
        </div>
      </form>

      <form
        action={async (formData) => {
          formData.set("contentType", "media-asset")
          formData.set("kind", "YOUTUBE_EMBED")
          formData.set("intent", "publish")
          await saveCmsItem({ ok: true, message: "", fieldErrors: {}, statusCode: null }, formData)
        }}
        className="flex flex-col rounded-[2rem] border border-border bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-red-700">
          <Video className="size-4" />
          Add YouTube Embed
        </div>
        <div className="mt-4 grid gap-4">
          <input
            aria-label="YouTube URL"
            className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-red-600"
            name="url"
            placeholder="https://www.youtube.com/watch?v=..."
            required
            type="url"
          />
          <input
            aria-label="Video title"
            className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-red-600"
            name="title"
            placeholder="Title (optional)"
          />
          <Button className="bg-red-600 hover:bg-red-700" type="submit">
            Add Video
          </Button>
        </div>
      </form>
    </div>
  )
}

function MediaGrid({ items }: { items: CmsEntity[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => {
        const isVideo = item.data.kind === "YOUTUBE_EMBED"
        const thumbnail = isVideo ? item.data.thumbnailUrl : item.data.url

        return (
          <Link
            key={item.id}
            className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border bg-white shadow-sm transition hover:border-teal-300"
            href={`/admin/studio/media-asset/${item.id}`}
          >
            <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
              {thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={String(item.data.alt || item.title)}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  src={String(thumbnail)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageUp className="size-8 opacity-20" />
                </div>
              )}
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition group-hover:bg-black/20">
                  <div className="rounded-full bg-white/90 p-3 text-red-600 shadow-md">
                    <Play className="size-5 fill-current" />
                  </div>
                </div>
              )}
              <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                {String(item.data.kind).replace("_EMBED", "")}
              </div>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {String(item.data.caption || item.data.publicId || item.data.videoId || "")}
              </p>
              <div className="mt-auto pt-3 flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-widest text-teal-700">Edit Asset</span>
                {item.status === "DRAFT" && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    DRAFT
                  </span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
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
