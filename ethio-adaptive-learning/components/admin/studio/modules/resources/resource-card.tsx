"use client"

import React from "react"
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  MoreVertical, 
  ExternalLink, 
  Info,
  Check,
  Gamepad2
} from "lucide-react"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { MediaAssetKind } from "@prisma/client"
import { type CmsContentBlock } from "@/lib/cms/content-blocks"

export interface ResourceItem {
  id: string
  type: "media-asset" | "content-snippet"
  kind?: MediaAssetKind
  title: string
  url?: string
  thumbnailUrl?: string
  publicId?: string
  videoId?: string
  alt?: string
  caption?: string
  width?: number
  height?: number
  bytes?: number | null
  status: string
  updatedAt: string | Date
  searchableContent?: string
  createdById?: string | null
  authorId?: string | null
  creatorName?: string
  contentBlocks?: CmsContentBlock[] // Raw content for snippets
  // YouTube specialized metadata
  duration?: number
  author?: string
  publishedAt?: string
  // Snippet specialized metadata
  errors?: string[]
  preview?: string
  validationStatus?: "valid" | "invalid" | "warning"
}

interface ResourceCardProps {
  resource: ResourceItem
  isActive: boolean
  isSelected?: boolean
  onSelect?: (e: React.MouseEvent | React.KeyboardEvent) => void
  onClick: () => void
}

export function ResourceCard({ resource, isActive, isSelected, onSelect, onClick }: ResourceCardProps) {
  const isImage = resource.kind === "IMAGE"
  const isVideo = resource.kind === "YOUTUBE_EMBED"
  const isPhet = resource.kind === "PHET_SIMULATION"
  const isSnippet = resource.type === "content-snippet"

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onClick()
    } else if (e.key === "x" || e.key === "X") {
      e.preventDefault()
      onSelect?.(e)
    }
  }

  return (
    <div 
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={isActive}
      aria-label={`${resource.title} (${resource.kind || resource.type})`}
      className={cn(
        "group relative flex flex-col bg-surface border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary",
        isActive 
          ? "border-primary ring-2 ring-primary/20 shadow-xl scale-[1.02] z-10" 
          : isSelected 
            ? "border-primary bg-primary/5 shadow-md"
            : "border-outline-variant hover:border-primary/50 hover:shadow-lg"
      )}
    >
      {/* Media Preview */}
      <div className="aspect-video relative bg-surface-container-low overflow-hidden">
        {/* Checkbox Overlay */}
        <div 
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.(e)
          }}
          className={cn(
            "absolute top-2 right-2 z-20 size-5 rounded-lg border-2 flex items-center justify-center transition-all",
            isSelected 
              ? "bg-primary border-primary text-white" 
              : "bg-black/20 border-white/40 opacity-0 group-hover:opacity-100 hover:border-white"
          )}
        >
          {isSelected && <Check className="size-3.5 stroke-[4px]" />}
        </div>

        {isImage && resource.url ? (
          <Image 
            src={resource.url} 
            alt={resource.alt || resource.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : isVideo && resource.thumbnailUrl ? (
          <div className="relative w-full h-full">
            <Image 
              src={resource.thumbnailUrl} 
              alt={resource.title}
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
              <div className="size-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-xl group-hover:scale-110 transition-transform">
                <Video className="size-5 fill-current" />
              </div>
            </div>
          </div>
        ) : isPhet ? (
          <div className="relative w-full h-full bg-primary/5">
             <Image 
                src={resource.thumbnailUrl || "https://phet.colorado.edu/images/phet-logo-sim-page.png"} 
                alt={resource.title}
                fill
                className="object-contain p-4 opacity-40 group-hover:opacity-60 transition-opacity"
                unoptimized
             />
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-12 rounded-2xl bg-primary/10 backdrop-blur-sm flex items-center justify-center border border-primary/20 text-primary shadow-lg group-hover:scale-110 transition-transform">
                   <Gamepad2 className="size-6" />
                </div>
             </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest tibeb-pattern opacity-10">
            {isSnippet ? <FileText className="size-8 text-primary" /> : <ImageIcon className="size-8 text-primary" />}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border",
            resource.status === "PUBLISHED" 
              ? "bg-teal-500/10 text-teal-700 border-teal-500/20" 
              : "bg-amber-500/10 text-amber-700 border-amber-500/20"
          )}>
            {resource.status}
          </span>
          {isSnippet && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-700 border border-blue-500/20 backdrop-blur-md">
              Snippet
            </span>
          )}
          {isPhet && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 backdrop-blur-md">
              Interactive
            </span>
          )}
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
          <div className="flex justify-between items-center text-white">
            <div className="flex gap-2">
              <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10">
                <ExternalLink className="size-3.5" />
              </button>
              <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10">
                <Info className="size-3.5" />
              </button>
            </div>
            <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10">
              <MoreVertical className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h4 className="font-bold text-xs text-on-surface truncate group-hover:text-primary transition-colors">
          {resource.title}
        </h4>
        
        {/* Specialized Metadata */}
        <div className="flex flex-col gap-1 mt-2">
          {/* YouTube Metadata */}
          {isVideo && resource.author && (
            <p className="text-[10px] text-on-surface-variant opacity-70">
              By: {resource.author}
            </p>
          )}

          {/* Snippet Validation Status */}
          {isSnippet && resource.validationStatus && (
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                resource.validationStatus === "valid" 
                  ? "bg-green-500/20 text-green-700" 
                  : resource.validationStatus === "warning"
                    ? "bg-yellow-500/20 text-yellow-700"
                    : "bg-red-500/20 text-red-700"
              )}>
                {resource.validationStatus.toUpperCase()}
              </span>
            </div>
          )}

          {/* Error Count Badge */}
          {isSnippet && resource.errors && resource.errors.length > 0 && (
            <p className="text-[9px] text-red-600 font-medium">
              {resource.errors.length} validation issue(s)
            </p>
          )}

          {/* Snippet Preview */}
          {isSnippet && resource.preview && (
            <p className="text-[9px] text-on-surface-variant opacity-60 line-clamp-2">
              {resource.preview}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/30">
          <p className="text-[10px] text-on-surface-variant font-medium opacity-60">
            {isImage ? `${resource.width}x${resource.height}` : isVideo ? "YouTube" : isPhet ? "PhET Simulation" : "Text Snippet"}
          </p>
          <p className="text-[9px] text-on-surface-variant italic">
            {new Date(resource.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
