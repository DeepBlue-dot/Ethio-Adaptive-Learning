# EthioPrep Studio: Admin Frontend Redesign Plan

This document outlines the high-level design for reimagining the Admin and `COURSE_WRITER` frontend into an immersive, expandable "Authoring Studio."

## 1. Vision
EthioPrep Studio transforms the CMS from a series of forms into a professional, integrated workspace. It prioritizes curriculum hierarchy, content intelligence, and ease of expansion.

## 2. Core Architectural Changes

### 2.1 Full-Viewport Layout
We will transition from a traditional centered grid to an edge-to-edge "SaaS App" layout.
- **Global Nexus (Fixed Left):** Minimalist sidebar for module switching (Studio, Assets, Intelligence, Governance).
- **Context Pane (Dynamic Left):** A collapsible panel for navigating the currently active module (e.g., Curriculum Tree in Studio).
- **Workspace (Center):** The main focus area for editing or dashboarding.

### 2.2 Curriculum-First Navigation
Instead of technical lists, authors browse via the **Curriculum Tree Browser**:
- Visual hierarchy: Course > Unit > Concept.
- In-line actions: "Add Unit," "Reorder," "Publish Status" indicators.
- Draggable nodes for quick restructuring.

### 2.3 The "Command Palette"
A global `CMD+K` interface for:
- Jumping to any Concept, Question, or Asset by name/slug.
- Quickly switching modules.
- Executing admin actions (e.g., "Clear Cache," "Add User").

## 3. Module Breakdown

### 3.1 Studio (Curriculum Module)
- **Canvas Editor:** A cleaner, "Distraction-Free" editor for concepts.
- **Split-Pane View:** Side-by-side editing and live student-view preview.
- **Block Palette:** Drag-and-drop drawer for adding lesson blocks.

### 3.2 Intelligence (Analytics Module)
- **Content Pulse:** Dashboard showing student struggle points and success rates.
- **Usage Metrics:** Visibility into which courses are most active.

### 3.3 Governance (Review Module)
- **Audit Feed:** Reimagined activity log with better grouping.
- **Review Queue:** A dedicated workflow for approving `COURSE_WRITER` drafts.

### 3.4 Infrastructure (Assets Module)
- **Media Library:** A Pinterest-style grid for Cloudinary assets.
- **Snippet Vault:** Quick management of reusable text fragments.

## 4. Design System: "Studio Aesthetics"
- **Color Palette:** Deep Slate-950/900 for sidebars, pure White for canvas, Teal-600 for primary actions.
- **Typography:** Inter/Geist for clean, high-density information display.
- **Density:** Professional, high-density UI to maximize visibility of complex curriculum data.

## 5. Implementation Strategy

### Phase 1: The Shell & Navigation
1.  **New Studio Layout:** Create the three-pane layout architecture.
2.  **Curriculum Tree Browser:** Implement the hierarchical navigator for the Studio module.
3.  **Command Bar:** Add the initial global search infrastructure.

### Phase 2: The Studio Experience
1.  **Canvas Redesign:** Update `CmsForm` and `CmsEditorShell` into the "Studio" aesthetic.
2.  **Preview Sidebar:** Integrate the student-view preview directly into the editor.

### Phase 3: Module Expansion
1.  **Intelligence Dashboard:** Add the first set of content analytics widgets.
2.  **Governance Workflow:** Implement the review status UI.

---

**Next Steps:**
1.  Review this design with the user.
2.  Create the new Studio layout components.
3.  Refactor existing CMS routes to fit into the new panes.
