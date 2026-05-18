import { beforeEach, describe, expect, it, vi } from "vitest"

import { GraphValidationError } from "@/lib/adaptive/graph"
import { initialCmsActionState } from "@/lib/cms/types"

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  requireRole: vi.fn(),
  saveConceptEditor: vi.fn(),
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
    archiveCourse: vi.fn(),
    createConceptDraft: vi.fn(),
    createCourse: vi.fn(),
    createUnit: vi.fn(),
    deleteConcept: vi.fn(),
    deleteCourse: vi.fn(),
    deleteUnit: vi.fn(),
    restoreCourse: vi.fn(),
    saveConceptEditor: mocks.saveConceptEditor,
    updateCourse: vi.fn(),
    updateUnit: vi.fn(),
  }
})

import {
  saveConceptEditor,
} from "@/app/(admin)/admin/cms/concepts/concept-editor-actions"

describe("admin concept actions", () => {
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
  })

  it("returns inline validation errors for invalid concept editor payloads", async () => {
    const formData = new FormData()
    formData.set("conceptId", "concept_1")
    formData.set("unitId", "unit_1")
    formData.set("title", "Limits")
    formData.set("unlockThreshold", "1.4")
    formData.set("pLo", "0.15")
    formData.set("pT", "0.1")
    formData.set("pG", "0.2")
    formData.set("pS", "0.1")
    formData.set("decayLambda", "0.01")
    formData.set("chunks", "[]")
    formData.set("workedExamples", "[]")

    const result = await saveConceptEditor(initialCmsActionState, formData)

    expect(result).toEqual({
      ok: false,
      message: "Please correct the highlighted fields and try again.",
      statusCode: 400,
      fieldErrors: {
        unlockThreshold: ["Unlock threshold must be between 0 and 1."],
      },
    })
    expect(mocks.saveConceptEditor).not.toHaveBeenCalled()
  })

  it("returns bad-request style cycle errors inline", async () => {
    mocks.saveConceptEditor.mockRejectedValueOnce(
      new GraphValidationError(
        "Saving prerequisites would create a cycle: concept_a -> concept_b -> concept_a."
      )
    )

    const formData = buildValidConceptFormData()
    formData.append("prerequisiteConceptIds", "concept_b")

    const result = await saveConceptEditor(initialCmsActionState, formData)

    expect(result).toEqual({
      ok: false,
      message: "Saving prerequisites would create a cycle: concept_a -> concept_b -> concept_a.",
      statusCode: 400,
      fieldErrors: {
        prerequisiteConceptIds: [
          "Saving prerequisites would create a cycle: concept_a -> concept_b -> concept_a.",
        ],
      },
    })
  })

  it("revalidates admin and student paths after successful saves", async () => {
    mocks.saveConceptEditor.mockResolvedValueOnce({
      id: "concept_1",
    })

    const result = await saveConceptEditor(
      initialCmsActionState,
      buildValidConceptFormData()
    )

    expect(result).toEqual({
      ok: true,
      message: "Concept saved.",
      statusCode: 200,
      fieldErrors: {},
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/dashboard")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/cms/concepts")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/cms/questions")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/concepts")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/cms/concepts/concept_1")
  })
})

function buildValidConceptFormData() {
  const formData = new FormData()

  formData.set("conceptId", "concept_1")
  formData.set("unitId", "unit_1")
  formData.set("title", "Limits")
  formData.set("slug", "limits")
  formData.set("description", "Intro to limits")
  formData.set("contentBody", "Markdown body")
  formData.set("unlockThreshold", "0.9")
  formData.set("pLo", "0.15")
  formData.set("pT", "0.1")
  formData.set("pG", "0.2")
  formData.set("pS", "0.1")
  formData.set("decayLambda", "0.01")
  formData.set("chunks", "[]")
  formData.set("workedExamples", "[]")

  return formData
}
