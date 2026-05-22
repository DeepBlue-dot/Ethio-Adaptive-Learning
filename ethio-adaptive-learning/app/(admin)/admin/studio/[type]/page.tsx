import { redirect } from "next/navigation"
import { requireCmsAccess } from "@/lib/cms"

export default async function StudioTypePage() {
  await requireCmsAccess()
  redirect("/admin/studio")
}
