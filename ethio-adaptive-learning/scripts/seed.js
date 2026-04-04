import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@ethioadaptive.local"
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345!"
const studentEmail = process.env.SEED_STUDENT_EMAIL ?? "student@ethioadaptive.local"
const studentPassword = process.env.SEED_STUDENT_PASSWORD ?? "Student12345!"

async function upsertUser({
  email,
  username,
  password,
  role,
}) {
  const passwordHash = await bcrypt.hash(password, 12)

  return prisma.user.upsert({
    where: { email },
    update: {
      name: username,
      username,
      passwordHash,
      role,
    },
    create: {
      name: username,
      username,
      email,
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

async function main() {
  const admin = await upsertUser({
    email: adminEmail,
    username: "admin",
    password: adminPassword,
    role: "ADMIN",
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

  if (!student.profile) {
    await prisma.userProfile.create({ data: { userId: student.id } })
  }

  console.info("Seed complete", {
    adminEmail,
    studentEmail,
  })
}

main()
  .catch((error) => {
    console.error("Seed failed", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
