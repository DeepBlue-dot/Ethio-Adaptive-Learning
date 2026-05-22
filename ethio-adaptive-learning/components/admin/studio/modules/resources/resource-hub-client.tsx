"use client"

import React, { useMemo, useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { 
  LayoutGrid, 
  List, 
  ArrowUpDown, 
  FilterX,
  Plus,
  UploadCloud,
  Trash2, 
  Globe, 
  Lock, 
  X as XIcon,
  Loader2,
  SortAsc,
  Type,
  Clock,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ResourceCard, type ResourceItem } from "./resource-card"
import { ResourceInspector } from "./resource-inspector"
import { UploadResourceModal } from "./upload-resource-modal"
import { Button } from "@/components/ui/button"
import { bulkActionResources } from "@/app/(admin)/admin/studio/actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

  const openUploadModal = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("upload", "true")
    router.push(`${pathname}?${params.toString()}`)
  }

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
  const viewMode = (searchParams.get("view") as "grid" | "table") || "grid"
  const currentType = searchParams.get("type") || "all"
  const currentCollection = searchParams.get("collection")
  const searchQuery = searchParams.get("query")?.toLowerCase() || ""
  const currentSort = searchParams.get("sort") || "recent"

  const updateSort = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", sort)
    router.push(`${pathname}?${params.toString()}`)
  }

  // Filter and Sort items based on URL params
  const filteredItems = useMemo(() => {
    const filtered = initialItems.filter(item => {
      // Search
      if (searchQuery) {
        const text = [
          item.title,
          item.alt,
          item.caption,
          item.searchableContent
        ].join(" ").toLowerCase()
        
        if (!text.includes(searchQuery)) return false
      }
      
      // Type
      if (currentType === "image" && item.kind !== "IMAGE") return false
      if (currentType === "video" && item.kind !== "YOUTUBE_EMBED") return false
      if (currentType === "phet" && item.kind !== "PHET_SIMULATION") return false
      if (currentType === "snippet" && item.type !== "content-snippet") return false

      // Collection (Mock logic for MVP)
      if (currentCollection === "drafts" && item.status !== "DRAFT") return false
      
      return true
    })

    // Sorting
    return [...filtered].sort((a, b) => {
      switch (currentSort) {
        case "name":
          return a.title.localeCompare(b.title)
        case "type":
          return (a.kind || a.type).localeCompare(b.kind || b.type)
        case "oldest":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        case "recent":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })
  }, [initialItems, searchQuery, currentType, currentCollection, currentSort])

  const handleSelectResource = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (selectedResourceId === id) {
      params.delete("selected")
    } else {
      params.set("selected", id)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
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

  const setViewMode = (mode: "grid" | "table") => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", mode)
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push(pathname)
  }

  const sortLabels: Record<string, string> = {
    recent: "Recent",
    oldest: "Oldest",
    name: "A-Z",
    type: "Type"
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface-container-lowest/50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-white/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex bg-surface-container-high p-1 rounded-xl border border-outline-variant shadow-inner">
               <button 
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
               >
                 <LayoutGrid className="size-4" />
               </button>
               <button 
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewMode === "table" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
               >
                 <List className="size-4" />
               </button>
            </div>

            <div className="h-6 w-px bg-outline-variant" />
            
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
              Showing {filteredItems.length} resources
            </p>
          </div>

          <div className="flex items-center gap-3">
             <Button 
              onClick={() => setIsUploadModalOpen(true)}
              variant="outline" 
              size="sm" 
              className="gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
             >
                <UploadCloud className="size-3.5" />
                Upload
             </Button>
             
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="outline" size="sm" className="gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    <ArrowUpDown className="size-3.5" />
                    Sort: {sortLabels[currentSort]}
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="rounded-xl border-outline-variant">
                 <DropdownMenuItem onClick={() => updateSort("recent")} className="text-[10px] font-black uppercase tracking-widest gap-2">
                   <Clock className="size-3.5" /> Recent
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => updateSort("oldest")} className="text-[10px] font-black uppercase tracking-widest gap-2">
                   <Clock className="size-3.5 opacity-50" /> Oldest
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => updateSort("name")} className="text-[10px] font-black uppercase tracking-widest gap-2">
                   <SortAsc className="size-3.5" /> A-Z
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => updateSort("type")} className="text-[10px] font-black uppercase tracking-widest gap-2">
                   <Type className="size-3.5" /> Type
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>

             {searchParams.toString() && (
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-[10px] font-black uppercase tracking-widest"
               >
                  <FilterX className="size-3.5" />
                  Clear
               </Button>
             )}
          </div>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
          {filteredItems.length > 0 ? (
            <div className={cn(
              "grid gap-6",
              viewMode === "grid" 
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" 
                : "grid-cols-1"
            )}>
              {filteredItems.map(item => (
                <ResourceCard 
                  key={item.id} 
                  resource={item} 
                  isActive={selectedResourceId === item.id}
                  isSelected={selectedIds.has(item.id)}
                  onSelect={() => toggleSelection(item.id)}
                  onClick={() => handleSelectResource(item.id)}
                />
              ))}

              {/* Add New Placeholder Card */}
              <div 
                onClick={openUploadModal}
                className="group border-2 border-dashed border-outline-variant rounded-2xl aspect-video flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
              >
                <div className="size-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
                  <Plus className="size-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">
                  Add Resource
                </span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="size-20 rounded-full bg-surface-container-high flex items-center justify-center tibeb-pattern opacity-20">
                <FilterX className="size-10 text-on-surface-variant" />
              </div>
              <div>
                <h3 className="text-lg font-black text-on-surface uppercase tracking-tight">No resources found</h3>
                <p className="text-sm text-on-surface-variant max-w-xs mx-auto mt-2">
                  Try adjusting your filters or search query to find what you&apos;re looking for.
                </p>
              </div>
              <Button onClick={clearFilters} variant="outline" className="rounded-xl">
                Clear all filters
              </Button>
            </div>
          )}
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
        }}
      />

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-surface border border-outline-variant shadow-2xl rounded-2xl p-2 flex items-center gap-2 pl-4 pr-3 glass-panel border-primary/20">
             <div className="flex items-center gap-3 pr-4 border-r border-outline-variant">
                <div className="size-6 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-black">
                   {selectedIds.size}
                </div>
                <span className="text-xs font-black text-on-surface uppercase tracking-tight">Resources Selected</span>
             </div>
             
             <div className="flex items-center gap-1">
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
             
             <div className="w-px h-6 bg-outline-variant mx-1" />
             
             <button 
              onClick={() => setSelectedIds(new Set())}
              disabled={isBulkOperating}
              className="p-2 hover:bg-surface-container-high rounded-xl text-on-surface-variant transition-colors"
             >
                <XIcon className="size-5" />
             </button>
             
             {isBulkOperating && (
               <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                  <Loader2 className="size-5 text-primary animate-spin" />
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
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
        variant === "danger" 
          ? "text-rose-600 hover:bg-rose-50 disabled:opacity-50" 
          : "text-primary hover:bg-primary/5 disabled:opacity-50"
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  )
}