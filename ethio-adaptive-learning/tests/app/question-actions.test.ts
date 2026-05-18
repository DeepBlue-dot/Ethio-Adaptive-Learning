import { beforeEach, describe, expect, it, vi } from "vitest"

import { initialCmsActionState } from "@/lib/cms/types"

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  requireRole: vi.fn(),
  revalidatePath: vi.fn(),
  saveQuestion: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}))

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}))

vi.mock("@/lib/auth", () => ({
  requireRole: mocks.requireRole,
}))

vi.mock("@/lib/curriculum", async () => {
  const actual = await vi.importActual<typeof import("@/lib/curriculum")>("@/lib/curriculum")

  return {
    ...actual,
    saveQuestion: mocks.saveQuestion,
  }
})

import { saveQuestion } from "@/app/(admin)/admin/cms/questions/question-editor-actions"

describe("admin question actions", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => {
      if ("mockReset" in mock) {
        mock.mockReset()
      }
    })

    mocks.requireRole.mockResolvedValue({
      user: {
        id: "writer_1",
        role: "COURSE_WRITER",
      },
    })
    mocks.redirect.mockImplementation((pathname: string) => {
      throw new Error(`NEXT_REDIRECT:${pathname}`)
    })
  })

  it("returns inline validation errors for invalid question payloads", async () => {
    const formData = new FormData()
    formData.set("conceptId", "")
    formData.set("usage", "PRACTICE")
    formData.set("difficulty", "MEDIUM")
    formData.set("content", "")
    formData.set("correctAnswer", "")
    formData.set("distractors", "")
    formData.set("hintText", "")
    formData.set("explanation", "")

    const result = await saveQuestion(initialCmsActionState, formData)

    expect(result).toEqual({
      ok: false,
      message: "Please correct the highlighted fields and try again.",
      statusCode: 400,
      fieldErrors: {
        conceptId: ["Concept is required."],
        content: ["Question prompt is required."],
        correctAnswer: ["Correct answer is required."],
      },
    })
    expect(mocks.saveQuestion).not.toHaveBeenCalled()
  })

  it("redirects to the dedicated editor after successful creation", async () => {
    mocks.saveQuestion.mockResolvedValueOnce({
      id: "question_1",
      conceptId: "concept_1",
    })

    const formData = buildValidQuestionFormData()
    formData.set("returnTo", "/admin/cms/questions?courseId=course_1")

    await expect(saveQuestion(initialCmsActionState, formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/cms/questions/question_1?status=Question+created.&returnTo=%2Fadmin%2Fcms%2Fquestions%3FcourseId%3Dcourse_1"
    )

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/dashboard")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/cms/questions")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/concepts")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/cms/questions/question_1")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/learn/concept_1")
  })
})

function buildValidQuestionFormData() {
  const formData = new FormData()

  formData.set("conceptId", "concept_1")
  formData.set("usage", "PRACTICE")
  formData.set("difficulty", "MEDIUM")
  formData.set("content", "What is 2 + 2?")
  formData.set("correctAnswer", "4")
  formData.set("distractors", "3\n5")
  formData.set("hintText", "Count pairs")
  formData.set("explanation", "2 + 2 equals 4.")
  formData.set("slug", "two-plus-two")

  return formData
}
