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
  LucideIcon,
  Gamepad2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { uploadResourceFile, createYouTubeResource, createPhetResource } from "@/app/(admin)/admin/studio/actions"

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

type Tab = "files" | "youtube" | "phet"

export function UploadResourceModal({ isOpen, onClose }: UploadResourceModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("files")
  const [files, setFiles] = useState<QueuedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  // YouTube State
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [isSubmittingYoutube, setIsSubmittingYoutube] = useState(false)
  const [youtubeError, setYoutubeYoutubeError] = useState<string | null>(null)
  const [youtubeSuccess, setYoutubeSuccess] = useState(false)
  
  // PhET State
  const [phetUrl, setPhetUrl] = useState("")
  const [isSubmittingPhet, setIsSubmittingPhet] = useState(false)
  const [phetError, setPhetError] = useState<string | null>(null)
  const [phetSuccess, setPhetSuccess] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const next = [...files]
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i]
      next.push({
        id: Math.random().toString(36).slice(2, 9),
        file,
        status: "idle",
        progress: 0
      })
    }
    setFiles(next)
  }

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id))
  }

  const handleUpload = async () => {
    if (files.length === 0 || isUploading) return
    
    setIsUploading(true)
    const formData = new FormData()
    files.forEach(f => {
      if (f.status === "idle" || f.status === "error") {
        formData.append("files", f.file)
      }
    })

    try {
      const result = await uploadResourceFile(formData)
      if (result.ok) {
        // Success
        setFiles(files.map(f => ({ ...f, status: "success", progress: 100 })))
        setTimeout(() => {
          onClose()
          reset()
        }, 1500)
      } else {
        // Handle error
        setFiles(files.map(f => ({ ...f, status: "error", error: result.message })))
      }
    } catch (e) {
      setFiles(files.map(f => ({ ...f, status: "error", error: "Upload failed" })))
    } finally {
      setIsUploading(false)
    }
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

  const handlePhetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phetUrl || isSubmittingPhet) return
    
    setIsSubmittingPhet(true)
    setPhetError(null)
    setPhetSuccess(false)
    
    try {
      const result = await createPhetResource(phetUrl)
      if (result.ok) {
        setPhetSuccess(true)
        setPhetUrl("")
        setTimeout(() => {
          if (isOpen) setPhetSuccess(false)
        }, 3000)
      } else {
        setPhetError(result.error || "Failed to add PhET simulation.")
      }
    } catch (error) {
      setPhetError("Invalid URL or network error.")
    } finally {
      setIsSubmittingPhet(false)
    }
  }

  const reset = () => {
    setFiles([])
    setIsUploading(false)
    setYoutubeUrl("")
    setYoutubeYoutubeError(null)
    setYoutubeSuccess(false)
    setPhetUrl("")
    setPhetError(null)
    setPhetSuccess(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return ImageIcon
    return File
  }

  const successCount = files.filter(f => f.status === "success").length
  const totalFiles = files.length

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 lg:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md hidden sm:block"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full h-full sm:h-auto sm:max-w-2xl bg-surface-container sm:border border-outline-variant sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in sm:zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-highest/30">
          <div className="flex items-center gap-3">
             <div className="size-8 sm:size-10 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <UploadCloud className="size-4 sm:size-5" />
             </div>
             <div>
                <h2 className="text-lg sm:text-xl font-black text-on-surface uppercase tracking-tight">Ingest Assets</h2>
                <p className="text-[9px] sm:text-[10px] text-on-surface-variant font-black uppercase tracking-widest mt-0.5 sm:mt-1 opacity-40">Resource Pipeline</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-container-high rounded-xl transition-all text-on-surface-variant hover:text-on-surface active:scale-95"
          >
            <X className="size-5 sm:size-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant bg-surface-container-low/50 overflow-x-auto no-scrollbar">
           <TabButton 
              label="Files" 
              isActive={activeTab === "files"} 
              onClick={() => setActiveTab("files")} 
              icon={UploadCloud}
           />
           <TabButton 
              label="YouTube" 
              isActive={activeTab === "youtube"} 
              onClick={() => setActiveTab("youtube")} 
              icon={Youtube}
           />
           <TabButton 
              label="PhET" 
              isActive={activeTab === "phet"} 
              onClick={() => setActiveTab("phet")} 
              icon={Gamepad2}
           />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {activeTab === "files" ? (
            <div className="space-y-6">
              {files.length === 0 ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group border-2 border-dashed border-outline-variant rounded-3xl p-12 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer bg-surface-container-low/30"
                >
                  <div className="size-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-inner">
                    <UploadCloud className="size-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Click to upload or drag & drop</h3>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium opacity-60">Images (10MB) or Text snippets (.txt, .md)</p>
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
                          className="text-[10px] font-black uppercase tracking-widest text-error-rose hover:opacity-80"
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
                          item.status === "success" ? "bg-emerald-500/5 border-emerald-500/20" : 
                          item.status === "error" ? "bg-error-rose/5 border-error-rose-200" :
                          "bg-surface-container-low border-outline-variant"
                        )}>
                            <div className={cn(
                              "size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                              item.status === "success" ? "bg-emerald-500 text-primary-foreground" : 
                              item.status === "error" ? "bg-error-rose text-primary-foreground" :
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
                                  <p className="text-[10px] font-bold text-error-rose flex items-center gap-1">
                                    <AlertCircle className="size-3" />
                                    {item.error}
                                  </p>
                              ) : item.status === "success" ? (
                                  <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
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
                                className="p-2 opacity-0 group-hover:opacity-100 hover:bg-error-rose/10 rounded-lg text-error-rose transition-all"
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
          ) : activeTab === "youtube" ? (
            <div className="py-8 px-4 space-y-8">
               <div className="flex flex-col items-center text-center space-y-3">
                  <div className="size-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-sm">
                    <Youtube className="size-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-on-surface uppercase tracking-tight">Add YouTube Video</h3>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium opacity-60">Videos are stored as embeds to optimize platform performance.</p>
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
                          className="w-full bg-surface-container-low border border-outline-variant rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                        />
                     </div>
                  </div>

                  {youtubeError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-error-rose/5 text-error-rose border border-error-rose/20 animate-in slide-in-from-top-2 duration-200">
                       <AlertCircle className="size-4" />
                       <p className="text-xs font-bold">{youtubeError}</p>
                    </div>
                  )}

                  {youtubeSuccess && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 text-emerald-600 border border-emerald-500/20 animate-in slide-in-from-top-2 duration-200">
                       <CheckCircle2 className="size-4" />
                       <p className="text-xs font-bold">YouTube video added to resources!</p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={!youtubeUrl || isSubmittingYoutube}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 rounded-2xl gap-3 text-sm font-black uppercase tracking-widest"
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
          ) : (
            <div className="py-8 px-4 space-y-8">
               <div className="flex flex-col items-center text-center space-y-3">
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                    <Gamepad2 className="size-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-on-surface uppercase tracking-tight">Add PhET Simulation</h3>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium opacity-60">Interactive HTML5 simulations from the University of Colorado Boulder.</p>
                  </div>
               </div>

               <form onSubmit={handlePhetSubmit} className="space-y-4 max-w-lg mx-auto">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-2">PhET URL</label>
                     <div className="relative group">
                        <Gamepad2 className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                        <input 
                          type="url"
                          required
                          value={phetUrl}
                          onChange={(e) => setPhetUrl(e.target.value)}
                          placeholder="https://phet.colorado.edu/sims/html/..."
                          className="w-full bg-surface-container-low border border-outline-variant rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                        />
                     </div>
                  </div>

                  {phetError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-error-rose/5 text-error-rose border border-error-rose/20 animate-in slide-in-from-top-2 duration-200">
                       <AlertCircle className="size-4" />
                       <p className="text-xs font-bold">{phetError}</p>
                    </div>
                  )}

                  {phetSuccess && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 text-emerald-600 border border-emerald-500/20 animate-in slide-in-from-top-2 duration-200">
                       <CheckCircle2 className="size-4" />
                       <p className="text-xs font-bold">PhET simulation added to resources!</p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={!phetUrl || isSubmittingPhet}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 rounded-2xl gap-3 text-sm font-black uppercase tracking-widest"
                  >
                    {isSubmittingPhet ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="size-5" />
                        Ingest Simulation
                      </>
                    )}
                  </Button>
               </form>

               <div className="p-4 rounded-2xl bg-surface-container-highest/30 border border-outline-variant">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Simulation Tip</h4>
                  <p className="text-[11px] leading-relaxed text-on-surface-variant/80 italic">
                    Ensure you are using the HTML5 direct link. These simulations are highly interactive and mobile-friendly, 
                    perfect for embedding directly into concept lessons.
                  </p>
               </div>
            </div>
          )}
        </div>

        {/* Footer (Files tab only) */}
        {activeTab === "files" && (
          <div className="p-4 sm:p-6 border-t border-outline-variant bg-surface-container-highest/10 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
             <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isUploading}
              className="rounded-xl px-6 border-outline-variant order-2 sm:order-1"
             >
                Cancel
             </Button>
             <Button 
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
              className="rounded-xl px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 h-12 sm:h-10 order-1 sm:order-2"
             >
                {isUploading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="size-3.5 mr-2" />
                    Start Upload
                  </>
                )}
             </Button>
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
        "flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all relative group",
        isActive 
          ? "border-primary text-primary bg-primary/5" 
          : "border-transparent text-on-surface-variant opacity-40 hover:opacity-100 hover:bg-surface-container-high"
      )}
    >
      <Icon className={cn("size-3.5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
      <span className="text-[11px] uppercase tracking-widest">{label}</span>
      {isActive && (
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
      )}
    </button>
  )
}
