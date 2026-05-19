import { notFound } from "next/navigation"

import { CmsEditorShell } from "@/components/cms/cms-editor-shell"
import { CmsForm } from "@/components/cms/cms-form"
import {
  getEditorModel,
  requireCmsAccess,
  resolveCmsContentType,
} from "@/lib/cms"
import { sanitizeAdminPath } from "@/lib/cms/forms"

type NewCmsItemPageProps = {
  params: Promise<{
    type: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function NewCmsItemPage({ params, searchParams }: NewCmsItemPageProps) {
  await requireCmsAccess()

  const { type } = await params
  const definition = resolveCmsContentType(type)

  if (!definition) {
    notFound()
  }

  const query = (await searchParams) ?? {}
  const returnTo = sanitizeAdminPath(getSingleValue(query.returnTo), `/admin/cms/${definition.key}`)
  const model = await getEditorModel(definition.key, undefined, returnTo)

  return (
    <CmsEditorShell
      definition={model.definition}
      item={null}
      returnTo={returnTo}
      status={getSingleValue(query.status)}
      error={getSingleValue(query.error)}
    >
      <CmsForm
        definition={model.definition}
        item={null}
        referenceOptions={model.referenceOptions}
        returnTo={model.returnTo}
      />
    </CmsEditorShell>
  )
}

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined
}
