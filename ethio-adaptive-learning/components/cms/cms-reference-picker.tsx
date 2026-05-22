"use client"

import type { CmsReferenceOption } from "@/lib/cms/types"

const selectClassName =
  "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-600"

export function CmsReferencePicker({
  defaultValue,
  multiple = false,
  name,
  options,
  value,
  onChange,
}: {
  defaultValue?: string | string[]
  multiple?: boolean
  name: string
  options: CmsReferenceOption[]
  value?: string | string[]
  onChange?: (value: string | string[]) => void
}) {
  return (
    <select
      className={`${selectClassName} ${multiple ? "min-h-44" : ""}`}
      defaultValue={defaultValue}
      value={value}
      onChange={(e) => {
        if (multiple) {
          const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value)
          onChange?.(selectedOptions)
        } else {
          onChange?.(e.target.value)
        }
      }}
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
