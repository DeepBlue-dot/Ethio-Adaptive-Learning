"use client"

import React from "react"
import { motion } from "framer-motion"
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core"
import { BuilderShell } from "@/components/admin/studio/layout/builder-shell"
import { BuilderCanvas } from "@/components/admin/studio/builder/builder-canvas"
import { Inspector } from "@/components/admin/studio/builder/inspector"
import { StudioResourceShelf } from "./studio-resource-shelf"
import { type BuilderUnit } from "@/lib/studio/builder-data"
import { type ResourceItem } from "@/components/admin/resources/resource-card"
import { createBuilderConcept, createBuilderUnit, linkResourceToNode } from "@/app/(admin)/admin/studio/actions"
import { useWorkspaceStore } from "@/lib/studio/use-workspace-store"

type OptimisticBuilderAction =
  | { type: "add-unit"; unit: BuilderUnit }
  | { type: "replace-unit"; tempId: string; unit: BuilderUnit }
  | { type: "remove-unit"; tempId: string }
  | { type: "add-concept"; unitId: string; concept: BuilderUnit["concepts"][number] }
  | { type: "replace-concept"; unitId: string; tempId: string; concept: BuilderUnit["concepts"][number] }
  | { type: "remove-concept"; unitId: string; tempId: string }

export function BuilderWorkspace({ 
  courseData, 
  resources 
}: { 
  courseData: { id: string, title: string, units: BuilderUnit[] }, 
  resources: ResourceItem[] 
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const [activeDragItem, setActiveDragItem] = React.useState<ResourceItem | null>(null)
  const [units, setUnits] = React.useState(courseData.units)
  const [optimisticUnits, updateOptimisticUnits] = React.useOptimistic(
    units,
    (currentUnits, action: OptimisticBuilderAction) => {
      switch (action.type) {
        case "add-unit":
          return [...currentUnits, action.unit]
        case "replace-unit":
          return currentUnits.map((unit) => (unit.id === action.tempId ? action.unit : unit))
        case "remove-unit":
          return currentUnits.filter((unit) => unit.id !== action.tempId)
        case "add-concept":
          return currentUnits.map((unit) =>
            unit.id === action.unitId ? { ...unit, concepts: [...unit.concepts, action.concept] } : unit
          )
        case "replace-concept":
          return currentUnits.map((unit) =>
            unit.id === action.unitId
              ? {
                  ...unit,
                  concepts: unit.concepts.map((concept) =>
                    concept.id === action.tempId ? action.concept : concept
                  ),
                }
              : unit
          )
        case "remove-concept":
          return currentUnits.map((unit) =>
            unit.id === action.unitId
              ? { ...unit, concepts: unit.concepts.filter((concept) => concept.id !== action.tempId) }
              : unit
          )
        default:
          return currentUnits
      }
    }
  )
  const [isPending, startTransition] = React.useTransition()
  const [addingUnitId, setAddingUnitId] = React.useState<string | null>(null)
  const [addingConceptUnitId, setAddingConceptUnitId] = React.useState<string | null>(null)
  const [linkStatus, setLinkStatus] = React.useState<"idle" | "linking" | "linked" | "error">("idle")
  const activeNodeId = useWorkspaceStore((state) => state.activeNodeId)
  const activeNodeType = useWorkspaceStore((state) => state.activeNodeType)

  React.useEffect(() => {
    setUnits(courseData.units)
  }, [courseData.units])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const item = resources.find(r => r.id === active.id)
    if (item) {
      setActiveDragItem(item)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragItem(null)
    const { active, over } = event

    if (over && over.id === "inspector-drop-zone") {
      const resource = active.data.current as ResourceItem | undefined
      if (!activeNodeId || !activeNodeType || (resource?.type !== "media-asset" && resource?.type !== "content-snippet")) {
        return
      }

      setLinkStatus("linking")
      const result = await linkResourceToNode({
        nodeId: activeNodeId,
        nodeType: activeNodeType,
        resourceId: String(active.id),
        resourceType: resource.type,
      })
      setLinkStatus(result.ok ? "linked" : "error")
      setTimeout(() => setLinkStatus("idle"), 1800)
    }
  }

  const handleAddUnit = async () => {
    const tempId = `temp-unit-${Date.now()}`
    const order = optimisticUnits.length + 1
    const optimisticUnit: BuilderUnit = {
      id: tempId,
      type: "UNIT",
      title: `New Unit ${order}`,
      status: "DRAFT",
      order,
      concepts: [],
    }

    setAddingUnitId(tempId)
    startTransition(async () => {
      updateOptimisticUnits({ type: "add-unit", unit: optimisticUnit })
      const result = await createBuilderUnit(courseData.id)
      if (result.ok && result.unit) {
        updateOptimisticUnits({ type: "replace-unit", tempId, unit: result.unit })
        setUnits((current) => [...current, result.unit])
      } else {
        updateOptimisticUnits({ type: "remove-unit", tempId })
      }
      setAddingUnitId(null)
    })
  }

  const handleAddConcept = async (unitId: string) => {
    const tempId = `temp-concept-${Date.now()}`
    const targetUnit = optimisticUnits.find((unit) => unit.id === unitId)
    const title = `New Concept ${(targetUnit?.concepts.length ?? 0) + 1}`
    const optimisticConcept = {
      id: tempId,
      type: "CONCEPT" as const,
      title,
      status: "DRAFT" as const,
    }

    setAddingConceptUnitId(unitId)
    startTransition(async () => {
      updateOptimisticUnits({ type: "add-concept", unitId, concept: optimisticConcept })
      const result = await createBuilderConcept(unitId)
      if (result.ok && result.concept) {
        updateOptimisticUnits({ type: "replace-concept", unitId, tempId, concept: result.concept })
        setUnits((current) =>
          current.map((unit) =>
            unit.id === unitId ? { ...unit, concepts: [...unit.concepts, result.concept] } : unit
          )
        )
      } else {
        updateOptimisticUnits({ type: "remove-concept", unitId, tempId })
      }
      setAddingConceptUnitId(null)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-full flex flex-col"
    >
      <DndContext 
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <BuilderShell 
          canvas={
            <BuilderCanvas 
              units={optimisticUnits} 
              courseTitle={courseData.title} 
              onAddUnit={handleAddUnit}
              onAddConcept={handleAddConcept}
              isAddingUnit={isPending && addingUnitId !== null}
              addingConceptUnitId={isPending ? addingConceptUnitId : null}
            />
          }
          inspector={<Inspector linkStatus={linkStatus} />}
        />
        
        <StudioResourceShelf resources={resources} />

        {/* Drag Overlay for visual feedback */}
        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeDragItem ? (
            <div className="w-64 p-4 bg-surface border-2 border-primary rounded-2xl shadow-2xl scale-105 opacity-90 cursor-grabbing">
               <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                     <LibraryIcon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="text-sm font-black text-on-surface truncate uppercase tracking-tight">{activeDragItem.title}</p>
                     <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Ready to Link</p>
                  </div>
               </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </motion.div>
  )
}

function LibraryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  )
}
