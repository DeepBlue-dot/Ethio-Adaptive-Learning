# Global CMS

This document describes the Ethio Adaptive Learning CMS architecture. The CMS is a generic in-app content framework backed by Prisma curriculum models, optimized for authoring efficiency and collaborative workflows.

## Purpose

The CMS is the protected authoring subsystem for `ADMIN` and `COURSE_WRITER` users. It manages the curriculum domain as first-class content types:

- **Courses:** Top-level curriculum containers.
- **Units:** Sequential modules within courses.
- **Concepts:** Adaptive knowledge nodes with prerequisite graphs.
- **Questions:** Assessment items linked to concepts.
- **Chunks & Worked Examples:** Instructional blocks embedded within concepts.
- **Media Assets:** Cloudinary images and YouTube embeds.
- **Content Snippets:** Reusable UI text fragments.

## Core Architecture

The CMS core lives under `ethio-adaptive-learning/lib/cms/`:

- `core.ts`: Generic operations (`createItem`, `updateItem`, `deleteItem`, `listItems`) and access control.
- `types.ts`: Shared interfaces (`CmsContentType`, `CmsField`, `CmsEntity`, `CmsActionState`).
- `registry.ts`: Content type registration and metadata-driven lookup.
- `validation.ts`: Zod-backed form parsing and field-level validation.
- `repository/prisma.ts`: Persistence layer mapping generic actions to Prisma models with **Optimistic Concurrency Control**.
- `activity.ts`: Audit trail logging (`CREATE`, `UPDATE`, `PUBLISH`, etc.).
- `definitions/`: Declarative schemas for each content type.

## Key Features

### 1. Collaborative Workflow & Draft System
- **Draft Overlay:** Authors can save "unsaved drafts" for published entities without affecting the live student experience.
- **Activity Logs:** Every change is recorded in an audit trail, visible at `/admin/cms/activity`.
- **Conflict Detection:** Uses `updatedAt` timestamps to prevent save conflicts if multiple authors edit the same item simultaneously.

### 2. Advanced Authoring UI
- **Drag-and-Drop Reordering:** Lesson blocks and related collections (chunks, examples) can be reordered visually using a drag handle.
- **Media Library:** A dedicated `CmsMediaPicker` modal allows authors to search and select assets instead of manual ID entry.
- **Entity Reordering:** Admins can reorder child entities (e.g., Units within a Course) directly from the parent's edit page.

### 3. Bulk Management & Filtering
- **Advanced Lists:** CMS lists support searching, status filtering, and multi-select bulk actions (publish, unpublish, delete).
- **Metadata Filters:** Lists can be filtered by **Author** and **Date Range** (Created After/Before).

### 4. Role-Based Access Control (RBAC)
- **Field Gating:** Specific fields (e.g., critical BKT parameters like `pLo`, `pT`) can be marked as `adminOnly: true`.
- **Access Level:** `COURSE_WRITER` users can author content but may be restricted from modifying sensitive adaptive parameters reserved for `ADMIN` users.

## Routes

- `/admin/cms`: Global content type index.
- `/admin/cms/[type]`: List view with advanced filtering and bulk actions.
- `/admin/cms/[type]/new`: Generic creation form.
- `/admin/cms/[type]/[id]`: Generic editor with embedded reordering tools.
- `/admin/cms/activity`: System-wide audit log.

## Admin UI Components

Located in `ethio-adaptive-learning/components/cms/`:

- `cms-list.tsx`: Enhanced list with filtering and bulk actions.
- `cms-form.tsx`: Dynamic form renderer.
- `cms-content-block-editor.tsx`: Drag-and-drop block editor.
- `cms-relation-manager.tsx`: Drag-and-drop relation list.
- `cms-media-picker.tsx`: Searchable media library modal.
- `cms-entity-reorderer.tsx`: Standalone drag-and-drop reordering tool.

## Server Actions

Found in `app/(admin)/admin/cms/actions.ts`:

- `saveCmsItem`: Handles both "Publish" and "Save Draft" intents.
- `unpublishCmsItem` / `deleteCmsItem`: Lifecycle management.
- `bulkActionCmsItems`: Executes actions on multiple IDs simultaneously.
- `reorderCmsEntities`: Persists new sort orders for collections.

## Revalidation

Each content definition declares revalidation paths. Mutations automatically trigger `revalidatePath` for relevant admin views and student-facing learning surfaces (e.g., `/learn/[conceptId]`).

## Verification

Recommended development cycle:

- `npm run test`: Run unit tests for CMS core and validation.
- `npm run lint`: Ensure code style and type safety.
- `npm run build`: Verify production compilation.
