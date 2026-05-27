import { DifficultyTier, QuestionUsage } from "@prisma/client"
import { z } from "zod"

import { optionalTrimmedStringSchema, requiredIdSchema, requiredTextSchema } from "@/lib/cms/schemas/shared"
import type { CmsContentType } from "@/lib/cms/types"

const distractorsSchema = z
  .union([z.string(), z.array(z.string()), z.null(), z.undefined()])
  .transform((value) => {
    if (Array.isArray(value)) {
      return value.map((line) => line.trim()).filter(Boolean)
    }

    return typeof value === "string"
      ? value
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
      : null
  })

export const questionSchema = z.object({
  conceptId: requiredIdSchema("Concept"),
  usage: z.nativeEnum(QuestionUsage, {
    message: "Question usage is invalid.",
  }),
  difficulty: z.nativeEnum(DifficultyTier, {
    message: "Difficulty tier is invalid.",
  }),
  content: requiredTextSchema("Question prompt"),
  correctAnswer: requiredTextSchema("Correct answer"),
  distractors: distractorsSchema,
  hintText: optionalTrimmedStringSchema,
  explanation: optionalTrimmedStringSchema,
  authorId: optionalTrimmedStringSchema,
  slug: optionalTrimmedStringSchema,
})

export type QuestionCmsInput = z.output<typeof questionSchema>

export const questionDefinition = {
  key: "question",
  aliases: ["questions"],
  label: "Question",
  pluralLabel: "Questions",
  description: "Assessment items linked to curriculum concepts.",
  schema: questionSchema,
  defaultValues: {
    usage: "PRACTICE",
    difficulty: "MEDIUM",
  },
  fields: [
    {
      name: "conceptId",
      label: "Concept",
      type: "reference",
      referenceTo: "concept",
      required: true,
      section: "Hierarchy",
    },
    {
      name: "content",
      label: "Question prompt",
      type: "markdown",
      required: true,
      section: "Prompt",
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      section: "Prompt",
    },
    {
      name: "usage",
      label: "Usage",
      type: "select",
      required: true,
      section: "Assessment metadata",
      options: Object.values(QuestionUsage).map((usage) => ({
        label: usage,
        value: usage,
      })),
    },
    {
      name: "difficulty",
      label: "Difficulty",
      type: "select",
      required: true,
      section: "Assessment metadata",
      options: Object.values(DifficultyTier).map((difficulty) => ({
        label: difficulty,
        value: difficulty,
      })),
    },
    {
      name: "correctAnswer",
      label: "Correct answer",
      type: "text",
      required: true,
      section: "Answers",
    },
    {
      name: "distractors",
      label: "Distractors",
      type: "textarea",
      description: "One distractor per line.",
      section: "Answers",
    },
    {
      name: "hintText",
      label: "Hint",
      type: "textarea",
      section: "Teaching support",
    },
    {
      name: "explanation",
      label: "Explanation",
      type: "markdown",
      section: "Teaching support",
    },
  ],
  listFields: [
    {
      name: "conceptLabel",
      label: "Concept",
    },
    {
      name: "usage",
      label: "Usage",
    },
    {
      name: "difficulty",
      label: "Difficulty",
    },
  ],
  getTitle: (entity) => String(entity.data.content ?? entity.title),
  getSubtitle: (entity) => String(entity.data.conceptLabel ?? ""),
  getStatus: (entity) => {
    if (entity.lifecycle?.hasDraft && entity.lifecycle.status === "PUBLISHED") {
      return "PUBLISHED + DRAFT"
    }

    return entity.lifecycle?.status ?? null
  },
  getRevalidationPaths: ({ id, result }) => [
    "/admin/dashboard",
    "/admin/studio",
    "/admin/studio/question",
    "/concepts",
    ...(id ? [`/admin/studio/question/${id}`] : []),
    ...(typeof result?.data.conceptId === "string" ? [`/student/concept/${result.data.conceptId}/learn`] : []),
  ],
} satisfies CmsContentType<QuestionCmsInput>
