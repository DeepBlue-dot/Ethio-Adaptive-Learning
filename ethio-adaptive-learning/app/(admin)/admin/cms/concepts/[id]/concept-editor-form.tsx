"use client"

import { useActionState, useState, type Dispatch, type SetStateAction } from "react"
import { Blocks, PlusCircle, Sigma, Trash2 } from "lucide-react"

import {
  saveConceptEditor,
} from "../concept-editor-actions"
import { Button } from "@/components/ui/button"
import {
  initialCmsActionState,
  type CmsActionState,
} from "@/lib/cms/types"

const inputClassName =
  "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-600"
const textareaClassName = `${inputClassName} min-h-28 resize-y`
const selectClassName = inputClassName

type ConceptEditorFormProps = {
  courseTitle: string
  concept: {
    id: string
    unitId: string
    title: string
    slug: string
    description: string
    contentBody: string
    unlockThreshold: number
    pLo: number
    pT: number
    pG: number
    pS: number
    decayLambda: number
    prerequisiteConceptIds: string[]
    chunks: Array<{
      id: string
      title: string
      slug: string
      bodyMd: string
      order: number
    }>
    workedExamples: Array<{
      id: string
      title: string
      slug: string
      problemMd: string
      solutionMd: string
      order: number
    }>
  }
  unitOptions: Array<{
    id: string
    title: string
    order: number
  }>
  prerequisiteOptions: Array<{
    id: string
    title: string
    slug: string
    unitTitle: string
    unitOrder: number
  }>
}

type ChunkDraft = ConceptEditorFormProps["concept"]["chunks"][number]
type WorkedExampleDraft = ConceptEditorFormProps["concept"]["workedExamples"][number]

export function ConceptEditorForm({
  concept,
  courseTitle,
  unitOptions,
  prerequisiteOptions,
}: ConceptEditorFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveConceptEditor,
    initialCmsActionState
  )
  const [selectedPrerequisites, setSelectedPrerequisites] = useState(concept.prerequisiteConceptIds)
  const [chunks, setChunks] = useState<ChunkDraft[]>(concept.chunks)
  const [workedExamples, setWorkedExamples] = useState<WorkedExampleDraft[]>(concept.workedExamples)

  return (
    <form action={formAction} className="space-y-8">
      <input name="conceptId" type="hidden" value={concept.id} />
      <input name="chunks" type="hidden" value={JSON.stringify(chunks)} />
      <input name="workedExamples" type="hidden" value={JSON.stringify(workedExamples)} />

      {state.message ? (
        <FeedbackBanner ok={state.ok} message={state.message} />
      ) : null}

      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block text-sm font-medium text-foreground">
            Concept title
            <input className={inputClassName} defaultValue={concept.title} name="title" />
            <FieldErrors errors={state.fieldErrors} path="title" />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Slug
            <input className={inputClassName} defaultValue={concept.slug} name="slug" />
            <FieldErrors errors={state.fieldErrors} path="slug" />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Course
            <input className={inputClassName} disabled value={courseTitle} />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Unit
            <select className={selectClassName} defaultValue={concept.unitId} name="unitId">
              {unitOptions.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  Unit {unit.order}: {unit.title}
                </option>
              ))}
            </select>
            <FieldErrors errors={state.fieldErrors} path="unitId" />
          </label>
        </div>

        <label className="mt-4 block text-sm font-medium text-foreground">
          Description
          <textarea
            className={textareaClassName}
            defaultValue={concept.description}
            name="description"
            rows={3}
          />
          <FieldErrors errors={state.fieldErrors} path="description" />
        </label>

        <label className="mt-4 block text-sm font-medium text-foreground">
          Overview / summary
          <textarea
            className={textareaClassName}
            defaultValue={concept.contentBody}
            name="contentBody"
            placeholder="Use Markdown and LaTeX for the concept overview or study guide."
            rows={8}
          />
          <FieldErrors errors={state.fieldErrors} path="contentBody" />
        </label>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <ProbabilityField errors={state.fieldErrors} label="P(L0)" name="pLo" value={concept.pLo} />
          <ProbabilityField errors={state.fieldErrors} label="P(T)" name="pT" value={concept.pT} />
          <ProbabilityField errors={state.fieldErrors} label="P(G)" name="pG" value={concept.pG} />
          <ProbabilityField errors={state.fieldErrors} label="P(S)" name="pS" value={concept.pS} />
          <ProbabilityField
            errors={state.fieldErrors}
            label="Unlock threshold"
            name="unlockThreshold"
            value={concept.unlockThreshold}
          />
        </div>

        <div className="mt-4 max-w-xs">
          <ProbabilityField
            errors={state.fieldErrors}
            label="Decay lambda"
            name="decayLambda"
            value={concept.decayLambda}
          />
        </div>

        <label className="mt-6 block text-sm font-medium text-foreground">
          Prerequisites
          <select
            className={`${selectClassName} min-h-48`}
            multiple
            name="prerequisiteConceptIds"
            onChange={(event) =>
              setSelectedPrerequisites(
                Array.from(event.currentTarget.selectedOptions, (option) => option.value)
              )
            }
            value={selectedPrerequisites}
          >
            {prerequisiteOptions.map((option) => (
              <option key={option.id} value={option.id}>
                Unit {option.unitOrder}: {option.unitTitle} - {option.title}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-xs text-muted-foreground">
            Hold Ctrl/Cmd to select multiple prerequisites from this course.
          </span>
          <FieldErrors errors={state.fieldErrors} path="prerequisiteConceptIds" />
        </label>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button disabled={isPending} type="submit">
            {isPending ? "Saving..." : "Save concept"}
          </Button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground">
              <Blocks className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Concept chunks</h2>
              <p className="text-sm text-muted-foreground">
                Ordered Markdown / LaTeX blocks that structure the lesson flow.
              </p>
            </div>
          </div>

          <FieldErrors errors={state.fieldErrors} path="chunks" />

          <div className="mt-6 space-y-4">
            {chunks.map((chunk, index) => (
              <div key={chunk.id ?? `chunk-${index}`} className="rounded-3xl border border-border bg-slate-50 p-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_150px]">
                  <label className="block text-sm font-medium text-foreground">
                    Title
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        updateChunk(setChunks, index, {
                          title: event.currentTarget.value,
                        })
                      }
                      value={chunk.title}
                    />
                    <FieldErrors errors={state.fieldErrors} path={`chunks.${index}.title`} />
                  </label>

                  <label className="block text-sm font-medium text-foreground">
                    Order
                    <input
                      className={inputClassName}
                      min={1}
                      onChange={(event) =>
                        updateChunk(setChunks, index, {
                          order: Number(event.currentTarget.value),
                        })
                      }
                      type="number"
                      value={chunk.order}
                    />
                    <FieldErrors errors={state.fieldErrors} path={`chunks.${index}.order`} />
                  </label>
                </div>

                <label className="mt-4 block text-sm font-medium text-foreground">
                  Slug
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateChunk(setChunks, index, {
                        slug: event.currentTarget.value,
                      })
                    }
                    value={chunk.slug}
                  />
                  <FieldErrors errors={state.fieldErrors} path={`chunks.${index}.slug`} />
                </label>

                <label className="mt-4 block text-sm font-medium text-foreground">
                  Body
                  <textarea
                    className={textareaClassName}
                    onChange={(event) =>
                      updateChunk(setChunks, index, {
                        bodyMd: event.currentTarget.value,
                      })
                    }
                    rows={7}
                    value={chunk.bodyMd}
                  />
                  <FieldErrors errors={state.fieldErrors} path={`chunks.${index}.bodyMd`} />
                </label>

                <div className="mt-4">
                  <Button
                    onClick={() => setChunks((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    type="button"
                    variant="destructive"
                  >
                    <Trash2 className="size-4" />
                    Remove chunk
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Button
              onClick={() =>
                setChunks((current) => [
                  ...current,
                  {
                    id: "",
                    title: "",
                    slug: "",
                    bodyMd: "",
                    order: nextOrderValue(current),
                  },
                ])
              }
              type="button"
              variant="outline"
            >
              <PlusCircle className="size-4" />
              Add chunk
            </Button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground">
              <Sigma className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Worked examples</h2>
              <p className="text-sm text-muted-foreground">
                Sequence example problems and full solutions in the order students should read them.
              </p>
            </div>
          </div>

          <FieldErrors errors={state.fieldErrors} path="workedExamples" />

          <div className="mt-6 space-y-4">
            {workedExamples.map((example, index) => (
              <div
                key={example.id ?? `worked-example-${index}`}
                className="rounded-3xl border border-border bg-slate-50 p-5"
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_150px]">
                  <label className="block text-sm font-medium text-foreground">
                    Title
                    <input
                      className={inputClassName}
                      onChange={(event) =>
                        updateWorkedExample(setWorkedExamples, index, {
                          title: event.currentTarget.value,
                        })
                      }
                      value={example.title}
                    />
                    <FieldErrors errors={state.fieldErrors} path={`workedExamples.${index}.title`} />
                  </label>

                  <label className="block text-sm font-medium text-foreground">
                    Order
                    <input
                      className={inputClassName}
                      min={1}
                      onChange={(event) =>
                        updateWorkedExample(setWorkedExamples, index, {
                          order: Number(event.currentTarget.value),
                        })
                      }
                      type="number"
                      value={example.order}
                    />
                    <FieldErrors errors={state.fieldErrors} path={`workedExamples.${index}.order`} />
                  </label>
                </div>

                <label className="mt-4 block text-sm font-medium text-foreground">
                  Slug
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateWorkedExample(setWorkedExamples, index, {
                        slug: event.currentTarget.value,
                      })
                    }
                    value={example.slug}
                  />
                  <FieldErrors errors={state.fieldErrors} path={`workedExamples.${index}.slug`} />
                </label>

                <label className="mt-4 block text-sm font-medium text-foreground">
                  Problem
                  <textarea
                    className={textareaClassName}
                    onChange={(event) =>
                      updateWorkedExample(setWorkedExamples, index, {
                        problemMd: event.currentTarget.value,
                      })
                    }
                    rows={5}
                    value={example.problemMd}
                  />
                  <FieldErrors errors={state.fieldErrors} path={`workedExamples.${index}.problemMd`} />
                </label>

                <label className="mt-4 block text-sm font-medium text-foreground">
                  Solution
                  <textarea
                    className={textareaClassName}
                    onChange={(event) =>
                      updateWorkedExample(setWorkedExamples, index, {
                        solutionMd: event.currentTarget.value,
                      })
                    }
                    rows={6}
                    value={example.solutionMd}
                  />
                  <FieldErrors errors={state.fieldErrors} path={`workedExamples.${index}.solutionMd`} />
                </label>

                <div className="mt-4">
                  <Button
                    onClick={() =>
                      setWorkedExamples((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                    type="button"
                    variant="destructive"
                  >
                    <Trash2 className="size-4" />
                    Remove worked example
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Button
              onClick={() =>
                setWorkedExamples((current) => [
                  ...current,
                  {
                    id: "",
                    title: "",
                    slug: "",
                    problemMd: "",
                    solutionMd: "",
                    order: nextOrderValue(current),
                  },
                ])
              }
              type="button"
              variant="outline"
            >
              <PlusCircle className="size-4" />
              Add worked example
            </Button>
          </div>
        </div>
      </section>
    </form>
  )
}

function ProbabilityField({
  label,
  name,
  value,
  errors,
}: {
  label: string
  name: string
  value: number
  errors: CmsActionState["fieldErrors"]
}) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <input
        className={inputClassName}
        defaultValue={value}
        max={1}
        min={0}
        name={name}
        step="0.01"
        type="number"
      />
      <FieldErrors errors={errors} path={name} />
    </label>
  )
}

function FieldErrors({
  errors,
  path,
}: {
  errors: Record<string, string[]>
  path: string
}) {
  const messages = errors[path]

  if (!messages?.length) {
    return null
  }

  return <p className="mt-2 text-sm text-rose-700">{messages.join(" ")}</p>
}

function FeedbackBanner({
  ok,
  message,
}: {
  ok: boolean
  message: string
}) {
  return (
    <div
      className={`rounded-3xl border px-5 py-4 text-sm shadow-sm ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900"
      }`}
    >
      {message}
    </div>
  )
}

function nextOrderValue(items: Array<{ order: number }>) {
  return items.length ? Math.max(...items.map((item) => item.order)) + 1 : 1
}

function updateChunk(
  setChunks: Dispatch<SetStateAction<ChunkDraft[]>>,
  index: number,
  patch: Partial<ChunkDraft>
) {
  setChunks((current) =>
    current.map((chunk, itemIndex) => (itemIndex === index ? { ...chunk, ...patch } : chunk))
  )
}

function updateWorkedExample(
  setWorkedExamples: Dispatch<SetStateAction<WorkedExampleDraft[]>>,
  index: number,
  patch: Partial<WorkedExampleDraft>
) {
  setWorkedExamples((current) =>
    current.map((example, itemIndex) =>
      itemIndex === index ? { ...example, ...patch } : example
    )
  )
}
