export function CmsFeedback({
  message,
  tone,
}: {
  message: string
  tone: "success" | "error"
}) {
  return (
    <div
      className={`rounded-3xl border px-5 py-4 text-sm shadow-sm ${
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900"
      }`}
    >
      {message}
    </div>
  )
}

export function CmsFieldErrors({
  errors,
  path,
}: {
  errors: Record<string, string[]>
  path: string
}) {
  const messages = errors[path]

  if (!messages?.length) {
    return null
  }

  return <p className="mt-2 text-sm text-rose-700">{messages.join(" ")}</p>
}
