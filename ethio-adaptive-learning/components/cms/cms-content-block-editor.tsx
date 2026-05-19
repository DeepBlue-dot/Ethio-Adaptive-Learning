"use client"

import { useState } from "react"
import { Image as ImageIcon, PlusCircle, Play, Search, Trash2, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CmsFieldErrors } from "@/components/cms/cms-feedback"
import type { CmsContentBlock } from "@/lib/cms/content-blocks"
import type { CmsReferenceOptions, CmsReferenceOption } from "@/lib/cms/types"

type BlockType = CmsContentBlock["type"]
type EditableBlock = {
  id: string
  type: BlockType
  [key: string]: unknown
}

const blockTypes: Array<{
  label: string
  value: BlockType
}> = [
  { label: "Paragraph", value: "paragraph" },
  { label: "Heading", value: "heading" },
  { label: "Image", value: "image" },
  { label: "Video", value: "video" },
  { label: "Embed", value: "embed" },
  { label: "Quiz", value: "quiz" },
  { label: "Code", value: "code" },
  { label: "Snippet", value: "snippet" },
]

const inputClassName =
  "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-600"
const textareaClassName = `${inputClassName} min-h-28 resize-y`

export function CmsContentBlockEditor({
  errors,
  name,
  referenceOptions,
  value,
}: {
  errors: Record<string, string[]>
  name: string
  referenceOptions: CmsReferenceOptions
  value: unknown
}) {
  const [blocks, setBlocks] = useEditableBlocks(value)

  return (
    <div className="lg:col-span-2">
      <input name={name} type="hidden" value={JSON.stringify(blocks)} />

      <div className="rounded-[2rem] border border-border bg-slate-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground">Lesson blocks</h3>
          <Button onClick={() => setBlocks([...blocks, createBlock("paragraph")])} type="button" variant="outline">
            <PlusCircle className="size-4" />
            Add block
          </Button>
        </div>

        <CmsFieldErrors errors={errors} path={name} />

        <div className="mt-5 space-y-4">
          {blocks.map((block, index) => (
            <div key={block.id} className="rounded-3xl border border-border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <select
                  className="rounded-2xl border border-border bg-white px-4 py-2 text-sm text-foreground outline-none transition focus:border-teal-600"
                  onChange={(event) =>
                    updateBlock(setBlocks, blocks, index, createBlock(event.currentTarget.value as BlockType, block.id))
                  }
                  value={block.type}
                >
                  {blockTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => setBlocks(blocks.filter((_, blockIndex) => blockIndex !== index))}
                  type="button"
                  variant="destructive"
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <BlockFields
                  block={block}
                  onChange={(patch) => updateBlock(setBlocks, blocks, index, { ...block, ...patch })}
                  referenceOptions={referenceOptions}
                />
              </div>
              <CmsFieldErrors errors={errors} path={`${name}.${index}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function useEditableBlocks(value: unknown) {
  const initialBlocks = Array.isArray(value) ? value : []
  const [blocks, setBlocks] = useState<EditableBlock[]>(
    initialBlocks.map((block) => normalizeEditableBlock(block as Partial<EditableBlock>))
  )

  return [blocks, setBlocks] as const
}

function BlockFields({
  block,
  onChange,
  referenceOptions,
}: {
  block: EditableBlock
  onChange: (patch: Partial<EditableBlock>) => void
  referenceOptions: CmsReferenceOptions
}) {
  if (block.type === "heading") {
    return (
      <>
        <TextInput label="Heading" value={block.text} onChange={(text) => onChange({ text })} />
        <TextInput label="Level" type="number" value={block.level ?? 2} onChange={(level) => onChange({ level: Number(level) })} />
      </>
    )
  }

  if (block.type === "image") {
    return (
      <>
        <MediaPicker
          label="Select Image Asset"
          options={referenceOptions.assetId ?? []}
          value={String(block.assetId)}
          onChange={(assetId) => onChange({ assetId })}
        />
        <TextInput label="Alt text" value={block.alt} onChange={(alt) => onChange({ alt })} />
        <TextareaInput label="Caption" value={block.caption} onChange={(caption) => onChange({ caption })} />
      </>
    )
  }

  if (block.type === "video") {
    return (
      <>
        <TextInput label="YouTube URL" value={block.url} onChange={(url) => onChange({ url })} />
        <TextareaInput label="Caption" value={block.caption} onChange={(caption) => onChange({ caption })} />
      </>
    )
  }

  if (block.type === "embed") {
    return (
      <>
        <TextInput label="Embed URL" value={block.url} onChange={(url) => onChange({ url })} />
        <TextInput label="Title" value={block.title} onChange={(title) => onChange({ title })} />
      </>
    )
  }

  if (block.type === "quiz") {
    return (
      <SelectInput
        label="Question"
        options={referenceOptions.questionId ?? []}
        value={block.questionId}
        onChange={(questionId) => onChange({ questionId })}
      />
    )
  }

  if (block.type === "code") {
    return (
      <>
        <TextInput label="Language" value={block.language} onChange={(language) => onChange({ language })} />
        <TextareaInput label="Code" value={block.code} onChange={(code) => onChange({ code })} />
      </>
    )
  }

  if (block.type === "snippet") {
    return (
      <SnippetPicker
        options={referenceOptions.snippetId ?? []}
        value={String(block.snippetId)}
        onChange={(snippetId) => onChange({ snippetId })}
      />
    )
  }

  return (
    <>
      <TextInput label="Title" value={block.title} onChange={(title) => onChange({ title })} />
      <TextareaInput label="Text" value={block.text} onChange={(text) => onChange({ text })} />
    </>
  )
}

function MediaPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: CmsReferenceOption[]
  value: string
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selected = options.find((opt) => opt.value === value)

  return (
    <div className="lg:col-span-2">
      <span className="block text-sm font-medium text-foreground">{label}</span>
      <div className="mt-2 flex items-center gap-4">
        <button
          className="flex h-24 w-40 items-center justify-center overflow-hidden rounded-2xl border border-border bg-slate-50 transition hover:border-teal-600 group"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          {selected?.metadata?.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={selected.label}
              className="h-full w-full object-cover"
              src={String(selected.metadata.thumbnailUrl)}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-teal-600">
              <ImageIcon className="size-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Choose Media</span>
            </div>
          )}
        </button>
        {selected && (
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{selected.label}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
              {String(selected.description)}
            </p>
            <button
              className="mt-2 text-xs font-bold text-red-600 hover:underline"
              onClick={() => onChange("")}
              type="button"
            >
              Clear selection
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="mt-4 rounded-3xl border border-border bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {options.map((option) => (
              <button
                key={option.value}
                className={`group relative aspect-video overflow-hidden rounded-2xl border-2 transition ${
                  value === option.value ? "border-teal-600 ring-2 ring-teal-600/20" : "border-transparent hover:border-slate-300"
                }`}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                type="button"
              >
                {option.metadata?.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={option.label}
                    className="h-full w-full object-cover"
                    src={String(option.metadata.thumbnailUrl)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white text-muted-foreground">
                    <ImageIcon className="size-6 opacity-20" />
                  </div>
                )}
                {option.metadata?.kind === "YOUTUBE_EMBED" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20">
                    <Play className="size-5 fill-white text-white" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-left backdrop-blur-sm">
                  <p className="truncate text-[10px] font-bold text-white uppercase tracking-wider">{option.label}</p>
                </div>
              </button>
            ))}
          </div>
          <Button className="mt-4 w-full" onClick={() => setIsOpen(false)} type="button" variant="outline">
            Close Media Library
          </Button>
        </div>
      )}
    </div>
  )
}

function SnippetPicker({
  options,
  value,
  onChange,
}: {
  options: CmsReferenceOption[]
  value: string
  onChange: (value: string) => void
}) {
  const [query, setQuery] = useState("")
  const filtered = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(query.toLowerCase()) || opt.description?.toLowerCase().includes(query.toLowerCase())
  )
  const selected = options.find((opt) => opt.value === value)

  return (
    <div className="lg:col-span-2">
      <span className="block text-sm font-medium text-foreground">Content Snippet</span>
      <div className="mt-2 relative">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className={`${inputClassName} !mt-0 !pl-11`}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search snippets..."
          type="text"
          value={query}
        />
      </div>

      <div className="mt-3 max-h-48 overflow-y-auto rounded-2xl border border-border bg-slate-50 p-2 space-y-1">
        {filtered.length ? (
          filtered.map((option) => (
            <button
              key={option.value}
              className={`flex w-full flex-col rounded-xl px-4 py-3 text-left transition ${
                value === option.value ? "bg-teal-600 text-white shadow-md" : "hover:bg-white"
              }`}
              onClick={() => onChange(option.value)}
              type="button"
            >
              <span className="text-sm font-semibold">{option.label}</span>
              <span className={`text-[10px] uppercase tracking-widest ${value === option.value ? "text-teal-100" : "text-muted-foreground"}`}>
                {option.description}
              </span>
            </button>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No snippets found matching "{query}"</div>
        )}
      </div>

      {selected && (
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-teal-100 bg-teal-50 px-4 py-2">
          <p className="text-xs font-medium text-teal-800 tracking-wide">
            Selected: <span className="font-bold">{selected.label}</span>
          </p>
          <button className="text-[10px] font-bold uppercase text-red-600 hover:underline" onClick={() => onChange("")} type="button">
            Clear
          </button>
        </div>
      )}
    </div>
  )
}

function TextInput({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string
  onChange: (value: string) => void
  type?: "text" | "number"
  value: unknown
}) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <input
        className={inputClassName}
        onChange={(event) => onChange(event.currentTarget.value)}
        type={type}
        value={toInputValue(value)}
      />
    </label>
  )
}

function TextareaInput({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: string) => void
  value: unknown
}) {
  return (
    <label className="block text-sm font-medium text-foreground lg:col-span-2">
      {label}
      <textarea
        className={textareaClassName}
        onChange={(event) => onChange(event.currentTarget.value)}
        rows={5}
        value={toInputValue(value)}
      />
    </label>
  )
}

function SelectInput({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: string) => void
  options: Array<{
    label: string
    value: string
    description?: string
  }>
  value: unknown
}) {
  return (
    <label className="block text-sm font-medium text-foreground lg:col-span-2">
      {label}
      <select className={inputClassName} onChange={(event) => onChange(event.currentTarget.value)} value={toInputValue(value)}>
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function updateBlock(
  setBlocks: (blocks: EditableBlock[]) => void,
  blocks: EditableBlock[],
  index: number,
  block: EditableBlock
) {
  setBlocks(blocks.map((currentBlock, blockIndex) => (blockIndex === index ? normalizeEditableBlock(block) : currentBlock)))
}

function createBlock(type: BlockType, id = createId()): EditableBlock {
  if (type === "heading") {
    return { id, type, level: 2, text: "" }
  }

  if (type === "image") {
    return { id, type, assetId: "", alt: "", caption: "" }
  }

  if (type === "video") {
    return { id, type, url: "", caption: "" }
  }

  if (type === "embed") {
    return { id, type, url: "", title: "" }
  }

  if (type === "quiz") {
    return { id, type, questionId: "" }
  }

  if (type === "code") {
    return { id, type, language: "", code: "" }
  }

  if (type === "snippet") {
    return { id, type, snippetId: "" }
  }

  return { id, type, title: "", text: "" }
}

function normalizeEditableBlock(block: Partial<EditableBlock>): EditableBlock {
  return {
    ...createBlock(block.type ?? "paragraph", block.id || createId()),
    ...block,
  } as EditableBlock
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `block-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function toInputValue(value: unknown) {
  if (typeof value === "number") {
    return String(value)
  }

  return typeof value === "string" ? value : ""
}
