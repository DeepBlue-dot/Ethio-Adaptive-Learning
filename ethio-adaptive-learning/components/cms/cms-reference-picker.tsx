"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import { Search, X, Check, ChevronDown, Box } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import type { CmsReferenceOption } from "@/lib/cms/types"
import { Button } from "@/components/ui/button"

export function CmsReferencePicker({
  defaultValue,
  id,
  multiple = false,
  name,
  options,
  value,
  onChange,
}: {
  defaultValue?: string | string[]
  id?: string
  multiple?: boolean
  name: string
  options: CmsReferenceOption[]
  value?: string | string[]
  onChange?: (value: string | string[]) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync internal state with controlled value
  const selectedValues = useMemo(() => {
    const val = value ?? defaultValue ?? (multiple ? [] : "")
    return Array.isArray(val) ? val : [val].filter(Boolean)
  }, [value, defaultValue, multiple])

  const selectedOptions = useMemo(() => 
    options.filter(opt => selectedValues.includes(opt.value)),
    [options, selectedValues]
  )

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options
    const q = searchQuery.toLowerCase()
    return options.filter(opt => 
      opt.label.toLowerCase().includes(q) || 
      opt.description?.toLowerCase().includes(q)
    )
  }, [options, searchQuery])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const next = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue]
      onChange?.(next)
    } else {
      onChange?.(optionValue)
      setIsOpen(false)
    }
    setSearchQuery("")
  }

  const handleRemove = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation()
    if (multiple) {
      onChange?.(selectedValues.filter(v => v !== optionValue))
    } else {
      onChange?.("")
    }
  }

  return (
    <div className="relative mt-2" ref={containerRef}>
      {/* Hidden input for form submission */}
      {multiple ? (
        selectedValues.map(v => <input key={v} type="hidden" name={name} value={v} />)
      ) : (
        <input type="hidden" name={name} value={selectedValues[0] ?? ""} />
      )}

      {/* Trigger / Selected Display */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full rounded-2xl border bg-surface-container-lowest transition-all cursor-pointer min-h-[52px]",
          isOpen ? "border-primary ring-4 ring-primary/10 shadow-lg" : "border-outline-variant hover:border-outline",
          "p-2 flex flex-wrap gap-2 items-center pr-10"
        )}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map(opt => (
            <motion.div 
              key={opt.value}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 text-primary transition-colors hover:bg-primary/10"
            >
              <span className="text-xs font-bold leading-none">{opt.label}</span>
              <button 
                type="button"
                onClick={(e) => handleRemove(e, opt.value)}
                className="size-4 rounded-full flex items-center justify-center hover:bg-primary/20 transition-all"
              >
                <X className="size-2.5" />
              </button>
            </motion.div>
          ))
        ) : (
          <span className="px-3 text-sm text-on-surface-variant/40 font-medium italic">
            Select {multiple ? "options..." : "an option..."}
          </span>
        )}

        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-30 pointer-events-none">
           <ChevronDown className={cn("size-4 transition-transform duration-300", isOpen && "rotate-180")} />
        </div>
      </div>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute z-50 w-full rounded-[2rem] border border-outline-variant bg-surface shadow-[0_12px_48px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-100"
          >
            {/* Search Input */}
            <div className="p-4 border-b border-outline-variant/60 bg-surface-container-low/40 shrink-0">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant opacity-30" />
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Filter list..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm font-bold focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
                    onClick={(e) => e.stopPropagation()}
                  />
               </div>
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
               {filteredOptions.length > 0 ? (
                 filteredOptions.map((opt) => {
                   const isSelected = selectedValues.includes(opt.value)
                   return (
                     <div
                       key={opt.value}
                       onClick={(e) => {
                         e.stopPropagation()
                         handleSelect(opt.value)
                       }}
                       className={cn(
                         "group flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer",
                         isSelected ? "bg-primary/5" : "hover:bg-surface-container-high"
                       )}
                     >
                        <div className={cn(
                          "size-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                          isSelected ? "bg-primary text-on-primary border-primary" : "bg-surface-container-highest text-on-surface-variant opacity-40 border-transparent group-hover:opacity-100 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20"
                        )}>
                           {isSelected ? <Check className="size-5" /> : <Box className="size-5" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-sm font-black truncate",
                                isSelected ? "text-primary" : "text-on-surface"
                              )}>
                                {opt.label}
                              </span>
                           </div>
                           {opt.description && (
                             <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mt-1 line-clamp-1 italic">
                               {opt.description}
                             </p>
                           )}
                        </div>
                     </div>
                   )
                 })
               ) : (
                 <div className="py-12 text-center text-on-surface-variant/40 space-y-3">
                    <Search className="size-8 mx-auto opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">No matches found</p>
                 </div>
               )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-outline-variant/60 bg-surface-container-low/40 flex items-center justify-between shrink-0">
               <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-3">
                 {filteredOptions.length} items
               </span>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="rounded-xl text-[10px] font-black uppercase tracking-widest"
                 onClick={(e) => {
                   e.stopPropagation()
                   setIsOpen(false)
                 }}
               >
                 Close
               </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
