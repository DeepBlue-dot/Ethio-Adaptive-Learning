import { notFound } from "next/navigation"

import { CmsEditorShell } from "@/components/cms/cms-editor-shell"
import { CmsForm } from "@/components/cms/cms-form"
import { CmsEntityReorderer } from "@/components/cms/cms-entity-reorderer"
import {
  getEditorModel,
  listItems,
  requireCmsAccess,
  resolveCmsContentType,
} from "@/lib/cms"
import { sanitizeAdminPath } from "@/lib/cms/forms"

type StudioEditItemPageProps = {
  params: Promise<{
    type: string
    id: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function StudioEditItemPage({ params, searchParams }: StudioEditItemPageProps) {
  const session = await requireCmsAccess()

  const { type, id } = await params
  const definition = resolveCmsContentType(type)

  if (!definition) {
    notFound()
  }

  const query = (await searchParams) ?? {}
  const returnTo = sanitizeAdminPath(getSingleValue(query.returnTo), `/admin/studio/${definition.key}`)
  const model = await loadEditorModel(definition.key, id, returnTo)

  if (!model) {
    notFound()
  }

  const units = definition.key === "course" 
    ? await listItems("unit", { courseId: id })
    : []

  return (
    <div className="max-w-5xl mx-auto">
       <CmsEditorShell
          definition={model.definition}
          item={model.item}
          returnTo={returnTo}
          status={getSingleValue(query.msg)}
          error={getSingleValue(query.error)}
        >
          <div className="space-y-12">
            <CmsForm
              definition={model.definition}
              item={model.item}
              referenceOptions={model.referenceOptions}
              returnTo={model.returnTo}
              userRole={session.user.role}
            />

            {definition.key === "course" && units.length > 0 && (
              <section className="space-y-6">
                <div className="h-px bg-border" />
                <CmsEntityReorderer
                  contentType="unit"
                  initialItems={units.map(u => ({
                    id: u.id,
                    title: u.title,
                    subtitle: `Slug: ${u.data.slug}`
                  }))}
                  label="Unit Reordering"
                  revalidationPaths={[`/admin/studio/course/${id}`, `/admin/studio/unit`]}
                />
              </section>
            )}
          </div>
        </CmsEditorShell>
    </div>
  )
}

async function loadEditorModel(type: string, id: string, returnTo: string) {
  try {
    return await getEditorModel(type, id, returnTo)
  } catch {
    return null
  }
}

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined
}
