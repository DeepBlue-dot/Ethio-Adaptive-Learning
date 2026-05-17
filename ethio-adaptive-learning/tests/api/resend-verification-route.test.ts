import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createEmailVerificationToken: vi.fn(),
  sendEmail: vi.fn(),
}))

vi.mock("@/lib/users", () => ({
  createEmailVerificationToken: mocks.createEmailVerificationToken,
}))

vi.mock("@/lib/email/send-email", () => ({
  sendEmail: mocks.sendEmail,
}))

import { POST } from "@/app/api/auth/resend-verification/route"

describe("POST /api/auth/resend-verification", () => {
  beforeEach(() => {
    mocks.createEmailVerificationToken.mockReset()
    mocks.sendEmail.mockReset()
  })

  it("rejects invalid email addresses", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Please provide a valid email address.",
    })
    expect(mocks.createEmailVerificationToken).not.toHaveBeenCalled()
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })

  it("returns success when a verification token is created and email is sent", async () => {
    mocks.createEmailVerificationToken.mockResolvedValueOnce("verify-token")
    mocks.sendEmail.mockResolvedValueOnce({ success: true })

    const response = await POST(
      new Request("http://localhost/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "learner@example.com" }),
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message:
        "If an account exists for that email, a verification link will be sent shortly.",
    })
    expect(mocks.createEmailVerificationToken).toHaveBeenCalledWith(
      "learner@example.com"
    )
    expect(mocks.sendEmail).toHaveBeenCalled()
  })

  it("returns success without sending email when no account exists", async () => {
    mocks.createEmailVerificationToken.mockResolvedValueOnce(null)

    const response = await POST(
      new Request("http://localhost/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "unknown@example.com" }),
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message:
        "If an account exists for that email, a verification link will be sent shortly.",
    })
    expect(mocks.createEmailVerificationToken).toHaveBeenCalledWith(
      "unknown@example.com"
    )
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })
})
