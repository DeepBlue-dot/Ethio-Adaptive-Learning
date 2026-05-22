import { requireCmsAccess } from "@/lib/cms"
import { getUnifiedResources } from "@/lib/resources/unified-resources"
import { ResourceHubClient } from "@/components/admin/resources/resource-hub-client"

export default async function ResourcesPage() {
  await requireCmsAccess()
  const unifiedItems = await getUnifiedResources()

  return <ResourceHubClient initialItems={unifiedItems} />
}
