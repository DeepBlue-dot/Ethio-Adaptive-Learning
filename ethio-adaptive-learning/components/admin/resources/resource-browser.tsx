"use client"

import React, { useMemo, useState } from "react"
import { 
  LayoutGrid, 
  List, 
  ArrowUpDown, 
  FilterX,
  SortAsc,
  Type,
  Clock,
  Search
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ResourceCard, type ResourceItem } from "./resource-card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ResourceBrowserProps {
  initialItems: ResourceItem[]
  onSelect?: (id: string) => void
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  selectedId?: string | null
  compact?: boolean
}

export function ResourceBrowser({ 
  initialItems, 
  onSelect, 
  selectedIds,
  onToggleSelect,
  selectedId: controlledSelectedId,
  compact = false 
}: ResourceBrowserProps) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentType, setCurrentType] = useState("all")
  const [currentSort, setCurrentSort] = useState("recent")

  // Filter and Sort items
  const filteredItems = useMemo(() => {
    const filtered = initialItems.filter(item => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const text = [
          item.title,
          item.alt,
          item.caption,
          item.searchableContent
        ].join(" ").toLowerCase()
        
        if (!text.includes(query)) return false
      }
      
      // Type
      if (currentType === "image" && item.kind !== "IMAGE") return false
      if (currentType === "video" && item.kind !== "YOUTUBE_EMBED") return false
      if (currentType === "phet" && item.kind !== "PHET_SIMULATION") return false
      if (currentType === "snippet" && item.type !== "content-snippet") return false

      return true
    })

    // Sorting
    return [...filtered].sort((a, b) => {
      switch (currentSort) {
        case "name":
          return a.title.localeCompare(b.title)
        case "type":
          return (a.kind || a.type || "").localeCompare(b.kind || b.type || "")
        case "oldest":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        case "recent":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })
  }, [initialItems, searchQuery, currentType, currentSort])

  const sortLabels: Record<string, string> = {
    recent: "Recent",
    oldest: "Oldest",
    name: "A-Z",
    type: "Type"
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* 1. Filter Bar */}
      <div className={cn(
        "flex flex-wrap items-center justify-between gap-4",
        compact ? "px-0" : ""
      )}>
        <div className="flex items-center gap-3 flex-1 min-w-60">
           <div className="relative flex-1 max-w-sm group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant opacity-40 group-focus-within:opacity-100 group-focus-within:text-primary transition-all" />
              <input 
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-on-surface"
              />
           </div>
           <select 
             value={currentType}
             onChange={(e) => setCurrentType(e.target.value)}
             className="bg-surface-container border border-outline-variant rounded-xl py-2 px-3 text-xs font-black uppercase tracking-widest text-on-surface-variant focus:outline-none focus:border-primary transition-all"
           >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="phet">Sims</option>
              <option value="snippet">Snippets</option>
           </select>
        </div>

        <div className="flex items-center gap-2">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-outline-variant hover:bg-surface-container">
                   <ArrowUpDown className="size-3.5" />
                   {sortLabels[currentSort]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-outline-variant bg-surface-container backdrop-blur-md">
                <DropdownMenuItem onClick={() => setCurrentSort("recent")} className="text-[10px] font-black uppercase tracking-widest gap-2">
                  <Clock className="size-3.5" /> Recent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentSort("oldest")} className="text-[10px] font-black uppercase tracking-widest gap-2">
                  <Clock className="size-3.5 opacity-50" /> Oldest
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentSort("name")} className="text-[10px] font-black uppercase tracking-widest gap-2">
                  <SortAsc className="size-3.5" /> A-Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentSort("type")} className="text-[10px] font-black uppercase tracking-widest gap-2">
                  <Type className="size-3.5" /> Type
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex bg-surface-container-high p-1 rounded-xl border border-outline-variant shadow-inner">
               <button 
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewMode === "grid" ? "bg-surface-container text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
               >
                 <LayoutGrid className="size-4" />
               </button>
               <button 
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewMode === "table" ? "bg-surface-container text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                )}
               >
                 <List className="size-4" />
               </button>
            </div>
        </div>
      </div>

      {/* 2. Grid */}
      <div className={cn(
        "grid gap-6",
        viewMode === "grid" 
          ? (compact ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" : "grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5")
          : "grid-cols-1"
      )}>
        {filteredItems.map((item, i) => (
          <div key={`${item.id ?? 'item'}-${i}`}>
            <ResourceCard 
              resource={item} 
              isActive={controlledSelectedId === item.id}
              isSelected={selectedIds?.has(item.id)}
              onClick={() => onSelect?.(item.id)}
              onSelect={() => onToggleSelect?.(item.id)}
            />
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4 opacity-40">
             <FilterX className="size-12 mx-auto" />
             <p className="text-sm font-black uppercase tracking-[0.2em]">No results found</p>
          </div>
        )}
      </div>
    </div>
  )
}
