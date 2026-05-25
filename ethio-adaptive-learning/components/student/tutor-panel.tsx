"use client"

import { FormEvent, useState, useTransition } from "react"
import { Bot, Send, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { recordTutorHintAction } from "@/lib/student/actions"
import { cn } from "@/lib/utils"

type TutorMessage = {
  id: string
  role: "student" | "ai"
  content: string
  contextIds?: string[]
}

type TutorApiResponse = {
  content?: string
  retrievedContextIds?: string[]
  error?: string
}

export function TutorPanel({
  className,
  conceptId,
  conceptTitle,
}: {
  className?: string
  conceptId: string
  conceptTitle: string
}) {
  const [messages, setMessages] = useState<TutorMessage[]>([])
  const [question, setQuestion] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedQuestion = question.trim()

    if (!trimmedQuestion || isPending) {
      return
    }

    setQuestion("")
    setError(null)
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "student",
        content: trimmedQuestion,
      },
    ])

    startTransition(async () => {
      try {
        const response = await fetch("/api/tutor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conceptId,
            question: trimmedQuestion,
          }),
        })
        const body = (await response.json()) as TutorApiResponse

        if (!response.ok) {
          throw new Error(body.error ?? "Tutor is unavailable right now.")
        }

        await recordTutorHintAction(conceptId)
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "ai",
            content: body.content ?? "Let's slow down and inspect what the question is asking first.",
            contextIds: body.retrievedContextIds,
          },
        ])
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Tutor is unavailable right now.")
      }
    })
  }

  return (
    <aside
      className={cn(
        "flex min-h-[420px] flex-col rounded-lg border border-outline-variant/50 bg-surface-container-lowest shadow-sm",
        className
      )}
    >
      <div className="border-b border-outline-variant/50 p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
            <Bot className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-on-surface">Socratic tutor</h2>
            <p className="text-xs text-on-surface-variant">{conceptTitle}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-outline-variant p-4 text-sm leading-6 text-on-surface-variant">
            Ask for a hint, a nudge, or a different way to think about the current concept.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2 rounded-lg p-3 text-sm leading-6",
                message.role === "student"
                  ? "bg-primary-fixed text-on-primary-fixed"
                  : "bg-muted text-on-surface"
              )}
            >
              {message.role === "student" ? (
                <UserRound className="mt-1 size-4 shrink-0" />
              ) : (
                <Bot className="mt-1 size-4 shrink-0" />
              )}
              <div>
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.contextIds?.length ? (
                  <p className="mt-2 text-xs opacity-70">
                    Context used: {message.contextIds.slice(0, 3).join(", ")}
                  </p>
                ) : null}
              </div>
            </div>
          ))
        )}

        {isPending ? (
          <div className="rounded-lg bg-muted p-3 text-sm text-on-surface-variant">
            Tutor is thinking...
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-error-rose/20 bg-error-container p-3 text-sm text-on-error-container">
            {error}
          </div>
        ) : null}
      </div>

      <form className="flex gap-2 border-t border-outline-variant/50 p-3" onSubmit={handleSubmit}>
        <input
          className="min-h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about this concept"
          value={question}
        />
        <Button aria-label="Send tutor question" disabled={isPending || !question.trim()} size="icon">
          <Send className="size-4" />
        </Button>
      </form>
    </aside>
  )
}
