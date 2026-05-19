"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  createCmsErrorState,
  deleteItem,
  getContentType,
  publishItem,
  parseCmsFormData,
  requireCmsAccess,
  saveDraftItem,
  unpublishItem,
} from "@/lib/cms"
import { getReturnTo, redirectWithMessage, textField } from "@/lib/cms/forms"
import type { CmsActionState, CmsMutationResult } from "@/lib/cms/types"
import { uploadImage } from "@/lib/cloudinary/upload-image"

const CMS_INDEX_PATH = "/admin/cms"

export async function saveCmsItem(
  _previousState: CmsActionState,
  formData: FormData
): Promise<CmsActionState> {
  const session = await requireCmsAccess()
  const contentType = textField(formData, "contentType") ?? ""
  const id = textField(formData, "id")
  const lastUpdatedAtString = textField(formData, "lastUpdatedAt")
  const lastUpdatedAt = lastUpdatedAtString ? parseInt(lastUpdatedAtString, 10) : undefined
  const intent = textField(formData, "intent") ?? "publish"
  const returnTo = getReturnTo(formData, CMS_INDEX_PATH)
  const definition = getContentType(contentType)
  const parsed = parseCmsFormData(definition, formData, session.user.id)

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.message,
      statusCode: parsed.statusCode,
      fieldErrors: parsed.fieldErrors,
    }
  }

  let result: CmsMutationResult

  try {
    result =
      intent === "save-draft"
        ? await saveDraftItem(definition.key, id, parsed.data, session.user.id, lastUpdatedAt)
        : await publishItem(definition.key, id, parsed.data, session.user.id, lastUpdatedAt)
    revalidateCmsPaths(result.revalidationPaths)
  } catch (error) {
    return createCmsErrorState(error)
  }

  redirect(buildEditorRedirectPath(definition.key, result.entity.id, returnTo, result.message))
}

export async function unpublishCmsItem(formData: FormData) {
  const session = await requireCmsAccess()
  const contentType = textField(formData, "contentType") ?? ""
  const id = textField(formData, "id") ?? ""
  const returnTo = getReturnTo(formData, CMS_INDEX_PATH)
  const definition = getContentType(contentType)
  let result: CmsMutationResult

  try {
    result = await unpublishItem(definition.key, id, session.user.id)
    revalidateCmsPaths(result.revalidationPaths)
  } catch (error) {
    redirectWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to unpublish CMS item.")
  }

  redirect(buildEditorRedirectPath(definition.key, result.entity.id, returnTo, result.message))
}

export async function deleteCmsItem(formData: FormData) {
  await requireCmsAccess()

  const contentType = textField(formData, "contentType") ?? ""
  const id = textField(formData, "id") ?? ""
  const returnTo = getReturnTo(formData, CMS_INDEX_PATH)
  const definition = getContentType(contentType)

  try {
    const result = await deleteItem(definition.key, id)
    revalidateCmsPaths(result.revalidationPaths)
  } catch (error) {
    redirectWithMessage(returnTo, "error", error instanceof Error ? error.message : "Unable to delete CMS item.")
  }

  redirectWithMessage(returnTo, "status", `${definition.label} deleted.`)
}

export async function uploadCmsImageAsset(formData: FormData) {
  const session = await requireCmsAccess()
  const file = formData.get("file")
  const title = textField(formData, "title")?.trim()
  const alt = textField(formData, "alt")?.trim()
  const caption = textField(formData, "caption")?.trim()

  if (!(file instanceof File) || file.size === 0) {
    redirectWithMessage("/admin/cms/media-asset", "error", "Choose an image to upload.")
  }

  if (!file.type.startsWith("image/")) {
    redirectWithMessage("/admin/cms/media-asset", "error", "Only image uploads are supported.")
  }

  let result: CmsMutationResult

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const upload = await uploadImage(buffer, {
      folder: "ethio-adaptive-learning/cms",
      overwrite: false,
      use_filename: true,
    })
    result = await publishItem(
      "media-asset",
      null,
      {
        kind: "IMAGE",
        title: title || file.name,
        alt: alt || "",
        caption: caption || "",
        publicId: upload.public_id,
        url: upload.secure_url,
        width: upload.width,
        height: upload.height,
        bytes: upload.bytes,
      },
      session.user.id
    )

    revalidateCmsPaths(result.revalidationPaths)
  } catch (error) {
    redirectWithMessage(
      "/admin/cms/media-asset",
      "error",
      error instanceof Error ? error.message : "Unable to upload image."
    )
  }

  redirect(buildEditorRedirectPath("media-asset", result.entity.id, "/admin/cms/media-asset", "Image uploaded."))
}

function revalidateCmsPaths(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path)
  }
}

function buildEditorRedirectPath(contentType: string, id: string, returnTo: string, status: string) {
  const params = new URLSearchParams()

  params.set("status", status)

  if (returnTo !== `/admin/cms/${contentType}`) {
    params.set("returnTo", returnTo)
  }

  return `/admin/cms/${contentType}/${id}?${params.toString()}`
}
