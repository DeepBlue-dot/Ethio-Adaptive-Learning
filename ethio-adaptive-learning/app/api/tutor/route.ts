import { NextResponse } from "next/server"
import { getSocraticGuidance } from "@/lib/ai/tutoring/socratic-engine"
import { requireAuth } from "@/lib/auth"

/**
 * AI Socratic Tutor API Endpoint
 * Handles student questions by providing RAG-enhanced Socratic guidance.
 */
export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const { conceptId, question } = body

    if (!conceptId || !question) {
      return NextResponse.json(
        { error: "conceptId and question are required" }, 
        { status: 400 }
      )
    }

    console.info(`[Tutor API] Request from user ${session.user.id} for concept ${conceptId}`)

    const response = await getSocraticGuidance(
      session.user.id, 
      conceptId, 
      question
    )

    return NextResponse.json(response)
  } catch (error) {
    console.error("[Tutor API Error]:", error)
    
    // Check for specific error types if needed (e.g., Ollama offline)
    if (error instanceof Error && error.message.includes("fetch failed")) {
      return NextResponse.json(
        { error: "AI Service is currently offline. Please try again later." }, 
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: "An internal error occurred while processing your request." }, 
      { status: 500 }
    )
  }
}