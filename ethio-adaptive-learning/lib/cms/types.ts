import type { z } from "zod"

export type CmsValidationResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      message: string
      statusCode: number
      fieldErrors: Record<string, string[]>
    }

export type CmsFieldErrors = Record<string, string[]>

export type CmsActionState = {
  ok: boolean
  message: string | null
  statusCode: number | null
  fieldErrors: CmsFieldErrors
  updatedAt?: number
  entityId?: string
  status?: string
}

export const initialCmsActionState: CmsActionState = {
  ok: false,
  message: null,
  statusCode: null,
  fieldErrors: {},
}

export type CmsContentTypeKey =
  | "course"
  | "unit"
  | "concept"
  | "chunk"
  | "worked-example"
  | "question"
  | "media-asset"
  | "content-snippet"

export type CmsFieldType =
  | "text"
  | "textarea"
  | "markdown"
  | "number"
  | "probability"
  | "select"
  | "reference"
  | "multi-reference"
  | "embedded-list"
  | "content-blocks"
  | "hidden"
  | "preview"

export type CmsFieldOption = {
  label: string
  value: string
}

export type CmsEmbeddedField = Omit<CmsField, "embeddedFields" | "referenceTo" | "visibleIf">

export type CmsVisibilityOperator = "eq" | "ne" | "in" | "nin"

export type CmsVisibilityCondition = {
  field: string
  operator: CmsVisibilityOperator
  value: unknown
}

export type CmsField = {
  name: string
  label: string
  type: CmsFieldType
  required?: boolean
  description?: string
  placeholder?: string
  section?: string
  options?: CmsFieldOption[]
  referenceTo?: CmsContentTypeKey | "author"
  embeddedFields?: CmsEmbeddedField[]
  defaultValue?: string | number | string[] | Record<string, unknown>[]
  listHidden?: boolean
  formHidden?: boolean
  adminOnly?: boolean
  readOnly?: boolean
  min?: number
  max?: number
  step?: number
  visibleIf?: CmsVisibilityCondition
}

export type CmsRelation = {
  name: string
  label: string
  type: "belongsTo" | "references" | "embeds"
  target: CmsContentTypeKey
}

export type CmsListField = {
  name: string
  label: string
}

export type CmsInvalidationContext = {
  contentType: CmsContentTypeKey
  action: "create" | "update" | "delete"
  id?: string
  result?: CmsEntity
}

export type CmsContentType<TInput = unknown> = {
  key: CmsContentTypeKey
  aliases?: string[]
  label: string
  pluralLabel: string
  description: string
  fields: CmsField[]
  listFields: CmsListField[]
  relations?: CmsRelation[]
  schema: z.ZodType<TInput>
  defaultValues?: Record<string, unknown>
  getTitle: (entity: CmsEntity) => string
  getSubtitle?: (entity: CmsEntity) => string | null
  getStatus?: (entity: CmsEntity) => string | null
  getRevalidationPaths?: (context: CmsInvalidationContext) => string[]
}

export type CmsPublicationStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED"

export type CmsLifecycle = {
  status: CmsPublicationStatus
  publishedAt?: string | Date | null
  publishedById?: string | null
  unpublishedAt?: string | Date | null
  unpublishedById?: string | null
  updatedAt?: string | Date | null
}

export type CmsEntity<TData extends Record<string, unknown> = Record<string, unknown>> = {
  id: string
  type: CmsContentTypeKey
  title: string
  subtitle?: string | null
  status?: string | null
  lifecycle?: CmsLifecycle
  data: TData
}

export type CmsListFilter = {
  courseId?: string
  unitId?: string
  conceptId?: string
  authorId?: string
  startDate?: string
  endDate?: string
  query?: string
  status?: string
}

export type CmsListResult = {
  contentType: CmsContentTypeKey
  items: CmsEntity[]
}

export type CmsMutationResult = {
  entity: CmsEntity
  message: string
  revalidationPaths: string[]
}

export type CmsReferenceOption = {
  label: string
  value: string
  description?: string
  metadata?: Record<string, unknown>
}

export type CmsReferenceOptions = Record<string, CmsReferenceOption[]>

export type CmsEditorModel = {
  definition: CmsSerializableContentType
  item: CmsEntity | null
  referenceOptions: CmsReferenceOptions
  returnTo: string
}

export type CmsSerializableContentType = Omit<
  CmsContentType,
  "schema" | "getTitle" | "getSubtitle" | "getStatus" | "getRevalidationPaths"
>



export type CmsRepository = {
  createItem: (type: CmsContentTypeKey, data: unknown) => Promise<CmsEntity>
  updateItem: (type: CmsContentTypeKey, id: string, data: unknown, lastUpdatedAt?: number) => Promise<CmsEntity>
  saveDraftItem?: (
    type: CmsContentTypeKey,
    id: string | null,
    data: unknown,
    userId: string,
    lastUpdatedAt?: number
  ) => Promise<CmsEntity>
  publishItem?: (
    type: CmsContentTypeKey,
    id: string | null,
    data: unknown,
    userId: string,
    lastUpdatedAt?: number
  ) => Promise<CmsEntity>
  unpublishItem?: (type: CmsContentTypeKey, id: string, userId: string) => Promise<CmsEntity>
  deleteItem: (type: CmsContentTypeKey, id: string) => Promise<CmsEntity>
  getItem: (type: CmsContentTypeKey, id: string) => Promise<CmsEntity | null>
  listItems: (type: CmsContentTypeKey, filter?: CmsListFilter) => Promise<CmsEntity[]>
  getReferenceOptions: (type: CmsContentTypeKey, id?: string) => Promise<CmsReferenceOptions>
}
