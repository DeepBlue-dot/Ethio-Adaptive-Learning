import { requireCmsAccess } from "@/lib/cms"
import { getGovernanceUsers } from "@/lib/studio/governance"
import { UserAccessList } from "@/components/admin/studio/modules/governance/user-access-list"

export default async function GovernanceUsersPage() {
  await requireCmsAccess()
  const users = await getGovernanceUsers()

  return (
    <div className="max-w-6xl mx-auto space-y-10">
        <div>
           <h1 className="text-3xl font-display font-black text-on-surface tracking-tight">User Access</h1>
           <p className="text-secondary-foreground opacity-60 mt-1">Administrative team management and permission overrides.</p>
        </div>
        
        <UserAccessList users={users} />
    </div>
  )
}
