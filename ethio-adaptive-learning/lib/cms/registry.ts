import { cmsContentDefinitions } from "@/lib/cms/definitions"
import type { CmsContentType, CmsContentTypeKey, CmsSerializableContentType } from "@/lib/cms/types"

const definitions = cmsContentDefinitions as readonly CmsContentType[]
const definitionLookup = new Map<string, CmsContentType>()

for (const definition of definitions) {
  definitionLookup.set(definition.key, definition)

  for (const alias of definition.aliases ?? []) {
    definitionLookup.set(alias, definition)
  }
}

export function listCmsContentTypes() {
  return definitions
}

export function resolveCmsContentType(value: string) {
  return definitionLookup.get(value)
}

export function getCmsContentType(value: string) {
  const definition = resolveCmsContentType(value)

  if (!definition) {
    throw new Error(`Unknown CMS content type: ${value}.`)
  }

  return definition
}

export function normalizeCmsContentTypeKey(value: string): CmsContentTypeKey {
  return getCmsContentType(value).key
}

export function toSerializableContentType(definition: CmsContentType): CmsSerializableContentType {
  return {
    key: definition.key,
    label: definition.label,
    pluralLabel: definition.pluralLabel,
    description: definition.description,
    fields: definition.fields,
    listFields: definition.listFields,
    relations: definition.relations,
    defaultValues: definition.defaultValues,
  }
}
