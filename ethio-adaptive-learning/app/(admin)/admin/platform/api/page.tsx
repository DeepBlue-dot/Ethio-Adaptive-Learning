import React from "react"
import { Key, Webhook, Cpu } from "lucide-react"

export default async function PlatformApiPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div>
         <h1 className="text-3xl font-display font-black text-on-surface uppercase tracking-tight">API Configuration</h1>
         <p className="text-secondary-foreground opacity-60 mt-1">Manage system secrets, webhooks, and rate policies.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <ConfigSection 
            title="System Secrets" 
            description="Manage authentication keys for third-party services like Cloudinary and Resend."
            icon={<Key className="size-6 text-primary" />}
         />
         <ConfigSection 
            title="Webhook Endpoints" 
            description="Configure real-time event notifications for external integrations."
            icon={<Webhook className="size-6 text-primary" />}
         />
      </div>

      <div className="bg-surface-container-lowest border border-dashed border-outline-variant rounded-[3rem] py-24 text-center">
          <Cpu className="size-12 mx-auto text-on-surface-variant opacity-20 mb-4" />
          <h3 className="text-lg font-black text-on-surface uppercase tracking-tight opacity-40">Integration Hub</h3>
          <p className="text-sm text-on-surface-variant opacity-30 mt-2 max-w-sm mx-auto">
             The advanced API orchestration portal is currently under initialization.
          </p>
      </div>
    </div>
  )
}

function ConfigSection({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-outline-variant rounded-[2rem] p-8 shadow-sm group hover:border-primary/20 transition-all">
       <div className="size-12 rounded-2xl bg-surface-container-low flex items-center justify-center border border-outline-variant/30 mb-6">
          {icon}
       </div>
       <h3 className="text-lg font-black text-on-surface uppercase tracking-tight mb-2">{title}</h3>
       <p className="text-sm text-on-surface-variant leading-relaxed opacity-60">{description}</p>
    </div>
  )
}
