import bcrypt from "bcryptjs"
import { Prisma, PrismaClient } from "@prisma/client"

import { importGrade12Math } from "../scripts/import-grade12-math.mjs"

const prisma = new PrismaClient()

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@ethioadaptive.local"
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345!"
const writerEmail = process.env.SEED_WRITER_EMAIL ?? "writer@ethioadaptive.local"
const writerPassword = process.env.SEED_WRITER_PASSWORD ?? "Writer12345!"
const studentEmail = process.env.SEED_STUDENT_EMAIL ?? "student@ethioadaptive.local"
const studentPassword = process.env.SEED_STUDENT_PASSWORD ?? "Student12345!"
const REVIEW_THRESHOLD = 0.8

async function upsertUser({ email, username, password, role }) {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedUsername = username.trim()
  const passwordHash = await bcrypt.hash(password, 12)

  const [existingByEmail, existingByUsername] = await Promise.all([
    prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      include: {
        profile: true,
      },
    }),
    prisma.user.findUnique({
      where: {
        username: normalizedUsername,
      },
      include: {
        profile: true,
      },
    }),
  ])

  if (
    existingByEmail &&
    existingByUsername &&
    existingByEmail.id !== existingByUsername.id
  ) {
    throw new Error(
      `Seed user conflict: email "${normalizedEmail}" and username "${normalizedUsername}" belong to different existing users.`
    )
  }

  const existingUser = existingByEmail ?? existingByUsername

  if (existingUser) {
    return prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        name: normalizedUsername,
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
        role,
        profile: existingUser.profile
          ? undefined
          : {
              create: {},
            },
      },
      include: {
        profile: true,
      },
    })
  }

  return prisma.user.create({
    data: {
      name: normalizedUsername,
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      role,
      profile: {
        create: {},
      },
    },
    include: {
      profile: true,
    },
  })
}

async function ensureProfiles(users) {
  for (const user of users) {
    if (!user.profile) {
      await prisma.userProfile.create({
        data: {
          userId: user.id,
        },
      })
    }
  }
}

async function seedStudentMastery({ studentId, conceptIdsByReference }) {
  const references = [
    "functions-and-graphs/linear-functions",
    "functions-and-graphs/quadratic-functions",
    "foundations-of-calculus/limits",
  ]

  const conceptIds = references.map((reference) => {
    const conceptId = conceptIdsByReference[reference]

    if (!conceptId) {
      throw new Error(`Seed import did not return concept id for ${reference}.`)
    }

    return conceptId
  })

  const concepts = await prisma.concept.findMany({
    where: {
      id: {
        in: conceptIds,
      },
    },
    select: {
      id: true,
      slug: true,
      pLo: true,
      decayLambda: true,
    },
  })

  const conceptBySlug = new Map(concepts.map((concept) => [concept.slug, concept]))
  const linearFunctions = conceptBySlug.get("linear-functions")
  const quadraticFunctions = conceptBySlug.get("quadratic-functions")
  const limits = conceptBySlug.get("limits")

  if (!linearFunctions || !quadraticFunctions || !limits) {
    throw new Error("Seed import did not provision the expected Grade 12 Math concepts.")
  }

  const lastAssessedAt = new Date("2026-03-01T00:00:00.000Z")
  const nextReviewAt = computeNextReviewAt({
    baselineMastery: 0.94,
    lastAssessedAt,
    decayLambda: linearFunctions.decayLambda,
  })

  await prisma.userMastery.upsert({
    where: {
      userId_conceptId: {
        userId: studentId,
        conceptId: linearFunctions.id,
      },
    },
    update: {
      pMastery: 0.94,
      lastAssessedAt,
      nextReviewAt,
      unlockedAt: new Date("2026-03-01T00:00:00.000Z"),
      status: "REVIEW_NEEDED",
      consecutiveFails: 0,
    },
    create: {
      userId: studentId,
      conceptId: linearFunctions.id,
      pMastery: 0.94,
      lastAssessedAt,
      nextReviewAt,
      unlockedAt: new Date("2026-03-01T00:00:00.000Z"),
      status: "REVIEW_NEEDED",
      consecutiveFails: 0,
    },
  })

  await prisma.userMastery.upsert({
    where: {
      userId_conceptId: {
        userId: studentId,
        conceptId: quadraticFunctions.id,
      },
    },
    update: {
      pMastery: quadraticFunctions.pLo,
      lastAssessedAt: null,
      nextReviewAt: null,
      unlockedAt: new Date("2026-04-04T00:00:00.000Z"),
      status: "FRINGE",
      consecutiveFails: 0,
    },
    create: {
      userId: studentId,
      conceptId: quadraticFunctions.id,
      pMastery: quadraticFunctions.pLo,
      lastAssessedAt: null,
      nextReviewAt: null,
      unlockedAt: new Date("2026-04-04T00:00:00.000Z"),
      status: "FRINGE",
      consecutiveFails: 0,
    },
  })

  await prisma.userMastery.deleteMany({
    where: {
      userId: studentId,
      conceptId: limits.id,
    },
  })
}

async function main() {
  const admin = await upsertUser({
    email: adminEmail,
    username: "admin",
    password: adminPassword,
    role: "ADMIN",
  })

  const writer = await upsertUser({
    email: writerEmail,
    username: "math-writer",
    password: writerPassword,
    role: "COURSE_WRITER",
  })

  const student = await upsertUser({
    email: studentEmail,
    username: "student-demo",
    password: studentPassword,
    role: "STUDENT",
  })

  await ensureProfiles([admin, writer, student])

  const importResult = await importGrade12Math({
    prisma,
    authorId: writer.id,
  })

  await seedStudentMastery({
    studentId: student.id,
    conceptIdsByReference: importResult.conceptIdsByReference,
  })

  console.info("Seed complete", {
    adminEmail,
    writerEmail,
    studentEmail,
    importedCourseSlug: importResult.courseSlug,
    importedConceptCount: importResult.conceptCount,
    importedQuestionCount: importResult.questionCount,
  })
}

main()
  .catch((error) => {
    console.error("Seed failed", error)

    const guidance = getSeedFailureGuidance(error)

    if (guidance) {
      console.error(`\n${guidance}`)
    }

    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

function getSeedFailureGuidance(error) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2022"
  ) {
    const columnName =
      typeof error.meta?.column === "string" ? error.meta.column : "a required column"

    return [
      `Your local database schema is behind the current Prisma schema. Missing column: ${columnName}.`,
      "Run the schema sync first, then rerun the seed:",
      "  npm run db:push",
      "  npx prisma db seed",
    ].join("\n")
  }

  return null
}

function computeNextReviewAt({ baselineMastery, lastAssessedAt, decayLambda }) {
  if (!lastAssessedAt) {
    return null
  }

  if (!Number.isFinite(decayLambda) || decayLambda <= 0 || baselineMastery <= REVIEW_THRESHOLD) {
    return new Date(lastAssessedAt)
  }

  const elapsedDays = Math.log(baselineMastery / REVIEW_THRESHOLD) / decayLambda
  return new Date(lastAssessedAt.getTime() + elapsedDays * 24 * 60 * 60 * 1000)
}
