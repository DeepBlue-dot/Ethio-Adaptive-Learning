import React from "react"
import { Shield, ShieldAlert, Gavel, Lock } from "lucide-react"

export default async function PlatformRolesPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div>
         <h1 className="text-3xl font-display font-black text-on-surface uppercase tracking-tight">Roles & Permissions</h1>
         <p className="text-secondary-foreground opacity-60 mt-1">Configure granular access control and staff capabilities.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <RoleCard 
            title="Administrator" 
            description="Full access to all platform systems, user management, and configuration."
            icon={<Shield className="size-6 text-rose-600" />}
            count={2}
         />
         <RoleCard 
            title="Course Writer" 
            description="Access to curriculum studio, asset library, and content diagnostics."
            icon={<Gavel className="size-6 text-amber-600" />}
            count={5}
         />
         <RoleCard 
            title="Student" 
            description="Standard access to learning paths, dashboard, and assessment results."
            icon={<Lock className="size-6 text-emerald-600" />}
            count={1240}
         />
      </div>

      <div className="bg-surface-container-lowest border border-dashed border-outline-variant rounded-[3rem] py-24 text-center">
          <ShieldAlert className="size-12 mx-auto text-on-surface-variant opacity-20 mb-4" />
          <h3 className="text-lg font-black text-on-surface uppercase tracking-tight opacity-40">Permission Matrix</h3>
          <p className="text-sm text-on-surface-variant opacity-30 mt-2 max-w-sm mx-auto">
             The advanced capability override system is currently under initialization.
          </p>
      </div>
    </div>
  )
}

function RoleCard({ title, description, icon, count }: { title: string, description: string, icon: React.ReactNode, count: number }) {
  return (
    <div className="bg-white border border-outline-variant rounded-[2rem] p-8 shadow-sm group hover:border-primary/20 transition-all">
       <div className="flex items-center justify-between mb-6">
          <div className="size-12 rounded-2xl bg-surface-container-low flex items-center justify-center border border-outline-variant/30">
             {icon}
          </div>
          <span className="text-[10px] font-black bg-primary/5 text-primary px-3 py-1 rounded-full uppercase tracking-widest">{count} Active</span>
       </div>
       <h3 className="text-lg font-black text-on-surface uppercase tracking-tight mb-2">{title}</h3>
       <p className="text-sm text-on-surface-variant leading-relaxed opacity-60">{description}</p>
    </div>
  )
}
