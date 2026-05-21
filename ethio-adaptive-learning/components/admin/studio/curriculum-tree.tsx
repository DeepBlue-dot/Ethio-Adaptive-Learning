"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  Lightbulb, 
  BookOpen, 
  Plus, 
  Network
} from "lucide-react"

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
  const [activeTab, setActiveTab] = useState<"courses" | "units" | "concepts">("courses")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(courses.map(c => c.id)))

  const toggleNode = (id: string) => {
    const next = new Set(expandedNodes)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedNodes(next)
  }

  return (
    <div className="flex h-full flex-col bg-surface-container overflow-hidden">
      {/* Context Header */}
      <div className="p-4 border-b border-outline-variant bg-surface-container-highest shrink-0">
        <h2 className="text-[10px] font-bold text-on-surface uppercase tracking-[0.2em] mb-1">
          Curriculum Tree
        </h2>
        <p className="text-xs text-on-surface-variant font-medium">Studio Browser</p>
        
        {/* Context Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto custom-scrollbar pb-1">
          <TabButton 
            active={activeTab === "courses"} 
            onClick={() => setActiveTab("courses")}
            icon={<Network className="size-3.5" />}
            label="Courses"
          />
          <TabButton 
            active={activeTab === "units"} 
            onClick={() => setActiveTab("units")}
            icon={<Layers className="size-3.5" />}
            label="Units"
          />
          <TabButton 
            active={activeTab === "concepts"} 
            onClick={() => setActiveTab("concepts")}
            icon={<Lightbulb className="size-3.5" />}
            label="Concepts"
          />
        </div>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 bg-surface-container/50">
        {courses.map((course) => (
          <CourseItem 
            key={course.id} 
            course={course} 
            expanded={expandedNodes.has(course.id)}
            onToggle={() => toggleNode(course.id)}
            activePath={pathname}
            expandedNodes={expandedNodes}
            toggleNode={toggleNode}
          />
        ))}
        
        <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/5 transition-all mt-6 border border-dashed border-primary/20">
          <Plus className="size-3" />
          Add Course
        </button>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
        active 
          ? "text-on-surface bg-surface-variant shadow-sm" 
          : "text-on-surface-variant hover:bg-surface-container-high"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
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
  const isActive = activePath === `/admin/studio/course/${course.id}`

  return (
    <div className="space-y-1 animate-in fade-in duration-300">
      <div 
        className={cn(
          "flex items-center gap-2 p-1.5 pr-3 hover:bg-surface-container-high rounded-xl cursor-pointer text-on-surface transition-all group",
          isActive && "bg-surface-variant text-on-surface font-semibold ring-1 ring-primary/20 shadow-sm"
        )}
        onClick={onToggle}
      >
        <span className="text-secondary shrink-0 transition-transform duration-200 group-hover:scale-110">
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
        <span className="text-primary shrink-0">
          <BookOpen className="size-[18px]" />
        </span>
        <Link href={`/admin/studio/course/${course.id}`} className="truncate flex-1 text-[13px]" onClick={(e) => e.stopPropagation()}>
          {course.title}
        </Link>
      </div>

      {expanded && (
        <div className="pl-6 relative space-y-1 pt-1 pb-1">
          {/* Tree Line */}
          <div className="tree-line ml-[1px]" />
          
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
      )}
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
  const isActive = activePath === `/admin/studio/unit/${unit.id}`

  return (
    <div className="space-y-1 animate-in fade-in slide-in-from-left-2 duration-300">
      <div 
        className={cn(
          "flex items-center gap-2 p-1.5 pr-3 hover:bg-surface-container-high rounded-xl cursor-pointer text-on-surface transition-all group",
          isActive && "bg-surface-variant text-on-surface font-semibold ring-1 ring-primary/20 shadow-sm"
        )}
        onClick={onToggle}
      >
        <span className="text-secondary/60 shrink-0">
          {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </span>
        <span className="text-primary shrink-0 opacity-70 group-hover:opacity-100">
          <Layers className="size-3.5" />
        </span>
        <Link href={`/admin/studio/unit/${unit.id}`} className="truncate flex-1 text-[12px]" onClick={(e) => e.stopPropagation()}>
          Unit {unit.order}: {unit.title}
        </Link>
      </div>

      {expanded && (
        <div className="pl-6 relative space-y-1 pt-1 pb-1">
          {/* Tree Line */}
          <div className="tree-line ml-[1px] opacity-60" />
          
          {unit.concepts.map((concept) => {
            const isConceptActive = activePath === `/admin/studio/concept/${concept.id}`
            return (
              <div 
                key={concept.id}
                className={cn(
                  "flex items-center gap-2 p-1.5 pr-3 hover:bg-surface-container-high rounded-lg cursor-pointer text-on-surface-variant transition-all group",
                  isConceptActive && "bg-white dark:bg-slate-900 text-primary font-bold shadow-sm ring-1 ring-primary/10"
                )}
              >
                <span className="opacity-0 shrink-0">
                  <ChevronRight className="size-3.5" />
                </span>
                <span className="text-tertiary-container shrink-0 opacity-50 group-hover:opacity-100">
                  <Lightbulb className="size-3.5" />
                </span>
                <Link href={`/admin/studio/concept/${concept.id}`} className="truncate flex-1 text-[11px]">
                  {concept.title}
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
