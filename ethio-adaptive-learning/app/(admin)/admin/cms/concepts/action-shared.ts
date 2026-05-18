"use server"

import { revalidatePath } from "next/cache"

export const CONCEPTS_PATH = "/admin/cms/concepts"

export function revalidateConceptsCms(conceptId?: string) {
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/cms/concepts")
  revalidatePath("/admin/cms/questions")
  revalidatePath("/concepts")

  if (conceptId) {
    revalidatePath(`/admin/cms/concepts/${conceptId}`)
  }
}
