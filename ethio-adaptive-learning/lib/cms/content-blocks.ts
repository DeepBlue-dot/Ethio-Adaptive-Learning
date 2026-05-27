import { z } from "zod"

import { optionalTrimmedStringSchema, requiredTextSchema } from "@/lib/cms/schemas/shared"

const contentBlockBaseSchema = z.object({
  id: optionalTrimmedStringSchema,
})

const paragraphBlockSchema = contentBlockBaseSchema.extend({
  type: z.literal("paragraph"),
  title: optionalTrimmedStringSchema,
  text: requiredTextSchema("Paragraph text"),
})

const headingBlockSchema = contentBlockBaseSchema.extend({
  type: z.literal("heading"),
  level: z.coerce.number().int().min(2).max(4).default(2),
  text: requiredTextSchema("Heading text"),
})

const imageBlockSchema = contentBlockBaseSchema.extend({
  type: z.literal("image"),
  assetId: requiredTextSchema("Image asset"),
  alt: optionalTrimmedStringSchema,
  caption: optionalTrimmedStringSchema,
})

const videoBlockSchema = contentBlockBaseSchema.extend({
  type: z.literal("video"),
  url: requiredTextSchema("YouTube URL"),
  videoId: optionalTrimmedStringSchema.default(null),
  caption: optionalTrimmedStringSchema,
})

const embedBlockSchema = contentBlockBaseSchema.extend({
  type: z.literal("embed"),
  url: requiredTextSchema("Embed URL"),
  title: optionalTrimmedStringSchema,
})

const quizBlockSchema = contentBlockBaseSchema.extend({
  type: z.literal("quiz"),
  questionId: requiredTextSchema("Question"),
})

const codeBlockSchema = contentBlockBaseSchema.extend({
  type: z.literal("code"),
  language: optionalTrimmedStringSchema,
  code: requiredTextSchema("Code"),
})

const snippetBlockSchema = contentBlockBaseSchema.extend({
  type: z.literal("snippet"),
  snippetId: requiredTextSchema("Content snippet"),
})

const phetBlockSchema = contentBlockBaseSchema.extend({
  type: z.literal("phet"),
  assetId: requiredTextSchema("PhET Simulation"),
  title: optionalTrimmedStringSchema,
})

export const contentBlockSchema = z
  .discriminatedUnion("type", [
    paragraphBlockSchema,
    headingBlockSchema,
    imageBlockSchema,
    videoBlockSchema,
    embedBlockSchema,
    quizBlockSchema,
    codeBlockSchema,
    snippetBlockSchema,
    phetBlockSchema,
  ])
  .transform((block) => ({
    ...block,
    id: block.id || createContentBlockId(),
  }))

export const contentBlocksSchema = z
  .union([z.string(), z.array(contentBlockSchema), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (typeof value !== "string") {
      return Array.isArray(value) ? value : []
    }

    if (!value.trim()) {
      return []
    }

    try {
      const parsed = JSON.parse(value)
      const result = z.array(contentBlockSchema).safeParse(parsed)

      if (result.success) {
        return result.data
      }

      ctx.addIssue({
        code: "custom",
        message: "Content blocks contain invalid fields.",
      })

      return z.NEVER
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Content blocks payload is invalid.",
      })
      return z.NEVER
    }
  })

export type CmsContentBlock = z.output<typeof contentBlockSchema>

export type ContentBlockReferences = {
  assetIds: string[]
  questionIds: string[]
  snippetIds: string[]
}

export function getContentBlockReferences(blocks: CmsContentBlock[]): ContentBlockReferences {
  const assetIds = new Set<string>()
  const questionIds = new Set<string>()
  const snippetIds = new Set<string>()

  for (const block of blocks) {
    if (block.type === "image" || block.type === "phet") {
      assetIds.add(block.assetId)
    }

    if (block.type === "quiz") {
      questionIds.add(block.questionId)
    }

    if (block.type === "snippet") {
      snippetIds.add(block.snippetId)
    }
  }

  return {
    assetIds: [...assetIds],
    questionIds: [...questionIds],
    snippetIds: [...snippetIds],
  }
}

export function normalizeContentBlocks(value: unknown): CmsContentBlock[] {
  const parsed = contentBlocksSchema.safeParse(value)
  return parsed.success ? parsed.data : []
}

export function buildLegacyContentBlocks(args: {
  contentBody?: string | null
  chunks?: Array<{
    id: string
    title: string
    bodyMd: string
  }>
  workedExamples?: Array<{
    id: string
    title: string
    problemMd: string
    solutionMd: string
  }>
}) {
  const blocks: CmsContentBlock[] = []

  if (args.contentBody?.trim()) {
    blocks.push({
      id: "legacy-overview",
      type: "paragraph",
      title: null,
      text: args.contentBody.trim(),
    })
  }

  for (const chunk of args.chunks ?? []) {
    blocks.push({
      id: chunk.id,
      type: "paragraph",
      title: chunk.title,
      text: chunk.bodyMd,
    })
  }

  for (const example of args.workedExamples ?? []) {
    blocks.push({
      id: example.id,
      type: "paragraph",
      title: `Example: ${example.title}`,
      text: `Problem\n\n${example.problemMd}\n\nSolution\n\n${example.solutionMd}`,
    })
  }

  return blocks
}

function createContentBlockId() {
  return globalThis.crypto?.randomUUID?.() ?? `block-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
