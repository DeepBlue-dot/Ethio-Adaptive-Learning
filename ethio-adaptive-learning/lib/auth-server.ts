import { redirect } from "next/navigation"
import type { UserRole } from "@prisma/client"

import { getAuthSession } from "@/lib/auth"

type AppRole = UserRole

export async function requireAuth() {
  const session = await getAuthSession()

  if (!session?.user) {
    redirect("/login")
  }

  return session
}

/**
 * API-safe authentication check.
 * Returns the session if authenticated, otherwise throws an error that can be caught by API handlers.
 */
export async function requireApiAuth() {
  const session = await getAuthSession()
  if (!session?.user) {
    const error = Object.assign(new Error("Unauthorized"), { status: 401 })
    throw error
  }
  return session
}

export async function requireRole(roles: AppRole | AppRole[]) {
  const session = await requireAuth()
  const allowedRoles = Array.isArray(roles) ? roles : [roles]

  if (!allowedRoles.includes(session.user.role)) {
    console.warn("Unauthorized route access", {
      userId: session.user.id,
      userRole: session.user.role,
      allowedRoles,
    })

    redirect(getDefaultRedirectPath(session.user.role))
  }

  return session
}

export async function redirectIfAuthenticated() {
  const session = await getAuthSession()

  if (session?.user) {
    redirect(getDefaultRedirectPath(session.user.role))
  }
}

export function getDefaultRedirectPath(role: AppRole) {
  return role === "ADMIN" || role === "COURSE_WRITER"
    ? "/admin/dashboard"
    : "/student"
}
