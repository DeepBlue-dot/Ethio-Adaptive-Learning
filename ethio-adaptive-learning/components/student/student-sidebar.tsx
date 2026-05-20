"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home as HomeIcon, 
  GitBranch, 
  BrainCircuit, 
  BarChart3, 
  Library, 
  Settings as SettingsIcon, 
  HelpCircle 
} from "lucide-react"

import { cn } from "@/lib/utils"

type StudentSidebarProps = {
  username: string
  role: string
  level: number
}

const navLinks = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/concepts", label: "Curriculum", icon: GitBranch },
  { href: "/learn", label: "Socratic Tutor", icon: BrainCircuit },
  { href: "/performance", label: "Performance", icon: BarChart3 },
  { href: "/library", label: "Library", icon: Library },
]

export function StudentSidebar({
  username,
  role,
  level,
}: StudentSidebarProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed left-0 top-0 h-full w-64 z-40 hidden md:flex flex-col bg-surface-container-low border-r border-outline-variant/30 shadow-sm pt-20 pb-8 px-4">
      <div className="mb-8 px-4 flex flex-col gap-1">
        <div className="font-display-lg text-2xl text-primary tracking-tight font-extrabold">EthioPrep AI</div>
        <div className="flex items-center gap-3 mt-4">
          <div className="size-10 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold">
            {username[0].toUpperCase()}
          </div>
          <div>
            <div className="font-label-md text-sm font-semibold text-on-surface">Grade 12</div>
            <div className="font-caption text-xs text-on-surface-variant">Natural Science Stream</div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center px-4 py-3 gap-3 rounded-lg transition-all duration-150 ease-out cursor-pointer",
                isActive 
                  ? "bg-primary-container/20 text-primary font-bold border-r-4 border-primary" 
                  : "text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1"
              )}
            >
              <link.icon className={cn("size-5", isActive && "fill-primary/20")} />
              <span className="font-label-md text-sm">{link.label}</span>
            </Link>
          )
        })}
      </div>

      <div className="mt-auto space-y-1">
        <button className="w-full bg-warning-gold/20 text-on-tertiary-fixed-variant font-label-md text-sm font-semibold py-2 rounded-lg mb-4 hover:bg-warning-gold/30 transition-colors">
          Upgrade to Premium
        </button>
        <Link 
          href="/settings" 
          className="flex items-center px-4 py-3 gap-3 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg hover:translate-x-1"
        >
          <SettingsIcon className="size-5" />
          <span className="font-label-md text-sm">Settings</span>
        </Link>
        <Link 
          href="/support" 
          className="flex items-center px-4 py-3 gap-3 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg hover:translate-x-1"
        >
          <HelpCircle className="size-5" />
          <span className="font-label-md text-sm">Support</span>
        </Link>
      </div>
    </nav>
  )
}
