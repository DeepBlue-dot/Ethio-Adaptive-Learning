"use client"

import { GripVertical, PlusCircle, Trash2 } from "lucide-react"
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      
      const nextItems = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
        ...item,
        order: idx + 1,
      }))
      
      onChange(nextItems)
    }
  }

  // Ensure every item has an ID for dnd-kit (some might not if they are new)
  const itemsWithIds = items.map((item, index) => ({
    ...item,
    id: item.id || `item-${index}`,
  }))

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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={itemsWithIds.map((item) => item.id as string)} strategy={verticalListSortingStrategy}>
              {itemsWithIds.map((item, index) => (
                <SortableRelationItem
                  key={item.id as string}
                  embeddedFields={embeddedFields}
                  errors={errors}
                  field={field}
                  index={index}
                  item={item}
                  items={items}
                  onChange={onChange}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  )
}

function SortableRelationItem({
  embeddedFields,
  errors,
  field,
  index,
  item,
  items,
  onChange,
}: {
  embeddedFields: CmsEmbeddedField[]
  errors: Record<string, string[]>
  field: CmsField
  index: number
  item: EmbeddedItem
  items: EmbeddedItem[]
  onChange: (items: EmbeddedItem[]) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id as string })

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
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab p-1 text-muted-foreground transition hover:text-teal-600 active:cursor-grabbing"
            type="button"
          >
            <GripVertical className="size-5" />
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Item #{index + 1}</span>
        </div>
        <Button
          onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
          type="button"
          variant="destructive"
          size="sm"
        >
          <Trash2 className="size-4" />
          Remove
        </Button>
      </div>

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
