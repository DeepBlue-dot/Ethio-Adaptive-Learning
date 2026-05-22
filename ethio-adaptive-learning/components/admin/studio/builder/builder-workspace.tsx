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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const item = resources.find(r => r.id === active.id)
    if (item) {
      setActiveDragItem(item)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null)
    const { active, over } = event

    if (over && over.id === "inspector-drop-zone") {
      console.log(`Dropped ${active.id} onto ${over.id}`)
      // Linking logic placeholder
    }
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
              units={courseData.units} 
              courseTitle={courseData.title} 
            />
          }
          inspector={<Inspector />}
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
