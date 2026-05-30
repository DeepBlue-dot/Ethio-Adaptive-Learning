"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { MediaAssetKind, type Prisma } from "@prisma/client"

import {
  createItem,
  deleteItem,
  getContentType,
  parseCmsFormData,
  publishItem,
  requireCmsAccess,
  saveDraftItem,
  unpublishItem,
  bulkPublishItems,
  bulkUnpublishItems,
  bulkDeleteItems,
  createCmsErrorState,
} from "@/lib/cms"
import { getErrorMessage, getReturnTo, redirectWithMessage, textField } from "@/lib/cms/forms"
import type { CmsActionState } from "@/lib/cms/types"
import { uploadImage } from "@/lib/cloudinary/upload-image"
import { prisma } from "@/lib/prisma"

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
    return {
      ok: false,
      message: result.message,
      fieldErrors: result.fieldErrors,
      statusCode: result.statusCode,
    }
  }

  const data = result.data as Record<string, unknown>
  const id = textField(formData, "id") || null
  const returnTo = getReturnTo(formData, `/admin/studio/${definition.key}`)
  const lastUpdatedAtValue = textField(formData, "lastUpdatedAt")
  const lastUpdatedAt = lastUpdatedAtValue ? Number(lastUpdatedAtValue) : undefined
  const contentType = definition.key

  try {
    const mutationResult = await publishItem(contentType, id, data, userId, lastUpdatedAt)

    if (!id) {
      redirect(await buildEditorRedirectPath(contentType, mutationResult.entity.id, returnTo, "Saved."))
    }

    revalidateCmsPaths(mutationResult.revalidationPaths)
    return {
      ok: true,
      message: "Saved successfully.",
      fieldErrors: {},
      statusCode: 200,
      updatedAt: mutationResult.entity.lifecycle?.updatedAt ? new Date(mutationResult.entity.lifecycle.updatedAt).getTime() : undefined,
      entityId: mutationResult.entity.id,
      status: mutationResult.entity.lifecycle?.status,
    }
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }

    // Map validation-like errors (graph cycles, publish prereqs, zod parse errors) into
    // the same structured shape returned by parseCmsFormData so the UI can highlight fields.
    try {
      return createCmsErrorState(error)
    } catch (err) {
      return {
        ok: false,
        message: getErrorMessage(error),
        fieldErrors: {},
        statusCode: 500,
      }
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
    await prisma.$transaction(async (tx) => {
      await writeTemporaryOrderValues(tx, definition.key, ids)
      await writeFinalOrderValues(tx, definition.key, ids)
    })

    revalidateCmsPaths(revalidationPaths)
    return { ok: true, message: "Order updated successfully." }
  } catch (error) {
    console.error(`Failed to reorder ${contentType}:`, error)
    return { ok: false, message: error instanceof Error ? error.message : "Reordering failed." }
  }
}

async function writeTemporaryOrderValues(
  tx: Prisma.TransactionClient,
  contentType: string,
  ids: string[]
) {
  await Promise.all(ids.map((id, index) => updateEntityOrder(tx, contentType, id, -1 * (index + 1))))
}

async function writeFinalOrderValues(
  tx: Prisma.TransactionClient,
  contentType: string,
  ids: string[]
) {
  await Promise.all(ids.map((id, index) => updateEntityOrder(tx, contentType, id, index + 1)))
}

async function updateEntityOrder(
  tx: Prisma.TransactionClient,
  contentType: string,
  id: string,
  order: number
) {
  switch (contentType) {
    case "unit":
      await tx.unit.update({ where: { id }, data: { order } })
      return
    case "chunk":
      await tx.conceptChunk.update({ where: { id }, data: { order } })
      return
    case "worked-example":
      await tx.workedExample.update({ where: { id }, data: { order } })
      return
    default:
      throw new Error(`${contentType} does not support manual ordering.`)
  }
}

export async function uploadCmsImageAsset(formData: FormData) {
  const session = await requireCmsAccess()
  const userId = session.user.id
  const returnTo = getReturnTo(formData, "/admin/studio/media-asset")
  const file = formData.get("file")

  if (!(file instanceof File) || file.size === 0) {
    redirectWithMessage(returnTo, "error", "Please choose an image to upload.")
  }

  if (!file.type.startsWith("image/")) {
    redirectWithMessage(returnTo, "error", "Only image uploads are supported here.")
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const base64 = `data:${file.type};base64,${Buffer.from(arrayBuffer).toString("base64")}`
    const uploaded = await uploadImage(base64, {
      resource_type: "image",
      folder: "ethioprep/cms",
    })
    const title = textField(formData, "title") || file.name
    const alt = textField(formData, "alt") || title

    await createItem(
      "media-asset",
      {
        kind: MediaAssetKind.IMAGE,
        title,
        alt,
        publicId: uploaded.public_id,
        url: uploaded.secure_url,
        width: uploaded.width,
        height: uploaded.height,
        bytes: uploaded.bytes,
        thumbnailUrl: uploaded.thumbnail_url || uploaded.secure_url,
        createdById: userId,
      },
      userId
    )

    revalidatePath("/admin/studio/media-asset")
    revalidatePath("/admin/resources")
  } catch (error) {
    redirectWithMessage(returnTo, "error", error instanceof Error ? error.message : "Image upload failed.")
  }

  redirectWithMessage(returnTo, "msg", "Image uploaded.")
}
