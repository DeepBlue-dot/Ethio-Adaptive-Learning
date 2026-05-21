"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  FileText, 
  Image, 
  Library, 
  Video,
  PlusCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

const ASSET_NODES = [
  { id: "all", label: "All Assets", icon: Library, href: "/admin/assets" },
  { id: "images", label: "Images", icon: Image, href: "/admin/assets" },
  { id: "videos", label: "Videos", icon: Video, href: "/admin/assets" },
  { id: "snippets", label: "Text Snippets", icon: FileText, href: "/admin/assets" },
]

export function AssetsSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-surface-container overflow-hidden">
      <div className="p-4 border-b border-outline-variant bg-surface-container-highest shrink-0">
        <h2 className="text-[10px] font-bold text-on-surface uppercase tracking-wider mb-1">
          Assets
        </h2>
        <p className="text-on-surface-variant text-xs font-medium">Instructional Media</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 bg-surface-container/50">
        {ASSET_NODES.map((node) => {
          const isActive = pathname === node.href && node.id === "all"
          
          return (
            <Link
              key={node.id}
              href={node.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-[13px] font-medium transition-all rounded-xl",
                isActive 
                  ? "bg-surface-variant text-on-surface border-l-2 border-primary shadow-sm" 
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              )}
            >
              <node.icon className={cn("size-4", isActive ? "text-primary" : "text-primary/50")} />
              <span className="truncate">{node.label}</span>
            </Link>
          )
        })}
        
        <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/5 transition-all mt-6 border border-dashed border-primary/20">
          <PlusCircle className="size-3" />
          Upload New
        </button>
      </div>
    </div>
  )
}
