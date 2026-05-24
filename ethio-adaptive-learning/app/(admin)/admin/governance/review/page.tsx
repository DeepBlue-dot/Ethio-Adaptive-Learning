import { requireCmsAccess } from "@/lib/cms"
import { getReviewQueue } from "@/lib/studio/governance"
import { ReviewQueue } from "@/components/admin/studio/modules/governance/review-queue"

export default async function GovernanceReviewPage() {
  await requireCmsAccess()
  const drafts = await getReviewQueue()

  return (
    <div className="max-w-6xl mx-auto space-y-10">
        <div>
           <h1 className="text-3xl font-display font-black text-on-surface tracking-tight">Review Queue</h1>
           <p className="text-secondary-foreground opacity-60 mt-1">Managed verification and approval of curriculum content.</p>
        </div>
        
        <ReviewQueue drafts={drafts} />
    </div>
  )
}
