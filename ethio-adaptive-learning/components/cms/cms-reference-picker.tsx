"use client"

import type { CmsReferenceOption } from "@/lib/cms/types"

const selectClassName =
  "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-600"

export function CmsReferencePicker({
  defaultValue,
  multiple = false,
  name,
  options,
}: {
  defaultValue?: string | string[]
  multiple?: boolean
  name: string
  options: CmsReferenceOption[]
}) {
  return (
    <select
      className={`${selectClassName} ${multiple ? "min-h-44" : ""}`}
      defaultValue={defaultValue}
      multiple={multiple}
      name={name}
    >
      {!multiple ? <option value="">Select an option</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
