"use client"

import { CheckCircle2, Save, Send, UploadCloud } from "lucide-react"
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
        className="rounded-full px-6"
      >
        {isPending ? (
          "Saving..."
        ) : (
          <>
            <Save className="mr-2 size-4" />
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
        className="rounded-full bg-teal-600 px-6 hover:bg-teal-700"
      >
        {isPending ? (
          "Publishing..."
        ) : (
          <>
            {isPublished ? (
              <>
                <CheckCircle2 className="mr-2 size-4" />
                Publish Changes
              </>
            ) : (
              <>
                <Send className="mr-2 size-4" />
                Publish {label}
              </>
            )}
          </>
        )}
      </Button>
    </div>
  )
}
