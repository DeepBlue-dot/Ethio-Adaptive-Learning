"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  BookMarked, 
  ChevronDown, 
  ChevronRight, 
  Database, 
  FileText, 
  Network, 
  Plus, 
  Search 
} from "lucide-react"

import { cn } from "@/lib/utils"

interface ConceptNode {
  id: string
  title: string
  slug: string
}

interface UnitNode {
  id: string
  title: string
  order: number
  concepts: ConceptNode[]
}

interface CourseNode {
  id: string
  title: string
  slug: string
  units: UnitNode[]
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

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.units.some(unit => 
      unit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.concepts.some(concept => concept.title.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  )

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
          Curriculum Navigator
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-white pl-9 pr-3 py-2 text-xs outline-none transition focus:border-teal-600/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {filteredCourses.map((course) => (
            <CourseItem 
              key={course.id} 
              course={course} 
              expanded={expandedNodes.has(course.id)}
              onToggle={() => toggleNode(course.id)}
              activeId={pathname}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
            />
          ))}
          
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors mt-4">
            <Plus className="size-3" />
            Add new Course
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
  activeId,
  expandedNodes,
  toggleNode
}: { 
  course: CourseNode
  expanded: boolean
  onToggle: () => void
  activeId: string
  expandedNodes: Set<string>
  toggleNode: (id: string) => void
}) {
  const isActive = activeId === `/admin/cms/course/${course.id}`

  return (
    <div className="space-y-1">
      <div className="group flex items-center gap-1">
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors"
        >
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
        <Link
          href={`/admin/cms/course/${course.id}`}
          className={cn(
            "flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors",
            isActive ? "bg-teal-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
          )}
        >
          <BookMarked className={cn("size-3.5", isActive ? "text-teal-100" : "text-teal-600")} />
          <span className="truncate">{course.title}</span>
        </Link>
      </div>

      {expanded && (
        <div className="ml-4 border-l border-border pl-2 space-y-1">
          {course.units.map((unit) => (
            <UnitItem 
              key={unit.id} 
              unit={unit} 
              activeId={activeId}
              expanded={expandedNodes.has(unit.id)}
              onToggle={() => toggleNode(unit.id)}
            />
          ))}
          <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-teal-600 transition-colors">
            <Plus className="size-3" />
            Unit
          </button>
        </div>
      )}
    </div>
  )
}

function UnitItem({ 
  unit, 
  activeId,
  expanded,
  onToggle
}: { 
  unit: UnitNode
  activeId: string
  expanded: boolean
  onToggle: () => void
}) {
  const isActive = activeId === `/admin/cms/unit/${unit.id}`

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-slate-200 text-slate-300 transition-colors"
        >
          {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        </button>
        <Link
          href={`/admin/cms/unit/${unit.id}`}
          className={cn(
            "flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
            isActive ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <Database className={cn("size-3.5", isActive ? "text-slate-400" : "text-slate-400")} />
          <span className="truncate">Unit {unit.order}: {unit.title}</span>
        </Link>
      </div>

      {expanded && (
        <div className="ml-4 border-l border-border pl-2 space-y-0.5">
          {unit.concepts.map((concept) => {
            const isConceptActive = activeId === `/admin/cms/concept/${concept.id}`
            return (
              <Link
                key={concept.id}
                href={`/admin/cms/concept/${concept.id}`}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors",
                  isConceptActive ? "bg-slate-100 text-teal-700 font-bold" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <div className={cn("size-1 rounded-full", isConceptActive ? "bg-teal-500" : "bg-slate-300")} />
                <span className="truncate">{concept.title}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
