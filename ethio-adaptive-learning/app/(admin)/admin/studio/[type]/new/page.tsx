import { notFound } from "next/navigation"

import { CmsEditorShell } from "@/components/cms/cms-editor-shell"
import { CmsForm } from "@/components/cms/cms-form"
import {
  getEditorModel,
  requireCmsAccess,
  resolveCmsContentType,
  type CmsEntity,
} from "@/lib/cms"
import { sanitizeAdminPath } from "@/lib/cms/forms"

type StudioNewItemPageProps = {
  params: Promise<{
    type: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function StudioNewItemPage({ params, searchParams }: StudioNewItemPageProps) {
  const session = await requireCmsAccess()

  const { type } = await params
  const definition = resolveCmsContentType(type)

  if (!definition) {
    notFound()
  }

  const query = (await searchParams) ?? {}
  const returnTo = sanitizeAdminPath(getSingleValue(query.returnTo), `/admin/studio/${definition.key}`)
  const model = await getEditorModel(definition.key, undefined, returnTo)

  // Pre-fill item data from query parameters
  const initialData: Record<string, unknown> = {}
  Object.entries(query).forEach(([key, value]) => {
    if (key !== "returnTo" && typeof value === "string") {
      initialData[key] = value
    }
  })

  const item: CmsEntity = (model.item as CmsEntity) || {
    id: "",
    type: definition.key,
    title: "",
    data: initialData
  }

  return (
    <div className="max-w-5xl mx-auto">
      <CmsEditorShell
        definition={model.definition}
        item={item.id ? item : null} // Keep item as null for shell if it's brand new
        returnTo={returnTo}
      >
        <CmsForm
          definition={model.definition}
          item={item}
          referenceOptions={model.referenceOptions}
          returnTo={model.returnTo}
          userRole={session.user.role}
        />
      </CmsEditorShell>
    </div>
  )
}

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined
}
