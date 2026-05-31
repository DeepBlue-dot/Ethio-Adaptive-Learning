import { requireRole } from "@/lib/auth-server"
import { validatePrerequisiteSelection } from "@/lib/adaptive/graph"
import { prismaCmsRepository } from "@/lib/cms/repository/prisma"
import {
  getCmsContentType,
  listCmsContentTypes,
  normalizeCmsContentTypeKey,
  toSerializableContentType,
} from "@/lib/cms/registry"
import { getCmsRevalidationPaths } from "@/lib/cms/validation"
import { logCmsActivity } from "@/lib/cms/activity"
import { rebuildConceptClosureForCourse } from "@/lib/curriculum-graph"
import { prisma } from "@/lib/prisma"
import { syncUsage } from "@/lib/studio/usage-sync"
import type {
  CmsContentType,
  CmsContentTypeKey,
  CmsEntity,
  CmsEditorModel,
  CmsListFilter,
  CmsMutationResult,
  CmsReferenceOptions,
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

const RESOURCE_CONSUMERS = ["concept", "question", "content-snippet"]

export async function createItem(
  type: string,
  data: unknown,
  userId: string | null = null,
  repository: CmsRepository = prismaCmsRepository
): Promise<CmsMutationResult> {
  const definition = getCmsContentType(type)
  
  if (definition.key === "concept") {
    await assertPublishableConceptPrerequisites(definition.key, data)
    // For new items, we can't check for cycles with their own ID yet, 
    // but we can check if the requested prerequisites themselves have cycles (less likely)
    // or wait until saveDraft/publish which handle the ID-based check.
  }

  const entity = decorateEntity(definition, await repository.createItem(definition.key, data))
  await rebuildClosureForGraphLifecycleChange(definition.key, entity.id)
  
  // Sync resource usage if applicable
  if (RESOURCE_CONSUMERS.includes(definition.key)) {
    const consumerType = definition.key.toUpperCase().replace("-", "_") as "CONCEPT" | "QUESTION" | "CONTENT_SNIPPET"
    await syncUsage(consumerType, entity.id, data)
  }

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

  if (definition.key === "concept") {
    await assertConceptPrerequisiteSelectionIsAcyclic(id, data)
    // Note: We don't check draft leakage here because updateItem is generic.
    // Draft leakage is specific to the "PUBLISHED" status transition.
  }

  const entity = decorateEntity(definition, await repository.updateItem(definition.key, id, data, lastUpdatedAt))
  await rebuildClosureForGraphLifecycleChange(definition.key as CmsContentTypeKey, entity.id)
  
  // Sync resource usage if applicable
  if (RESOURCE_CONSUMERS.includes(definition.key)) {
    const consumerType = definition.key.toUpperCase().replace("-", "_") as "CONCEPT" | "QUESTION" | "CONTENT_SNIPPET"
    await syncUsage(consumerType, entity.id, data)
  }

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
  if (definition.key === "concept" && id) {
    await assertConceptPrerequisiteSelectionIsAcyclic(id, data)
  }
  const entity = decorateEntity(
    definition,
    repository.saveDraftItem
      ? await repository.saveDraftItem(definition.key, id, data, userId, lastUpdatedAt)
      : id
        ? await repository.updateItem(definition.key, id, data, lastUpdatedAt)
        : await repository.createItem(definition.key, data)
  )

  // Sync resource usage if applicable
  if (RESOURCE_CONSUMERS.includes(definition.key)) {
    const consumerType = definition.key.toUpperCase().replace("-", "_") as "CONCEPT" | "QUESTION" | "CONTENT_SNIPPET"
    await syncUsage(consumerType, entity.id, data)
  }

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
  await assertPublishableConceptPrerequisites(definition.key, data)
  if (definition.key === "concept" && id) {
    await assertConceptPrerequisiteSelectionIsAcyclic(id, data)
  }
  const entity = decorateEntity(
    definition,
    repository.publishItem
      ? await repository.publishItem(definition.key, id, data, userId, lastUpdatedAt)
      : id
        ? await repository.updateItem(definition.key, id, data, lastUpdatedAt)
        : await repository.createItem(definition.key, data)
  )
  await rebuildClosureForGraphLifecycleChange(definition.key, entity.id)

  // Sync resource usage if applicable
  if (RESOURCE_CONSUMERS.includes(definition.key)) {
    const consumerType = definition.key.toUpperCase().replace("-", "_") as "CONCEPT" | "QUESTION" | "CONTENT_SNIPPET"
    await syncUsage(consumerType, entity.id, data)
  }

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

  if (definition.key === "concept") {
    await assertNoPublishedDependents(id)
  }

  if (!repository.unpublishItem) {
    throw new Error("This CMS repository does not support unpublishing.")
  }

  const entity = decorateEntity(definition, await repository.unpublishItem(definition.key, id, userId))
  await rebuildClosureForGraphLifecycleChange(definition.key, entity.id)
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

async function assertNoPublishedDependents(conceptId: string) {
  const dependents = await prisma.concept.findMany({
    where: {
      prerequisiteEdges: {
        some: {
          prerequisiteConceptId: conceptId,
        },
      },
      status: "PUBLISHED",
    },
    select: {
      title: true,
    },
  })

  if (dependents.length) {
    const titles = dependents.map((d) => d.title).join(", ")
    throw new Error(`Cannot Unpublish: This concept is a prerequisite for published concepts: ${titles}. Unpublish them first.`)
  }
}

export async function deleteItem(
  type: string,
  id: string,
  userId: string | null = null,
  repository: CmsRepository = prismaCmsRepository
): Promise<CmsMutationResult> {
  const definition = getCmsContentType(type)
  
  // Fetch affected courseId BEFORE deletion because the item will be gone after
  const courseId = await getAffectedCourseId(definition.key as CmsContentTypeKey, id)
  
  const entity = decorateEntity(definition, await repository.deleteItem(definition.key, id))
  
  // Rebuild graph closure if a curriculum item was deleted
  if (courseId) {
    await rebuildConceptClosureForCourse(courseId)
  }

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

export async function getReferenceOptions(
  type: string,
  id?: string,
  repository: CmsRepository = prismaCmsRepository
): Promise<CmsReferenceOptions> {
  const definition = getCmsContentType(type)
  return repository.getReferenceOptions(definition.key, id)
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
      let result
      try {
        result = await deleteItem(definition.key, id, userId, repository)
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("Published content must be unpublished before it can be deleted.")
        ) {
          const unpublishResult = await unpublishItem(definition.key, id, userId, repository)
          unpublishResult.revalidationPaths.forEach((p) => allRevalidationPaths.add(p))
          result = await deleteItem(definition.key, id, userId, repository)
        } else {
          throw error
        }
      }

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

function getPrerequisiteConceptIds(data: unknown) {
  if (!data || typeof data !== "object" || !("prerequisiteConceptIds" in data)) {
    return []
  }

  const value = (data as { prerequisiteConceptIds?: unknown }).prerequisiteConceptIds
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(value.map(String).map((id) => id.trim()).filter(Boolean))]
}

async function assertConceptPrerequisiteSelectionIsAcyclic(conceptId: string, data: unknown) {
  const prerequisiteConceptIds = getPrerequisiteConceptIds(data)
  if (!prerequisiteConceptIds.length) {
    return
  }

  const concept = await prisma.concept.findUnique({
    where: { id: conceptId },
    select: {
      unit: {
        select: {
          courseId: true,
        },
      },
    },
  })

  if (!concept) {
    return
  }

  const existingEdges = await prisma.conceptPrerequisite.findMany({
    where: {
      dependentConcept: {
        unit: {
          courseId: concept.unit.courseId,
        },
      },
    },
    select: {
      prerequisiteConceptId: true,
      dependentConceptId: true,
    },
  })

  validatePrerequisiteSelection({
    conceptId,
    prerequisiteConceptIds,
    existingEdges,
  })
}

async function assertPublishableConceptPrerequisites(contentType: CmsContentTypeKey, data: unknown) {
  if (contentType !== "concept") {
    return
  }

  const prerequisiteConceptIds = getPrerequisiteConceptIds(data)
  if (!prerequisiteConceptIds.length) {
    return
  }

  const prerequisites = await prisma.concept.findMany({
    where: {
      id: {
        in: prerequisiteConceptIds,
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
    },
  })
  const prerequisitesById = new Map(prerequisites.map((concept) => [concept.id, concept]))
  const unpublishedPrerequisites = prerequisiteConceptIds
    .map((id) => prerequisitesById.get(id))
    .filter((concept) => concept && concept.status !== "PUBLISHED")

  if (unpublishedPrerequisites.length) {
    const titles = unpublishedPrerequisites.map((concept) => concept?.title).filter(Boolean).join(", ")
    throw new Error(`Publish Prerequisites First: ${titles} must be published before this concept can be published.`)
  }
}

async function rebuildClosureForGraphLifecycleChange(contentType: CmsContentTypeKey, id: string) {
  const courseId = await getAffectedCourseId(contentType, id)
  if (!courseId) {
    return
  }

  await rebuildConceptClosureForCourse(courseId)
}

async function getAffectedCourseId(contentType: CmsContentTypeKey, id: string) {
  switch (contentType) {
    case "course":
      return id
    case "unit": {
      const unit = await prisma.unit.findUnique({
        where: { id },
        select: { courseId: true },
      })
      return unit?.courseId ?? null
    }
    case "concept": {
      const concept = await prisma.concept.findUnique({
        where: { id },
        select: {
          unit: {
            select: {
              courseId: true,
            },
          },
        },
      })
      return concept?.unit.courseId ?? null
    }
    default:
      return null
  }
}
