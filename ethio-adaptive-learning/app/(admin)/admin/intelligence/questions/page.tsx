import React from "react"
import { getQuestionPerformanceMetrics } from "@/lib/studio/content-performance"
import { QuestionPerformanceTable } from "@/components/admin/studio/modules/intelligence/QuestionPerformanceTable"

export default async function QuestionAnalyticsPage() {
  const questions = await getQuestionPerformanceMetrics()

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div>
         <h1 className="text-3xl font-display font-black text-on-surface uppercase tracking-tight">Question Analytics</h1>
         <p className="text-secondary-foreground opacity-60 mt-1">Deep diagnostic analysis of EHSLCE question efficacy.</p>
      </div>
      
      <QuestionPerformanceTable questions={questions} />
    </div>
  )
}
