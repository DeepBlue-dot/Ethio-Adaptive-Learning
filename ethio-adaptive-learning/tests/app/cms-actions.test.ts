import { beforeEach, describe, expect, it, vi } from "vitest"

import { initialCmsActionState } from "@/lib/cms/types"

const mocks = vi.hoisted(() => ({
  createItem: vi.fn(),
  deleteItem: vi.fn(),
  publishItem: vi.fn(),
  redirect: vi.fn(),
  requireCmsAccess: vi.fn(),
  revalidatePath: vi.fn(),
  saveDraftItem: vi.fn(),
  unpublishItem: vi.fn(),
  updateItem: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}))

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}))

vi.mock("@/lib/cms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cms")>("@/lib/cms")

  return {
    ...actual,
    createItem: mocks.createItem,
    deleteItem: mocks.deleteItem,
    publishItem: mocks.publishItem,
    requireCmsAccess: mocks.requireCmsAccess,
    saveDraftItem: mocks.saveDraftItem,
    unpublishItem: mocks.unpublishItem,
    updateItem: mocks.updateItem,
  }
})

import { deleteCmsItem, saveCmsItem, unpublishCmsItem } from "@/app/(admin)/admin/cms/actions"

describe("generic CMS actions", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => {
      if ("mockReset" in mock) {
        mock.mockReset()
      }
    })

    mocks.requireCmsAccess.mockResolvedValue({
      user: {
        id: "writer_1",
        role: "COURSE_WRITER",
      },
    })
    mocks.redirect.mockImplementation((pathname: string) => {
      throw new Error(`NEXT_REDIRECT:${pathname}`)
    })
  })

  it("returns inline validation errors for invalid generic payloads", async () => {
    const formData = new FormData()
    formData.set("contentType", "question")
    formData.set("conceptId", "")
    formData.set("usage", "PRACTICE")
    formData.set("difficulty", "MEDIUM")
    formData.set("content", "")
    formData.set("correctAnswer", "")
    formData.set("distractors", "")

    const result = await saveCmsItem(initialCmsActionState, formData)

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
    expect(mocks.publishItem).not.toHaveBeenCalled()
    expect(mocks.saveDraftItem).not.toHaveBeenCalled()
  })

  it("publishes items through the generic CMS action and redirects to the editor", async () => {
    mocks.publishItem.mockResolvedValueOnce({
      entity: {
        id: "question_1",
        type: "question",
        title: "What is 2 + 2?",
        data: {
          conceptId: "concept_1",
        },
      },
      message: "Question published.",
      revalidationPaths: ["/admin/cms/question", "/learn/concept_1"],
    })

    const formData = buildValidQuestionFormData()
    formData.set("returnTo", "/admin/cms/question?courseId=course_1")

    await expect(saveCmsItem(initialCmsActionState, formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/cms/question/question_1?status=Question+published.&returnTo=%2Fadmin%2Fcms%2Fquestion%3FcourseId%3Dcourse_1"
    )

    expect(mocks.publishItem).toHaveBeenCalledWith("question", null, {
      authorId: "writer_1",
      conceptId: "concept_1",
      content: "What is 2 + 2?",
      correctAnswer: "4",
      difficulty: "MEDIUM",
      distractors: ["3", "5"],
      explanation: "2 + 2 equals 4.",
      hintText: "Count pairs",
      slug: "two-plus-two",
      usage: "PRACTICE",
    }, "writer_1")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/cms/question")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/learn/concept_1")
  })

  it("publishes changes when an id is present", async () => {
    mocks.publishItem.mockResolvedValueOnce({
      entity: {
        id: "course_1",
        type: "course",
        title: "Grade 12 Mathematics",
        data: {},
      },
      message: "Course published.",
      revalidationPaths: ["/admin/cms/course"],
    })

    const formData = new FormData()
    formData.set("contentType", "course")
    formData.set("id", "course_1")
    formData.set("title", " Grade 12 Mathematics ")
    formData.set("slug", " grade-12-math ")
    formData.set("description", " Core course ")
    formData.set("authorId", "")
    formData.set("archived", "active")

    await expect(saveCmsItem(initialCmsActionState, formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/cms/course/course_1?status=Course+published."
    )

    expect(mocks.publishItem).toHaveBeenCalledWith("course", "course_1", {
      archived: "active",
      authorId: null,
      description: "Core course",
      slug: "grade-12-math",
      title: "Grade 12 Mathematics",
    }, "writer_1")
  })

  it("saves drafts without publishing canonical content", async () => {
    mocks.saveDraftItem.mockResolvedValueOnce({
      entity: {
        id: "question_1",
        type: "question",
        title: "What is 2 + 2?",
        data: {},
      },
      message: "Question draft saved.",
      revalidationPaths: ["/admin/cms/question"],
    })

    const formData = buildValidQuestionFormData()
    formData.set("id", "question_1")
    formData.set("intent", "save-draft")

    await expect(saveCmsItem(initialCmsActionState, formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/cms/question/question_1?status=Question+draft+saved."
    )

    expect(mocks.saveDraftItem).toHaveBeenCalledWith("question", "question_1", expect.objectContaining({
      content: "What is 2 + 2?",
    }), "writer_1")
    expect(mocks.publishItem).not.toHaveBeenCalled()
  })

  it("deletes items through the generic CMS action and revalidates returned paths", async () => {
    mocks.deleteItem.mockResolvedValueOnce({
      entity: {
        id: "question_1",
        type: "question",
        title: "Deleted question",
        data: {
          conceptId: "concept_1",
        },
      },
      message: "Question deleted.",
      revalidationPaths: ["/admin/cms/question", "/learn/concept_1"],
    })

    const formData = new FormData()
    formData.set("contentType", "question")
    formData.set("id", "question_1")
    formData.set("returnTo", "/admin/cms/question")

    await expect(deleteCmsItem(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/cms/question?status=Question+deleted."
    )

    expect(mocks.deleteItem).toHaveBeenCalledWith("question", "question_1")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/cms/question")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/learn/concept_1")
  })

  it("unpublishes items through the lifecycle action", async () => {
    mocks.unpublishItem.mockResolvedValueOnce({
      entity: {
        id: "concept_1",
        type: "concept",
        title: "Limits",
        data: {},
      },
      message: "Concept unpublished.",
      revalidationPaths: ["/admin/cms/concept", "/learn/concept_1"],
    })

    const formData = new FormData()
    formData.set("contentType", "concept")
    formData.set("id", "concept_1")
    formData.set("returnTo", "/admin/cms/concept")

    await expect(unpublishCmsItem(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/cms/concept/concept_1?status=Concept+unpublished."
    )

    expect(mocks.unpublishItem).toHaveBeenCalledWith("concept", "concept_1", "writer_1")
  })
})

function buildValidQuestionFormData() {
  const formData = new FormData()

  formData.set("contentType", "question")
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
