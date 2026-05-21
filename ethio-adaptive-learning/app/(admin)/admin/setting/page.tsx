import { requireRole } from "@/lib/auth"
import { Bell, Shield, Globe, Save } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function AdminSettingsPage() {
  await requireRole("ADMIN")

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-display font-black text-on-surface tracking-tight">Studio Settings</h1>
        <p className="text-on-surface-variant mt-1.5">Manage platform configurations and global parameters.</p>
      </div>

      <div className="grid gap-6">
        {/* Section: General */}
        <SettingsSection 
          title="General Configuration" 
          icon={<Globe className="size-5" />}
          description="Global settings for the adaptive learning engine."
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Default Mastery Threshold</label>
              <input 
                type="number" 
                defaultValue={0.90} 
                step={0.01}
                className="w-full max-w-xs rounded-xl border border-outline-variant bg-surface px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
              <p className="text-[10px] text-on-surface-variant italic">The pMastery required to unlock next concepts.</p>
            </div>
          </div>
        </SettingsSection>

        {/* Section: Intelligence */}
        <SettingsSection 
          title="Intelligence & Analytics" 
          icon={<Shield className="size-5" />}
          description="Configure how student interactions are logged and processed."
        >
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm font-semibold text-on-surface">Enable Predictive Analytics</p>
                   <p className="text-xs text-on-surface-variant">Uses historical logs to predict student struggle points.</p>
                </div>
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                   <div className="size-4 rounded-full bg-primary" />
                </div>
             </div>
          </div>
        </SettingsSection>

        {/* Section: Notifications */}
        <SettingsSection 
          title="Administrative Notifications" 
          icon={<Bell className="size-5" />}
          description="System-wide alerts for content writers and admins."
        >
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm font-semibold text-on-surface">Weekly Health Reports</p>
                   <p className="text-xs text-on-surface-variant">Send summary of orphan nodes and underperforming questions.</p>
                </div>
                <div className="size-10 rounded-full bg-surface-container-high" />
             </div>
          </div>
        </SettingsSection>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-outline-variant">
         <Button variant="outline">Discard Changes</Button>
         <Button className="gap-2 bg-primary hover:bg-primary-container">
            <Save className="size-4" />
            Save Settings
         </Button>
      </div>
    </div>
  )
}

function SettingsSection({ 
  title, 
  description, 
  icon, 
  children 
}: { 
  title: string, 
  description: string, 
  icon: React.ReactNode, 
  children: React.ReactNode 
}) {
  return (
    <div className="bg-surface border border-outline-variant rounded-[2rem] overflow-hidden shadow-sm">
      <div className="p-6 lg:p-8 border-b border-outline-variant bg-surface-container-low/30">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-outline-variant shadow-sm text-primary">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-on-surface">{title}</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6 lg:p-8">
        {children}
      </div>
    </div>
  )
}
