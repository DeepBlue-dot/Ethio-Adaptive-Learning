import { create } from "zustand"

type InspectorTarget = "page" | "block" | null
type DevicePreview = "desktop" | "tablet" | "mobile"
type ActiveNodeType = "concept" | "unit" | null

interface WorkspaceState {
  activeSiteId: string | null
  activePageId: string | null
  selectedBlockId: string | null
  selectedInspectorTarget: InspectorTarget
  activeNodeId: string | null
  activeNodeType: ActiveNodeType
  selectedItems: Set<string>
  shelfOpen: boolean
  zoomLevel: number
  devicePreview: DevicePreview
  dirtyBlockIds: Set<string>
  
  // Actions
  setActiveSite: (id: string | null) => void
  setActivePage: (id: string | null) => void
  selectPage: (id: string | null) => void
  selectBlock: (id: string | null) => void
  setInspectorTarget: (target: InspectorTarget) => void
  setActiveNode: (id: string | null, type?: ActiveNodeType) => void
  toggleSelection: (id: string) => void
  clearSelection: () => void
  setShelfOpen: (isOpen: boolean) => void
  setZoom: (level: number) => void
  setDevicePreview: (device: DevicePreview) => void
  markBlockDirty: (id: string) => void
  clearBlockDirty: (id: string) => void
  clearDirtyBlocks: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeSiteId: null,
  activePageId: null,
  selectedBlockId: null,
  selectedInspectorTarget: null,
  activeNodeId: null,
  activeNodeType: null,
  selectedItems: new Set(),
  shelfOpen: false,
  zoomLevel: 1.0,
  devicePreview: "desktop",
  dirtyBlockIds: new Set(),

  setActiveSite: (id) => set({ activeSiteId: id }),

  setActivePage: (id) => set({ activePageId: id }),

  selectPage: (id) => set({
    activePageId: id,
    selectedBlockId: null,
    selectedInspectorTarget: id ? "page" : null,
    activeNodeId: id,
    activeNodeType: id ? "concept" : null,
  }),

  selectBlock: (id) => set({
    selectedBlockId: id,
    selectedInspectorTarget: id ? "block" : null,
    activeNodeId: id,
    activeNodeType: null,
  }),

  setInspectorTarget: (target) => set({ selectedInspectorTarget: target }),

  setActiveNode: (id, type = null) => set({
    activeNodeId: id,
    activeNodeType: id ? type : null,
    selectedBlockId: null,
    selectedInspectorTarget: null,
  }),

  toggleSelection: (id) => set((state) => {
    const next = new Set(state.selectedItems)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    return { selectedItems: next }
  }),

  clearSelection: () => set({ selectedItems: new Set() }),

  setShelfOpen: (isOpen) => set({ shelfOpen: isOpen }),

  setZoom: (level) => set({ zoomLevel: Math.max(0.1, Math.min(2.0, level)) }),

  setDevicePreview: (device) => set({ devicePreview: device }),

  markBlockDirty: (id) => set((state) => {
    const next = new Set(state.dirtyBlockIds)
    next.add(id)
    return { dirtyBlockIds: next }
  }),

  clearBlockDirty: (id) => set((state) => {
    const next = new Set(state.dirtyBlockIds)
    next.delete(id)
    return { dirtyBlockIds: next }
  }),

  clearDirtyBlocks: () => set({ dirtyBlockIds: new Set() }),
}))
