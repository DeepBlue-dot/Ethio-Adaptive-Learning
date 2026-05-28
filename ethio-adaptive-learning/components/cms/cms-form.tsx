"use client"

import { useActionState, useState } from "react"

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

type EmbeddedLists = Record<string, Array<Record<string, string | number | null | undefined>>>

export function CmsForm({
  definition,
  item,
  referenceOptions,
  returnTo,
  userRole,
  initialState,
}: {
  definition: CmsSerializableContentType
  item: CmsEntity | null
  referenceOptions: CmsReferenceOptions
  returnTo: string
  userRole: string
  initialState?: CmsActionState
}) {
  const [state, formAction, isPending] = useActionState(saveCmsItem, initialState ?? initialCmsActionState)
  const [embeddedLists, setEmbeddedLists] = useState<EmbeddedLists>(() => {
    const initialLists: EmbeddedLists = {}

    for (const field of definition.fields) {
      if (field.type === "embedded-list") {
        const value = item?.data[field.name] ?? definition.defaultValues?.[field.name] ?? []
        initialLists[field.name] = Array.isArray(value) ? value as EmbeddedLists[string] : []
      }
    }

    return initialLists
  })

  const fieldsBySection = groupFieldsBySection(definition.fields)
  const formId = "cms-editor-form"

  return (
    <div className="space-y-6">
      <form action={formAction} id={formId}>
        <input name="contentType" type="hidden" value={definition.key} />
        <input name="id" type="hidden" value={item?.id ?? ""} />
        <input name="returnTo" type="hidden" value={returnTo} />
        <input
          name="lastUpdatedAt"
          type="hidden"
          value={item?.lifecycle?.updatedAt ? new Date(item.lifecycle.updatedAt).getTime() : ""}
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
                      onChange={(items) =>
                        setEmbeddedLists((current) => ({
                          ...current,
                          [field.name]: items,
                        }))
                      }
                    />
                  ) : (
                    <CmsFieldInput
                      key={field.name}
                      errors={state.fieldErrors}
                      field={field}
                      referenceOptions={referenceOptions}
                      userRole={userRole}
                      value={item?.data[field.name] ?? definition.defaultValues?.[field.name]}
                    />
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Sticky Actions Bar - Uses sticky to avoid sidebar overlap and stay within content flow */}
        <div className="sticky bottom-6 z-30 mt-20 flex items-center justify-between gap-4 rounded-[2.5rem] border border-outline-variant/60 bg-surface/80 p-5 shadow-[0_12px_48px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
          <div className="flex-1">
            <PublicationControls
              formId={formId}
              hasDraft={item?.lifecycle?.hasDraft ?? false}
              isPending={isPending}
              isPublished={item?.lifecycle?.status === "PUBLISHED"}
              label={definition.label}
            />
          </div>
          <Button asChild variant="ghost" className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-all">
            <a href={returnTo}>Discard and Exit</a>
          </Button>
        </div>
      </form>
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
