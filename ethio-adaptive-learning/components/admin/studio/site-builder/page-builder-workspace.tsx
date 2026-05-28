"use client"

import React from "react"
import Link from "next/link"
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { motion, AnimatePresence } from "framer-motion"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowUpRight,
  Blocks,
  Code2,
  Database,
  FileText,
  GripVertical,
  Heading2,
  Image as ImageIcon,
  Layers3,
  Library,
  Link2,
  Loader2,
  Maximize2,
  Monitor,
  PanelRightClose,
  Plus,
  Save,
  Settings,
  Smartphone,
  Tablet,
  Text,
  Video,
  X,
} from "lucide-react"

import { updateInspectorMetadata, updatePageBlocks } from "@/app/(admin)/admin/studio/actions"
import { AssetShelf } from "@/components/admin/studio/layout/asset-shelf"
import { BuilderShell } from "@/components/admin/studio/layout/builder-shell"
import { ResourceBrowser } from "@/components/admin/resources/resource-browser"
import type { ResourceItem } from "@/components/admin/resources/resource-card"
import { Button } from "@/components/ui/button"
import type { CmsContentBlock } from "@/lib/cms/content-blocks"
import type { PageBuilderData, SiteBuilderBlock } from "@/lib/studio/site-builder"
import { useWorkspaceStore } from "@/lib/studio/use-workspace-store"
import { cn } from "@/lib/utils"

type BlockTemplate = {
  id: string
  type: CmsContentBlock["type"]
  label: string
  description: string
  icon: React.ReactNode
  create: () => CmsContentBlock
}

type PageDesign = {
  width: "focused" | "wide"
  density: "comfortable" | "compact"
  tone: "default" | "warm" | "cool"
}

const defaultPageDesign: PageDesign = {
  width: "focused",
  density: "comfortable",
  tone: "default",
}

const blockTemplates: BlockTemplate[] = [
  {
    id: "template-heading",
    type: "heading",
    label: "Heading",
    description: "Section title",
    icon: <Heading2 className="size-4" />,
    create: () => ({ id: createBlockId(), type: "heading", level: 2, text: "New section" }),
  },
  {
    id: "template-paragraph",
    type: "paragraph",
    label: "Text",
    description: "Rich learning copy",
    icon: <Text className="size-4" />,
    create: () => ({ id: createBlockId(), type: "paragraph", title: null, text: "Write the concept content here." }),
  },
  {
    id: "template-image",
    type: "image",
    label: "Image",
    description: "Media asset block",
    icon: <ImageIcon className="size-4" />,
    create: () => ({ id: createBlockId(), type: "image", assetId: "pending-asset", alt: "", caption: "" }),
  },
  {
    id: "template-video",
    type: "video",
    label: "Video",
    description: "YouTube embed",
    icon: <Video className="size-4" />,
    create: () => ({ id: createBlockId(), type: "video", url: "https://www.youtube.com/watch?v=", videoId: null, caption: "" }),
  },
  {
    id: "template-code",
    type: "code",
    label: "Code",
    description: "Formatted code sample",
    icon: <Code2 className="size-4" />,
    create: () => ({ id: createBlockId(), type: "code", language: "text", code: "Add code here" }),
  },
  {
    id: "template-embed",
    type: "embed",
    label: "Embed",
    description: "External interactive",
    icon: <Link2 className="size-4" />,
    create: () => ({ id: createBlockId(), type: "embed", url: "https://", title: "Embedded content" }),
  },
]

export function PageBuilderWorkspace({
  data,
  resources,
}: {
  data: PageBuilderData
  resources: ResourceItem[]
}) {
  const [mounted, setMounted] = React.useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const [blocks, setBlocks] = React.useState(data.blocks)
  const [pageDesign, setPageDesign] = React.useState<PageDesign>(defaultPageDesign)
  const [activeDragLabel, setActiveDragLabel] = React.useState<string | null>(null)
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle")
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [saveErrorDetails, setSaveErrorDetails] = React.useState<string[] | null>(null)
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const setActiveSite = useWorkspaceStore((state) => state.setActiveSite)
  const selectPage = useWorkspaceStore((state) => state.selectPage)
  const selectedBlockId = useWorkspaceStore((state) => state.selectedBlockId)
  const selectBlock = useWorkspaceStore((state) => state.selectBlock)
  const selectedInspectorTarget = useWorkspaceStore((state) => state.selectedInspectorTarget)

  React.useEffect(() => {
    setMounted(true)
    setActiveSite(data.site.id)
    selectPage(data.page.id)
  }, [data.page.id, data.site.id, selectPage, setActiveSite])

  React.useEffect(() => {
    setBlocks(data.blocks)
  }, [data.blocks])

  React.useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const selectedBlock = blocks.find((block) => block.id === selectedBlockId) ?? null

  const persistBlocks = React.useCallback((nextBlocks: SiteBuilderBlock[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveStatus("saving")
    setSaveError(null)
    setSaveErrorDetails(null)
    saveTimer.current = setTimeout(async () => {
      try {
        const result = await updatePageBlocks(data.page.id, nextBlocks.map((block) => block.data))

        if (result.ok && result.blocks) {
          setBlocks(result.blocks)
          setSaveStatus("saved")
          setSaveError(null)
          setSaveErrorDetails(null)
          setTimeout(() => setSaveStatus("idle"), 1600)
          return
        }

        setSaveStatus("error")
        setSaveError(result?.message || "Unable to save page blocks.")
        setSaveErrorDetails(
          result?.validationIssues?.map((issue) => `${issue.path}: ${issue.message}`) ?? null
        )
      } catch (error) {
        console.error("Failed to update page blocks:", error)
        setSaveStatus("error")
        setSaveError(
          error instanceof Error ? error.message : "Unable to save page blocks."
        )
        setSaveErrorDetails(null)
      }
    }, 450)
  }, [data.page.id])

  const handleBlocksChange = (nextBlocks: SiteBuilderBlock[]) => {
    setBlocks(nextBlocks)
    persistBlocks(nextBlocks)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current
    if (data?.kind === "block-template") {
      setActiveDragLabel(data.template.label)
      return
    }
    if (data?.title) {
      setActiveDragLabel(data.title)
      return
    }
    const block = blocks.find((item) => item.id === event.active.id)
    setActiveDragLabel(block?.label ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragLabel(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    if (activeData?.kind === "block-template") {
      const nextBlock = toBuilderBlock(activeData.template.create(), blocks.length)
      handleBlocksChange([...blocks, nextBlock])
      selectBlock(nextBlock.id)
      return
    }

    if (activeData?.type === "media-asset" || activeData?.type === "content-snippet") {
      const nextBlock = toBuilderBlock(createBlockFromResource(activeData as ResourceItem), blocks.length)
      handleBlocksChange([...blocks, nextBlock])
      selectBlock(nextBlock.id)
      return
    }

    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id)
      const newIndex = blocks.findIndex((block) => block.id === over.id)
      if (oldIndex >= 0 && newIndex >= 0) {
        handleBlocksChange(arrayMove(blocks, oldIndex, newIndex).map((block, index) => ({ ...block, order: index + 1 })))
      }
    }
  }

  const updateBlock = (blockId: string, dataPatch: Partial<CmsContentBlock>) => {
    const nextBlocks = blocks.map((block) => {
      if (block.id !== blockId) return block
      const nextData = { ...block.data, ...dataPatch } as CmsContentBlock
      return {
        ...block,
        label: getClientBlockLabel(nextData),
        status: "draft" as const,
        data: nextData,
      }
    })
    handleBlocksChange(nextBlocks)
  }

  const deleteBlock = (blockId: string) => {
    const nextBlocks = blocks.filter((block) => block.id !== blockId).map((block, index) => ({ ...block, order: index + 1 }))
    handleBlocksChange(nextBlocks)
    selectBlock(null)
  }

  // Hydration safety: Return a stable loading shell until mounted
  // Must be after all hooks to follow the Rules of Hooks
  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-container-lowest">
        <Loader2 className="size-8 animate-spin text-primary/20" />
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full flex-col bg-surface-container-lowest">
        <PageBuilderTopbar
          data={data}
          saveStatus={saveStatus}
          saveError={saveError}
          saveErrorDetails={saveErrorDetails}
        />
        <BuilderShell
          canvas={
            <PageCanvas
              data={data}
              blocks={blocks}
              design={pageDesign}
              selectedBlockId={selectedBlockId}
              onSelectPage={() => selectPage(data.page.id)}
              onSelectBlock={selectBlock}
              onAddBlock={(template) => {
                const nextBlock = toBuilderBlock(template.create(), blocks.length)
                handleBlocksChange([...blocks, nextBlock])
                selectBlock(nextBlock.id)
              }}
            />
          }
          inspector={
            <BlockInspector
              data={data}
              pageDesign={pageDesign}
              onPageDesignChange={setPageDesign}
              block={selectedInspectorTarget === "block" ? selectedBlock : null}
              onUpdateBlock={updateBlock}
              onDeleteBlock={deleteBlock}
            />
          }
        />
        <AssetBlockLibrary resources={resources} />
      </div>

      <DragOverlay>
        {activeDragLabel ? (
          <div className="rounded-2xl border-2 border-primary bg-surface px-5 py-4 text-xs font-black uppercase tracking-widest text-on-surface shadow-2xl">
            {activeDragLabel}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function PageBuilderTopbar({ data, saveStatus, saveError, saveErrorDetails }: { data: PageBuilderData; saveStatus: "idle" | "saving" | "saved" | "error"; saveError: string | null; saveErrorDetails: string[] | null }) {
  const devicePreview = useWorkspaceStore((state) => state.devicePreview)
  const setDevicePreview = useWorkspaceStore((state) => state.setDevicePreview)
  const zoomLevel = useWorkspaceStore((state) => state.zoomLevel)
  const setZoom = useWorkspaceStore((state) => state.setZoom)
  const setShelfOpen = useWorkspaceStore((state) => state.setShelfOpen)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-outline-variant bg-surface/90 px-4 backdrop-blur-xl lg:px-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          <Layers3 className="size-3.5" />
          Concept Builder
        </div>
        <h1 className="truncate text-sm font-black text-on-surface lg:text-base">{data.page.title}</h1>
      </div>

      <div className="hidden items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-low p-1 md:flex">
        {[
          { value: "desktop" as const, icon: <Monitor className="size-4" /> },
          { value: "tablet" as const, icon: <Tablet className="size-4" /> },
          { value: "mobile" as const, icon: <Smartphone className="size-4" /> },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setDevicePreview(item.value)}
            className={cn(
              "flex size-9 items-center justify-center rounded-xl transition",
              devicePreview === item.value ? "bg-primary text-primary-foreground" : "text-on-surface-variant hover:bg-surface"
            )}
            title={item.value}
          >
            {item.icon}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end gap-2 text-right">
          <div className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant sm:flex">
            {saveStatus === "saving" ? <Loader2 className="size-3 animate-spin text-primary" /> : <Save className="size-3 text-primary" />}
            {saveStatus === "idle" ? "Synced" : saveStatus}
          </div>
          {saveStatus === "error" && saveError ? (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 sm:text-[11px]">
                {saveError}
              </p>
              {saveErrorDetails ? (
                <div className="space-y-1 text-[10px] leading-snug text-rose-400">
                  {saveErrorDetails.map((detail) => (
                    <p key={detail}>• {detail}</p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <Button variant="outline" size="sm" className="hidden rounded-xl text-[10px] font-black uppercase tracking-widest lg:inline-flex" onClick={() => setZoom(zoomLevel === 1 ? 0.8 : 1)}>
          <Maximize2 className="size-3.5" />
          {Math.round(zoomLevel * 100)}%
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => setShelfOpen(true)}>
          <Library className="size-3.5" />
          Library
        </Button>
        <Button asChild size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-widest">
          <Link href={data.page.draftPreviewPath} target="_blank">
            <ArrowUpRight className="size-3.5" />
            Preview
          </Link>
        </Button>
      </div>
    </header>
  )
}

function PageCanvas({
  data,
  blocks,
  design,
  selectedBlockId,
  onSelectPage,
  onSelectBlock,
  onAddBlock,
}: {
  data: PageBuilderData
  blocks: SiteBuilderBlock[]
  design: PageDesign
  selectedBlockId: string | null
  onSelectPage: () => void
  onSelectBlock: (id: string | null) => void
  onAddBlock: (template: BlockTemplate) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "page-canvas-dropzone" })
  const devicePreview = useWorkspaceStore((state) => state.devicePreview)
  const zoomLevel = useWorkspaceStore((state) => state.zoomLevel)

  return (
    <div
      ref={setNodeRef}
      className="h-full overflow-auto bg-surface-container-lowest/50 bg-[radial-gradient(circle_at_1px_1px,rgb(0_0_0_/_0.05)_1px,transparent_0)] [background-size:32px_32px] p-6 custom-scrollbar lg:p-12"
    >
      <div
        className={cn(
          "mx-auto min-h-full transition-all duration-500 ease-in-out",
          devicePreview === "desktop" && (design.width === "wide" ? "max-w-7xl" : "max-w-5xl"),
          devicePreview === "tablet" && "max-w-3xl",
          devicePreview === "mobile" && "max-w-sm"
        )}
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top center" }}
      >
        <div
          onClick={onSelectPage}
          className={cn(
            "min-h-[calc(100vh-12rem)] rounded-[3rem] border bg-surface shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] transition-all duration-500",
            design.tone === "warm" && "bg-amber-50/40",
            design.tone === "cool" && "bg-sky-50/40",
            isOver ? "border-primary ring-8 ring-primary/5 shadow-2xl" : "border-outline-variant/60"
          )}
        >
          <div className={cn("border-b border-outline-variant/40 p-10 lg:p-14", design.density === "compact" && "p-8 lg:p-10")}>
            <div className="flex items-center gap-3 mb-4">
               <div className="size-2 rounded-full bg-primary animate-pulse" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{data.site.title}</p>
            </div>
            <h2 className="text-5xl font-black tracking-tighter text-on-surface leading-tight">{data.page.title}</h2>
            {data.page.description ? (
              <p className="mt-6 max-w-3xl text-lg font-medium leading-relaxed text-on-surface-variant/70 italic">{data.page.description}</p>
            ) : null}
          </div>

          <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
            <div className={cn("space-y-6 p-8 lg:p-12", design.density === "compact" && "space-y-4 p-6 lg:p-8")}>
              {blocks.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-outline-variant/40 bg-surface-container-low/20 p-12 text-center">
                  <div className="size-16 rounded-[1.5rem] bg-primary/5 border border-primary/10 flex items-center justify-center text-primary mb-6">
                     <Blocks className="size-8" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-on-surface">Blueprint empty</h3>
                  <p className="mt-3 max-w-sm text-sm font-medium text-on-surface-variant/60 leading-relaxed">
                    Orchestrate your concept by dragging modules from the library or selecting a starter component.
                  </p>
                  <div className="mt-10 flex flex-wrap justify-center gap-3">
                    {blockTemplates.slice(0, 3).map((template) => (
                      <Button key={template.id} variant="outline" className="h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest bg-surface border-outline-variant hover:border-primary/40 transition-all" onClick={(event) => {
                        event.stopPropagation()
                        onAddBlock(template)
                      }}>
                        {template.icon}
                        <span className="ml-2">{template.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                blocks.map((block) => (
                  <SortablePageBlock
                    key={block.id}
                    block={block}
                    selected={selectedBlockId === block.id}
                    onSelect={(event) => {
                      event.stopPropagation()
                      onSelectBlock(block.id)
                    }}
                  />
                ))
              )}

              <div className="flex justify-center pt-8">
                <Button variant="outline" className="h-12 rounded-full border-dashed px-8 text-[10px] font-black uppercase tracking-[0.2em] bg-surface-container-low/30 border-outline-variant/60 hover:bg-primary/5 hover:text-primary hover:border-primary/40 transition-all" onClick={(event) => {
                  event.stopPropagation()
                  onAddBlock(blockTemplates[0])
                }}>
                  <Plus className="mr-2 size-4" />
                  Append Content Module
                </Button>
              </div>
            </div>
          </SortableContext>
        </div>
      </div>
    </div>
  )
}

function SortablePageBlock({
  block,
  selected,
  onSelect,
}: {
  block: SiteBuilderBlock
  selected: boolean
  onSelect: (event: React.MouseEvent | React.KeyboardEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <section
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect(event)
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "group relative rounded-[2rem] border p-8 transition-all duration-300",
        selected 
          ? "border-primary bg-primary/[0.02] ring-8 ring-primary/5 shadow-xl shadow-primary/5 z-10 scale-[1.01]" 
          : "border-outline-variant/30 bg-surface hover:border-outline-variant hover:shadow-lg",
        isDragging && "opacity-50 grayscale scale-95"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="absolute -left-4 top-1/2 -translate-y-1/2 flex size-10 cursor-grab items-center justify-center rounded-2xl border border-outline-variant bg-surface text-on-surface-variant opacity-0 shadow-2xl transition-all duration-300 group-hover:opacity-100 hover:bg-primary hover:text-on-primary hover:border-primary hover:scale-110 active:cursor-grabbing"
        title="Reposition module"
      >
        <GripVertical className="size-5" />
      </button>

      {selected && (
         <div className="absolute -right-3 -top-3 flex items-center gap-1.5 p-1 rounded-2xl bg-primary text-on-primary shadow-xl shadow-primary/20 animate-in zoom-in-50 duration-200">
            <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest">
               {block.type}
            </div>
         </div>
      )}

      <BlockRenderer block={block.data} />
    </section>
  )
}

function BlockRenderer({ block }: { block: CmsContentBlock }) {
  switch (block.type) {
    case "heading":
      return <h3 className={cn("font-black tracking-tight text-on-surface", block.level === 2 ? "text-3xl" : block.level === 3 ? "text-2xl" : "text-xl")}>{block.text}</h3>
    case "paragraph":
      return (
        <div className="space-y-3">
          {block.title ? <h4 className="text-lg font-black text-on-surface">{block.title}</h4> : null}
          <p className="whitespace-pre-wrap text-base leading-8 text-on-surface-variant">{block.text}</p>
        </div>
      )
    case "image":
      return <MediaPlaceholder icon={<ImageIcon className="size-6" />} title={block.caption || "Image block"} detail={block.alt || block.assetId} />
    case "video":
      return <MediaPlaceholder icon={<Video className="size-6" />} title={block.caption || "Video block"} detail={block.url} />
    case "embed":
      return <MediaPlaceholder icon={<Link2 className="size-6" />} title={block.title || "Embed block"} detail={block.url} />
    case "quiz":
      return <MediaPlaceholder icon={<FileText className="size-6" />} title="Quiz block" detail={block.questionId} />
    case "code":
      return <pre className="overflow-x-auto rounded-2xl bg-surface-container-high p-5 text-sm"><code>{block.code}</code></pre>
    case "snippet":
      return <MediaPlaceholder icon={<Blocks className="size-6" />} title="Reusable snippet" detail={block.snippetId} />
    case "phet":
      return <MediaPlaceholder icon={<Blocks className="size-6" />} title={block.title || "Interactive simulation"} detail={block.assetId} />
  }
}

function MediaPlaceholder({ icon, title, detail }: { icon: React.ReactNode; title: string; detail?: string | null }) {
  return (
    <div className="flex min-h-40 items-center gap-5 rounded-2xl border border-outline-variant/50 bg-surface-container-low p-5">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
      <div className="min-w-0">
        <p className="text-lg font-black text-on-surface">{title}</p>
        {detail ? <p className="mt-1 truncate text-sm font-medium text-on-surface-variant">{detail}</p> : null}
      </div>
    </div>
  )
}

function BlockInspector({
  data,
  pageDesign,
  onPageDesignChange,
  block,
  onUpdateBlock,
  onDeleteBlock,
}: {
  data: PageBuilderData
  pageDesign: PageDesign
  onPageDesignChange: (design: PageDesign) => void
  block: SiteBuilderBlock | null
  onUpdateBlock: (blockId: string, patch: Partial<CmsContentBlock>) => void
  onDeleteBlock: (blockId: string) => void
}) {
  const selectPage = useWorkspaceStore((state) => state.selectPage)
  const selectBlock = useWorkspaceStore((state) => state.selectBlock)
  const selectedInspectorTarget = useWorkspaceStore((state) => state.selectedInspectorTarget)
  const [activeTab, setActiveTab] = React.useState<"content" | "design" | "settings" | "advanced">("content")
  const [pageDraft, setPageDraft] = React.useState(data.page)
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle")

  React.useEffect(() => {
    setPageDraft(data.page)
  }, [data.page])

  const updatePageField = async (field: "title" | "slug" | "description", value: string) => {
    setPageDraft((current) => ({ ...current, [field]: value }))
    setSaveStatus("saving")
    const result = await updateInspectorMetadata("concept", data.page.id, { [field]: value })
    setSaveStatus(result.ok ? "saved" : "error")
    if (result.ok) setTimeout(() => setSaveStatus("idle"), 1400)
  }

  const editingPage = selectedInspectorTarget !== "block" || !block

  return (
    <aside className="flex h-full flex-col overflow-hidden bg-surface border-l border-outline-variant shadow-2xl z-20">
      {/* Inspector Header */}
      <div className="flex flex-col border-b border-outline-variant bg-surface-container-low/30 px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "size-8 rounded-xl flex items-center justify-center border shadow-sm",
              editingPage ? "bg-primary/10 text-primary border-primary/20" : "bg-blue-500/10 text-blue-500 border-blue-200"
            )}>
               {editingPage ? <Settings className="size-4" /> : <Blocks className="size-4" />}
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 leading-none mb-1">
                 {editingPage ? "Properties" : "Block Editor"}
               </p>
               <h3 className="text-sm font-black text-on-surface truncate max-w-[180px]">
                 {editingPage ? pageDraft.title : block.label}
               </h3>
            </div>
          </div>
          <button
            onClick={() => editingPage ? selectPage(null) : selectBlock(null)}
            className="size-8 rounded-xl border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:border-primary/30 transition-all"
            title="Close inspector"
          >
            <PanelRightClose className="size-3.5" />
          </button>
        </div>

        {/* Sync Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-outline-variant/60 w-fit">
           <div className={cn(
             "size-1.5 rounded-full",
             saveStatus === "saving" ? "bg-primary animate-pulse" : 
             saveStatus === "error" ? "bg-rose-500" : "bg-emerald-500"
           )} />
           <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/60">
             {saveStatus === "saving" ? "Persisting..." : saveStatus === "error" ? "Conflict" : "Synced to Draft"}
           </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant px-4 bg-surface/50">
        {(["content", "design", "settings", "advanced"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative py-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              activeTab === tab ? "text-primary" : "text-on-surface-variant/40 hover:text-on-surface",
              tab !== "content" && "ml-2"
            )}
          >
            {tab}
            {activeTab === tab && (
              <motion.div 
                layoutId="active-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (editingPage ? 'page' : block.id)}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6 space-y-8"
          >
            {editingPage ? (
              <PageInspectorFields
                page={pageDraft}
                activeTab={activeTab}
                onChange={updatePageField}
                data={data}
                design={pageDesign}
                onDesignChange={onPageDesignChange}
              />
            ) : (
              <>
                {/* Block Header Quick Actions */}
                {activeTab === "content" && (
                   <div className="grid grid-cols-2 gap-2 pb-4 border-b border-outline-variant/40">
                      <Button variant="outline" size="sm" className="h-9 rounded-xl text-[9px] font-black uppercase tracking-widest" onClick={() => {}}>
                         <Plus className="mr-1.5 size-3" />
                         Duplicate
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 rounded-xl text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 border-outline-variant/60" onClick={() => onDeleteBlock(block.id)}>
                         <X className="mr-1.5 size-3" />
                         Delete
                      </Button>
                   </div>
                )}

                <BlockInspectorFields 
                  block={block} 
                  activeTab={activeTab} 
                  onChange={(patch) => onUpdateBlock(block.id, patch)} 
                  onDelete={() => onDeleteBlock(block.id)} 
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  )
}

function PageInspectorFields({
  page,
  activeTab,
  onChange,
  data,
  design,
  onDesignChange,
}: {
  page: PageBuilderData["page"]
  activeTab: "content" | "design" | "settings" | "advanced"
  onChange: (field: "title" | "slug" | "description", value: string) => void
  data: PageBuilderData
  design: PageDesign
  onDesignChange: (design: PageDesign) => void
}) {
  const setShelfOpen = useWorkspaceStore((state) => state.setShelfOpen)

  if (activeTab === "advanced") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Technical IDs" icon={<Database className="size-4" />} color="slate">
           <ReadOnly label="Concept ID" value={page.id} />
           <ReadOnly label="Parent Unit ID" value={data.group.id} />
        </InspectorSection>
        
        <div className="pt-4">
           <Button asChild className="w-full h-12 rounded-2xl bg-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20">
             <Link href={`/admin/studio/editor/concept/${page.id}?returnTo=/admin/studio/sites/${data.site.id}/pages/${page.id}`}>
               Enter Deep Editor
               <ArrowUpRight className="ml-2 size-4" />
             </Link>
           </Button>
        </div>
      </div>
    )
  }

  if (activeTab === "design") {
    return (
      <div className="space-y-8">
        <InspectorSection label="Viewport Layout" icon={<Monitor className="size-4" />} color="blue">
          <SegmentedControl
            label="Canvas width"
            value={design.width}
            options={[
              { label: "Focused", value: "focused" },
              { label: "Wide", value: "wide" },
            ]}
            onChange={(width) => onDesignChange({ ...design, width: width as PageDesign["width"] })}
          />
          <SegmentedControl
            label="Content Density"
            value={design.density}
            options={[
              { label: "Comfort", value: "comfortable" },
              { label: "Compact", value: "compact" },
            ]}
            onChange={(density) => onDesignChange({ ...design, density: density as PageDesign["density"] })}
          />
        </InspectorSection>

        <InspectorSection label="Aesthetics" icon={<Maximize2 className="size-4" />} color="purple">
           <SegmentedControl
             label="Color Tone"
             value={design.tone}
             options={[
               { label: "Studio", value: "default" },
               { label: "Warm", value: "warm" },
               { label: "Cool", value: "cool" },
             ]}
             onChange={(tone) => onDesignChange({ ...design, tone: tone as PageDesign["tone"] })}
           />
        </InspectorSection>
      </div>
    )
  }

  if (activeTab === "settings") {
    return (
      <div className="space-y-4">
        <InspectorSection label="Actions" icon={<Settings className="size-4" />} color="amber">
           <Button className="w-full h-11 rounded-xl justify-start bg-surface border border-outline-variant hover:border-primary/30 transition-all text-xs font-bold" variant="outline" onClick={() => setShelfOpen(true)}>
             <Library className="mr-3 size-4 text-primary" />
             Asset / Block Library
           </Button>
           <Button asChild className="w-full h-11 rounded-xl justify-start bg-surface border border-outline-variant hover:border-primary/30 transition-all text-xs font-bold" variant="outline">
             <Link href={data.page.draftPreviewPath} target="_blank">
               <Monitor className="mr-3 size-4 text-blue-500" />
               Live Draft Preview
             </Link>
           </Button>
           <Button asChild className="w-full h-11 rounded-xl justify-start bg-surface border border-outline-variant hover:border-primary/30 transition-all text-xs font-bold" variant="outline">
             <Link href={data.page.livePath} target="_blank">
               <ArrowUpRight className="mr-3 size-4 text-emerald-500" />
               View Production Node
             </Link>
           </Button>
        </InspectorSection>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <InspectorSection label="Core Identity" icon={<Settings className="size-4" />} color="blue">
         <TextInput label="Concept title" value={page.title} onChange={(value) => onChange("title", value)} />
         <TextInput label="Slug" value={page.slug} onChange={(value) => onChange("slug", value)} />
      </InspectorSection>
      
      <InspectorSection label="Student Context" icon={<FileText className="size-4" />} color="indigo">
         <TextArea label="Description" value={page.description} onChange={(value) => onChange("description", value)} />
      </InspectorSection>
    </div>
  )
}

function SegmentedControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ label: string; value: string }>
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/45">{label}</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "h-10 rounded-xl border text-[10px] font-black uppercase tracking-widest transition",
              value === option.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-outline-variant bg-surface text-on-surface-variant hover:border-primary/30 hover:text-primary"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function BlockInspectorFields({
  block,
  activeTab,
  onChange,
  onDelete,
}: {
  block: SiteBuilderBlock
  activeTab: "content" | "design" | "settings" | "advanced"
  onChange: (patch: Partial<CmsContentBlock>) => void
  onDelete: () => void
}) {
  if (activeTab === "advanced") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Technical Specs" icon={<Database className="size-4" />} color="slate">
           <ReadOnly label="Block ID" value={block.id} />
           <ReadOnly label="Data Type" value={block.type} />
           <ReadOnly label="Sort Order" value={String(block.order)} />
        </InspectorSection>
        
        <div className="pt-4">
           <Button variant="destructive" className="w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2" onClick={onDelete}>
             <X className="size-4" />
             Destroy Block
           </Button>
        </div>
      </div>
    )
  }

  const data = block.data
  switch (data.type) {
    case "heading":
      return <HeadingBlockInspector data={data} activeTab={activeTab} onChange={onChange} />
    case "paragraph":
      return <ParagraphBlockInspector data={data} activeTab={activeTab} onChange={onChange} />
    case "image":
      return <ImageBlockInspector data={data} activeTab={activeTab} onChange={onChange} />
    case "video":
      return <VideoBlockInspector data={data} activeTab={activeTab} onChange={onChange} />
    case "embed":
      return <EmbedBlockInspector data={data} activeTab={activeTab} onChange={onChange} />
    case "code":
      return <CodeBlockInspector data={data} activeTab={activeTab} onChange={onChange} />
    case "snippet":
      return <SnippetBlockInspector data={data} activeTab={activeTab} onChange={onChange} />
    case "quiz":
      return <QuizBlockInspector data={data} activeTab={activeTab} onChange={onChange} />
    case "phet":
      return <PhetBlockInspector data={data} activeTab={activeTab} onChange={onChange} />
  }
}

function HeadingBlockInspector({
  data,
  activeTab,
  onChange,
}: {
  data: CmsContentBlock
  activeTab: string
  onChange: (patch: Partial<CmsContentBlock>) => void
}) {
  if (activeTab === "content") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Heading Content" icon={<Heading2 className="size-4" />} color="blue">
          <TextArea label="Text" value={data.type === "heading" ? data.text : ""} onChange={(value) => onChange({ text: value } as Partial<CmsContentBlock>)} />
          <SegmentedControl
            label="Hierarchy Level"
            value={String(data.type === "heading" ? data.level : 2)}
            options={[
              { label: "H2", value: "2" },
              { label: "H3", value: "3" },
              { label: "H4", value: "4" },
            ]}
            onChange={(value) => onChange({ level: Number(value) } as Partial<CmsContentBlock>)}
          />
        </InspectorSection>
      </div>
    )
  }

  if (activeTab === "design") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Typography" icon={<FileText className="size-4" />} color="blue">
          <SegmentedControl
            label="Alignment"
            value="left"
            options={[
              { label: "Left", value: "left" },
              { label: "Center", value: "center" },
              { label: "Right", value: "right" },
            ]}
            onChange={() => {}}
          />
          <SelectInput
            label="Visual Weight"
            value="black"
            options={[
              { label: "Regular", value: "regular" },
              { label: "Semibold", value: "semibold" },
              { label: "Bold", value: "bold" },
              { label: "Black", value: "black" },
            ]}
            onChange={() => {}}
          />
        </InspectorSection>
      </div>
    )
  }

  if (activeTab === "settings") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Spacing" icon={<Maximize2 className="size-4" />} color="blue">
          <div className="space-y-4">
            <Toggle label="Add standard margin bottom" defaultChecked />
            <Toggle label="Force uppercase" />
            <Toggle label="Show section divider" />
          </div>
        </InspectorSection>
      </div>
    )
  }

  return null
}

function ParagraphBlockInspector({
  data,
  activeTab,
  onChange,
}: {
  data: CmsContentBlock
  activeTab: string
  onChange: (patch: Partial<CmsContentBlock>) => void
}) {
  if (activeTab === "content") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Text Content" icon={<Text className="size-4" />} color="green">
          <TextInput label="Optional Label/Title" value={data.type === "paragraph" ? data.title ?? "" : ""} onChange={(value) => onChange({ title: value } as Partial<CmsContentBlock>)} placeholder="e.g. Note, Key Idea" />
          <TextArea label="Body Copy (Markdown supported)" value={data.type === "paragraph" ? data.text : ""} onChange={(value) => onChange({ text: value } as Partial<CmsContentBlock>)} />
        </InspectorSection>
      </div>
    )
  }

  if (activeTab === "design") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Text Styling" icon={<FileText className="size-4" />} color="green">
          <SegmentedControl
            label="Alignment"
            value="left"
            options={[
              { label: "Left", value: "left" },
              { label: "Center", value: "center" },
              { label: "Justify", value: "justify" },
            ]}
            onChange={() => {}}
          />
          <SelectInput
            label="Type Size"
            value="base"
            options={[
              { label: "Readable (SM)", value: "sm" },
              { label: "Standard (Base)", value: "base" },
              { label: "Emphasis (LG)", value: "lg" },
            ]}
            onChange={() => {}}
          />
        </InspectorSection>
      </div>
    )
  }

  if (activeTab === "settings") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Block Behavior" icon={<Settings className="size-4" />} color="green">
          <div className="space-y-4">
            <Toggle label="Enable Drop Cap" />
            <Toggle label="Use Serif Font" />
            <Toggle label="Add Soft Background" />
          </div>
        </InspectorSection>
      </div>
    )
  }

  return null
}

function ImageBlockInspector({
  data,
  activeTab,
  onChange,
}: {
  data: CmsContentBlock
  activeTab: string
  onChange: (patch: Partial<CmsContentBlock>) => void
}) {
  if (activeTab === "content") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Media Source" icon={<ImageIcon className="size-4" />} color="purple">
          <TextInput label="Asset Reference ID" value={data.type === "image" ? data.assetId : ""} onChange={(value) => onChange({ assetId: value } as Partial<CmsContentBlock>)} />
          <TextArea label="Alt Text (Accessibility)" value={data.type === "image" ? data.alt ?? "" : ""} onChange={(value) => onChange({ alt: value } as Partial<CmsContentBlock>)} placeholder="Describe the image for screen readers" />
          <TextInput label="Visible Caption" value={data.type === "image" ? data.caption ?? "" : ""} onChange={(value) => onChange({ caption: value } as Partial<CmsContentBlock>)} />
        </InspectorSection>
      </div>
    )
  }

  if (activeTab === "design") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Sizing & Frames" icon={<Maximize2 className="size-4" />} color="purple">
          <SegmentedControl
            label="Display Width"
            value="full"
            options={[
              { label: "50%", value: "sm" },
              { label: "75%", value: "md" },
              { label: "100%", value: "full" },
            ]}
            onChange={() => {}}
          />
          <NumberInput label="Corner Radius (px)" value={24} min={0} max={48} onChange={() => {}} />
        </InspectorSection>
      </div>
    )
  }

  if (activeTab === "settings") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Interactions" icon={<Settings className="size-4" />} color="purple">
          <div className="space-y-4">
            <Toggle label="Open Lightbox on Click" defaultChecked />
            <Toggle label="Lazy Load (Performance)" defaultChecked />
            <Toggle label="Show Decorative Border" />
          </div>
        </InspectorSection>
      </div>
    )
  }

  return null
}

function VideoBlockInspector({
  data,
  activeTab,
  onChange,
}: {
  data: CmsContentBlock
  activeTab: string
  onChange: (patch: Partial<CmsContentBlock>) => void
}) {
  if (activeTab === "content") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Video Configuration" icon={<Video className="size-4" />} color="red">
          <TextInput label="YouTube URL / ID" value={data.type === "video" ? data.url : ""} onChange={(value) => onChange({ url: value } as Partial<CmsContentBlock>)} />
          <TextInput label="Video Caption" value={data.type === "video" ? data.caption ?? "" : ""} onChange={(value) => onChange({ caption: value } as Partial<CmsContentBlock>)} />
        </InspectorSection>
      </div>
    )
  }

  if (activeTab === "design") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Presentation" icon={<Monitor className="size-4" />} color="red">
          <SegmentedControl
            label="Aspect Ratio"
            value="16-9"
            options={[
              { label: "16:9", value: "16-9" },
              { label: "4:3", value: "4-3" },
              { label: "1:1", value: "1-1" },
            ]}
            onChange={() => {}}
          />
        </InspectorSection>
      </div>
    )
  }

  if (activeTab === "settings") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Playback Logic" icon={<Settings className="size-4" />} color="red">
          <div className="space-y-4">
            <Toggle label="Autoplay (Muted)" />
            <Toggle label="Loop Video" />
            <Toggle label="Hide Branding" />
            <Toggle label="Enable Cinema Mode" />
          </div>
        </InspectorSection>
      </div>
    )
  }

  return null
}

function EmbedBlockInspector({
  data,
  activeTab,
  onChange,
}: {
  data: CmsContentBlock
  activeTab: string
  onChange: (patch: Partial<CmsContentBlock>) => void
}) {
  if (activeTab === "content") {
    return (
      <div className="space-y-5">
        <InspectorSection label="Embed" icon={<Link2 className="size-4" />} color="amber">
          <TextInput label="Title" value={data.type === "embed" ? data.title ?? "" : ""} onChange={(value) => onChange({ title: value } as Partial<CmsContentBlock>)} />
          <TextInput label="URL" value={data.type === "embed" ? data.url : ""} onChange={(value) => onChange({ url: value } as Partial<CmsContentBlock>)} />
        </InspectorSection>
      </div>
    )
  }

  if (activeTab === "design") {
    return (
      <div className="space-y-5">
        <InspectorSection label="Size" icon={<Maximize2 className="size-4" />} color="amber">
          <SelectInput
            label="Width"
            value="full"
            options={[
              { label: "50%", value: "half" },
              { label: "75%", value: "three-quarter" },
              { label: "Full", value: "full" },
            ]}
            onChange={() => {}}
          />
          <NumberInput label="Min. height (px)" value={400} min={200} max={800} onChange={() => {}} />
        </InspectorSection>
      </div>
    )
  }

  if (activeTab === "settings") {
    return (
      <div className="space-y-5">
        <InspectorSection label="Behavior" icon={<Settings className="size-4" />} color="amber">
          <Toggle label="Allow full screen" />
        </InspectorSection>
      </div>
    )
  }

  return null
}

function CodeBlockInspector({
  data,
  activeTab,
  onChange,
}: {
  data: CmsContentBlock
  activeTab: string
  onChange: (patch: Partial<CmsContentBlock>) => void
}) {
  if (activeTab === "content") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Editor" icon={<Code2 className="size-4" />} color="slate">
          <SelectInput
            label="Programming Language"
            value={data.type === "code" ? data.language ?? "text" : "text"}
            options={[
              { label: "Plain Text", value: "text" },
              { label: "JavaScript / TS", value: "javascript" },
              { label: "Python", value: "python" },
              { label: "HTML Structure", value: "html" },
              { label: "CSS / Tailwind", value: "css" },
              { label: "JSON Data", value: "json" },
              { label: "Shell / Bash", value: "bash" },
            ]}
            onChange={(value) => onChange({ language: value } as Partial<CmsContentBlock>)}
          />
          <TextArea label="Source Code" value={data.type === "code" ? data.code : ""} onChange={(value) => onChange({ code: value } as Partial<CmsContentBlock>)} />
        </InspectorSection>
      </div>
    )
  }

  if (activeTab === "design") {
    return (
      <div className="space-y-6">
        <InspectorSection label="IDE Styling" icon={<Settings className="size-4" />} color="slate">
          <SegmentedControl
            label="Visual Theme"
            value="dark"
            options={[
              { label: "Midnight", value: "dark" },
              { label: "Snow", value: "light" },
            ]}
            onChange={() => {}}
          />
          <NumberInput label="Font Scaling (%)" value={100} min={80} max={150} onChange={() => {}} />
        </InspectorSection>
      </div>
    )
  }

  if (activeTab === "settings") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Advanced Features" icon={<Settings className="size-4" />} color="slate">
          <div className="space-y-4">
            <Toggle label="Show Line Numbers" defaultChecked />
            <Toggle label="Allow Direct Copy" defaultChecked />
            <Toggle label="Highlight Changed Lines" />
            <Toggle label="Soft Wrap Long Lines" />
          </div>
        </InspectorSection>
      </div>
    )
  }

  return null
}

function SnippetBlockInspector({
  data,
  activeTab,
  onChange,
}: {
  data: CmsContentBlock
  activeTab: string
  onChange: (patch: Partial<CmsContentBlock>) => void
}) {
  if (activeTab === "content") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Reusability" icon={<Blocks className="size-4" />} color="cyan">
          <TextInput label="Library ID" value={data.type === "snippet" ? data.snippetId : ""} onChange={(value) => onChange({ snippetId: value } as Partial<CmsContentBlock>)} />
          <InspectorHint label="Manage reusable snippets in the Global Library" />
        </InspectorSection>
      </div>
    )
  }

  return <InspectorHint label="Design overrides are managed at the library level." />
}

function QuizBlockInspector({
  data,
  activeTab,
  onChange,
}: {
  data: CmsContentBlock
  activeTab: string
  onChange: (patch: Partial<CmsContentBlock>) => void
}) {
  if (activeTab === "content") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Assessment Node" icon={<FileText className="size-4" />} color="teal">
          <TextInput label="Question Bank ID" value={data.type === "quiz" ? data.questionId : ""} onChange={(value) => onChange({ questionId: value } as Partial<CmsContentBlock>)} />
          <InspectorHint label="Author new questions in the Intelligence dashboard" />
        </InspectorSection>
      </div>
    )
  }

  if (activeTab === "settings") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Rules & Mastery" icon={<Settings className="size-4" />} color="teal">
          <div className="space-y-4">
            <Toggle label="Show Step-by-Step Explanation" defaultChecked />
            <Toggle label="Allow Multiple Retries" />
            <Toggle label="Enforce Response Time Limit" />
            <Toggle label="Shuffle Distractors" defaultChecked />
          </div>
        </InspectorSection>
      </div>
    )
  }

  return null
}

function PhetBlockInspector({
  data,
  activeTab,
  onChange,
}: {
  data: CmsContentBlock
  activeTab: string
  onChange: (patch: Partial<CmsContentBlock>) => void
}) {
  if (activeTab === "content") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Simulation Node" icon={<Blocks className="size-4" />} color="indigo">
          <TextInput label="Interactive Asset ID" value={data.type === "phet" ? data.assetId : ""} onChange={(value) => onChange({ assetId: value } as Partial<CmsContentBlock>)} />
          <TextInput label="Display Title" value={data.type === "phet" ? data.title ?? "" : ""} onChange={(value) => onChange({ title: value } as Partial<CmsContentBlock>)} />
        </InspectorSection>
      </div>
    )
  }

  if (activeTab === "settings") {
    return (
      <div className="space-y-6">
        <InspectorSection label="Interactive Sandbox" icon={<Settings className="size-4" />} color="indigo">
          <div className="space-y-4">
            <Toggle label="Enable Full Screen Trigger" defaultChecked />
            <Toggle label="Expose Simulation Parameters" />
            <Toggle label="Reset on Re-entry" defaultChecked />
          </div>
        </InspectorSection>
      </div>
    )
  }

  return null
}

function AssetBlockLibrary({ resources }: { resources: ResourceItem[] }) {
  const [activeTab, setActiveTab] = React.useState<"blocks" | "assets">("blocks")
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  return (
    <AssetShelf>
      <div className="flex flex-col h-full space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary leading-none mb-1">Module Library</p>
            <p className="text-xs font-bold text-on-surface-variant/70">Inject content modules into your instructional graph</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="h-9 rounded-xl text-[9px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-all">
              <Link href="/admin/resources">
                <Library className="mr-2 size-3.5" />
                Manage Repository
              </Link>
            </Button>
            <div className="flex rounded-xl border border-outline-variant bg-surface p-1 shadow-sm shrink-0">
              {(["blocks", "assets"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "rounded-lg px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all",
                    activeTab === tab ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-low"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {activeTab === "blocks" ? (
            <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2 custom-scrollbar sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 h-full">
              {blockTemplates.map((template) => (
                <DraggableTemplate key={template.id} template={template} />
              ))}
            </div>
          ) : (
            <div className="h-full">
              <ResourceBrowser
                initialItems={resources}
                compact
                selectedIds={selectedIds}
                onToggleSelect={(id) => {
                  setSelectedIds((current) => {
                    const next = new Set(current)
                    if (next.has(id)) next.delete(id)
                    else next.add(id)
                    return next
                  })
                }}
              />
            </div>
          )}
        </div>
      </div>
    </AssetShelf>
  )
}

function DraggableTemplate({ template }: { template: BlockTemplate }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: template.id,
    data: { kind: "block-template", template },
  })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-outline-variant bg-surface p-5 text-left transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 group",
        isDragging && "opacity-40 grayscale"
      )}
    >
      <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-inner">
         {template.icon}
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-tight text-on-surface">{template.label}</p>
        <p className="mt-1 text-[10px] font-medium text-on-surface-variant/60 leading-relaxed">{template.description}</p>
      </div>
    </button>
  )
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void, placeholder?: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/45 ml-1">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 text-sm font-bold text-on-surface outline-none transition-all placeholder:text-on-surface-variant/20 hover:border-outline focus:border-primary/40 focus:ring-8 focus:ring-primary/5 shadow-sm"
      />
    </label>
  )
}

function NumberInput({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/45 ml-1">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-12 w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 text-sm font-bold text-on-surface outline-none transition-all hover:border-outline focus:border-primary/40 focus:ring-8 focus:ring-primary/5 shadow-sm"
      />
    </label>
  )
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void, placeholder?: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/45 ml-1">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        rows={6}
        className="w-full resize-y rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm font-medium leading-relaxed text-on-surface outline-none transition-all placeholder:text-on-surface-variant/20 hover:border-outline focus:border-primary/40 focus:ring-8 focus:ring-primary/5 shadow-sm"
      />
    </label>
  )
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-low/40 p-4 shadow-inner">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/30 leading-none mb-2">{label}</p>
      <p className="break-all font-mono text-[10px] text-on-surface-variant/80 font-bold">{value}</p>
    </div>
  )
}

function InspectorSection({
  label,
  icon,
  color = "slate",
  children,
}: {
  label: string
  icon: React.ReactNode
  color?: "blue" | "green" | "red" | "purple" | "amber" | "slate" | "cyan" | "teal" | "indigo"
  children: React.ReactNode
}) {
  const colorClasses = {
    blue: "bg-blue-500/5 text-blue-600 border-blue-100",
    green: "bg-green-500/5 text-green-600 border-green-100",
    red: "bg-red-500/5 text-red-600 border-red-100",
    purple: "bg-purple-500/5 text-purple-600 border-purple-100",
    amber: "bg-amber-500/5 text-amber-600 border-amber-100",
    slate: "bg-slate-500/5 text-slate-600 border-slate-100",
    cyan: "bg-cyan-500/5 text-cyan-600 border-cyan-100",
    teal: "bg-teal-500/5 text-teal-600 border-teal-100",
    indigo: "bg-indigo-500/5 text-indigo-600 border-indigo-100",
  }

  return (
    <div className={cn("rounded-3xl border p-5 space-y-5 transition-all duration-500 hover:shadow-lg hover:shadow-current/5", colorClasses[color])}>
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-xl bg-current/10 flex items-center justify-center shrink-0">{icon}</div>
        <h4 className="text-[10px] font-black uppercase tracking-[0.25em] opacity-80">{label}</h4>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ label: string; value: string }>
  onChange: (value: string) => void
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/45 ml-1">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 text-sm font-bold text-on-surface outline-none transition-all cursor-pointer hover:border-outline focus:border-primary/40 focus:ring-8 focus:ring-primary/5 shadow-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function Toggle({ label, defaultChecked }: { label: string, defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer group">
      <span className="text-xs font-bold text-on-surface-variant/70 group-hover:text-on-surface transition-colors">{label}</span>
      <div className="relative inline-flex items-center cursor-pointer">
         <input
           type="checkbox"
           defaultChecked={defaultChecked}
           className="sr-only peer"
         />
         <div className="w-9 h-5 bg-outline-variant/40 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/10 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
      </div>
    </label>
  )
}

function InspectorHint({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/40 p-5 text-[11px] font-bold leading-relaxed text-on-surface-variant/50 italic text-center">
      {label}
    </div>
  )
}

function toBuilderBlock(block: CmsContentBlock, index: number): SiteBuilderBlock {
  return {
    id: block.id ?? createBlockId(),
    type: block.type,
    label: getClientBlockLabel(block),
    order: index + 1,
    status: "draft",
    data: block,
  }
}

function createBlockFromResource(resource: ResourceItem): CmsContentBlock {
  if (resource.type === "content-snippet") {
    return { id: createBlockId(), type: "snippet", snippetId: resource.id }
  }

  if (resource.kind === "YOUTUBE_EMBED") {
    return { id: createBlockId(), type: "video", url: resource.url ?? "", videoId: resource.videoId ?? null, caption: resource.title }
  }

  if (resource.kind === "PHET_SIMULATION") {
    return { id: createBlockId(), type: "phet", assetId: resource.id, title: resource.title }
  }

  return { id: createBlockId(), type: "image", assetId: resource.id, alt: resource.alt ?? resource.title, caption: resource.caption ?? resource.title }
}

function getClientBlockLabel(block: CmsContentBlock) {
  switch (block.type) {
    case "heading":
      return block.text || "Heading"
    case "paragraph":
      return block.title || block.text.split(/\s+/).slice(0, 5).join(" ") || "Text"
    case "image":
      return block.caption || block.alt || "Image"
    case "video":
      return block.caption || "Video"
    case "embed":
      return block.title || "Embed"
    case "quiz":
      return "Quiz"
    case "code":
      return block.language ? `${block.language} code` : "Code"
    case "snippet":
      return "Snippet"
    case "phet":
      return block.title || "Simulation"
  }
}

function createBlockId() {
  return globalThis.crypto?.randomUUID?.() ?? `block-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
