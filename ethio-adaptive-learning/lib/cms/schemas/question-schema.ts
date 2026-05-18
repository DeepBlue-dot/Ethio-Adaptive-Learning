import { DifficultyTier, QuestionUsage } from "@prisma/client"
import { z } from "zod"

import { optionalTrimmedStringSchema, parseCmsInput, requiredIdSchema, requiredTextSchema } from "@/lib/cms/schemas/shared"
import type { CmsValidationResult } from "@/lib/cms/types"
import type { CreateQuestionInput } from "@/lib/curriculum/types"

const distractorsSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) =>
    typeof value === "string"
      ? value
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
      : null
  )

const questionUsageSchema = z.nativeEnum(QuestionUsage, {
  message: "Question usage is invalid.",
})

const difficultyTierSchema = z.nativeEnum(DifficultyTier, {
  message: "Difficulty tier is invalid.",
})

export const questionFormSchema = z.object({
  conceptId: requiredIdSchema("Concept"),
  usage: questionUsageSchema,
  difficulty: difficultyTierSchema,
  content: requiredTextSchema("Question prompt"),
  correctAnswer: requiredTextSchema("Correct answer"),
  distractors: distractorsSchema,
  hintText: optionalTrimmedStringSchema,
  explanation: optionalTrimmedStringSchema,
  authorId: optionalTrimmedStringSchema,
  slug: optionalTrimmedStringSchema,
})

export function parseQuestionFormInput(input: unknown): CmsValidationResult<CreateQuestionInput> {
  return parseCmsInput(questionFormSchema, input)
}
