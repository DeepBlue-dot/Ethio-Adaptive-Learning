"use client"

import React, { useState, useMemo, useTransition } from "react"
import Link from "next/link"
import { 
  ChevronRight, 
  Layers, 
  Lightbulb, 
  BookOpen, 
  Plus, 
  Search,
  MoreVertical,
  Trash2,
  Edit,
  ExternalLink,
  Loader2,
  Sparkles,
  Target
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { deleteCmsItem } from "@/app/(admin)/admin/studio/actions"
import { Button } from "@/components/ui/button"

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

export function CurriculumExplorer({ 
  courses 
}: { 
  courses: CourseNode[] 
}) {
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
    <div className="flex h-full flex-col bg-surface-container-lowest/50 backdrop-blur-sm overflow-hidden rounded-[2.5rem] border border-outline-variant/30 shadow-2xl">
      {/* Header Area */}
      <div className="p-8 border-b border-outline-variant/20 bg-surface-container-low/40 shrink-0 space-y-6">
        <div className="flex items-center justify-between">
           <div>
              <h2 className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-1.5 opacity-50">
                Curriculum Explorer
              </h2>
              <h1 className="text-3xl font-black text-on-surface tracking-tighter">Content Nexus</h1>
           </div>
           <div className="flex items-center gap-4">
              <div className="size-12 rounded-[1.25rem] bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shadow-inner">
                 <Target className="size-6" />
              </div>
              <Button asChild className="h-12 rounded-2xl bg-primary px-6 text-[11px] font-black uppercase tracking-widest text-on-primary shadow-lg shadow-primary/20">
                <Link href="/admin/studio/editor/course/new">
                   <Plus className="mr-2 size-4" />
                   Add Course
                </Link>
              </Button>
           </div>
        </div>

        {/* Search */}
        <div className="relative group max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-30 size-5 group-focus-within:text-primary group-focus-within:opacity-100 transition-all" />
          <input
            type="text"
            placeholder="Search courses, units, or concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-surface border border-outline-variant/50 rounded-[1.5rem] text-sm font-bold text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary/40 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-4">
        <AnimatePresence initial={false}>
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <CourseExplorerItem 
                  course={course} 
                  expanded={expandedNodes.has(course.id)}
                  onToggle={() => toggleNode(course.id)}
                  expandedNodes={expandedNodes}
                  toggleNode={toggleNode}
                />
              </motion.div>
            ))
          ) : (
            <div className="py-32 text-center space-y-6 opacity-20">
               <Sparkles className="size-16 mx-auto" />
               <p className="text-sm font-black uppercase tracking-[0.3em]">No curriculum found</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function CourseExplorerItem({ 
  course, 
  expanded, 
  onToggle, 
  expandedNodes,
  toggleNode
}: { 
  course: CourseNode
  expanded: boolean
  onToggle: () => void
  expandedNodes: Set<string>
  toggleNode: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      <div 
        className={cn(
          "flex items-center gap-4 p-4 rounded-[2rem] cursor-pointer text-on-surface transition-all group relative border",
          expanded 
            ? "bg-surface-container-high border-primary/20 shadow-lg" 
            : "hover:bg-surface-container border-transparent hover:border-outline-variant/30"
        )}
        onClick={onToggle}
      >
        <div className={cn(
          "shrink-0 transition-transform duration-300",
          expanded && "rotate-90"
        )}>
           <ChevronRight className="size-5 text-on-surface-variant opacity-40" />
        </div>
        
        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-105 transition-all">
          <BookOpen className="size-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
             <h3 className="text-lg font-black uppercase tracking-tight truncate">{course.title}</h3>
             <span className={cn(
               "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
               course.status === "PUBLISHED" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
             )}>
                {course.status}
             </span>
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mt-0.5">
            {course.units.length} Units • {course.units.reduce((acc, u) => acc + u.concepts.length, 0)} Concepts
          </p>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
           <Button asChild variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-primary/10 text-primary" onClick={e => e.stopPropagation()}>
              <Link href={`/student/curriculum#course-${course.id}`} target="_blank" title="Preview Course">
                 <ExternalLink className="size-4" />
              </Link>
           </Button>
           <Button asChild variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-primary/10 text-primary" onClick={e => e.stopPropagation()}>
              <Link href={`/admin/studio/editor/course/${course.id}`}>
                 <Edit className="size-4" />
              </Link>
           </Button>
           <Button asChild variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-primary/10 text-primary" onClick={e => e.stopPropagation()}>
              <Link href={`/admin/studio/editor/unit/new?courseId=${course.id}`}>
                 <Plus className="size-4" />
              </Link>
           </Button>
           <DeleteButton id={course.id} contentType="course" title={course.title} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="pl-12 relative space-y-2 overflow-hidden"
          >
            <div className="absolute left-6 top-0 bottom-8 w-px bg-gradient-to-b from-primary/20 to-transparent" />
            
            <div className="pt-2 pb-4 space-y-2">
              {course.units.map((unit) => (
                <UnitExplorerItem 
                  key={unit.id} 
                  unit={unit} 
                  expanded={expandedNodes.has(unit.id)}
                  onToggle={() => toggleNode(unit.id)}
                />
              ))}
              
              {course.units.length === 0 && (
                <div className="py-8 pl-8 text-center border-2 border-dashed border-outline-variant/30 rounded-[2rem]">
                   <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 italic">No units yet</p>
                   <Button asChild variant="link" size="sm" className="mt-2 text-primary">
                      <Link href={`/admin/studio/editor/unit/new?courseId=${course.id}`}>
                         Create the first unit
                      </Link>
                   </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function UnitExplorerItem({ 
  unit, 
  expanded,
  onToggle
}: { 
  unit: UnitNode
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="space-y-2">
      <div 
        className={cn(
          "flex items-center gap-4 p-3 rounded-[1.5rem] cursor-pointer text-on-surface transition-all group border border-transparent",
          expanded 
            ? "bg-surface-container border-outline-variant shadow-sm" 
            : "hover:bg-surface-container-low"
        )}
        onClick={onToggle}
      >
        <div className={cn(
          "shrink-0 transition-transform duration-300",
          expanded && "rotate-90"
        )}>
           <ChevronRight className="size-4 text-on-surface-variant opacity-20" />
        </div>
        
        <div className="size-10 rounded-xl bg-surface-container-highest text-on-surface-variant flex items-center justify-center transition-all group-hover:bg-primary/5 group-hover:text-primary">
          <Layers className="size-5" />
        </div>
        
        <div className="flex-1 min-w-0">
           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 leading-none mb-1">Unit {unit.order}</p>
           <h4 className="text-sm font-bold truncate">{unit.title}</h4>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
           <Button asChild variant="ghost" size="icon" className="size-9 rounded-lg hover:bg-primary/10 text-primary" onClick={e => e.stopPropagation()}>
              <Link href={`/student/curriculum#unit-${unit.id}`} target="_blank" title="Preview Unit">
                 <ExternalLink className="size-3.5" />
              </Link>
           </Button>
           <Button asChild variant="ghost" size="icon" className="size-9 rounded-lg hover:bg-primary/10 text-primary" onClick={e => e.stopPropagation()}>
              <Link href={`/admin/studio/editor/unit/${unit.id}`}>
                 <Edit className="size-3.5" />
              </Link>
           </Button>
           <Button asChild variant="ghost" size="icon" className="size-9 rounded-lg hover:bg-primary/10 text-primary" onClick={e => e.stopPropagation()}>
              <Link href={`/admin/studio/editor/concept/new?unitId=${unit.id}`}>
                 <Plus className="size-3.5" />
              </Link>
           </Button>
           <DeleteButton id={unit.id} contentType="unit" title={unit.title} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className="pl-10 relative space-y-1 overflow-hidden"
          >
            <div className="absolute left-5 top-0 bottom-6 w-px bg-outline-variant/20" />
            
            <div className="pt-1 pb-3 space-y-1">
              {unit.concepts.map((concept) => (
                <div
                  key={concept.id}
                  className="group flex items-center gap-4 p-2.5 rounded-xl hover:bg-surface-container-high transition-all border border-transparent hover:border-outline-variant/30"
                >
                  <div className="size-8 rounded-lg bg-surface-container-highest text-on-surface-variant/40 flex items-center justify-center transition-all group-hover:text-primary/60 group-hover:bg-primary/5">
                    <Lightbulb className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-on-surface-variant group-hover:text-on-surface transition-colors truncate block">
                      {concept.title}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant/30">Concept</span>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <Button asChild variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-primary/10 text-primary">
                       <Link href={`/admin/studio/editor/concept/${concept.id}`}>
                          <Edit className="size-3" />
                       </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-primary/10 text-primary">
                       <Link href={`/student/concept/${concept.id}/learn`} target="_blank">
                          <ExternalLink className="size-3" />
                       </Link>
                    </Button>
                    <DeleteButton id={concept.id} contentType="concept" title={concept.title} />
                  </div>
                </div>
              ))}
              
              {unit.concepts.length === 0 && (
                <p className="py-4 pl-12 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/30 italic">No concepts in this unit</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DeleteButton({ id, contentType, title }: { id: string, contentType: string, title: string }) {
  const [isPending, startTransition] = useTransition()
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Are you sure you want to delete the ${contentType} "${title}"? This action cannot be undone.`)) {
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append("id", id)
      formData.append("contentType", contentType)
      formData.append("returnTo", "/admin/studio/explorer") // We'll stay on the explorer page
      
      try {
        await deleteCmsItem(formData)
      } catch (error) {
        console.error("Failed to delete:", error)
        alert("Failed to delete item. It may have associated content that prevents deletion.")
      }
    })
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className={cn(
        "size-8 rounded-lg text-on-surface-variant/40 hover:bg-rose-500/10 hover:text-rose-500",
        isPending && "animate-pulse"
      )} 
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </Button>
  )
}
