"use client"

import { CmsFieldErrors } from "@/components/cms/cms-feedback"
import { CmsContentBlockEditor } from "@/components/cms/cms-content-block-editor"
import { CmsReferencePicker } from "@/components/cms/cms-reference-picker"
import type { CmsField, CmsReferenceOptions } from "@/lib/cms/types"

const inputClassName =
  "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-600"
const textareaClassName = `${inputClassName} min-h-28 resize-y`
const selectClassName = inputClassName

export function CmsFieldInput({
  errors,
  field,
  referenceOptions,
  userRole,
  value,
}: {
  errors: Record<string, string[]>
  field: CmsField
  referenceOptions: CmsReferenceOptions
  userRole: string
  value: unknown
}) {
  if (field.type === "hidden" || field.formHidden || field.type === "embedded-list") {
    return null
  }

  // Admin-only fields are hidden for non-admins
  if (field.adminOnly && userRole !== "ADMIN") {
    return null
  }

  if (field.type === "content-blocks") {
    return (
      <CmsContentBlockEditor
        errors={errors}
        name={field.name}
        referenceOptions={referenceOptions}
        value={value}
      />
    )
  }

  const isLongField = field.type === "textarea" || field.type === "markdown" || field.type === "multi-reference"
  const isReadOnly = field.readOnly || (field.adminOnly && userRole !== "ADMIN")

  return (
    <label className={`block text-sm font-medium text-foreground ${isLongField ? "lg:col-span-2" : ""}`}>
      {field.label}
      {isReadOnly ? (
        <div className="mt-2 rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
          {toInputValue(value) || "(Empty)"}
          {/* Still include hidden input so the value persists on save if not changed */}
          <input type="hidden" name={field.name} value={toInputValue(value)} />
        </div>
      ) : (
        renderFieldControl(field, value, referenceOptions)
      )}
      {field.description ? <span className="mt-2 block text-xs text-muted-foreground">{field.description}</span> : null}
      <CmsFieldErrors errors={errors} path={field.name} />
    </label>
  )
}

function renderFieldControl(field: CmsField, value: unknown, referenceOptions: CmsReferenceOptions) {
  if (field.type === "textarea" || field.type === "markdown") {
    return (
      <textarea
        className={textareaClassName}
        defaultValue={toInputValue(value)}
        name={field.name}
        placeholder={field.placeholder}
        rows={field.type === "markdown" ? 8 : 4}
      />
    )
  }

  if (field.type === "number" || field.type === "probability") {
    const isProb = field.type === "probability"
    return (
      <input
        className={inputClassName}
        defaultValue={toInputValue(value)}
        max={field.max ?? (isProb ? 1 : undefined)}
        min={field.min ?? (isProb ? 0 : 1)}
        name={field.name}
        placeholder={field.placeholder}
        step={field.step ?? (isProb ? "0.01" : "1")}
        type="number"
      />
    )
  }

  if (field.type === "select") {
    return (
      <select className={selectClassName} defaultValue={toInputValue(value)} name={field.name}>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === "reference") {
    return (
      <CmsReferencePicker
        defaultValue={toInputValue(value)}
        name={field.name}
        options={referenceOptions[field.name] ?? []}
      />
    )
  }

  if (field.type === "multi-reference") {
    return (
      <CmsReferencePicker
        defaultValue={Array.isArray(value) ? value.map(String) : []}
        multiple
        name={field.name}
        options={referenceOptions[field.name] ?? []}
      />
    )
  }

  return (
    <input
      className={inputClassName}
      defaultValue={toInputValue(value)}
      name={field.name}
      placeholder={field.placeholder}
    />
  )
}

function toInputValue(value: unknown) {
  if (typeof value === "number") {
    return String(value)
  }

  if (typeof value === "string") {
    return value
  }

  return ""
}
