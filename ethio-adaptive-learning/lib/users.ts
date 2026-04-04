import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"

export type RegistrationInput = {
  username: string
  email: string
  password: string
}

export async function findUserByIdentifier(identifier: string) {
  return prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  })
}

export async function createStudentUser(input: RegistrationInput) {
  const username = input.username.trim()
  const email = input.email.trim().toLowerCase()
  const passwordHash = await hashPassword(input.password)

  try {
    return await prisma.user.create({
      data: {
        name: username,
        username,
        email,
        passwordHash,
        role: "STUDENT",
        profile: {
          create: {},
        },
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("An account with that username or email already exists.")
    }

    throw error
  }
}
