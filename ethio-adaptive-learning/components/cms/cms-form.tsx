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
}: {
  definition: CmsSerializableContentType
  item: CmsEntity | null
  referenceOptions: CmsReferenceOptions
  returnTo: string
  userRole: string
}) {
  const [state, formAction, isPending] = useActionState(saveCmsItem, initialCmsActionState)
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
    <div className="space-y-8">
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

        <div className="space-y-8">
          {Object.entries(fieldsBySection).map(([section, fields]) => (
            <section key={section} className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground">{section}</h2>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
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
      </form>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-border bg-white p-6 shadow-sm">
        <PublicationControls
          formId={formId}
          hasDraft={item?.lifecycle?.hasDraft ?? false}
          isPending={isPending}
          isPublished={item?.lifecycle?.status === "PUBLISHED"}
          label={definition.label}
        />
        <Button asChild variant="ghost">
          <a href={returnTo}>Cancel and go back</a>
        </Button>
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
