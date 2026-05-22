"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  Clock, 
  Eye,
  FileText,
  Edit3,
  Network,
  ChevronRight,
  Loader2,
  LucideIcon,
  Gamepad2,
  Maximize2,
  User,
  HardDrive,
  Code,
  Sparkles,
  Monitor,
  Layers,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type ResourceItem } from "./resource-card"
import { Button } from "@/components/ui/button"
import { getResourceUsage, getResourceById, updateResourceMetadata } from "@/app/(admin)/admin/studio/actions"
import type { UsageLocation } from "@/lib/studio/usage-tracking"
import { ContentBlocksRenderer } from "@/components/content/content-blocks-renderer"

interface ResourceInspectorProps {
  resourceId: string | null
  onClose: () => void
}

export function ResourceInspector({ resourceId, onClose }: ResourceInspectorProps) {
  const [resource, setResource] = useState<ResourceItem | null>(null)
  const [usage, setUsage] = useState<UsageLocation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isScanningUsage, setIsScanningUsage] = useState(false)
  const [activeTab, setActiveTab] = useState<"edit" | "usage" | "technical">("edit")
  const [copiedId, setCopiedId] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Editing state
  const [isSaving, setIsSaving] = useState(false)
  const [editValues, setEditValues] = useState<{ title: string, alt: string, caption: string }>({
    title: "",
    alt: "",
    caption: ""
  })

  const handleFetchResource = useCallback(async () => {
    if (!resourceId) return
    setIsLoading(true)
    try {
      const result = await getResourceById(resourceId)
      if (result.ok && result.resource) {
        const res = result.resource as ResourceItem
        setResource(res)
        setEditValues({
          title: res.title || "",
          alt: res.alt || "",
          caption: res.caption || ""
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [resourceId])

  useEffect(() => {
    if (resourceId) {
      handleFetchResource()
    } else {
      setResource(null)
      setUsage([])
    }
  }, [resourceId, handleFetchResource])

  const handleUpdateMetadata = async () => {
    if (!resource || !resourceId || isSaving) return
    setIsSaving(true)
    try {
      const result = await updateResourceMetadata(resourceId, resource.type, editValues)
      if (result.ok) {
        setResource({ ...resource, ...editValues })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleScanUsage = useCallback(async () => {
    if (!resourceId) return
    setIsScanningUsage(true)
    try {
      const result = await getResourceUsage(resourceId)
      if (result.ok && result.usage) {
        setUsage(result.usage)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsScanningUsage(false)
    }
  }, [resourceId])

  useEffect(() => {
    if (resourceId && activeTab === "usage") {
      handleScanUsage()
    }
  }, [resourceId, activeTab, handleScanUsage])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  if (!resourceId) return null

  return (
    <>
      {/* Mobile Backdrop */}
      {resourceId && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] border-l border-outline-variant bg-surface-container-low flex flex-col transition-all duration-500 glass-panel shadow-2xl lg:relative lg:translate-x-0 lg:z-40",
        resourceId ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="p-5 border-b border-outline-variant flex items-center justify-between bg-surface-container/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <Edit3 className="size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-on-surface uppercase tracking-tight leading-none truncate max-w-[240px]">
                {resource?.title || "Resource Details"}
              </h3>
              <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest mt-1.5 opacity-40">
                {resource?.type === "media-asset" 
                  ? (resource.kind === "YOUTUBE_EMBED" ? "YouTube Module" : resource.kind === "PHET_SIMULATION" ? "Interactive Sim" : "Visual Asset") 
                  : "Content Snippet"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 hover:bg-surface-container-high rounded-xl transition-all text-on-surface-variant hover:text-on-surface hover:scale-110 active:scale-95"
          >
            <X className="size-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="size-12 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant animate-pulse">Synchronizing Metadata...</p>
          </div>
        ) : resource ? (
          <>
            <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
              {/* Preview Section */}
              <ResourcePreview 
                resource={resource} 
                onFullScreen={() => setIsFullScreen(true)} 
              />

              {/* Quick Actions Bar */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-outline-variant bg-surface-container/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "size-2.5 rounded-full",
                      resource.status === "PUBLISHED" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                    )} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface opacity-80">
                      {resource.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => copyToClipboard(resource.id)}
                      className="flex items-center gap-2 text-[10px] font-black text-primary hover:text-primary/80 transition-all uppercase tracking-tighter"
                    >
                      {copiedId ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copiedId ? "ID COPIED" : "Copy Reference ID"}
                    </button>
                    <div className="w-px h-4 bg-outline-variant/50" />
                    <Link 
                      href={resource.type === "media-asset" ? `/admin/studio/media-asset/${resource.id}` : `/admin/studio/content-snippet/${resource.id}`} 
                      className="text-[10px] font-black text-on-surface-variant hover:text-primary transition-all flex items-center gap-2 uppercase tracking-tighter"
                    >
                      <ExternalLink className="size-3.5" />
                      Editor
                    </Link>
                  </div>
              </div>

              {/* Navigation Tabs */}
              <div className="px-6 mt-6 border-b border-outline-variant flex gap-8 sticky top-0 bg-surface-container-low z-10">
                <TabButton 
                  label="Identity" 
                  icon={Edit3} 
                  isActive={activeTab === "edit"} 
                  onClick={() => setActiveTab("edit")} 
                />
                <TabButton 
                  label="Usage" 
                  icon={Network} 
                  isActive={activeTab === "usage"} 
                  onClick={() => setActiveTab("usage")} 
                />
                <TabButton 
                  label="Technical" 
                  icon={Code} 
                  isActive={activeTab === "technical"} 
                  onClick={() => setActiveTab("technical")} 
                />
              </div>

              {/* Tab Content Panels */}
              <div className="p-8 space-y-8">
                {activeTab === "edit" ? (
                  <div className="space-y-6">
                    <section className="space-y-5">
                      <InspectorField 
                          label="Display Title" 
                          value={editValues.title} 
                          onChange={(val) => setEditValues(prev => ({ ...prev, title: val }))}
                      />
                      {resource.type === "media-asset" && resource.kind === "IMAGE" && (
                        <>
                            <InspectorField 
                              label="Alt Text (SEO)" 
                              value={editValues.alt} 
                              isMultiline 
                              onChange={(val) => setEditValues(prev => ({ ...prev, alt: val }))}
                            />
                            <InspectorField 
                              label="Caption" 
                              value={editValues.caption} 
                              isMultiline 
                              onChange={(val) => setEditValues(prev => ({ ...prev, caption: val }))}
                            />
                        </>
                      )}
                      
                      {hasChanges(editValues, resource) && (
                        <div className="pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <Button 
                              onClick={handleUpdateMetadata} 
                              disabled={isSaving}
                              className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl gap-3 h-12 shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-xs"
                            >
                              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 fill-current" />}
                              {isSaving ? "Synchronizing..." : "Update Metadata"}
                            </Button>
                        </div>
                      )}
                    </section>
                    
                    <div className="pt-8 border-t border-dashed border-outline-variant space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40">Attribution</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <MetaStat label="Creator" value={resource.creatorName || "System"} icon={User} />
                          <MetaStat label="Modified" value={new Date(resource.updatedAt).toLocaleDateString()} icon={Clock} />
                        </div>
                    </div>
                  </div>
                ) : activeTab === "usage" ? (
                  <div className="space-y-6">
                    <div className="p-5 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-start gap-4">
                      <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Info className="size-4 text-primary" />
                      </div>
                      <p className="text-[11px] leading-relaxed text-on-surface-variant font-medium">
                        This audit shows all curriculum entities (Concepts, Questions, Snippets) that actively reference this unique asset ID.
                      </p>
                    </div>
                    
                    {isScanningUsage ? (
                      <div className="py-16 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="size-8 text-primary animate-spin opacity-50" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant animate-pulse opacity-40">Mapping Usage Graph...</p>
                      </div>
                    ) : usage.length > 0 ? (
                      <div className="space-y-3">
                        {usage.map((item, idx) => (
                          <UsageItem 
                              key={`${item.id}-${idx}`}
                              title={item.title} 
                              type={item.type.toUpperCase()} 
                              course={item.courseTitle || "Shared Module"} 
                              href={item.type === "concept" ? `/admin/studio/concept/${item.id}` : item.type === "question" ? `/admin/studio/question/${item.id}` : `/admin/studio/content-snippet/${item.id}`}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center space-y-3 bg-surface-container-low/50 rounded-[2.5rem] border border-outline-variant/30">
                        <p className="text-xs font-black text-on-surface-variant opacity-60 italic uppercase tracking-tighter">Zero curriculum references</p>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant opacity-30 font-black">Orphaned Asset: Safe to Archive</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-2 gap-4">
                        <MetaStat label="File Size" value={resource.bytes ? formatBytes(resource.bytes) : "N/A"} icon={HardDrive} />
                        <MetaStat label="Kind" value={resource.kind || "Snippet"} icon={Monitor} />
                        <MetaStat label="Dimensions" value={resource.width ? `${resource.width} × ${resource.height}` : "Variable"} icon={Maximize2} />
                        <MetaStat label="Type" value={resource.type === "media-asset" ? "Media" : "Content"} icon={Layers} />
                    </div>

                    {resource.contentBlocks && (
                      <div className="space-y-4 pt-6 border-t border-outline-variant">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40">Raw Block Structure</h4>
                            <button className="text-[10px] font-bold text-primary hover:underline">View in JSON Editor</button>
                          </div>
                          <pre className="p-5 rounded-3xl bg-surface-container-highest/50 border border-outline-variant text-[10px] font-mono text-on-surface-variant overflow-x-auto custom-scrollbar">
                            {JSON.stringify(resource.contentBlocks, null, 2)}
                          </pre>
                      </div>
                    )}

                    {resource.publicId && (
                      <div className="space-y-2 pt-6 border-t border-outline-variant">
                          <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 ml-1">External Storage ID</label>
                          <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-high border border-outline-variant/50">
                            <span className="text-[11px] font-mono text-on-surface truncate flex-1">{resource.publicId}</span>
                            <button className="p-1.5 hover:bg-surface-container-highest rounded-lg transition-colors">
                                <Copy className="size-3.5 text-primary" />
                            </button>
                          </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Navigation Actions */}
            <div className="p-6 border-t border-outline-variant bg-surface-container/50 backdrop-blur-md flex gap-4 shrink-0">
              <Button className="flex-1 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 gap-3 rounded-2xl h-12 text-white font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-[0.98]" asChild>
                  <Link href={resource.type === "media-asset" ? `/admin/studio/media-asset/${resource.id}` : `/admin/studio/content-snippet/${resource.id}`}>
                    <Edit3 className="size-4" />
                    Enter Full Editor
                  </Link>
              </Button>
              <Button variant="outline" className="size-12 p-0 rounded-2xl text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 hover:scale-110 active:scale-95 transition-all">
                  <Trash2 className="size-5" />
              </Button>
            </div>
          </>
        ) : null}
      </aside>

      {/* Full Screen Overlay */}
      {isFullScreen && resource && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
           <div className="p-6 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-md">
              <div className="flex items-center gap-4">
                 <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                    <Maximize2 className="size-6" />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">{resource.title}</h2>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">Full Scale View</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsFullScreen(false)}
                className="p-3 hover:bg-white/10 rounded-2xl transition-all text-white/60 hover:text-white hover:scale-110 active:scale-95"
              >
                <X className="size-6" />
              </button>
           </div>
           
           <div className="flex-1 flex items-center justify-center p-12 overflow-hidden">
              <div className="w-full h-full max-w-6xl rounded-[3rem] overflow-hidden border border-white/10 bg-black shadow-2xl relative group/fs">
                 <LargeScaleContent resource={resource} />
              </div>
           </div>
           
           <div className="p-8 flex justify-center bg-gradient-to-t from-black/40 to-transparent">
              <button 
                onClick={() => setIsFullScreen(false)}
                className="px-10 py-4 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-xl"
              >
                Close Viewer
              </button>
           </div>
        </div>
      )}
    </>
  )
}

function ResourcePreview({ resource, onFullScreen }: { resource: ResourceItem, onFullScreen: () => void }) {
  const [isLive, setIsPhetLive] = useState(false)
  const isImage = resource.type === "media-asset" && resource.kind === "IMAGE"
  const isVideo = resource.type === "media-asset" && resource.kind === "YOUTUBE_EMBED"
  const isPhet = resource.type === "media-asset" && resource.kind === "PHET_SIMULATION"
  const isSnippet = resource.type === "content-snippet"

  return (
    <div className="p-6">
      <div className={cn(
        "aspect-video relative rounded-[2.5rem] overflow-hidden border border-outline-variant bg-surface-container-lowest group shadow-2xl transition-all duration-500 ring-1 ring-white/10",
        isLive && "aspect-square lg:aspect-video"
      )}>
        {isImage && resource.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={resource.url} 
            alt={resource.alt || resource.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : isVideo && resource.videoId ? (
          <div className="w-full h-full bg-black">
             <iframe 
               src={`https://www.youtube.com/embed/${resource.videoId}?rel=0&modestbranding=1`}
               className="w-full h-full border-none"
               allowFullScreen
               title={resource.title}
             />
          </div>
        ) : isPhet && resource.url ? (
          <div className="w-full h-full flex flex-col">
             {isLive ? (
               <iframe 
                 src={resource.url}
                 className="w-full h-full border-none"
                 allowFullScreen
                 title={resource.title}
               />
             ) : (
               <div className="w-full h-full bg-primary/5 flex flex-col items-center justify-center space-y-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={resource.thumbnailUrl || "https://phet.colorado.edu/images/phet-logo-sim-page.png"} 
                    alt={resource.title}
                    className="h-16 object-contain opacity-40 grayscale"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPhetLive(true)}
                    className="rounded-2xl gap-3 bg-white/50 backdrop-blur-md border-primary/20 text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white transition-all shadow-lg"
                  >
                    <Gamepad2 className="size-4" />
                    Launch Live Simulation
                  </Button>
               </div>
             )}
          </div>
        ) : isSnippet && resource.contentBlocks ? (
          <div className="w-full h-full bg-surface-container p-8 overflow-y-auto custom-scrollbar">
             <div className="max-w-none">
                <ContentBlocksRenderer blocks={resource.contentBlocks} />
             </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center tibeb-pattern opacity-10" />
        )}
        
        {/* Overlay Controls */}
        {!isLive && !isVideo && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={onFullScreen}
              className="rounded-xl gap-2 backdrop-blur-lg bg-white/20 border-white/30 text-white hover:bg-white/40"
            >
              <Eye className="size-4" />
              View Full Scale
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function LargeScaleContent({ resource }: { resource: ResourceItem }) {
  const isImage = resource.type === "media-asset" && resource.kind === "IMAGE"
  const isVideo = resource.type === "media-asset" && resource.kind === "YOUTUBE_EMBED"
  const isPhet = resource.type === "media-asset" && resource.kind === "PHET_SIMULATION"
  const isSnippet = resource.type === "content-snippet"

  if (isImage && resource.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img 
        src={resource.url} 
        alt={resource.title}
        className="w-full h-full object-contain"
      />
    )
  }

  if (isVideo && resource.videoId) {
    return (
      <iframe 
        src={`https://www.youtube.com/embed/${resource.videoId}?rel=0&autoplay=1`}
        className="w-full h-full border-none"
        allowFullScreen
        allow="autoplay"
        title={resource.title}
      />
    )
  }

  if (isPhet && resource.url) {
    return (
      <iframe 
        src={resource.url}
        className="w-full h-full border-none bg-white"
        allowFullScreen
        title={resource.title}
      />
    )
  }

  if (isSnippet) {
    return (
      <div className="w-full h-full bg-background p-12 lg:p-24 overflow-y-auto custom-scrollbar">
         <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-6 text-center">
              <h1 className="text-5xl font-black text-on-surface uppercase tracking-tight leading-none">
                {resource.title}
              </h1>
              <div className="flex items-center justify-center gap-4">
                 <div className="h-1 w-24 bg-primary/20 rounded-full" />
                 <FileText className="size-5 text-primary animate-pulse" />
                 <div className="h-1 w-24 bg-primary/20 rounded-full" />
              </div>
            </div>
            
            <div className="bg-card backdrop-blur-sm rounded-[3rem] border border-outline-variant p-10 lg:p-20 shadow-2xl">
               <ContentBlocksRenderer blocks={resource.contentBlocks} />
            </div>
         </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center tibeb-pattern opacity-10" />
  )
}

function TabButton({ label, icon: Icon, isActive, onClick }: { 
  label: string, 
  icon: LucideIcon, 
  isActive: boolean, 
  onClick: () => void 
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 relative transition-all group",
        isActive ? "text-primary" : "text-on-surface-variant opacity-40 hover:opacity-100"
      )}
    >
      <Icon className={cn("size-3.5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
      {label}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_12px_rgba(25,75,223,0.6)] animate-in fade-in zoom-in-x duration-300" />
      )}
    </button>
  )
}

function InspectorField({ 
  label, 
  value, 
  isMultiline = false, 
  onChange 
}: { 
  label: string, 
  value: string, 
  isMultiline?: boolean,
  onChange: (val: string) => void
}) {
  return (
    <div className="space-y-2.5 group">
      <div className="flex items-center justify-between px-1">
        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40">{label}</label>
      </div>
      {isMultiline ? (
        <textarea 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Input ${label.toLowerCase()}...`}
          className="w-full bg-surface-container-highest/20 border border-outline-variant rounded-2xl p-4 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none h-32 custom-scrollbar transition-all shadow-sm group-focus-within:shadow-md placeholder:font-normal placeholder:opacity-30"
        />
      ) : (
        <input 
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Input ${label.toLowerCase()}...`}
          className="w-full bg-surface-container-highest/20 border border-outline-variant rounded-2xl px-4 py-3.5 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm group-focus-within:shadow-md placeholder:font-normal placeholder:opacity-30"
        />
      )}
    </div>
  )
}

function MetaStat({ label, value, icon: Icon }: { label: string, value: string | number, icon: LucideIcon }) {
  return (
    <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col gap-2">
       <div className="flex items-center gap-2 opacity-30">
          <Icon className="size-3 text-on-surface" />
          <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
       </div>
       <span className="text-xs font-black text-on-surface truncate">{value}</span>
    </div>
  )
}

function UsageItem({ title, type, course, href }: { title: string, type: string, course: string, href: string }) {
  return (
    <Link 
      href={href}
      className="group flex items-center justify-between p-4 rounded-2xl border border-outline-variant/50 bg-card hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer shadow-sm hover:shadow-md"
    >
      <div className="flex flex-col gap-1 min-w-0 pr-4">
        <span className="text-sm font-black text-on-surface group-hover:text-primary transition-colors truncate">{title}</span>
        <div className="flex items-center gap-2">
           <span className="text-[9px] text-primary font-black uppercase tracking-tighter">{course}</span>
           <div className="size-1 rounded-full bg-outline-variant" />
           <span className="text-[9px] text-on-surface-variant opacity-40 font-bold uppercase">{type}</span>
        </div>
      </div>
      <div className="shrink-0 size-8 rounded-xl bg-surface-container-high flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
        <ChevronRight className="size-4" />
      </div>
    </Link>
  )
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function hasChanges(edit: { title: string, alt: string, caption: string }, resource: ResourceItem) {
  return edit.title !== (resource.title || "") || 
         edit.alt !== (resource.alt || "") || 
         edit.caption !== (resource.caption || "")
}
