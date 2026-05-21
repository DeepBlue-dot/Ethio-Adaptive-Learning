"use client"

import React from "react"
import { Bell, History, Menu, Search } from "lucide-react"
import type { UserRole } from "@prisma/client"

import { useStudioLayout } from "./studio-layout-provider"
import { UserMenu } from "@/components/shared/user-menu"

export function WorkspaceHeader({ 
  title, 
  username, 
  role,
  children 
}: { 
  title: string, 
  username: string, 
  role: UserRole,
  children?: React.ReactNode
}) {
  const { setIsMobileNexusOpen } = useStudioLayout()

  return (
    <header className="bg-surface-container-lowest border-b border-outline-variant h-16 flex justify-between items-center px-4 lg:px-8 sticky top-0 z-30 shadow-sm shrink-0">
      <div className="flex items-center gap-4">
        <button 
          className="lg:hidden p-2 text-on-surface hover:bg-surface-container rounded-lg"
          onClick={() => setIsMobileNexusOpen(true)}
        >
          <Menu className="size-6" />
        </button>
        <h1 className="font-display text-lg font-bold text-on-surface truncate hidden sm:block">{title}</h1>
        
        {children}
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Global Search */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary size-[16px]" />
          <input
            className="pl-9 pr-10 py-1.5 bg-surface border border-outline-variant rounded-full text-sm w-48 xl:w-64 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            placeholder="Search..."
            type="text"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-surface-variant rounded text-[10px] text-secondary font-mono border border-outline-variant/30">⌘K</div>
        </div>

        {/* Actions */}
        <button className="text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container hidden sm:block">
          <Bell className="size-5" />
        </button>
        <button className="text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container">
          <History className="size-5" />
        </button>
        
        <div className="w-px h-6 bg-outline-variant mx-1 lg:mx-2"></div>
        
        <UserMenu username={username} role={role} />
      </div>
    </header>
  )
}
