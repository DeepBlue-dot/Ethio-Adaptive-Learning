---

## Summary of System Understanding

### 1. **Database Models & Student State**

The student frontend will interact with these key Prisma models:

- **`User`** (with `role: STUDENT`, `grade`, `createdAt`): Represents the logged-in learner
- **`UserProfile`**: Stores gamification state (`totalXP`, `currentLevel`, `dailyStreak`, `overallProgress`)
- **`Course` → `Unit` → `Concept`** (hierarchical DAG): The curriculum structure with publication status
- **`UserMastery`**: The authoritative record of each student's mastery state per concept
  - `pMastery` (P(L)): Current mastery probability (0–1)
  - `status`: One of {`LOCKED`, `FRINGE`, `IN_PROGRESS`, `MASTERED`, `REVIEW_NEEDED`}
  - `nextReviewAt`: Retention engine scheduling flag
  - `unlockedAt`: When prerequisite(s) were satisfied
- **`Question`** (with `difficulty: EASY|MEDIUM|HARD`, `usage: PRACTICE|CHECKPOINT|EXAM`): The assessments
- **`PracticeAttempt`, `CheckpointAttempt`, `ExamAttempt`**: Individual attempt records with responses and scores
- **`InteractionLog`**: Every question interaction (for analytics)
- **`TutorSession` / `TutorMessage`**: AI Socratic tutoring conversation history

### 2. **Adaptive Decision Flow (The Core Student Journey)**

The frontend orchestrates **Phase 1–8** of the adaptive decision flow:

**Phase 1: Recommendation Engine**
- When a concept becomes unlocked (transitions from LOCKED → FRINGE), the frontend retrieves the student's `pMastery` from BKT and decay state from the Retention Subsystem.
- The system recommends a pathway (Learn vs. Challenge) without forcing it.

**Phase 2 & 3: The Learning Fork**
The student sees two branches:

| **Pathway A: Learn (Instructional)** | **Pathway B: Challenge (Direct Assessment)** |
|---|---|
| 1. Study concept content (Concept.contentBody / ConceptChunk.bodyMd) | 1. Skip to Concept Exam immediately |
| 2. Engage adaptive practice (difficulty tier based on pMastery) | 2. Non-assisted, timed exam (hints disabled) |
| 3. Pass checkpoint question (gate to mastery exam) | 3. Results update BKT directly |
| 4. Attempt mastery exam | |
| 5. Results update BKT | |

**Phase 4: Exam Attempt Policy**
- Max 3 attempts per concept exam
- After 2 failures, redirect to Learn path
- Enforce cooldown between attempts

**Phase 5–8: Post-Exam Flow**
- BKT engine updates `pMastery` (high if passed, low if failed)
- KST engine unlocks dependent concepts if mastery threshold (e.g., 0.90) is reached
- Gamification awards XP, streak increments, badges
- Analytics log every interaction for instructor dashboards

### 3. **Key Data Flows & Frontend Architecture**

The student frontend needs these functional domains:

**A. Navigation & State**
- **Student Sidebar** (`student-sidebar.tsx`): Shows courses/units/concepts in the curriculum, highlighting `FRINGE` concepts as actionable
- **Dashboard**: Overview of progress, XP, streak, badges, and next recommended concepts

**B. Concept Learning Experience**
- **Concept Detail Page**: Displays concept metadata and recommends pathway (Learn vs. Challenge)
- **Content Browser** (Learn Path):
  - Renders `ConceptChunk` and `WorkedExample` content using `content-blocks-renderer`
  - Shows LaTeX, Markdown, media assets
  - Breadcrumb tracking within a concept unit

**C. Assessment & Adaptive Practice**
- **Practice Question Selector**: Uses `/lib/assessment/selection.ts` to pick questions by:
  - Difficulty tier derived from `pMastery`
  - `usage: PRACTICE` questions
  - Avoiding repeated questions (checked via `InteractionLog`)
- **Checkpoint Gate**: Single checkpoint question; pass = unlock mastery exam
- **Mastery Exam**: Formal assessment (EHSLCE-style) with timer, no hints
- **Question Renderer**: Displays question, captures user response, submits via `/api/assessment/*`

**D. AI Socratic Tutoring**
- **Hint System**: Student can request hints during practice; frontend calls `POST /api/tutor` with `conceptId` and `question`
- **Hint Display**: Shows AI-generated guidance without direct answers
- **Session Management**: Maintains `TutorSession` / `TutorMessage` history for context

**E. Gamification Display**
- **XP Bar**: Visual progress toward next level (derived from `UserProfile.totalXP`)
- **Streak Counter**: Daily activity streak with visual celebration on milestone (7-day, 30-day)
- **Badge Showcase**: Display unlocked badges (`FIRST_ATTEMPT`, `STREAK_7`, etc.)
- **Activity Feed**: Recent XP awards and achievements

**F. Progress & Analytics**
- **Concept Status Indicators**: LOCKED, FRINGE (highlighted), IN_PROGRESS, MASTERED, REVIEW_NEEDED
- **Mastery Gauge**: Visual representation of `pMastery` (0–1 scale)
- **Review Queue**: Concepts where `status: REVIEW_NEEDED` (decay model triggered)
- **Personal Analytics**: Time spent, attempts per concept, success rates

### 4. **Integration with Backend lib Modules**

The frontend will call these helpers (via API routes):

| Feature | Backend Module | Frontend Action |
|---|---|---|
| Load curriculum & unlock state | `lib/curriculum-graph.ts`, `lib/curriculum.ts` | `GET /api/curriculum/catalog` |
| Get mastery status for concept | `lib/curriculum.ts` | Embedded in catalog response |
| Select adaptive practice question | `lib/assessment/selection.ts` | `GET /api/assessment/next-question` |
| Submit practice/checkpoint/exam attempt | `lib/assessment/attempts.ts` | `POST /api/assessment/submit-attempt` |
| Get AI hint | `lib/ai/tutoring/socratic-engine.ts` | `POST /api/tutor` with streaming |
| Fetch concept content | `lib/cms/` + `lib/resources/` | `GET /api/concepts/{id}/content` |
| Update gamification state | `lib/gamification/xp.ts`, `lib/gamification/streak.ts` | Auto-triggered on attempt submit (returned in response) |

### 5. **UI Component Reuse Strategy**

From `components-doc.md`, the student frontend will leverage:

- **UI Primitives** (`ui/avatar.tsx`, `ui/button.tsx`, `ui/dropdown-menu.tsx`): For all UI building blocks
- **Content Renderer** (`content-blocks-renderer.tsx`): For displaying Concept instructional content (LaTeX, Markdown, media)
- **Account Components** (`profile-edit-form.tsx`, `password-change-form.tsx`): For student profile management
- **Student Sidebar** (`student-sidebar.tsx`): Main navigation (already exists; will be enhanced)
- **Landing/Account Components**: For pre-login flow (register, login, reset password)

We will **NOT** reuse admin CMS components (those are for instructors/admins only).

### 6. **State Management & Real-time Updates**

- **Server-Side State**: Curriculum catalog, mastery records, attempt history fetched on page load via API
- **Client-Side State**: Current question, user response (before submit), UI toggles (e.g., hint panel open/closed)
- **Streaming**: AI tutor hints are server-sent events (SSE) or WebSocket for real-time guidance
- **Optimistic Updates**: XP/streak updates are returned in the attempt submission response, reflected immediately in the UI

### 7. **Authentication & Authorization**

- Routes protected by `requireAuth()` from `/lib/auth.ts`
- Only users with `role: STUDENT` can access student-facing pages
- Session managed via NextAuth (JWT/session callbacks)

### 8. **Analytics Integration**

- Every question interaction is logged to `InteractionLog` automatically via attempt submit
- Frontend does not directly log analytics; backend handles it
- Frontend displays analytics (avg attempts, time spent) fetched from dashboard endpoints

---

## Key Architectural Decisions to Make (Before Coding)

1. **Layout & Navigation**:
   - Single-page dashboard or multi-page course/concept explorer?
   - Should we use a split-view (sidebar nav + main content area)?

2. **Assessment UX**:
   - Question difficulty: Show explicitly or infer from position in quiz?
   - Hints: Modal popup, slide-out panel, or inline tooltip?
   - Exam timer: Countdown banner or full-screen overlay?

3. **Gamification Prominence**:
   - XP bar in global header or within dashboard card?
   - Celebration animations for badge/streak achievements?

4. **Responsive Design**:
   - Mobile-first or desktop-first? (Grade 12 students may use phones)
   - How do we adapt the adaptive practice experience for small screens?

5. **Accessibility**:
   - LaTeX rendering for visually impaired (alt text for math)?
   - Keyboard navigation for exams?

---

I am now ready to proceed to the detailed design phase. Would you like me to:
- **Design the page structure & component hierarchy** for the student module?
- **Create wireframes or detailed page specifications**?
- **Propose a folder structure** for `app/(student)/`?
- **Outline the API contract** between frontend and backend?

Which would you prefer as the next step?