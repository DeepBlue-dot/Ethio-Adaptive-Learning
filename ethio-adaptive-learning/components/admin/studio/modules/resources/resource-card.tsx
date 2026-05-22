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
  Gamepad2,
  Globe,
  Lock,
  HardDrive,
  Clock
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
  const [imageError, setImageError] = React.useState(false)
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
        "group relative flex flex-col bg-surface-container border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary",
        isActive 
          ? "border-primary ring-2 ring-primary/20 shadow-xl scale-[1.02] z-10" 
          : isSelected 
            ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/10"
            : "border-outline-variant hover:border-primary/50 hover:shadow-lg"
      )}
    >
      {/* Media Preview */}
      <div className="aspect-video relative bg-surface-container-low overflow-hidden">
        {/* Checkbox Overlay (Enlarged for Touch) */}
        <div 
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.(e)
          }}
          className={cn(
            "absolute top-1 right-1 z-20 p-2 group/check transition-all",
            isSelected ? "opacity-100" : "opacity-0 lg:group-hover:opacity-100"
          )}
        >
          <div className={cn(
            "size-7 sm:size-6 rounded-xl border-2 flex items-center justify-center transition-all shadow-lg",
            isSelected 
              ? "bg-primary border-primary text-primary-foreground scale-110" 
              : "bg-black/20 border-white/40 hover:border-white"
          )}>
            {isSelected && <Check className="size-4 sm:size-3.5 stroke-[4px] animate-in zoom-in-50 duration-300" />}
          </div>
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
                src={(imageError || !resource.thumbnailUrl) ? "https://phet.colorado.edu/images/phet-logo-sim-page.png" : resource.thumbnailUrl} 
                alt={resource.title}
                fill
                onError={() => setImageError(true)}
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
          <div className={cn(
            "size-5 rounded-full backdrop-blur-md border flex items-center justify-center shadow-lg transition-transform hover:scale-110",
            resource.status === "PUBLISHED" 
              ? "bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:text-emerald-400" 
              : "bg-amber-500/20 text-amber-700 border-amber-500/30 dark:text-amber-400"
          )} title={resource.status}>
            {resource.status === "PUBLISHED" ? <Globe className="size-2.5" /> : <Lock className="size-2.5" />}
          </div>
          {isSnippet && (
            <div className="size-5 rounded-full bg-blue-500/20 text-blue-700 border border-blue-500/30 backdrop-blur-md flex items-center justify-center shadow-lg dark:text-blue-400" title="Snippet">
              <FileText className="size-2.5" />
            </div>
          )}
          {isPhet && (
            <div className="size-5 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-md flex items-center justify-center shadow-lg dark:text-primary-fixed" title="Interactive Simulation">
              <Gamepad2 className="size-2.5" />
            </div>
          )}
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 lg:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
          <div className="flex justify-between items-center text-white">
            <div className="flex gap-2">
              <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10 active:scale-95">
                <ExternalLink className="size-3.5" />
              </button>
              <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10 active:scale-95">
                <Info className="size-3.5" />
              </button>
            </div>
            <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10 active:scale-95">
              <MoreVertical className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Quick Actions Indicator (Visible when not hovering/active) */}
        <div className="absolute bottom-2 right-2 flex lg:hidden group-hover:opacity-0 transition-opacity">
           <div className="p-1.5 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10 text-white shadow-lg">
              <MoreVertical className="size-3" />
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
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" 
                  : resource.validationStatus === "warning"
                    ? "bg-warning-gold/20 text-warning-gold dark:text-amber-400"
                    : "bg-error-rose/20 text-error-rose dark:text-rose-400"
              )}>
                {resource.validationStatus.toUpperCase()}
              </span>
            </div>
          )}

          {/* Error Count Badge */}
          {isSnippet && resource.errors && resource.errors.length > 0 && (
            <p className="text-[9px] text-error-rose font-medium">
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
          <div className="flex items-center gap-4">
            {isImage ? (
              <div className="flex items-center gap-1.5" title="Dimensions">
                <ImageIcon className="size-3 text-primary/40" />
                <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-tighter">{resource.width}×{resource.height}</span>
              </div>
            ) : isVideo ? (
              <div className="flex items-center gap-1.5" title="YouTube Video">
                <Video className="size-3 text-rose-500/50" />
                <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-tighter">HD 1080p</span>
              </div>
            ) : isPhet ? (
              <div className="flex items-center gap-1.5" title="Interactive Simulation">
                <Gamepad2 className="size-3 text-primary/50" />
                <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-tighter">HTML5</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5" title="Content Snippet">
                <FileText className="size-3 text-blue-500/50" />
                <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-tighter">{resource.contentBlocks?.length || 1} Blocks</span>
              </div>
            )}

            {resource.bytes && (
              <div className="flex items-center gap-1.5 border-l border-outline-variant/30 pl-3" title="File Size">
                 <HardDrive className="size-2.5 text-on-surface-variant opacity-30" />
                 <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-tighter">
                   {formatBytes(resource.bytes)}
                 </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 opacity-30 italic group-hover:opacity-60 transition-opacity" title="Last Updated">
             <Clock className="size-2.5" />
             <p className="text-[9px] text-on-surface-variant font-medium">
               {new Date(resource.updatedAt).toLocaleDateString()}
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i]
}
