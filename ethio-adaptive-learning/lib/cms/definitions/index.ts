import { chunkDefinition } from "@/lib/cms/definitions/chunk"
import { contentSnippetDefinition } from "@/lib/cms/definitions/content-snippet"
import { conceptDefinition } from "@/lib/cms/definitions/concept"
import { courseDefinition } from "@/lib/cms/definitions/course"
import { mediaAssetDefinition } from "@/lib/cms/definitions/media-asset"
import { questionDefinition } from "@/lib/cms/definitions/question"
import { unitDefinition } from "@/lib/cms/definitions/unit"
import { workedExampleDefinition } from "@/lib/cms/definitions/worked-example"

export const cmsContentDefinitions = [
  courseDefinition,
  unitDefinition,
  conceptDefinition,
  chunkDefinition,
  workedExampleDefinition,
  questionDefinition,
  mediaAssetDefinition,
  contentSnippetDefinition,
] as const

export {
  chunkDefinition,
  contentSnippetDefinition,
  conceptDefinition,
  courseDefinition,
  mediaAssetDefinition,
  questionDefinition,
  unitDefinition,
  workedExampleDefinition,
}
