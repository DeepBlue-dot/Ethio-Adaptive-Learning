import React from "react"
import { Globe, Languages, Milestone } from "lucide-react"

export default async function PlatformLocalesPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div>
         <h1 className="text-3xl font-display font-black text-on-surface uppercase tracking-tight">Regional Settings</h1>
         <p className="text-secondary-foreground opacity-60 mt-1">Configure Ethiopian curriculum standards and localization.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <LocaleCard 
            title="Curriculum Standards" 
            description="Manage Grade 9-12 curriculum mapping and national exam compatibility (EHSLCE)."
            icon={<Milestone className="size-6 text-emerald-600" />}
         />
         <LocaleCard 
            title="Language & Time" 
            description="Configure default languages, timezones, and regional formatting for students."
            icon={<Languages className="size-6 text-emerald-600" />}
         />
      </div>

      <div className="bg-surface-container-lowest border border-dashed border-outline-variant rounded-[3rem] py-24 text-center">
          <Globe className="size-12 mx-auto text-on-surface-variant opacity-20 mb-4" />
          <h3 className="text-lg font-black text-on-surface uppercase tracking-tight opacity-40">Localization Engine</h3>
          <p className="text-sm text-on-surface-variant opacity-30 mt-2 max-w-sm mx-auto">
             Regional sync and multi-language support are currently under initialization.
          </p>
      </div>
    </div>
  )
}

function LocaleCard({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
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
