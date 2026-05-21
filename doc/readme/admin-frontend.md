# EthioPrep Studio: Admin Frontend Architecture

EthioPrep Studio is the professional authoring and administrative environment for the Ethio-Adaptive-Learning platform. It is designed as a high-density, immersive "OS-level" interface for curriculum architects, data scientists (Intelligence), and administrators.

## 1. Design Philosophy

- **High-Density Utility:** Prioritizes information density and professional tools over whitespace, modeled after IDEs and high-end SaaS dashboards.
- **Material 3 Integration:** Follows Material Design 3 principles using semantic tokens (`surface-container`, `on-surface-variant`, etc.) for perfect theme consistency.
- **Glassmorphism & Depth:** Uses `backdrop-blur` and translucent surfaces to create a modern, layered hierarchy.
- **Cultural Resonance:** Integrates the `tibeb-pattern` (traditional Ethiopian textile motif) as a subtle background element.
- **Visual Stability:** Employs a "Flex-Push" layout model on desktop to prevent sidebar overlapping and ensure smooth state transitions.

## 2. Layout Architecture (The Three-Pane Model)

The Studio uses a nested layout system powered by Next.js to provide modular navigation.

### 2.1 Pane 1: Global Nexus (`NexusSidebar`)
- **Width:** Fixed `240px` (Expanded) or `72px` (Collapsed).
- **Purpose:** High-level module switching (Studio, Intelligence, Assets, Governance).
- **Desktop:** A `sticky` flex-item that naturally pushes the UI when toggled.
- **Mobile:** Transforms into a hidden off-canvas drawer triggered by the hamburger menu.

### 2.2 Pane 2: Context Navigator (`ContextSidebar`)
- **Width:** `320px` (Fixed).
- **Purpose:** Module-specific navigation (e.g., Curriculum Tree in Studio, Metric Links in Intelligence).
- **Desktop:** Can be collapsed into a `40px` strip to maximize workspace.
- **Mobile:** Rendered inside the unified `NexusSidebar` drawer via a "Navigator" tab.

### 2.3 Pane 3: Workspace (`WorkspaceShell`)
- **Width:** `flex-1` (Dynamic).
- **Purpose:** The primary content area for forms, tables, and analytics.
- **Scrolling:** Uses a `flex-col h-full overflow-hidden` model with an internal `overflow-y-auto` scroll area to maintain a fixed header.

## 3. Core Framework Components

### 3.1 `StudioLayoutProvider`
- **Location:** `components/admin/studio/layout/studio-layout-provider.tsx`
- **Responsibility:** Manages global UI states:
  - `isNexusCollapsed`: Desktop rail state.
  - `isContextPaneExpanded`: Secondary sidebar toggle.
  - `isMobileNexusOpen`: Mobile drawer visibility.
  - `contextContent`: Dynamic slot for module-specific navigators.

### 3.2 `WorkspaceHeader`
- **Responsibility:** Contextual TopAppBar.
- **Features:** 
  - Dynamic **Breadcrumbs** (e.g., `Studio > Curriculum > Grade 12 Math`).
  - Global Search with `⌘K` affordance.
  - System-wide notifications and history.

## 4. Module Implementation Pattern

To add a new module (e.g., "AI Laboratory"):

1.  **Sidebar:** Create `components/admin/studio/modules/ai-lab/ai-lab-sidebar.tsx`.
2.  **Route:** Create `app/(admin)/admin/ai-lab/layout.tsx`.
3.  **Integration:**
    ```tsx
    // In layout.tsx
    <ContextSidebar>
      <AiLabSidebar />
    </ContextSidebar>
    <WorkspaceShell hasContextSidebar>
      <WorkspaceHeader title="AI Lab" breadcrumbs={[{ label: "Experiment" }]} />
      {children}
    </WorkspaceShell>
    ```

## 5. Visual Tokens & Utilities

- `.tibeb-pattern`: SVG-based cultural background pattern.
- `.glass-panel`: `backdrop-blur-xl` container with semi-transparent borders.
- `.tree-line`: Vertical hierarchy markers used in navigators.
- `.custom-scrollbar`: High-density scroll styling for side-panes.

## 6. Theme & Responsiveness

- **Dark Mode:** Powered by Tailwind's `dark:` variant and CSS variables in `globals.css`. Uses high-contrast primary accents (`text-primary`) for active states to ensure readability.
- **Mobile Drawer:** On small screens, sidebars are removed from the DOM flow and combined into a unified "Dual-Pane" drawer:
  - **Left Rail (64px):** Module icons.
  - **Main Area:** Module navigator (registered via `contextContent`).

---
*Note for LLM Engineers: When modifying layouts, always check `WorkspaceShell` padding and `ContextSidebar` translation values to maintain the Flex-Push integrity.*
