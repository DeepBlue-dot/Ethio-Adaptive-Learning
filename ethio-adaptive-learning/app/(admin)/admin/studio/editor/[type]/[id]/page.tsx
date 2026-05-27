import { notFound } from "next/navigation"
import { ArrowLeft, Monitor, Eye } from "lucide-react"
import Link from "next/link"

import { CmsForm } from "@/components/cms/cms-form"
import {
  getEditorModel,
  requireCmsAccess,
  resolveCmsContentType,
  type CmsEntity,
} from "@/lib/cms"
import { sanitizeAdminPath } from "@/lib/cms/forms"
import { WorkspaceShell } from "@/components/admin/studio/layout/workspace-shell"
import { Button } from "@/components/ui/button"

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
    lifecycle: { status: "DRAFT", hasDraft: false }
  }

  const supportsPreview = ["concept", "question", "course"].includes(definition.key)
  const isPublished = item.lifecycle?.status === "PUBLISHED"

  return (
    <WorkspaceShell fullBleed>
      <div className="flex flex-col h-full bg-surface">
        {/* Focus Mode Header */}
        <header className="h-16 border-b border-outline-variant bg-surface/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-6">
            <Link 
              href={returnTo}
              className="group flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
            >
              <div className="size-8 rounded-full border border-outline-variant flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                <ArrowLeft className="size-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Exit Focus Mode</span>
            </Link>
            <div className="h-4 w-px bg-outline-variant" />
            <div>
              <h1 className="text-sm font-black text-on-surface uppercase tracking-tight truncate max-w-[300px]">
                {item.id ? item.title : `Create New ${definition.label}`}
              </h1>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-0.5 opacity-60">
                Deep Editor &bull; {definition.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {item.id && supportsPreview && (
                <Button asChild variant="outline" size="sm" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
                   <Link href={`/admin/studio/${definition.key}/${item.id}/preview`} target="_blank">
                      <Monitor className="size-3.5" />
                      Draft Preview
                   </Link>
                </Button>
             )}

             {item.id && definition.key === "concept" && isPublished && (
                <Button asChild variant="ghost" size="sm" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
                   <Link href={`/student/concept/${item.id}/learn`} target="_blank">
                      <Eye className="size-3.5" />
                      View Live
                   </Link>
                </Button>
             )}

             {/* Status Badge */}
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant ml-2">
                <div className={`size-2 rounded-full ${isPublished ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  {item.lifecycle?.status || 'Draft'}
                </span>
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-container-lowest/30">
          <div className="max-w-4xl mx-auto py-12 px-8">
            <CmsForm
              definition={model.definition}
              item={item as CmsEntity}
              referenceOptions={model.referenceOptions}
              returnTo={model.returnTo}
              userRole={session.user.role}
            />
          </div>
        </div>
      </div>
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
