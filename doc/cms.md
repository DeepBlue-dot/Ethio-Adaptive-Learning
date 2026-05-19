# Global CMS

This document describes the redesigned Ethio Adaptive Learning CMS. The CMS is now a generic in-app content framework backed by the existing Prisma curriculum models.

## Purpose

The CMS is the protected authoring subsystem for `ADMIN` and `COURSE_WRITER` users. It manages the current curriculum domain as first-class content types inside one shared framework:

- courses
- units
- concepts
- questions
- chunks (Concept Chunks)
- worked-examples (Worked Examples)
- media-assets
- content-snippets

The redesign keeps the database schema largely unchanged, adding `updatedAt` for concurrency control. The CMS core provides a generic service, validation, registry, UI, and server-action boundary while the curriculum adapter preserves domain-specific behavior such as prerequisite validation and adaptive graph updates.

## Routes

The hard-coded `/admin/cms/concepts` and `/admin/cms/questions` route split has been replaced by generic App Router pages:

- `/admin/cms`
  - global content type index
- `/admin/cms/[type]`
  - list view for a content type
- `/admin/cms/[type]/new`
  - generic create form
- `/admin/cms/[type]/[id]`
  - generic edit form

Supported content type keys are:

- `course`
- `unit`
- `concept`
- `question`
- `chunk`
- `worked-example`
- `media-asset`
- `content-snippet`

Plural aliases such as `questions`, `concepts`, `media-assets`, and `content-snippets` resolve to the same definitions for compatibility.

## Core Architecture

The CMS core lives under `ethio-adaptive-learning/lib/cms/`:

- `core.ts`
  - generic operations: `createItem`, `updateItem`, `deleteItem`, `getItem`, `listItems`
  - CMS role access helper
  - editor model helpers
- `types.ts`
  - shared CMS interfaces such as `CmsContentType`, `CmsField`, `CmsEntity`, `CmsRelation`, and `CmsActionState`
- `registry.ts`
  - content type lookup, alias resolution, and serializable UI definitions
- `validation.ts`
  - metadata-driven form parsing, Zod validation, field-error flattening, and invalidation path helpers
- `repository/prisma.ts`
  - Prisma-backed repository that maps generic CMS operations to existing Prisma models
- `adapters/curriculum.ts`
  - curriculum-specific behavior and compatibility exports
- `definitions/*`
  - declarative metadata and Zod schemas for each content type

## Content Definitions

Each content type definition owns:

- field metadata used by the admin UI
- list columns
- default values
- Zod schema
- route aliases
- revalidation paths
- display metadata

The current definitions are:

- `definitions/course.ts`
- `definitions/unit.ts`
- `definitions/concept.ts`
- `definitions/question.ts`
- `definitions/chunk.ts`
- `definitions/worked-example.ts`
- `definitions/media-asset.ts`
- `definitions/content-snippet.ts`

Concept editing remains richer than a simple flat form. The concept definition includes embedded `chunks` and `workedExamples` collections so a concept can still be saved atomically with its instructional blocks.

## Persistence Strategy

The CMS uses existing Prisma models:

- `Course`
- `Unit`
- `Concept`
- `Question`
- `ConceptChunk`
- `WorkedExample`
- `MediaAsset`
- `ContentSnippet`
- `ConceptPrerequisite`
- `ConceptClosure`
- `CmsDraft`

All primary models now include an `updatedAt` field to support optimistic concurrency control.

## Conflict Resolution

The CMS implements basic conflict detection. When an item is loaded for editing, its `updatedAt` timestamp is captured. Upon saving, this timestamp is compared against the current value in the database. If the database record is newer than the captured timestamp, the save is rejected with a conflict error, prompting the author to refresh and merge changes manually.

## Domain Rules

Curriculum-specific rules stay in the adapter/service layer:

- concept prerequisites must belong to the same course
- prerequisite cycles are rejected
- concept closure rows are rebuilt after graph changes
- slugs remain unique within their existing scopes
- question deletion clears dependent attempt/log records
- course and unit deletion preserve existing deep cleanup behavior
- student-facing catalog behavior remains backed by the same curriculum facade

`lib/curriculum.ts` remains as a compatibility facade for student and adaptive modules, but CMS-facing operations now pass through the global CMS adapter boundary.

## Admin UI

Reusable CMS UI components live under `ethio-adaptive-learning/components/cms/`:

- `cms-list.tsx`
- `cms-form.tsx`
- `cms-field.tsx`
- `cms-reference-picker.tsx`
- `cms-relation-manager.tsx`
- `cms-editor-shell.tsx`
- `cms-feedback.tsx`
- `publication-controls.tsx`

The form renderer reads field metadata from the content definition (including `min`, `max`, `step` constraints) and supports:

- text inputs
- textareas
- Markdown textareas
- number fields
- probability fields
- select fields
- single-reference pickers
- multi-reference pickers
- embedded ordered collections
- reusable content blocks
- managed media asset inputs for Cloudinary images and YouTube embeds

## Server Actions

All CMS mutations now enter through:

- `app/(admin)/admin/cms/actions.ts`

Generic actions:

- `saveCmsItem`
- `deleteCmsItem`

The action boundary:

- requires `ADMIN` or `COURSE_WRITER`
- resolves the content type
- parses form data through metadata
- validates with the content definition Zod schema
- executes through the CMS core
- revalidates paths from type metadata
- redirects with structured status/error messages
- returns `CmsActionState` for inline validation errors

## Revalidation

Each content definition declares invalidation paths. Common paths include:

- `/admin/dashboard`
- `/admin/cms`
- `/admin/cms/[type]`
- `/concepts`

Concept and question changes also invalidate relevant learning surfaces such as `/learn/[conceptId]`.

## Verification

The CMS redesign is covered by:

- registry and alias resolution tests
- metadata-driven validation tests
- generic CMS action tests
- existing curriculum service tests for graph rules, slug behavior, question cleanup, and student integration

Recommended checks:

- `npm run test`
- `npm run lint`
- `npm run build`
