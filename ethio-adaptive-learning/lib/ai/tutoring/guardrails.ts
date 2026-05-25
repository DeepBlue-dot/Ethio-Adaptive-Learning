/**
 * Validates that the AI response adheres to Socratic boundaries
 */
export async function validateSocraticResponse(response: string): Promise<{
  isFlagged: boolean
  reason?: string
}> {
  // Heuristic: Check if the response contains direct answers like "The answer is"
  const bannedPhrases = ["the answer is", "the result is", "is equal to", "correct answer is"]
  
  for (const phrase of bannedPhrases) {
    if (response.toLowerCase().includes(phrase)) {
      return {
        isFlagged: true,
        reason: `Potential direct answer detected: "${phrase}"`
      }
    }
  }

  // Check if response is too short
  if (response.length < 10) {
    return {
      isFlagged: true,
      reason: "Response is too short"
    }
  }

  return { isFlagged: false }
}
