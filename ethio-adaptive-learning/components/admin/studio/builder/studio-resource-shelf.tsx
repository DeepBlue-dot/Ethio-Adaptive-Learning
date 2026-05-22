"use client"

import React from "react"
import { AssetShelf } from "@/components/admin/studio/layout/asset-shelf"
import { ResourceBrowser } from "@/components/admin/resources/resource-browser"
import { type ResourceItem } from "@/components/admin/resources/resource-card"
import { Button } from "@/components/ui/button"
import { Command } from "lucide-react"

interface StudioResourceShelfProps {
  resources: ResourceItem[]
}

export function StudioResourceShelf({ resources }: StudioResourceShelfProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [isActioning, setIsActioning] = React.useState(false)

  const handleToggleSelect = (id: string) => {
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

  const handleQuickLink = async () => {
    if (selectedIds.size === 0) return
    setIsActioning(true)
    try {
      console.log("Studio shelf quick action for:", Array.from(selectedIds))
    } finally {
      setIsActioning(false)
    }
  }

  return (
    <AssetShelf>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-highest/80 px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">Studio Asset Shelf</p>
            <p className="text-sm font-semibold text-on-surface/80">Quick access to shared resources</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                {selectedIds.size} selected
              </span>
            )}
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant bg-surface/70">
            <Button 
              size="sm" 
              onClick={handleQuickLink}
              disabled={isActioning}
              className="rounded-full"
            >
              <Command className="size-4" />
              Link Selection
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedIds(new Set())}
              disabled={isActioning}
              className="rounded-full"
            >
              Clear
            </Button>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-hidden">
          <ResourceBrowser
            initialItems={resources}
            compact
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
          />
        </div>
      </div>
    </AssetShelf>
  )
}
