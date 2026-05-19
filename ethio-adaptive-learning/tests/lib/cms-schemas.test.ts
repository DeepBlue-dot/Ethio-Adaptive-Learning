import { describe, expect, it } from "vitest"

import { parseConceptDraftFormInput } from "@/lib/cms/schemas/concept-draft-schema"
import { parseConceptEditorFormInput } from "@/lib/cms/schemas/concept-editor-schema"
import { parseCourseFormInput } from "@/lib/cms/schemas/course-schema"
import { parseQuestionFilterInput } from "@/lib/cms/schemas/question-filter-schema"
import { parseQuestionFormInput } from "@/lib/cms/schemas/question-schema"
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

  it("rejects invalid structured content blocks", () => {
    const result = parseConceptEditorFormInput({
      conceptId: "concept_1",
      unitId: "unit_1",
      title: "Limits",
      slug: "limits",
      description: "",
      contentBlocks: JSON.stringify([
        {
          id: "block_1",
          type: "paragraph",
          text: "",
        },
      ]),
      unlockThreshold: "0.9",
      pLo: "0.15",
      pT: "0.1",
      pG: "0.2",
      pS: "0.1",
      decayLambda: "0.01",
      prerequisiteConceptIds: [],
      authorId: "writer_1",
    })

    expect(result).toEqual({
      success: false,
      message: "Please correct the highlighted fields and try again.",
      statusCode: 400,
      fieldErrors: {
        contentBlocks: ["Content blocks contain invalid fields."],
      },
    })
  })

  it("parses question input and normalizes distractor lines", () => {
    const result = parseQuestionFormInput({
      conceptId: " concept_1 ",
      usage: "PRACTICE",
      difficulty: "MEDIUM",
      content: " What is 2 + 2? ",
      correctAnswer: " 4 ",
      distractors: " 1 \n\n 3 \n 5 ",
      hintText: " Think about adding pairs. ",
      explanation: " 2 + 2 equals 4. ",
      authorId: " writer_1 ",
      slug: " add-two-and-two ",
    })

    expect(result).toEqual({
      success: true,
      data: {
        conceptId: "concept_1",
        usage: "PRACTICE",
        difficulty: "MEDIUM",
        content: "What is 2 + 2?",
        correctAnswer: "4",
        distractors: ["1", "3", "5"],
        hintText: "Think about adding pairs.",
        explanation: "2 + 2 equals 4.",
        authorId: "writer_1",
        slug: "add-two-and-two",
      },
    })
  })

  it("rejects invalid question enum values", () => {
    const result = parseQuestionFormInput({
      conceptId: "concept_1",
      usage: "QUIZ",
      difficulty: "LEGENDARY",
      content: "What is 2 + 2?",
      correctAnswer: "4",
      distractors: "",
      hintText: "",
      explanation: "",
      authorId: "writer_1",
      slug: "",
    })

    expect(result).toEqual({
      success: false,
      message: "Please correct the highlighted fields and try again.",
      statusCode: 400,
      fieldErrors: {
        usage: ["Question usage is invalid."],
        difficulty: ["Difficulty tier is invalid."],
      },
    })
  })

  it("parses question bank filters from search params", () => {
    const result = parseQuestionFilterInput({
      courseId: " course_1 ",
      unitId: ["unit_1"],
      conceptId: " concept_1 ",
    })

    expect(result).toEqual({
      success: true,
      data: {
        courseId: "course_1",
        unitId: undefined,
        conceptId: "concept_1",
      },
    })
  })
})
