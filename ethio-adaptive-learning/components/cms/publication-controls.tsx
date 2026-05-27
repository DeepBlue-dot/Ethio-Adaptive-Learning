"use client"

import { CheckCircle2, Loader2, Save, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PublicationControls({
  isPending,
  hasDraft,
  isPublished,
  label,
  formId = "cms-form",
}: {
  isPending: boolean
  hasDraft: boolean
  isPublished: boolean
  label: string
  formId?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        disabled={isPending}
        form={formId}
        name="intent"
        type="submit"
        value="save-draft"
        variant="outline"
        className="h-11 rounded-xl border-outline-variant px-6 text-[10px] font-bold uppercase tracking-[0.15em] transition-all hover:bg-surface-container hover:text-primary active:scale-[0.98]"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-3.5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 size-3.5 opacity-60" />
            Save Draft
          </>
        )}
      </Button>

      <Button
        disabled={isPending}
        form={formId}
        name="intent"
        type="submit"
        value="publish"
        className="h-11 rounded-xl bg-primary px-6 text-[10px] font-bold uppercase tracking-[0.15em] text-on-primary shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-3.5 animate-spin" />
            Working...
          </>
        ) : (
          <>
            {isPublished ? (
              <>
                <CheckCircle2 className="mr-2 size-3.5" />
                Publish Changes
              </>
            ) : (
              <>
                <Send className="mr-2 size-3.5" />
                Publish {label}
              </>
            )}
          </>
        )}
      </Button>
    </div>
  )
}
