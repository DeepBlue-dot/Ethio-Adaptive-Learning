import { describe, expect, it, vi, beforeEach } from "vitest"
import { buildRagPrompt } from "@/lib/ai/tutoring/prompts"
import { validateSocraticResponse } from "@/lib/ai/tutoring/guardrails"

// Mock Prisma
const mocks = vi.hoisted(() => ({
  tutorSessionFindFirst: vi.fn(),
  tutorSessionCreate: vi.fn(),
  tutorMessageCreate: vi.fn(),
  conceptFindFirst: vi.fn(),
  ollamaChat: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tutorSession: {
      findFirst: mocks.tutorSessionFindFirst,
      create: mocks.tutorSessionCreate,
    },
    tutorMessage: {
      create: mocks.tutorMessageCreate,
    },
    concept: {
      findFirst: mocks.conceptFindFirst,
    },
  },
}))

vi.mock("@/lib/ai/clients/ollama", () => ({
  chat: mocks.ollamaChat,
  chatStream: vi.fn(),
}))

// Import engine after mocks
import { getSocraticGuidance } from "@/lib/ai/tutoring/socratic-engine"

describe("Socratic AI Tutor Subsystem", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Prompt Engineering", () => {
    it("builds a correct RAG prompt with empty context and history", () => {
      const prompt = buildRagPrompt("How do I solve X?", [], [])
      expect(prompt).toContain("No specific curriculum chunks found")
      expect(prompt).toContain("No previous messages in this session")
      expect(prompt).toContain("How do I solve X?")
    })

    it("injects curriculum context and history into the prompt", () => {
      const context = ["Concept: Limits", "Chunk 1: Definition of a limit"]
      const history = ["Student: Hello", "Tutor: Welcome"]
      const prompt = buildRagPrompt("What is a limit?", context, history)
      
      expect(prompt).toContain("Concept: Limits")
      expect(prompt).toContain("Chunk 1: Definition of a limit")
      expect(prompt).toContain("Student: Hello")
      expect(prompt).toContain("Tutor: Welcome")
    })
  })

  describe("Socratic Guardrails", () => {
    it("permits valid Socratic questions", async () => {
      const response = "That's a great start! What do you think would happen if we increased the value of n?"
      const result = await validateSocraticResponse(response)
      expect(result.isFlagged).toBe(false)
    })

    it("flags direct answer leaks", async () => {
      const responses = [
        "The answer is 42.",
        "The result is $x = 5$.",
        "It is equal to the square root of 2.",
        "The correct answer is Option B."
      ]

      for (const res of responses) {
        const result = await validateSocraticResponse(res)
        expect(result.isFlagged).toBe(true)
        expect(result.reason).toContain("Potential direct answer detected")
      }
    })

    it("flags responses that are too short", async () => {
      const result = await validateSocraticResponse("Yes.")
      expect(result.isFlagged).toBe(true)
      expect(result.reason).toBe("Response is too short")
    })
  })

  describe("Socratic Engine Orchestration", () => {
    it("creates a new session and logs both messages when no session exists", async () => {
      // 1. Setup mocks
      mocks.tutorSessionFindFirst.mockResolvedValue(null) // No existing session
      mocks.tutorSessionCreate.mockResolvedValue({ id: "new_session_id", messages: [] })
      mocks.conceptFindFirst.mockResolvedValue({ 
        title: "Test Concept", 
        description: "Test Desc",
        chunks: [] 
      })
      mocks.ollamaChat.mockResolvedValue("Have you tried looking at the denominator?")

      // 2. Execute
      const response = await getSocraticGuidance("user_123", "concept_456", "Why is this zero?")

      // 3. Verify
      expect(mocks.tutorSessionCreate).toHaveBeenCalled()
      expect(mocks.tutorMessageCreate).toHaveBeenCalledTimes(2) // Student question + AI response
      
      // Verify first message was the student question
      expect(mocks.tutorMessageCreate).toHaveBeenNthCalledWith(1, {
        data: {
          sessionId: "new_session_id",
          role: "STUDENT",
          content: "Why is this zero?"
        }
      })

      // Verify second message was the AI response
      expect(mocks.tutorMessageCreate).toHaveBeenNthCalledWith(2, expect.objectContaining({
        data: expect.objectContaining({
          role: "AI",
          content: "Have you tried looking at the denominator?",
          isFlagged: false
        })
      }))

      expect(response.content).toBe("Have you tried looking at the denominator?")
    })

    it("flags the response in the database if guardrails fail", async () => {
      mocks.tutorSessionFindFirst.mockResolvedValue({ id: "existing_session", messages: [] })
      mocks.conceptFindFirst.mockResolvedValue({ title: "X", chunks: [] })
      mocks.ollamaChat.mockResolvedValue("The answer is 100.") // Direct leak

      const response = await getSocraticGuidance("u", "c", "Q")

      expect(response.isFlagged).toBe(true)
      expect(mocks.tutorMessageCreate).toHaveBeenLastCalledWith({
        data: expect.objectContaining({
          role: "AI",
          isFlagged: true,
          flagReason: expect.stringContaining("Potential direct answer")
        })
      })
    })
  })
})
