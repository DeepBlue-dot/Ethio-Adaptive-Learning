import { requireCmsAccess } from "@/lib/cms"
import { ShieldAlert, Lock, Eye } from "lucide-react"

export default async function GovernanceSecurityPage() {
  await requireCmsAccess()

  return (
    <div className="max-w-6xl mx-auto space-y-10">
        <div>
           <h1 className="text-3xl font-display font-black text-on-surface tracking-tight">Security Logs</h1>
           <p className="text-secondary-foreground opacity-60 mt-1">Access events, authentication attempts, and system alerts.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <SecurityPlaceholderCard 
              title="Authentication Pulse" 
              description="Real-time monitoring of login events and session renewals across the platform."
              icon={<Eye className="size-6" />}
           />
           <SecurityPlaceholderCard 
              title="Access Deviations" 
              description="Automated detection of unauthorized access attempts or role escalation events."
              icon={<ShieldAlert className="size-6" />}
              variant="warning"
           />
        </div>

        <div className="bg-surface-container-lowest border border-dashed border-outline-variant rounded-[3rem] py-24 text-center">
            <div className="size-20 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-6">
               <Lock className="size-8 text-on-surface-variant opacity-20" />
            </div>
            <h3 className="text-lg font-black text-on-surface uppercase tracking-tight opacity-40">Security Engine Initialization</h3>
            <p className="text-sm text-on-surface-variant opacity-30 mt-2 max-w-sm mx-auto">
               Deep packet inspection and advanced audit trails for security events are currently under development.
            </p>
        </div>
    </div>
  )
}

function SecurityPlaceholderCard({ title, description, icon, variant = "default" }: { title: string, description: string, icon: React.ReactNode, variant?: "default" | "warning" }) {
  return (
    <div className="bg-white border border-outline-variant rounded-[2rem] p-8 shadow-sm">
       <div className={`size-12 rounded-2xl flex items-center justify-center mb-6 ${variant === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-primary/5 text-primary border border-primary/10'}`}>
          {icon}
       </div>
       <h3 className="text-lg font-black text-on-surface uppercase tracking-tight mb-2">{title}</h3>
       <p className="text-sm text-on-surface-variant leading-relaxed opacity-60">{description}</p>
    </div>
  )
}
