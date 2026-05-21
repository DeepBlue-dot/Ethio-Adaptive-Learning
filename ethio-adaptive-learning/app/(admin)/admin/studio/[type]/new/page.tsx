import { notFound } from "next/navigation"

import { CmsEditorShell } from "@/components/cms/cms-editor-shell"
import { CmsForm } from "@/components/cms/cms-form"
import {
  getEditorModel,
  requireCmsAccess,
  resolveCmsContentType,
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

  return (
    <div className="max-w-5xl mx-auto">
      <CmsEditorShell
        definition={model.definition}
        item={model.item}
        returnTo={returnTo}
      >
        <CmsForm
          definition={model.definition}
          item={model.item}
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
