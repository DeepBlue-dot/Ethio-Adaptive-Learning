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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const [blocks, setBlocks] = React.useState(data.blocks)
  const [pageDesign, setPageDesign] = React.useState<PageDesign>(defaultPageDesign)
  const [activeDragLabel, setActiveDragLabel] = React.useState<string | null>(null)
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle")
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const setActiveSite = useWorkspaceStore((state) => state.setActiveSite)
  const selectPage = useWorkspaceStore((state) => state.selectPage)
  const selectedBlockId = useWorkspaceStore((state) => state.selectedBlockId)
  const selectBlock = useWorkspaceStore((state) => state.selectBlock)
  const selectedInspectorTarget = useWorkspaceStore((state) => state.selectedInspectorTarget)

  React.useEffect(() => {
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
    saveTimer.current = setTimeout(async () => {
      const result = await updatePageBlocks(data.page.id, nextBlocks.map((block) => block.data))
      if (result.ok && result.blocks) {
        setBlocks(result.blocks)
        setSaveStatus("saved")
        setTimeout(() => setSaveStatus("idle"), 1600)
      } else {
        setSaveStatus("error")
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full flex-col bg-surface-container-lowest">
        <PageBuilderTopbar data={data} saveStatus={saveStatus} />
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

function PageBuilderTopbar({ data, saveStatus }: { data: PageBuilderData; saveStatus: "idle" | "saving" | "saved" | "error" }) {
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
        <div className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant sm:flex">
          {saveStatus === "saving" ? <Loader2 className="size-3 animate-spin text-primary" /> : <Save className="size-3 text-primary" />}
          {saveStatus === "idle" ? "Synced" : saveStatus}
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
      className="h-full overflow-auto bg-[radial-gradient(circle_at_1px_1px,rgb(0_0_0_/_0.08)_1px,transparent_0)] [background-size:24px_24px] p-4 custom-scrollbar lg:p-8"
    >
      <div
        className={cn(
          "mx-auto min-h-full transition-all",
          devicePreview === "desktop" && (design.width === "wide" ? "max-w-7xl" : "max-w-5xl"),
          devicePreview === "tablet" && "max-w-3xl",
          devicePreview === "mobile" && "max-w-sm"
        )}
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top center" }}
      >
        <div
          onClick={onSelectPage}
          className={cn(
            "min-h-[calc(100vh-9rem)] rounded-[2rem] border bg-surface shadow-2xl transition",
            design.tone === "warm" && "bg-amber-50/60",
            design.tone === "cool" && "bg-sky-50/60",
            isOver ? "border-primary ring-4 ring-primary/15" : "border-outline-variant"
          )}
        >
          <div className={cn("border-b border-outline-variant p-8 lg:p-10", design.density === "compact" && "p-6 lg:p-7")}>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">{data.site.title}</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-on-surface">{data.page.title}</h2>
            {data.page.description ? (
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-on-surface-variant">{data.page.description}</p>
            ) : null}
          </div>

          <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
            <div className={cn("space-y-4 p-5 lg:p-8", design.density === "compact" && "space-y-3 p-4 lg:p-5")}>
              {blocks.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-outline-variant bg-surface-container-low/50 p-10 text-center">
                  <Blocks className="size-10 text-primary" />
                  <h3 className="mt-4 text-lg font-black text-on-surface">Start with a section</h3>
                  <p className="mt-2 max-w-md text-sm font-medium text-on-surface-variant">
                    Add a block from the library or choose a starter section below.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {blockTemplates.slice(0, 3).map((template) => (
                      <Button key={template.id} variant="outline" size="sm" className="rounded-xl" onClick={(event) => {
                        event.stopPropagation()
                        onAddBlock(template)
                      }}>
                        {template.icon}
                        {template.label}
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

              <div className="flex justify-center pt-2">
                <Button variant="outline" className="rounded-full border-dashed" onClick={(event) => {
                  event.stopPropagation()
                  onAddBlock(blockTemplates[0])
                }}>
                  <Plus className="size-4" />
                  Add Section
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
        "group relative rounded-3xl border p-5 transition",
        selected ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-outline-variant/50 bg-surface hover:border-primary/30",
        isDragging && "opacity-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="absolute -left-3 top-5 flex size-8 cursor-grab items-center justify-center rounded-full border border-outline-variant bg-surface text-on-surface-variant opacity-0 shadow-sm transition group-hover:opacity-100"
        title="Drag block"
      >
        <GripVertical className="size-4" />
      </button>
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
    <aside className="flex h-full flex-col overflow-hidden bg-surface">
      <div className="flex items-start justify-between gap-3 border-b border-outline-variant p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            <Settings className="size-3.5" />
            {editingPage ? "Concept Properties" : "Block Properties"}
          </div>
          <h3 className="mt-2 truncate text-base font-black text-on-surface">
            {editingPage ? pageDraft.title : block.label}
          </h3>
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/45">
            {saveStatus === "saving" ? "Saving" : saveStatus === "error" ? "Save error" : "Draft-first autosave"}
          </p>
        </div>
        <button
          onClick={() => editingPage ? selectPage(null) : selectBlock(null)}
          className="flex size-9 items-center justify-center rounded-xl text-on-surface-variant transition hover:bg-surface-container-high"
          title="Close inspector"
        >
          <PanelRightClose className="size-4" />
        </button>
      </div>

      <div className="flex border-b border-outline-variant px-5">
        {(["content", "design", "settings", "advanced"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "py-4 text-[10px] font-black uppercase tracking-[0.18em] transition",
              activeTab === tab ? "text-primary" : "text-on-surface-variant/45 hover:text-on-surface",
              tab !== "content" && "ml-4"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
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
          <BlockInspectorFields block={block} activeTab={activeTab} onChange={(patch) => onUpdateBlock(block.id, patch)} onDelete={() => onDeleteBlock(block.id)} />
        )}
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
      <div className="space-y-4">
        <ReadOnly label="Concept ID" value={page.id} />
        <ReadOnly label="Unit" value={data.group.title} />
        <Button asChild className="w-full rounded-xl">
          <Link href={`/admin/studio/editor/concept/${page.id}?returnTo=/admin/studio/sites/${data.site.id}/pages/${page.id}`}>
            Deep Editor
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>
    )
  }

  if (activeTab === "design") {
    return (
      <div className="space-y-6">
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
          label="Density"
          value={design.density}
          options={[
            { label: "Comfort", value: "comfortable" },
            { label: "Compact", value: "compact" },
          ]}
          onChange={(density) => onDesignChange({ ...design, density: density as PageDesign["density"] })}
        />
        <SegmentedControl
          label="Tone"
          value={design.tone}
          options={[
            { label: "Default", value: "default" },
            { label: "Warm", value: "warm" },
            { label: "Cool", value: "cool" },
          ]}
          onChange={(tone) => onDesignChange({ ...design, tone: tone as PageDesign["tone"] })}
        />
      </div>
    )
  }

  if (activeTab === "settings") {
    return (
      <div className="space-y-3">
        <Button className="w-full rounded-xl justify-start" variant="outline" onClick={() => setShelfOpen(true)}>
          <Library className="size-4" />
          Open Asset / Block Library
        </Button>
        <Button asChild className="w-full rounded-xl justify-start" variant="outline">
          <Link href={data.page.draftPreviewPath} target="_blank">
            <Monitor className="size-4" />
            Draft Preview
          </Link>
        </Button>
        <Button asChild className="w-full rounded-xl justify-start" variant="outline">
          <Link href={data.page.livePath} target="_blank">
            <ArrowUpRight className="size-4" />
            View Live
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <TextInput label="Concept title" value={page.title} onChange={(value) => onChange("title", value)} />
      <TextInput label="Slug" value={page.slug} onChange={(value) => onChange("slug", value)} />
      <TextArea label="Description" value={page.description} onChange={(value) => onChange("description", value)} />
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
      <div className="space-y-4">
        <ReadOnly label="Block ID" value={block.id} />
        <ReadOnly label="Block type" value={block.type} />
        <Button variant="destructive" className="w-full rounded-xl" onClick={onDelete}>
          <X className="size-4" />
          Delete Block
        </Button>
      </div>
    )
  }

  if (activeTab !== "content") {
    return <InspectorHint label="Design and settings are reserved for page-block style controls in the next schema pass." />
  }

  const data = block.data
  switch (data.type) {
    case "heading":
      return (
        <div className="space-y-5">
          <TextInput label="Heading text" value={data.text} onChange={(value) => onChange({ text: value } as Partial<CmsContentBlock>)} />
          <NumberInput label="Level" value={data.level} min={2} max={4} onChange={(value) => onChange({ level: value } as Partial<CmsContentBlock>)} />
        </div>
      )
    case "paragraph":
      return (
        <div className="space-y-5">
          <TextInput label="Optional title" value={data.title ?? ""} onChange={(value) => onChange({ title: value } as Partial<CmsContentBlock>)} />
          <TextArea label="Text" value={data.text} onChange={(value) => onChange({ text: value } as Partial<CmsContentBlock>)} />
        </div>
      )
    case "image":
      return (
        <div className="space-y-5">
          <TextInput label="Asset ID" value={data.assetId} onChange={(value) => onChange({ assetId: value } as Partial<CmsContentBlock>)} />
          <TextInput label="Alt text" value={data.alt ?? ""} onChange={(value) => onChange({ alt: value } as Partial<CmsContentBlock>)} />
          <TextInput label="Caption" value={data.caption ?? ""} onChange={(value) => onChange({ caption: value } as Partial<CmsContentBlock>)} />
        </div>
      )
    case "video":
      return (
        <div className="space-y-5">
          <TextInput label="Video URL" value={data.url} onChange={(value) => onChange({ url: value } as Partial<CmsContentBlock>)} />
          <TextInput label="Caption" value={data.caption ?? ""} onChange={(value) => onChange({ caption: value } as Partial<CmsContentBlock>)} />
        </div>
      )
    case "embed":
      return (
        <div className="space-y-5">
          <TextInput label="Title" value={data.title ?? ""} onChange={(value) => onChange({ title: value } as Partial<CmsContentBlock>)} />
          <TextInput label="URL" value={data.url} onChange={(value) => onChange({ url: value } as Partial<CmsContentBlock>)} />
        </div>
      )
    case "code":
      return (
        <div className="space-y-5">
          <TextInput label="Language" value={data.language ?? ""} onChange={(value) => onChange({ language: value } as Partial<CmsContentBlock>)} />
          <TextArea label="Code" value={data.code} onChange={(value) => onChange({ code: value } as Partial<CmsContentBlock>)} />
        </div>
      )
    case "snippet":
      return <TextInput label="Snippet ID" value={data.snippetId} onChange={(value) => onChange({ snippetId: value } as Partial<CmsContentBlock>)} />
    case "quiz":
      return <TextInput label="Question ID" value={data.questionId} onChange={(value) => onChange({ questionId: value } as Partial<CmsContentBlock>)} />
    case "phet":
      return (
        <div className="space-y-5">
          <TextInput label="Asset ID" value={data.assetId} onChange={(value) => onChange({ assetId: value } as Partial<CmsContentBlock>)} />
          <TextInput label="Title" value={data.title ?? ""} onChange={(value) => onChange({ title: value } as Partial<CmsContentBlock>)} />
        </div>
      )
  }
}

function AssetBlockLibrary({ resources }: { resources: ResourceItem[] }) {
  const [activeTab, setActiveTab] = React.useState<"blocks" | "assets">("blocks")
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  return (
    <AssetShelf>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-highest/70 px-5 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Asset / Block Library</p>
            <p className="text-sm font-semibold text-on-surface-variant">Drag blocks or media onto the concept canvas</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-widest">
              <Link href="/admin/resources">
                <Library className="size-3.5" />
                Manage Assets
              </Link>
            </Button>
            <div className="flex rounded-2xl border border-outline-variant bg-surface p-1">
              {(["blocks", "assets"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition",
                    activeTab === tab ? "bg-primary text-primary-foreground" : "text-on-surface-variant hover:bg-surface-container-high"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {activeTab === "blocks" ? (
            <div className="grid grid-cols-1 gap-3 overflow-y-auto p-5 custom-scrollbar sm:grid-cols-2 xl:grid-cols-3">
              {blockTemplates.map((template) => (
                <DraggableTemplate key={template.id} template={template} />
              ))}
            </div>
          ) : (
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
        "flex items-center gap-4 rounded-2xl border border-outline-variant bg-surface p-4 text-left transition hover:border-primary/40 hover:bg-primary/5",
        isDragging && "opacity-40"
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">{template.icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-black text-on-surface">{template.label}</p>
        <p className="mt-1 text-xs font-medium text-on-surface-variant">{template.description}</p>
      </div>
    </button>
  )
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/45">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-outline-variant bg-surface px-4 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </label>
  )
}

function NumberInput({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/45">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full rounded-2xl border border-outline-variant bg-surface px-4 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </label>
  )
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/45">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
        className="w-full resize-y rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm font-semibold leading-6 text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </label>
  )
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/45">{label}</p>
      <p className="mt-2 break-all font-mono text-xs text-on-surface">{value}</p>
    </div>
  )
}

function InspectorHint({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-6 text-sm font-semibold leading-6 text-on-surface-variant">
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
