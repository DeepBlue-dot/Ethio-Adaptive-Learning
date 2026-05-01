# LLM.md

This repository is split into two layers:

- Root-level project docs live in `doc/` and `docs/`.
- The actual application code lives in `ethio-adaptive-learning/`.

Treat `ethio-adaptive-learning/` as the source of truth for architecture and behavior. The root `README.md` and capstone docs describe product intent; the code below describes what is actually implemented.

## 1. Project Overview

`ethio-adaptive-learning/` is a Next.js monolith for an adaptive learning platform aimed at Ethiopian Grade 12 exam preparation. The currently implemented MVP is centered on role-aware access, curriculum authoring, concept prerequisite management, question-bank management, and a student learning workspace backed by simple adaptive engines.

The active curriculum slice is Grade 12 Mathematics, seeded through Prisma. The current product already supports student registration and login, admin/course-writer CMS workflows, concept unlocking based on prerequisite mastery, low-stakes practice/checkpoint attempts, exam-driven mastery updates, and a review queue based on retention decay.

- Target users:
  - `STUDENT`: consumes concept catalog, learning workspace, review queue, and profile/dashboard surfaces.
  - `COURSE_WRITER`: authors curriculum and questions in the CMS.
  - `ADMIN`: full CMS access plus reserved admin-only routes like `/admin/users`.
- Core problem solved:
  - Replace static exam-prep content with a curriculum graph, role-aware content operations, and mastery-aware progression.
- High-level implemented features:
  - Student registration and credentials login.
  - JWT-backed role-aware routing and protected layouts.
  - Curriculum CMS for courses, units, concepts, prerequisites, and questions.
  - Concept catalog with lock/fringe/in-progress/mastered/review-needed states.
  - Adaptive learning workspace with practice, checkpoint, mastery exam, and challenge exam flows.
  - Review queue driven by decayed effective mastery.
  - Seeded demo users and math curriculum.

## 2. Tech Stack

- Frontend:
  - Next.js `16.1.6` App Router.
  - React `19.2.3`.
  - TypeScript.
  - Tailwind CSS `v4`.
  - `lucide-react` icons.
  - `class-variance-authority`, `clsx`, `tailwind-merge`.
  - shadcn-style UI primitives; current repo only contains a shared `Button` wrapper plus utility styling.
- Backend:
  - Next.js server runtime.
  - Route handlers in `app/api/*`.
  - Server actions in route-local `actions.ts`.
- Database:
  - PostgreSQL.
  - Prisma `6.19.0`.
- Auth:
  - `next-auth` credentials provider.
  - Prisma adapter.
  - JWT session strategy.
  - `bcryptjs` password hashing.
- AI/LLM integrations:
  - None in runtime.
  - There are empty placeholder directories such as `app/api/adaptive` and `app/api/tutor`, but no active LLM SDK or tutoring backend is wired.
- Deployment:
  - No provider-specific deployment config is committed.
  - This is a standard Next.js + PostgreSQL app and appears Node/Vercel-compatible.
  - `next.config.ts` marks `@prisma/client` and `prisma` as server external packages.
- Testing:
  - Vitest in Node environment.

## 3. Architecture Overview

- Architecture style:
  - Monolith.
  - Single Next.js application under `ethio-adaptive-learning/`.
  - No separate API service, worker service, or microservice boundary.
- Request flow:
  - Public pages and authenticated pages are mostly server components.
  - Interactive auth forms are client components.
  - Mutations happen via either:
    - `POST` route handlers for public JSON-style APIs such as registration.
    - Server actions for authenticated CMS and learning operations.
  - Persistent state is stored only in PostgreSQL via Prisma.
- Practical request path:

```text
Client/page -> server component or server action -> lib/* domain service -> Prisma -> PostgreSQL
```

- Key design patterns:
  - Thin UI layer, thicker domain layer.
  - `lib/*` holds reusable business logic.
  - `lib/adaptive/*` holds pure, side-effect-free adaptive helpers.
  - App route files mostly orchestrate auth, input extraction, redirects, and cache revalidation.
  - Explicit prerequisite edge table instead of implicit many-to-many prerequisites.
  - Transactions for multi-table destructive or attempt-completion flows.
- State management:
  - Server-first.
  - No Redux, Zustand, React Query, or equivalent client cache.
  - Canonical state lives in DB.
  - Small client-side state exists only in auth/register forms for pending/error UX.
  - `revalidatePath()` is used after mutations to refresh server-rendered pages.
- Important domain distinction:
  - `pMastery` is the stored baseline mastery.
  - `effectiveMastery` is computed on read via retention decay.
  - Unlocking uses stored prerequisite mastery, not effective mastery.
  - Once a concept has `unlockedAt`, decay does not re-lock it.

## 4. Folder & Codebase Structure

The working app is inside `ethio-adaptive-learning/`.

```text
ethio-adaptive-learning/
  app/
  components/
  lib/
  prisma/
  public/
  tests/
  types/
```

- `/app`
  - Uses App Router with route groups:
    - `(public)`: landing, login, register.
    - `(student)`: student dashboard, concepts, learn, review, profile.
    - `(admin)`: admin dashboard, curriculum CMS, question bank, users placeholder.
  - `app/api/auth/register/route.ts`: public registration endpoint.
  - `app/api/auth/[...nextauth]/route.ts`: NextAuth entrypoint.
  - `app/app/page.tsx`: auth-aware redirect shim to role-specific dashboard.
  - `app/(student)/learn/[conceptId]/actions.ts`: student mutation boundary.
  - `app/(admin)/admin/cms/*/actions.ts`: CMS mutation boundaries.
  - There are extra empty directories such as `app/api/adaptive`, `app/api/tutor`, `app/student/*`, and `app/cms`; do not assume they are active features.
- `/components`
  - `components/admin`: admin sidebar and admin-only navigation shell pieces.
  - `components/student`: student sidebar/navigation shell pieces.
  - `components/shared`: auth forms, placeholder cards, user menu, sign-out button.
  - `components/ui`: reusable UI primitives; currently `button.tsx`.
  - `components/capstone` exists but currently contains no active code.
- `/lib`
  - `auth.ts`: NextAuth config, role gating, redirect helpers.
  - `users.ts`: registration-oriented user lookup and creation.
  - `password.ts`: bcrypt helpers.
  - `prisma.ts`: singleton Prisma client.
  - `curriculum.ts`: curriculum CMS CRUD, student catalog projection, prerequisite logic glue.
  - `assessment.ts`: learning workspace assembly, attempt lifecycle, mastery/review flows.
  - `adaptive/*`: pure adaptive engine helpers.
  - `utils.ts`: UI utility `cn()`.
- `/prisma`
  - `schema.prisma`: canonical data model.
  - `migrations/*`: schema evolution across phase 1/2/3.
  - `seed.mjs`: seeded demo users and math content.
- `/tests`
  - Unit-style tests for auth, registration route, curriculum, assessment, graph logic, and adaptive helpers.
- `/types`
  - `next-auth.d.ts`: session/JWT augmentation for custom role/id/username fields.
- `/api`
  - There is no standalone `/api` directory outside App Router.
  - API endpoints are implemented under `/app/api`.
- `/models`
  - No `/models` directory exists.
  - Prisma schema models in `prisma/schema.prisma` are the model layer.
- `/utils`
  - No dedicated `/utils` directory exists.
  - Generic helpers live in `lib/utils.ts`.

## 5. Key Modules & Responsibilities

### Authentication system

- Files:
  - `lib/auth.ts`
  - `lib/users.ts`
  - `lib/password.ts`
  - `types/next-auth.d.ts`
  - `app/api/auth/register/route.ts`
  - `app/api/auth/[...nextauth]/route.ts`
- Behavior:
  - Credentials login supports email or username.
  - Registration is student-only; admins and course writers are seed-created, not self-service.
  - Session strategy is JWT, but Prisma adapter is still used for NextAuth model compatibility.
  - Role redirects:
    - `ADMIN` and `COURSE_WRITER` -> `/admin/dashboard`
    - `STUDENT` -> `/dashboard`
- Important invariants:
  - Session contract always expects `session.user.id`, `session.user.role`, and `session.user.username`.
  - Public auth pages call `redirectIfAuthenticated()`.
  - Protected pages call `requireAuth()` or `requireRole()`.

### Core business logic

- `lib/curriculum.ts`
  - CMS reads for authors/courses/questions.
  - Student concept catalog projection with derived unlock/mastery state.
  - CRUD for courses, units, concepts, questions.
  - Prerequisite validation:
    - same-course enforcement.
    - self-edge rejection.
    - cycle detection.
  - Helper formatting for question CMS and status labels.
- `lib/assessment.ts`
  - Builds full concept learning workspace.
  - Builds review queue and dashboard summary.
  - Starts/submits practice, checkpoint, and exam attempts.
  - Persists interaction logs.
  - Updates `UserMastery` after exams.
  - Unlocks downstream concepts after passing exams.
- `lib/adaptive/graph.ts`
  - Prerequisite cycle detection.
  - Derived concept status computation.
- `lib/adaptive/bkt.ts`
  - BKT parameter normalization and evidence/transit updates.
- `lib/adaptive/retention.ts`
  - Effective mastery decay.
  - Review scheduling.
  - Derived mastery status from unlock/baseline/effective state.
- `lib/adaptive/difficulty.ts`
  - Difficulty tier selection from mastery.
  - Learn/challenge recommendation.
  - Deterministic question picking with prior-usage bias.

### Data models and relationships

- `User`
  - identity, credentials, role, NextAuth relations.
- `UserProfile`
  - XP/level/streak/progress metadata; mostly display-oriented in current code.
- `Course -> Unit -> Concept`
  - primary curriculum hierarchy.
- `ConceptPrerequisite`
  - explicit DAG edge model.
- `UserMastery`
  - per-user concept mastery baseline, unlock state, review timing, status.
- `Question`
  - belongs to `Concept`, tagged by `usage` and `difficulty`.
- `PracticeAttempt`, `CheckpointAttempt`, `ExamAttempt`
  - assessment session records.
- `InteractionLog`
  - low-level attempt/question event log.

### API layer

- Route handlers:
  - Registration JSON API.
  - NextAuth auth API.
- Server actions:
  - Preferred mutation path for authenticated app behavior.
  - Used for CMS CRUD and student attempt flows.
- Important consequence:
  - There is no generic REST/GraphQL service layer for curriculum or assessment.
  - If a feature is only used by authenticated UI, server actions are the established pattern.

## 6. Data Flow

### Registration

```text
RegisterForm
  -> POST /api/auth/register
  -> createStudentUser()
  -> hashPassword()
  -> prisma.user.create({ profile: { create: {} } })
  -> 201 JSON { ok: true, userId }
  -> client redirects to /login?registered=1
```

- Validation happens in the route handler before DB write.
- Duplicate username/email is converted to a safe `400` JSON error.

### Login

```text
LoginForm
  -> signIn("credentials")
  -> authOptions.providers[credentials].authorize()
  -> findUserByIdentifier()
  -> verifyPassword()
  -> JWT/session callbacks
  -> /app
  -> role-based redirect
```

- Invalid login returns `null` from `authorize()`.
- Public login/register pages redirect away if the user is already authenticated.

### Student concept catalog read

```text
Server component page
  -> getStudentConceptCatalog(userId)
  -> load active courses + concepts + prerequisite edges
  -> load matching UserMastery rows
  -> compute effective mastery + derived status
  -> render concept map
```

- Status is derived, not stored as a fully authoritative separate graph table.

### Learning session

```text
Student form action
  -> start*AttemptAction / submit*AttemptAction
  -> lib/assessment.ts
  -> Prisma transaction
  -> attempts/logs/mastery updates
  -> revalidatePath()
  -> redirect back to /learn/[conceptId]?status=...
```

- Practice:
  - Opens one question.
  - Records correctness in `PracticeAttempt` and `InteractionLog`.
  - Does not update permanent `pMastery`.
- Checkpoint:
  - Same pattern as practice.
  - Gates Learn-path exam access.
  - Does not update permanent `pMastery`.
- Exam:
  - Creates `ExamAttempt` with `questionIds` stored as JSON.
  - Submission computes score/pass/fail.
  - BKT update is applied once, based on exam pass/fail.
  - `UserMastery` is upserted with new baseline, review timing, status, and fail count.
  - Passing triggers concept unlock propagation across the course.

## 7. Conventions & Patterns

- Naming conventions:
  - Route-local mutation files are named `actions.ts`.
  - Server action functions end in `Action`.
  - Domain reads typically start with `get*`.
  - Domain writes use `create*`, `update*`, `delete*`, `start*`, `submit*`.
  - Path alias `@/` is used everywhere.
- File structure rules:
  - Put reusable business logic in `lib/*`, not inside page components.
  - Keep page files focused on rendering and orchestration.
  - Keep interactive auth forms as client components; keep most other UI server-rendered.
  - Keep adaptive math helpers pure and isolated under `lib/adaptive`.
- API response format:
  - JSON route handlers return compact payloads such as `{ ok: true, userId }` or `{ error }`.
  - Server actions do not expose JSON to the browser; they redirect with `status` or `error` search params.
- Error handling style:
  - Domain helpers throw `Error` with user-facing messages.
  - Server actions catch errors and redirect with safe messages.
  - Route handlers catch errors and emit `400` JSON responses.
  - Auth credential failure returns `null`, not structured error detail.
- Validation style:
  - Strings are trimmed and normalized early.
  - Probability fields are validated as `0..1`.
  - Enum values are validated against Prisma enums.
  - Author assignment is validated against role.
- DB write style:
  - Multi-table destructive operations use Prisma transactions.
  - Delete helpers manually clean dependent rows; do not assume all relations cascade automatically.

## 8. Environment & Configuration

- Required environment variables from `.env.example`:

```env
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
AUTH_SECRET=
AUTH_TRUST_HOST=
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
SEED_STUDENT_EMAIL=
SEED_STUDENT_PASSWORD=
```

- Additional seed variables used in code:
  - `SEED_WRITER_EMAIL`
  - `SEED_WRITER_PASSWORD`
- External services:
  - PostgreSQL only.
  - No email provider.
  - No blob/object storage.
  - No active LLM or tutoring service.
- Config files:
  - `prisma.config.ts`: Prisma schema/migration/seed configuration.
  - `next.config.ts`: server external package config for Prisma.
  - `vitest.config.ts`: test environment and alias config.
- Auth config notes:
  - `lib/auth.ts` sets `NEXTAUTH_URL` from `NEXT_PUBLIC_APP_URL` if not already provided.
  - `AUTH_TRUST_HOST` is present in env docs but is not referenced directly in app code; treat it as deployment/runtime configuration for auth hosting behavior.
- Operational note:
  - Commands should be run from `ethio-adaptive-learning/`, not the repo root.

## 9. How to Extend the System

### Add a new feature

- Preferred sequence:
  - Add or extend domain logic in `lib/*`.
  - Add route-local server action if the feature is a protected mutation.
  - Add/update page component to call the new loader/action.
  - Add Vitest coverage for non-trivial domain changes.
- Good fit for `lib/curriculum.ts`:
  - CMS reads/writes.
  - Concept graph rules.
  - Author/content metadata.
- Good fit for `lib/assessment.ts`:
  - Attempt lifecycle.
  - Review queue logic.
  - Mastery updates.
  - Unlock propagation.
- Good fit for `lib/adaptive/*`:
  - Pure formulas and deterministic selection logic.

### Add a new API route

- Use `app/api/<feature>/route.ts`.
- Keep the route handler thin:
  - parse request.
  - validate basic shape.
  - call a `lib/*` function.
  - return `NextResponse.json(...)`.
- Prefer a server action instead of a public route when:
  - the caller is an internal authenticated form.
  - the mutation is page-scoped.
  - you want existing redirect + `revalidatePath()` semantics.

### Modify database schema safely

- Required workflow:
  - update `prisma/schema.prisma`.
  - create/apply a Prisma migration.
  - update `prisma/seed.mjs` if seed data depends on the change.
  - update tests that construct mocked model shapes.
  - update all affected selectors in `lib/*`.
- Be careful with:
  - `UserMastery`: many read paths assume current field names and semantics.
  - `ExamAttempt.questionIds` / `submittedAnswers`: JSON-backed attempt history.
  - destructive delete helpers in `lib/curriculum.ts`.
  - NextAuth tables if auth-related schema changes are introduced.

### What not to break

- Role redirect contract in `lib/auth.ts`.
- Session/JWT field augmentation in `types/next-auth.d.ts`.
- Same-course prerequisite enforcement and cycle prevention.
- Distinction between:
  - stored baseline mastery.
  - derived effective mastery.
  - unlock state via `unlockedAt`.
- Current assessment rule that only exams change permanent mastery.
- Current Learn-path rule that checkpoint gates the mastery exam.

## 10. Known Constraints & Risks

- Product intent exceeds current implementation:
  - No real LLM tutor, mock exam system, analytics engine, or adaptive API service is wired yet.
- Historical exam records are not immutable snapshots:
  - `ExamAttempt` stores question IDs, not frozen question payloads.
  - Rendering/submission re-reads current `Question` rows.
  - Editing or deleting a question can alter or invalidate historical exam interpretation.
- Question deletion is aggressive:
  - Deleting a question removes related `InteractionLog`, `PracticeAttempt`, `CheckpointAttempt`.
  - It also deletes all `ExamAttempt` rows for the question's concept, not only attempts using that question ID.
- Mastery updates are coarse:
  - BKT update is based on overall exam pass/fail, not per-question evidence.
  - No IRT or richer calibration is implemented.
- Profile/gamification fields are mostly not live:
  - `totalXP`, `currentLevel`, `dailyStreak`, `overallProgress`, and `lastLogin` are displayed but not actively maintained by learning workflows.
- Security/auth gaps:
  - No password reset flow.
  - No email verification flow.
  - No visible rate limiting on registration/login.
- Testing gaps:
  - Good unit coverage for pure/domain logic.
  - No end-to-end coverage for route/page integration.
  - No browser tests for server action UX.
- Performance characteristics:
  - Catalog/dashboard logic loads course trees and does in-memory flattening/scanning.
  - Fine for MVP scale; revisit if curriculum volume or user counts grow materially.
- Codebase hygiene:
  - Empty placeholder directories can mislead future contributors.
  - Root docs and root README can overstate AI/runtime capabilities compared to shipped code.

## 11. Example Workflows

### 1. User registration

- User opens `/register`.
- `RegisterForm` submits JSON to `/api/auth/register`.
- Route validates username/email/password.
- `createStudentUser()` hashes password and creates:
  - `User`
  - linked empty `UserProfile`
- Client redirects to `/login?registered=1`.

### 2. Login

- User opens `/login`.
- `LoginForm` calls `signIn("credentials")` with email-or-username plus password.
- `authOptions.providers[credentials].authorize()` looks up the user and verifies bcrypt hash.
- JWT/session callbacks inject `id`, `role`, and `username`.
- `/app` immediately redirects:
  - student -> `/dashboard`
  - admin/writer -> `/admin/dashboard`

### 3. Core learning session

- Student opens `/learn/[conceptId]`.
- Page calls `getConceptLearningWorkspace()`.
- Workspace shows:
  - concept content
  - mastery metrics
  - available practice/checkpoint/exam actions
  - latest attempts
- Student may:
  - start practice -> answer question -> log result, no permanent mastery change.
  - pass checkpoint -> unlock Learn-path exam access.
  - submit mastery exam -> compute score -> update `UserMastery` -> schedule review -> unlock dependent concepts if passed.

## 12. AI-Agent Guidelines

- Read these files first:
  - `ethio-adaptive-learning/prisma/schema.prisma`
  - `ethio-adaptive-learning/lib/auth.ts`
  - `ethio-adaptive-learning/lib/curriculum.ts`
  - `ethio-adaptive-learning/lib/assessment.ts`
  - `ethio-adaptive-learning/lib/adaptive/*`
  - relevant `app/*/page.tsx` and `actions.ts`
- Safe areas to modify:
  - UI copy and layout in page/component files.
  - New read-only views.
  - New reusable components.
  - Pure helper functions with unit tests.
  - Docs and tests.
- Dangerous areas:
  - Auth/session contract.
  - Prisma schema and migrations.
  - Mastery formulas and unlock semantics.
  - Delete logic in `lib/curriculum.ts`.
  - Exam submission logic in `lib/assessment.ts`.
  - Any code assuming question history is stable.
- Testing expectations before changes:
  - Run `npm run test` from `ethio-adaptive-learning/`.
  - Run `npm run lint` for UI/app-layer edits.
  - Add/update Vitest coverage when changing:
    - auth behavior
    - adaptive helpers
    - curriculum validation
    - attempt/mastery flows
    - registration route behavior
- Practical rule for future edits:
  - Prefer changing domain logic once in `lib/*` and reusing it, rather than duplicating logic in pages or actions.
  - Do not trust product-intent docs over code; confirm implemented behavior in `lib/*` and Prisma schema first.
