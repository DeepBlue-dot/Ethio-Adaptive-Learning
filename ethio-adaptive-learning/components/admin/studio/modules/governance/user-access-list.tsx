"use client"

import React from "react"
import { format } from "date-fns"
import { 
  UserCircle, 
  ShieldCheck, 
  BookOpen, 
  HelpCircle,
  MoreVertical,
  Mail,
  Calendar
} from "lucide-react"

interface GovernanceUser {
  id: string
  username: string
  email: string
  role: string
  createdAt: Date
  _count: {
    authoredCourses: number
    authoredQuestions: number
  }
}

export function UserAccessList({ users }: { users: GovernanceUser[] }) {
  return (
    <div className="bg-white border border-outline-variant rounded-[2rem] overflow-hidden shadow-sm">
      <div className="p-8 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
         <div>
            <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Administrative Team</h3>
            <p className="text-xs text-on-surface-variant opacity-60 mt-1">Manage system-wide permissions and roles.</p>
         </div>
         <button className="px-6 py-2.5 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95">
            Add New Member
         </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-highest/30">
              <th className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Identity</th>
              <th className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Access Role</th>
              <th className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Content Load</th>
              <th className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Joined</th>
              <th className="px-8 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-surface-container-lowest transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                      <UserCircle className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-on-surface uppercase tracking-tight">{user.username}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <Mail className="size-3 text-on-surface-variant opacity-40" />
                         <span className="text-[11px] text-on-surface-variant opacity-60">{user.email}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      user.role === 'ADMIN' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {user.role}
                    </div>
                    {user.role === 'ADMIN' && <ShieldCheck className="size-3.5 text-emerald-500" />}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5" title="Courses Authored">
                      <BookOpen className="size-3.5 text-primary opacity-40" />
                      <span className="text-xs font-bold text-on-surface">{user._count.authoredCourses}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Questions Authored">
                      <HelpCircle className="size-3.5 text-primary opacity-40" />
                      <span className="text-xs font-bold text-on-surface">{user._count.authoredQuestions}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                     <Calendar className="size-3.5 text-on-surface-variant opacity-40" />
                     <span className="text-xs text-on-surface-variant opacity-60">{format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="size-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-all ml-auto">
                    <MoreVertical className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
