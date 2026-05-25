# `ethio-adaptive-learning/lib` Documentation

## Purpose

The `ethio-adaptive-learning/lib` folder contains the main backend/domain logic for the Next.js application. It is the shared service layer that handles:

- authentication and session management
- user account lifecycle and verification
- curriculum graph modeling and unlock logic
- adaptive mastery estimation using Bayesian Knowledge Tracing (BKT)
- retention and review scheduling
- assessment workflows and question selection
- CMS content access and resource aggregation
- email sending and cloudinary media support
- admin/studio helper utilities
- AI Socratic Tutoring Subsystem

This documentation is intended for other LLMs or developers to quickly understand how the backend intelligence is organized and where to find each subsystem.

## High-level structure

### Top-level files

- `lib/prisma.ts`
  - exports the Prisma client singleton used across the app.

- `lib/auth.ts`
  - NextAuth configuration, credential login, JWT/session callbacks,
  - helpers: `getAuthSession()`, `requireAuth()`, `requireRole()`, `redirectIfAuthenticated()`, `getDefaultRedirectPath()`.

- `lib/users.ts`
  - user lookup, student registration, password reset, email verification, and account updates.

- `lib/password.ts`
  - bcrypt password hashing and verification.

- `lib/slugs.ts`
  - slug generation utilities.

- `lib/verify-recaptcha.ts`
  - Google reCAPTCHA validation.

- `lib/utils.ts`
  - UI utility wrapper: `cn(...)` for Tailwind class merging.

### Main domain subsystems

These are the core intelligence engines in `/lib`.

#### Curriculum Graph / Knowledge Structure

- `lib/curriculum-graph.ts`
  - builds the curriculum DAG for a course.
  - loads course concepts, direct prerequisites, and closure (transitive) edges.
  - derives ancestor/descendant maps.
  - computes unlocked and fringe concept IDs for a learner.

- `lib/curriculum-state.ts`
  - contains graph algorithms and concept status derivation.
  - computes transitive closure rows.
  - builds ancestor and descendant maps.
  - derives concept status from prerequisite mastery.
  - this is the KST engine equivalent.

- `lib/curriculum.ts`
  - high-level wrapper functions for curriculum and CMS operations.
  - re-exports CMS curriculum adapters and curriculum concept helpers.
  - exposes functions such as `getStudentConceptCatalog()`, `getUnlockedConceptIds()`, `getFringeConceptIds()`, and `getMasteryStatusLabel()`.

- `lib/curriculum/types.ts`
  - Type definitions for course/unit/concept/question creation and editing.

#### Adaptive Learning / BKT Engine

- `lib/adaptive/bkt.ts`
  - implements Bayesian Knowledge Tracing.
  - supports standard BKT parameters: `pLo`, `pT`, `pG`, `pS`.
  - provides:
    - `evidenceUpdateCorrect(prior, params)`
    - `evidenceUpdateIncorrect(prior, params)`
    - `transitUpdate(posterior, params)`
    - `applyObservation({ prior, isCorrect, params })`

- `lib/adaptive/retention.ts`
  - models retention decay and review scheduling.
  - functions:
    - `computeEffectiveMastery(...)`
    - `computeNextReviewAt(...)`
    - `deriveMasteryStatus(...)`
    - `isReviewDue(...)`

- `lib/adaptive/graph.ts`
  - validates prerequisite graph cycles.
  - derives concept unlock/status values based on prerequisite mastery.

- `lib/adaptive/difficulty.ts`
  - maps mastery probability to difficulty tier.
  - supports recommendation logic and question ordering.

- `lib/adaptive/index.ts`
  - re-exports the adaptive helpers.

#### AI Tutoring & RAG Subsystem

- **Purpose**: Provides a RAG (retrieval-augmented generation) backed Socratic tutoring service that guides students with questions (not direct answers) using curriculum context and an LLM.
- **Core files**: `lib/ai/tutoring/socratic-engine.ts`, `lib/ai/tutoring/prompts.ts`, `lib/ai/tutoring/guardrails.ts`, `lib/ai/rag/retrieval.ts`, `lib/ai/embeddings/embedding-service.ts`, `lib/ai/clients/ollama.ts`, `lib/ai/clients/chroma.ts`, `lib/ai/rag/ingestion.ts`, and `lib/ai/types/index.ts`.
- **Responsibilities**:
  - Retrieve semantically relevant curriculum chunks from ChromaDB using embeddings.
  - Build RAG prompts that include curriculum context and recent session history.
  - Call a local/remote Ollama LLM for chat completions or streaming responses.
  - Enforce pedagogical guardrails (Socratic style, no direct answers) and flag violations.
  - Persist tutoring sessions and messages via Prisma (`TutorSession`, `TutorMessage`).
- **Entry points**:
  - HTTP API: `POST /api/tutor` implemented at `app/api/tutor/route.ts` — authenticates via `requireAuth()` and delegates to `getSocraticGuidance`.
  - Server-side: import and call `getSocraticGuidance(userId, conceptId, question)` for non-stream replies.
  - Streaming: import and call `getSocraticGuidanceStream(userId, conceptId, question)` to obtain a `ReadableStream` (useful for SSE/websocket UIs).
- **Prompting & Guardrails**:
  - The system prompt (`SOCRATIC_SYSTEM_PROMPT`) enforces "ask, don't tell" behavior and curriculum-first authority.
  - `validateSocraticResponse()` applies heuristic checks (banned phrases, length) and marks flagged messages in the DB.
- **Vector DB & Embeddings**:
  - Chroma collection: `curriculum_chunks` is the primary collection for RAG retrieval.
  - Embeddings: generated via the Ollama embeddings endpoint (wrapped in `generateEmbedding`); `getEmbeddings` handles batching and retries.
  - Ingestion helpers live in `lib/ai/rag/ingestion.ts` — run those to populate Chroma with curriculum text.
- **Clients & Config**:
  - Ollama client: `lib/ai/clients/ollama.ts` — uses `OLLAMA_BASE_URL`, `OLLAMA_LLM_MODEL`, and `OLLAMA_EMBEDDING_MODEL` env vars.
  - Chroma client: `lib/ai/clients/chroma.ts` — uses `CHROMADB_BASE_URL`.
- **Database models**: See `prisma/schema.prisma` — `TutorSession` links `userId` + `conceptId`; `TutorMessage` stores `role`, `content`, `timestamp`, `tokens`, `isFlagged`, `flagReason`, and `retrievedContext` JSON (IDs of retrieved chunks).
- **How other modules should use it**:
  - UI/client: call `POST /api/tutor` with `{ conceptId, question }` after authenticating; display `content` and optionally show links to `retrievedContextIds`.
  - Server code: call `getSocraticGuidance`/`getSocraticGuidanceStream` directly when you have `userId` context (e.g., for instructor previews or automated hints).
  - For content authors: update curriculum content and re-run ingestion so RAG returns up-to-date chunks.
- **Operational notes & caveats**:
  - Required services: Ollama (embeddings + chat) and ChromaDB (vector search) must be running and reachable.
  - Guardrails are heuristic — consider adding stronger validators or human-in-the-loop moderation for high-stakes content.
  - Replies and retrieved context are persisted; audit access if privacy/regulatory concerns apply.
  - If Ollama or Chroma are down the API gracefully returns errors (e.g., 503 when the LLM fetch fails).

### Gamification and Motivation

- `lib/gamification/types.ts`
  - defines `GamificationActivity` enum: PRACTICE_COMPLETE, CHECKPOINT_PASS, EXAM_PASS, DAILY_STREAK, CONTENT_READ, SOCRATIC_HINT_USED.
  - defines `BadgeId` type: FIRST_ATTEMPT, STREAK_7, STREAK_30, XP_BRONZE, XP_SILVER, XP_GOLD.

- `lib/gamification/xp.ts`
  - implements XP award logic and level computation.
  - `XP_MAP`: activity → points mapping (Practice=5, Checkpoint=15, Exam=50, Daily=10, Content=2, Hint=1).
  - `awardXpForActivity(userId, activity)`: increments user XP, checks for level-up, logs to ActivityLog.
  - `computeLevelFromXp(totalXp)`: derives current level from total XP using formula: floor(totalXp / 100) + 1.

- `lib/gamification/streak.ts`
  - tracks daily activity streaks for engagement motivation.
  - `recordDailyActivity(userId, activityDate)`: records consecutive activity days, resets on gap, returns streak info.

- `lib/gamification/badges.ts`
  - awards achievement badges based on learner milestones.
  - `checkAndAwardXpBadges(userId)`: awards XP-based badges at thresholds (500 XP, 1500 XP, 5000 XP).
  - `checkAndAwardStreakBadges(userId, streak)`: awards streak badges at day thresholds (7-day, 30-day).

- `lib/gamification/index.ts`
  - central barrel export for all gamification functions.

### Learning Analytics Subsystem

- `lib/studio/intelligence.ts`
  - collects and aggregates learner interaction and mastery data.
  - computes global metrics, content health diagnostics, and recent activity feeds.
  - supports instructor/admin analytics and system improvement.

- `prisma/schema.prisma` → `InteractionLog`
  - records learner interactions with content and assessment questions.
  - stores event data such as `PRACTICE_QUESTION`, `CHECKPOINT_QUESTION`, `EXAM_RESPONSE`, correctness, and timestamps.
  - enables analytics queries across users, concepts, and questions.

- `lib/assessment/attempts.ts`
  - logs learner interactions during practice, checkpoint, and exam submission.
  - captures correctness and timing data used for analytics.

- `lib/assessment/selection.ts`
  - reads interaction history to avoid repeated question selection.
  - uses analytics data to influence adaptive delivery.

### Assessment and delivery

- `lib/assessment/index.ts`
  - exports the assessment system entrypoints.

- `lib/assessment/attempts.ts`
  - manages practice, checkpoint, and exam attempts.
  - selects questions, records answers, logs interactions.
  - updates user mastery on exam completion.

- `lib/assessment/selection.ts`
  - chooses questions for a learner using effective mastery and difficulty tiers.
  - avoids repeated questions using interaction logs.

- `lib/assessment/workspace.ts`
  - builds the student-facing learning workspace.
  - composes concept data, mastery, recommendations, and attempt history.

- `lib/assessment/types.ts`
  - shared type definitions for assessment objects.

- `lib/assessment/mastery.ts`
  - initializes or updates mastery records when a learner begins a concept.
  - synchronizes unlocked concepts for a course.

- `lib/assessment/constants.ts`
  - shared DB selects and exam thresholds.

### CMS and content support

- `lib/cms/index.ts`
  - centralized exports for CMS core, repository, registry, and validation.

- `lib/cms/core.ts`, `lib/cms/registry.ts`, `lib/cms/repository/prisma.ts`
  - implement a generic CMS layer on top of Prisma.

- `lib/cms/content-blocks.ts`
  - content block normalization and reference extraction.

- `lib/cms/validation.ts`
  - form parsing and CMS validation helpers.

- `lib/cms/types.ts`
  - CMS entity and content type type definitions.

### Resource aggregation

- `lib/resources/unified-resources.ts`
  - aggregates media assets and content snippets into a normalized resource list.
  - handles YouTube metadata, snippet previewing, and resource normalization.

### Email and media integration

- `lib/email/send-email.ts`
  - sends email through Resend with retries.

- `lib/email/resend.ts`
  - Resend API wrapper.

- `lib-cloudinary/cloudinary.ts`
  - configures the Cloudinary SDK from env vars.

- `lib/cloudinary/upload-image.ts`, `delete-image.ts`, `image-utils.ts`
  - handle Cloudinary uploads, deletes, and media helpers.

### Studio / admin utilities

- `lib/studio/*.ts`
  - admin workspace helpers, metrics, search, usage tracking, and intelligence features.

## Conceptual subsystem map

Use this map to quickly match code to architecture.

- Knowledge Structure Subsystem (KST Engine)
  - `lib/curriculum-graph.ts`
  - `lib/curriculum-state.ts`
  - `lib/adaptive/graph.ts`

- Concept Mastery Subsystem (BKT Engine)
  - `lib/adaptive/bkt.ts`
  - `lib/assessment/attempts.ts` (exam submission updates mastery)
  - `lib/assessment/mastery.ts`

- Retention and Review Subsystem (Memory Engine)
  - `lib/adaptive/retention.ts`
  - `lib/assessment/workspace.ts`
  - `lib/assessment/mastery.ts`

- Assessment and Adaptive Delivery Subsystem
  - `lib/assessment/attempts.ts`
  - `lib/assessment/selection.ts`
  - `lib/adaptive/difficulty.ts`
  - `lib/assessment/workspace.ts`

- Gamification and Motivation Subsystem
  - `lib/gamification/xp.ts`
  - `lib/gamification/streak.ts`
  - `lib/gamification/badges.ts`
  - `lib/assessment/attempts.ts` (integration point: calls gamification after attempt completion)

- Learning Analytics Subsystem
  - `lib/studio/intelligence.ts`
  - `lib/assessment/attempts.ts`
  - `prisma/schema.prisma` `InteractionLog`
  - `lib/assessment/selection.ts`

## How to use `/lib`

### Import conventions

Most app code imports domain helpers using the `@/lib/...` alias.

Examples:

- `import { prisma } from '@/lib/prisma'`
- `import { getAuthSession, requireAuth } from '@/lib/auth'`
- `import { getStudentConceptCatalog } from '@/lib/curriculum'`
- `import { startPracticeAttempt, submitPracticeAttempt } from '@/lib/assessment'`

### Common usage patterns

- Authenticate and authorize routes:
  - `getAuthSession()` for server session access
  - `requireAuth()` for protected pages
  - `requireRole(['ADMIN', 'COURSE_WRITER'])` for admin access

- Create or update users:
  - `createStudentUser()`
  - `updateUserPassword()`
  - `createPasswordResetToken()`
  - `verifyEmailVerificationToken()`

- Curriculum progress and unlock state:
  - `getStudentConceptCatalog(userId)`
  - `getUnlockedConceptIds(courseId, userId)`
  - `getFringeConceptIds(courseId, userId)`

- Adaptive learning and mastery:
  - `applyObservation(...)` updates mastery after assessment
  - `computeEffectiveMastery(...)` calculates decay-adjusted mastery
  - `getDifficultyTierForMastery(...)` selects question difficulty

- Assessment flow:
  - `startPracticeAttempt()` / `submitPracticeAttempt()`
  - `startCheckpointAttempt()` / `submitCheckpointAttempt()`
  - `startExamAttempt()` / `submitExamAttempt()`
  - `getConceptLearningWorkspace()` for the concept dashboard

- Gamification and engagement:
  - `awardXpForActivity(userId, activity)` awards XP on practice/checkpoint/exam completion.
  - `recordDailyActivity(userId)` tracks daily streak for engagement motivation.
  - `checkAndAwardXpBadges(userId)` checks and awards XP-threshold badges (bronze/silver/gold).
  - `checkAndAwardStreakBadges(userId, streak)` awards streak-based badges (7-day, 30-day).
  - Automatically triggered after `submitPracticeAttempt()`, `submitCheckpointAttempt()`, and `submitExamAttempt()`.

### Best file starting points for LLMs

- `lib/curriculum-graph.ts` — start here for concept DAG and unlock logic.
- `lib/curriculum-state.ts` — use this for graph closure, ancestor/descendant maps, and status derivation.
- `lib/adaptive/bkt.ts` — use this for BKT formula logic.
- `lib/adaptive/retention.ts` — use this for review scheduling and decay.
- `lib/assessment/selection.ts` — use this for adaptive question selection.
- `lib/assessment/attempts.ts` — use this for full assessment lifecycle.
- `lib/gamification/xp.ts` — use this for XP award logic and level computation.
- `lib/gamification/streak.ts` — use this for daily activity streak tracking.
- `lib/gamification/badges.ts` — use this for badge award logic.
- `lib/cms/index.ts` — use this for CMS content operations.

## Notes for other LLMs

- The `/lib` folder is not a UI layer: it is the domain/service layer.
- Most functions are pure or thin wrappers around Prisma queries.
- Graph and adaptive logic are intentionally separated from route handlers.
- The code uses Prisma models and `@prisma/client` enums for strong typing.
- The `@/lib` alias is the entrypoint for imports from app code.

## Quick reference

| Subsystem | Key files | Primary responsibility |
|---|---|---|
| Authentication | `auth.ts`, `password.ts`, `users.ts` | login, session, user lifecycle |
| Curriculum DAG | `curriculum-graph.ts`, `curriculum-state.ts` | prerequisite graph, unlock state |
| Mastery / BKT | `adaptive/bkt.ts` | mastery probability updates |
| Retention | `adaptive/retention.ts` | decay and review timing |
| Question selection | `assessment/selection.ts`, `adaptive/difficulty.ts` | adaptive question delivery |
| Assessment | `assessment/attempts.ts`, `assessment/workspace.ts` | start/submit attempts, workspace data |
| Gamification | `gamification/xp.ts`, `gamification/streak.ts`, `gamification/badges.ts` | XP awards, streaks, badges, engagement |
| Learning Analytics | `studio/intelligence.ts`, `assessment/attempts.ts`, `assessment/selection.ts` | learner interaction analytics, mastery monitoring, instructor insights |
| CMS | `cms/*` | content type management and repository |
| Resources | `resources/unified-resources.ts` | unified media and snippet resource list |
| Email | `email/send-email.ts` | transactional email sending |
| Cloudinary | `cloudinary/cloudinary.ts` | media upload/delete integration |
| Studio | `studio/*.ts` | admin/studio tooling |

## Conclusion

The `lib` directory is the centralized intelligence layer for Ethio Adaptive Learning. For any new feature or explanation, start with the subsystem mapping above and follow imports through `@/lib/...` into the specific file responsible for the behavior.
