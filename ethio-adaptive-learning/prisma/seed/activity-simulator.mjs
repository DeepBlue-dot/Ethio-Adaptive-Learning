import { subDays, addMinutes, startOfDay, addDays, isSameDay, differenceInDays } from "date-fns"
import { SIMULATION_DAYS, PRACTICE_PER_SESSION, XP_MAP } from "./constants.mjs"
import { clamp, getConceptBktParams, applyObservation } from "./bkt-utils.mjs"

/**
 * Computes the "Effective Mastery" using exponential decay.
 * This mirrors the logic in the platform's Retention Engine.
 */
function computeEffectiveMastery(baseline, lambda, elapsedDays) {
  if (!elapsedDays || elapsedDays <= 0) return baseline
  return clamp(baseline * Math.exp(-lambda * elapsedDays), 0, 1)
}

export async function simulateActivity(prisma, students, conceptIds, { admin, writers } = {}) {
  console.info(`--- Launching Adaptive Simulation Engine (${SIMULATION_DAYS} Days) ---`)
  
  const concepts = await prisma.concept.findMany({
    where: { id: { in: conceptIds } },
    include: { questions: true }
  })

  const now = new Date()
  const startDate = startOfDay(subDays(now, SIMULATION_DAYS))
  
  // Persistent Simulation State (across 30 days)
  const masteryMap = new Map() // key: `${userId}:${conceptId}`, value: { pL, lastAssessedAt, totalXP, consecutiveFails }
  const studentStreaks = new Map() // key: userId, value: currentStreak
  const interactionHistory = [] // Log of (userId, date)

  for (let d = 0; d < SIMULATION_DAYS; d++) {
    const currentDate = addDays(startDate, d)
    const isFirstHalf = d < (SIMULATION_DAYS / 2)
    console.info(`  [DAY ${d+1}] ${currentDate.toDateString()}`)

    // --- 1. ADMINISTRATIVE PULSE ---
    // Simulate content updates or system audits
    if (Math.random() < 0.15 && writers?.length) {
      const writer = writers[Math.floor(Math.random() * writers.length)]
      const targetConcept = concepts[Math.floor(Math.random() * concepts.length)]
      await prisma.activityLog.create({
        data: {
          userId: writer.id,
          action: "UPDATE",
          contentType: "concept",
          entityId: targetConcept.id,
          entityTitle: targetConcept.title,
          createdAt: addMinutes(currentDate, 540) // 9:00 AM
        }
      })
    }

    if (Math.random() < 0.05 && admin) {
      await prisma.activityLog.create({
        data: {
          userId: admin.id,
          action: "PUBLISH",
          contentType: "course",
          entityId: concepts[0].unitId, // Just a placeholder entity
          entityTitle: "Grade 12 Curriculum Audit",
          createdAt: addMinutes(currentDate, 600) // 10:00 AM
        }
      })
    }

    // --- 2. STUDENT LEARNING LOOP ---
    for (const student of students) {
      const currentStreak = studentStreaks.get(student.id) ?? 0
      
      // PERSONA LOGIC: Achievers and high-streak students log in more often
      let sessionProb = student.persona === 'ACHIEVER' ? 0.85 : student.persona === 'STRUGGLER' ? 0.4 : 0.6
      if (currentStreak >= 3) sessionProb = clamp(sessionProb + 0.15, 0, 0.95)
      
      if (Math.random() > sessionProb) {
        studentStreaks.set(student.id, 0) // Streak broken
        continue
      }

      // Record Activity for Streak tracking
      interactionHistory.push({ userId: student.id, date: currentDate })
      studentStreaks.set(student.id, currentStreak + 1)
      
      const sessionStartTime = addMinutes(currentDate, 480 + Math.random() * 600) // 8AM - 6PM
      
      // Determine session focus: Random concepts + those needing REVIEW
      const studentMasteries = Array.from(masteryMap.entries())
        .filter(([k]) => k.startsWith(student.id))
        .map(([k, v]) => ({ conceptId: k.split(':')[1], ...v }))

      // IDENTIFY RETENTION NEEDS
      const conceptsNeedingReview = studentMasteries
        .filter(m => {
          const concept = concepts.find(c => c.id === m.conceptId)
          const daysElapsed = differenceInDays(currentDate, m.lastAssessedAt)
          const effective = computeEffectiveMastery(m.pL, concept?.decayLambda ?? 0.05, daysElapsed)
          return m.pL > 0.8 && effective < 0.8 // Mastery is high, but retention dropped
        })
        .map(m => concepts.find(c => c.id === m.conceptId))

      const activeConcepts = [...conceptsNeedingReview]
      if (activeConcepts.length < 2) {
        // Add random fresh concepts to the session
        const fresh = concepts
          .filter(c => !activeConcepts.find(ac => ac.id === c.id))
          .sort(() => 0.5 - Math.random())
          .slice(0, 2 - activeConcepts.length)
        activeConcepts.push(...fresh)
      }

      for (const concept of activeConcepts) {
        if (!concept || concept.questions.length === 0) continue
        
        const bktParams = getConceptBktParams(concept)
        const key = `${student.id}:${concept.id}`
        let state = masteryMap.get(key) ?? { pL: bktParams.pLo, lastAssessedAt: currentDate, totalXP: 0, consecutiveFails: 0 }

        // --- RETENTION LOGIC: Decay pL before starting ---
        const daysSinceLast = differenceInDays(currentDate, state.lastAssessedAt)
        state.pL = computeEffectiveMastery(state.pL, concept.decayLambda, daysSinceLast)

        // Decide Pathway
        const isReviewSession = conceptsNeedingReview.find(c => c?.id === concept.id)
        const challengeProb = student.persona === 'ACHIEVER' ? 0.35 : student.persona === 'SPEEDSTER' ? 0.5 : 0.1
        const isChallengePath = !isReviewSession && Math.random() < challengeProb && state.pL < 0.75

        if (isChallengePath) {
          // --- CHALLENGE PATH ---
          const examTime = addMinutes(sessionStartTime, 20)
          const score = clamp(state.pL + (Math.random() * 0.3 - 0.1))
          const isPassed = score > 0.85

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
              questionIds: concept.questions.slice(0, 8).map(q => q.id),
              score,
              isPassed,
              questionCount: Math.min(concept.questions.length, 8),
              correctCount: Math.floor(score * 8),
              createdAt: examTime,
              completedAt: examTime
            }
          })

          state.totalXP += isPassed ? XP_MAP.EXAM_PASS : XP_MAP.EXAM_FAIL
          state.pL = isPassed ? clamp(0.93 + Math.random() * 0.05) : clamp(state.pL + 0.05)
          state.lastAssessedAt = examTime
        } else {
          // --- INSTRUCTIONAL / REVIEW PATH ---
          
          // 1. CONTENT ENGAGEMENT
          const readTime = addMinutes(sessionStartTime, 5)
          await prisma.interactionLog.create({
            data: {
              userId: student.id,
              conceptId: concept.id,
              activityType: isReviewSession ? "CONTENT_REVIEW" : "CONTENT_READ",
              createdAt: readTime
            }
          })
          state.totalXP += XP_MAP.CONTENT_READ
          state.pL = clamp(state.pL + 0.02)

          // 2. SOCRATIC AI INTERACTION (Simulated)
          // Average of 1 AI interaction every 4 instructional sessions
          if (Math.random() < 0.25) {
            const aiTime = addMinutes(readTime, 10)
            const session = await prisma.tutorSession.create({
              data: {
                userId: student.id,
                conceptId: concept.id,
                createdAt: aiTime
              }
            })

            // Multi-turn interaction
            const turnCount = 1 + Math.floor(Math.random() * 3)
            for (let t = 0; t < turnCount; t++) {
              const interactionTime = addMinutes(aiTime, t * 2)
              
              // Student Query
              await prisma.tutorMessage.create({
                data: {
                  sessionId: session.id,
                  role: "STUDENT",
                  content: "How does the Power Rule apply to negative exponents?",
                  timestamp: interactionTime
                }
              })

              // AI Response (Occasionally Flagged)
              const isFlagged = Math.random() < 0.1
              await prisma.tutorMessage.create({
                data: {
                  sessionId: session.id,
                  role: "AI",
                  content: isFlagged ? "The answer is exactly 5." : "Think about what happens to the sign when you subtract one.",
                  timestamp: addMinutes(interactionTime, 1),
                  isFlagged,
                  flagReason: isFlagged ? "Direct answer leak detected" : null
                }
              })
              
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
          }

          // 3. PRACTICE LOOP
          const practiceCount = isReviewSession ? 3 : Math.floor(PRACTICE_PER_SESSION * (0.8 + Math.random() * 0.5))
          for (let p = 0; p < practiceCount; p++) {
            const interactionTime = addMinutes(readTime, 15 + p * 5)
            const question = concept.questions[Math.floor(Math.random() * concept.questions.length)]
            
            let pCorrect = state.pL * (1 - bktParams.pS) + (1 - state.pL) * bktParams.pG
            if (student.persona === 'ACHIEVER') pCorrect = clamp(pCorrect + 0.2)
            if (student.persona === 'STRUGGLER') pCorrect = clamp(pCorrect - 0.15)

            const isCorrect = Math.random() < pCorrect
            const responseTime = isCorrect ? 5000 + Math.random() * 15000 : 10000 + Math.random() * 40000

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
                selectedAnswer: isCorrect ? question.correctAnswer : "Miscalculation",
                createdAt: interactionTime,
                completedAt: interactionTime
              }
            })

            const update = applyObservation({ prior: state.pL, isCorrect, params: bktParams })
            state.pL = update.posteriorNext
            state.lastAssessedAt = interactionTime
            
            if (isCorrect) {
              state.consecutiveFails = 0
              state.totalXP += XP_MAP.PRACTICE_CORRECT
            } else {
              state.consecutiveFails++
              state.totalXP += XP_MAP.PRACTICE_INCORRECT
            }
          }

          // 4. CHECKPOINT OR MASTERY (If pL is high enough)
          if (!isReviewSession && state.pL > 0.85) {
             const examTime = addMinutes(sessionStartTime, 60)
             const score = clamp(state.pL + (Math.random() * 0.2 - 0.05))
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
             if (isPassed) state.pL = clamp(state.pL + 0.08, 0, 0.999)
             state.lastAssessedAt = examTime
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
    const concept = concepts.find(c => c.id === conceptId)
    
    // Compute FINAL decay until the actual 'now'
    const daysSinceFinalAssessed = differenceInDays(now, state.lastAssessedAt)
    const finalEffectiveMastery = computeEffectiveMastery(state.pL, concept?.decayLambda ?? 0.05, daysSinceFinalAssessed)

    let status = "IN_PROGRESS"
    if (state.pL >= 0.9) {
      status = finalEffectiveMastery < 0.8 ? "REVIEW_NEEDED" : "MASTERED"
    } else if (state.pL < 0.2) {
      status = "FRINGE"
    }

    if (state.consecutiveFails >= 4) status = "REVIEW_NEEDED"

    await prisma.userMastery.upsert({
      where: { userId_conceptId: { userId, conceptId } },
      update: {
        pMastery: state.pL,
        status,
        lastAssessedAt: state.lastAssessedAt,
        nextReviewAt: status === "MASTERED" ? addDays(state.lastAssessedAt, 7) : null,
        consecutiveFails: state.consecutiveFails
      },
      create: {
        userId,
        conceptId,
        pMastery: state.pL,
        status,
        lastAssessedAt: state.lastAssessedAt,
        unlockedAt: startDate,
        nextReviewAt: status === "MASTERED" ? addDays(state.lastAssessedAt, 7) : null,
        consecutiveFails: state.consecutiveFails
      }
    })
  }

  // 5. FINALIZE PROFILES
  console.info("--- Calculating Gamification Meta-Data ---")
  for (const student of students) {
    const studentInteractions = interactionHistory.filter(h => h.userId === student.id)
    const studentMasteries = Array.from(masteryMap.entries())
      .filter(([k]) => k.startsWith(student.id))
      .map(([, v]) => v)

    const totalXP = studentMasteries.reduce((sum, m) => sum + m.totalXP, 0)
    const currentLevel = Math.floor(Math.sqrt(totalXP / 100)) + 1
    
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
