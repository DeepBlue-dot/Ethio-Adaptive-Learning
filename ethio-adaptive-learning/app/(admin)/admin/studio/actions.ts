"use server"

import type { CmsActionState } from "@/lib/cms/types"
import * as resourceActions from "./actions/resource-actions"
import * as cmsActions from "./actions/cms-actions"
import * as helpers from "./actions/helpers"
import * as inspectorActions from "./actions/inspector-actions"

// Resource Actions
export async function createYouTubeResource(url: string, title?: string) {
  return resourceActions.createYouTubeResource(url, title)
}

export async function createPhetResource(url: string, title?: string) {
  return resourceActions.createPhetResource(url, title)
}

export async function searchResources(query: string) {
  return resourceActions.searchResources(query)
}

export async function getResourceUsage(resourceId: string) {
  return resourceActions.getResourceUsage(resourceId)
}

export async function getResourceById(id: string) {
  return resourceActions.getResourceById(id)
}

export async function getUnusedResourcesCount() {
  return resourceActions.getUnusedResourcesCount()
}

export async function uploadResourceFile(formData: FormData) {
  return resourceActions.uploadResourceFile(formData)
}

export async function bulkActionResources(
  items: Array<{ id: string; type: "media-asset" | "content-snippet" }>,
  intent: "publish" | "unpublish" | "delete"
) {
  return resourceActions.bulkActionResources(items, intent)
}

export async function updateResourceMetadata(
  id: string,
  type: "media-asset" | "content-snippet",
  data: { title?: string; alt?: string; caption?: string }
) {
  return resourceActions.updateResourceMetadata(id, type, data)
}

export async function getResourceMetricsAction() {
  return resourceActions.getResourceMetricsAction()
}

// Inspector Actions
export async function getInspectorModel(type: string, id: string) {
  return inspectorActions.getInspectorModel(type, id)
}

export async function updateInspectorMetadata(
  type: string,
  id: string,
  data: Record<string, unknown>
) {
  return inspectorActions.updateInspectorMetadata(type, id, data)
}

// CMS Actions
export async function saveCmsItem(prevState: CmsActionState, formData: FormData) {
  return cmsActions.saveCmsItem(prevState, formData)
}

export async function unpublishCmsItem(formData: FormData) {
  return cmsActions.unpublishCmsItem(formData)
}

export async function deleteCmsItem(formData: FormData) {
  return cmsActions.deleteCmsItem(formData)
}

export async function bulkActionCmsItems(formData: FormData) {
  return cmsActions.bulkActionCmsItems(formData)
}

export async function reorderCmsEntities(
  contentType: string,
  ids: string[],
  revalidationPaths: string[] = []
) {
  return cmsActions.reorderCmsEntities(contentType, ids, revalidationPaths)
}

export async function uploadCmsImageAsset(formData: FormData) {
  return cmsActions.uploadCmsImageAsset(formData)
}

// Helpers
export async function revalidateCmsPaths(paths: string[]) {
  return helpers.revalidateCmsPaths(paths)
}

export async function buildEditorRedirectPath(
  contentType: string,
  id: string,
  returnTo: string,
  status: string
) {
  return helpers.buildEditorRedirectPath(contentType, id, returnTo, status)
}
