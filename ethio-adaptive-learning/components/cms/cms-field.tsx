"use client"

import { CmsFieldErrors } from "@/components/cms/cms-feedback"
import { CmsContentBlockEditor } from "@/components/cms/cms-content-block-editor"
import { CmsReferencePicker } from "@/components/cms/cms-reference-picker"
import type { CmsField, CmsReferenceOptions } from "@/lib/cms/types"

const inputClassName =
  "mt-2 w-full rounded-[1.25rem] border border-outline-variant/60 bg-surface-container-lowest px-5 py-4 text-sm font-bold text-on-surface outline-none transition-all placeholder:text-on-surface-variant/20 hover:border-outline focus:border-primary/40 focus:ring-8 focus:ring-primary/5 shadow-sm"
const textareaClassName = `${inputClassName} min-h-[160px] resize-y leading-relaxed font-medium`
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
    <div className={`space-y-1.5 ${isLongField ? "lg:col-span-2" : ""}`}>
      <div className="flex items-center justify-between px-1">
        <label 
          htmlFor={field.name}
          className="text-[11px] font-black uppercase tracking-[0.15em] text-on-surface-variant/70"
        >
          {field.label}
        </label>
        {isReadOnly && (
          <span className="text-[9px] font-black uppercase tracking-widest text-primary/50 px-2 py-0.5 rounded-lg bg-primary/5 border border-primary/10">
            System Managed
          </span>
        )}
      </div>

      {isReadOnly ? (
        <div className="mt-2 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant/60 min-h-[52px] flex items-center shadow-inner">
          {toInputValue(value) || <span className="italic opacity-30">No value defined</span>}
          {/* Still include hidden input so the value persists on save if not changed */}
          <input type="hidden" name={field.name} id={field.name} value={toInputValue(value)} />
        </div>
      ) : (
        renderFieldControl(field, value, referenceOptions, onChange)
      )}
      
      {field.description ? (
        <p className="mt-2 px-1 text-[11px] leading-relaxed text-on-surface-variant/40 font-medium italic">
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
