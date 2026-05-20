import Link from "next/link"
import { 
  Bell, 
  Search, 
  Bot, 
  Verified 
} from "lucide-react"

import { StudentSidebar } from "@/components/student/student-sidebar"
import { UserMenu } from "@/components/shared/user-menu"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireRole("STUDENT")
  const profile = await prisma.userProfile.findUnique({
    where: {
      userId: session.user.id,
    },
  })

  return (
    <div className="flex min-h-screen bg-background text-on-surface antialiased">
      {/* Sidebar - Hidden on mobile, fixed on desktop */}
      <StudentSidebar
        username={session.user.username}
        role={session.user.role}
        level={profile?.currentLevel ?? 1}
      />

      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col md:ml-64 relative min-h-screen">
        {/* Top App Bar */}
        <header className="fixed top-0 right-0 left-0 z-50 h-16 bg-surface-glass/80 backdrop-blur-xl border-b border-outline-variant/20 flex justify-between items-center px-4 md:px-12 md:pl-72 transition-all">
          <div className="flex items-center gap-8 flex-1">
            <div className="md:hidden font-display-lg text-2xl font-extrabold text-primary tracking-tight">
              EthioPrep AI
            </div>
            
            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                href="/dashboard" 
                className="text-primary border-b-2 border-primary pb-1 font-label-md text-sm active:scale-95 transition-transform cursor-pointer"
              >
                Dashboard
              </Link>
              <Link 
                href="/labs" 
                className="text-on-surface-variant hover:text-primary transition-all duration-200 px-2 py-1 rounded font-label-md text-sm active:scale-95 transition-transform cursor-pointer"
              >
                Labs
              </Link>
              <Link 
                href="/arena" 
                className="text-on-surface-variant hover:text-primary transition-all duration-200 px-2 py-1 rounded font-label-md text-sm active:scale-95 transition-transform cursor-pointer"
              >
                Exam Arena
              </Link>
            </nav>
          </div>

          {/* Search (CMD+K) */}
          <div className="hidden lg:flex items-center bg-surface-container-low border border-outline-variant/50 rounded-full px-4 py-1.5 mr-6 text-on-surface-variant cursor-text hover:bg-surface-container-high transition-colors w-64 justify-between">
            <div className="flex items-center gap-2">
              <Search className="size-4 text-outline" />
              <span className="font-body-md text-sm text-outline">Search concepts...</span>
            </div>
            <kbd className="font-caption text-[10px] text-outline bg-surface rounded px-1.5 border border-outline-variant/30">⌘K</kbd>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-success-emerald/10 text-success-emerald px-3 py-1 rounded-full font-label-md text-xs font-bold">
              <Verified className="size-4" />
              85% Mastery
            </div>
            
            <button className="text-primary hover:bg-surface-container-highest/50 p-2 rounded-full transition-all duration-200 active:scale-95">
              <Bell className="size-5" />
            </button>
            
            <UserMenu username={session.user.username} role={session.user.role} />
          </div>
        </header>

        {/* Canvas / Main Content */}
        <main className="flex-1 pt-24 pb-12 px-4 md:px-12 overflow-y-auto tibeb-pattern">
          {children}
        </main>
      </div>
    </div>
  )
}
