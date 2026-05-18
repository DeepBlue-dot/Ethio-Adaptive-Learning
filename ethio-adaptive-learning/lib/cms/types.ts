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
}

export const initialCmsActionState: CmsActionState = {
  ok: false,
  message: null,
  statusCode: null,
  fieldErrors: {},
}
