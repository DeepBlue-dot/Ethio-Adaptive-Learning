import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  prismaFindFirst: vi.fn(),
  prismaCreate: vi.fn(),
  hashPassword: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: mocks.prismaFindFirst,
      create: mocks.prismaCreate,
    },
  },
}))

vi.mock("@/lib/password", () => ({
  hashPassword: mocks.hashPassword,
}))

import { createStudentUser, findUserByIdentifier } from "@/lib/users"

function createKnownRequestError(code: string) {
  const error = Object.create(
    PrismaClientKnownRequestError.prototype
  ) as PrismaClientKnownRequestError & {
    code: string
    message: string
  }

  error.code = code
  error.message = "Prisma request failed"

  return error
}

describe("lib/users", () => {
  beforeEach(() => {
    mocks.prismaFindFirst.mockReset()
    mocks.prismaCreate.mockReset()
    mocks.hashPassword.mockReset()
  })

  it("looks up a user by email or username", async () => {
    mocks.prismaFindFirst.mockResolvedValueOnce({ id: "user_1" })

    await findUserByIdentifier("learner")

    expect(mocks.prismaFindFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ email: "learner" }, { username: "learner" }],
      },
    })
  })

  it("creates a student with a normalized email and starter profile", async () => {
    mocks.hashPassword.mockResolvedValueOnce("hashed-password")
    mocks.prismaCreate.mockResolvedValueOnce({ id: "user_1" })

    await createStudentUser({
      username: "  learner  ",
      email: "  LEARNER@example.com ",
      password: "supersecret",
      grade: "GRADE_11",
      phoneNumber: "+251-912345678",
    })

    expect(mocks.hashPassword).toHaveBeenCalledWith("supersecret")
    expect(mocks.prismaCreate).toHaveBeenCalledWith({
      data: {
        name: "learner",
        username: "learner",
        email: "learner@example.com",
        passwordHash: "hashed-password",
        role: "STUDENT",
        grade: "GRADE_11",
        phoneNumber: "+251-912345678",
        profile: {
          create: {},
        },
      },
    })
  })

  it("maps duplicate-key errors to a user-friendly message", async () => {
    mocks.hashPassword.mockResolvedValueOnce("hashed-password")
    mocks.prismaCreate.mockRejectedValueOnce(createKnownRequestError("P2002"))

    await expect(
      createStudentUser({
        username: "learner",
        email: "learner@example.com",
        password: "supersecret",
        grade: "GRADE_11",
        phoneNumber: "+251-912345678",
      })
    ).rejects.toThrow("An account with that username or email already exists.")
  })

  it("rethrows unexpected database errors", async () => {
    mocks.hashPassword.mockResolvedValueOnce("hashed-password")
    mocks.prismaCreate.mockRejectedValueOnce(new Error("database unavailable"))

    await expect(
      createStudentUser({
        username: "learner",
        email: "learner@example.com",
        password: "supersecret",
        grade: "GRADE_11",
        phoneNumber: "+251-912345678",
      })
    ).rejects.toThrow("database unavailable")
  })
})
