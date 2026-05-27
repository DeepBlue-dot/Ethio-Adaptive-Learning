"use server"

import { redirect } from "next/navigation"

import {
  createCmsErrorState,
  createItem,
  deleteItem,
  getContentType,
  parseCmsFormData,
  prismaCmsRepository,
  publishItem,
  requireCmsAccess,
  saveDraftItem,
  unpublishItem,
  updateItem,
  bulkPublishItems,
  bulkUnpublishItems,
  bulkDeleteItems,
} from "@/lib/cms"
import { getErrorMessage, getReturnTo, redirectWithMessage, textField } from "@/lib/cms/forms"
import type { CmsActionState } from "@/lib/cms/types"

import { revalidateCmsPaths, buildEditorRedirectPath } from "./helpers"

export async function saveCmsItem(
  prevState: CmsActionState,
  formData: FormData
): Promise<CmsActionState> {
  const session = await requireCmsAccess()
  const userId = session.user.id
  
  const contentTypeKey = textField(formData, "contentType") ?? ""
  const definition = getContentType(contentTypeKey)
  const result = await parseCmsFormData(definition, formData, userId)

  if (!result.success) {
    return createCmsErrorState(result)
  }

  const { data, id, intent, returnTo } = result.data as {
    data: Record<string, unknown>
    id: string | undefined
    intent: string
    returnTo: string
  }
  const contentType = definition.key

  try {
    let mutationResult
    if (intent === "publish") {
      if (id) {
        await updateItem(contentType, id, data, undefined, userId)
        mutationResult = await publishItem(contentType, id, data, userId)
      } else {
        const createResult = await createItem(contentType, data, userId)
        const item = createResult.entity
        mutationResult = await publishItem(contentType, item.id, data, userId)
        redirect(await buildEditorRedirectPath(contentType, item.id, returnTo, "Published."))
      }
    } else {
      // intent === "draft"
      if (id) {
        await updateItem(contentType, id, data, undefined, userId)
        mutationResult = await saveDraftItem(contentType, id, data, userId)
      } else {
        const createResult = await createItem(contentType, data, userId)
        const item = createResult.entity
        mutationResult = await saveDraftItem(contentType, item.id, data, userId)
        redirect(await buildEditorRedirectPath(contentType, item.id, returnTo, "Draft saved."))
      }
    }

    revalidateCmsPaths(mutationResult.revalidationPaths)
    return {
      ok: true,
      message: intent === "publish" ? "Published successfully." : "Draft saved.",
      fieldErrors: {},
      statusCode: 200,
    }
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }

    return {
      ok: false,
      message: getErrorMessage(error),
      fieldErrors: {},
      statusCode: 500,
    }
  }
}

export async function unpublishCmsItem(formData: FormData) {
  const session = await requireCmsAccess()
  const userId = session.user.id
  const contentType = textField(formData, "contentType") ?? ""
  const id = textField(formData, "id") ?? ""
  const returnTo = getReturnTo(formData, `/admin/studio/${contentType}`)

  try {
    const result = await unpublishItem(contentType, id, userId)
    revalidateCmsPaths(result.revalidationPaths)
  } catch (error) {
    redirectWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to unpublish.")
  }

  redirectWithMessage(returnTo, "msg", "Item unpublished.")
}

export async function deleteCmsItem(formData: FormData) {
  const session = await requireCmsAccess()
  const userId = session.user.id
  const contentType = textField(formData, "contentType") ?? ""
  const id = textField(formData, "id") ?? ""
  const returnTo = getReturnTo(formData, `/admin/studio/${contentType}`)

  const definition = getContentType(contentType)

  try {
    const result = await deleteItem(contentType, id, userId)
    revalidateCmsPaths(result.revalidationPaths)
  } catch (error) {
    redirectWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to delete CMS item.")
  }

  redirectWithMessage(returnTo, "msg", `${definition.label} deleted.`)
}

export async function bulkActionCmsItems(formData: FormData) {
  const session = await requireCmsAccess()
  const userId = session.user.id
  const contentType = textField(formData, "contentType") ?? ""
  const ids = formData.getAll("ids").map(String).flatMap((value) => value.split(",")).filter(Boolean)
  const intent = textField(formData, "intent")
  const returnTo = getReturnTo(formData, `/admin/studio/${contentType}`)

  if (!ids.length) return

  try {
    let result
    switch (intent) {
      case "publish":
      case "bulk-publish":
        result = await bulkPublishItems(contentType, ids, userId)
        break
      case "unpublish":
      case "bulk-unpublish":
        result = await bulkUnpublishItems(contentType, ids, userId)
        break
      case "delete":
      case "bulk-delete":
        result = await bulkDeleteItems(contentType, ids, userId)
        break
      default:
        throw new Error("Invalid bulk action intent.")
    }

    revalidateCmsPaths(result.revalidationPaths)
    redirectWithMessage(returnTo, "msg", `Bulk action completed: ${result.count} items processed.`)
  } catch (error) {
    redirectWithMessage(returnTo, "error", error instanceof Error ? error.message : "Bulk action failed.")
  }
}

export async function reorderCmsEntities(
  contentType: string,
  ids: string[],
  revalidationPaths: string[] = []
) {
  await requireCmsAccess()
  const definition = getContentType(contentType)

  try {
    await Promise.all(
      ids.map((id, index) =>
        prismaCmsRepository.updateItem(definition.key, id, { order: index + 1 })
      )
    )

    revalidateCmsPaths(revalidationPaths)
    return { ok: true, message: "Order updated successfully." }
  } catch (error) {
    console.error(`Failed to reorder ${contentType}:`, error)
    return { ok: false, message: error instanceof Error ? error.message : "Reordering failed." }
  }
}

export async function uploadCmsImageAsset() {
  // Placeholder: implement asset upload logic when available.
}
