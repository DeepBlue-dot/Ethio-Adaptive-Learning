import React from "react"
import { 
  Users, 
  Shield, 
  Key, 
  Globe, 
  ArrowUpRight,
  UserCheck,
  ShieldAlert,
  Zap
} from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function PlatformOverviewPage() {
  const [userCounts, adminCount, writerCount, studentCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "COURSE_WRITER" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
  ])

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-3">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Platform Core</span>
           </div>
           <h1 className="text-4xl font-black text-on-surface uppercase tracking-tight leading-none">Infrastructure Overview</h1>
           <p className="text-on-surface-variant opacity-60 mt-3 max-w-xl font-medium">
              Manage the foundational elements of the EthioPrep platform: identity, security, and regional configuration.
           </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <OverviewStatCard 
            label="Total Identities" 
            value={userCounts} 
            icon={<Users className="size-5" />}
            color="blue"
         />
         <OverviewStatCard 
            label="Administrative Staff" 
            value={adminCount + writerCount} 
            icon={<Shield className="size-5" />}
            color="rose"
         />
         <OverviewStatCard 
            label="Active Students" 
            value={studentCount} 
            icon={<UserCheck className="size-5" />}
            color="emerald"
         />
         <OverviewStatCard 
            label="API Uptime" 
            value="99.9%" 
            icon={<Zap className="size-5" />}
            color="amber"
         />
      </div>

      {/* Navigation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <PlatformModuleLink 
            title="User Management"
            description="Manage all platform accounts, roles, and status. Perform role escalations and audit individual access."
            href="/admin/platform/users"
            icon={<Users className="size-6" />}
            stats={[`${userCounts} Accounts`, "Real-time Filtering"]}
         />
         <PlatformModuleLink 
            title="Roles & Permissions"
            description="Configure granular access control for staff. Manage the capabilities of Admins and Course Writers."
            href="/admin/platform/roles"
            icon={<ShieldAlert className="size-6" />}
            stats={["RBAC Matrix", "3 Global Roles"]}
         />
         <PlatformModuleLink 
            title="API Configuration"
            description="Manage system secrets, webhook endpoints, and third-party integration toggles."
            href="/admin/platform/api"
            icon={<Key className="size-6" />}
            stats={["Secret Vault", "Rate Policy"]}
         />
         <PlatformModuleLink 
            title="Regional Settings"
            description="Configure Ethiopian curriculum standards, grade level mappings, and default localization."
            href="/admin/platform/locales"
            icon={<Globe className="size-6" />}
            stats={["Locale Sync", "Grade Standards"]}
         />
      </div>
    </div>
  )
}

function OverviewStatCard({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: 'blue' | 'rose' | 'emerald' | 'amber' }) {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100"
  }

  return (
    <div className="bg-white border border-outline-variant rounded-[2rem] p-6 shadow-sm">
       <div className="size-10 rounded-2xl flex items-center justify-center border mb-4 shadow-sm transition-transform hover:scale-110">
          <div className={colors[color]}>{icon}</div>
       </div>
       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-60 mb-1">{label}</p>
       <p className="text-3xl font-black text-on-surface tracking-tighter">{value}</p>
    </div>
  )
}

function PlatformModuleLink({ title, description, href, icon, stats }: { title: string, description: string, href: string, icon: React.ReactNode, stats: string[] }) {
  return (
    <Link href={href} className="group">
       <div className="bg-white border border-outline-variant rounded-[2.5rem] p-8 shadow-sm group-hover:shadow-xl group-hover:border-primary/20 transition-all group-hover:-translate-y-1 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
             <div className="size-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-all">
                {icon}
             </div>
             <div className="size-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-all">
                <ArrowUpRight className="size-5" />
             </div>
          </div>
          <h3 className="text-lg font-black text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors mb-2">{title}</h3>
          <p className="text-sm text-on-surface-variant font-medium leading-relaxed flex-1 mb-8">
             {description}
          </p>
          <div className="flex flex-wrap gap-2">
             {stats.map((s, i) => (
                <span key={i} className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/30">
                   {s}
                </span>
             ))}
          </div>
       </div>
    </Link>
  )
}
