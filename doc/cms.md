# Curriculum CMS

This document explains how the content management system (CMS) in the Ethio Adaptive Learning project is built, what it manages, and how the current Phase 2 CMS flows work.

## Purpose

The CMS is an in-app authoring layer for Grade 12 Mathematics curriculum content. It is designed for `ADMIN` and `COURSE_WRITER` users to create and maintain:

- courses and units
- concepts and prerequisite structure
- concept content segments and worked examples
- assessment questions tied to concepts

This is not a public content API or a third-party CMS service. All content management happens through server-rendered admin pages and protected server actions.

## Role-based access

There are two CMS roles in the app:

- `ADMIN`: Full access to CMS content pages and broader admin surfaces.
- `COURSE_WRITER`: Access to curriculum authoring pages but not system-level admin surfaces such as `/admin/users`.

CMS pages are gated using the same role check used by the app, so only `ADMIN` or `COURSE_WRITER` can reach `/admin/cms/concepts` and `/admin/cms/questions`.

## CMS entrypoints

The CMS currently has two main authoring surfaces:

- `/admin/cms/concepts`
  - manage courses, units, concepts, prerequisites, content chunks, and worked examples
- `/admin/cms/questions`
  - browse and filter the question bank
  - open dedicated create/edit routes for concept-linked questions

These pages live under `app/(admin)/admin/cms/` and use feature-specific server action modules to perform writes.

## Curriculum content model

The CMS is built on the Prisma curriculum schema in `prisma/schema.prisma`. The key CMS entities are:

- `Course`
  - top-level curriculum container
  - fields: `slug`, `title`, `description`, `archivedAt`, `authorId`
- `Unit`
  - ordered container for concepts within a course
  - fields: `title`, `order`, `slug`, `courseId`
- `Concept`
  - learning unit in the graph
  - fields: `title`, `description`, `contentBody`, `unlockThreshold`, `pLo`, `pT`, `pG`, `pS`, `decayLambda`
  - relations: `prerequisiteEdges`, `dependentEdges`, `chunks`, `workedExamples`, `questions`
- `ConceptPrerequisite`
  - directed graph edge expressing that one concept depends on another
  - enforces acyclic prerequisites within the same course
- `ConceptChunk`
  - instructional content block for a concept
  - fields: `title`, `bodyMd`, `order`, `authorId`
- `WorkedExample`
  - example problem and solution tied to a concept
  - fields: `title`, `problemMd`, `solutionMd`, `order`, `authorId`
- `Question`
  - assessment item linked to a concept
  - fields: `usage`, `difficulty`, `content`, `correctAnswer`, `distractors`, `hintText`, `explanation`, `authorId`

## CMS workflows

### Courses

The course CMS supports:

- create course
- update course title, description, and assigned author
- archive course (`archivedAt`)
- restore archived course
- delete course and all dependent units, concepts, and related content

Courses are read in the CMS from `getCurriculumHierarchyCmsData()` in `lib/curriculum/course.ts` and re-exported through `lib/curriculum.ts`.

### Units

Units belong to courses and are ordered within a course. The CMS allows:

- create unit with `courseId`, `title`, and `order`
- update unit title and order
- delete unit and all nested concept content

Units are created, updated, and deleted through `createUnit()`, `updateUnit()`, and `deleteUnit()`.

### Concepts

Concept authoring supports:

- create/edit concept title, description, content body, unlock threshold, and BKT defaults
- manage concept prerequisites via a multi-select list
- delete concept and all dependent instructional content

Concept edits are handled by the dedicated concept editor action and persisted through `saveConceptEditor()` in `lib/curriculum/concept-editor.ts`.

### Prerequisite graph

Prerequisites are explicit directed edges between concepts.

CMS behavior:

- prerequisites must belong to the same course as the dependent concept
- cycles are rejected before save using graph validation
- selecting prerequisites is handled on the concept form and saved by `setConceptPrerequisites()`
- the system rebuilds closure data after changes so unlock logic stays consistent

The prerequisite validation is implemented in `lib/adaptive/graph.ts` and enforced in `lib/curriculum/saveConceptEditor.ts` plus concept-level helpers.

### Content chunks and worked examples

A concept can contain:

- `ConceptChunk` entries for instructional content blocks
- `WorkedExample` entries for example problems and solutions

Both are authored in the concept CMS page and persist with `createConceptChunk()`, `updateConceptChunk()`, `createWorkedExample()`, and `updateWorkedExample()`.

### Questions

Question authoring is managed from `/admin/cms/questions` and supports:

- browse a filterable question bank
- create question from `/admin/cms/questions/new`
- edit/delete question from `/admin/cms/questions/[id]`
- assign concept, usage type, difficulty tier
- provide prompt, correct answer, distractors, hint, and explanation
- filter by course, unit, and concept

Question persistence is implemented in `lib/curriculum/question.ts` via `saveQuestion()`, `createQuestion()`, `updateQuestion()`, and `deleteQuestion()`. Question bank and editor read models live in `lib/curriculum/question-bank.ts` and are re-exported through `lib/curriculum.ts`.

## Server-side implementation

### Data access and CMS reads

CMS reads are split by domain and re-exported through `ethio-adaptive-learning/lib/curriculum.ts`:

- `lib/curriculum/course.ts`
  - `getCmsAuthors()` returns eligible `ADMIN` and `COURSE_WRITER` users
  - `getCurriculumHierarchyCmsData()` loads authors plus all courses with active and archived states
- `lib/curriculum/concept-editor.ts`
  - `getConceptEditorCmsData(conceptId)` loads the dedicated concept editor view model
- `lib/curriculum/question-bank.ts`
  - `getQuestionBankCmsData(filters)` loads the question bank list plus active curriculum filters
  - `getQuestionEditorCmsData(questionId?)` loads concept options and the dedicated question editor view model
- `lib/curriculum.ts`
  - re-exports the question bank and editor read helpers for compatibility

These read helpers power the admin pages and their filter states.

### Server actions

The CMS uses Next.js server actions defined in:

- `app/(admin)/admin/cms/concepts/course-actions.ts`
- `app/(admin)/admin/cms/concepts/unit-actions.ts`
- `app/(admin)/admin/cms/concepts/concept-actions.ts`
- `app/(admin)/admin/cms/concepts/concept-editor-actions.ts`
- `app/(admin)/admin/cms/questions/question-actions.ts`
- `app/(admin)/admin/cms/questions/question-editor-actions.ts`

Each form submission calls a server action responsible for:

- requiring the CMS role
- validating form data
- invoking domain-specific curriculum services re-exported from `lib/curriculum.ts`
- revalidating related pages after updates
- redirecting back to the CMS page with status or error messages

### Validation and slug generation

Validation and slug generation helpers are split between `lib/cms/schemas/*` and `lib/curriculum/shared.ts`:

- `zod` schemas for course, unit, concept draft, and concept editor payloads
- `zod` schemas for question form payloads and question bank filters
- `requireText()` and `requireId()` for required fields
- `requireProbability()` for threshold and BKT parameters
- `requireEnumValue()` for question usage and difficulty
- slug resolution functions that ensure unique slugs within the proper scope
- author validation to ensure assigned authors are `ADMIN` or `COURSE_WRITER`

## Student-facing integration

CMS content feeds the student curriculum catalog in `app/(student)/concepts/page.tsx`.

The student experience is driven by:

- active, non-archived courses
- ordered units and concepts
- derived concept status from mastery and prerequisites
- visible locks and unmet prerequisite explanations

`getStudentConceptCatalog(userId)` in `lib/curriculum.ts` returns the curriculum projection consumed by student pages.

## Revalidation strategy

After any CMS mutation, the server actions call `revalidatePath()` for:

- `/admin/dashboard`
- `/admin/cms/concepts`
- `/admin/cms/questions`
- `/admin/cms/questions/[id]`
- `/concepts`

Question saves also revalidate `/learn/[conceptId]` so dedicated learning pages pick up updated assessment content.

## Phase 2 boundaries and current limitations

Current CMS phase intentionally avoids:

- a full-featured WYSIWYG or rich text editor
- public REST/GraphQL APIs for curriculum writes
- external CMS platforms or headless CMS services
- general-purpose content versioning or workflow review

The CMS is a Phase 2 authoring surface focused on delivering:

- structured curriculum content by course/unit/concept
- safe prerequisite graph editing with cycle prevention
- question bank authoring linked to concept taxonomy
- student catalog behavior driven by actual curriculum and mastery data

## Relevant files

- `app/(admin)/admin/cms/concepts/page.tsx`
- `app/(admin)/admin/cms/concepts/course-actions.ts`
- `app/(admin)/admin/cms/concepts/unit-actions.ts`
- `app/(admin)/admin/cms/concepts/concept-actions.ts`
- `app/(admin)/admin/cms/questions/page.tsx`
- `app/(admin)/admin/cms/questions/new/page.tsx`
- `app/(admin)/admin/cms/questions/[id]/page.tsx`
- `app/(admin)/admin/cms/questions/question-editor-form.tsx`
- `app/(admin)/admin/cms/questions/question-actions.ts`
- `app/(admin)/admin/cms/questions/question-editor-actions.ts`
- `ethio-adaptive-learning/lib/curriculum/question.ts`
- `ethio-adaptive-learning/lib/curriculum/question-bank.ts`
- `ethio-adaptive-learning/lib/cms/schemas/question-schema.ts`
- `ethio-adaptive-learning/lib/cms/schemas/question-filter-schema.ts`
- `app/(admin)/admin/cms/concepts/concept-editor-actions.ts`
- `app/(admin)/admin/cms/questions/page.tsx`
- `app/(admin)/admin/cms/questions/actions.ts`
- `ethio-adaptive-learning/lib/curriculum.ts`
- `ethio-adaptive-learning/lib/curriculum/course.ts`
- `ethio-adaptive-learning/lib/curriculum/concept-editor.ts`
- `ethio-adaptive-learning/lib/curriculum/saveConceptEditor.ts`
- `ethio-adaptive-learning/lib/adaptive/graph.ts`
- `ethio-adaptive-learning/app/(student)/concepts/page.tsx`
- `prisma/schema.prisma`
