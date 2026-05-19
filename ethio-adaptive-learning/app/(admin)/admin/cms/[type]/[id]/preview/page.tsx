import { notFound } from "next/navigation"
import { ArrowLeft, Monitor } from "lucide-react"
import Link from "next/link"

import { ContentBlocksRenderer } from "@/components/content/content-blocks-renderer"
import {
  getItem,
  requireCmsAccess,
  resolveCmsContentType,
} from "@/lib/cms"
import { prisma } from "@/lib/prisma"
import type { CmsContentTypeKey } from "@/lib/cms/types"
import type { CmsContentBlock } from "@/lib/cms/content-blocks"

type CmsPreviewPageProps = {
  params: Promise<{
    type: string
    id: string
  }>
}

export default async function CmsPreviewPage({ params }: CmsPreviewPageProps) {
  await requireCmsAccess()

  const { type, id } = await params
  const definition = resolveCmsContentType(type)

  if (!definition) {
    notFound()
  }

  const item = await getItem(definition.key, id)

  if (!item) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 flex flex-wrap items-center justify-between gap-6 rounded-[2.5rem] bg-teal-900 p-8 text-white shadow-xl">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-teal-300">
              <Monitor className="size-4" />
              Draft Preview Mode
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">{item.title}</h1>
            <p className="mt-2 text-teal-100/70">
              Previewing {definition.label.toLowerCase()} exactly as it will appear to students.
            </p>
          </div>
          <Link
            href={`/admin/cms/${definition.key}/${item.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <ArrowLeft className="size-4" />
            Back to Editor
          </Link>
        </header>

        <main className="rounded-[3rem] border border-border bg-white p-8 shadow-sm md:p-12">
          {definition.key === "concept" ? (
            <ConceptPreview data={item.data as any} />
          ) : definition.key === "question" ? (
            <QuestionPreview data={item.data as any} />
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Preview not implemented for this content type.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

async function ConceptPreview({ data }: { data: { contentBlocks: CmsContentBlock[], title: string, description: string } }) {
  const blocks = data.contentBlocks
  
  // Collect all IDs needed for the renderer
  const assetIds = new Set<string>()
  const questionIds = new Set<string>()
  const snippetIds = new Set<string>()

  function collectIds(blocks: CmsContentBlock[]) {
    for (const block of blocks) {
      if (block.type === "image" && block.assetId) assetIds.add(block.assetId)
      if (block.type === "quiz" && block.questionId) questionIds.add(block.questionId)
      if (block.type === "snippet" && block.snippetId) snippetIds.add(block.snippetId)
    }
  }

  collectIds(blocks)

  // Fetch dependencies
  const [assets, questions, snippets] = await Promise.all([
    prisma.mediaAsset.findMany({ where: { id: { in: Array.from(assetIds) } } }),
    prisma.question.findMany({ where: { id: { in: Array.from(questionIds) } } }),
    prisma.contentSnippet.findMany({ where: { id: { in: Array.from(snippetIds) } } }),
  ])

  const assetsMap = Object.fromEntries(assets.map(a => [a.id, a]))
  const questionsMap = Object.fromEntries(questions.map(q => [q.id, q]))
  const snippetsMap = Object.fromEntries(snippets.map(s => [s.id, {
    id: s.id,
    title: s.title,
    contentBlocks: s.contentBlocks as CmsContentBlock[]
  }]))

  return (
    <div className="prose prose-slate max-w-none">
      <h2 className="text-3xl font-bold tracking-tight text-foreground">{data.title}</h2>
      {data.description && <p className="mt-4 text-lg text-muted-foreground leading-8">{data.description}</p>}
      <div className="mt-10 border-t border-border pt-10">
        <ContentBlocksRenderer 
          blocks={blocks}
          assets={assetsMap as any}
          questions={questionsMap as any}
          snippets={snippetsMap as any}
        />
      </div>
    </div>
  )
}

function QuestionPreview({ data }: { data: { content: string, distractors: string, correctAnswer: string, explanation?: string, hintText?: string } }) {
  const distractors = data.distractors.split("\n").filter(Boolean)
  
  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-slate-50 p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Question Content</p>
        <div className="mt-4 text-lg leading-8 text-foreground">{data.content}</div>
      </div>

      <div className="grid gap-4">
        {[data.correctAnswer, ...distractors].sort().map((option, i) => (
          <div 
            key={i}
            className={`rounded-2xl border p-5 transition ${
              option === data.correctAnswer 
                ? "border-emerald-200 bg-emerald-50 text-emerald-900" 
                : "border-border bg-white text-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <span>{option}</span>
              {option === data.correctAnswer && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Correct Answer</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.hintText && (
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Hint</p>
          <p className="mt-2 text-sm text-amber-900 leading-6">{data.hintText}</p>
        </div>
      )}

      {data.explanation && (
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Explanation</p>
          <p className="mt-2 text-sm text-blue-900 leading-6">{data.explanation}</p>
        </div>
      )}
    </div>
  )
}
