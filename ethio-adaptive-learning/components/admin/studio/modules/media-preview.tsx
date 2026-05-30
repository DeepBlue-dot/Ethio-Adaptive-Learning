"use client"

import React from "react"
import Image from "next/image"
import { ImageIcon, PlayCircle, Sparkles, AlertCircle } from "lucide-react"

import { getYouTubeEmbedUrl, normalizeYouTubeUrl } from "@/lib/cms/youtube"
import { cn } from "@/lib/utils"

type MediaPreviewProps = {
  kind: string
  url?: string | null
  publicId?: string | null
  title?: string | null
  className?: string
}

export function MediaPreview({ kind, url, publicId, title, className }: MediaPreviewProps) {
  if (kind === "IMAGE") {
    // Safety check: Don't try to render non-image URLs (like simulations or videos) in Image mode
    const isPotentiallySimOrVideo = url?.includes("phet.colorado.edu") || url?.includes("youtube.com") || url?.includes("youtu.be")
    const imageUrl = !isPotentiallySimOrVideo ? (url || (publicId ? `https://res.cloudinary.com/demo/image/upload/${publicId}` : null)) : null
    const isCloudinary = imageUrl?.includes("res.cloudinary.com")

    return (
      <div className={cn("relative aspect-video w-full overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-high shadow-inner group", className)}>
        {imageUrl ? (
          isCloudinary ? (
            <Image
              src={imageUrl}
              alt={title || "Image preview"}
              fill
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            /* Fallback to standard img for non-configured external hosts to avoid next/image errors */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title || "External image preview"}
              className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            />
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-on-surface-variant/40">
            <ImageIcon className="size-12 stroke-[1]" />
            <p className="text-[10px] font-black uppercase tracking-widest text-center px-8">
              {isPotentiallySimOrVideo ? "Kind Mismatch: URL is not an Image" : "Awaiting Image Source"}
            </p>
          </div>
        )}
        <div className="absolute top-4 left-4">
           <Badge icon={ImageIcon} label="Image" color="bg-blue-500" />
        </div>
      </div>
    )
  }

  if (kind === "YOUTUBE_EMBED") {
    let videoId: string | null = null
    let error: string | null = null

    if (url) {
      try {
        const normalized = normalizeYouTubeUrl(url)
        videoId = normalized.videoId
      } catch (e) {
        error = e instanceof Error ? e.message : "Invalid URL"
      }
    }

    return (
      <div className={cn("relative aspect-video w-full overflow-hidden rounded-3xl border border-outline-variant bg-slate-950 shadow-2xl", className)}>
        {videoId ? (
          <iframe
            src={getYouTubeEmbedUrl(videoId)}
            className="h-full w-full border-none"
            allowFullScreen
            title={title || "YouTube Preview"}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-white/20">
            <PlayCircle className="size-12 stroke-[1]" />
            <p className="text-[10px] font-black uppercase tracking-widest text-center px-8">
              {error || "Awaiting Video URL"}
            </p>
          </div>
        )}
        <div className="absolute top-4 left-4 pointer-events-none">
           <Badge icon={PlayCircle} label="YouTube" color="bg-red-500" />
        </div>
      </div>
    )
  }

  if (kind === "PHET_SIMULATION") {
    const isPhET = url?.includes("phet.colorado.edu")
    
    return (
      <div className={cn("relative aspect-video w-full overflow-hidden rounded-3xl border border-outline-variant bg-slate-900 shadow-2xl", className)}>
        {url && isPhET ? (
          <iframe
            src={url}
            className="h-full w-full border-none"
            allowFullScreen
            title={title || "Simulation Preview"}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-teal-400/20">
            <Sparkles className="size-12 stroke-[1]" />
            <p className="text-[10px] font-black uppercase tracking-widest text-center px-8">
              {!isPhET && url ? "Kind Mismatch: URL is not a PhET Simulation" : "Awaiting Simulation URL"}
            </p>
          </div>
        )}
        <div className="absolute top-4 left-4 pointer-events-none">
           <Badge icon={Sparkles} label="Simulation" color="bg-teal-500" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("aspect-video w-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-outline-variant bg-muted/30 text-on-surface-variant/40 gap-3", className)}>
       <AlertCircle className="size-10 stroke-[1]" />
       <p className="text-[10px] font-black uppercase tracking-widest text-center px-8 leading-relaxed">
         Select a media kind to begin<br/>the high-fidelity preview
       </p>
    </div>
  )
}

function Badge({ icon: Icon, label, color }: { icon: any, label: string, color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
       <div className={cn("size-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]", color)} />
       <span className="text-[9px] font-black uppercase tracking-widest text-white">{label}</span>
    </div>
  )
}
