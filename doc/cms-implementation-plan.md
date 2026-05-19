Plan (high-level steps)

Define goals, personas, and success metrics.
Design information architecture and routes.
Specify page-level UX and component library.
Define forms, validation, and server-action interactions.
Design publishing/draft workflow and role rules.
Define data flow, caching, revalidation, and optimistic UI.
Create phased implementation roadmap with QA checks.
Goals & Metrics

Primary Goal: Fast, predictable authoring for ADMIN and COURSE_WRITER with minimal context switching.
Secondary Goals: Reusability (snippets/media), safe publishing, and clear content lifecycle.
Success Metrics: Time-to-publish, error rate in saves, author satisfaction score, revisit frequency for edits.
Personas

Admin: Manages site, users, high-level content, and publishes major changes.
Course Writer: Focuses on course/unit/concept/question authoring, drafts, and iterative publishing.
Information Architecture / Routes

Registry: /admin/cms — content-type cards + counts + quick actions.
Type list: /admin/cms/[type] — filter, bulk actions, upload (for media-asset).
Editor (new): /admin/cms/[type]/new — guided creation wizard for complex types.
Editor (edit): /admin/cms/[type]/[id] — side-panel editor with autosave + history.
Media Library: /admin/cms/media-asset — list, preview, upload, search, embed.
Snippets: /admin/cms/content-snippet — create/manage reusable blocks.
Audit & Activity: /admin/cms/activity — recent changes, publish log, conflicts.
Page UX Patterns

Registry Card: type icon, plural label, count, Open button, Quick-create dropdown.
List View: table/grid, server-side filters (course, status, author), bulk publish/delete, fast preview.
Editor Shell: left column metadata, center WYSIWYG/blocks, right column contextual side panel (relations, preview, publish controls).
Inline Validation: field-level errors returned from CmsActionState and highlighted with clear messages.
Preview Mode: live render of content using same renderer(s) as student-facing pages.
Component Library (reusable)

CmsEditorShell: layout + permissions gating.
CmsForm: metadata-driven field renderer.
CmsField: text, textarea, markdown, select, number, probability, content-blocks, reference-picker.
MediaUploader: drag/drop, progress, Cloudinary integration, image preview, auto-thumb.
SnippetPicker: search and insert snippet into content blocks.
PublicationControls: draft/save, publish/unpublish, schedule, change notes.
ConflictResolver: shows draft conflicts and merge options.
Authoring & Editor UX Details

Block-based editor: Use contentBlocks schema with block types (text, image, snippet, question-ref, code).
Autosave + Manual Save: Autosave to CmsDraft every N seconds and show status; explicit Save Draft persists with author and timestamp.
Publishing modal: required publish metadata (notes, minor/major), shows revalidation paths, affected pages, and confirmation.
Embedded references: reference picker shows filtered results and resolves by alias; inline validation when referenced entity deleted.
WYSIWYG Markdown Renderer: preview toggle and full-page preview that uses same render pipeline as site.
Forms, Validation, and Server Actions

Metadata-driven parsing: derive UI and server parsing from definitions/* (fields + schema).
Zod schemas: server-side validation via the content definition schema, returning CmsActionState for inline errors.
Server actions: saveCmsItem, deleteCmsItem, unpublishCmsItem, uploadCmsImageAsset. Use requireCmsAccess to gate.
Client-server contract: FormData keys => parsed by parseCmsFormData; standardize intent (save-draft | publish).
Publishing & Lifecycle

Draft model: CmsDraft for in-progress edits; author can continue across sessions.
Publication statuses: DRAFT, PUBLISHED, UNPUBLISHED surfaced prominently.
Publish flow: verify domain rules in adapter (e.g., prerequisites), rebuild closures if needed, revalidate declared paths.
Rollback & History: simple changelist per entity (diff view), ability to revert to previous published version.
Permissions & Access Control

Role rules: ADMIN full access; COURSE_WRITER limited to content types and actions defined in requireCmsAccess.
Field-level gating: some fields (e.g., publishedAt) editable only by ADMIN.
Preview access: authors can preview drafts (signed preview tokens if preview route is public).
Media & Snippet Workflows

Media Library: central media-asset listing, upload form, Cloudinary-backed storage, image metadata editable.
YouTube support: validate/normalize via youtube helper, store videoId and thumbnailUrl.
Snippet usage: content-snippet entries are selectable in the block editor and expand at render-time.
Data Flow, Caching & Revalidation

Server Actions trigger revalidation: use revalidatePath() for each path returned by getRevalidationPaths.
Edge cache & preview: static student-facing pages invalidate via the revalidation list.
Optimistic UI: show immediate local changes on save-draft; show publish spinner until server-confirmed.
Pagination & counts: server-side for large sets; registry card counts via getContentTypeCounts.
Error Handling & Conflict Resolution

Inline errors: surfaced by CmsActionState and mapped to specific fields.
Save conflicts: detect concurrent draft vs published changes; show ConflictResolver with options: overwrite, merge, or keep drafts.
Undo & soft-delete: soft-delete for safety; provide graceful cleanup for cascade-deletions.
Accessibility & Internationalization

WCAG AA: accessible form controls, labels, keyboard navigation for block editor.
i18n-ready: content fields store localized strings where required; UI strings externalized.
Testing & QA

Unit tests: definitions/schemas parsing, parseCmsFormData, Zod validations.
Integration tests: saveCmsItem, deleteCmsItem, uploadCmsImageAsset flows.
E2E: author workflows for create/publish/unpublish/rollback.
Visual regression: critical pages (editor shell, registry cards, media library).