import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function PlatformUsersPage() {
  await requireRole("ADMIN")
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { profile: true }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-black text-on-surface tracking-tight">Platform Users</h1>
        <p className="text-secondary-foreground opacity-60 mt-1">Manage accounts and platform permissions.</p>
      </div>

      <div className="bg-white border border-outline-variant rounded-[2rem] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase tracking-widest font-black text-secondary-foreground/50 border-b border-outline-variant">
              <th className="py-4 px-8">User</th>
              <th className="py-4 px-4">Role</th>
              <th className="py-4 px-4">Grade</th>
              <th className="py-4 px-8 text-right">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-8">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/5 flex items-center justify-center text-[10px] font-bold text-primary">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{user.username}</span>
                      <span className="text-[10px] text-secondary-foreground opacity-50">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                   <span className="px-2 py-0.5 rounded-[4px] bg-slate-100 text-[10px] font-bold uppercase border border-outline-variant/30">
                     {user.role}
                   </span>
                </td>
                <td className="py-4 px-4 text-secondary-foreground opacity-70">
                   {user.grade || 'N/A'}
                </td>
                <td className="py-4 px-8 text-right text-xs text-secondary-foreground opacity-60">
                   {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
