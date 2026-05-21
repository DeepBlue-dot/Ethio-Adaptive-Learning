"use server"

import { revalidatePath } from "next/cache"

export async function revalidateCmsPaths(paths: string[]) {
  paths.forEach((path) => revalidatePath(path))
}

export async function buildEditorRedirectPath(contentType: string, id: string, returnTo: string, status: string) {
  const params = new URLSearchParams()
  params.set("msg", status)
  if (returnTo !== `/admin/studio/${contentType}`) {
    params.set("returnTo", returnTo)
  }
  return `/admin/studio/${contentType}/${id}?${params.toString()}`
}
