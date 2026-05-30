"use client"

import { useActionState, useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Monitor, Eye } from "lucide-react"

import { saveCmsItem } from "@/app/(admin)/admin/studio/actions"
import { CmsFeedback } from "@/components/cms/cms-feedback"
import { CmsFieldInput } from "@/components/cms/cms-field"
import { CmsRelationManager } from "@/components/cms/cms-relation-manager"
import { PublicationControls } from "@/components/cms/publication-controls"
import { Button } from "@/components/ui/button"
import {
  initialCmsActionState,
  type CmsActionState,
  type CmsEntity,
  type CmsReferenceOptions,
  type CmsSerializableContentType,
} from "@/lib/cms/types"
import { cn } from "@/lib/utils"

type EmbeddedLists = Record<string, Array<Record<string, string | number | null | undefined>>>

export function CmsForm({
  definition,
  item,
  referenceOptions,
  returnTo,
  userRole,
  initialState,
  showHeader = false,
}: {
  definition: CmsSerializableContentType
  item: CmsEntity | null
  referenceOptions: CmsReferenceOptions
  returnTo: string
  userRole: string
  initialState?: CmsActionState
  showHeader?: boolean
}) {
  const [state, formAction, isPending] = useActionState(saveCmsItem, initialState ?? initialCmsActionState)
  
  // High-fidelity lifecycle state tracking
  const [lifecycle, setLifecycle] = useState({
    status: item?.lifecycle?.status || "DRAFT",
    updatedAt: item?.lifecycle?.updatedAt ? new Date(item.lifecycle.updatedAt).getTime() : null,
  })

  // Sync lifecycle with server response
  useEffect(() => {
    if (state.ok) {
      setLifecycle((prev) => ({
        ...prev,
        status: (state.status as any) || prev.status,
        updatedAt: state.updatedAt || prev.updatedAt,
      }))
    }
  }, [state.ok, state.status, state.updatedAt])

  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    return {
      ...(definition.defaultValues ?? {}),
      ...(item?.data ?? {}),
    }
  })

  const [embeddedLists, setEmbeddedLists] = useState<EmbeddedLists>(() => {
    const initialLists: EmbeddedLists = {}
    for (const field of definition.fields) {
      if (field.type === "embedded-list") {
        const value = formData[field.name] ?? []
        initialLists[field.name] = Array.isArray(value) ? (value as EmbeddedLists[string]) : []
      }
    }
    return initialLists
  })

  const updateField = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Filter fields based on declarative visibility logic
  const visibleFields = definition.fields.filter((field) => {
    if (!field.visibleIf) return true
    
    const { field: targetField, operator, value: expectedValue } = field.visibleIf
    const actualValue = formData[targetField]

    switch (operator) {
      case "eq":
        return actualValue === expectedValue
      case "ne":
        return actualValue !== expectedValue
      case "in":
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue)
      case "nin":
        return Array.isArray(expectedValue) && !expectedValue.includes(actualValue)
      default:
        return true
    }
  })

  const fieldsBySection = groupFieldsBySection(visibleFields)
  const formId = "cms-editor-form"
  const isPublished = lifecycle.status === "PUBLISHED"
  const supportsPreview = ["concept", "question", "course"].includes(definition.key)

  return (
    <div className={cn("flex flex-col h-full", showHeader && "bg-surface-container-lowest")}>
      {showHeader && (
        <header className="h-16 border-b border-outline-variant bg-surface/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-6">
            <Link 
              href={returnTo}
              className="group flex items-center gap-3 text-on-surface-variant hover:text-primary transition-all"
            >
              <div className="size-8 rounded-xl border border-outline-variant flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                <ArrowLeft className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 leading-none">Exit</span>
                <span className="text-xs font-bold leading-none mt-0.5">Editor</span>
              </div>
            </Link>
            
            <div className="h-6 w-px bg-outline-variant/60" />
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] opacity-80">
                {definition.label}
              </span>
              <span className="text-outline-variant">•</span>
              <h1 className="text-sm font-bold text-on-surface truncate max-w-[300px]">
                {item?.id ? (formData.title as string || item.title) : `New ${definition.label}`}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {item?.id && supportsPreview && (
                <Button asChild variant="outline" size="sm" className="h-9 rounded-xl text-[10px] font-bold uppercase tracking-wider gap-2 border-outline-variant">
                   <Link href={`/admin/studio/${definition.key}/${item.id}/preview`} target="_blank">
                      <Monitor className="size-3.5" />
                      Preview
                   </Link>
                </Button>
             )}

             {item?.id && definition.key === "concept" && isPublished && (
                <Button asChild variant="ghost" size="sm" className="h-9 rounded-xl text-[10px] font-bold uppercase tracking-wider gap-2">
                   <Link href={`/student/concept/${item.id}/learn`} target="_blank">
                      <Eye className="size-3.5" />
                      Live
                   </Link>
                </Button>
             )}

             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/60 ml-1">
                <div className={cn(
                  "size-1.5 rounded-full",
                  isPublished ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                )} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {lifecycle.status}
                </span>
             </div>
          </div>
        </header>
      )}

      <div className={cn("flex-1 overflow-y-auto custom-scrollbar", showHeader && "max-w-4xl mx-auto py-12 px-8 pb-32")}>
        <form action={formAction} id={formId}>
          <input name="contentType" type="hidden" value={definition.key} />
          <input name="id" type="hidden" value={item?.id ?? ""} />
          <input name="returnTo" type="hidden" value={returnTo} />
          <input
            name="lastUpdatedAt"
            type="hidden"
            value={lifecycle.updatedAt ?? ""}
          />

          {state.message ? (
            <div className="mb-8">
              <CmsFeedback message={state.message} tone={state.ok ? "success" : "error"} />
            </div>
          ) : null}

          <div className="space-y-16">
            {Object.entries(fieldsBySection).map(([section, fields]) => (
              <section key={section} className="relative group">
                <div className="flex items-center gap-6 mb-10">
                  <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-[0.3em] text-on-surface leading-none">{section}</h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-outline-variant/60 to-transparent" />
                </div>
                
                <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
                  {fields.map((field) =>
                    field.type === "embedded-list" ? (
                      <CmsRelationManager
                        key={field.name}
                        errors={state.fieldErrors}
                        field={field}
                        items={embeddedLists[field.name] ?? []}
                        onChange={(items) => {
                          setEmbeddedLists((current) => ({
                            ...current,
                            [field.name]: items,
                          }))
                          updateField(field.name, items)
                        }}
                      />
                    ) : (
                      <CmsFieldInput
                        key={field.name}
                        errors={state.fieldErrors}
                        field={field}
                        referenceOptions={referenceOptions}
                        userRole={userRole}
                        value={formData[field.name]}
                        data={formData}
                        onChange={(val) => updateField(field.name, val)}
                      />
                    )
                  )}
                </div>
              </section>
            ))}
          </div>

          <div className="sticky bottom-6 z-30 mt-20 flex items-center justify-between gap-4 rounded-[2.5rem] border border-outline-variant/60 bg-surface/80 p-5 shadow-[0_12px_48px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
            <div className="flex-1">
              <PublicationControls
                formId={formId}
                isPending={isPending}
                isPublished={isPublished}
                label={definition.label}
              />
            </div>
            <Button asChild variant="ghost" className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-all">
              <Link href={returnTo}>Exit without saving</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function groupFieldsBySection(fields: CmsSerializableContentType["fields"]) {
  return fields.reduce<Record<string, typeof fields>>((sections, field) => {
    const section = field.section ?? "Details"
    sections[section] = [...(sections[section] ?? []), field]
    return sections
  }, {})
}
