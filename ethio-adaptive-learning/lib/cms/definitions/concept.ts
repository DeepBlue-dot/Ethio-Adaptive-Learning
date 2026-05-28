import { z } from "zod"

import { contentBlocksSchema } from "@/lib/cms/content-blocks"
import {
  optionalTrimmedStringSchema,
  parseCmsInput,
  probabilitySchema,
  requiredIdSchema,
  requiredTextSchema,
  trimmedStringSchema,
} from "@/lib/cms/schemas/shared"
import type { CmsContentType, CmsValidationResult } from "@/lib/cms/types"
import type { CreateConceptInput } from "@/lib/curriculum/types"

export const conceptSchema = z.object({
  unitId: requiredIdSchema("Unit"),
  title: requiredTextSchema("Concept title"),
  slug: optionalTrimmedStringSchema,
  description: optionalTrimmedStringSchema,
  contentBlocks: contentBlocksSchema.default([]),
  unlockThreshold: probabilitySchema("Unlock threshold").default(0.9),
  pLo: probabilitySchema("P(L0)").default(0.15),
  pT: probabilitySchema("P(T)").default(0.1),
  pG: probabilitySchema("P(G)").default(0.2),
  pS: probabilitySchema("P(S)").default(0.1),
  decayLambda: probabilitySchema("Decay lambda").default(0.01),
  prerequisiteConceptIds: z.array(trimmedStringSchema).default([]),
  authorId: optionalTrimmedStringSchema,
})

export type ConceptCmsInput = z.output<typeof conceptSchema>

export const conceptDefinition = {
  key: "concept",
  aliases: ["concepts"],
  label: "Concept",
  pluralLabel: "Concepts",
  description: "Adaptive knowledge nodes with prerequisite graph and rich block-based lesson content.",
  schema: conceptSchema,
  defaultValues: {
    unlockThreshold: 0.9,
    pLo: 0.15,
    pT: 0.1,
    pG: 0.2,
    pS: 0.1,
    decayLambda: 0.01,
    prerequisiteConceptIds: [],
    contentBlocks: [],
  },
  fields: [
    {
      name: "title",
      label: "Concept title",
      type: "text",
      required: true,
      placeholder: "e.g., Limits and Continuity",
      section: "Identification",
      description: "The primary name of the knowledge node.",
    },
    {
      name: "slug",
      label: "URL Slug",
      type: "text",
      section: "Identification",
      description: "Custom URL identifier. Leave blank to auto-generate.",
    },
    {
      name: "unitId",
      label: "Parent Unit",
      type: "reference",
      referenceTo: "unit",
      required: true,
      section: "Identification",
      description: "Assign this concept to a curriculum container.",
    },
    {
      name: "description",
      label: "Concept summary",
      type: "textarea",
      section: "Pedagogy",
      description: "A brief high-level overview for students.",
    },
    {
      name: "prerequisiteConceptIds",
      label: "Prerequisites",
      type: "multi-reference",
      referenceTo: "concept",
      section: "Pedagogy",
      description: "Select knowledge nodes that must be mastered before starting this concept.",
    },
    {
      name: "contentBlocks",
      label: "Lesson content",
      type: "content-blocks",
      section: "Content",
      description: "Build the instructional narrative using interactive blocks.",
    },
    {
      name: "unlockThreshold",
      label: "Unlock threshold",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
      adminOnly: true,
      description: "Required mastery probability to mark as completed.",
    },
    {
      name: "pLo",
      label: "P(L0)",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
      adminOnly: true,
      description: "Initial probability that a student knows the concept before any interaction.",
    },
    {
      name: "pT",
      label: "P(T)",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
      adminOnly: true,
      description: "Probability that the student will transition to the learned state after a practice opportunity.",
    },
    {
      name: "pG",
      label: "P(G)",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
      adminOnly: true,
      description: "Probability that the student will guess the correct answer despite not knowing the concept.",
    },
    {
      name: "pS",
      label: "P(S)",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
      adminOnly: true,
      description: "Probability that the student will make a slip and answer incorrectly despite knowing the concept.",
    },
    {
      name: "decayLambda",
      label: "Decay lambda",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
      adminOnly: true,
      description: "Rate at which mastery probability decays over time (forgetting curve).",
    },
  ],
  listFields: [
    {
      name: "courseLabel",
      label: "Course",
    },
    {
      name: "unitLabel",
      label: "Unit",
    },
    {
      name: "questionCount",
      label: "Questions",
    },
  ],
  getTitle: (entity) => String(entity.data.title ?? entity.title),
  getSubtitle: (entity) => `${String(entity.data.courseLabel ?? "")} / ${String(entity.data.unitLabel ?? "")}`,
  getStatus: (entity) => {
    if (entity.lifecycle?.hasDraft && entity.lifecycle.status === "PUBLISHED") {
      return "PUBLISHED + DRAFT"
    }

    return entity.lifecycle?.status ?? null
  },
  getRevalidationPaths: ({ id }) => [
    "/admin/dashboard",
    "/admin/studio",
    "/admin/studio/concept",
    "/admin/studio/question",
    "/concepts",
    ...(id ? [`/admin/studio/concept/${id}`, `/student/concept/${id}`, `/student/concept/${id}/learn`] : []),
  ],
} satisfies CmsContentType<ConceptCmsInput>

export function parseConceptCmsInput(input: unknown): CmsValidationResult<ConceptCmsInput> {
  return parseCmsInput(conceptSchema, input)
}

export function conceptCmsInputToCreateInput(input: ConceptCmsInput): CreateConceptInput {
  return {
    unitId: input.unitId,
    title: input.title,
    slug: input.slug,
    description: input.description,
    contentBlocks: input.contentBlocks,
    unlockThreshold: input.unlockThreshold,
    pLo: input.pLo,
    pT: input.pT,
    pG: input.pG,
    pS: input.pS,
    decayLambda: input.decayLambda,
  }
}
