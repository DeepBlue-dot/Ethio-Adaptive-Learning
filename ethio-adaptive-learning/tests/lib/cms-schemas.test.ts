import { describe, expect, it } from "vitest"

import { parseConceptDraftFormInput } from "@/lib/cms/schemas/concept-draft-schema"
import { parseConceptEditorFormInput } from "@/lib/cms/schemas/concept-editor-schema"
import { parseCourseFormInput } from "@/lib/cms/schemas/course-schema"
import { parseUnitFormInput } from "@/lib/cms/schemas/unit-schema"

describe("CMS schema parsing", () => {
  it("parses course input with trimmed values", () => {
    const result = parseCourseFormInput({
      title: " Grade 12 Mathematics ",
      description: " Core exam prep ",
      authorId: " writer_1 ",
      slug: " grade-12-math ",
    })

    expect(result).toEqual({
      success: true,
      data: {
        title: "Grade 12 Mathematics",
        description: "Core exam prep",
        authorId: "writer_1",
        slug: "grade-12-math",
      },
    })
  })

  it("rejects invalid unit order", () => {
    const result = parseUnitFormInput({
      courseId: "course_1",
      title: "Functions",
      order: "0",
      slug: "functions",
    })

    expect(result).toEqual({
      success: false,
      message: "Please correct the highlighted fields and try again.",
      statusCode: 400,
      fieldErrors: {
        order: ["Unit order must be a positive whole number."],
      },
    })
  })

  it("parses concept draft input", () => {
    const result = parseConceptDraftFormInput({
      unitId: " unit_1 ",
      title: " Limits ",
      slug: " limits ",
    })

    expect(result).toEqual({
      success: true,
      data: {
        unitId: "unit_1",
        title: "Limits",
        slug: "limits",
      },
    })
  })

  it("rejects duplicate chunk and worked example order values", () => {
    const result = parseConceptEditorFormInput({
      conceptId: "concept_1",
      unitId: "unit_1",
      title: "Limits",
      slug: "limits",
      description: "",
      contentBody: "",
      unlockThreshold: "0.9",
      pLo: "0.15",
      pT: "0.1",
      pG: "0.2",
      pS: "0.1",
      decayLambda: "0.01",
      prerequisiteConceptIds: [],
      chunks: [
        {
          id: "",
          title: "Chunk A",
          slug: "chunk-a",
          bodyMd: "Body A",
          order: 1,
        },
        {
          id: "",
          title: "Chunk B",
          slug: "chunk-b",
          bodyMd: "Body B",
          order: 1,
        },
      ],
      workedExamples: [
        {
          id: "",
          title: "Example A",
          slug: "example-a",
          problemMd: "Problem A",
          solutionMd: "Solution A",
          order: 2,
        },
        {
          id: "",
          title: "Example B",
          slug: "example-b",
          problemMd: "Problem B",
          solutionMd: "Solution B",
          order: 2,
        },
      ],
      authorId: "writer_1",
    })

    expect(result).toEqual({
      success: false,
      message: "Please correct the highlighted fields and try again.",
      statusCode: 400,
      fieldErrors: {
        "chunks.0.order": ["Chunk order values must be unique."],
        "chunks.1.order": ["Chunk order values must be unique."],
        "workedExamples.0.order": ["Worked example order values must be unique."],
        "workedExamples.1.order": ["Worked example order values must be unique."],
      },
    })
  })
})
