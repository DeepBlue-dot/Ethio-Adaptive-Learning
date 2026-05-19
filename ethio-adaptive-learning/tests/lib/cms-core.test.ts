import { describe, expect, it } from "vitest"

import { conceptDefinition } from "@/lib/cms/definitions/concept"
import {
  getCmsContentType,
  resolveCmsContentType,
} from "@/lib/cms/registry"
import {
  getCmsRevalidationPaths,
  parseCmsFormData,
} from "@/lib/cms/validation"

describe("CMS core registry and validation", () => {
  it("resolves canonical content types and aliases", () => {
    expect(getCmsContentType("question").key).toBe("question")
    expect(resolveCmsContentType("questions")?.key).toBe("question")
    expect(resolveCmsContentType("media-assets")?.key).toBe("media-asset")
    expect(resolveCmsContentType("chunks")).toBeUndefined()
    expect(resolveCmsContentType("missing")).toBeUndefined()
  })

  it("parses metadata-driven concept forms and flattens nested field errors", () => {
    const formData = new FormData()

    formData.set("unitId", "unit_1")
    formData.set("title", "Limits")
    formData.set("slug", "limits")
    formData.set("unlockThreshold", "0.9")
    formData.set("pLo", "0.15")
    formData.set("pT", "0.1")
    formData.set("pG", "0.2")
    formData.set("pS", "0.1")
    formData.set("decayLambda", "0.01")
    formData.set("contentBlocks", "{")

    const result = parseCmsFormData(conceptDefinition, formData, "writer_1")

    expect(result).toEqual({
      success: false,
      message: "contentBlocks payload is invalid.",
      statusCode: 400,
      fieldErrors: {
        contentBlocks: ["contentBlocks payload is invalid."],
      },
    })
  })

  it("computes type-specific revalidation paths", () => {
    const paths = getCmsRevalidationPaths(conceptDefinition, {
      action: "update",
      contentType: "concept",
      id: "concept_1",
      result: {
        id: "concept_1",
        type: "concept",
        title: "Limits",
        data: {},
      },
    })

    expect(paths).toContain("/admin/cms/concept")
    expect(paths).toContain("/admin/cms/question")
    expect(paths).toContain("/concepts")
    expect(paths).toContain("/learn/concept_1")
  })
})
