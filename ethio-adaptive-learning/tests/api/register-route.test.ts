import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createStudentUser: vi.fn(),
}))

vi.mock("@/lib/users", () => ({
  createStudentUser: mocks.createStudentUser,
}))

import { POST } from "@/app/api/auth/register/route"

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    mocks.createStudentUser.mockReset()
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

  it("creates a student and returns a 201 response", async () => {
    mocks.createStudentUser.mockResolvedValueOnce({ id: "user_1" })

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: "  learner  ",
          email: "  LEARNER@example.com ",
          password: "supersecret",
        }),
      })
    )

    expect(mocks.createStudentUser).toHaveBeenCalledWith({
      username: "learner",
      email: "learner@example.com",
      password: "supersecret",
    })
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      userId: "user_1",
    })
  })

  it("returns a safe 400 response when registration fails", async () => {
    mocks.createStudentUser.mockRejectedValueOnce(
      new Error("An account with that username or email already exists.")
    )

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: "learner",
          email: "learner@example.com",
          password: "supersecret",
        }),
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "An account with that username or email already exists.",
    })
  })
})
