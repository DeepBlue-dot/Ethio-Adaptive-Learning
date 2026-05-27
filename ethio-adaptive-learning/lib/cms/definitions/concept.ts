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
      name: "unitId",
      label: "Unit",
      type: "reference",
      referenceTo: "unit",
      required: true,
      section: "Hierarchy",
    },
    {
      name: "title",
      label: "Concept title",
      type: "text",
      required: true,
      placeholder: "Limits",
      section: "Identity",
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      section: "Identity",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      section: "Content",
    },
    {
      name: "contentBlocks",
      label: "Lesson content",
      type: "content-blocks",
      section: "Content",
    },
    {
      name: "prerequisiteConceptIds",
      label: "Prerequisites",
      type: "multi-reference",
      referenceTo: "concept",
      section: "Graph",
    },
    {
      name: "unlockThreshold",
      label: "Unlock threshold",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
      adminOnly: true,
    },
    {
      name: "pLo",
      label: "P(L0)",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
      adminOnly: true,
    },
    {
      name: "pT",
      label: "P(T)",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
      adminOnly: true,
    },
    {
      name: "pG",
      label: "P(G)",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
      adminOnly: true,
    },
    {
      name: "pS",
      label: "P(S)",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
      adminOnly: true,
    },
    {
      name: "decayLambda",
      label: "Decay lambda",
      type: "probability",
      required: true,
      section: "Adaptive parameters",
      adminOnly: true,
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
