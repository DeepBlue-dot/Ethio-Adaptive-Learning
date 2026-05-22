"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { 
  X as XIcon,
  Loader2,
  Globe, 
  Lock, 
  Trash2,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type ResourceItem } from "./resource-card"
import { ResourceInspector } from "./resource-inspector"
import { UploadResourceModal } from "./upload-resource-modal"
import { ResourceBrowser } from "./resource-browser"
import { bulkActionResources } from "@/app/(admin)/admin/studio/actions"

interface ResourceHubClientProps {
  initialItems: ResourceItem[]
}

export function ResourceHubClient({ initialItems }: ResourceHubClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isUploadParamSet = searchParams.get("upload") === "true"
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(isUploadParamSet)

  // Sync state with URL param
  useEffect(() => {
    setIsUploadModalOpen(isUploadParamSet)
  }, [isUploadParamSet])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkOperating, setIsBulkOperating] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        const sidebarSearch = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        sidebarSearch?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const selectedResourceId = searchParams.get("selected")
  const filterType = searchParams.get("type") || "all"
  const filterQuery = searchParams.get("query") || ""
  const filterCollection = searchParams.get("collection") || ""

  const handleSelectResource = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (selectedResourceId === id) {
      params.delete("selected")
    } else {
      params.set("selected", id)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleToggleResourceSelection = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleBulkAction = async (intent: "publish" | "unpublish" | "delete") => {
    if (selectedIds.size === 0 || isBulkOperating) return
    
    if (intent === "delete" && !confirm(`Are you sure you want to delete ${selectedIds.size} resources?`)) return
    
    setIsBulkOperating(true)
    const itemsToProcess = initialItems
      .filter(item => selectedIds.has(item.id))
      .map(item => ({ id: item.id, type: item.type as "media-asset" | "content-snippet" }))
      
    try {
      const result = await bulkActionResources(itemsToProcess, intent)
      if (result.ok) {
        setSelectedIds(new Set())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsBulkOperating(false)
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background/50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12">
          <ResourceBrowser 
            initialItems={initialItems}
            filterType={filterType}
            filterQuery={filterQuery}
            filterCollection={filterCollection}
            onSelect={handleSelectResource}
            selectedId={selectedResourceId}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleResourceSelection}
          />
        </div>
      </div>

      {/* Right Sidebar (Inspector) */}
      <ResourceInspector 
        resourceId={selectedResourceId} 
        onClose={() => {
          const params = new URLSearchParams(searchParams.toString())
          params.delete("selected")
          router.push(`${pathname}?${params.toString()}`)
        }}
      />

      <UploadResourceModal 
        isOpen={isUploadModalOpen}
        onClose={() => {
          const params = new URLSearchParams(searchParams.toString())
          params.delete("upload")
          router.push(`${pathname}?${params.toString()}`)
          setIsUploadModalOpen(false)
        }}
      />

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 sm:bottom-8 left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 z-[90] px-4 sm:px-0 animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-surface-container/95 border border-outline-variant shadow-2xl rounded-[1.5rem] sm:rounded-2xl p-2 flex items-center justify-between sm:justify-start gap-2 sm:gap-4 pl-4 sm:pl-4 pr-2 sm:pr-3 glass-panel border-primary/20 w-full max-w-lg mx-auto sm:w-auto overflow-hidden">
             <div className="flex items-center gap-2 sm:gap-3 pr-2 sm:pr-4 border-r border-outline-variant shrink-0">
                <div className="size-8 sm:size-6 rounded-xl sm:rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs sm:text-[10px] font-black shadow-lg shadow-primary/20">
                   {selectedIds.size}
                </div>
             </div>
             
             <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 flex-1 sm:flex-none justify-center">
                <BulkButton 
                  label="Publish" 
                  icon={Globe} 
                  onClick={() => handleBulkAction("publish")} 
                  disabled={isBulkOperating}
                />
                <BulkButton 
                  label="Unpublish" 
                  icon={Lock} 
                  onClick={() => handleBulkAction("unpublish")} 
                  disabled={isBulkOperating}
                />
                <BulkButton 
                  label="Delete" 
                  icon={Trash2} 
                  variant="danger"
                  onClick={() => handleBulkAction("delete")} 
                  disabled={isBulkOperating}
                />
             </div>
             
             <div className="w-px h-6 bg-outline-variant mx-1 hidden sm:block shrink-0" />
             
             <button 
              onClick={() => setSelectedIds(new Set())}
              disabled={isBulkOperating}
              className="p-2.5 sm:p-2 hover:bg-surface-container-high rounded-xl text-on-surface-variant transition-colors shrink-0 active:scale-90"
              title="Clear Selection"
             >
                <XIcon className="size-5 sm:size-5" />
             </button>
             
             {isBulkOperating && (
               <div className="absolute inset-0 bg-surface-container/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
                  <Loader2 className="size-6 text-primary animate-spin" />
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  )
}

function BulkButton({ label, icon: Icon, onClick, disabled, variant = "default" }: {
  label: string
  icon: LucideIcon
  onClick: () => void
  disabled: boolean
  variant?: "default" | "danger"
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "flex items-center gap-2 px-2.5 sm:px-3 py-2.5 sm:py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shrink-0",
        variant === "danger" 
          ? "text-rose-600 hover:bg-rose-500/10 disabled:opacity-50" 
          : "text-primary hover:bg-primary/5 disabled:opacity-50"
      )}
    >
      <Icon className="size-4 sm:size-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
