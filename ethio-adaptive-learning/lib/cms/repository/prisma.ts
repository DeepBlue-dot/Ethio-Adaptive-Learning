import { formatDistractorsForTextarea } from "@/lib/curriculum/question"
import {
  createCurriculumCmsItem,
  deleteCurriculumCmsItem,
  getCmsAuthors,
  getConceptEditorCmsData,
  updateCurriculumCmsItem,
} from "@/lib/cms/adapters/curriculum"
import type { ContentSnippetCmsInput } from "@/lib/cms/definitions/content-snippet"
import type { MediaAssetCmsInput } from "@/lib/cms/definitions/media-asset"
import { normalizeContentBlocks } from "@/lib/cms/content-blocks"
import { prisma } from "@/lib/prisma"
import { buildFallbackSlug, withNumericSuffix } from "@/lib/slugs"
import type {
  CmsContentTypeKey,
  CmsEntity,
  CmsLifecycle,
  CmsListFilter,
  CmsPublicationStatus,
  CmsReferenceOptions,
  CmsRepository,
} from "@/lib/cms/types"

const CURRICULUM_TYPES = new Set<CmsContentTypeKey>(["course", "unit", "concept", "question"])

export const prismaCmsRepository: CmsRepository = {
  async createItem(type, data) {
    const result = await createCanonicalItem(type, data, {
      status: "PUBLISHED",
      userId: null,
    })
    return getRequiredCmsItem(type, result.id)
  },
  async updateItem(type, id, data) {
    await updateCanonicalItem(type, id, data, {
      status: "PUBLISHED",
      userId: null,
    })
    return getRequiredCmsItem(type, id)
  },
  async saveDraftItem(type, id, data, userId) {
    if (!id) {
      const result = await createCanonicalItem(type, data, {
        status: "DRAFT",
        userId,
      })
      return getRequiredCmsItem(type, result.id)
    }

    const lifecycle = await getCanonicalLifecycle(type, id)

    if (lifecycle.status === "PUBLISHED") {
      await prisma.cmsDraft.upsert({
        where: {
          contentType_entityId: {
            contentType: type,
            entityId: id,
          },
        },
        update: {
          data: data as object,
          updatedById: userId,
        },
        create: {
          contentType: type,
          entityId: id,
          data: data as object,
          createdById: userId,
          updatedById: userId,
        },
      })
      return getRequiredCmsItem(type, id)
    }

    await updateCanonicalItem(type, id, data, {
      status: lifecycle.status,
      userId,
    })
    return getRequiredCmsItem(type, id)
  },
  async publishItem(type, id, data, userId) {
    const result = id
      ? await updateCanonicalItem(type, id, data, {
          status: "PUBLISHED",
          userId,
        })
      : await createCanonicalItem(type, data, {
          status: "PUBLISHED",
          userId,
        })

    await prisma.cmsDraft.deleteMany({
      where: {
        contentType: type,
        entityId: result.id,
      },
    })
    return getRequiredCmsItem(type, result.id)
  },
  async unpublishItem(type, id, userId) {
    await setPublicationState(type, id, "UNPUBLISHED", userId)
    await prisma.cmsDraft.deleteMany({
      where: {
        contentType: type,
        entityId: id,
      },
    })
    return getRequiredCmsItem(type, id)
  },
  async deleteItem(type, id) {
    const entity = await getBaseCmsItem(type, id)

    if (!entity) {
      throw new Error(`${type} not found.`)
    }

    if (entity.lifecycle?.status === "PUBLISHED") {
      throw new Error("Published content must be unpublished before it can be deleted.")
    }

    await prisma.cmsDraft.deleteMany({
      where: {
        contentType: type,
        entityId: id,
      },
    })
    await deleteCanonicalItem(type, id)

    return entity
  },
  getItem: getCmsItem,
  listItems: listCmsItems,
  getReferenceOptions,
}

async function createCanonicalItem(
  type: CmsContentTypeKey,
  data: unknown,
  publication: {
    status: CmsPublicationStatus
    userId: string | null
  }
) {
  if (CURRICULUM_TYPES.has(type)) {
    const result = await createCurriculumCmsItem(type, data)
    await setPublicationState(type, result.id, publication.status, publication.userId)
    return result
  }

  if (type === "media-asset") {
    const input = data as MediaAssetCmsInput
    const asset = await prisma.mediaAsset.create({
      data: {
        kind: input.kind,
        title: input.title,
        alt: input.alt,
        caption: input.caption,
        publicId: input.publicId,
        url: input.url,
        width: input.width,
        height: input.height,
        bytes: input.bytes,
        videoId: input.videoId,
        thumbnailUrl: input.thumbnailUrl,
        createdById: publication.userId,
        ...publicationStateData(publication.status, publication.userId),
      },
    })

    return {
      id: asset.id,
    }
  }

  const input = data as ContentSnippetCmsInput
  const snippet = await prisma.contentSnippet.create({
    data: {
      title: input.title,
      slug: await resolveSnippetSlug(input.title, input.slug),
      contentBlocks: input.contentBlocks,
      authorId: input.authorId,
      ...publicationStateData(publication.status, publication.userId),
    },
  })

  return {
    id: snippet.id,
  }
}

async function updateCanonicalItem(
  type: CmsContentTypeKey,
  id: string,
  data: unknown,
  publication: {
    status: CmsPublicationStatus
    userId: string | null
  }
) {
  if (CURRICULUM_TYPES.has(type)) {
    await updateCurriculumCmsItem(type, id, data)
    await setPublicationState(type, id, publication.status, publication.userId)
    return {
      id,
    }
  }

  if (type === "media-asset") {
    const input = data as MediaAssetCmsInput
    await prisma.mediaAsset.update({
      where: {
        id,
      },
      data: {
        kind: input.kind,
        title: input.title,
        alt: input.alt,
        caption: input.caption,
        publicId: input.publicId,
        url: input.url,
        width: input.width,
        height: input.height,
        bytes: input.bytes,
        videoId: input.videoId,
        thumbnailUrl: input.thumbnailUrl,
        ...publicationStateData(publication.status, publication.userId),
      },
    })
    return {
      id,
    }
  }

  const input = data as ContentSnippetCmsInput
  await prisma.contentSnippet.update({
    where: {
      id,
    },
    data: {
      title: input.title,
      slug: await resolveSnippetSlug(input.title, input.slug, id),
      contentBlocks: input.contentBlocks,
      authorId: input.authorId,
      ...publicationStateData(publication.status, publication.userId),
    },
  })

  return {
    id,
  }
}

async function deleteCanonicalItem(type: CmsContentTypeKey, id: string) {
  if (CURRICULUM_TYPES.has(type)) {
    await deleteCurriculumCmsItem(type, id)
    return
  }

  if (type === "media-asset") {
    await prisma.mediaAsset.delete({
      where: {
        id,
      },
    })
    return
  }

  await prisma.contentSnippet.delete({
    where: {
      id,
    },
  })
}

async function setPublicationState(
  type: CmsContentTypeKey,
  id: string,
  status: CmsPublicationStatus,
  userId: string | null
) {
  const data = publicationStateData(status, userId)

  switch (type) {
    case "course":
      await prisma.course.update({ where: { id }, data })
      return
    case "unit":
      await prisma.unit.update({ where: { id }, data })
      return
    case "concept":
      await prisma.concept.update({ where: { id }, data })
      return
    case "question":
      await prisma.question.update({ where: { id }, data })
      return
    case "media-asset":
      await prisma.mediaAsset.update({ where: { id }, data })
      return
    case "content-snippet":
      await prisma.contentSnippet.update({ where: { id }, data })
      return
  }
}

function publicationStateData(status: CmsPublicationStatus, userId: string | null) {
  if (status === "PUBLISHED") {
    return {
      status,
      publishedAt: new Date(),
      publishedById: userId,
      unpublishedAt: null,
      unpublishedById: null,
    }
  }

  if (status === "UNPUBLISHED") {
    return {
      status,
      unpublishedAt: new Date(),
      unpublishedById: userId,
    }
  }

  return {
    status,
    publishedAt: null,
    publishedById: null,
    unpublishedAt: null,
    unpublishedById: null,
  }
}

async function listCmsItems(type: CmsContentTypeKey, filter: CmsListFilter = {}) {
  const items = await listBaseCmsItems(type, filter)
  return withDraftOverlays(type, items)
}

async function getCmsItem(type: CmsContentTypeKey, id: string) {
  const entity = await getBaseCmsItem(type, id)
  return entity ? withDraftOverlay(type, entity) : null
}

async function getRequiredCmsItem(type: CmsContentTypeKey, id: string) {
  const entity = await getCmsItem(type, id)

  if (!entity) {
    throw new Error(`${type} was saved but could not be loaded.`)
  }

  return entity
}

async function listBaseCmsItems(type: CmsContentTypeKey, filter: CmsListFilter = {}) {
  switch (type) {
    case "course":
      return listCourses()
    case "unit":
      return listUnits(filter)
    case "concept":
      return listConcepts(filter)
    case "question":
      return listQuestions(filter)
    case "media-asset":
      return listMediaAssets()
    case "content-snippet":
      return listContentSnippets()
  }
}

async function getBaseCmsItem(type: CmsContentTypeKey, id: string) {
  switch (type) {
    case "course":
      return getCourseItem(id)
    case "unit":
      return getUnitItem(id)
    case "concept":
      return getConceptItem(id)
    case "question":
      return getQuestionItem(id)
    case "media-asset":
      return getMediaAssetItem(id)
    case "content-snippet":
      return getContentSnippetItem(id)
  }
}

async function listCourses() {
  const courses = await prisma.course.findMany({
    include: {
      author: {
        select: {
          username: true,
        },
      },
      _count: {
        select: {
          units: true,
        },
      },
    },
    orderBy: [
      {
        archivedAt: "asc",
      },
      {
        title: "asc",
      },
    ],
  })

  return courses.map((course) =>
    createEntity(
      "course",
      course.id,
      course.title,
      {
        slug: course.slug,
        title: course.title,
        description: course.description ?? "",
        authorId: course.authorId ?? "",
        authorLabel: course.author?.username ?? "Unassigned",
        archived: course.archivedAt ? "archived" : "active",
        unitCount: course._count.units,
      },
      getLifecycle(course)
    )
  )
}

async function getCourseItem(id: string) {
  const course = await prisma.course.findUnique({
    where: {
      id,
    },
    include: {
      author: {
        select: {
          username: true,
        },
      },
      _count: {
        select: {
          units: true,
        },
      },
    },
  })

  if (!course) {
    return null
  }

  return createEntity(
    "course",
    course.id,
    course.title,
    {
      slug: course.slug,
      title: course.title,
      description: course.description ?? "",
      authorId: course.authorId ?? "",
      authorLabel: course.author?.username ?? "Unassigned",
      archived: course.archivedAt ? "archived" : "active",
      unitCount: course._count.units,
    },
    getLifecycle(course)
  )
}

async function listUnits(filter: CmsListFilter) {
  const units = await prisma.unit.findMany({
    where: {
      courseId: filter.courseId,
    },
    include: {
      course: true,
      _count: {
        select: {
          concepts: true,
        },
      },
    },
    orderBy: [
      {
        course: {
          title: "asc",
        },
      },
      {
        order: "asc",
      },
    ],
  })

  return units.map((unit) =>
    createEntity(
      "unit",
      unit.id,
      unit.title,
      {
        courseId: unit.courseId,
        courseLabel: unit.course.title,
        title: unit.title,
        slug: unit.slug,
        order: unit.order,
        conceptCount: unit._count.concepts,
      },
      getLifecycle(unit)
    )
  )
}

async function getUnitItem(id: string) {
  const unit = await prisma.unit.findUnique({
    where: {
      id,
    },
    include: {
      course: true,
      _count: {
        select: {
          concepts: true,
        },
      },
    },
  })

  if (!unit) {
    return null
  }

  return createEntity(
    "unit",
    unit.id,
    unit.title,
    {
      courseId: unit.courseId,
      courseLabel: unit.course.title,
      title: unit.title,
      slug: unit.slug,
      order: unit.order,
      conceptCount: unit._count.concepts,
    },
    getLifecycle(unit)
  )
}

async function listConcepts(filter: CmsListFilter) {
  const concepts = await prisma.concept.findMany({
    where: {
      unitId: filter.unitId,
      unit: {
        courseId: filter.courseId,
      },
    },
    include: {
      unit: {
        include: {
          course: true,
        },
      },
      _count: {
        select: {
          prerequisiteEdges: true,
          questions: true,
        },
      },
    },
    orderBy: [
      {
        unit: {
          course: {
            title: "asc",
          },
        },
      },
      {
        unit: {
          order: "asc",
        },
      },
      {
        title: "asc",
      },
    ],
  })

  return concepts.map((concept) =>
    createEntity(
      "concept",
      concept.id,
      concept.title,
      {
        unitId: concept.unitId,
        unitLabel: `Unit ${concept.unit.order}: ${concept.unit.title}`,
        courseLabel: concept.unit.course.title,
        title: concept.title,
        slug: concept.slug,
        description: concept.description ?? "",
        contentBlocks: normalizeContentBlocks(concept.contentBlocks),
        unlockThreshold: concept.unlockThreshold,
        pLo: concept.pLo,
        pT: concept.pT,
        pG: concept.pG,
        pS: concept.pS,
        decayLambda: concept.decayLambda,
        prerequisiteCount: concept._count.prerequisiteEdges,
        questionCount: concept._count.questions,
      },
      getLifecycle(concept)
    )
  )
}

async function getConceptItem(id: string) {
  const data = await getConceptEditorCmsData(id)
  const concept = data.concept

  return createEntity(
    "concept",
    concept.id,
    concept.title,
    {
      unitId: concept.unitId,
      unitLabel: `Unit ${concept.unit.order}: ${concept.unit.title}`,
      courseLabel: data.course.title,
      title: concept.title,
      slug: concept.slug,
      description: concept.description ?? "",
      contentBlocks: normalizeContentBlocks(concept.contentBlocks),
      unlockThreshold: concept.unlockThreshold,
      pLo: concept.pLo,
      pT: concept.pT,
      pG: concept.pG,
      pS: concept.pS,
      decayLambda: concept.decayLambda,
      prerequisiteConceptIds: concept.prerequisiteEdges.map((edge) => edge.prerequisiteConceptId),
      questionCount: concept.questions.length,
    },
    getLifecycle(concept)
  )
}

async function listQuestions(filter: CmsListFilter) {
  const questions = await prisma.question.findMany({
    where: {
      conceptId: filter.conceptId,
      concept: {
        unitId: filter.unitId,
        unit: {
          courseId: filter.courseId,
        },
      },
    },
    include: {
      author: {
        select: {
          username: true,
        },
      },
      concept: {
        include: {
          unit: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  })

  return questions
    .sort(sortByConceptPath)
    .map((question) =>
      createEntity(
        "question",
        question.id,
        preview(question.content),
        {
          conceptId: question.conceptId,
          conceptLabel: question.concept.title,
          unitLabel: `Unit ${question.concept.unit.order}: ${question.concept.unit.title}`,
          courseLabel: question.concept.unit.course.title,
          usage: question.usage,
          difficulty: question.difficulty,
          content: question.content,
          correctAnswer: question.correctAnswer,
          distractors: formatDistractorsForTextarea(question.distractors),
          hintText: question.hintText ?? "",
          explanation: question.explanation ?? "",
          slug: question.slug,
          authorLabel: question.author?.username ?? "Unassigned",
        },
        getLifecycle(question)
      )
    )
}

async function getQuestionItem(id: string) {
  const question = await prisma.question.findUnique({
    where: {
      id,
    },
    include: {
      author: {
        select: {
          username: true,
        },
      },
      concept: {
        include: {
          unit: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  })

  if (!question) {
    return null
  }

  return createEntity(
    "question",
    question.id,
    preview(question.content),
    {
      conceptId: question.conceptId,
      conceptLabel: question.concept.title,
      unitLabel: `Unit ${question.concept.unit.order}: ${question.concept.unit.title}`,
      courseLabel: question.concept.unit.course.title,
      usage: question.usage,
      difficulty: question.difficulty,
      content: question.content,
      correctAnswer: question.correctAnswer,
      distractors: formatDistractorsForTextarea(question.distractors),
      hintText: question.hintText ?? "",
      explanation: question.explanation ?? "",
      slug: question.slug,
      authorLabel: question.author?.username ?? "Unassigned",
    },
    getLifecycle(question)
  )
}

async function listMediaAssets() {
  const assets = await prisma.mediaAsset.findMany({
    orderBy: [
      {
        kind: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  })

  return assets.map((asset) =>
    createEntity(
      "media-asset",
      asset.id,
      asset.title ?? asset.videoId ?? asset.publicId ?? "Untitled media",
      serializeMediaAsset(asset),
      getLifecycle(asset)
    )
  )
}

async function getMediaAssetItem(id: string) {
  const asset = await prisma.mediaAsset.findUnique({
    where: {
      id,
    },
  })

  if (!asset) {
    return null
  }

  return createEntity(
    "media-asset",
    asset.id,
    asset.title ?? asset.videoId ?? asset.publicId ?? "Untitled media",
    serializeMediaAsset(asset),
    getLifecycle(asset)
  )
}

async function listContentSnippets() {
  const snippets = await prisma.contentSnippet.findMany({
    include: {
      author: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      title: "asc",
    },
  })

  return snippets.map((snippet) =>
    createEntity(
      "content-snippet",
      snippet.id,
      snippet.title,
      serializeSnippet(snippet),
      getLifecycle(snippet)
    )
  )
}

async function getContentSnippetItem(id: string) {
  const snippet = await prisma.contentSnippet.findUnique({
    where: {
      id,
    },
    include: {
      author: {
        select: {
          username: true,
        },
      },
    },
  })

  if (!snippet) {
    return null
  }

  return createEntity(
    "content-snippet",
    snippet.id,
    snippet.title,
    serializeSnippet(snippet),
    getLifecycle(snippet)
  )
}

async function getReferenceOptions(type: CmsContentTypeKey, id?: string): Promise<CmsReferenceOptions> {
  const [authors, courses, units, concepts, questions, assets, snippets] = await Promise.all([
    getCmsAuthors(),
    prisma.course.findMany({
      orderBy: [
        {
          archivedAt: "asc",
        },
        {
          title: "asc",
        },
      ],
    }),
    prisma.unit.findMany({
      include: {
        course: true,
      },
      orderBy: [
        {
          course: {
            title: "asc",
          },
        },
        {
          order: "asc",
        },
      ],
    }),
    prisma.concept.findMany({
      include: {
        unit: {
          include: {
            course: true,
          },
        },
      },
      orderBy: [
        {
          unit: {
            course: {
              title: "asc",
            },
          },
        },
        {
          unit: {
            order: "asc",
          },
        },
        {
          title: "asc",
        },
      ],
    }),
    prisma.question.findMany({
      where: {
        status: "PUBLISHED",
      },
      include: {
        concept: true,
      },
      orderBy: {
        content: "asc",
      },
    }),
    prisma.mediaAsset.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.contentSnippet.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        title: "asc",
      },
    }),
  ])

  const referenceOptions: CmsReferenceOptions = {
    authorId: [
      {
        label: "Unassigned",
        value: "",
      },
      ...authors.map((author) => ({
        label: `${author.username} (${author.role.replace("_", " ")})`,
        value: author.id,
      })),
    ],
    courseId: courses.map((course) => ({
      label: course.archivedAt ? `${course.title} (archived)` : course.title,
      value: course.id,
      description: course.slug,
    })),
    unitId: units.map((unit) => ({
      label: `${unit.course.title} / Unit ${unit.order}: ${unit.title}`,
      value: unit.id,
      description: unit.slug,
    })),
    conceptId: concepts.map((concept) => ({
      label: `${concept.unit.course.title} / Unit ${concept.unit.order}: ${concept.unit.title} / ${concept.title}`,
      value: concept.id,
      description: concept.slug,
    })),
    prerequisiteConceptIds: concepts.map((concept) => ({
      label: `${concept.unit.course.title} / Unit ${concept.unit.order}: ${concept.unit.title} / ${concept.title}`,
      value: concept.id,
      description: concept.slug,
    })),
    questionId: questions.map((question) => ({
      label: `${question.concept.title} / ${preview(question.content)}`,
      value: question.id,
      description: question.usage,
    })),
    assetId: assets.map((asset) => ({
      label: asset.title ?? asset.videoId ?? asset.publicId ?? "Untitled media",
      value: asset.id,
      description: asset.kind,
    })),
    snippetId: snippets.map((snippet) => ({
      label: snippet.title,
      value: snippet.id,
      description: snippet.slug,
    })),
  }

  if (type === "concept" && id) {
    const conceptEditorData = await getConceptEditorCmsData(id)
    referenceOptions.unitId = conceptEditorData.unitOptions.map((unit) => ({
      label: `Unit ${unit.order}: ${unit.title}`,
      value: unit.id,
    }))
    referenceOptions.prerequisiteConceptIds = conceptEditorData.prerequisiteOptions.map((concept) => ({
      label: `Unit ${concept.unitOrder}: ${concept.unitTitle} / ${concept.title}`,
      value: concept.id,
      description: concept.slug,
    }))
  }

  return referenceOptions
}

async function withDraftOverlays(type: CmsContentTypeKey, items: CmsEntity[]) {
  if (!items.length) {
    return items
  }

  const drafts = await prisma.cmsDraft.findMany({
    where: {
      contentType: type,
      entityId: {
        in: items.map((item) => item.id),
      },
    },
  })
  const draftByEntityId = new Map(drafts.map((draft) => [draft.entityId, draft.data]))

  return items.map((item) => overlayDraft(item, draftByEntityId.get(item.id)))
}

async function withDraftOverlay(type: CmsContentTypeKey, item: CmsEntity) {
  const draft = await prisma.cmsDraft.findUnique({
    where: {
      contentType_entityId: {
        contentType: type,
        entityId: item.id,
      },
    },
  })

  return overlayDraft(item, draft?.data)
}

function overlayDraft(item: CmsEntity, draftData: unknown): CmsEntity {
  if (!draftData || typeof draftData !== "object" || Array.isArray(draftData)) {
    return item
  }

  return {
    ...item,
    lifecycle: item.lifecycle
      ? {
          ...item.lifecycle,
          hasDraft: true,
        }
      : undefined,
    data: {
      ...item.data,
      ...(draftData as Record<string, unknown>),
    },
  }
}

async function getCanonicalLifecycle(type: CmsContentTypeKey, id: string): Promise<CmsLifecycle> {
  const entity = await getBaseCmsItem(type, id)

  if (!entity?.lifecycle) {
    throw new Error(`${type} not found.`)
  }

  return entity.lifecycle
}

function getLifecycle(record: {
  status: CmsPublicationStatus
  publishedAt: Date | null
  publishedById: string | null
  unpublishedAt: Date | null
  unpublishedById: string | null
}): CmsLifecycle {
  return {
    status: record.status,
    hasDraft: false,
    publishedAt: record.publishedAt,
    publishedById: record.publishedById,
    unpublishedAt: record.unpublishedAt,
    unpublishedById: record.unpublishedById,
  }
}

function createEntity<TData extends Record<string, unknown>>(
  type: CmsContentTypeKey,
  id: string,
  title: string,
  data: TData,
  lifecycle?: CmsLifecycle
): CmsEntity<TData> {
  return {
    id,
    type,
    title,
    data,
    lifecycle,
  }
}

function serializeMediaAsset(asset: {
  kind: string
  title: string | null
  alt: string | null
  caption: string | null
  publicId: string | null
  url: string | null
  width: number | null
  height: number | null
  bytes: number | null
  videoId: string | null
  thumbnailUrl: string | null
}) {
  return {
    kind: asset.kind,
    title: asset.title ?? "",
    alt: asset.alt ?? "",
    caption: asset.caption ?? "",
    publicId: asset.publicId ?? "",
    url: asset.url ?? "",
    width: asset.width ?? "",
    height: asset.height ?? "",
    bytes: asset.bytes ?? "",
    videoId: asset.videoId ?? "",
    thumbnailUrl: asset.thumbnailUrl ?? "",
  }
}

function serializeSnippet(snippet: {
  slug: string
  title: string
  contentBlocks: unknown
  authorId: string | null
  author?: {
    username: string
  } | null
}) {
  const contentBlocks = normalizeContentBlocks(snippet.contentBlocks)

  return {
    slug: snippet.slug,
    title: snippet.title,
    contentBlocks,
    blockCount: contentBlocks.length,
    authorId: snippet.authorId ?? "",
    authorLabel: snippet.author?.username ?? "Unassigned",
  }
}

async function resolveSnippetSlug(title: string, slug?: string | null, excludeId?: string) {
  const baseSlug = buildFallbackSlug(slug?.trim() || title, "snippet")

  for (let suffix = 1; suffix < 100; suffix += 1) {
    const candidate = withNumericSuffix(baseSlug, suffix)
    const existing = await prisma.contentSnippet.findFirst({
      where: {
        slug: candidate,
        ...(excludeId
          ? {
              NOT: {
                id: excludeId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    })

    if (!existing) {
      return candidate
    }
  }

  throw new Error("Unable to generate a unique snippet slug.")
}

function preview(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim()
  return normalized.length > 90 ? `${normalized.slice(0, 90)}...` : normalized
}

function sortByConceptPath<
  TQuestion extends {
    content: string
    concept: {
      title: string
      unit: {
        order: number
        title: string
        course: {
          title: string
        }
      }
    }
  },
>(left: TQuestion, right: TQuestion) {
  const courseSort = left.concept.unit.course.title.localeCompare(right.concept.unit.course.title)

  if (courseSort !== 0) {
    return courseSort
  }

  const unitSort = left.concept.unit.order - right.concept.unit.order

  if (unitSort !== 0) {
    return unitSort
  }

  const conceptSort = left.concept.title.localeCompare(right.concept.title)

  if (conceptSort !== 0) {
    return conceptSort
  }

  return left.content.localeCompare(right.content)
}
