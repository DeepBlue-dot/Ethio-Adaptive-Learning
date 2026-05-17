import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createStudentUser: vi.fn(),
  sendEmail: vi.fn(),
  verifyRecaptcha: vi.fn(),
}))

vi.mock("@/lib/users", () => ({
  createStudentUser: mocks.createStudentUser,
}))

vi.mock("@/lib/email/send-email", () => ({
  sendEmail: mocks.sendEmail,
}))

vi.mock("@/lib/verify-recaptcha", () => ({
  verifyRecaptcha: mocks.verifyRecaptcha,
}))

import { POST } from "@/app/api/auth/register/route"

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    mocks.createStudentUser.mockReset()
    mocks.sendEmail.mockReset()
    mocks.verifyRecaptcha.mockReset()
  })

  it("rejects usernames shorter than three characters", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: "ab",
          email: "learner@example.com",
          password: "supersecret",
        }),
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Username must be at least 3 characters long.",
    })
    expect(mocks.createStudentUser).not.toHaveBeenCalled()
  })

  it("rejects malformed email addresses", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: "learner",
          email: "not-an-email",
          password: "supersecret",
        }),
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Please enter a valid email address.",
    })
    expect(mocks.createStudentUser).not.toHaveBeenCalled()
  })

  it("rejects passwords shorter than eight characters", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: "learner",
          email: "learner@example.com",
          password: "short",
        }),
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Password must be at least 8 characters long.",
    })
    expect(mocks.createStudentUser).not.toHaveBeenCalled()
  })

  it("creates a student, sends a welcome email, and returns a 201 response", async () => {
    mocks.createStudentUser.mockResolvedValueOnce({
      id: "user_1",
      email: "learner@example.com",
      username: "learner",
      name: "Learner",
    })
    mocks.sendEmail.mockResolvedValueOnce({ success: true })
    mocks.verifyRecaptcha.mockResolvedValueOnce(true)

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: "  learner  ",
          email: "  LEARNER@example.com ",
          grade: "GRADE_11",
          phoneNumber: "+251-912345678",
          password: "supersecret",
          recaptchaToken: "valid-token",
        }),
      })
    )

    expect(mocks.createStudentUser).toHaveBeenCalledWith({
      username: "learner",
      email: "learner@example.com",
      grade: "GRADE_11",
      phoneNumber: "+251-912345678",
      password: "supersecret",
    })
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "learner@example.com",
        subject: "Welcome to EthioPrep",
      })
    )
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      userId: "user_1",
    })
  })

  it("rejects invalid grade values", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: "learner",
          email: "learner@example.com",
          password: "supersecret",
          grade: "UNKNOWN",
          phoneNumber: "+251-912345678",
        }),
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Please select your grade.",
    })
    expect(mocks.createStudentUser).not.toHaveBeenCalled()
  })

  it("rejects invalid Ethiopian phone numbers", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: "learner",
          email: "learner@example.com",
          grade: "GRADE_11",
          phoneNumber: "0912345678",
          password: "supersecret",
        }),
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Please enter a valid Ethiopian phone number in the form +251-XXXXXXXXX.",
    })
    expect(mocks.createStudentUser).not.toHaveBeenCalled()
  })

  it("returns a safe 400 response when registration fails", async () => {
    mocks.createStudentUser.mockRejectedValueOnce(
      new Error("An account with that username or email already exists.")
    )
    mocks.verifyRecaptcha.mockResolvedValueOnce(true)

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: "learner",
          email: "learner@example.com",
          grade: "GRADE_11",
          phoneNumber: "+251-912345678",
          password: "supersecret",
          recaptchaToken: "valid-token",
        }),
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "An account with that username or email already exists.",
    })
  })
})
