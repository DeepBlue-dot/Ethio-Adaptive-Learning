import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import { STUDENT_COUNT, SIMULATION_DAYS, PRACTICE_PER_SESSION } from "./seed/constants.mjs"
import { createIdentities } from "./seed/identity-seeder.mjs"
import { seedCurriculum, enrichImportedMathContent, seedDemoCourses } from "./seed/curriculum-seeder.mjs"
import { seedAssets } from "./seed/asset-seeder.mjs"
import { simulateActivity } from "./seed/activity-simulator.mjs"

const prisma = new PrismaClient()

async function main() {
  console.info("--- INITIALIZING RESET ---")
  await prisma.resourceUsage.deleteMany({})
  await prisma.interactionLog.deleteMany({})
  await prisma.practiceAttempt.deleteMany({})
  await prisma.checkpointAttempt.deleteMany({})
  await prisma.examAttempt.deleteMany({})
  await prisma.userMastery.deleteMany({})
  await prisma.activityLog.deleteMany({})
  await prisma.userProfile.deleteMany({})
  await prisma.passwordResetToken.deleteMany({})
  await prisma.session.deleteMany({})
  await prisma.account.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.mediaAsset.deleteMany({})
  await prisma.contentSnippet.deleteMany({})

  const { admin, writers, students } = await createIdentities(prisma, bcrypt)
  const importResult = await seedCurriculum(prisma, writers[0].id)
  const { assetsByPublicId } = await seedAssets(prisma, writers[0].id)
  
  await enrichImportedMathContent({
    prisma,
    assetsByPublicId,
    conceptIdsByReference: importResult.conceptIdsByReference,
    writerId: writers[0].id
  })
  
  const demoCourseResult = await seedDemoCourses({
    prisma,
    assetsByPublicId,
    writerId: writers[1].id
  })
  
  const conceptIds = [
    ...Object.values(importResult.conceptIdsByReference),
    ...demoCourseResult.conceptIds
  ]
  
  // Link resources to verify usage tracking
  await prisma.resourceUsage.create({
    data: {
      mediaAssetId: assetsByPublicId["math-ref-001"].id,
      consumerType: "CONCEPT",
      consumerId: conceptIds[0],
      context: "header_image"
    }
  })

  await simulateActivity(prisma, students, conceptIds, { admin, writers })
  
  console.info("--- FINALIZING AUDIT ---")
  await prisma.activityLog.createMany({
    data: [
      { userId: admin.id, action: "PUBLISH", contentType: "course", entityId: importResult.courseId, entityTitle: "Mathematics G12" },
      { userId: writers[0].id, action: "UPDATE", contentType: "concept", entityId: conceptIds[0], entityTitle: "Linear Functions" },
    ]
  })

  console.info("\n✅ Simulation Engine Complete")
  console.info(`- Students Simulated: ${STUDENT_COUNT}`)
  console.info(`- Data Points Generated: ~${STUDENT_COUNT * SIMULATION_DAYS * 0.6 * PRACTICE_PER_SESSION}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
