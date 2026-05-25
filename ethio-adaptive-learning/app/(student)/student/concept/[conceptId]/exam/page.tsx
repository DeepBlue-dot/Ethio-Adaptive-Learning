import { redirect } from "next/navigation"

type ExamAliasPageProps = {
  params: Promise<{
    conceptId: string
  }>
}

export default async function ExamAliasPage({ params }: ExamAliasPageProps) {
  const { conceptId } = await params
  redirect(`/student/concept/${conceptId}/challenge?pathway=learn`)
}
