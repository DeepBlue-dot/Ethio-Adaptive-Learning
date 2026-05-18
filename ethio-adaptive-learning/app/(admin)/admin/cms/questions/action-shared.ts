import { revalidatePath } from "next/cache"

export const QUESTIONS_PATH = "/admin/cms/questions"

export function revalidateQuestionsCms(questionId?: string, conceptId?: string) {
  revalidatePath("/admin/dashboard")
  revalidatePath(QUESTIONS_PATH)
  revalidatePath("/concepts")

  if (questionId) {
    revalidatePath(`${QUESTIONS_PATH}/${questionId}`)
  }

  if (conceptId) {
    revalidatePath(`/learn/${conceptId}`)
  }
}
