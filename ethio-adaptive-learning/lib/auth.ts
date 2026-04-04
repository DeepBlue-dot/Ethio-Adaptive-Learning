import type { Adapter } from "next-auth/adapters"
import { getServerSession, type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { redirect } from "next/navigation"
import type { UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/password"
import { findUserByIdentifier } from "@/lib/users"

type AppRole = UserRole

if (!process.env.NEXTAUTH_URL && process.env.NEXT_PUBLIC_APP_URL) {
  process.env.NEXTAUTH_URL = process.env.NEXT_PUBLIC_APP_URL
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: {
          label: "Email or Username",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier?.trim()
        const password = credentials?.password

        if (!identifier || !password) {
          console.warn("Authentication failed: missing credentials")
          return null
        }

        const user = await findUserByIdentifier(identifier)

        if (!user) {
          console.warn("Authentication failed: user not found", { identifier })
          return null
        }

        const isValid = await verifyPassword(password, user.passwordHash)

        if (!isValid) {
          console.warn("Authentication failed: invalid password", {
            userId: user.id,
          })
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.username,
          username: user.username,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.username = user.username
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? token.sub ?? ""
        session.user.role = (token.role as AppRole | undefined) ?? "STUDENT"
        session.user.username = token.username ?? session.user.name ?? "learner"
        session.user.email = token.email ?? session.user.email
        session.user.name = token.name ?? session.user.name
      }

      return session
    },
  },
}

export async function getAuthSession() {
  return getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getAuthSession()

  if (!session?.user) {
    redirect("/login")
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
  return role === "ADMIN" ? "/admin/dashboard" : "/dashboard"
}
