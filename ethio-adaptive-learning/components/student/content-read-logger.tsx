"use client"

import { useEffect } from "react"

import { recordContentReadAction } from "@/lib/student/actions"

export function ContentReadLogger({ conceptId }: { conceptId: string }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void recordContentReadAction(conceptId)
    }, 1200)

    return () => window.clearTimeout(timeout)
  }, [conceptId])

  return null
}
