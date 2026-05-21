"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  Globe, 
  Lock, 
  Clock, 
  Eye,
  Edit3,
  Network,
  ChevronRight,
  Loader2,
  Video,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type ResourceItem } from "./resource-card"
import { Button } from "@/components/ui/button"
import { getResourceUsage, getResourceById, updateResourceMetadata } from "@/app/(admin)/admin/studio/actions"
import type { UsageLocation } from "@/lib/studio/usage-tracking"

interface ResourceInspectorProps {
  resourceId: string | null
  onClose: () => void
}

export function ResourceInspector({ resourceId, onClose }: ResourceInspectorProps) {
  const [resource, setResource] = useState<ResourceItem | null>(null)
  const [usage, setUsage] = useState<UsageLocation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isScanningUsage, setIsScanningUsage] = useState(false)
  const [activeTab, setActiveTab] = useState<"edit" | "usage">("edit")
  const [copiedId, setCopiedId] = useState(false)

  // Editing state
  const [isSaving, setIsSaving] = useState(false)
  const [editValues, setEditValues] = useState<{ title: string, alt: string, caption: string }>({
    title: "",
    alt: "",
    caption: ""
  })

  useEffect(() => {
    if (resourceId) {
      handleFetchResource()
    } else {
      setResource(null)
      setUsage([])
    }
  }, [resourceId])

  const handleFetchResource = async () => {
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
  }

  const handleUpdateMetadata = async () => {
    if (!resource || !resourceId || isSaving) return
    setIsSaving(true)
    try {
      const result = await updateResourceMetadata(resourceId, resource.type, editValues)
      if (result.ok) {
        // Updated successfully
        setResource({ ...resource, ...editValues })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (resourceId && activeTab === "usage") {
      handleScanUsage()
    }
  }, [resourceId, activeTab])

  const handleScanUsage = async () => {
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
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  if (!resourceId) return null

  const isImage = resource?.kind === "IMAGE"
  const isVideo = resource?.kind === "YOUTUBE_EMBED"

  return (
    <aside className={cn(
      "w-[400px] border-l border-outline-variant bg-surface-container-low flex flex-col transition-all duration-300 glass-panel shrink-0",
      resourceId ? "translate-x-0" : "translate-x-full"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Edit3 className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-on-surface uppercase tracking-tight leading-none truncate max-w-[200px]">
              {resource?.title || "Resource Details"}
            </h3>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-1 opacity-60">
              {resource?.type === "media-asset" ? (resource.kind === "YOUTUBE_EMBED" ? "YouTube Video" : "Cloudinary Image") : "Content Snippet"}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
        >
          <X className="size-5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="size-10 text-primary animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant animate-pulse">Loading Metadata...</p>
        </div>
      ) : resource ? (
        <>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Preview Area */}
            <div className="p-4">
              <div className="aspect-video relative rounded-2xl overflow-hidden border border-outline-variant bg-surface-container-lowest group shadow-inner">
                {isImage && resource.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={resource.url} 
                    alt={resource.title}
                    className="w-full h-full object-cover"
                  />
                ) : isVideo && (resource.thumbnailUrl || resource.url) ? (
                  <div className="relative w-full h-full bg-black">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img 
                        src={resource.thumbnailUrl || resource.url} 
                        alt={resource.title}
                        className="w-full h-full object-cover opacity-60"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="size-10 text-white fill-current opacity-80" />
                      </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center tibeb-pattern opacity-10" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <Button size="sm" variant="secondary" asChild className="gap-2 backdrop-blur-md bg-white/20 border-white/30 text-white">
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <Eye className="size-3.5" />
                      Open Original
                    </a>
                  </Button>
                </div>
              </div>

              {/* Quick Info Bar */}
              <div className="flex items-center justify-between mt-4 p-3 bg-surface border border-outline-variant rounded-xl shadow-sm">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "size-2 rounded-full animate-pulse",
                    resource.status === "PUBLISHED" ? "bg-teal-500" : "bg-amber-500"
                  )} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">
                    {resource.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => copyToClipboard(resource.id)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    {copiedId ? <Check className="size-3" /> : <Copy className="size-3" />}
                    {copiedId ? "COPIED" : "COPY ID"}
                  </button>
                  <div className="w-px h-3 bg-outline-variant" />
                  <Link href={resource.type === "media-asset" ? `/admin/studio/media-asset/${resource.id}` : `/admin/studio/content-snippet/${resource.id}`} className="text-[10px] font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5">
                    <ExternalLink className="size-3" />
                    FULL EDITOR
                  </Link>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 border-b border-outline-variant flex gap-6">
              <TabButton 
                label="Metadata" 
                icon={Edit3} 
                isActive={activeTab === "edit"} 
                onClick={() => setActiveTab("edit")} 
              />
              <TabButton 
                label="Where Used" 
                icon={Network} 
                isActive={activeTab === "usage"} 
                onClick={() => setActiveTab("usage")} 
              />
            </div>

            {/* Tab Content */}
            <div className="p-6 space-y-6">
              {activeTab === "edit" ? (
                <div className="space-y-5">
                   <div className="space-y-4">
                     <InspectorField 
                        label="Title" 
                        value={editValues.title} 
                        onChange={(val) => setEditValues(prev => ({ ...prev, title: val }))}
                     />
                     {resource.type === "media-asset" && (
                       <>
                          <InspectorField 
                            label="Alt Text" 
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
                     
                     {(editValues.title !== (resource.title || "") || 
                       editValues.alt !== (resource.alt || "") || 
                       editValues.caption !== (resource.caption || "")) && (
                       <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <Button 
                            onClick={handleUpdateMetadata} 
                            disabled={isSaving}
                            className="w-full bg-primary hover:bg-primary/90 rounded-xl gap-2 h-10 shadow-md"
                          >
                            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                            {isSaving ? "Saving..." : "Save Changes"}
                          </Button>
                       </div>
                     )}
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-outline-variant">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">Last Updated</label>
                        <div className="flex items-center gap-2 text-xs font-medium text-on-surface">
                          <Clock className="size-3 text-primary/50" />
                          {new Date(resource.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">Visibility</label>
                        <div className="flex items-center gap-2 text-xs font-medium text-on-surface">
                          {resource.status === "PUBLISHED" ? <Globe className="size-3 text-teal-500" /> : <Lock className="size-3 text-amber-500" />}
                          {resource.status === "PUBLISHED" ? "Public" : "Internal Draft"}
                        </div>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                    <Info className="size-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-on-surface-variant">
                      This scan shows all concepts and questions that currently reference this asset ID in their content blocks.
                    </p>
                  </div>
                  
                  {isScanningUsage ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-3">
                       <Loader2 className="size-6 text-primary animate-spin" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant animate-pulse">Scanning Database...</p>
                    </div>
                  ) : usage.length > 0 ? (
                    <div className="space-y-2">
                       {usage.map((item, idx) => (
                         <UsageItem 
                            key={`${item.id}-${idx}`}
                            title={item.title} 
                            type={item.type.toUpperCase()} 
                            course={item.courseTitle || "Global"} 
                            href={item.type === "concept" ? `/admin/studio/concept/${item.id}` : item.type === "question" ? `/admin/studio/question/${item.id}` : `/admin/studio/content-snippet/${item.id}`}
                         />
                       ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-2">
                       <p className="text-xs font-bold text-on-surface-variant opacity-60 italic">No curriculum usage found.</p>
                       <p className="text-[9px] uppercase tracking-tighter text-on-surface-variant opacity-40">Safe to archive or delete.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-outline-variant bg-surface/50 backdrop-blur-md flex gap-3 shrink-0">
             <Button className="flex-1 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2" asChild>
                <Link href={resource.type === "media-asset" ? `/admin/studio/media-asset/${resource.id}` : `/admin/studio/content-snippet/${resource.id}`}>
                  <Edit3 className="size-3.5" />
                  Edit Resource
                </Link>
             </Button>
             <Button variant="outline" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200">
                <Trash2 className="size-3.5" />
             </Button>
          </div>
        </>
      ) : null}
    </aside>
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
        "py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 relative transition-all",
        isActive ? "text-primary" : "text-on-surface-variant opacity-40 hover:opacity-100"
      )}
    >
      <Icon className="size-3" />
      {label}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(25,75,223,0.4)]" />
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
    <div className="space-y-2 group">
      <div className="flex items-center justify-between">
        <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">{label}</label>
      </div>
      {isMultiline ? (
        <textarea 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}...`}
          className="w-full bg-white border border-outline-variant rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none h-24 custom-scrollbar transition-all shadow-sm group-focus-within:shadow-md"
        />
      ) : (
        <input 
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}...`}
          className="w-full bg-white border border-outline-variant rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm group-focus-within:shadow-md"
        />
      )}
    </div>
  )
}

function UsageItem({ title, type, course, href }: { title: string, type: string, course: string, href: string }) {
  return (
    <Link 
      href={href}
      className="group flex items-center justify-between p-3 rounded-xl border border-outline-variant hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
    >
      <div className="flex flex-col">
        <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">{title}</span>
        <span className="text-[10px] text-on-surface-variant opacity-60 uppercase font-black tracking-tighter">{course}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-[8px] font-black uppercase tracking-widest border border-outline-variant">
          {type}
        </span>
        <ChevronRight className="size-3 text-on-surface-variant opacity-20 group-hover:opacity-100 transition-all" />
      </div>
    </Link>
  )
}

function Info({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  )
}
