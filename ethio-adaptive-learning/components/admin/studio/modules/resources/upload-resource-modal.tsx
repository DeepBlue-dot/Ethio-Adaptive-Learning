"use client"

import React, { useState, useRef } from "react"
import { 
  X, 
  UploadCloud, 
  File, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Trash2,
  PlusCircle,
  Youtube,
  Send,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { uploadResourceFile, createYouTubeResource } from "@/app/(admin)/admin/studio/actions"

interface UploadResourceModalProps {
  isOpen: boolean
  onClose: () => void
}

interface QueuedFile {
  id: string
  file: File
  status: "idle" | "uploading" | "success" | "error"
  error?: string
  progress: number
}

type Tab = "files" | "youtube"

export function UploadResourceModal({ isOpen, onClose }: UploadResourceModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("files")
  const [files, setFiles] = useState<QueuedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [isSubmittingYoutube, setIsSubmittingYoutube] = useState(false)
  const [youtubeError, setYoutubeYoutubeError] = useState<string | null>(null)
  const [youtubeSuccess, setYoutubeSuccess] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    
    const queuedFiles: QueuedFile[] = Array.from(newFiles).map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      status: "idle",
      progress: 0
    }))
    
    setFiles(prev => [...prev, ...queuedFiles])
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleUpload = async () => {
    if (files.length === 0 || isUploading) return
    
    setIsUploading(true)
    const updatedFiles = [...files]
    
    const uploadFile = async (index: number) => {
      if (updatedFiles[index].status === "success") return
      
      updatedFiles[index].status = "uploading"
      setFiles([...updatedFiles])
      
      const formData = new FormData()
      formData.append("files", updatedFiles[index].file)
      
      try {
        const result = await uploadResourceFile(formData)
        if (result.ok) {
          updatedFiles[index].status = "success"
        } else {
          updatedFiles[index].status = "error"
          updatedFiles[index].error = result.error || "Upload failed."
        }
      } catch (error) {
        updatedFiles[index].status = "error"
        updatedFiles[index].error = "Network error."
      }
      
      setFiles([...updatedFiles])
    }

    await Promise.all(updatedFiles.map((_, i) => uploadFile(i)))
    setIsUploading(false)
  }

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!youtubeUrl || isSubmittingYoutube) return
    
    setIsSubmittingYoutube(true)
    setYoutubeYoutubeError(null)
    setYoutubeSuccess(false)
    
    try {
      const result = await createYouTubeResource(youtubeUrl)
      if (result.ok) {
        setYoutubeSuccess(true)
        setYoutubeUrl("")
        // Automatically close after a delay or let user see success
        setTimeout(() => {
          if (isOpen) setYoutubeSuccess(false)
        }, 3000)
      } else {
        setYoutubeYoutubeError(result.error || "Failed to add YouTube video.")
      }
    } catch (error) {
      setYoutubeYoutubeError("Invalid URL or network error.")
    } finally {
      setIsSubmittingYoutube(false)
    }
  }

  const reset = () => {
    setFiles([])
    setIsUploading(false)
    setYoutubeUrl("")
    setYoutubeYoutubeError(null)
    setYoutubeSuccess(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return ImageIcon
    return File
  }

  const totalFiles = files.length
  const successCount = files.filter(f => f.status === "success").length
  const errorCount = files.filter(f => f.status === "error").length

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={(!isUploading && !isSubmittingYoutube) ? onClose : undefined} />
      
      <div className="relative w-full max-w-2xl bg-surface border border-outline-variant rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <PlusCircle className="size-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-on-surface uppercase tracking-tight leading-none">Add Resource</h2>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-1 opacity-60">Media & Snippets</p>
             </div>
          </div>
          {(!isUploading && !isSubmittingYoutube) && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant bg-surface-container-low/50">
           <TabButton 
              label="Images & Snippets" 
              isActive={activeTab === "files"} 
              onClick={() => setActiveTab("files")} 
              icon={UploadCloud}
           />
           <TabButton 
              label="YouTube Embed" 
              isActive={activeTab === "youtube"} 
              onClick={() => setActiveTab("youtube")} 
              icon={Youtube}
           />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === "files" ? (
            <div className="space-y-6">
              {files.length === 0 ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group border-2 border-dashed border-outline-variant rounded-3xl p-12 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer bg-surface-container-low/30"
                >
                  <div className="size-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                    <UploadCloud className="size-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Click to upload or drag & drop</h3>
                    <p className="text-xs text-on-surface-variant mt-1">Images (10MB) or Text snippets (.txt, .md)</p>
                  </div>
                  <input 
                    type="file" 
                    multiple 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={(e) => addFiles(e.target.files)}
                    accept="image/*,.txt,.md"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
                        Queue: {files.length} Files
                      </h4>
                      {!isUploading && (
                        <button 
                          onClick={reset}
                          className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-700"
                        >
                          Clear Queue
                        </button>
                      )}
                  </div>
                  
                  <div className="space-y-2">
                    {files.map((item) => {
                      const Icon = getFileIcon(item.file.type)
                      return (
                        <div key={item.id} className={cn(
                          "group flex items-center gap-4 p-3 rounded-2xl border transition-all",
                          item.status === "success" ? "bg-teal-50/50 border-teal-200" : 
                          item.status === "error" ? "bg-rose-50/50 border-rose-200" :
                          "bg-surface-container-low border-outline-variant"
                        )}>
                            <div className={cn(
                              "size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                              item.status === "success" ? "bg-teal-500 text-white" : 
                              item.status === "error" ? "bg-rose-500 text-white" :
                              "bg-surface-container-high text-on-surface-variant"
                            )}>
                              <Icon className="size-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs font-bold text-on-surface truncate pr-4">{item.file.name}</span>
                                  <span className="text-[9px] text-on-surface-variant font-medium shrink-0">
                                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                                  </span>
                              </div>
                              
                              {item.status === "uploading" ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                                        <div className="h-full bg-primary animate-pulse w-1/2" />
                                    </div>
                                    <Loader2 className="size-3 text-primary animate-spin" />
                                  </div>
                              ) : item.status === "error" ? (
                                  <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                                    <AlertCircle className="size-3" />
                                    {item.error}
                                  </p>
                              ) : item.status === "success" ? (
                                  <p className="text-[10px] font-bold text-teal-600 flex items-center gap-1">
                                    <CheckCircle2 className="size-3" />
                                    Uploaded successfully
                                  </p>
                              ) : (
                                <p className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">Ready to upload</p>
                              )}
                            </div>
                            
                            {!isUploading && item.status !== "success" && (
                              <button 
                                onClick={() => removeFile(item.id)}
                                className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-100 rounded-lg text-rose-600 transition-all"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                        </div>
                      )
                    })}
                  </div>

                  {successCount < totalFiles && !isUploading && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 border-2 border-dashed border-outline-variant rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary hover:border-primary/30 transition-all"
                      >
                        <PlusCircle className="size-4" />
                        Add More Files
                      </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 px-4 space-y-8">
               <div className="flex flex-col items-center text-center space-y-3">
                  <div className="size-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shadow-sm">
                    <Youtube className="size-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-on-surface uppercase tracking-tight">Add YouTube Video</h3>
                    <p className="text-xs text-on-surface-variant mt-1">Videos are stored as embeds to optimize platform performance.</p>
                  </div>
               </div>

               <form onSubmit={handleYoutubeSubmit} className="space-y-4 max-w-lg mx-auto">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-2">YouTube URL</label>
                     <div className="relative group">
                        <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                        <input 
                          type="url"
                          required
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full bg-surface-container-low border border-outline-variant rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                     </div>
                  </div>

                  {youtubeError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 animate-in slide-in-from-top-2 duration-200">
                       <AlertCircle className="size-4" />
                       <p className="text-xs font-bold">{youtubeError}</p>
                    </div>
                  )}

                  {youtubeSuccess && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 animate-in slide-in-from-top-2 duration-200">
                       <CheckCircle2 className="size-4" />
                       <p className="text-xs font-bold">YouTube video added to resources!</p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={!youtubeUrl || isSubmittingYoutube}
                    className="w-full h-14 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl gap-3 text-sm font-black uppercase tracking-widest"
                  >
                    {isSubmittingYoutube ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="size-5" />
                        Ingest Video
                      </>
                    )}
                  </Button>
               </form>

               <div className="p-4 rounded-2xl bg-surface-container-highest/30 border border-outline-variant">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Platform Note</h4>
                  <p className="text-[11px] leading-relaxed text-on-surface-variant/80 italic">
                    By providing a YouTube URL, we will automatically extract the Video ID and high-resolution thumbnail. 
                    Embedded videos ensure maximum compatibility and zero hosting costs for media delivery.
                  </p>
               </div>
            </div>
          )}
        </div>

        {/* Footer (Files tab only) */}
        {activeTab === "files" && (
          <div className="p-6 border-t border-outline-variant bg-surface/50 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-4">
                {successCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-700 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 className="size-3" />
                    {successCount} Success
                  </div>
                )}
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-700 text-[10px] font-black uppercase tracking-widest">
                    <AlertCircle className="size-3" />
                    {errorCount} Failed
                  </div>
                )}
            </div>
            
            <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  disabled={isUploading}
                  className="rounded-xl px-6"
                >
                  {successCount > 0 && successCount === totalFiles ? "Done" : "Cancel"}
                </Button>
                
                {files.length > 0 && successCount < totalFiles && (
                  <Button 
                    onClick={handleUpload} 
                    disabled={isUploading}
                    className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl px-8 gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="size-4" />
                        Upload {totalFiles - successCount} Files
                      </>
                    )}
                  </Button>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({ label, isActive, onClick, icon: Icon }: { 
  label: string, 
  isActive: boolean, 
  onClick: () => void,
  icon: LucideIcon
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 py-4 flex items-center justify-center gap-3 transition-all relative",
        isActive 
          ? "bg-surface text-primary font-black shadow-[inset_0_-2px_0_var(--primary)]" 
          : "text-on-surface-variant opacity-60 hover:opacity-100 hover:bg-surface-container-high"
      )}
    >
      <Icon className={cn("size-4", isActive ? "text-primary" : "text-on-surface-variant")} />
      <span className="text-[11px] uppercase tracking-widest">{label}</span>
      {isActive && (
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
      )}
    </button>
  )
}
