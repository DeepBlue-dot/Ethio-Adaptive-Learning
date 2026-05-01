import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  adapter: vi.fn(() => ({})),
  credentialsProvider: vi.fn(
    (config: {
      name: string
      credentials: Record<string, { label: string; type: string }>
      authorize: (credentials?: Record<string, string>) => Promise<unknown>
    }) => ({
      id: "credentials",
      ...config,
    })
  ),
  getServerSession: vi.fn(),
  redirect: vi.fn(),
  verifyPassword: vi.fn(),
  findUserByIdentifier: vi.fn(),
}))

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: mocks.adapter,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}))

vi.mock("@/lib/password", () => ({
  verifyPassword: mocks.verifyPassword,
}))

vi.mock("@/lib/users", () => ({
  findUserByIdentifier: mocks.findUserByIdentifier,
}))

vi.mock("next-auth/providers/credentials", () => ({
  default: mocks.credentialsProvider,
}))

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}))

vi.mock("next-auth", async () => {
  const actual = await vi.importActual<typeof import("next-auth")>("next-auth")

  return {
    ...actual,
    getServerSession: mocks.getServerSession,
  }
})

import {
  authOptions,
  getDefaultRedirectPath,
  redirectIfAuthenticated,
  requireAuth,
  requireRole,
} from "@/lib/auth"

function getCredentialsAuthorize() {
  const provider = authOptions.providers.find(
    (entry) => "id" in entry && entry.id === "credentials"
  ) as
    | {
        authorize?: (credentials?: Record<string, string>) => Promise<unknown>
        options?: {
          authorize?: (credentials?: Record<string, string>) => Promise<unknown>
        }
      }
    | undefined

  const authorize = provider?.authorize ?? provider?.options?.authorize

  if (!authorize) {
    throw new Error("Credentials authorize handler not found.")
  }

  return authorize
}

describe("lib/auth", () => {
  beforeEach(() => {
    mocks.adapter.mockClear()
    mocks.credentialsProvider.mockClear()
    mocks.getServerSession.mockReset()
    mocks.redirect.mockReset()
    mocks.verifyPassword.mockReset()
    mocks.findUserByIdentifier.mockReset()
  })

  it("returns the expected post-login routes for each role", () => {
    expect(getDefaultRedirectPath("ADMIN")).toBe("/admin/dashboard")
    expect(getDefaultRedirectPath("STUDENT")).toBe("/dashboard")
    expect(getDefaultRedirectPath("COURSE_WRITER")).toBe("/admin/dashboard")
  })

  it("authorizes a valid credentials login", async () => {
    const authorize = getCredentialsAuthorize()
    mocks.findUserByIdentifier.mockResolvedValueOnce({
      id: "user_1",
      email: "learner@example.com",
      name: null,
      username: "learner",
      passwordHash: "stored-hash",
      role: "STUDENT",
    })
    mocks.verifyPassword.mockResolvedValueOnce(true)

    const result = await Promise.resolve(
      authorize({
        identifier: "  learner  ",
        password: "supersecret",
      })
    )

    expect(result).toEqual({
      id: "user_1",
      email: "learner@example.com",
      name: "learner",
      username: "learner",
      role: "STUDENT",
    })

    expect(mocks.findUserByIdentifier).toHaveBeenCalledWith("learner")
    expect(mocks.verifyPassword).toHaveBeenCalledWith("supersecret", "stored-hash")
  })

  it("rejects invalid credentials safely", async () => {
    const authorize = getCredentialsAuthorize()

    await expect(Promise.resolve(authorize())).resolves.toBeNull()

    mocks.findUserByIdentifier.mockResolvedValueOnce(null)
    await expect(
      Promise.resolve(
        authorize({
          identifier: "missing-user",
          password: "supersecret",
        })
      )
    ).resolves.toBeNull()

    mocks.findUserByIdentifier.mockResolvedValueOnce({
      id: "user_1",
      email: "learner@example.com",
      name: "Learner",
      username: "learner",
      passwordHash: "stored-hash",
      role: "STUDENT",
    })
    mocks.verifyPassword.mockResolvedValueOnce(false)

    await expect(
      Promise.resolve(
        authorize({
          identifier: "learner",
          password: "wrong-password",
        })
      )
    ).resolves.toBeNull()
  })

  it("maps JWT and session fields into the Phase 1 session contract", async () => {
    const token = await authOptions.callbacks?.jwt?.({
      token: {},
      user: {
        id: "admin_1",
        role: "ADMIN",
        username: "admin",
      },
    } as never)

    expect(token).toMatchObject({
      id: "admin_1",
      role: "ADMIN",
      username: "admin",
    })

    const session = await authOptions.callbacks?.session?.({
      session: {
        user: {
          email: "admin@example.com",
          name: "Admin",
        },
      },
      token: {
        sub: "admin_1",
        id: "admin_1",
        role: "ADMIN",
        username: "admin",
        email: "admin@example.com",
        name: "Admin",
      },
    } as never)

    expect(session?.user).toMatchObject({
      id: "admin_1",
      role: "ADMIN",
      username: "admin",
      email: "admin@example.com",
      name: "Admin",
    })
  })

  it("redirects unauthenticated users to login", async () => {
    mocks.getServerSession.mockResolvedValueOnce(null)

    await requireAuth()

    expect(mocks.redirect).toHaveBeenCalledWith("/login")
  })

  it("redirects unauthorized roles to their default dashboard", async () => {
    mocks.getServerSession.mockResolvedValueOnce({
      user: {
        id: "user_1",
        role: "STUDENT",
        username: "learner",
        email: "learner@example.com",
        name: "Learner",
      },
    })

    await requireRole("ADMIN")

    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard")
  })

  it("redirects authenticated users away from public auth pages", async () => {
    mocks.getServerSession.mockResolvedValueOnce({
      user: {
        id: "admin_1",
        role: "ADMIN",
        username: "admin",
        email: "admin@example.com",
        name: "Admin",
      },
    })

    await redirectIfAuthenticated()

    expect(mocks.redirect).toHaveBeenCalledWith("/admin/dashboard")
  })
})
