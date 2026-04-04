import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      role: "STUDENT" | "COURSE_WRITER" | "ADMIN"
      username: string
    }
  }

  interface User {
    id: string
    role: "STUDENT" | "COURSE_WRITER" | "ADMIN"
    username: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: "STUDENT" | "COURSE_WRITER" | "ADMIN"
    username?: string
  }
}
