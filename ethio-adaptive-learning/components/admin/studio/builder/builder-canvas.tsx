"use client"

import React from "react"
import { Plus } from "lucide-react"
import { NodeCard } from "./node-card"
import { type BuilderUnit } from "@/lib/studio/builder-data"

export function BuilderCanvas({ 
  units, 
  courseTitle,
  onAddUnit,
  onAddConcept,
  isAddingUnit = false,
  addingConceptUnitId = null,
}: { 
  units: BuilderUnit[], 
  courseTitle: string 
  onAddUnit?: () => void
  onAddConcept?: (unitId: string) => void
  isAddingUnit?: boolean
  addingConceptUnitId?: string | null
}) {
  return (
    <div className="min-h-full w-full bg-surface-container-lowest/50 relative p-12 lg:p-24 overflow-y-auto custom-scrollbar">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-16 relative z-10">
        {/* Course Start */}
        <div className="flex flex-col items-center space-y-6">
           <div className="size-16 rounded-3xl bg-primary shadow-2xl shadow-primary/20 flex items-center justify-center text-white ring-4 ring-white">
              <Plus className="size-8 stroke-[3px]" />
           </div>
           <div className="text-center">
              <h2 className="text-3xl font-black uppercase tracking-tight text-on-surface">{courseTitle}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mt-2">Curriculum Origin</p>
           </div>
           <div className="h-16 w-0.5 bg-gradient-to-b from-primary to-outline-variant/30" />
        </div>

        {/* Units Loop */}
        <div className="space-y-24">
          {units.map((unit, unitIdx) => (
            <div key={unit.id} className="relative">
              <NodeCard node={unit} />
              
              {/* Concepts Grid for this unit */}
              <div className="mt-12 ml-12 lg:ml-24 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                 {/* Connection vertical line */}
                 <div className="absolute -left-12 lg:-left-24 top-0 bottom-0 w-0.5 bg-outline-variant/20" />
                 
                 {unit.concepts.map((concept) => (
                    <div key={concept.id} className="relative group">
                       {/* horizontal connector */}
                       <div className="absolute -left-12 lg:-left-24 top-1/2 -translate-y-1/2 w-12 lg:w-24 h-0.5 bg-outline-variant/20 group-hover:bg-primary/20 transition-colors" />
                       <NodeCard node={concept} />
                    </div>
                 ))}

                 {/* Quick Add Concept */}
                 <button
                   type="button"
                   onClick={() => onAddConcept?.(unit.id)}
                   disabled={addingConceptUnitId === unit.id}
                   className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary/30 transition-all group"
                 >
                    <div className="size-8 rounded-lg bg-surface-container-high flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                       <Plus className="size-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {addingConceptUnitId === unit.id ? "Adding..." : "Add Concept"}
                    </span>
                 </button>
              </div>

              {/* Connector to next unit */}
              {unitIdx < units.length - 1 && (
                <div className="flex justify-center my-12">
                   <div className="h-12 w-0.5 bg-outline-variant/30" />
                </div>
              )}
            </div>
          ))}

          {/* Quick Add Unit */}
          <div className="flex flex-col items-center">
             <div className="h-12 w-0.5 bg-outline-variant/30" />
             <button
               type="button"
               onClick={onAddUnit}
               disabled={isAddingUnit}
               className="flex items-center gap-4 px-8 py-6 rounded-[2.5rem] border-2 border-dashed border-outline-variant hover:border-primary hover:bg-primary/5 transition-all group shadow-sm"
             >
                <div className="size-10 rounded-2xl bg-surface-container-highest flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                   <Plus className="size-6" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-on-surface-variant group-hover:text-primary">
                  {isAddingUnit ? "Adding..." : "Add New Unit"}
                </span>
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
