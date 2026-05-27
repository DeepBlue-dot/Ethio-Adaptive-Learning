"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  ChevronRight, 
  Layers, 
  Lightbulb, 
  BookOpen, 
  Plus, 
  Search,
  MoreVertical,
  Zap,
  Target,
  Sparkles
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"

interface ConceptNode {
  id: string
  title: string
  slug: string
  status?: string
}

interface UnitNode {
  id: string
  title: string
  order: number
  concepts: ConceptNode[]
  status?: string
}

interface CourseNode {
  id: string
  title: string
  slug: string
  units: UnitNode[]
  status?: string
}

export function CurriculumTree({ 
  courses 
}: { 
  courses: CourseNode[] 
}) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(courses.map(c => c.id)))

  const toggleNode = (id: string) => {
    const next = new Set(expandedNodes)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedNodes(next)
  }

  // Filtering Logic
  const filteredCourses = useMemo(() => {
    if (!searchQuery) return courses

    return courses.map(course => {
      const filteredUnits = course.units.map(unit => {
        const filteredConcepts = unit.concepts.filter(concept => 
          concept.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        
        if (unit.title.toLowerCase().includes(searchQuery.toLowerCase()) || filteredConcepts.length > 0) {
          return { ...unit, concepts: filteredConcepts }
        }
        return null
      }).filter(Boolean) as UnitNode[]

      if (course.title.toLowerCase().includes(searchQuery.toLowerCase()) || filteredUnits.length > 0) {
        return { ...course, units: filteredUnits }
      }
      return null
    }).filter(Boolean) as CourseNode[]
  }, [courses, searchQuery])

  // Auto-expand on search
  React.useEffect(() => {
    if (searchQuery) {
      const allIds = new Set<string>()
      filteredCourses.forEach(c => {
        allIds.add(c.id)
        c.units.forEach(u => allIds.add(u.id))
      })
      setExpandedNodes(allIds)
    }
  }, [searchQuery, filteredCourses])

  return (
    <div className="flex h-full flex-col bg-surface-container-lowest/50 backdrop-blur-sm overflow-hidden border-r border-outline-variant/30">
      {/* 1. Header Area (Glassmorphic) */}
      <div className="p-6 border-b border-outline-variant/20 bg-surface-container-low/40 shrink-0 space-y-5">
        <div className="flex items-center justify-between">
           <div>
              <h2 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.25em] mb-1 opacity-40">
                Mission Control
              </h2>
              <p className="text-lg font-black text-on-surface tracking-tighter">Curriculum</p>
           </div>
           <div className="size-10 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Target className="size-5" />
           </div>
        </div>

        {/* In-Tree Search */}
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-30 size-4 group-focus-within:text-primary group-focus-within:opacity-100 transition-all" />
          <input
            type="text"
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant/40 rounded-2xl text-[13px] font-bold text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all"
          />
        </div>
      </div>

      {/* 2. Tree View (Scrollable) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 pb-20">
        <AnimatePresence initial={false}>
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <CourseItem 
                  course={course} 
                  expanded={expandedNodes.has(course.id)}
                  onToggle={() => toggleNode(course.id)}
                  activePath={pathname}
                  expandedNodes={expandedNodes}
                  toggleNode={toggleNode}
                />
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center space-y-4 opacity-20">
               <Sparkles className="size-10 mx-auto" />
               <p className="text-[10px] font-black uppercase tracking-widest">No concepts found</p>
            </div>
          )}
        </AnimatePresence>

        <Link 
          href="/admin/studio/editor/course/new"
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/5 transition-all mt-8 border border-dashed border-primary/20 hover:border-primary/40 group active:scale-[0.98]"
        >
          <Plus className="size-3 group-hover:scale-125 transition-transform" />
          Add Course
        </Link>
      </div>

      {/* 3. Bottom Stats/Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-surface-container-lowest to-transparent pointer-events-none">
         <div className="bg-primary p-4 rounded-[2rem] shadow-2xl shadow-primary/20 pointer-events-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="size-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <Zap className="size-4" />
               </div>
               <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/60">System Ready</p>
                  <p className="text-[10px] font-black text-white">Curriculum Engine</p>
               </div>
            </div>
            <button className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-90">
               <MoreVertical className="size-4" />
            </button>
         </div>
      </div>
    </div>
  )
}

function CourseItem({ 
  course, 
  expanded, 
  onToggle, 
  activePath,
  expandedNodes,
  toggleNode
}: { 
  course: CourseNode
  expanded: boolean
  onToggle: () => void
  activePath: string
  expandedNodes: Set<string>
  toggleNode: (id: string) => void
}) {
  const isActive = activePath === `/admin/studio/builder/${course.id}`

  return (
    <div className="space-y-1">
      <div 
        className={cn(
          "flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer text-on-surface transition-all group relative overflow-hidden",
          isActive 
            ? "bg-primary text-white shadow-lg shadow-primary/20 ring-1 ring-primary/50" 
            : "hover:bg-surface-container-high border border-transparent hover:border-outline-variant/30"
        )}
        onClick={onToggle}
      >
        <div className={cn(
          "shrink-0 transition-transform duration-300",
          expanded && "rotate-90"
        )}>
           <ChevronRight className={cn("size-3.5", isActive ? "text-white" : "text-on-surface-variant opacity-40")} />
        </div>
        
        <div className={cn(
          "size-9 rounded-xl flex items-center justify-center shadow-inner transition-all",
          isActive ? "bg-white/20" : "bg-primary/10 text-primary group-hover:scale-110"
        )}>
          <BookOpen className="size-4" />
        </div>
        
        <Link 
          href={`/admin/studio/builder/${course.id}`} 
          className="truncate flex-1 text-[13px] font-black uppercase tracking-tight" 
          onClick={(e) => e.stopPropagation()}
        >
          {course.title}
        </Link>

        {isActive ? (
           <Link 
             href={`/admin/studio/editor/unit/new?courseId=${course.id}`}
             className="size-7 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
             onClick={(e) => e.stopPropagation()}
             title="Add Unit"
           >
             <Plus className="size-4" />
           </Link>
        ) : (
          <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className="pl-6 relative space-y-1 overflow-hidden"
          >
            {/* Elegant Tree Line */}
            <div className="absolute left-4 top-0 bottom-4 w-px bg-gradient-to-b from-outline-variant/40 to-transparent" />
            
            <div className="pt-1 pb-1 space-y-1">
              {course.units.map((unit) => (
                <UnitItem 
                  key={unit.id} 
                  unit={unit} 
                  activePath={activePath}
                  expanded={expandedNodes.has(unit.id)}
                  onToggle={() => toggleNode(unit.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function UnitItem({ 
  unit, 
  activePath,
  expanded,
  onToggle
}: { 
  unit: UnitNode
  activePath: string
  expanded: boolean
  onToggle: () => void
}) {
  const isActive = activePath.includes(`/admin/studio/unit/${unit.id}`)

  return (
    <div className="space-y-1">
      <div 
        className={cn(
          "flex items-center gap-3 p-2 rounded-xl cursor-pointer text-on-surface transition-all group border border-transparent",
          isActive 
            ? "bg-surface-container-highest border-outline-variant shadow-sm" 
            : "hover:bg-surface-container-high"
        )}
        onClick={onToggle}
      >
        <div className={cn(
          "shrink-0 transition-transform duration-300",
          expanded && "rotate-90"
        )}>
           <ChevronRight className="size-3 text-on-surface-variant opacity-20" />
        </div>
        
        <div className={cn(
          "size-7 rounded-lg flex items-center justify-center transition-all",
          isActive ? "bg-primary/20 text-primary shadow-inner" : "bg-surface-container-highest text-on-surface-variant group-hover:bg-primary/5 group-hover:text-primary"
        )}>
          <Layers className="size-3.5" />
        </div>
        
        <div className="truncate flex-1">
           <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 leading-none mb-1">Unit {unit.order}</p>
           <p className={cn("text-[12px] font-bold truncate leading-none", isActive ? "text-primary" : "text-on-surface")}>
              {unit.title}
           </p>
        </div>

        <Link 
          href={`/admin/studio/editor/concept/new?unitId=${unit.id}`}
          className="size-6 rounded-md hover:bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-primary"
          onClick={(e) => e.stopPropagation()}
          title="Add Concept"
        >
          <Plus className="size-3.5" />
        </Link>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "circOut" }}
            className="pl-6 relative space-y-1 overflow-hidden"
          >
            <div className="absolute left-3 top-0 bottom-4 w-px bg-outline-variant/20" />
            
            <div className="pt-1 pb-1 space-y-0.5">
              {unit.concepts.map((concept) => {
                const isConceptActive = activePath.includes(`/admin/studio/editor/concept/${concept.id}`)
                return (
                  <Link
                    key={concept.id}
                    href={`/admin/studio/editor/concept/${concept.id}`}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg transition-all group border border-transparent",
                      isConceptActive 
                        ? "bg-primary/5 border-primary/20 shadow-inner" 
                        : "hover:bg-surface-container-high"
                    )}
                  >
                    <div className={cn(
                      "size-6 rounded-md flex items-center justify-center transition-all",
                      isConceptActive ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-surface-container-highest text-on-surface-variant/40 group-hover:text-primary/60 group-hover:bg-primary/5"
                    )}>
                      <Lightbulb className="size-3" />
                    </div>
                    <span className={cn(
                      "truncate flex-1 text-[11px] font-bold transition-colors",
                      isConceptActive ? "text-primary" : "text-on-surface-variant group-hover:text-on-surface"
                    )}>
                      {concept.title}
                    </span>
                    {isConceptActive && (
                      <div className="size-1 rounded-full bg-primary shadow-[0_0_6px_rgba(25,75,223,0.8)]" />
                    )}
                  </Link>
                )
              })}
              
              {unit.concepts.length === 0 && (
                <p className="py-2 pl-9 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-20 italic">Empty Unit</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
