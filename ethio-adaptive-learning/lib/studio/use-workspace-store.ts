import { create } from "zustand"

interface WorkspaceState {
  activeNodeId: string | null
  selectedItems: Set<string>
  shelfOpen: boolean
  zoomLevel: number
  
  // Actions
  setActiveNode: (id: string | null) => void
  toggleSelection: (id: string) => void
  clearSelection: () => void
  setShelfOpen: (isOpen: boolean) => void
  setZoom: (level: number) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeNodeId: null,
  selectedItems: new Set(),
  shelfOpen: false,
  zoomLevel: 1.0,

  setActiveNode: (id) => set({ activeNodeId: id }),

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
}))
