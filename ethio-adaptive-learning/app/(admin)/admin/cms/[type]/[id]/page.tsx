import { notFound } from "next/navigation"

import { CmsEditorShell } from "@/components/cms/cms-editor-shell"
import { CmsForm } from "@/components/cms/cms-form"
import {
  getEditorModel,
  requireCmsAccess,
  resolveCmsContentType,
} from "@/lib/cms"
import { sanitizeAdminPath } from "@/lib/cms/forms"

type EditCmsItemPageProps = {
  params: Promise<{
    type: string
    id: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function EditCmsItemPage({ params, searchParams }: EditCmsItemPageProps) {
  await requireCmsAccess()

  const { type, id } = await params
  const definition = resolveCmsContentType(type)

  if (!definition) {
    notFound()
  }

  const query = (await searchParams) ?? {}
  const returnTo = sanitizeAdminPath(getSingleValue(query.returnTo), `/admin/cms/${definition.key}`)
  const model = await loadEditorModel(definition.key, id, returnTo)

  if (!model) {
    notFound()
  }

  return (
    <CmsEditorShell
      definition={model.definition}
      item={model.item}
      returnTo={returnTo}
      status={getSingleValue(query.status)}
      error={getSingleValue(query.error)}
    >
      <CmsForm
        definition={model.definition}
        item={model.item}
        referenceOptions={model.referenceOptions}
        returnTo={model.returnTo}
      />
    </CmsEditorShell>
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
