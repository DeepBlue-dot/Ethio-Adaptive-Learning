import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { Prisma, PrismaClient } from "@prisma/client"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DEFAULT_CONTENT_ROOT = path.resolve(__dirname, "../content/grade12-math")

const DIFFICULTY_TIERS = new Set(["EASY", "MEDIUM", "HARD"])
const QUESTION_USAGES = new Set(["PRACTICE", "CHECKPOINT", "EXAM"])

export async function importGrade12Math({
  prisma,
  contentRoot = DEFAULT_CONTENT_ROOT,
  authorId = null,
  logger = console,
} = {}) {
  if (!prisma) {
    throw new Error("A Prisma client instance is required for Grade 12 Math import.")
  }

  const pack = await loadGrade12MathContentPack(contentRoot)
  validateGrade12MathContentPack(pack)

  const result = await prisma.$transaction(async (tx) => {
    const course = await tx.course.upsert({
      where: {
        slug: pack.slug,
      },
      update: {
        title: pack.title,
        description: pack.description,
        archivedAt: null,
        ...withAuthor(authorId),
      },
      create: {
        slug: pack.slug,
        title: pack.title,
        description: pack.description,
        ...withAuthor(authorId),
      },
      select: {
        id: true,
        slug: true,
      },
    })

    const conceptIdsByReference = new Map()
    const desiredUnitSlugs = new Set()
    const desiredConceptSlugsByUnitId = new Map()

    for (const unitPack of pack.units) {
      desiredUnitSlugs.add(unitPack.slug)

      const unit = await tx.unit.upsert({
        where: {
          courseId_slug: {
            courseId: course.id,
            slug: unitPack.slug,
          },
        },
        update: {
          title: unitPack.title,
          order: unitPack.order,
        },
        create: {
          courseId: course.id,
          slug: unitPack.slug,
          title: unitPack.title,
          order: unitPack.order,
        },
        select: {
          id: true,
          slug: true,
        },
      })

      desiredConceptSlugsByUnitId.set(
        unit.id,
        new Set(unitPack.concepts.map((conceptPack) => conceptPack.slug))
      )

      for (const conceptPack of unitPack.concepts) {
        const concept = await tx.concept.upsert({
          where: {
            unitId_slug: {
              unitId: unit.id,
              slug: conceptPack.slug,
            },
          },
          update: {
            title: conceptPack.title,
            description: conceptPack.description,
            contentBody: conceptPack.overviewBody,
            unlockThreshold: conceptPack.unlockThreshold,
            pLo: conceptPack.pLo,
            pT: conceptPack.pT,
            pG: conceptPack.pG,
            pS: conceptPack.pS,
            decayLambda: conceptPack.decayLambda,
          },
          create: {
            unitId: unit.id,
            slug: conceptPack.slug,
            title: conceptPack.title,
            description: conceptPack.description,
            contentBody: conceptPack.overviewBody,
            unlockThreshold: conceptPack.unlockThreshold,
            pLo: conceptPack.pLo,
            pT: conceptPack.pT,
            pG: conceptPack.pG,
            pS: conceptPack.pS,
            decayLambda: conceptPack.decayLambda,
          },
          select: {
            id: true,
            slug: true,
          },
        })

        conceptIdsByReference.set(conceptPack.reference, concept.id)

        await syncConceptChunks(tx, concept.id, conceptPack.chunks, authorId)
        await syncWorkedExamples(tx, concept.id, conceptPack.workedExamples, authorId)
        await syncQuestions(tx, concept.id, conceptPack.questions, authorId)
      }
    }

    await pruneRemovedConcepts(tx, {
      courseId: course.id,
      desiredConceptSlugsByUnitId,
    })
    await pruneRemovedUnits(tx, {
      courseId: course.id,
      desiredUnitSlugs,
    })

    for (const unitPack of pack.units) {
      for (const conceptPack of unitPack.concepts) {
        const dependentConceptId = conceptIdsByReference.get(conceptPack.reference)

        if (!dependentConceptId) {
          throw new Error(`Import could not resolve concept id for ${conceptPack.reference}.`)
        }

        const prerequisiteConceptIds = [
          ...new Set(
            conceptPack.prerequisites.map((reference) => {
              const prerequisiteConceptId = conceptIdsByReference.get(reference)

              if (!prerequisiteConceptId) {
                throw new Error(
                  `Concept ${conceptPack.reference} references unknown prerequisite ${reference}.`
                )
              }

              return prerequisiteConceptId
            })
          ),
        ]

        await tx.conceptPrerequisite.deleteMany({
          where: {
            dependentConceptId,
          },
        })

        if (prerequisiteConceptIds.length) {
          await tx.conceptPrerequisite.createMany({
            data: prerequisiteConceptIds.map((prerequisiteConceptId) => ({
              prerequisiteConceptId,
              dependentConceptId,
            })),
          })
        }
      }
    }

    await rebuildConceptClosureForCourse(tx, course.id)

    return {
      courseId: course.id,
      courseSlug: course.slug,
      unitCount: pack.units.length,
      conceptCount: pack.units.reduce((total, unitPack) => total + unitPack.concepts.length, 0),
      questionCount: pack.units.reduce(
        (total, unitPack) =>
          total + unitPack.concepts.reduce((conceptTotal, conceptPack) => conceptTotal + conceptPack.questions.length, 0),
        0
      ),
      conceptIdsByReference: Object.fromEntries(conceptIdsByReference),
    }
  })

  logger.info("Grade 12 Mathematics import complete.", result)

  return result
}

export async function loadGrade12MathContentPack(contentRoot = DEFAULT_CONTENT_ROOT) {
  const courseManifestPath = path.join(contentRoot, "course.json")
  const courseManifest = await readJson(courseManifestPath)

  return {
    slug: requireText(courseManifest.slug, "course.slug"),
    title: requireText(courseManifest.title, "course.title"),
    description: optionalText(courseManifest.description),
    units: await Promise.all(
      (courseManifest.units ?? []).map(async (unitRelativePath) => {
        const unitManifestPath = path.join(contentRoot, unitRelativePath)
        const unitManifest = await readJson(unitManifestPath)
        const unitDir = path.dirname(unitManifestPath)

        return {
          slug: requireText(unitManifest.slug, "unit.slug"),
          title: requireText(unitManifest.title, "unit.title"),
          order: requirePositiveInteger(unitManifest.order, "unit.order"),
          concepts: await Promise.all(
            (unitManifest.concepts ?? []).map(async (conceptRelativePath) => {
              const conceptManifestPath = path.join(unitDir, conceptRelativePath)
              const conceptManifest = await readJson(conceptManifestPath)
              const conceptDir = path.dirname(conceptManifestPath)
              const conceptSlug = requireText(conceptManifest.slug, "concept.slug")
              const unitSlug = requireText(unitManifest.slug, "unit.slug")
              const reference = `${unitSlug}/${conceptSlug}`

              return {
                reference,
                slug: conceptSlug,
                title: requireText(conceptManifest.title, "concept.title"),
                description: optionalText(conceptManifest.description),
                overviewBody: conceptManifest.overview
                  ? optionalText(await readText(path.join(conceptDir, conceptManifest.overview)))
                  : null,
                unlockThreshold: requireProbability(
                  conceptManifest.unlockThreshold,
                  `${reference}.unlockThreshold`
                ),
                pLo: requireProbability(conceptManifest.pLo, `${reference}.pLo`),
                pT: requireProbability(conceptManifest.pT, `${reference}.pT`),
                pG: requireProbability(conceptManifest.pG, `${reference}.pG`),
                pS: requireProbability(conceptManifest.pS, `${reference}.pS`),
                decayLambda: requirePositiveNumber(
                  conceptManifest.decayLambda,
                  `${reference}.decayLambda`
                ),
                prerequisites: (conceptManifest.prerequisites ?? []).map((value) =>
                  requireText(value, `${reference}.prerequisites[]`)
                ),
                chunks: await Promise.all(
                  (conceptManifest.chunks ?? []).map(async (chunkManifest) => ({
                    slug: requireText(chunkManifest.slug, `${reference}.chunks.slug`),
                    title: requireText(chunkManifest.title, `${reference}.chunks.title`),
                    order: requirePositiveInteger(
                      chunkManifest.order,
                      `${reference}.chunks.order`
                    ),
                    bodyMd: requireText(
                      await readText(path.join(conceptDir, chunkManifest.file)),
                      `${reference}.chunks.bodyMd`
                    ),
                  }))
                ),
                workedExamples: await Promise.all(
                  (conceptManifest.workedExamples ?? []).map(async (exampleManifest) => {
                    const markdown = await readText(path.join(conceptDir, exampleManifest.file))
                    const parsed = parseWorkedExampleMarkdown(markdown, reference)

                    return {
                      slug: requireText(
                        exampleManifest.slug,
                        `${reference}.workedExamples.slug`
                      ),
                      title: requireText(
                        exampleManifest.title,
                        `${reference}.workedExamples.title`
                      ),
                      order: requirePositiveInteger(
                        exampleManifest.order,
                        `${reference}.workedExamples.order`
                      ),
                      problemMd: parsed.problemMd,
                      solutionMd: parsed.solutionMd,
                    }
                  })
                ),
                questions: (
                  await readJson(path.join(conceptDir, requireText(conceptManifest.questions, `${reference}.questions`)))
                ).map((questionManifest, index) => ({
                  slug: requireText(
                    questionManifest.slug,
                    `${reference}.questions[${index}].slug`
                  ),
                  usage: requireQuestionUsage(
                    questionManifest.usage,
                    `${reference}.questions[${index}].usage`
                  ),
                  difficulty: requireDifficultyTier(
                    questionManifest.difficulty,
                    `${reference}.questions[${index}].difficulty`
                  ),
                  content: requireText(
                    questionManifest.content,
                    `${reference}.questions[${index}].content`
                  ),
                  correctAnswer: requireText(
                    questionManifest.correctAnswer,
                    `${reference}.questions[${index}].correctAnswer`
                  ),
                  distractors: normalizeStringArray(
                    questionManifest.distractors,
                    `${reference}.questions[${index}].distractors`
                  ),
                  hintText: optionalText(questionManifest.hintText),
                  explanation: optionalText(questionManifest.explanation),
                })),
              }
            })
          ),
        }
      })
    ),
  }
}

function validateGrade12MathContentPack(pack) {
  assertUnique(
    pack.units.map((unitPack) => unitPack.slug),
    "Unit slugs must be unique within the Grade 12 Math course pack."
  )
  assertUnique(
    pack.units.map((unitPack) => unitPack.order),
    "Unit order values must be unique within the Grade 12 Math course pack."
  )

  const knownConceptReferences = new Set()

  for (const unitPack of pack.units) {
    assertUnique(
      unitPack.concepts.map((conceptPack) => conceptPack.slug),
      `Concept slugs must be unique within unit ${unitPack.slug}.`
    )

    for (const conceptPack of unitPack.concepts) {
      if (knownConceptReferences.has(conceptPack.reference)) {
        throw new Error(`Duplicate concept reference detected: ${conceptPack.reference}.`)
      }

      knownConceptReferences.add(conceptPack.reference)

      assertUnique(
        conceptPack.chunks.map((chunk) => chunk.slug),
        `Chunk slugs must be unique within concept ${conceptPack.reference}.`
      )
      assertUnique(
        conceptPack.chunks.map((chunk) => chunk.order),
        `Chunk order must be unique within concept ${conceptPack.reference}.`
      )
      assertUnique(
        conceptPack.workedExamples.map((example) => example.slug),
        `Worked example slugs must be unique within concept ${conceptPack.reference}.`
      )
      assertUnique(
        conceptPack.workedExamples.map((example) => example.order),
        `Worked example order must be unique within concept ${conceptPack.reference}.`
      )
      assertUnique(
        conceptPack.questions.map((question) => question.slug),
        `Question slugs must be unique within concept ${conceptPack.reference}.`
      )
    }
  }

  for (const unitPack of pack.units) {
    for (const conceptPack of unitPack.concepts) {
      for (const prerequisiteReference of conceptPack.prerequisites) {
        if (!knownConceptReferences.has(prerequisiteReference)) {
          throw new Error(
            `Concept ${conceptPack.reference} references missing prerequisite ${prerequisiteReference}.`
          )
        }
      }
    }
  }
}

async function syncConceptChunks(tx, conceptId, chunks, authorId) {
  const desiredSlugs = chunks.map((chunk) => chunk.slug)

  for (const chunk of chunks) {
    await tx.conceptChunk.upsert({
      where: {
        conceptId_slug: {
          conceptId,
          slug: chunk.slug,
        },
      },
      update: {
        title: chunk.title,
        bodyMd: chunk.bodyMd,
        order: chunk.order,
        ...withAuthor(authorId),
      },
      create: {
        conceptId,
        slug: chunk.slug,
        title: chunk.title,
        bodyMd: chunk.bodyMd,
        order: chunk.order,
        ...withAuthor(authorId),
      },
    })
  }

  await tx.conceptChunk.deleteMany({
    where: {
      conceptId,
      ...(desiredSlugs.length
        ? {
            slug: {
              notIn: desiredSlugs,
            },
          }
        : {}),
    },
  })
}

async function syncWorkedExamples(tx, conceptId, workedExamples, authorId) {
  const desiredSlugs = workedExamples.map((example) => example.slug)

  for (const example of workedExamples) {
    await tx.workedExample.upsert({
      where: {
        conceptId_slug: {
          conceptId,
          slug: example.slug,
        },
      },
      update: {
        title: example.title,
        problemMd: example.problemMd,
        solutionMd: example.solutionMd,
        order: example.order,
        ...withAuthor(authorId),
      },
      create: {
        conceptId,
        slug: example.slug,
        title: example.title,
        problemMd: example.problemMd,
        solutionMd: example.solutionMd,
        order: example.order,
        ...withAuthor(authorId),
      },
    })
  }

  await tx.workedExample.deleteMany({
    where: {
      conceptId,
      ...(desiredSlugs.length
        ? {
            slug: {
              notIn: desiredSlugs,
            },
          }
        : {}),
    },
  })
}

async function syncQuestions(tx, conceptId, questions, authorId) {
  const desiredSlugs = questions.map((question) => question.slug)

  for (const question of questions) {
    await tx.question.upsert({
      where: {
        conceptId_slug: {
          conceptId,
          slug: question.slug,
        },
      },
      update: {
        usage: question.usage,
        difficulty: question.difficulty,
        content: question.content,
        correctAnswer: question.correctAnswer,
        distractors: question.distractors ?? Prisma.JsonNull,
        hintText: question.hintText,
        explanation: question.explanation,
        ...withAuthor(authorId),
      },
      create: {
        conceptId,
        slug: question.slug,
        usage: question.usage,
        difficulty: question.difficulty,
        content: question.content,
        correctAnswer: question.correctAnswer,
        distractors: question.distractors ?? Prisma.JsonNull,
        hintText: question.hintText,
        explanation: question.explanation,
        ...withAuthor(authorId),
      },
    })
  }

  const staleQuestions = await tx.question.findMany({
    where: {
      conceptId,
      ...(desiredSlugs.length
        ? {
            slug: {
              notIn: desiredSlugs,
            },
          }
        : {}),
    },
    select: {
      id: true,
    },
  })

  const staleQuestionIds = staleQuestions.map((question) => question.id)

  if (staleQuestionIds.length) {
    await tx.interactionLog.deleteMany({
      where: {
        questionId: {
          in: staleQuestionIds,
        },
      },
    })
    await tx.practiceAttempt.deleteMany({
      where: {
        questionId: {
          in: staleQuestionIds,
        },
      },
    })
    await tx.checkpointAttempt.deleteMany({
      where: {
        questionId: {
          in: staleQuestionIds,
        },
      },
    })
    await tx.examAttempt.deleteMany({
      where: {
        conceptId,
      },
    })
    await tx.question.deleteMany({
      where: {
        id: {
          in: staleQuestionIds,
        },
      },
    })
  }
}

async function pruneRemovedConcepts(tx, { courseId, desiredConceptSlugsByUnitId }) {
  const units = await tx.unit.findMany({
    where: {
      courseId,
      id: {
        in: [...desiredConceptSlugsByUnitId.keys()],
      },
    },
    select: {
      id: true,
    },
  })

  for (const unit of units) {
    const desiredConceptSlugs = [...(desiredConceptSlugsByUnitId.get(unit.id) ?? new Set())]
    const staleConcepts = await tx.concept.findMany({
      where: {
        unitId: unit.id,
        ...(desiredConceptSlugs.length
          ? {
              slug: {
                notIn: desiredConceptSlugs,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    })

    const staleConceptIds = staleConcepts.map((concept) => concept.id)

    if (!staleConceptIds.length) {
      continue
    }

    await deleteConceptDependencies(tx, staleConceptIds)
    await tx.concept.deleteMany({
      where: {
        id: {
          in: staleConceptIds,
        },
      },
    })
  }
}

async function pruneRemovedUnits(tx, { courseId, desiredUnitSlugs }) {
  const staleUnits = await tx.unit.findMany({
    where: {
      courseId,
      ...(desiredUnitSlugs.size
        ? {
            slug: {
              notIn: [...desiredUnitSlugs],
            },
          }
        : {}),
    },
    select: {
      id: true,
    },
  })

  for (const staleUnit of staleUnits) {
    const staleConcepts = await tx.concept.findMany({
      where: {
        unitId: staleUnit.id,
      },
      select: {
        id: true,
      },
    })
    const staleConceptIds = staleConcepts.map((concept) => concept.id)

    if (staleConceptIds.length) {
      await deleteConceptDependencies(tx, staleConceptIds)
      await tx.concept.deleteMany({
        where: {
          id: {
            in: staleConceptIds,
          },
        },
      })
    }

    await tx.unit.delete({
      where: {
        id: staleUnit.id,
      },
    })
  }
}

async function rebuildConceptClosureForCourse(tx, courseId) {
  const concepts = await tx.concept.findMany({
    where: {
      unit: {
        courseId,
      },
    },
    select: {
      id: true,
    },
  })
  const conceptIds = concepts.map((concept) => concept.id)

  await tx.conceptClosure.deleteMany({
    where: {
      OR: [
        {
          ancestorConceptId: {
            in: conceptIds,
          },
        },
        {
          descendantConceptId: {
            in: conceptIds,
          },
        },
      ],
    },
  })

  if (!conceptIds.length) {
    return
  }

  const edges = await tx.conceptPrerequisite.findMany({
    where: {
      dependentConcept: {
        unit: {
          courseId,
        },
      },
    },
    select: {
      prerequisiteConceptId: true,
      dependentConceptId: true,
    },
  })

  const closureRows = buildConceptClosureRows(conceptIds, edges)

  if (closureRows.length) {
    await tx.conceptClosure.createMany({
      data: closureRows,
    })
  }
}

function buildConceptClosureRows(conceptIds, edges) {
  const adjacency = new Map(conceptIds.map((conceptId) => [conceptId, []]))

  for (const edge of edges) {
    const dependents = adjacency.get(edge.prerequisiteConceptId) ?? []
    dependents.push(edge.dependentConceptId)
    adjacency.set(edge.prerequisiteConceptId, dependents)

    if (!adjacency.has(edge.dependentConceptId)) {
      adjacency.set(edge.dependentConceptId, [])
    }
  }

  const rows = []

  for (const ancestorConceptId of conceptIds) {
    const visitedDepths = new Map([[ancestorConceptId, 0]])
    const queue = [{ conceptId: ancestorConceptId, depth: 0 }]

    while (queue.length) {
      const current = queue.shift()

      rows.push({
        ancestorConceptId,
        descendantConceptId: current.conceptId,
        depth: current.depth,
      })

      for (const nextConceptId of adjacency.get(current.conceptId) ?? []) {
        const nextDepth = current.depth + 1
        const previousDepth = visitedDepths.get(nextConceptId)

        if (previousDepth != null && previousDepth <= nextDepth) {
          continue
        }

        visitedDepths.set(nextConceptId, nextDepth)
        queue.push({
          conceptId: nextConceptId,
          depth: nextDepth,
        })
      }
    }
  }

  return rows
}

async function deleteConceptDependencies(tx, conceptIds) {
  if (!conceptIds.length) {
    return
  }

  const questions = await tx.question.findMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
    select: {
      id: true,
    },
  })
  const questionIds = questions.map((question) => question.id)

  await tx.interactionLog.deleteMany({
    where: questionIds.length
      ? {
          OR: [
            {
              conceptId: {
                in: conceptIds,
              },
            },
            {
              questionId: {
                in: questionIds,
              },
            },
          ],
        }
      : {
          conceptId: {
            in: conceptIds,
          },
        },
  })
  await tx.examAttempt.deleteMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
  })
  await tx.practiceAttempt.deleteMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
  })
  await tx.checkpointAttempt.deleteMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
  })
  await tx.userMastery.deleteMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
  })
  await tx.conceptClosure.deleteMany({
    where: {
      OR: [
        {
          ancestorConceptId: {
            in: conceptIds,
          },
        },
        {
          descendantConceptId: {
            in: conceptIds,
          },
        },
      ],
    },
  })
  await tx.conceptPrerequisite.deleteMany({
    where: {
      OR: [
        {
          prerequisiteConceptId: {
            in: conceptIds,
          },
        },
        {
          dependentConceptId: {
            in: conceptIds,
          },
        },
      ],
    },
  })
  await tx.conceptChunk.deleteMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
  })
  await tx.workedExample.deleteMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
  })
  await tx.question.deleteMany({
    where: {
      conceptId: {
        in: conceptIds,
      },
    },
  })
}

function parseWorkedExampleMarkdown(markdown, reference) {
  const sections = {
    problem: [],
    solution: [],
  }
  let activeSection = null

  for (const line of markdown.split(/\r?\n/)) {
    const headingMatch = line.match(/^#{1,6}\s+(Problem|Solution)\s*$/i)

    if (headingMatch) {
      activeSection = headingMatch[1].toLowerCase()
      continue
    }

    if (activeSection) {
      sections[activeSection].push(line)
    }
  }

  const problemMd = sections.problem.join("\n").trim()
  const solutionMd = sections.solution.join("\n").trim()

  if (!problemMd || !solutionMd) {
    throw new Error(
      `Worked example markdown for ${reference} must contain both "# Problem" and "# Solution" sections.`
    )
  }

  return {
    problemMd,
    solutionMd,
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"))
}

async function readText(filePath) {
  return fs.readFile(filePath, "utf8")
}

function withAuthor(authorId) {
  return authorId ? { authorId } : {}
}

function requireText(value, fieldLabel) {
  const normalized = optionalText(value)

  if (!normalized) {
    throw new Error(`${fieldLabel} is required.`)
  }

  return normalized
}

function optionalText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function requirePositiveInteger(value, fieldLabel) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldLabel} must be a positive whole number.`)
  }

  return value
}

function requirePositiveNumber(value, fieldLabel) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldLabel} must be a positive number.`)
  }

  return value
}

function requireProbability(value, fieldLabel) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${fieldLabel} must be between 0 and 1.`)
  }

  return value
}

function normalizeStringArray(value, fieldLabel) {
  if (value == null) {
    return null
  }

  if (!Array.isArray(value)) {
    throw new Error(`${fieldLabel} must be an array of strings.`)
  }

  const normalized = value.map((item) => requireText(item, `${fieldLabel}[]`))

  return normalized.length ? normalized : null
}

function requireDifficultyTier(value, fieldLabel) {
  if (!DIFFICULTY_TIERS.has(value)) {
    throw new Error(`${fieldLabel} must be one of ${[...DIFFICULTY_TIERS].join(", ")}.`)
  }

  return value
}

function requireQuestionUsage(value, fieldLabel) {
  if (!QUESTION_USAGES.has(value)) {
    throw new Error(`${fieldLabel} must be one of ${[...QUESTION_USAGES].join(", ")}.`)
  }

  return value
}

function assertUnique(values, message) {
  const uniqueValues = new Set(values)

  if (uniqueValues.size !== values.length) {
    throw new Error(message)
  }
}

async function resolveImportAuthorId(prisma) {
  if (process.env.GRADE12_MATH_AUTHOR_ID?.trim()) {
    return process.env.GRADE12_MATH_AUTHOR_ID.trim()
  }

  const authorEmail = process.env.GRADE12_MATH_AUTHOR_EMAIL?.trim().toLowerCase()

  if (!authorEmail) {
    return null
  }

  const author = await prisma.user.findUnique({
    where: {
      email: authorEmail,
    },
    select: {
      id: true,
    },
  })

  if (!author) {
    throw new Error(`No user found for GRADE12_MATH_AUTHOR_EMAIL=${authorEmail}.`)
  }

  return author.id
}

async function main() {
  const prisma = new PrismaClient()

  try {
    const authorId = await resolveImportAuthorId(prisma)
    await importGrade12Math({
      prisma,
      authorId,
    })
  } finally {
    await prisma.$disconnect()
  }
}

if (path.resolve(process.argv[1] ?? "") === __filename) {
  main().catch((error) => {
    console.error("Grade 12 Mathematics import failed.", error)
    process.exitCode = 1
  })
}
