import { Prisma } from "@prisma/client"
import { randomBytes } from "crypto"

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"

export type StudentGrade =
  | "MIDDLE_SCHOOL"
  | "GRADE_9"
  | "GRADE_10"
  | "GRADE_11"
  | "GRADE_12"
  | "ABOVE"

export type RegistrationInput = {
  username: string
  email: string
  password: string
  grade: StudentGrade
  phoneNumber: string
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
        grade: input.grade,
        phoneNumber: input.phoneNumber,
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

export async function updateUserPassword(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const passwordHash = await hashPassword(password)

  try {
    return await prisma.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new Error("No account was found for that email address.")
    }

    throw error
  }
}

export async function createPasswordResetToken(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  })

  if (!user) {
    return null
  }

  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 1000 * 60 * 60)

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expires,
    },
  })

  return token
}

export async function verifyPasswordResetToken(email: string, token: string) {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || !token) {
    return false
  }

  const passwordResetToken = await prisma.passwordResetToken.findUnique({
    where: {
      token,
    },
    include: {
      user: true,
    },
  })

  if (!passwordResetToken) {
    return false
  }

  if (passwordResetToken.user.email !== normalizedEmail) {
    return false
  }

  if (passwordResetToken.expires < new Date()) {
    await prisma.passwordResetToken.delete({
      where: { token },
    })
    return false
  }

  return true
}

export async function invalidatePasswordResetToken(email: string, token: string) {
  const normalizedEmail = email.trim().toLowerCase()

  await prisma.passwordResetToken.deleteMany({
    where: {
      token,
      user: {
        email: normalizedEmail,
      },
    },
  })
}

export async function createEmailVerificationToken(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { email: true },
  })

  if (!user) {
    return null
  }

  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24)

  await prisma.verificationToken.deleteMany({
    where: { identifier: normalizedEmail },
  })

  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token,
      expires,
    },
  })

  return token
}

export async function verifyEmailVerificationToken(
  email: string,
  token: string
) {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || !token) {
    return false
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!verificationToken) {
    return false
  }

  if (verificationToken.identifier !== normalizedEmail) {
    return false
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { token },
    })
    return false
  }

  return true
}

export async function invalidateEmailVerificationToken(
  email: string,
  token: string
) {
  const normalizedEmail = email.trim().toLowerCase()

  await prisma.verificationToken.deleteMany({
    where: {
      token,
      identifier: normalizedEmail,
    },
  })
}

export async function markUserEmailVerified(email: string) {
  const normalizedEmail = email.trim().toLowerCase()

  try {
    return await prisma.user.update({
      where: { email: normalizedEmail },
      data: { emailVerified: new Date() },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error("No account was found for that email address.")
    }

    throw error
  }
}
