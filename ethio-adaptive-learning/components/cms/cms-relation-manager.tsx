"use client"

import { PlusCircle, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CmsFieldErrors } from "@/components/cms/cms-feedback"
import type { CmsEmbeddedField, CmsField } from "@/lib/cms/types"

const inputClassName =
  "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-600"
const textareaClassName = `${inputClassName} min-h-28 resize-y`

type EmbeddedItem = Record<string, string | number | null | undefined>

export function CmsRelationManager({
  errors,
  field,
  items,
  onChange,
}: {
  errors: Record<string, string[]>
  field: CmsField
  items: EmbeddedItem[]
  onChange: (items: EmbeddedItem[]) => void
}) {
  const embeddedFields = field.embeddedFields ?? []

  return (
    <div className="lg:col-span-2">
      <input name={field.name} type="hidden" value={JSON.stringify(items)} />

      <div className="rounded-[2rem] border border-border bg-slate-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{field.label}</h3>
            {field.description ? <p className="mt-1 text-sm text-muted-foreground">{field.description}</p> : null}
          </div>
          <Button onClick={() => onChange([...items, createEmptyItem(embeddedFields, items)])} type="button" variant="outline">
            <PlusCircle className="size-4" />
            Add
          </Button>
        </div>

        <CmsFieldErrors errors={errors} path={field.name} />

        <div className="mt-5 space-y-4">
          {items.map((item, index) => (
            <div key={`${field.name}-${index}`} className="rounded-3xl border border-border bg-white p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-2">
                {embeddedFields.map((embeddedField) => (
                  <EmbeddedFieldInput
                    key={embeddedField.name}
                    errors={errors}
                    field={embeddedField}
                    item={item}
                    onChange={(value) => {
                      const nextItems = items.map((currentItem, itemIndex) =>
                        itemIndex === index ? { ...currentItem, [embeddedField.name]: value } : currentItem
                      )
                      onChange(nextItems)
                    }}
                    path={`${field.name}.${index}.${embeddedField.name}`}
                  />
                ))}
              </div>

              <div className="mt-4">
                <Button
                  onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                  type="button"
                  variant="destructive"
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmbeddedFieldInput({
  errors,
  field,
  item,
  onChange,
  path,
}: {
  errors: Record<string, string[]>
  field: CmsEmbeddedField
  item: EmbeddedItem
  onChange: (value: string | number) => void
  path: string
}) {
  const value = item[field.name] ?? ""
  const isLongField = field.type === "textarea" || field.type === "markdown"

  return (
    <label className={`block text-sm font-medium text-foreground ${isLongField ? "lg:col-span-2" : ""}`}>
      {field.label}
      {isLongField ? (
        <textarea
          className={textareaClassName}
          onChange={(event) => onChange(event.currentTarget.value)}
          rows={field.type === "markdown" ? 7 : 4}
          value={String(value)}
        />
      ) : (
        <input
          className={inputClassName}
          min={field.type === "number" ? 1 : undefined}
          onChange={(event) =>
            onChange(field.type === "number" ? Number(event.currentTarget.value) : event.currentTarget.value)
          }
          type={field.type === "number" ? "number" : "text"}
          value={String(value)}
        />
      )}
      <CmsFieldErrors errors={errors} path={path} />
    </label>
  )
}

function createEmptyItem(fields: CmsEmbeddedField[], items: EmbeddedItem[]) {
  const item: EmbeddedItem = {
    id: "",
  }

  for (const field of fields) {
    item[field.name] = field.name === "order" ? nextOrderValue(items) : ""
  }

  return item
}

function nextOrderValue(items: EmbeddedItem[]) {
  const orderValues = items
    .map((item) => Number(item.order))
    .filter((value) => Number.isFinite(value) && value > 0)

  return orderValues.length ? Math.max(...orderValues) + 1 : 1
}
