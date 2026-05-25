import { prisma } from "@/lib/prisma"
import { chat, chatStream } from "../clients/ollama"
import { retrieveCurriculumContext } from "../rag/retrieval"
import { SOCRATIC_SYSTEM_PROMPT, buildRagPrompt } from "./prompts"
import { validateSocraticResponse } from "./guardrails"
import { AiMessage, TutorResponse } from "../types"

/**
 * Orchestrates the Socratic tutoring interaction
 */
export async function getSocraticGuidance(
  userId: string,
  conceptId: string,
  studentQuestion: string
): Promise<TutorResponse> {
  // 1. Get or create session
  // Real implementation: Find latest session for this user/concept
  let activeSession = await prisma.tutorSession.findFirst({
    where: { userId, conceptId },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { timestamp: "asc" }, take: 10 } }
  })

  if (!activeSession) {
    activeSession = await prisma.tutorSession.create({
      data: { userId, conceptId },
      include: { messages: true }
    })
  }

  // 2. Store student question
  await prisma.tutorMessage.create({
    data: {
      sessionId: activeSession.id,
      role: "STUDENT",
      content: studentQuestion
    }
  })

  // 3. RAG: Retrieve context
  const contextResults = await retrieveCurriculumContext(studentQuestion)
  const contextTexts = contextResults.map(r => r.text)

  // 4. Format history
  const historyTexts = activeSession.messages.map(
    m => `${m.role === "STUDENT" ? "Student" : "Tutor"}: ${m.content}`
  )

  // 5. Build Final Prompt
  const userPrompt = buildRagPrompt(studentQuestion, contextTexts, historyTexts)
  
  const messages: AiMessage[] = [
    { role: "system", content: SOCRATIC_SYSTEM_PROMPT },
    { role: "user", content: userPrompt }
  ]

  // 6. Get Response from Gemma
  const aiContent = await chat(messages)

  // 7. Guardrail Validation
  const validation = await validateSocraticResponse(aiContent)

  // 8. Store AI response
  await prisma.tutorMessage.create({
    data: {
      sessionId: activeSession.id,
      role: "AI",
      content: aiContent,
      isFlagged: validation.isFlagged,
      flagReason: validation.reason,
      retrievedContext: contextResults.map(r => r.id) as never // Prisma JSON field
    }
  })

  return {
    content: aiContent,
    retrievedContextIds: contextResults.map(r => r.id),
    isFlagged: validation.isFlagged,
    flagReason: validation.reason
  }
}

/**
 * Version of the engine that returns a stream for the Next.js API.
 * It also handles session setup and student question logging.
 */
export async function getSocraticGuidanceStream(
  userId: string,
  conceptId: string,
  studentQuestion: string
): Promise<ReadableStream> {
  // 1. Session Setup (Same as static version)
  let activeSession = await prisma.tutorSession.findFirst({
    where: { userId, conceptId },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { timestamp: "asc" }, take: 10 } }
  })

  if (!activeSession) {
    activeSession = await prisma.tutorSession.create({
      data: { userId, conceptId },
      include: { messages: true }
    })
  }

  await prisma.tutorMessage.create({
    data: {
      sessionId: activeSession.id,
      role: "STUDENT",
      content: studentQuestion
    }
  })

  // 2. RAG & Prompt Construction
  const contextResults = await retrieveCurriculumContext(studentQuestion)
  const contextTexts = contextResults.map(r => r.text)
  const historyTexts = activeSession.messages.map(
    m => `${m.role === "STUDENT" ? "Student" : "Tutor"}: ${m.content}`
  )

  const userPrompt = buildRagPrompt(studentQuestion, contextTexts, historyTexts)
  const messages: AiMessage[] = [
    { role: "system", content: SOCRATIC_SYSTEM_PROMPT },
    { role: "user", content: userPrompt }
  ]

  // 3. Initiate Stream
  return chatStream(messages)
}
