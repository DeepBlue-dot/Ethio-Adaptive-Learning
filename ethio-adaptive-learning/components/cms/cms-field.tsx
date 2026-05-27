"use client"

import { CmsFieldErrors } from "@/components/cms/cms-feedback"
import { CmsContentBlockEditor } from "@/components/cms/cms-content-block-editor"
import { CmsReferencePicker } from "@/components/cms/cms-reference-picker"
import type { CmsField, CmsReferenceOptions } from "@/lib/cms/types"

const inputClassName =
  "mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline focus:border-primary focus:ring-4 focus:ring-primary/10"
const textareaClassName = `${inputClassName} min-h-32 resize-y leading-relaxed`
const selectClassName = `${inputClassName} cursor-pointer`

export function CmsFieldInput({
  errors = {},
  field,
  referenceOptions,
  userRole,
  value,
  onChange,
}: {
  errors?: Record<string, string[]>
  field: CmsField
  referenceOptions: CmsReferenceOptions
  userRole: string
  value: unknown
  onChange?: (value: unknown) => void
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
    <div className={`space-y-1 ${isLongField ? "lg:col-span-2" : ""}`}>
      <div className="flex items-center justify-between">
        <label 
          htmlFor={field.name}
          className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80 px-1"
        >
          {field.label}
        </label>
        {isReadOnly && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60 px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10">
            Read Only
          </span>
        )}
      </div>

      {isReadOnly ? (
        <div className="mt-2 rounded-xl border border-dashed border-outline-variant bg-surface-container px-4 py-3 text-sm text-on-surface-variant/70 min-h-[46px] flex items-center">
          {toInputValue(value) || <span className="italic opacity-40">No value</span>}
          {/* Still include hidden input so the value persists on save if not changed */}
          <input type="hidden" name={field.name} id={field.name} value={toInputValue(value)} />
        </div>
      ) : (
        renderFieldControl(field, value, referenceOptions, onChange)
      )}
      
      {field.description ? (
        <p className="mt-1.5 px-1 text-[11px] leading-relaxed text-on-surface-variant/60">
          {field.description}
        </p>
      ) : null}
      
      <CmsFieldErrors errors={errors} path={field.name} />
    </div>
  )
}

function renderFieldControl(
  field: CmsField, 
  value: unknown, 
  referenceOptions: CmsReferenceOptions,
  onChange?: (value: unknown) => void
) {
  if (field.type === "textarea" || field.type === "markdown") {
    return (
      <textarea
        className={textareaClassName}
        defaultValue={onChange ? undefined : toInputValue(value)}
        value={onChange ? toInputValue(value) : undefined}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        name={field.name}
        id={field.name}
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
        defaultValue={onChange ? undefined : toInputValue(value)}
        value={onChange ? toInputValue(value) : undefined}
        onChange={onChange ? (e) => {
          const val = e.target.value === "" ? null : Number(e.target.value)
          onChange(val)
        } : undefined}
        max={field.max ?? (isProb ? 1 : undefined)}
        min={field.min ?? (isProb ? 0 : 1)}
        name={field.name}
        id={field.name}
        placeholder={field.placeholder}
        step={field.step ?? (isProb ? "0.01" : "1")}
        type="number"
      />
    )
  }

  if (field.type === "select") {
    return (
      <select 
        className={selectClassName} 
        defaultValue={onChange ? undefined : toInputValue(value)}
        value={onChange ? toInputValue(value) : undefined}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        name={field.name}
        id={field.name}
      >
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
        defaultValue={onChange ? undefined : toInputValue(value)}
        value={onChange ? (toInputValue(value) as string) : undefined}
        onChange={onChange ? (val) => onChange(val) : undefined}
        name={field.name}
        id={field.name}
        options={referenceOptions[field.name] ?? []}
      />
    )
  }

  if (field.type === "multi-reference") {
    return (
      <CmsReferencePicker
        defaultValue={onChange ? undefined : (Array.isArray(value) ? value.map(String) : [])}
        value={onChange ? (Array.isArray(value) ? value.map(String) : []) : undefined}
        onChange={onChange ? (val) => onChange(val) : undefined}
        multiple
        name={field.name}
        id={field.name}
        options={referenceOptions[field.name] ?? []}
      />
    )
  }

  return (
    <input
      className={inputClassName}
      defaultValue={onChange ? undefined : toInputValue(value)}
      value={onChange ? toInputValue(value) : undefined}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      name={field.name}
      id={field.name}
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
