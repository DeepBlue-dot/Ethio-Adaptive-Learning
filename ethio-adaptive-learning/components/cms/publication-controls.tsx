"use client"

import { CheckCircle2, Loader2, Save, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PublicationControls({
  isPending,
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
        className="h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-[0.18em]"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Saving
          </>
        ) : (
          <>
            <Save className="size-4" />
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
        className="h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-[0.18em]"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Publishing
          </>
        ) : (
          <>
            {isPublished ? (
              <>
                <CheckCircle2 className="size-4" />
                Publish Changes
              </>
            ) : (
              <>
                <Send className="size-4" />
                Publish {label}
              </>
            )}
          </>
        )}
      </Button>
    </div>
  )
}
