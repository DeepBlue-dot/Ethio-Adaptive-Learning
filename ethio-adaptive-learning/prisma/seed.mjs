import bcrypt from "bcryptjs"
import { Prisma, PrismaClient } from "@prisma/client"

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

async function seedMathCurriculum({ writerId, studentId }) {
  const course = await upsertCourse({
    title: "Grade 12 Mathematics",
    description:
      "Curriculum-aligned mathematics concepts, prerequisite sequencing, and question bank entries for adaptive mastery workflows.",
    authorId: writerId,
  })

  const algebraUnit = await prisma.unit.upsert({
    where: {
      courseId_order: {
        courseId: course.id,
        order: 1,
      },
    },
    update: {
      title: "Functions and Graphs",
    },
    create: {
      courseId: course.id,
      title: "Functions and Graphs",
      order: 1,
    },
  })

  const calculusUnit = await prisma.unit.upsert({
    where: {
      courseId_order: {
        courseId: course.id,
        order: 2,
      },
    },
    update: {
      title: "Foundations of Calculus",
    },
    create: {
      courseId: course.id,
      title: "Foundations of Calculus",
      order: 2,
    },
  })

  const linearFunctions = await prisma.concept.upsert({
    where: {
      unitId_title: {
        unitId: algebraUnit.id,
        title: "Linear Functions",
      },
    },
    update: {
      description: "Understand slope, intercept form, and how linear functions behave on a graph.",
      contentBody:
        "## Linear Functions\n\nA linear function has the form `f(x) = mx + b`.\n\n- `m` is the slope.\n- `b` is the y-intercept.\n\n### Worked Example\n\nIf `f(x) = 2x + 3`, then the slope is `2` and the graph crosses the y-axis at `3`.",
      unlockThreshold: 0.9,
      pLo: 0.15,
      pT: 0.1,
      pG: 0.2,
      pS: 0.1,
      decayLambda: 0.01,
    },
    create: {
      unitId: algebraUnit.id,
      title: "Linear Functions",
      description: "Understand slope, intercept form, and how linear functions behave on a graph.",
      contentBody:
        "## Linear Functions\n\nA linear function has the form `f(x) = mx + b`.\n\n- `m` is the slope.\n- `b` is the y-intercept.\n\n### Worked Example\n\nIf `f(x) = 2x + 3`, then the slope is `2` and the graph crosses the y-axis at `3`.",
      unlockThreshold: 0.9,
      pLo: 0.15,
      pT: 0.1,
      pG: 0.2,
      pS: 0.1,
      decayLambda: 0.01,
    },
  })

  const quadraticFunctions = await prisma.concept.upsert({
    where: {
      unitId_title: {
        unitId: algebraUnit.id,
        title: "Quadratic Functions",
      },
    },
    update: {
      description: "Explore parabolas, vertex form, and factoring-based reasoning about quadratic expressions.",
      contentBody:
        "## Quadratic Functions\n\nQuadratic functions have the general form `f(x) = ax^2 + bx + c`.\n\n### Worked Example\n\nTo factor `x^2 - 5x + 6`, find two numbers whose product is `6` and sum is `-5`.",
      unlockThreshold: 0.9,
      pLo: 0.15,
      pT: 0.1,
      pG: 0.2,
      pS: 0.1,
      decayLambda: 0.01,
    },
    create: {
      unitId: algebraUnit.id,
      title: "Quadratic Functions",
      description: "Explore parabolas, vertex form, and factoring-based reasoning about quadratic expressions.",
      contentBody:
        "## Quadratic Functions\n\nQuadratic functions have the general form `f(x) = ax^2 + bx + c`.\n\n### Worked Example\n\nTo factor `x^2 - 5x + 6`, find two numbers whose product is `6` and sum is `-5`.",
      unlockThreshold: 0.9,
      pLo: 0.15,
      pT: 0.1,
      pG: 0.2,
      pS: 0.1,
      decayLambda: 0.01,
    },
  })

  const limits = await prisma.concept.upsert({
    where: {
      unitId_title: {
        unitId: calculusUnit.id,
        title: "Limits",
      },
    },
    update: {
      description: "Reason about the value a function approaches near a target input.",
      contentBody:
        "## Limits\n\nA limit describes the value that a function approaches as the input approaches some number.\n\n### Worked Example\n\nFor `f(x) = x^2`, the limit as `x` approaches `2` is `4`.",
      unlockThreshold: 0.9,
      pLo: 0.15,
      pT: 0.1,
      pG: 0.2,
      pS: 0.1,
      decayLambda: 0.01,
    },
    create: {
      unitId: calculusUnit.id,
      title: "Limits",
      description: "Reason about the value a function approaches near a target input.",
      contentBody:
        "## Limits\n\nA limit describes the value that a function approaches as the input approaches some number.\n\n### Worked Example\n\nFor `f(x) = x^2`, the limit as `x` approaches `2` is `4`.",
      unlockThreshold: 0.9,
      pLo: 0.15,
      pT: 0.1,
      pG: 0.2,
      pS: 0.1,
      decayLambda: 0.01,
    },
  })

  await prisma.conceptPrerequisite.deleteMany({
    where: {
      dependentConceptId: {
        in: [quadraticFunctions.id, limits.id],
      },
    },
  })

  await prisma.conceptPrerequisite.createMany({
    data: [
      {
        prerequisiteConceptId: linearFunctions.id,
        dependentConceptId: quadraticFunctions.id,
      },
      {
        prerequisiteConceptId: quadraticFunctions.id,
        dependentConceptId: limits.id,
      },
    ],
    skipDuplicates: true,
  })

  await ensureQuestion({
    conceptId: linearFunctions.id,
    authorId: writerId,
    usage: "PRACTICE",
    difficulty: "EASY",
    content: "If f(x) = 2x + 3, what is the slope of the line?",
    correctAnswer: "2",
    distractors: ["3", "-2", "5"],
    hintText: "The slope is the coefficient of x.",
    explanation: "In slope-intercept form, the coefficient of x is the slope.",
  })

  await ensureQuestion({
    conceptId: linearFunctions.id,
    authorId: writerId,
    usage: "CHECKPOINT",
    difficulty: "MEDIUM",
    content: "If f(x) = 2x + 3, what is the y-intercept?",
    correctAnswer: "3",
    distractors: ["2", "-3", "5"],
    hintText: "The y-intercept is the constant term in slope-intercept form.",
    explanation: "In f(x) = mx + b, the y-intercept is b. Here b = 3.",
  })

  await ensureQuestion({
    conceptId: linearFunctions.id,
    authorId: writerId,
    usage: "EXAM",
    difficulty: "MEDIUM",
    content: "Find the value of f(2) when f(x) = 2x + 3.",
    correctAnswer: "7",
    distractors: ["5", "4", "6"],
    hintText: "Substitute 2 for x.",
    explanation: "f(2) = 2(2) + 3 = 7.",
  })

  await ensureQuestion({
    conceptId: quadraticFunctions.id,
    authorId: writerId,
    usage: "PRACTICE",
    difficulty: "EASY",
    content: "What is the shape of the graph of a quadratic function?",
    correctAnswer: "Parabola",
    distractors: ["Line", "Circle", "Hyperbola"],
    hintText: "Think about the graph of y = x^2.",
    explanation: "Quadratic functions graph as parabolas.",
  })

  await ensureQuestion({
    conceptId: quadraticFunctions.id,
    authorId: writerId,
    usage: "CHECKPOINT",
    difficulty: "MEDIUM",
    content: "Factor x^2 - 5x + 6.",
    correctAnswer: "(x - 2)(x - 3)",
    distractors: ["(x + 2)(x + 3)", "x(x - 5) + 6", "(x - 1)(x - 6)"],
    hintText: "Look for two numbers whose product is 6 and sum is -5.",
    explanation: "The numbers are -2 and -3, so the factorization is (x - 2)(x - 3).",
  })

  await ensureQuestion({
    conceptId: quadraticFunctions.id,
    authorId: writerId,
    usage: "EXAM",
    difficulty: "HARD",
    content: "Factor x^2 - 5x + 6 completely.",
    correctAnswer: "(x - 2)(x - 3)",
    distractors: ["(x + 2)(x + 3)", "(x - 1)(x - 6)", "x(x - 5) + 6"],
    hintText: "Use two numbers whose product is 6 and sum is -5.",
    explanation: "The correct factorization is (x - 2)(x - 3).",
  })

  await ensureQuestion({
    conceptId: quadraticFunctions.id,
    authorId: writerId,
    usage: "EXAM",
    difficulty: "HARD",
    content: "What is the vertex of y = (x - 1)^2 + 2?",
    correctAnswer: "(1, 2)",
    distractors: ["(-1, 2)", "(1, -2)", "(2, 1)"],
    hintText: "Read the transformation directly from vertex form.",
    explanation: "In y = (x - h)^2 + k, the vertex is (h, k).",
  })

  await ensureQuestion({
    conceptId: quadraticFunctions.id,
    authorId: writerId,
    usage: "EXAM",
    difficulty: "HARD",
    content: "Write a quadratic in factor form with roots 2 and 3.",
    correctAnswer: "(x - 2)(x - 3)",
    distractors: ["(x + 2)(x + 3)", "x^2 + 5x + 6", "(x - 1)(x - 6)"],
    hintText: "A root r gives a factor of (x - r).",
    explanation: "Roots at 2 and 3 produce factors (x - 2) and (x - 3).",
  })

  await ensureQuestion({
    conceptId: limits.id,
    authorId: writerId,
    usage: "PRACTICE",
    difficulty: "MEDIUM",
    content: "For f(x) = x^2, what value does the function approach as x approaches 2?",
    correctAnswer: "4",
    distractors: ["2", "0", "8"],
    hintText: "The function is continuous, so direct substitution works.",
    explanation: "Because f(x) = x^2 is continuous, the limit is 2^2 = 4.",
  })

  await ensureQuestion({
    conceptId: limits.id,
    authorId: writerId,
    usage: "EXAM",
    difficulty: "HARD",
    content: "Find the limit of x^2 as x approaches 2.",
    correctAnswer: "4",
    distractors: ["2", "0", "8"],
    hintText: "Substitute 2 into the expression once the function is continuous.",
    explanation: "Because x^2 is continuous, the limit at x = 2 is 2^2 = 4.",
  })

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

async function upsertCourse({ title, description, authorId }) {
  const existingCourse = await prisma.course.findFirst({
    where: {
      title,
    },
  })

  if (existingCourse) {
    return prisma.course.update({
      where: {
        id: existingCourse.id,
      },
      data: {
        description,
        authorId,
        archivedAt: null,
      },
    })
  }

  return prisma.course.create({
    data: {
      title,
      description,
      authorId,
    },
  })
}

async function ensureQuestion({
  conceptId,
  authorId,
  usage,
  difficulty,
  content,
  correctAnswer,
  distractors,
  hintText,
  explanation,
}) {
  const existingQuestion = await prisma.question.findFirst({
    where: {
      conceptId,
      usage,
      difficulty,
      content,
    },
  })

  if (existingQuestion) {
    return prisma.question.update({
      where: {
        id: existingQuestion.id,
      },
      data: {
        correctAnswer,
        distractors,
        hintText,
        explanation,
        authorId,
      },
    })
  }

  return prisma.question.create({
    data: {
      conceptId,
      usage,
      difficulty,
      content,
      correctAnswer,
      distractors,
      hintText,
      explanation,
      authorId,
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

  if (!admin.profile) {
    await prisma.userProfile.create({ data: { userId: admin.id } })
  }

  if (!writer.profile) {
    await prisma.userProfile.create({ data: { userId: writer.id } })
  }

  if (!student.profile) {
    await prisma.userProfile.create({ data: { userId: student.id } })
  }

  await seedMathCurriculum({
    writerId: writer.id,
    studentId: student.id,
  })

  console.info("Seed complete", {
    adminEmail,
    writerEmail,
    studentEmail,
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
