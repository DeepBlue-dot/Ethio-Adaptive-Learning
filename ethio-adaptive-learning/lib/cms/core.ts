import { requireRole } from "@/lib/auth"
import { prismaCmsRepository } from "@/lib/cms/repository/prisma"
import {
  getCmsContentType,
  listCmsContentTypes,
  normalizeCmsContentTypeKey,
  toSerializableContentType,
} from "@/lib/cms/registry"
import { getCmsRevalidationPaths } from "@/lib/cms/validation"
import type {
  CmsContentType,
  CmsContentTypeKey,
  CmsEntity,
  CmsEditorModel,
  CmsListFilter,
  CmsMutationResult,
  CmsRepository,
} from "@/lib/cms/types"

export async function requireCmsAccess() {
  return requireRole(["ADMIN", "COURSE_WRITER"])
}

export function getContentTypes() {
  return listCmsContentTypes()
}

export function getContentType(value: string) {
  return getCmsContentType(value)
}

export function normalizeContentTypeKey(value: string) {
  return normalizeCmsContentTypeKey(value)
}

export async function createItem(
  type: string,
  data: unknown,
  repository: CmsRepository = prismaCmsRepository
): Promise<CmsMutationResult> {
  const definition = getCmsContentType(type)
  const entity = decorateEntity(definition, await repository.createItem(definition.key, data))
  const revalidationPaths = getCmsRevalidationPaths(definition, {
    contentType: definition.key,
    action: "create",
    id: entity.id,
    result: entity,
  })

  return {
    entity,
    message: `${definition.label} created.`,
    revalidationPaths,
  }
}

export async function updateItem(
  type: string,
  id: string,
  data: unknown,
  repository: CmsRepository = prismaCmsRepository
): Promise<CmsMutationResult> {
  const definition = getCmsContentType(type)
  const entity = decorateEntity(definition, await repository.updateItem(definition.key, id, data))
  const revalidationPaths = getCmsRevalidationPaths(definition, {
    contentType: definition.key,
    action: "update",
    id: entity.id,
    result: entity,
  })

  return {
    entity,
    message: `${definition.label} saved.`,
    revalidationPaths,
  }
}

export async function deleteItem(
  type: string,
  id: string,
  repository: CmsRepository = prismaCmsRepository
): Promise<CmsMutationResult> {
  const definition = getCmsContentType(type)
  const entity = decorateEntity(definition, await repository.deleteItem(definition.key, id))
  const revalidationPaths = getCmsRevalidationPaths(definition, {
    contentType: definition.key,
    action: "delete",
    id: entity.id,
    result: entity,
  })

  return {
    entity,
    message: `${definition.label} deleted.`,
    revalidationPaths,
  }
}

export async function getItem(
  type: string,
  id: string,
  repository: CmsRepository = prismaCmsRepository
) {
  const definition = getCmsContentType(type)
  const entity = await repository.getItem(definition.key, id)
  return entity ? decorateEntity(definition, entity) : null
}

export async function listItems(
  type: string,
  filter?: CmsListFilter,
  repository: CmsRepository = prismaCmsRepository
) {
  const definition = getCmsContentType(type)
  const items = await repository.listItems(definition.key, filter)
  return items.map((item) => decorateEntity(definition, item))
}

export async function getEditorModel(
  type: string,
  id?: string,
  returnTo?: string,
  repository: CmsRepository = prismaCmsRepository
): Promise<CmsEditorModel> {
  const definition = getCmsContentType(type)
  const item = id ? await repository.getItem(definition.key, id) : null

  if (id && !item) {
    throw new Error(`${definition.label} not found.`)
  }

  const referenceOptions = await repository.getReferenceOptions(definition.key, id)

  return {
    definition: toSerializableContentType(definition),
    item: item ? decorateEntity(definition, item) : null,
    referenceOptions,
    returnTo: returnTo ?? `/admin/cms/${definition.key}`,
  }
}

export async function getContentTypeCounts(repository: CmsRepository = prismaCmsRepository) {
  const entries = await Promise.all(
    listCmsContentTypes().map(async (definition) => {
      const items = await repository.listItems(definition.key as CmsContentTypeKey)
      return [definition.key, items.length] as const
    })
  )

  return Object.fromEntries(entries) as Record<CmsContentTypeKey, number>
}

function decorateEntity(definition: CmsContentType, entity: CmsEntity): CmsEntity {
  return {
    ...entity,
    title: definition.getTitle(entity),
    subtitle: definition.getSubtitle?.(entity) ?? entity.subtitle ?? null,
    status: definition.getStatus?.(entity) ?? entity.status ?? null,
  }
}
