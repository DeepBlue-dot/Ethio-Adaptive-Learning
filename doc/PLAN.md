# Phase 2 Plan: Curriculum CMS and Knowledge Structure

## Summary
- Build Phase 2 around a **Math-only MVP** with a real **admin/course-writer CMS**, not file imports.
- Activate `COURSE_WRITER` with **limited CMS access**: courses, units, concepts, prerequisites, and questions; keep user/system screens `ADMIN`-only.
- Keep lesson content simple for now: **one Markdown/LaTeX `contentBody` per concept**, with worked examples inline.
- Replace the current implicit concept self-relation with an explicit prerequisite model so cycle checks, editing, and unlock logic are maintainable.

## Implementation Changes
- **Schema and domain model**
  - Replace `Concept.prerequisites/dependents` implicit many-to-many with `ConceptPrerequisite { prerequisiteConceptId, dependentConceptId }`.
  - Add `Concept.unlockThreshold` as a per-concept float, default `0.90`.
  - Keep `Course -> Unit -> Concept -> Question` as the main content hierarchy.
  - Keep `contentBody` on `Concept` as the lesson source of truth; do not add separate worked-example tables in Phase 2.
  - Add basic integrity constraints:
    - `Unit.order` unique per course
    - optional `Concept.title` uniqueness within a unit
    - no self-edge prerequisites
  - Preserve existing BKT parameter fields on `Concept`; Phase 2 only exposes them in CMS, not adaptive execution.

- **Permissions and route shape**
  - Keep public/student routing as-is.
  - Expand the admin tree with real CMS pages under `/admin/cms/concepts` and `/admin/cms/questions`.
  - Allow `COURSE_WRITER` into the CMS routes and dashboard shell, but block `/admin/users` and any future system-admin surfaces.
  - Update the admin navigation so `ADMIN` sees all items and `COURSE_WRITER` sees only content-management items.

- **CMS behavior**
  - Courses:
    - list, create, edit, archive/delete
    - assign author
  - Units:
    - create/edit/reorder within a course
  - Concepts:
    - create/edit with title, description, `contentBody`, BKT defaults, and `unlockThreshold`
    - assign to a unit
    - manage prerequisite edges through a dedicated selector UI
    - reject cycles before save
  - Questions:
    - create/edit/delete
    - assign concept, usage, difficulty, prompt, answer, distractors, hint, explanation
    - support topic lookup by course/unit/concept filters
  - Keep authoring forms server-rendered with standard inputs and server actions/route handlers; no rich text editor in this phase.

- **Knowledge structure logic**
  - Add a graph service in `lib/adaptive` or a dedicated curriculum module that:
    - fetches prerequisite sets for a concept
    - validates proposed edges are acyclic
    - computes whether a concept is unlocked using the concept’s `unlockThreshold`
    - returns a learner-facing concept status map from `UserMastery`
  - Use direct prerequisite evaluation for MVP; do not add closure tables yet.
  - Update the student concepts page to show:
    - units and concepts
    - `LOCKED`, `FRINGE`, `IN_PROGRESS`, `MASTERED`, `REVIEW_NEEDED`
    - why a concept is locked when prerequisites are unmet

- **Application interfaces**
  - Add internal mutation interfaces for:
    - `CreateCourseInput { title, description? }`
    - `CreateUnitInput { courseId, title, order }`
    - `CreateConceptInput { unitId, title, description?, contentBody?, unlockThreshold, pLo, pT, pG, pS, decayLambda }`
    - `SetConceptPrerequisitesInput { conceptId, prerequisiteConceptIds[] }`
    - `CreateQuestionInput { conceptId, usage, difficulty, content, correctAnswer, distractors?, hintText?, explanation? }`
  - Keep these behind server actions or protected admin endpoints; no public write APIs.
  - Student read interfaces should expose unit/concept lists plus derived unlock status only.

## Milestones
- **Milestone 1: CMS foundation**
  - Admin and course writers can create courses, units, and concepts.
  - Student concepts page pulls real curriculum data instead of placeholders.
- **Milestone 2: Question bank**
  - Content staff can create and manage concept-linked questions with difficulty and usage tiers.
- **Milestone 3: Prerequisite graph**
  - Prerequisites can be edited safely, cycles are blocked, and concept unlock status is computed from learner mastery plus per-concept threshold.
- **Milestone 4: Phase 2 complete**
  - The app contains one coherent Grade 12 Math curriculum slice with authored lessons, prerequisites, and question bank data ready for Phase 3 adaptive logic.

## Test Plan
- Role access:
  - `COURSE_WRITER` can access CMS routes but not `/admin/users`
  - `STUDENT` cannot access CMS routes
- Schema/service tests:
  - creating prerequisite edges rejects self-links and cycles
  - unlock evaluation respects each concept’s `unlockThreshold`
  - unit ordering is stable within a course
- CMS mutation tests:
  - course, unit, concept, and question create/update/delete flows validate required fields
  - invalid question payloads and malformed distractors are rejected
- Student read tests:
  - concept list shows correct status from `UserMastery`
  - locked concepts show unmet prerequisites
- Regression:
  - Phase 1 auth, registration, and redirects remain green

## Assumptions and Defaults
- Phase 2 targets **Grade 12 Mathematics only**.
- Content entry is **Admin UI only**; no import pipeline in this phase.
- `COURSE_WRITER` is active with **content-only permissions**.
- Worked examples stay **inline inside concept Markdown/LaTeX content**.
- Unlocking uses **per-concept thresholds**, not global or per-edge thresholds.
- Graph evaluation stays simple and query-based for MVP; closure tables and graph DBs are deferred until scale requires them.
