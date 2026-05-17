import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyEmailVerificationToken: vi.fn(),
  markUserEmailVerified: vi.fn(),
  invalidateEmailVerificationToken: vi.fn(),
}))

vi.mock("@/lib/users", () => ({
  verifyEmailVerificationToken: mocks.verifyEmailVerificationToken,
  markUserEmailVerified: mocks.markUserEmailVerified,
  invalidateEmailVerificationToken: mocks.invalidateEmailVerificationToken,
}))

import { GET, POST } from "@/app/api/auth/verify-account/route"

describe("/api/auth/verify-account", () => {
  beforeEach(() => {
    mocks.verifyEmailVerificationToken.mockReset()
    mocks.markUserEmailVerified.mockReset()
    mocks.invalidateEmailVerificationToken.mockReset()
  })

  it("returns 400 for invalid query params on GET", async () => {
    const response = await GET(
      new Request("http://localhost/api/auth/verify-account?email=bad-email&token=123")
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Verification link is invalid or missing required data.",
    })
  })

  it("verifies a valid token on GET", async () => {
    mocks.verifyEmailVerificationToken.mockResolvedValueOnce(true)

    const response = await GET(
      new Request(
        "http://localhost/api/auth/verify-account?email=learner@example.com&token=valid-token"
      )
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message: "Your email address has been verified successfully.",
    })
    expect(mocks.markUserEmailVerified).toHaveBeenCalledWith(
      "learner@example.com"
    )
    expect(mocks.invalidateEmailVerificationToken).toHaveBeenCalledWith(
      "learner@example.com",
      "valid-token"
    )
  })

  it("returns 400 for invalid payload on POST", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/verify-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "bad-email", token: "" }),
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Email and token are required for verification.",
    })
  })

  it("verifies a valid token on POST", async () => {
    mocks.verifyEmailVerificationToken.mockResolvedValueOnce(true)

    const response = await POST(
      new Request("http://localhost/api/auth/verify-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "learner@example.com",
          token: "valid-token",
        }),
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message: "Your email address has been verified successfully.",
    })
    expect(mocks.markUserEmailVerified).toHaveBeenCalledWith(
      "learner@example.com"
    )
    expect(mocks.invalidateEmailVerificationToken).toHaveBeenCalledWith(
      "learner@example.com",
      "valid-token"
    )
  })
})
