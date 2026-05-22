"use client"

import React, { useEffect, useRef } from "react"
import Image from "next/image"
import { FileText } from "lucide-react"

import type { CmsContentBlock } from "@/lib/cms/content-blocks"
import { getYouTubeEmbedUrl, normalizeYouTubeUrl } from "@/lib/cms/youtube"

export type RenderableMediaAsset = {
  id: string
  kind: string
  title: string | null
  alt: string | null
  caption: string | null
  url: string | null
  width: number | null
  height: number | null
  videoId: string | null
}

export type RenderableQuestion = {
  id: string
  content: string
}

export type RenderableSnippet = {
  id: string
  title: string
  contentBlocks: CmsContentBlock[]
}

export function ContentBlocksRenderer({
  assets = {},
  blocks,
  questions = {},
  snippets = {},
}: {
  assets?: Record<string, RenderableMediaAsset>
  blocks: CmsContentBlock[] | string | null | undefined
  questions?: Record<string, RenderableQuestion>
  snippets?: Record<string, RenderableSnippet>
}) {
  const normalizedBlocks = React.useMemo(() => {
    if (!blocks) return []
    if (Array.isArray(blocks)) return blocks
    if (typeof blocks === "string") {
      try {
        return JSON.parse(blocks) as CmsContentBlock[]
      } catch (e) {
        console.error("Failed to parse content blocks:", e)
        return []
      }
    }
    return []
  }, [blocks])

  if (!normalizedBlocks.length) {
    return (
      <div className="rounded-3xl bg-slate-50 p-6 text-sm leading-7 text-muted-foreground border-2 border-dashed border-border flex flex-col items-center justify-center gap-3">
        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
           <FileText className="size-5" />
        </div>
        <p className="text-center font-medium opacity-60">No lesson content available for this block.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {normalizedBlocks.map((block, index) => (
        <ContentBlock
          key={block.id || `block-${index}`}
          assets={assets}
          block={block}
          questions={questions}
          snippets={snippets}
        />
      ))}
    </div>
  )
}

function ContentBlock({
  assets,
  block,
  questions,
  snippets,
}: {
  assets: Record<string, RenderableMediaAsset>
  block: CmsContentBlock
  questions: Record<string, RenderableQuestion>
  snippets: Record<string, RenderableSnippet>
}) {
  if (block.type === "heading") {
    const HeadingTag = block.level === 4 ? "h4" : block.level === 3 ? "h3" : "h2"

    return <HeadingTag className="text-2xl font-semibold tracking-tight text-foreground">{block.text}</HeadingTag>
  }

  if (block.type === "image") {
    const asset = assets[block.assetId]

    if (!asset?.url) {
      return null
    }

    return (
      <figure className="overflow-hidden rounded-3xl border border-border bg-slate-50">
        <Image
          alt={block.alt || asset.alt || asset.title || ""}
          className="h-auto w-full object-cover"
          height={asset.height ?? 720}
          src={asset.url}
          width={asset.width ?? 1280}
        />
        {block.caption || asset.caption ? (
          <figcaption className="px-5 py-4 text-sm leading-6 text-muted-foreground">
            {block.caption || asset.caption}
          </figcaption>
        ) : null}
      </figure>
    )
  }

  if (block.type === "video") {
    const videoId = block.videoId || getVideoId(block.url)

    if (!videoId) {
      return null
    }

    return (
      <figure className="overflow-hidden rounded-3xl border border-border bg-slate-950">
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="aspect-video w-full"
          src={getYouTubeEmbedUrl(videoId)}
          title={block.caption || "YouTube video"}
        />
        {block.caption ? (
          <figcaption className="bg-white px-5 py-4 text-sm leading-6 text-muted-foreground">
            {block.caption}
          </figcaption>
        ) : null}
      </figure>
    )
  }

  if (block.type === "embed") {
    return (
      <a
        className="block rounded-3xl border border-border bg-slate-50 p-5 text-sm font-medium text-teal-700 transition hover:border-teal-300"
        href={block.url}
        rel="noreferrer"
        target="_blank"
      >
        {block.title || block.url}
      </a>
    )
  }

  if (block.type === "quiz") {
    const question = questions[block.questionId]

    if (!question) {
      return null
    }

    return (
      <section className="rounded-3xl border border-teal-100 bg-teal-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Quiz</p>
        <div className="mt-3 text-sm leading-7 text-foreground">
          <MathRenderer content={question.content} />
        </div>
      </section>
    )
  }

  if (block.type === "code") {
    return (
      <pre className="overflow-x-auto rounded-3xl bg-slate-950 p-5 text-sm leading-7 text-slate-100">
        <code>{block.code}</code>
      </pre>
    )
  }

  if (block.type === "snippet") {
    const snippet = snippets[block.snippetId]

    if (!snippet) {
      return null
    }

    return (
      <section className="rounded-3xl border border-border bg-slate-50 p-5">
        <h3 className="text-lg font-semibold text-foreground">{snippet.title}</h3>
        <div className="mt-4">
          <ContentBlocksRenderer
            assets={assets}
            blocks={snippet.contentBlocks}
            questions={questions}
            snippets={snippets}
          />
        </div>
      </section>
    )
  }

  if (block.type === "phet") {
    const asset = assets[block.assetId]

    if (!asset?.url) {
      return null
    }

    return (
      <figure className="overflow-hidden rounded-3xl border border-border bg-slate-900">
        <div className="aspect-video w-full">
          <iframe
            src={asset.url}
            className="h-full w-full border-none"
            allowFullScreen
            title={block.title || asset.title || "PhET Simulation"}
          />
        </div>
        {(block.title || asset.title) && (
          <figcaption className="bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-primary border-t border-border">
            Simulation: {block.title || asset.title}
          </figcaption>
        )}
      </figure>
    )
  }

  return (
    <article className="rounded-3xl bg-slate-50 p-6">
      {block.title ? <h3 className="text-xl font-semibold tracking-tight text-foreground">{block.title}</h3> : null}
      <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground">
        <MathRenderer content={block.text} />
      </div>
    </article>
  )
}

/**
 * Renders text content and triggers KaTeX auto-render on mount.
 * Supports $...$ for inline math and $$...$$ for display math.
 */
function MathRenderer({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const win = window as unknown as { 
      renderMathInElement: (el: HTMLElement, options: { 
        delimiters: Array<{ left: string, right: string, display: boolean }>,
        throwOnError: boolean 
      }) => void 
    }
    if (containerRef.current && win.renderMathInElement) {
      try {
        win.renderMathInElement(containerRef.current, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ],
          throwOnError: false,
        })
      } catch (e) {
        console.error("KaTeX auto-render failed:", e)
      }
    }
  }, [content])

  return <div ref={containerRef} className="math-container">{content}</div>
}

function getVideoId(url: string) {
  try {
    return normalizeYouTubeUrl(url).videoId
  } catch {
    return null
  }
}
