import { notFound } from "next/navigation"

import { CmsForm } from "@/components/cms/cms-form"
import {
  getEditorModel,
  requireCmsAccess,
  resolveCmsContentType,
  initialCmsActionState,
} from "@/lib/cms"
import { sanitizeAdminPath } from "@/lib/cms/forms"
import { WorkspaceShell } from "@/components/admin/studio/layout/workspace-shell"

type FocusModeEditorPageProps = {
  params: Promise<{
    type: string
    id: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function FocusModeEditorPage({ params, searchParams }: FocusModeEditorPageProps) {
  const session = await requireCmsAccess()

  const resolvedParams = await params
  const { type, id } = resolvedParams
  const definition = resolveCmsContentType(type)

  if (!definition) {
    notFound()
  }

  const query = (await searchParams) || {}
  const returnTo = sanitizeAdminPath(getSingleValue(query.returnTo), `/admin/studio`)
  
  const isNew = id === "new"
  const model = await loadEditorModel(definition.key, isNew ? undefined : id, returnTo)

  if (!model) {
    notFound()
  }

  // Pre-fill item data from query parameters if new
  const initialData: Record<string, unknown> = { ...definition.defaultValues }
  if (isNew) {
    Object.entries(query).forEach(([key, value]) => {
      if (key !== "returnTo" && typeof value === "string") {
        initialData[key] = value
      }
    })
  }

  const item = model.item || {
    id: "",
    type: definition.key,
    title: "",
    data: initialData,
    lifecycle: { status: "DRAFT",  }
  }

  const msg = getSingleValue(query.msg)
  const error = getSingleValue(query.error)
  const initialState = {
    ...initialCmsActionState,
    message: msg || error || null,
    ok: !!msg && !error,
  }

  return (
    <WorkspaceShell fullBleed>
      <CmsForm
        definition={model.definition}
        item={item}
        referenceOptions={model.referenceOptions}
        returnTo={model.returnTo}
        userRole={session.user.role}
        initialState={initialState}
        showHeader={true}
      />
    </WorkspaceShell>
  )
}

async function loadEditorModel(type: string, id: string | undefined, returnTo: string) {
  try {
    return await getEditorModel(type, id, returnTo)
  } catch {
    return null
  }
}

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined
}
