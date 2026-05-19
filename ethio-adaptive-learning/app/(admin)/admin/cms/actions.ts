"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  createCmsErrorState,
  createItem,
  deleteItem,
  getContentType,
  parseCmsFormData,
  requireCmsAccess,
  updateItem,
} from "@/lib/cms"
import { getReturnTo, redirectWithMessage, textField } from "@/lib/cms/forms"
import type { CmsActionState } from "@/lib/cms/types"

const CMS_INDEX_PATH = "/admin/cms"

export async function saveCmsItem(
  _previousState: CmsActionState,
  formData: FormData
): Promise<CmsActionState> {
  const session = await requireCmsAccess()
  const contentType = textField(formData, "contentType") ?? ""
  const id = textField(formData, "id")
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

  let result: Awaited<ReturnType<typeof createItem>>

  try {
    result = id
      ? await updateItem(definition.key, id, parsed.data)
      : await createItem(definition.key, parsed.data)
    revalidateCmsPaths(result.revalidationPaths)
  } catch (error) {
    return createCmsErrorState(error)
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
