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
  Network,
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

type TreeTab = "courses" | "units" | "concepts"

export function CurriculumTree({ 
  courses 
}: { 
  courses: CourseNode[] 
}) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<TreeTab>("courses")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(courses.map(c => c.id)))

  const toggleNode = (id: string) => {
    const next = new Set(expandedNodes)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedNodes(next)
  }

  return (
    <div className="flex h-full flex-col bg-surface-container overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-outline-variant bg-surface-container-highest shrink-0">
        <h2 className="text-[11px] font-bold text-on-surface uppercase tracking-wider mb-1">
          Curriculum Tree
        </h2>
        <p className="text-on-surface-variant text-xs">Browser</p>
        
        {/* Context Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto custom-scrollbar pb-1">
          <TabButton 
            active={activeTab === "courses"} 
            onClick={() => setActiveTab("courses")}
            icon={<Network className="size-[16px]" />}
            label="Courses"
          />
          <TabButton 
            active={activeTab === "units"} 
            onClick={() => setActiveTab("units")}
            icon={<Layers className="size-[16px]" />}
            label="Units"
          />
          <TabButton 
            active={activeTab === "concepts"} 
            onClick={() => setActiveTab("concepts")}
            icon={<Lightbulb className="size-[16px]" />}
            label="Concepts"
          />
        </div>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <div className="space-y-1">
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
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1",
        active 
          ? "text-on-surface bg-surface-variant" 
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
    <div className="space-y-1">
      <div 
        className={cn(
          "flex items-center gap-2 p-1.5 hover:bg-surface-container-high rounded-sm cursor-pointer text-on-surface font-medium",
          isActive && "bg-surface-variant border-l-2 border-primary -ml-[2px]"
        )}
        onClick={onToggle}
      >
        <span className="text-secondary">
          {expanded ? <ChevronDown className="size-[18px]" /> : <ChevronRight className="size-[18px]" />}
        </span>
        <span className="text-primary">
          <BookOpen className="size-[18px]" />
        </span>
        <Link href={`/admin/studio/course/${course.id}`} className="truncate" onClick={(e) => e.stopPropagation()}>
          {course.title}
        </Link>
      </div>

      {expanded && (
        <div className="pl-6 relative space-y-1">
          {/* Tree Line */}
          <div className="tree-line" />
          
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
    <div className="space-y-1">
      <div 
        className={cn(
          "flex items-center gap-2 p-1.5 hover:bg-surface-container-high rounded-sm cursor-pointer text-on-surface font-medium",
          isActive && "bg-surface-variant border-l-2 border-primary -ml-[2px]"
        )}
        onClick={onToggle}
      >
        <span className="text-secondary">
          {expanded ? <ChevronDown className="size-[18px]" /> : <ChevronRight className="size-[18px]" />}
        </span>
        <span className="text-primary">
          <Layers className="size-[18px]" />
        </span>
        <Link href={`/admin/studio/unit/${unit.id}`} className="truncate" onClick={(e) => e.stopPropagation()}>
          Unit {unit.order}: {unit.title}
        </Link>
      </div>

      {expanded && (
        <div className="pl-6 relative space-y-1">
          {/* Tree Line */}
          <div className="tree-line" />
          
          {unit.concepts.map((concept) => {
            const isConceptActive = activePath === `/admin/studio/concept/${concept.id}`
            return (
              <div 
                key={concept.id}
                className={cn(
                  "flex items-center gap-2 p-1.5 hover:bg-surface-container-high rounded-sm cursor-pointer text-on-surface-variant",
                  isConceptActive && "bg-surface-variant text-on-surface font-medium border-l-2 border-primary -ml-[2px]"
                )}
              >
                <span className="opacity-0">
                  <ChevronRight className="size-[18px]" />
                </span>
                <span className="text-tertiary-container">
                  <Lightbulb className="size-[18px]" />
                </span>
                <Link href={`/admin/studio/concept/${concept.id}`} className="truncate flex-1">
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
