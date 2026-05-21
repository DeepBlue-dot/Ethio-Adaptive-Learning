import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { User, Shield, GraduationCap, Mail, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export default async function PlatformUsersPage() {
  await requireRole("ADMIN")
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { profile: true }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-on-surface tracking-tight">Platform Users</h1>
          <p className="text-on-surface-variant mt-1.5">Manage accounts and global access permissions.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant/50" />
          <input 
            type="text" 
            placeholder="Filter users..."
            className="pl-9 pr-4 py-2 rounded-xl border border-outline-variant bg-surface text-sm focus:border-primary outline-none transition-all w-full sm:w-64"
          />
        </div>
      </div>

      <div className="bg-surface border border-outline-variant rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-surface-container-low/50 text-[10px] uppercase tracking-widest font-black text-on-surface-variant/60 border-b border-outline-variant">
                <th className="py-4 px-6 lg:px-8">User Identity</th>
                <th className="py-4 px-4">Role & Access</th>
                <th className="py-4 px-4 hidden md:table-cell">Academic Context</th>
                <th className="py-4 px-4 hidden lg:table-cell">Engagement</th>
                <th className="py-4 px-6 lg:px-8 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-surface-container-low/30 transition-colors group">
                  <td className="py-4 px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full bg-primary/5 dark:bg-primary/20 flex items-center justify-center text-xs font-bold text-primary border border-primary/10">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-on-surface truncate">{user.username}</span>
                        <div className="flex items-center gap-1 text-[10px] text-on-surface-variant opacity-60">
                           <Mail className="size-3" />
                           <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                     <span className={cn(
                       "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1.5 w-fit",
                       user.role === 'ADMIN' ? "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30" :
                       user.role === 'COURSE_WRITER' ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30" :
                       "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
                     )}>
                       {user.role === 'ADMIN' ? <Shield className="size-3" /> : <User className="size-3" />}
                       {user.role}
                     </span>
                  </td>
                  <td className="py-4 px-4 hidden md:table-cell">
                     <div className="flex items-center gap-2 text-on-surface-variant">
                        <GraduationCap className="size-4 opacity-40" />
                        <span className="font-medium">{user.grade || 'Staff'}</span>
                     </div>
                  </td>
                  <td className="py-4 px-4 hidden lg:table-cell text-on-surface-variant opacity-70">
                     {user.profile?.currentLevel ? `Level ${user.profile.currentLevel}` : 'N/A'}
                  </td>
                  <td className="py-4 px-6 lg:px-8 text-right">
                     <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-medium text-on-surface">{new Date(user.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] text-on-surface-variant opacity-40 uppercase tracking-tighter">Verified</span>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="p-6 bg-amber-50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20 rounded-3xl flex items-center gap-4">
         <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-amber-200 dark:border-amber-900/40 text-amber-600">
            <Shield className="size-5" />
         </div>
         <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-400">Security Notice</p>
            <p className="text-xs text-amber-800 dark:text-amber-500 opacity-80 truncate">Role modifications for Admin users must be verified through two-factor authentication.</p>
         </div>
      </div>
    </div>
  )
}
