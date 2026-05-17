import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createPasswordResetToken: vi.fn(),
  sendEmail: vi.fn(),
  userFindUnique: vi.fn(),
}))

vi.mock("@/lib/users", () => ({
  createPasswordResetToken: mocks.createPasswordResetToken,
}))

vi.mock("@/lib/email/send-email", () => ({
  sendEmail: mocks.sendEmail,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}))

import { POST } from "@/app/api/auth/forgot-password/route"

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    mocks.createPasswordResetToken.mockReset()
    mocks.sendEmail.mockReset()
    mocks.userFindUnique.mockReset()
  })

  it("rejects malformed email addresses", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Please provide a valid email address.",
    })
    expect(mocks.createPasswordResetToken).not.toHaveBeenCalled()
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })

  it("returns success without sending email when no matching account exists", async () => {
    mocks.userFindUnique.mockResolvedValueOnce(null)

    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "learner@example.com" }),
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message:
        "If an account exists for that email, you will receive a reset link shortly.",
    })
    expect(mocks.createPasswordResetToken).not.toHaveBeenCalled()
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })

  it("creates a password reset token and sends an email when a matching account exists", async () => {
    mocks.userFindUnique.mockResolvedValueOnce({ name: "Learner" })
    mocks.createPasswordResetToken.mockResolvedValueOnce("reset-token")
    mocks.sendEmail.mockResolvedValueOnce({ success: true })

    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "learner@example.com" }),
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message:
        "If an account exists for that email, you will receive a reset link shortly.",
    })
    expect(mocks.createPasswordResetToken).toHaveBeenCalledWith("learner@example.com")
    expect(mocks.sendEmail).toHaveBeenCalled()
  })
})
