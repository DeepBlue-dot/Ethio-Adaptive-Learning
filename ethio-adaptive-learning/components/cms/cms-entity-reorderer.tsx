"use client"

import { useState } from "react"
import { GripVertical, Save } from "lucide-react"
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
import { reorderCmsEntities } from "@/app/(admin)/admin/studio/actions"

type ReorderableItem = {
  id: string
  title: string
  subtitle?: string
  [key: string]: unknown
}

export function CmsEntityReorderer({
  contentType,
  initialItems,
  label,
  revalidationPaths = [],
}: {
  contentType: string
  initialItems: ReorderableItem[]
  label: string
  revalidationPaths?: string[]
}) {
  const [items, setItems] = useState(initialItems)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
      setMessage(null)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)
    
    const result = await reorderCmsEntities(
      contentType, 
      items.map(item => item.id),
      revalidationPaths
    )
    
    if (result.ok) {
      setMessage({ text: result.message || "Order saved.", type: "success" })
    } else {
      setMessage({ text: result.message || "Failed to save order.", type: "error" })
    }
    
    setIsSaving(false)
  }

  const hasChanges = JSON.stringify(items.map(i => i.id)) !== JSON.stringify(initialItems.map(i => i.id))

  return (
    <div className="rounded-[2rem] border border-border bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{label}</h3>
          <p className="text-sm text-muted-foreground mt-1">Drag items to change their display order.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="size-4" />
              Save Order
            </span>
          )}
        </Button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-2xl text-sm font-medium ${
          message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-rose-50 text-rose-800 border border-rose-100"
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item, index) => (
              <SortableItem key={item.id} item={item} index={index} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}

function SortableItem({ item, index }: { item: ReorderableItem; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-2xl border border-border bg-white shadow-sm transition ${
        isDragging ? "opacity-50 ring-2 ring-teal-600/20" : "hover:border-teal-300"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 text-muted-foreground hover:text-teal-600 active:cursor-grabbing"
      >
        <GripVertical className="size-5" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
        {item.subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>}
      </div>
      <span className="text-xs font-bold text-slate-300 bg-slate-50 px-2 py-1 rounded-lg">
        {index + 1}
      </span>
    </div>
  )
}
