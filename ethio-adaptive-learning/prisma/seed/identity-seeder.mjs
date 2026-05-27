import { STUDENT_COUNT } from "./constants.mjs"

export async function createIdentities(prisma, bcrypt) {
  console.info("--- Generating Identity Personas ---")
  const passwordHash = await bcrypt.hash("Student12345!", 12)
  const adminHash = await bcrypt.hash("Admin12345!", 12)
  const writerHash = await bcrypt.hash("Writer12345!", 12)

  // System Roles
  const admin = await prisma.user.upsert({
    where: { email: "admin@ethioprep.com" },
    update: {},
    create: {
      email: "admin@ethioprep.com",
      username: "admin",
      name: "System Director",
      passwordHash: adminHash,
      role: "ADMIN",
      profile: { create: {} }
    }
  })

  const writers = await Promise.all([
    prisma.user.upsert({
      where: { email: "writer1@ethioprep.com" },
      update: {},
      create: {
        email: "writer1@ethioprep.com",
        username: "curriculum_lead",
        name: "Dr. Aster Lemma",
        passwordHash: writerHash,
        role: "COURSE_WRITER",
        profile: { create: {} }
      }
    }),
    prisma.user.upsert({
      where: { email: "writer2@ethioprep.com" },
      update: {},
      create: {
        email: "writer2@ethioprep.com",
        username: "item_banker",
        name: "Dawit Yohannes",
        passwordHash: writerHash,
        role: "COURSE_WRITER",
        profile: { create: {} }
      }
    })
  ])

  // Student Personas
  const students = []
  for (let i = 1; i <= STUDENT_COUNT; i++) {
    // Distribute personas
    const rand = Math.random()
    const persona = rand > 0.8 ? 'ACHIEVER' : rand > 0.4 ? 'AVERAGE' : rand > 0.15 ? 'SPEEDSTER' : 'STRUGGLER'
    
    const student = await prisma.user.upsert({
      where: { email: `scholar${i}@example.com` },
      update: {},
      create: {
        email: `scholar${i}@example.com`,
        username: `scholar_${i}`,
        name: `Scholar ${i}`,
        passwordHash,
        role: "STUDENT",
        grade: "GRADE_12",
        profile: { create: {} }
      }
    })
    students.push({ ...student, persona })
  }

  return { admin, writers, students }
}
