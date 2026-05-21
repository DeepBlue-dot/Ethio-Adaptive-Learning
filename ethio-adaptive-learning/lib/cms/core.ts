import { requireRole } from "@/lib/auth"
import { prismaCmsRepository } from "@/lib/cms/repository/prisma"
import {
  getCmsContentType,
  listCmsContentTypes,
  normalizeCmsContentTypeKey,
  toSerializableContentType,
} from "@/lib/cms/registry"
import { getCmsRevalidationPaths } from "@/lib/cms/validation"
import { logCmsActivity } from "@/lib/cms/activity"
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
  userId: string | null = null,
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

  if (userId) {
    await logCmsActivity({
      userId,
      action: "CREATE",
      contentType: definition.key,
      entityId: entity.id,
      entityTitle: entity.title,
    })
  }

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
  lastUpdatedAt?: number,
  userId: string | null = null,
  repository: CmsRepository = prismaCmsRepository
): Promise<CmsMutationResult> {
  const definition = getCmsContentType(type)
  const entity = decorateEntity(definition, await repository.updateItem(definition.key, id, data, lastUpdatedAt))
  const revalidationPaths = getCmsRevalidationPaths(definition, {
    contentType: definition.key,
    action: "update",
    id: entity.id,
    result: entity,
  })

  if (userId) {
    await logCmsActivity({
      userId,
      action: "UPDATE",
      contentType: definition.key,
      entityId: entity.id,
      entityTitle: entity.title,
    })
  }

  return {
    entity,
    message: `${definition.label} saved.`,
    revalidationPaths,
  }
}

export async function saveDraftItem(
  type: string,
  id: string | null,
  data: unknown,
  userId: string,
  lastUpdatedAt?: number,
  repository: CmsRepository = prismaCmsRepository
): Promise<CmsMutationResult> {
  const definition = getCmsContentType(type)
  const entity = decorateEntity(
    definition,
    repository.saveDraftItem
      ? await repository.saveDraftItem(definition.key, id, data, userId, lastUpdatedAt)
      : id
        ? await repository.updateItem(definition.key, id, data, lastUpdatedAt)
        : await repository.createItem(definition.key, data)
  )
  const revalidationPaths = getCmsRevalidationPaths(definition, {
    contentType: definition.key,
    action: id ? "update" : "create",
    id: entity.id,
    result: entity,
  })

  await logCmsActivity({
    userId,
    action: "DRAFT_SAVE",
    contentType: definition.key,
    entityId: entity.id,
    entityTitle: entity.title,
  })

  return {
    entity,
    message: `${definition.label} draft saved.`,
    revalidationPaths,
  }
}

export async function publishItem(
  type: string,
  id: string | null,
  data: unknown,
  userId: string,
  lastUpdatedAt?: number,
  repository: CmsRepository = prismaCmsRepository
): Promise<CmsMutationResult> {
  const definition = getCmsContentType(type)
  const entity = decorateEntity(
    definition,
    repository.publishItem
      ? await repository.publishItem(definition.key, id, data, userId, lastUpdatedAt)
      : id
        ? await repository.updateItem(definition.key, id, data, lastUpdatedAt)
        : await repository.createItem(definition.key, data)
  )
  const revalidationPaths = getCmsRevalidationPaths(definition, {
    contentType: definition.key,
    action: id ? "update" : "create",
    id: entity.id,
    result: entity,
  })

  await logCmsActivity({
    userId,
    action: "PUBLISH",
    contentType: definition.key,
    entityId: entity.id,
    entityTitle: entity.title,
  })

  return {
    entity,
    message: `${definition.label} published.`,
    revalidationPaths,
  }
}

export async function unpublishItem(
  type: string,
  id: string,
  userId: string,
  repository: CmsRepository = prismaCmsRepository
): Promise<CmsMutationResult> {
  const definition = getCmsContentType(type)

  if (!repository.unpublishItem) {
    throw new Error("This CMS repository does not support unpublishing.")
  }

  const entity = decorateEntity(definition, await repository.unpublishItem(definition.key, id, userId))
  const revalidationPaths = getCmsRevalidationPaths(definition, {
    contentType: definition.key,
    action: "update",
    id: entity.id,
    result: entity,
  })

  await logCmsActivity({
    userId,
    action: "UNPUBLISH",
    contentType: definition.key,
    entityId: entity.id,
    entityTitle: entity.title,
  })

  return {
    entity,
    message: `${definition.label} unpublished.`,
    revalidationPaths,
  }
}

export async function deleteItem(
  type: string,
  id: string,
  userId: string | null = null,
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

  if (userId) {
    await logCmsActivity({
      userId,
      action: "DELETE",
      contentType: definition.key,
      entityId: entity.id,
      entityTitle: entity.title,
    })
  }

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
    returnTo: returnTo ?? `/admin/studio/${definition.key}`,
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

export async function bulkPublishItems(
  type: string,
  ids: string[],
  userId: string,
  repository: CmsRepository = prismaCmsRepository
): Promise<{ count: number; revalidationPaths: string[] }> {
  const definition = getCmsContentType(type)
  const allRevalidationPaths = new Set<string>()
  let count = 0

  for (const id of ids) {
    try {
      const item = await repository.getItem(definition.key, id)
      if (!item) continue

      const result = await publishItem(definition.key, id, item.data, userId, undefined, repository)
      result.revalidationPaths.forEach((p) => allRevalidationPaths.add(p))
      count++
    } catch (error) {
      console.error(`Failed to bulk publish ${type} ${id}:`, error)
    }
  }

  return {
    count,
    revalidationPaths: [...allRevalidationPaths],
  }
}

export async function bulkUnpublishItems(
  type: string,
  ids: string[],
  userId: string,
  repository: CmsRepository = prismaCmsRepository
): Promise<{ count: number; revalidationPaths: string[] }> {
  const definition = getCmsContentType(type)
  const allRevalidationPaths = new Set<string>()
  let count = 0

  for (const id of ids) {
    try {
      const result = await unpublishItem(definition.key, id, userId, repository)
      result.revalidationPaths.forEach((p) => allRevalidationPaths.add(p))
      count++
    } catch (error) {
      console.error(`Failed to bulk unpublish ${type} ${id}:`, error)
    }
  }

  return {
    count,
    revalidationPaths: [...allRevalidationPaths],
  }
}

export async function bulkDeleteItems(
  type: string,
  ids: string[],
  userId: string,
  repository: CmsRepository = prismaCmsRepository
): Promise<{ count: number; revalidationPaths: string[] }> {
  const definition = getCmsContentType(type)
  const allRevalidationPaths = new Set<string>()
  let count = 0

  for (const id of ids) {
    try {
      const result = await deleteItem(definition.key, id, userId, repository)
      result.revalidationPaths.forEach((p) => allRevalidationPaths.add(p))
      count++
    } catch (error) {
      console.error(`Failed to bulk delete ${type} ${id}:`, error)
    }
  }

  return {
    count,
    revalidationPaths: [...allRevalidationPaths],
  }
}

function decorateEntity(definition: CmsContentType, entity: CmsEntity): CmsEntity {
  return {
    ...entity,
    title: definition.getTitle(entity),
    subtitle: definition.getSubtitle?.(entity) ?? entity.subtitle ?? null,
    status: definition.getStatus?.(entity) ?? entity.status ?? null,
  }
}
