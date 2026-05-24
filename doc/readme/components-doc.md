# EthioPrep Component Documentation

This document provides a comprehensive overview of the component architecture in EthioPrep. It is designed to help AI agents and developers quickly locate and understand UI components.

## Component Organization

Components are organized by functional area within `ethio-adaptive-learning/components/`.

### 1. UI Primitives (`ui/`)
Base reusable components, typically derived from or inspired by Shadcn UI.
- **`avatar.tsx`**: User profile image placeholder and fallbacks.
- **`button.tsx`**: Standard button variants following the project's design system.
- **`dropdown-menu.tsx`**: Reusable dropdown primitives.

### 2. CMS Infrastructure (`cms/`)
The core building blocks of the content management system.
- **`cms-form.tsx`**: High-level dynamic form generator based on CMS content definitions.
- **`cms-editor-shell.tsx`**: Layout wrapper for content editing pages, providing navigation and status feedback.
- **`cms-content-block-editor.tsx`**: Multi-block editor for rich content (Text, LaTeX, Media).
- **`cms-list.tsx`**: Generic table/list view for CMS entities with filtering and sorting.
- **`cms-media-picker.tsx`**: Integration with the Cloudinary-backed Asset Library.
- **`cms-relation-manager.tsx`**: Handles parent-child and peer-to-peer entity relationships.
- **`publication-controls.tsx`**: Draft/Publish/Unpublish lifecycle management.

### 3. Admin Studio & Workspace (`admin/`)

#### Layout & Shells (`admin/studio/layout/`)
Global administrative navigation and framing.
- **`nexus-sidebar.tsx`**: The global "rail" for switching between admin modules (Dashboard, Studio, Resources, etc.).
- **`context-sidebar.tsx`**: A secondary, module-specific sidebar for deep navigation.
- **`workspace-header.tsx`**: Global admin header with breadcrumbs and user menu.
- **`workspace-shell.tsx`**: The main responsive container for all administrative pages.

#### Curriculum Studio (`admin/studio/`)
Tools for managing the curriculum Knowledge Graph.
- **`curriculum-tree.tsx`**: A high-fidelity, interactive explorer for Courses, Units, and Concepts. Supports real-time search.
- **`builder/`**:
  - **`builder-workspace.tsx`**: The main drag-and-drop workspace for curriculum hierarchy.
  - **`builder-canvas.tsx`**: Visual node-based representation of units and concepts.
  - **`inspector.tsx`**: A persistent right-hand panel for editing the metadata of selected curriculum nodes.
- **`hub/`**:
  - **`hub-container.tsx`**: Project-level landing page for the Studio.
  - **`project-card.tsx`**: Interactive cards for navigating to specific Course Builders.

#### Administrative Modules (`admin/studio/modules/`)
Actionable dashboards for specialized oversight.
- **Governance**:
  - **`audit-timeline.tsx`**: Chronicle of system-wide editorial actions.
  - **`review-queue.tsx`**: Workspace for approving pending curriculum drafts.
- **Intelligence**:
  - **`studio-intelligence-dashboard.tsx`**: Central global pulse overview.
  - **`QuestionPerformanceTable.tsx`**: Analytics for EHSLCE-style questions.
  - **`ConceptTroubleSpots.tsx`**: Identifying friction in student learning loops.
  - **`CalibrationSuggestionCard.tsx`**: AI-powered BKT parameter tuning.
- **Platform**:
  - **`platform-sidebar.tsx`**: Infrastructure-focused navigation for roles, API, and regional settings.

#### Asset Library (`admin/resources/`)
Management of instructional media and reusable snippets.
- **`resource-browser.tsx`**: Grid/List view for media assets.
- **`resource-inspector.tsx`**: Metadata and usage tracking panel for assets.
- **`upload-resource-modal.tsx`**: Multi-file uploader for images and videos.

### 4. Student Experience (`student/`)
- **`student-sidebar.tsx`**: Main navigation for the student dashboard and learning paths.

### 5. Content Rendering (`content/`)
- **`content-blocks-renderer.tsx`**: Universal component for rendering CMS blocks (LaTeX, Markdown, Media) with proper styling.

### 6. Account & Identity (`account/`, `shared/`)
- **Account Management**: `profile-edit-form.tsx`, `password-change-form.tsx`.
- **Auth Forms**: `login-form.tsx`, `register-form.tsx`, `reset-password-form.tsx`.
- **Landing Page**: Modular sections in `landing/` (Hero, Features, How it Works).

## Visual Identity & Theme
- **`theme-provider.tsx`**: Next-themes integration for Dark/Light mode.
- **`theme-toggle.tsx`**: Floating button for switching visual modes.
- **Styling**: Most components use a combination of **Tailwind CSS** and **Glassmorphism** variables defined in `globals.css`.

## Common Prop Patterns
- **`status`**: Many CMS components accept a `tone` (success, error, warning) for feedback.
- **`asChild`**: Buttons and links follow the Radix UI `asChild` pattern for flexible composition.
- **`framer-motion`**: Used extensively for staggered entry animations and layout transitions.
