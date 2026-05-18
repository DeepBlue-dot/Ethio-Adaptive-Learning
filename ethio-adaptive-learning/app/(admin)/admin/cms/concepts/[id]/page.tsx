import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Database, Network, Sigma } from "lucide-react"

import { deleteConcept } from "../concept-actions"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth"
import { getConceptEditorCmsData } from "@/lib/curriculum"

import { ConceptEditorForm } from "./concept-editor-form"

type ConceptEditorPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function ConceptEditorPage({ params }: ConceptEditorPageProps) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const { id } = await params
  const data = await getConceptEditorCmsData(id)
  const concept = data.concept

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <Link
          href="/admin/cms/concepts"
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 transition hover:text-teal-800"
        >
          <ArrowLeft className="size-4" />
          Back to hierarchy
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
              Concept Editor
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
              {concept.title}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
              Edit the concept node, tune BKT parameters, manage prerequisite edges, and sequence
              the instructional blocks that power the student experience.
            </p>
          </div>

          <form action={deleteConcept}>
            <input name="returnTo" type="hidden" value="/admin/cms/concepts" />
            <input name="conceptId" type="hidden" value={concept.id} />
            <Button type="submit" variant="destructive">
              Delete concept
            </Button>
          </form>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="Course" value={data.course.title} icon={<Database className="size-5" />} />
          <MetricCard
            label="Prerequisites"
            value={String(concept.prerequisiteEdges.length)}
            icon={<Network className="size-5" />}
          />
          <MetricCard label="Chunks" value={String(concept.chunks.length)} icon={<Database className="size-5" />} />
          <MetricCard
            label="Worked examples"
            value={String(concept.workedExamples.length)}
            icon={<Sigma className="size-5" />}
          />
        </div>
      </section>

      <ConceptEditorForm
        concept={{
          id: concept.id,
          unitId: concept.unitId,
          title: concept.title,
          slug: concept.slug,
          description: concept.description ?? "",
          contentBody: concept.contentBody ?? "",
          unlockThreshold: concept.unlockThreshold,
          pLo: concept.pLo,
          pT: concept.pT,
          pG: concept.pG,
          pS: concept.pS,
          decayLambda: concept.decayLambda,
          prerequisiteConceptIds: concept.prerequisiteEdges.map(
            (prerequisiteEdge) => prerequisiteEdge.prerequisiteConceptId
          ),
          chunks: concept.chunks.map((chunk) => ({
            id: chunk.id,
            title: chunk.title,
            slug: chunk.slug,
            bodyMd: chunk.bodyMd,
            order: chunk.order,
          })),
          workedExamples: concept.workedExamples.map((example) => ({
            id: example.id,
            title: example.title,
            slug: example.slug,
            problemMd: example.problemMd,
            solutionMd: example.solutionMd,
            order: example.order,
          })),
        }}
        courseTitle={data.course.title}
        prerequisiteOptions={data.prerequisiteOptions}
        unitOptions={data.unitOptions}
      />
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-3xl bg-secondary p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="rounded-2xl bg-white p-3 text-foreground shadow-sm">{icon}</div>
      </div>
      <p className="mt-4 text-xl font-semibold text-foreground">{value}</p>
    </div>
  )
}
