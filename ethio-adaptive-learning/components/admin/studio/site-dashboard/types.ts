import type { getSiteProjectData } from "@/lib/studio/site-builder"

export type AwaitedSiteProjectData = NonNullable<Awaited<ReturnType<typeof getSiteProjectData>>>
