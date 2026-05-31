"use server"

import { revalidatePath } from "next/cache"

import { requireRole } from "@/lib/auth-server"
import { getItem, getContentType, getReferenceOptions, toSerializableContentType } from "@/lib/cms"
import { type CmsEditorModel } from "@/lib/cms/types"
import { createConceptDraft } from "@/lib/curriculum/concept"
import { createUnit } from "@/lib/curriculum/unit"
import { prisma } from "@/lib/prisma"

/**
 * Fetches the necessary data to initialize the Inspector for a curriculum node.
 * This combines the item data, the content type definition, and available references.
 */
export async function getInspectorModel(type: string, id: string): Promise<CmsEditorModel | null> {
  await requireRole(["ADMIN", "COURSE_WRITER"])
  
  try {
    const [item, definition, referenceOptions] = await Promise.all([
      getItem(type, id),
      getContentType(type),
      getReferenceOptions(type, id)
    ])

    if (!item) return null

    return {
      definition: toSerializableContentType(definition),
      item,
      referenceOptions,
      returnTo: `/admin/studio/builder`, // Default fallback
    }
  } catch (error) {
    console.error(`Failed to load inspector model for ${type}/${id}:`, error)
    return null
  }
}

/**
 * Perform an inline update of a single field or multiple fields for an entity.
 * This is used for the debounced auto-save feature in the Inspector.
 */
export async function updateInspectorMetadata(
  type: string,
  id: string,
  data: Record<string, unknown>
) {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])
  const userId = session.user.id
  
  const { saveDraftItem } = await import("@/lib/cms/core")
  
  try {
    const item = await getItem(type, id)
    if (!item) {
      return { ok: false, error: "Item not found." }
    }

    const result = await saveDraftItem(type, id, { ...item.data, ...data }, userId)
    
    return { ok: true, updatedAt: result.entity.lifecycle?.updatedAt }
  } catch (error) {
    console.error(`Inspector auto-save failed for ${type}/${id}:`, error)
    return { ok: false, error: error instanceof Error ? error.message : "Auto-save failed." }
  }
}

export async function linkResourceToNode({
  nodeId,
  nodeType,
  resourceId,
  resourceType,
}: {
  nodeId: string
  nodeType: "concept" | "unit"
  resourceId: string
  resourceType: "media-asset" | "content-snippet"
}) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  try {
    const consumerType = nodeType.toUpperCase()
    const context = "builder-inspector"

    await prisma.resourceUsage.upsert({
      where:
        resourceType === "media-asset"
          ? {
              mediaAssetId_consumerId_context: {
                mediaAssetId: resourceId,
                consumerId: nodeId,
                context,
              },
            }
          : {
              contentSnippetId_consumerId_context: {
                contentSnippetId: resourceId,
                consumerId: nodeId,
                context,
              },
            },
      create:
        resourceType === "media-asset"
          ? {
              mediaAssetId: resourceId,
              consumerType,
              consumerId: nodeId,
              context,
            }
          : {
              contentSnippetId: resourceId,
              consumerType,
              consumerId: nodeId,
              context,
            },
      update: {
        consumerType,
      },
    })

    return { ok: true }
  } catch (error) {
    console.error(`Failed to link resource ${resourceId} to ${nodeType}/${nodeId}:`, error)
    return { ok: false, error: "Unable to link resource." }
  }
}

export async function createBuilderUnit(courseId: string, title?: string) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  try {
    const lastUnit = await prisma.unit.findFirst({
      where: { courseId },
      orderBy: { order: "desc" },
      select: { order: true },
    })
    const order = (lastUnit?.order ?? 0) + 1
    const unit = await createUnit({
      courseId,
      order,
      title: title?.trim() || `New Unit ${order}`,
    })

    revalidatePath(`/admin/studio/builder/${courseId}`)
    revalidatePath("/admin/studio")

    return {
      ok: true,
      unit: {
        id: unit.id,
        type: "UNIT" as const,
        title: unit.title,
        status: unit.status,
        order: unit.order,
        concepts: [],
      },
    }
  } catch (error) {
    console.error(`Failed to create unit for course ${courseId}:`, error)
    return { ok: false, error: "Unable to create unit." }
  }
}

export async function createBuilderConcept(unitId: string, title?: string) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  try {
    let finalTitle = title?.trim()
    
    if (!finalTitle) {
      // Generate a unique title by finding the next available number
      let counter = 1
      let candidateTitle = `New Concept ${counter}`
      
      while (await prisma.concept.findFirst({
        where: { unitId, title: candidateTitle }
      })) {
        counter++
        candidateTitle = `New Concept ${counter}`
      }
      
      finalTitle = candidateTitle
    }
    
    const concept = await createConceptDraft({
      unitId,
      title: finalTitle,
    })
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: { courseId: true },
    })

    if (unit) {
      revalidatePath(`/admin/studio/builder/${unit.courseId}`)
    }
    revalidatePath("/admin/studio")

    return {
      ok: true,
      concept: {
        id: concept.id,
        type: "CONCEPT" as const,
        title: concept.title,
        status: concept.status,
      },
    }
  } catch (error) {
    console.error(`Failed to create concept for unit ${unitId}:`, error)
    return { ok: false, error: "Unable to create concept." }
  }
}
