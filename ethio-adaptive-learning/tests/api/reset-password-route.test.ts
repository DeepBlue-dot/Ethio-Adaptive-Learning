import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyPasswordResetToken: vi.fn(),
  updateUserPassword: vi.fn(),
  invalidatePasswordResetToken: vi.fn(),
}))

vi.mock("@/lib/users", () => ({
  verifyPasswordResetToken: mocks.verifyPasswordResetToken,
  updateUserPassword: mocks.updateUserPassword,
  invalidatePasswordResetToken: mocks.invalidatePasswordResetToken,
}))

import { POST } from "@/app/api/auth/reset-password/route"

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    mocks.verifyPasswordResetToken.mockReset()
    mocks.updateUserPassword.mockReset()
    mocks.invalidatePasswordResetToken.mockReset()
  })

  it("rejects malformed email addresses", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email", password: "newpassword", token: "token" }),
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Please provide a valid email address.",
    })
    expect(mocks.verifyPasswordResetToken).not.toHaveBeenCalled()
  })

  it("rejects short passwords", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "learner@example.com", password: "short", token: "token" }),
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Password must be at least 8 characters long.",
    })
    expect(mocks.verifyPasswordResetToken).not.toHaveBeenCalled()
  })

  it("rejects missing reset tokens", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "learner@example.com", password: "newpassword" }),
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "The password reset token is missing. Please use the link from your email.",
    })
    expect(mocks.verifyPasswordResetToken).not.toHaveBeenCalled()
  })

  it("rejects invalid or expired reset tokens", async () => {
    mocks.verifyPasswordResetToken.mockResolvedValueOnce(false)

    const response = await POST(
      new Request("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "learner@example.com", password: "newpassword", token: "invalid-token" }),
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "The password reset link is invalid or has expired. Please request a new link.",
    })
    expect(mocks.updateUserPassword).not.toHaveBeenCalled()
  })

  it("resets the password when the token is valid", async () => {
    mocks.verifyPasswordResetToken.mockResolvedValueOnce(true)
    mocks.updateUserPassword.mockResolvedValueOnce({})
    mocks.invalidatePasswordResetToken.mockResolvedValueOnce(undefined)

    const response = await POST(
      new Request("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "learner@example.com",
          password: "newstrongpassword",
          token: "valid-token",
        }),
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message: "Your password has been successfully reset.",
    })
    expect(mocks.verifyPasswordResetToken).toHaveBeenCalledWith(
      "learner@example.com",
      "valid-token"
    )
    expect(mocks.updateUserPassword).toHaveBeenCalledWith(
      "learner@example.com",
      "newstrongpassword"
    )
    expect(mocks.invalidatePasswordResetToken).toHaveBeenCalledWith(
      "learner@example.com",
      "valid-token"
    )
  })
})
