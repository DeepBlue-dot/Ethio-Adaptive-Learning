"use client"

import { useState } from "react"
import { PlusCircle, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CmsFieldErrors } from "@/components/cms/cms-feedback"
import type { CmsContentBlock } from "@/lib/cms/content-blocks"
import type { CmsReferenceOptions } from "@/lib/cms/types"

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
        <SelectInput
          label="Image asset"
          options={referenceOptions.assetId ?? []}
          value={block.assetId}
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
      <SelectInput
        label="Snippet"
        options={referenceOptions.snippetId ?? []}
        value={block.snippetId}
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
