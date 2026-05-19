import { chunkDefinition } from "@/lib/cms/definitions/chunk"
import { conceptDefinition } from "@/lib/cms/definitions/concept"
import { courseDefinition } from "@/lib/cms/definitions/course"
import { questionDefinition } from "@/lib/cms/definitions/question"
import { unitDefinition } from "@/lib/cms/definitions/unit"
import { workedExampleDefinition } from "@/lib/cms/definitions/worked-example"

export const cmsContentDefinitions = [
  courseDefinition,
  unitDefinition,
  conceptDefinition,
  questionDefinition,
  chunkDefinition,
  workedExampleDefinition,
] as const

export {
  chunkDefinition,
  conceptDefinition,
  courseDefinition,
  questionDefinition,
  unitDefinition,
  workedExampleDefinition,
}
