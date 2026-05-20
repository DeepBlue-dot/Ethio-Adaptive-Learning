"use client"

import { useState } from "react"
import { Image as ImageIcon, Play, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CmsReferenceOption } from "@/lib/cms/types"

export function CmsMediaPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: CmsReferenceOption[]
  value: string
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  const selected = options.find((opt) => opt.value === value)
  
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="lg:col-span-2">
      <span className="block text-sm font-medium text-foreground">{label}</span>
      <div className="mt-2 flex items-center gap-4">
        <button
          className="flex h-24 w-40 items-center justify-center overflow-hidden rounded-2xl border border-border bg-slate-50 transition hover:border-teal-600 group shadow-sm"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          {selected?.metadata?.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={selected.label}
              className="h-full w-full object-cover"
              src={String(selected.metadata.thumbnailUrl)}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-teal-600">
              <PlusCircleIcon className="size-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Choose Media</span>
            </div>
          )}
        </button>
        {selected && (
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{selected.label}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
              {String(selected.description)}
            </p>
            <button
              className="mt-2 text-xs font-bold text-red-600 hover:underline"
              onClick={() => onChange("")}
              type="button"
            >
              Clear selection
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" 
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] border border-border bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between border-b border-border p-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Media Library</h3>
                <p className="text-sm text-muted-foreground mt-1">Select an asset or video to use in your content.</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-slate-100 transition"
              >
                <X className="size-6" />
              </button>
            </div>

            <div className="p-6 border-b border-border bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by title, filename or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-white pl-11 pr-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/5"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {filteredOptions.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`group relative aspect-video overflow-hidden rounded-2xl border-2 transition ${
                        value === option.value ? "border-teal-600 ring-4 ring-teal-600/10" : "border-slate-100 hover:border-teal-300"
                      }`}
                      onClick={() => {
                        onChange(option.value)
                        setIsOpen(false)
                      }}
                      type="button"
                    >
                      {option.metadata?.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={option.label}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                          src={String(option.metadata.thumbnailUrl)}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-50 text-muted-foreground">
                          <ImageIcon className="size-8 opacity-20" />
                        </div>
                      )}
                      
                      {option.metadata?.kind === "YOUTUBE_EMBED" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition">
                          <div className="rounded-full bg-white/90 p-2 text-red-600 shadow-sm">
                            <Play className="size-4 fill-current" />
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 text-left">
                        <p className="truncate text-[10px] font-bold text-white uppercase tracking-wider">{option.label}</p>
                        <p className="truncate text-[8px] text-slate-300 uppercase tracking-widest mt-0.5">{option.description}</p>
                      </div>

                      {value === option.value && (
                        <div className="absolute top-2 right-2 bg-teal-600 text-white rounded-full p-1 shadow-md">
                          <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="inline-flex items-center justify-center size-16 rounded-3xl bg-slate-50 text-muted-foreground mb-4">
                    <Search className="size-8 opacity-20" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">No media found</h3>
                  <p className="text-sm text-muted-foreground mt-1">Try a different search term or check your media library.</p>
                  <Button 
                    variant="outline" 
                    className="mt-6"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border bg-slate-50 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsOpen(false)}>Close Library</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}
