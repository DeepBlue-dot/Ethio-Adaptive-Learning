"use client"

import React, { useState } from "react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { 
  FileText, 
  Image as ImageIcon, 
  Library, 
  Video,
  PlusCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Filter,
  Sparkles,
  Zap,
  Clock,
  X,
  LucideIcon,
  Gamepad2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface UnitFacet {
  id: string
  title: string
  order: number
}

interface CourseFacet {
  id: string
  title: string
  units: UnitFacet[]
}

interface ResourceSidebarProps {
  courses: CourseFacet[]
  unusedCount?: number
}

export function ResourceSidebar({ courses, unusedCount = 0 }: ResourceSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({})

  const currentType = searchParams.get("type") || "all"
  const currentCollection = searchParams.get("collection")
  const currentCourseId = searchParams.get("courseId")
  const currentUnitId = searchParams.get("unitId")
  const searchQuery = searchParams.get("query") || ""
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)

  const toggleCourse = (courseId: string) => {
    setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }))
  }

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    // Reset unit if course changes
    if (updates.courseId && updates.courseId !== currentCourseId) {
      params.delete("unitId")
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  // Update local search when URL changes
  React.useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  return (
    <div className="flex h-full flex-col bg-surface-container overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-outline-variant bg-surface-container-highest/30 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[10px] font-black text-on-surface uppercase tracking-widest leading-none">
              Resources
            </h2>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-tighter mt-1 opacity-60">Professional Hub</p>
          </div>
          <Sparkles className="size-4 text-primary animate-pulse" />
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Search (⌘K)..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilters({ query: localSearchQuery || null })
              }
            }}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-on-surface placeholder:text-on-surface-variant/40"
          />
          {localSearchQuery && (
            <button 
              onClick={() => {
                setLocalSearchQuery("")
                updateFilters({ query: null })
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-container-high rounded-full transition-all"
            >
              <X className="size-3 text-on-surface-variant" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        {/* Resource Types */}
        <section>
          <h3 className="px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 flex items-center gap-2">
            <Filter className="size-3" />
            Library
          </h3>
          <div className="space-y-1">
            <TypeItem 
              label="All Resources" 
              icon={Library} 
              isActive={currentType === "all" && !currentCollection} 
              onClick={() => updateFilters({ type: "all", collection: null })} 
            />
            <TypeItem 
              label="Images" 
              icon={ImageIcon} 
              isActive={currentType === "image"} 
              onClick={() => updateFilters({ type: "image", collection: null })} 
            />
            <TypeItem 
              label="Videos" 
              icon={Video} 
              isActive={currentType === "video"} 
              onClick={() => updateFilters({ type: "video", collection: null })} 
            />
            <TypeItem 
              label="Simulations" 
              icon={Gamepad2} 
              isActive={currentType === "phet"} 
              onClick={() => updateFilters({ type: "phet", collection: null })} 
            />
            <TypeItem 
              label="Snippets" 
              icon={FileText} 
              isActive={currentType === "snippet"} 
              onClick={() => updateFilters({ type: "snippet", collection: null })} 
            />
          </div>
        </section>

        {/* Smart Collections */}
        <section>
          <h3 className="px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 flex items-center gap-2">
            <Zap className="size-3" />
            Collections
          </h3>
          <div className="space-y-1">
            <TypeItem 
              label="Recently Used" 
              icon={Clock} 
              isActive={currentCollection === "recent"} 
              onClick={() => updateFilters({ collection: "recent", type: null })} 
            />
            <TypeItem 
              label="Unused Assets" 
              icon={Filter} 
              isActive={currentCollection === "unused"} 
              onClick={() => updateFilters({ collection: "unused", type: null })} 
              count={unusedCount}
            />
            <TypeItem 
              label="Drafts" 
              icon={PlusCircle} 
              isActive={currentCollection === "drafts"} 
              onClick={() => updateFilters({ collection: "drafts", type: null })} 
            />
          </div>
        </section>

        {/* Curriculum Facets */}
        <section>
          <h3 className="px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Curriculum
          </h3>
          <div className="space-y-1">
            {courses.map(course => (
              <div key={course.id} className="space-y-0.5">
                <button
                  onClick={() => toggleCourse(course.id)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-[12px] font-medium transition-all rounded-lg text-left",
                    currentCourseId === course.id 
                      ? "bg-primary/5 text-primary font-bold" 
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  )}
                >
                  {expandedCourses[course.id] ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                  <span 
                    className="truncate flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateFilters({ courseId: course.id, unitId: null })
                    }}
                  >
                    {course.title}
                  </span>
                </button>
                
                {expandedCourses[course.id] && (
                  <div className="ml-4 pl-2 border-l border-outline-variant space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                    {course.units.map(unit => (
                      <button
                        key={unit.id}
                        onClick={() => updateFilters({ courseId: course.id, unitId: unit.id })}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-1.5 text-[11px] font-medium transition-all rounded-lg text-left",
                          currentUnitId === unit.id 
                            ? "text-primary font-bold bg-primary/10" 
                            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                        )}
                      >
                        <span className="truncate">Unit {unit.order}: {unit.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-outline-variant bg-surface-container-highest/10 shrink-0">
        <button 
          onClick={() => updateFilters({ upload: "true" })}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-primary-foreground bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <PlusCircle className="size-3.5" />
          Upload New
        </button>
      </div>
    </div>
  )
}

function TypeItem({ label, icon: Icon, isActive, onClick, count }: { 
  label: string, 
  icon: LucideIcon, 
  isActive: boolean,
  onClick: () => void,
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-[13px] font-medium transition-all rounded-lg relative",
        isActive 
          ? "bg-primary/10 text-primary font-bold shadow-sm" 
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
      )}
    >
      <Icon className={cn("size-4", isActive ? "text-primary" : "text-primary/50")} />
      <span className="truncate flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant border border-outline-variant">
          {count}
        </span>
      )}
      {isActive && !count && (
        <div className="absolute right-2 size-1.5 rounded-full bg-primary" />
      )}
    </button>
  )
}
