"use client"

import { useState } from "react"
import { GripVertical, PlusCircle, Search, Trash2 } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Button } from "@/components/ui/button"
import { CmsFieldErrors } from "@/components/cms/cms-feedback"
import { CmsMediaPicker } from "@/components/cms/cms-media-picker"
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
  { label: "PhET", value: "phet" },
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id)
      const newIndex = blocks.findIndex((block) => block.id === over.id)
      setBlocks(arrayMove(blocks, oldIndex, newIndex))
    }
  }

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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block, index) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  errors={errors}
                  index={index}
                  name={name}
                  onRemove={() => setBlocks(blocks.filter((_, i) => i !== index))}
                  onUpdate={(patch) => updateBlock(setBlocks, blocks, index, { ...block, ...patch })}
                  referenceOptions={referenceOptions}
                  setBlocks={setBlocks}
                  blocks={blocks}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  )
}

function SortableBlock({
  block,
  errors,
  index,
  name,
  onRemove,
  onUpdate,
  referenceOptions,
  setBlocks,
  blocks,
}: {
  block: EditableBlock
  errors: Record<string, string[]>
  index: number
  name: string
  onRemove: () => void
  onUpdate: (patch: Partial<EditableBlock>) => void
  referenceOptions: CmsReferenceOptions
  setBlocks: (blocks: EditableBlock[]) => void
  blocks: EditableBlock[]
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-3xl border border-border bg-white p-5 shadow-sm ${
        isDragging ? "opacity-50 ring-2 ring-teal-600/20" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab p-1 text-muted-foreground transition hover:text-teal-600 active:cursor-grabbing"
            type="button"
          >
            <GripVertical className="size-5" />
          </button>
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
        </div>
        <Button onClick={onRemove} type="button" variant="destructive" size="sm">
          <Trash2 className="size-4" />
          Remove
        </Button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <BlockFields block={block} onChange={onUpdate} referenceOptions={referenceOptions} />
      </div>
      <CmsFieldErrors errors={errors} path={`${name}.${index}`} />
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
        <CmsMediaPicker
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

  if (block.type === "phet") {
    return (
      <>
        <CmsMediaPicker
          label="Select PhET Asset"
          options={(referenceOptions.assetId ?? []).filter((option) => option.metadata?.kind === "PHET_SIMULATION")}
          value={String(block.assetId)}
          onChange={(assetId) => onChange({ assetId })}
        />
        <TextInput label="Title" value={block.title} onChange={(title) => onChange({ title })} />
      </>
    )
  }

  return (
    <>
      <TextInput label="Title" value={block.title} onChange={(title) => onChange({ title })} />
      <TextareaInput label="Text" value={block.text} onChange={(text) => onChange({ text })} />
    </>
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
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No snippets found matching &quot;{query}&quot;</div>
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
    return { id, type, url: "", videoId: null, caption: "" }
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

  if (type === "phet") {
    return { id, type, assetId: "", title: "" }
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
