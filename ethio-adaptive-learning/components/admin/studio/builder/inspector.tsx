"use client"

import React, { useState, useEffect } from "react"
import { 
  X, 
  Settings, 
  Database, 
  Network, 
  History, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowUpRight,
  LucideIcon
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useWorkspaceStore } from "@/lib/studio/use-workspace-store"
import { getInspectorModel, updateInspectorMetadata } from "@/app/(admin)/admin/studio/actions"
import { type CmsEditorModel } from "@/lib/cms/types"
import { Button } from "@/components/ui/button"
import { CmsFieldInput } from "@/components/cms/cms-field"
import { useDroppable } from "@dnd-kit/core"

export function Inspector({ linkStatus = "idle" }: { linkStatus?: "idle" | "linking" | "linked" | "error" }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "inspector-drop-zone",
  })

  const activeNodeId = useWorkspaceStore((state) => state.activeNodeId)
  const activeNodeType = useWorkspaceStore((state) => state.activeNodeType)
  const setActiveNode = useWorkspaceStore((state) => state.setActiveNode)
  
  const [model, setModel] = useState<CmsEditorModel | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"general" | "authoring" | "technical">("general")
  
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const item = model?.item

  useEffect(() => {
    let isMounted = true

    const loadModel = async () => {
      if (!activeNodeId) {
        if (isMounted) setModel(null)
        return
      }

      setIsLoading(true)
      const modelType = activeNodeType ?? "concept"
      const modelData = await getInspectorModel(modelType, activeNodeId)

      if (isMounted) {
        setModel(modelData)
        setIsLoading(false)
      }
    }

    loadModel()

    return () => { isMounted = false }
  }, [activeNodeId, activeNodeType])

  const handleFieldChange = async (fieldName: string, value: unknown) => {
    if (!model || !activeNodeId || !model.item) return

    setSaveStatus("saving")
    
    // Optimistic update
    const updatedModel = {
      ...model,
      item: {
        ...model.item,
        data: {
          ...model.item.data,
          [fieldName]: value,
        }
      }
    }
    setModel(updatedModel)

    const result = await updateInspectorMetadata(model.definition.key, activeNodeId, { [fieldName]: value })
    
    if (result.ok) {
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } else {
      setSaveStatus("error")
    }
  }

  if (!activeNodeId) return null

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full overflow-hidden transition-all duration-500",
        isOver ? "bg-primary/10 ring-4 ring-primary/20 ring-inset" : "bg-surface-container-low/30 backdrop-blur-xl"
      )}
    >
      {/* 1. Header */}
      <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface/50">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
             {isLoading ? <Loader2 className="size-5 animate-spin" /> : <Settings className="size-5" />}
          </div>
          <div>
            <h3 className="text-sm font-black text-on-surface uppercase tracking-tight leading-none">
              {isLoading ? "Loading..." : (model?.item?.title || "Properties")}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
               {saveStatus === "saving" ? (
                 <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-primary animate-pulse">
                    <Loader2 className="size-2 animate-spin" /> Saving
                 </span>
               ) : saveStatus === "saved" ? (
                 <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-emerald-600">
                    <CheckCircle2 className="size-2" /> Synced
                 </span>
               ) : (
                 <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">
                   {linkStatus === "linking" ? "Linking resource" : linkStatus === "linked" ? "Resource linked" : linkStatus === "error" ? "Link failed" : model?.definition.label || "Entity"}
                 </span>
               )}
            </div>
          </div>
        </div>
        <button 
          onClick={() => setActiveNode(null)}
          className="p-2 hover:bg-surface-container-high rounded-xl text-on-surface-variant transition-all active:scale-90"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* 2. Tabs */}
      <div className="px-6 border-b border-outline-variant flex gap-6 bg-surface/30">
         <InspectorTab label="General" active={activeTab === "general"} onClick={() => setActiveTab("general")} icon={Database} />
         <InspectorTab label="Authoring" active={activeTab === "authoring"} onClick={() => setActiveTab("authoring")} icon={Network} />
         <InspectorTab label="Technical" active={activeTab === "technical"} onClick={() => setActiveTab("technical")} icon={History} />
      </div>

      {/* 3. Fields Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
        {isLoading ? (
           <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-20">
              <Loader2 className="size-10 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Retreiving Schema</p>
           </div>
        ) : model?.item ? (
          <>
            {activeTab === "general" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                 {/* Asset Drop Zone */}
                 <div className={cn(
                    "group relative border-2 border-dashed rounded-[2.5rem] p-10 transition-all duration-700 flex flex-col items-center justify-center text-center gap-5 overflow-hidden",
                    isOver 
                      ? "border-primary bg-primary/20 scale-[0.98] shadow-inner" 
                      : "border-outline-variant hover:border-primary/30 bg-surface/30 hover:bg-surface/50 shadow-sm"
                 )}>
                    {/* Visual Pulse for active dragging */}
                    {isOver && (
                       <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
                    )}

                    <div className={cn(
                      "size-20 rounded-[2rem] flex items-center justify-center transition-all duration-700 shadow-2xl",
                      isOver ? "bg-primary text-white scale-110 rotate-3" : "bg-surface-container-highest text-on-surface-variant/20 group-hover:text-primary/20"
                    )}>
                       <Database className={cn("size-10 transition-transform duration-500", isOver && "animate-bounce")} />
                    </div>
                    <div>
                       <h4 className={cn(
                         "text-sm font-black uppercase tracking-[0.2em] mb-2 transition-colors duration-500",
                         isOver ? "text-primary" : "text-on-surface-variant opacity-60"
                       )}>
                         {isOver ? "Release to Link" : linkStatus === "linked" ? "Linked" : linkStatus === "error" ? "Link Failed" : "Asset Drop Zone"}
                       </h4>
                       <p className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-[0.2em] leading-relaxed max-w-[200px] mx-auto">
                         Drag media from the shelf to establish curriculum relations
                       </p>
                    </div>
                 </div>

                 {/* Manually render key fields for density */}
                 <InspectorFieldGroup label="Identity">
                    <div className="space-y-4">
                       <SimpleInput 
                         label="Title" 
                         value={(item?.data.title as string) || ""} 
                         onChange={(val) => handleFieldChange("title", val)}
                       />
                       <SimpleInput 
                         label="Slug" 
                         value={(item?.data.slug as string) || ""} 
                         onChange={(val) => handleFieldChange("slug", val)}
                       />
                    </div>
                 </InspectorFieldGroup>

                 <InspectorFieldGroup label="Publication">
                    <div className="bg-surface p-4 rounded-2xl border border-outline-variant shadow-sm flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className={cn(
                            "size-2.5 rounded-full",
                            item?.lifecycle?.status === "PUBLISHED" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                          )} />
                          <span className="text-xs font-black uppercase tracking-tight text-on-surface">{item?.lifecycle?.status}</span>
                       </div>
                       <Button size="sm" className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest">
                         Manage
                       </Button>
                    </div>
                 </InspectorFieldGroup>
              </div>
            )}

            {activeTab === "authoring" && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  <InspectorFieldGroup label="Relations & Attributes">
                     <div className="space-y-6">
                        {/* Render fields from the schema that are in the 'Authoring' or similar sections */}
                        {model.definition.fields.filter(f => !["title", "slug"].includes(f.name)).map(field => (
                          <div key={field.name} className="space-y-2">
                             <label className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 ml-1">{field.label}</label>
                             <CmsFieldInput 
                                field={field}
                                value={item?.data[field.name]}
                                referenceOptions={model.referenceOptions}
                                userRole="ADMIN" 
                                onChange={(val: unknown) => handleFieldChange(field.name, val)}
                             />
                          </div>
                        ))}
                     </div>
                  </InspectorFieldGroup>
               </div>
            )}

            {activeTab === "technical" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                 <InspectorFieldGroup label="System Identifiers">
                    <div className="space-y-4">
                       <div className="p-3 rounded-xl bg-surface-container-highest/50 border border-outline-variant font-mono text-[10px] text-on-surface-variant break-all">
                          <span className="opacity-40 uppercase block mb-1">Entity ID</span>
                          {item?.id}
                       </div>
                    </div>
                 </InspectorFieldGroup>
                 <div className="pt-4 flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl h-12 gap-2 text-[10px] font-black uppercase tracking-widest" asChild>
                       <Link href={`/admin/studio/editor/${model.definition.key}/${model.item.id}`}>
                          <Eye className="size-4" /> Full View
                       </Link>
                    </Button>
                    <Button className="flex-1 rounded-xl h-12 gap-2 text-[10px] font-black uppercase tracking-widest bg-primary" asChild>
                       <Link href={`/admin/studio/editor/${model.definition.key}/${model.item.id}`}>
                          <ArrowUpRight className="size-4" /> Deep Editor
                       </Link>
                    </Button>
                 </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center space-y-4 opacity-40">
             <AlertCircle className="size-10 mx-auto" />
             <p className="text-xs font-black uppercase tracking-widest">Metadata Unavailable</p>
          </div>
        )}
      </div>
    </div>
  )
}

function InspectorTab({ label, active, onClick, icon: Icon }: { label: string, active: boolean, onClick: () => void, icon: LucideIcon }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 relative transition-all group",
        active ? "text-primary" : "text-on-surface-variant opacity-40 hover:opacity-100"
      )}
    >
      <Icon className={cn("size-3.5 transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")} />
      {label}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_12px_rgba(25,75,223,0.6)] animate-in fade-in zoom-in-x duration-300" />
      )}
    </button>
  )
}

function InspectorFieldGroup({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
       <div className="flex items-center gap-3">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/30">{label}</h4>
          <div className="h-px bg-outline-variant/20 flex-1" />
       </div>
       {children}
    </div>
  )
}

function SimpleInput({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
  return (
    <div className="space-y-2 group">
       <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-30 ml-1">{label}</label>
       <input 
          type="text" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-xs font-bold text-on-surface focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm group-focus-within:shadow-md"
       />
    </div>
  )
}
