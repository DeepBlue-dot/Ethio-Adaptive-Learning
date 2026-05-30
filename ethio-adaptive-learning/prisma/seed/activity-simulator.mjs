import { subDays, addMinutes, startOfDay, addDays, isSameDay, differenceInDays } from "date-fns"
import { SIMULATION_DAYS, PRACTICE_PER_SESSION, XP_MAP } from "./constants.mjs"
import { clamp, getConceptBktParams, applyObservation } from "./bkt-utils.mjs"

/**
 * Computes the "Effective Mastery" using exponential decay.
 */
function computeEffectiveMastery(baseline, lambda, elapsedDays) {
  if (!elapsedDays || elapsedDays <= 0) return baseline
  return clamp(baseline * Math.exp(-lambda * elapsedDays), 0, 1)
}

export async function simulateActivity(prisma, students, conceptIds, { admin, writers } = {}) {
  console.info(`--- Launching Sequential Journey Simulation (${SIMULATION_DAYS} Days) ---`)
  
  const concepts = await prisma.concept.findMany({
    where: { id: { in: conceptIds } },
    include: { questions: true, prerequisiteEdges: true }
  })

  // Build a concept reference map for easy lookup
  const conceptMapById = new Map(concepts.map(c => [c.id, c]))
  
  const now = new Date()
  const startDate = startOfDay(subDays(now, SIMULATION_DAYS))
  
  // Persistent Simulation State
  const masteryMap = new Map() // key: `${userId}:${conceptId}`, value: { pL, lastAssessedAt, totalXP, consecutiveFails }
  const studentStreaks = new Map()
  const interactionHistory = []

  for (let d = 0; d < SIMULATION_DAYS; d++) {
    const currentDate = addDays(startDate, d)
    console.info(`  [DAY ${d+1}] ${currentDate.toDateString()}`)

    // 1. ADMIN PULSE (Remains same)
    if (Math.random() < 0.1 && writers?.length) {
      const writer = writers[Math.floor(Math.random() * writers.length)]
      const target = concepts[Math.floor(Math.random() * concepts.length)]
      await prisma.activityLog.create({
        data: { userId: writer.id, action: "UPDATE", contentType: "concept", entityId: target.id, entityTitle: target.title, createdAt: addMinutes(currentDate, 540) }
      })
    }

    // 2. STUDENT LEARNING LOOP
    for (const student of students) {
      const currentStreak = studentStreaks.get(student.id) ?? 0
      let sessionProb = student.persona === 'ACHIEVER' ? 0.85 : student.persona === 'STRUGGLER' ? 0.4 : 0.6
      if (currentStreak >= 3) sessionProb = clamp(sessionProb + 0.15, 0, 0.95)
      
      if (Math.random() > sessionProb) {
        studentStreaks.set(student.id, 0)
        continue
      }

      interactionHistory.push({ userId: student.id, date: currentDate })
      studentStreaks.set(student.id, currentStreak + 1)
      const sessionStartTime = addMinutes(currentDate, 480 + Math.random() * 600)

      // --- SEQUENTIAL UNLOCKING LOGIC ---
      const studentMasteries = concepts.map(c => {
        const key = `${student.id}:${c.id}`
        const state = masteryMap.get(key)
        const daysElapsed = state ? differenceInDays(currentDate, state.lastAssessedAt) : 0
        const effective = state ? computeEffectiveMastery(state.pL, c.decayLambda, daysElapsed) : 0
        return { concept: c, state, effective }
      })

      // Unlocked = No prereqs OR all prereqs have mastery > 0.7
      const unlockedConcepts = studentMasteries.filter(sm => {
        const prereqs = sm.concept.prerequisiteEdges
        if (prereqs.length === 0) return true
        return prereqs.every(edge => {
          const prereqState = masteryMap.get(`${student.id}:${edge.prerequisiteConceptId}`)
          return (prereqState?.pL ?? 0) > 0.7
        })
      })

      // Categorize session priorities
      const needsReview = unlockedConcepts.filter(uc => uc.state && uc.state.pL > 0.8 && uc.effective < 0.8)
      const inProgress = unlockedConcepts.filter(uc => uc.state && uc.state.pL >= 0.2 && uc.state.pL < 0.9)
      const fresh = unlockedConcepts.filter(uc => !uc.state)

      // Pick up to 2 active concepts for this session
      const activeChoices = []
      
      // 1. Always prioritize Review
      if (needsReview.length > 0) activeChoices.push(needsReview[0].concept)
      
      // 2. Then In-Progress
      if (activeChoices.length < 2 && inProgress.length > 0) {
        activeChoices.push(inProgress[Math.floor(Math.random() * inProgress.length)].concept)
      }
      
      // 3. Then Fresh
      if (activeChoices.length < 2 && fresh.length > 0) {
        activeChoices.push(fresh[0].concept) // Take the first available fresh one to maintain order
      }

      for (const concept of activeChoices) {
        if (!concept || concept.questions.length === 0) continue
        
        const bktParams = getConceptBktParams(concept)
        const key = `${student.id}:${concept.id}`
        let state = masteryMap.get(key) ?? { pL: bktParams.pLo, lastAssessedAt: currentDate, totalXP: 0, consecutiveFails: 0 }

        // Retention Decay
        const daysSinceLast = differenceInDays(currentDate, state.lastAssessedAt)
        state.pL = computeEffectiveMastery(state.pL, concept.decayLambda, daysSinceLast)

        // Decide Pathway: Achievers challenge fresh concepts more often
        const isReviewSession = needsReview.some(nr => nr.concept.id === concept.id)
        const challengeProb = student.persona === 'ACHIEVER' ? 0.4 : student.persona === 'SPEEDSTER' ? 0.6 : 0.1
        const isChallengePath = !isReviewSession && state.pL < 0.7 && Math.random() < challengeProb

        if (isChallengePath) {
          const examTime = addMinutes(sessionStartTime, 20)
          const score = clamp(state.pL + (Math.random() * 0.4 - 0.1))
          const isPassed = score > 0.85
          
          await prisma.interactionLog.create({ data: { userId: student.id, conceptId: concept.id, activityType: "EXAM_RESPONSE", isCorrect: isPassed, createdAt: examTime }})
          await prisma.examAttempt.create({ data: { userId: student.id, conceptId: concept.id, pathway: "CHALLENGE", questionIds: concept.questions.slice(0, 5).map(q => q.id), score, isPassed, questionCount: 5, correctCount: Math.floor(score * 5), createdAt: examTime, completedAt: examTime }})
          
          state.totalXP += isPassed ? XP_MAP.EXAM_PASS : XP_MAP.EXAM_FAIL
          state.pL = isPassed ? clamp(0.95 + Math.random() * 0.04) : clamp(state.pL + 0.05)
          state.lastAssessedAt = examTime
        } else {
          // Instructional Path
          const readTime = addMinutes(sessionStartTime, 5)
          await prisma.interactionLog.create({ data: { userId: student.id, conceptId: concept.id, activityType: isReviewSession ? "CONTENT_REVIEW" : "CONTENT_READ", createdAt: readTime }})
          state.totalXP += XP_MAP.CONTENT_READ
          state.pL = clamp(state.pL + 0.03)

          // Simulated AI Help
          if (Math.random() < 0.2) {
             const aiTime = addMinutes(readTime, 10)
             const session = await prisma.tutorSession.create({ data: { userId: student.id, conceptId: concept.id, createdAt: aiTime }})
             await prisma.tutorMessage.create({ data: { sessionId: session.id, role: "STUDENT", content: `Can you explain the intuition behind ${concept.title}?`, timestamp: aiTime }})
             await prisma.tutorMessage.create({ data: { sessionId: session.id, role: "AI", content: "Focus on how the components relate to each other.", timestamp: addMinutes(aiTime, 1) }})
             await prisma.interactionLog.create({ data: { userId: student.id, conceptId: concept.id, activityType: "SOCRATIC_HINT_USED", createdAt: aiTime }})
             state.totalXP += XP_MAP.SOCRATIC_HINT_USED
          }

          // Practice Loop
          const pCount = isReviewSession ? 3 : 5
          for (let p = 0; p < pCount; p++) {
            const intTime = addMinutes(readTime, 15 + p * 5)
            const question = concept.questions[Math.floor(Math.random() * concept.questions.length)]
            let pCorr = state.pL * (1 - bktParams.pS) + (1 - state.pL) * bktParams.pG
            if (student.persona === 'ACHIEVER') pCorr = clamp(pCorr + 0.2)
            const isCorr = Math.random() < pCorr
            
            await prisma.interactionLog.create({ data: { userId: student.id, conceptId: concept.id, questionId: question.id, activityType: "PRACTICE_QUESTION", isCorrect: isCorr, responseTimeMs: 10000, createdAt: intTime }})
            await prisma.practiceAttempt.create({ data: { userId: student.id, conceptId: concept.id, questionId: question.id, isCorrect: isCorr, selectedAnswer: isCorr ? question.correctAnswer : "Wrong", createdAt: intTime, completedAt: intTime }})
            
            const update = applyObservation({ prior: state.pL, isCorrect: isCorr, params: bktParams })
            state.pL = update.posteriorNext
            state.lastAssessedAt = intTime
            state.totalXP += isCorr ? XP_MAP.PRACTICE_CORRECT : XP_MAP.PRACTICE_INCORRECT
            state.consecutiveFails = isCorr ? 0 : state.consecutiveFails + 1
          }

          // Trigger Exam if mastery is sufficient
          if (state.pL > 0.86) {
             const exTime = addMinutes(sessionStartTime, 60)
             const isPass = Math.random() < 0.9
             await prisma.interactionLog.create({ data: { userId: student.id, conceptId: concept.id, activityType: "EXAM_RESPONSE", isCorrect: isPass, createdAt: exTime }})
             await prisma.examAttempt.create({ data: { userId: student.id, conceptId: concept.id, pathway: "LEARN", questionIds: [], score: isPass ? 0.9 : 0.4, isPassed: isPass, questionCount: 10, correctCount: isPass ? 9 : 4, createdAt: exTime, completedAt: exTime }})
             state.totalXP += isPass ? XP_MAP.EXAM_PASS : XP_MAP.EXAM_FAIL
             if (isPass) state.pL = 0.99
             state.lastAssessedAt = exTime
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
    const concept = conceptMapById.get(conceptId)
    const daysSinceLast = differenceInDays(now, state.lastAssessedAt)
    const effective = computeEffectiveMastery(state.pL, concept?.decayLambda ?? 0.05, daysSinceLast)

    let status = "IN_PROGRESS"
    if (state.pL >= 0.9) status = effective < 0.8 ? "REVIEW_NEEDED" : "MASTERED"
    else if (state.pL < 0.2) status = "FRINGE"
    if (state.consecutiveFails >= 4) status = "REVIEW_NEEDED"

    await prisma.userMastery.upsert({
      where: { userId_conceptId: { userId, conceptId } },
      update: { pMastery: state.pL, status, lastAssessedAt: state.lastAssessedAt, nextReviewAt: status === "MASTERED" ? addDays(state.lastAssessedAt, 7) : null, consecutiveFails: state.consecutiveFails },
      create: { userId, conceptId, pMastery: state.pL, status, lastAssessedAt: state.lastAssessedAt, unlockedAt: startDate, nextReviewAt: status === "MASTERED" ? addDays(state.lastAssessedAt, 7) : null, consecutiveFails: state.consecutiveFails }
    })
  }

  // 5. FINALIZE PROFILES
  for (const student of students) {
    const studentInteractions = interactionHistory.filter(h => h.userId === student.id)
    const studentMasteries = Array.from(masteryMap.entries()).filter(([k]) => k.startsWith(student.id)).map(([, v]) => v)
    const totalXP = studentMasteries.reduce((sum, m) => sum + m.totalXP, 0)
    
    let streak = 0
    let checkDate = startOfDay(now)
    while (studentInteractions.some(h => isSameDay(h.date, checkDate))) {
      streak++
      checkDate = subDays(checkDate, 1)
    }

    await prisma.userProfile.update({
      where: { userId: student.id },
      data: { totalXP, currentLevel: Math.floor(Math.sqrt(totalXP / 100)) + 1, dailyStreak: streak, lastLogin: now, overallProgress: clamp((studentMasteries.filter(m => m.pL > 0.9).length / concepts.length) * 100, 0, 100) }
    })
  }
}
