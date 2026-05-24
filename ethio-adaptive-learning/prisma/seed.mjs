import bcrypt from "bcryptjs"
import { Prisma, PrismaClient } from "@prisma/client"
import { subDays, addMinutes, startOfDay, addDays, isSameDay } from "date-fns"
import { importGrade12Math } from "../scripts/import-grade12-math.mjs"

const prisma = new PrismaClient()

/**
 * --- SIMULATION CONFIGURATION ---
 */
const SIMULATION_DAYS = 30
const STUDENT_COUNT = 30
const PRACTICE_PER_SESSION = 6
const SESSION_PROBABILITY = 0.55

const XP_MAP = {
  PRACTICE_CORRECT: 15,
  PRACTICE_INCORRECT: 2,
  CHECKPOINT_PASS: 100,
  CHECKPOINT_FAIL: 20,
  EXAM_PASS: 500,
  EXAM_FAIL: 50
}

/**
 * --- INLINED BKT & SIM LOGIC ---
 */
function clamp(v, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v || 0))
}

function evidenceUpdateCorrect(prior, params) {
  const pK = clamp(prior)
  const num = pK * (1 - params.pS)
  const den = num + (1 - pK) * params.pG
  return den === 0 ? pK : clamp(num / den)
}

function evidenceUpdateIncorrect(prior, params) {
  const pK = clamp(prior)
  const num = pK * params.pS
  const den = num + (1 - pK) * (1 - params.pG)
  return den === 0 ? pK : clamp(num / den)
}

function transitUpdate(posterior, params) {
  const nextPrior = clamp(posterior)
  return clamp(nextPrior + (1 - nextPrior) * params.pT)
}

function applyObservation({ prior, isCorrect, params }) {
  const posteriorEvidence = isCorrect
    ? evidenceUpdateCorrect(prior, params)
    : evidenceUpdateIncorrect(prior, params)
  return {
    posteriorEvidence,
    posteriorNext: transitUpdate(posteriorEvidence, params),
  }
}

function getConceptBktParams(concept) {
  return {
    pLo: clamp(concept?.pLo ?? 0.15),
    pT: clamp(concept?.pT ?? 0.1),
    pG: clamp(concept?.pG ?? 0.2),
    pS: clamp(concept?.pS ?? 0.1),
  }
}

/**
 * --- SEEDER FUNCTIONS ---
 */

async function createIdentities() {
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

async function seedCurriculum(writerId) {
  console.info("--- Provisioning Courseware ---")
  const result = await importGrade12Math({
    prisma,
    authorId: writerId,
  })
  
  // Synthetic Friction Points
  const firstUnit = await prisma.unit.findFirst()
  if (firstUnit) {
    await prisma.concept.upsert({
      where: { unitId_slug: { unitId: firstUnit.id, slug: "orphaned-concept-test" } },
      update: {},
      create: {
        unitId: firstUnit.id,
        slug: "orphaned-concept-test",
        title: "Orphaned Concept (Testing)",
        status: "PUBLISHED"
      }
    })
    
    await prisma.concept.upsert({
      where: { unitId_slug: { unitId: firstUnit.id, slug: "complex-trig-friction" } },
      update: {},
      create: {
        unitId: firstUnit.id,
        slug: "complex-trig-friction",
        title: "Complex Trigonometric Identities",
        status: "PUBLISHED",
        pT: 0.02,
        pS: 0.35,
        pLo: 0.05
      }
    })
  }

  return result
}

async function seedAssets(writerId) {
  console.info("--- Provisioning Media Assets ---")
  const assets = await Promise.all([
    prisma.mediaAsset.upsert({
      where: { publicId: "math-ref-001" },
      update: {},
      create: {
        publicId: "math-ref-001",
        kind: "IMAGE",
        title: "Function Transformation Map",
        url: "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1/math/transformations",
        bytes: 250000,
        status: "PUBLISHED",
        createdById: writerId
      }
    }),
    prisma.mediaAsset.upsert({
      where: { publicId: "math-sim-001" },
      update: {},
      create: {
        publicId: "math-sim-001",
        kind: "PHET_SIMULATION",
        title: "Limit Approacher",
        url: "https://phet.colorado.edu/sims/html/limits/latest/limits_en.html",
        status: "PUBLISHED",
        createdById: writerId
      }
    })
  ])
  
  const snippet = await prisma.contentSnippet.upsert({
    where: { slug: "mastery-formula" },
    update: {},
    create: {
      slug: "mastery-formula",
      title: "The BKT Formula",
      contentBlocks: [{ type: "latex", content: "P(L_{n+1}|Obs) = P(L_n|Obs) + (1 - P(L_n|Obs)) \cdot P(T)" }],
      status: "PUBLISHED",
      authorId: writerId
    }
  })

  return { assets, snippet }
}

async function simulateActivity(students, conceptIds) {
  console.info(`--- Launching Adaptive Simulation Engine (${SIMULATION_DAYS} Days) ---`)
  
  const concepts = await prisma.concept.findMany({
    where: { id: { in: conceptIds } },
    include: { questions: true }
  })

  const now = new Date()
  const startDate = startOfDay(subDays(now, SIMULATION_DAYS))
  
  // Simulation State
  const masteryMap = new Map() // key: `${userId}:${conceptId}`, value: { pL, correctCount, consecutiveFails }
  const interactionHistory = [] // To finalize streaks later

  for (let d = 0; d < SIMULATION_DAYS; d++) {
    const currentDate = addDays(startDate, d)
    console.info(`  [DAY ${d+1}] ${currentDate.toDateString()}`)

    for (const student of students) {
      // Deterministic but persona-based login
      const sessionProb = student.persona === 'ACHIEVER' ? 0.8 : student.persona === 'STRUGGLER' ? 0.4 : 0.6
      if (Math.random() > sessionProb) continue

      interactionHistory.push({ userId: student.id, date: currentDate })
      const sessionStartTime = addMinutes(currentDate, 480 + Math.random() * 600) // Between 8AM and 6PM
      
      // Work on 1-2 concepts per session
      const activeConcepts = concepts.sort(() => 0.5 - Math.random()).slice(0, 2)

      for (const concept of activeConcepts) {
        if (concept.questions.length === 0) continue
        
        const bktParams = getConceptBktParams(concept)
        const key = `${student.id}:${concept.id}`
        let state = masteryMap.get(key) ?? { pL: bktParams.pLo, correctCount: 0, consecutiveFails: 0, totalXP: 0 }

        // 1. PRACTICE LOOP
        for (let p = 0; p < PRACTICE_PER_SESSION; p++) {
          const interactionTime = addMinutes(sessionStartTime, p * 4)
          const question = concept.questions[Math.floor(Math.random() * concept.questions.length)]
          
          // Probability adjusted by persona
          let pCorrect = state.pL * (1 - bktParams.pS) + (1 - state.pL) * bktParams.pG
          if (student.persona === 'ACHIEVER') pCorrect = clamp(pCorrect + 0.15)
          if (student.persona === 'STRUGGLER') pCorrect = clamp(pCorrect - 0.1)
          if (student.persona === 'SPEEDSTER') pCorrect = clamp(pCorrect - 0.05) // Speed leads to slips

          const isCorrect = Math.random() < pCorrect
          
          // Response time correlation
          let responseTime = isCorrect 
            ? 3000 + Math.random() * 10000 
            : 8000 + Math.random() * 25000
          if (student.persona === 'SPEEDSTER') responseTime *= 0.4

          await prisma.interactionLog.create({
            data: {
              userId: student.id,
              conceptId: concept.id,
              questionId: question.id,
              activityType: "PRACTICE_QUESTION",
              isCorrect,
              responseTimeMs: Math.floor(responseTime),
              createdAt: interactionTime
            }
          })

          await prisma.practiceAttempt.create({
            data: {
              userId: student.id,
              conceptId: concept.id,
              questionId: question.id,
              isCorrect,
              selectedAnswer: isCorrect ? question.correctAnswer : "Distractor",
              createdAt: interactionTime,
              completedAt: interactionTime
            }
          })

          // Update BKT
          const update = applyObservation({ prior: state.pL, isCorrect, params: bktParams })
          state.pL = update.posteriorNext
          if (isCorrect) {
            state.correctCount++
            state.consecutiveFails = 0
            state.totalXP += XP_MAP.PRACTICE_CORRECT
          } else {
            state.consecutiveFails++
            state.totalXP += XP_MAP.PRACTICE_INCORRECT
          }
        }

        // 2. CHECKPOINT (Trigger if pL > 0.6 and not mastered)
        if (state.pL > 0.6 && state.pL < 0.9) {
           const cpTime = addMinutes(sessionStartTime, 40)
           const isPass = Math.random() < (state.pL + 0.1)
           
           await prisma.checkpointAttempt.create({
             data: {
               userId: student.id,
               conceptId: concept.id,
               questionId: concept.questions[0].id, // Simplified
               isCorrect: isPass,
               createdAt: cpTime,
               completedAt: cpTime
             }
           })
           
           state.totalXP += isPass ? XP_MAP.CHECKPOINT_PASS : XP_MAP.CHECKPOINT_FAIL
           if (isPass) state.pL = clamp(state.pL + 0.1)
        }

        // 3. EXAM (Trigger if high mastery)
        if (state.pL > 0.85) {
           const examTime = addMinutes(sessionStartTime, 60)
           const score = clamp(state.pL + (Math.random() * 0.2 - 0.1))
           const isPassed = score > 0.8

           await prisma.examAttempt.create({
             data: {
               userId: student.id,
               conceptId: concept.id,
               pathway: "LEARN",
               questionIds: concept.questions.map(q => q.id),
               score,
               isPassed,
               questionCount: concept.questions.length,
               correctCount: Math.floor(score * concept.questions.length),
               createdAt: examTime,
               completedAt: examTime
             }
           })

           state.totalXP += isPassed ? XP_MAP.EXAM_PASS : XP_MAP.EXAM_FAIL
           if (isPassed) state.pL = clamp(state.pL + 0.05, 0, 0.99)
        }

        masteryMap.set(key, state)
      }
    }
  }

  // 4. FINALIZE MASTERY RECORDS
  console.info("--- Consolidating Mastery States ---")
  for (const [key, state] of masteryMap.entries()) {
    const [userId, conceptId] = key.split(':')
    
    let status = "IN_PROGRESS"
    if (state.pL >= 0.9) status = "MASTERED"
    else if (state.pL < 0.25) status = "FRINGE"
    if (state.consecutiveFails >= 3) status = "REVIEW_NEEDED"

    await prisma.userMastery.upsert({
      where: { userId_conceptId: { userId, conceptId } },
      update: {
        pMastery: state.pL,
        status,
        lastAssessedAt: now,
        consecutiveFails: state.consecutiveFails
      },
      create: {
        userId,
        conceptId,
        pMastery: state.pL,
        status,
        lastAssessedAt: now,
        unlockedAt: startDate,
        consecutiveFails: state.consecutiveFails
      }
    })
  }

  // 5. FINALIZE PROFILES (XP, Levels, Streaks)
  console.info("--- Calculating Gamification Meta-Data ---")
  for (const student of students) {
    const studentInteractions = interactionHistory.filter(h => h.userId === student.id)
    const studentMasteries = Array.from(masteryMap.entries())
      .filter(([k]) => k.startsWith(student.id))
      .map(([, v]) => v)

    const totalXP = studentMasteries.reduce((sum, m) => sum + m.totalXP, 0)
    const currentLevel = Math.floor(Math.sqrt(totalXP / 100)) + 1
    
    // Calculate Streak
    let streak = 0
    let checkDate = startOfDay(now)
    while (true) {
      const hasActivity = studentInteractions.some(h => isSameDay(h.date, checkDate))
      if (hasActivity) {
        streak++
        checkDate = subDays(checkDate, 1)
      } else {
        break
      }
    }

    await prisma.userProfile.update({
      where: { userId: student.id },
      data: {
        totalXP,
        currentLevel,
        dailyStreak: streak,
        lastLogin: now,
        overallProgress: clamp((studentMasteries.filter(m => m.pL > 0.9).length / concepts.length) * 100, 0, 100)
      }
    })
  }
}

async function main() {
  console.info("--- INITIALIZING RESET ---")
  await prisma.resourceUsage.deleteMany({})
  await prisma.interactionLog.deleteMany({})
  await prisma.practiceAttempt.deleteMany({})
  await prisma.checkpointAttempt.deleteMany({})
  await prisma.examAttempt.deleteMany({})
  await prisma.userMastery.deleteMany({})
  await prisma.activityLog.deleteMany({})
  await prisma.cmsDraft.deleteMany({})
  await prisma.userProfile.deleteMany({})
  await prisma.passwordResetToken.deleteMany({})
  await prisma.session.deleteMany({})
  await prisma.account.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.mediaAsset.deleteMany({})
  await prisma.contentSnippet.deleteMany({})

  const { admin, writers, students } = await createIdentities()
  const importResult = await seedCurriculum(writers[0].id)
  const { assets, snippet } = await seedAssets(writers[0].id)
  
  const conceptIds = Object.values(importResult.conceptIdsByReference)
  
  // Link resources to verify usage tracking
  await prisma.resourceUsage.create({
    data: {
      mediaAssetId: assets[0].id,
      consumerType: "CONCEPT",
      consumerId: conceptIds[0],
      context: "header_image"
    }
  })

  await simulateActivity(students, conceptIds)
  
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
