"use server"

import { requireRole } from "@/lib/auth"
import { getItem, getContentType, getReferenceOptions, toSerializableContentType } from "@/lib/cms"
import { type CmsEditorModel } from "@/lib/cms/types"

/**
 * Fetches the necessary data to initialize the Inspector for a curriculum node.
 * This combines the item data, the content type definition, and available references.
 */
export async function getInspectorModel(type: string, id: string): Promise<CmsEditorModel | null> {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])
  
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
  
  const { updateItem, saveDraftItem } = await import("@/lib/cms/core")
  
  try {
    // We update the item and mark it as a draft to ensure changes aren't live until published
    await updateItem(type, id, data, undefined, userId)
    const result = await saveDraftItem(type, id, data, userId)
    
    return { ok: true, updatedAt: result.entity.lifecycle?.updatedAt }
  } catch (error) {
    console.error(`Inspector auto-save failed for ${type}/${id}:`, error)
    return { ok: false, error: "Auto-save failed." }
  }
}
