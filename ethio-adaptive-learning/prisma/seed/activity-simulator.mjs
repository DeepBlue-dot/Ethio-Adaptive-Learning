import { subDays, addMinutes, startOfDay, addDays, isSameDay } from "date-fns"
import { SIMULATION_DAYS, PRACTICE_PER_SESSION, XP_MAP } from "./constants.mjs"
import { clamp, getConceptBktParams, applyObservation } from "./bkt-utils.mjs"

export async function simulateActivity(prisma, students, conceptIds) {
  console.info(`--- Launching Adaptive Simulation Engine (${SIMULATION_DAYS} Days) ---`)
  
  const concepts = await prisma.concept.findMany({
    where: { id: { in: conceptIds } },
    include: { questions: true }
  })

  const now = new Date()
  const startDate = startOfDay(subDays(now, SIMULATION_DAYS))
  
  // Simulation State
  const masteryMap = new Map() // key: `${userId}:${conceptId}`, value: { pL, correctCount, consecutiveFails, totalXP }
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

        // Decide Pathway: LEARN (guided) vs CHALLENGE (direct assessment)
        // High achievers or speedsters might try to challenge more often
        const challengeProb = student.persona === 'ACHIEVER' ? 0.3 : student.persona === 'SPEEDSTER' ? 0.4 : 0.1
        const isChallengePath = Math.random() < challengeProb && state.pL < 0.8

        if (isChallengePath) {
          // --- PATHWAY B: CHALLENGE PATH ---
          const examTime = addMinutes(sessionStartTime, 15)
          const score = clamp(state.pL + (Math.random() * 0.25 - 0.1))
          const isPassed = score > 0.85 // Challenge exams are slightly harder to "pass" diagnostic

          await prisma.interactionLog.create({
            data: {
              userId: student.id,
              conceptId: concept.id,
              activityType: "EXAM_RESPONSE",
              isCorrect: isPassed,
              createdAt: examTime
            }
          })

          await prisma.examAttempt.create({
            data: {
              userId: student.id,
              conceptId: concept.id,
              pathway: "CHALLENGE",
              questionIds: concept.questions.slice(0, 10).map(q => q.id),
              score,
              isPassed,
              questionCount: Math.min(concept.questions.length, 10),
              correctCount: Math.floor(score * Math.min(concept.questions.length, 10)),
              createdAt: examTime,
              completedAt: examTime
            }
          })

          state.totalXP += isPassed ? XP_MAP.EXAM_PASS * 1.5 : XP_MAP.EXAM_FAIL
          if (isPassed) {
            state.pL = clamp(0.92 + Math.random() * 0.05)
          } else {
            state.pL = clamp(state.pL + 0.05) // Minor learning even from failure
            state.consecutiveFails++
          }
        } else {
          // --- PATHWAY A: INSTRUCTIONAL PATH ---
          
          // 1. CONTENT READ
          const readTime = addMinutes(sessionStartTime, 5)
          await prisma.interactionLog.create({
            data: {
              userId: student.id,
              conceptId: concept.id,
              activityType: "CONTENT_READ",
              createdAt: readTime
            }
          })
          state.totalXP += XP_MAP.CONTENT_READ
          state.pL = clamp(state.pL + 0.05) // Reading content helps slightly

          // 2. PRACTICE LOOP
          const practiceCount = Math.floor(PRACTICE_PER_SESSION * (0.8 + Math.random() * 0.4))
          for (let p = 0; p < practiceCount; p++) {
            const interactionTime = addMinutes(readTime, 5 + p * 4)
            const question = concept.questions[Math.floor(Math.random() * concept.questions.length)]
            
            let pCorrect = state.pL * (1 - bktParams.pS) + (1 - state.pL) * bktParams.pG
            if (student.persona === 'ACHIEVER') pCorrect = clamp(pCorrect + 0.15)
            if (student.persona === 'STRUGGLER') pCorrect = clamp(pCorrect - 0.1)

            const isCorrect = Math.random() < pCorrect
            
            // Randomly use hints for strugglers
            const usedHint = !isCorrect && student.persona === 'STRUGGLER' && Math.random() > 0.5
            if (usedHint) {
               await prisma.interactionLog.create({
                 data: {
                   userId: student.id,
                   conceptId: concept.id,
                   activityType: "SOCRATIC_HINT_USED",
                   createdAt: interactionTime
                 }
               })
               state.totalXP += XP_MAP.SOCRATIC_HINT_USED
            }

            const responseTime = isCorrect 
              ? 3000 + Math.random() * 10000 
              : 8000 + Math.random() * 25000

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

          // 3. CHECKPOINT (Trigger if pL improved)
          if (state.pL > 0.6 && state.pL < 0.9) {
             const cpTime = addMinutes(sessionStartTime, 45)
             const isPass = Math.random() < (state.pL + 0.1)
             
             await prisma.interactionLog.create({
               data: {
                 userId: student.id,
                 conceptId: concept.id,
                 activityType: "CHECKPOINT_QUESTION",
                 isCorrect: isPass,
                 createdAt: cpTime
               }
             })

             await prisma.checkpointAttempt.create({
               data: {
                 userId: student.id,
                 conceptId: concept.id,
                 questionId: concept.questions[0].id,
                 isCorrect: isPass,
                 createdAt: cpTime,
                 completedAt: cpTime
               }
             })
             
             state.totalXP += isPass ? XP_MAP.CHECKPOINT_PASS : XP_MAP.CHECKPOINT_FAIL
             if (isPass) state.pL = clamp(state.pL + 0.1)
          }

          // 4. MASTERY EXAM (Trigger if high mastery)
          if (state.pL > 0.82) {
             const examTime = addMinutes(sessionStartTime, 60)
             const score = clamp(state.pL + (Math.random() * 0.15 - 0.05))
             const isPassed = score > 0.8

             await prisma.interactionLog.create({
               data: {
                 userId: student.id,
                 conceptId: concept.id,
                 activityType: "EXAM_RESPONSE",
                 isCorrect: isPassed,
                 createdAt: examTime
               }
             })

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
             if (isPassed) state.pL = clamp(state.pL + 0.05, 0, 0.995)
          }
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
    
    // Simulate natural decay/review need for some mastered concepts
    if (status === "MASTERED" && Math.random() < 0.2) {
      status = "REVIEW_NEEDED"
    }

    if (state.consecutiveFails >= 4) status = "REVIEW_NEEDED"

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
