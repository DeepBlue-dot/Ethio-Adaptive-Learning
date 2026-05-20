import { redirect } from "next/navigation"

export function textField(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName)
  return typeof value === "string" ? value : null
}

export function sanitizeAdminPath(pathname: string | null | undefined, fallback: string) {
  if (!pathname || !pathname.startsWith("/admin/")) {
    return fallback
  }

  return pathname
}

export function getReturnTo(formData: FormData, fallback: string) {
  return sanitizeAdminPath(textField(formData, "returnTo"), fallback)
}

export function redirectWithMessage(pathname: string, key: "msg" | "status" | "error", message: string): never {
  const [basePath, search = ""] = pathname.split("?")
  const params = new URLSearchParams(search)

  params.set(key, message)

  redirect(`${basePath}?${params.toString()}`)
}

export function parseJsonField(formData: FormData, fieldName: string) {
  const rawValue = textField(formData, fieldName)

  if (!rawValue) {
    return []
  }

  try {
    return JSON.parse(rawValue)
  } catch {
    return new Error(`${fieldName} payload is invalid.`)
  }
}

export function textareaLines(formData: FormData, fieldName: string) {
  const value = textField(formData, fieldName)

  if (!value) {
    return null
  }

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export function enumField<TEnum extends Record<string, string>>(
  formData: FormData,
  fieldName: string,
  enumObject: TEnum
) {
  const value = textField(formData, fieldName)

  if (!value || !Object.values(enumObject).includes(value)) {
    throw new Error(`${fieldName} is invalid.`)
  }

  return value as TEnum[keyof TEnum]
}

export function getErrorMessage(
  error: unknown,
  fallback = "Unable to save curriculum changes right now."
) {
  return error instanceof Error ? error.message : fallback
}
