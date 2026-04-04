import { redirect } from "next/navigation"

import { getDefaultRedirectPath, requireAuth } from "@/lib/auth"

export default async function AuthRedirectPage() {
  const session = await requireAuth()

  redirect(getDefaultRedirectPath(session.user.role))
}
