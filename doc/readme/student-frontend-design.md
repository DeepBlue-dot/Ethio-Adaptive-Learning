# Student Frontend Design

This document defines the architecture, screens, and interaction patterns for the student-facing frontend module located in `ethio-adaptive-learning/app/(student)/`.

The design centers on the **Adaptive Decision Flow**, where students progress through a curriculum guided by their mastery state, with system recommendations but student agency preserved. All interactions are tracked for analytics and adaptive intelligence.

---

## 1. Primary Screens

### 1.1 Student Hub / Learning Dashboard
**Route:** `/student`

The entry point and overview of the student's learning journey.

**Displays:**
- Header summary:
  - Current level, total XP earned, daily streak badge
  - Overall progress % through curriculum
- Main content areas (grouped by status):
  - **Available Concepts** (FRINGE): concepts ready to start
  - **In Progress**: concepts currently being worked on
  - **Review Needed**: concepts where mastery has decayed
  - **Mastered**: completed concepts
- Each concept card shows:
  - concept title
  - mastery status badge / progress bar
  - last assessed date
  - attempts count, average time spent
  - action buttons: "Continue", "Learn", "Challenge", or "Review"

**Analytics shown:**
- Analytics widget with lifetime stats:
  - total concepts mastered
  - total concepts started
  - current streak
  - average time per concept

---

### 1.2 Concept Landing / Learning Fork
**Route:** `/student/concept/[conceptId]`

A detail page for a single selected concept.

**Displays:**
- Header:
  - concept title and unit/course breadcrumb
  - prerequisite status (all met, or list of unmet prerequisites)
- Mastery panel:
  - current mastery probability (pMastery)
  - status label (LOCKED, FRINGE, IN_PROGRESS, MASTERED, REVIEW_NEEDED)
  - when mastery was last updated
  - if status is REVIEW_NEEDED: reason and "refresh now" prompt
- Recommendation panel:
  - system recommendation: "Learn" | "Challenge" | "Review"
  - rationale based on mastery + retention signals
  - recommended action summary
- Two primary pathway buttons:
  - **Learn** → instructional path (content + guided practice)
  - **Challenge** → direct exam path
- Analytics snapshot for this concept:
  - total attempts
  - checkpoint pass rate (%)
  - practice accuracy (%)
  - average time per question
  - recent activity feed (last 3-5 interactions)

---

### 1.3 Instructional Learning Workspace
**Route:** `/student/concept/[conceptId]/learn`

The guided learning experience for the Learn pathway.

**Sections:**
1. **Content Reader** (upper panel or tabbed view):
   - Concept description
   - Instructional content (`contentBody`)
   - Content blocks (markdown, LaTeX, media)
   - Concept chunks (`ConceptChunk[]`) in order
   - Worked examples (`WorkedExample[]`)
   - Renders via `content-blocks-renderer.tsx`
   - Logs `CONTENT_READ` events for analytics

2. **Adaptive Practice Area** (lower or sidebar panel):
   - Shows current practice question
   - Question content + multiple-choice options
   - Hint button to trigger AI Socratic Tutor
   - Immediate feedback on correctness
   - Explanation of correct answer
   - Action buttons: "Try another question" or "I understand, go to checkpoint"
   - Logs `PRACTICE_QUESTION` interactions

3. **Checkpoint Indicator**:
   - Badge showing progress: "3 practice questions completed"
   - When student feels ready: "Proceed to Checkpoint" button

**Navigation:**
- Breadcrumb: Course > Unit > Concept > Learn
- Back button to concept landing
- Progress indicator (practice count)

---

### 1.4 Checkpoint Gate
**Route:** `/student/concept/[conceptId]/learn/checkpoint`

A single checkpoint question before exam access.

**Displays:**
- Checkpoint instruction: "You must answer this question correctly to unlock the exam."
- Single checkpoint question (usage = CHECKPOINT)
- Multiple-choice options
- Hint button disabled (no AI hints)
- Submit button

**Behavior:**
- **If correct**: Unlock the mastery exam. Show: "Great! Checkpoint passed. Ready for the exam?" with "Take Exam" button.
- **If incorrect**: Show feedback and suggest additional practice. Button: "Try more practice" or "Retry checkpoint".

**Logs:** `CHECKPOINT_QUESTION` interaction

---

### 1.5 Challenge / Exam Screen
**Route:** `/student/concept/[conceptId]/challenge` or `/student/concept/[conceptId]/exam`

Non-assisted concept exam experience (for Challenge pathway or after Learn).

**Displays:**
- Exam instruction: "Answer questions to demonstrate mastery. No hints or feedback during the exam."
- Exam metadata:
  - question count
  - time limit (if applicable)
  - timer (if applicable)
- Questions rendered one-at-a-time or all-at-once (configurable)
- Multiple-choice options
- **No AI hints**
- **No immediate feedback** (feedback only after submission)
- Submit button

**Behavior:**
- On submission:
  - Calculate score
  - Show pass/fail result
  - If passed: "Congratulations! Concept mastered." + unlock dependents message
  - If failed: "Keep practicing. [Redirect to Learn pathway for remediation]" + practice suggestion
  - Show analytics: score, time spent, correct/total count

**Logs:** `EXAM_RESPONSE` interaction with full exam metadata (pathway, score, time)

---

### 1.6 Review Queue / Refresh Path
**Route:** `/student/reviews` or surfaced on dashboard

Surface concepts with `UserMastery.status === REVIEW_NEEDED`.

**Displays:**
- List of concepts flagged for review
- For each:
  - concept title
  - last mastered date
  - "Time since mastery" (days/weeks)
  - "Mastery decay" explanation
  - "Refresh now" button
- When student clicks "Refresh now":
  - Route to `/student/concept/[conceptId]/review`
  - Offer quick refresh practice (5–10 easy questions)
  - Or offer direct exam retry

**Logs:** track review completions

---

### 1.7 Tutor / Help Panel (Optional, within Learn)
**Route:** `/student/concept/[conceptId]/learn?showTutor=true` or sidebar toggle

Available during instructional / practice phases.

**Displays:**
- "Ask for help" button/toggle to open chat panel
- Chat-like interface with history
- Student types a question about the concept
- AI Socratic Tutor responds via `/api/tutor`
- Shows response + retrieved context (curriculum chunks used)
- No direct answers; guided questions instead
- Persists in `TutorSession` / `TutorMessage`

**Behavior:**
- Asynchronous request/response (non-blocking)
- Streams response if available
- Logs `SOCRATIC_HINT_USED` activity

---

## 2. Transition Rules

### 2.1 Concept Unlock & Fringe
- A concept becomes available (FRINGE) when:
  - All prerequisites have `pMastery >= unlockThreshold` (default 0.90)
  - Student receives notification or sees on dashboard
- If prerequisites not met: concept is LOCKED, disabled on dashboard

### 2.2 Dashboard → Concept Landing
- Student selects a concept card from dashboard
- Can only navigate to concepts with status: `FRINGE`, `IN_PROGRESS`, `MASTERED`, `REVIEW_NEEDED`
- LOCKED concepts are disabled (visually grayed out, no click)

### 2.3 Concept Landing → Learn or Challenge
- **Learn path**: Student clicks "Learn" → route to `/student/concept/[conceptId]/learn`
- **Challenge path**: Student clicks "Challenge" → route to `/student/concept/[conceptId]/challenge` (direct exam)
- Recommendation is shown but student has final choice

### 2.4 Learn Path Flow
```
Content (read) → Practice questions → Checkpoint → Mastery Exam
```
- Student reads content and chapters (logs CONTENT_READ)
- Student answers practice questions (logs PRACTICE_QUESTION)
- When ready, student proceeds to checkpoint
- Checkpoint gate: pass = unlock exam, fail = more practice suggested
- Mastery exam submission updates `UserMastery.pMastery` and status

### 2.5 Challenge Path Flow
```
Direct Exam
```
- Student skips all instructional content
- Takes exam immediately (non-assisted)
- Pass/fail updates mastery
- If fail: system recommends Learn path for remediation

### 2.6 Mastery Update & KST Unlock
- After exam completion (Learn or Challenge):
  - If `isPassed == true`:
    - Set `UserMastery.pMastery = 0.92` (or high threshold)
    - Set `UserMastery.status = MASTERED`
    - Reset `UserMastery.consecutiveFails = 0`
    - Unlock dependent concepts (re-evaluate fringe)
  - If `isPassed == false`:
    - Keep `pMastery` low
    - Increment `UserMastery.consecutiveFails`
    - Set `UserMastery.status = IN_PROGRESS` (redirect to Learn)
    - Do NOT unlock dependents

### 2.7 Review State & Retention
- If `nextReviewAt <= now()` or `status === REVIEW_NEEDED`:
  - Concept appears in review queue
  - Dashboard shows "Review Needed" badge
  - Student can click "Review" to take a refresh practice
  - Passing a review exam resets decay: `nextReviewAt = now() + decay interval`

### 2.8 Exam Attempt Policy
- Max 3 attempts per exam per concept per session
- After 2 consecutive failures: system mandates additional practice before 3rd attempt
- Optional cooldown period between attempts (e.g., 4 hours)

### 2.9 Analytics-Driven Recommendations
- Recommendation engine evaluates:
  - Current `pMastery`
  - Decay status (`nextReviewAt`)
  - Historical attempt/fail ratio
- Recommends:
  - "Learn" if mastery is low or new concept
  - "Challenge" if mastery is high (>0.70) and no recent practice
  - "Review" if status is REVIEW_NEEDED

---

## 3. Key Data Contracts

### 3.1 Concept Catalog / Dashboard Payload
```typescript
type ConceptCard = {
  conceptId: string;
  slug: string;
  title: string;
  unit: { id: string; title: string };
  course: { id: string; title: string };
  status: "LOCKED" | "FRINGE" | "IN_PROGRESS" | "MASTERED" | "REVIEW_NEEDED";
  pMastery: number; // 0–1
  nextReviewAt: ISO8601 | null;
  unlockedAt: ISO8601 | null;
  prerequisiteTitles: string[];
  prerequisitesMet: boolean;
  // Analytics
  totalAttempts: number;
  checkpointPassRate: number; // 0–1
  practiceAccuracy: number; // 0–1
  averageTimePerQuestion: number; // ms
};

type StudentDashboard = {
  studentId: string;
  profile: {
    totalXP: number;
    currentLevel: number;
    dailyStreak: number;
    overallProgress: number; // 0–100
  };
  conceptsByStatus: {
    fringe: ConceptCard[];
    inProgress: ConceptCard[];
    mastered: ConceptCard[];
    reviewNeeded: ConceptCard[];
  };
  analyticsSnapshot: {
    conceptsMastered: number;
    conceptsStarted: number;
    averageTimePerConcept: number; // ms
    mostDifficultConcepts: ConceptCard[];
  };
};
```

### 3.2 Concept Detail Payload
```typescript
type ConceptDetail = {
  conceptId: string;
  title: string;
  description: string;
  unit: { id: string; title: string };
  course: { id: string; title: string };
  
  // Content
  contentBody: string | null;
  contentBlocks: ContentBlock[]; // JSON
  chunks: {
    id: string;
    title: string;
    bodyMd: string;
    order: number;
  }[];
  workedExamples: {
    id: string;
    title: string;
    problemMd: string;
    solutionMd: string;
    order: number;
  }[];
  
  // Mastery & unlock state
  status: "LOCKED" | "FRINGE" | "IN_PROGRESS" | "MASTERED" | "REVIEW_NEEDED";
  pMastery: number;
  unlockThreshold: number;
  lastAssessedAt: ISO8601 | null;
  nextReviewAt: ISO8601 | null;
  
  // Prerequisites
  prerequisiteConcepts: {
    id: string;
    title: string;
    pMastery: number;
    status: string;
  }[];
  
  // Recommendation
  recommendation: {
    type: "learn" | "challenge" | "review";
    rationale: string;
    isLocked: boolean;
  };
  
  // Assessment readiness
  practiceQuestionCount: number;
  checkpointQuestionId: string | null;
  examAvailable: boolean;
  
  // Analytics for this concept
  analyticsSnapshot: {
    totalAttempts: number;
    totalTimeSpentMs: number;
    checkpointPassRate: number;
    practiceAccuracy: number;
    averageTimePerQuestion: number;
    recentActivityFeed: {
      activityType: string;
      isCorrect: boolean;
      timestamp: ISO8601;
    }[];
  };
};
```

### 3.3 Practice Question Payload
```typescript
type PracticeQuestion = {
  questionId: string;
  conceptId: string;
  content: string;
  usage: "PRACTICE";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  options: {
    id: string;
    text: string;
  }[];
  hintText: string | null;
  // Only shown after submit:
  correctAnswerId?: string;
  explanation?: string;
};
```

### 3.4 Checkpoint Question Payload
```typescript
type CheckpointQuestion = {
  questionId: string;
  conceptId: string;
  content: string;
  usage: "CHECKPOINT";
  options: {
    id: string;
    text: string;
  }[];
  // No hints, no explanation shown during attempt
};
```

### 3.5 Exam Payload
```typescript
type ExamSession = {
  sessionId: string;
  conceptId: string;
  pathway: "LEARN" | "CHALLENGE";
  questions: {
    questionId: string;
    content: string;
    usage: "EXAM";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    options: {
      id: string;
      text: string;
    }[];
  }[];
  questionCount: number;
  timeLimit?: number; // seconds
  canUseHints: boolean; // false for CHALLENGE pathway
};

type ExamSubmission = {
  userId: string;
  conceptId: string;
  pathway: "LEARN" | "CHALLENGE";
  submittedAnswers: {
    questionId: string;
    selectedOptionId: string;
  }[];
  timeSpentSec: number;
  // Server computes:
  correctCount?: number;
  questionCount?: number;
  score?: number; // 0–100
  isPassed?: boolean;
};
```

### 3.6 Submit Attempt Contract (Frontend → Backend)
```typescript
type AttemptSubmission = {
  conceptId: string;
  questionId: string;
  selectedAnswer: string;
  pathway?: "LEARN" | "CHALLENGE"; // for exam
  responseTimeMs?: number;
  // Backend captures userId from session
};

type AttemptResponse = {
  isCorrect: boolean;
  explanation?: string;
  nextAction?: "practice" | "checkpoint" | "exam" | "pass" | "fail";
  hint?: string;
};
```

### 3.7 Tutor Request/Response Contract
```typescript
type TutorRequest = {
  conceptId: string;
  question: string;
};

type TutorResponse = {
  role: "AI";
  content: string;
  timestamp: ISO8601;
  tokens?: number;
  isFlagged?: boolean;
  flagReason?: string;
  retrievedContextIds?: string[];
};
```

### 3.8 InteractionLog Schema (for Analytics)
```typescript
type InteractionLog = {
  userId: string;
  conceptId: string;
  questionId?: string;
  activityType: 
    | "CONTENT_READ"
    | "PRACTICE_QUESTION"
    | "CHECKPOINT_QUESTION"
    | "EXAM_RESPONSE"
    | "SOCRATIC_HINT_USED";
  isCorrect?: boolean;
  responseTimeMs?: number;
  createdAt: ISO8601;
};
```

---

## 4. Reusable Component Zones

All components should follow existing UI patterns (Tailwind CSS, glassmorphism, `asChild`, `framer-motion` animations).

### 4.1 Layout & Navigation
- **`student-sidebar.tsx`**: Main navigation (already exists)
  - Course/unit structure
  - Quick links to dashboard, reviews, profile
  - Progress summary widget
- **Header with progress summary**:
  - Current level + XP ticker
  - Daily streak badge
  - Overall % progress
  - User menu (profile, settings, logout)
- **Breadcrumb navigation**: Course > Unit > Concept > [Phase]

### 4.2 Progress & Status Cards
- **Concept status badge**:
  - LOCKED (disabled, gray)
  - FRINGE (highlighted, "Available")
  - IN_PROGRESS (orange, "Continue")
  - MASTERED (green, "Complete")
  - REVIEW_NEEDED (warning, "Review Due")
- **Mastery progress bar**: visual from 0–1 pMastery
- **Review alert**: "Mastery may have decayed. Review recommended."
- **Last assessed timestamp**: "Last assessed 5 days ago"

### 4.3 Concept Card List
- Grid or list layout for concepts grouped by status
- Each card shows:
  - Title + unit
  - Status badge
  - Mastery bar
  - Quick stats (attempts, avg time)
  - Action button: "Continue" | "Learn" | "Challenge" | "Review"
- LOCKED concepts are disabled (no click, faded)
- FRINGE concepts highlighted

### 4.4 Content Renderer
- **`content-blocks-renderer.tsx`** (reuse existing):
  - Renders `contentBlocks` (markdown, LaTeX, media)
  - Handles `ConceptChunk[]` iteration
  - Renders `WorkedExample[]` with problem/solution tabs
- **Custom wrapper**: adds logging hooks for `CONTENT_READ` events

### 4.5 Path Decision Panel
- **Recommendation summary card**:
  - "Based on your mastery level, we recommend: [Learn | Challenge | Review]"
  - Mastery probability displayed
  - Prerequisite status check
- **Two primary buttons**:
  - "Learn" (instructional path)
  - "Challenge" (direct exam)
  - Size, spacing, color follow button.tsx patterns
- **Optional info**: "Learn is recommended if you're new to this concept"

### 4.6 Question Interaction Component
- **Question card**:
  - Title: "Question 1 of 5" (for practice)
  - Content (markdown/LaTeX)
  - Multiple-choice options (radio or button group)
  - Selected state (Tailwind highlight)
- **Buttons**:
  - "Get hint" (triggers tutor; shows as loading state)
  - "Submit answer"
- **Feedback area** (shown after submit):
  - "Correct! ✓" or "Incorrect ✗"
  - Explanation of correct answer
  - "Next question" or "Done" button
- **Logs**: `PRACTICE_QUESTION` or `CHECKPOINT_QUESTION` on submit

### 4.7 Checkpoint / Exam Form
- **Instruction header**: "Checkpoint: Answer correctly to unlock the exam"
- **Single question panel**: same as 4.6 but no hints
- **Pass/fail feedback**:
  - If pass: "Great! Proceed to exam."
  - If fail: "Keep practicing. [Suggest more practice]"
- **Action button**: "Take exam" | "Try more practice" | "Retry"

### 4.8 Tutor / Help Sidebar
- **Toggle button** in practice area: "Ask for help"
- **Chat-like panel**:
  - History of student questions + AI responses
  - Input field: "Ask about this concept..."
  - Send button
- **Response display**:
  - AI response rendered as markdown
  - Loading spinner while streaming
  - Optional: show retrieved context links ("From chapter 2.3")
- **Styling**: glassmorphism panel, rounded corners, fade-in animation

### 4.9 Gamification / Progress Widgets
- **XP ticker**: "+5 XP" animation on question submit
- **Level badge**: "Level 3" with icon
- **Streak display**: "🔥 7-day streak"
- **Concept completion ring**: visual progress circle
- **Mini-leaderboard** (optional): top students this week

### 4.10 Analytics Insights Panel (New)
Optional section in dashboard or collapsible sidebar:
- **Recent activity feed**: last 5 interactions
  - "Answered Quadratic Equations practice (Correct, 1.2s)"
- **Concept heat map**: color-coded difficulty (green = strong, red = struggling)
- **Time-spent trend**: line chart of hours/week
- **Mastery progression curve**: slope chart per concept
- **Weakest concepts**: list of lowest-scoring concepts

---

## 5. Recommended Architecture Alignment

### 5.1 File Structure
```
app/(student)/
├── page.tsx                          # Dashboard / hub
├── concept/
│   ├── [conceptId]/
│   │   ├── page.tsx                  # Concept landing (fork)
│   │   ├── learn/
│   │   │   ├── page.tsx              # Content + practice workspace
│   │   │   └── checkpoint/
│   │   │       └── page.tsx          # Checkpoint gate
│   │   ├── challenge/
│   │   │   └── page.tsx              # Direct exam
│   │   ├── exam/
│   │   │   └── page.tsx              # Exam screen (shared)
│   │   └── review/
│   │       └── page.tsx              # Refresh practice
├── reviews/
│   └── page.tsx                      # Review queue
├── layout.tsx                        # Student layout (sidebar, header)
└── api/ (or use root api/)
    └── tutor/
        └── route.ts                  # POST /api/student/tutor
    └── attempt/
        └── route.ts                  # POST /api/student/attempt
    └── concept/
        └── [conceptId]
            └── route.ts              # GET concept detail, analytics
```

### 5.2 Data Flow
1. **Student logs in** → `/student` dashboard
2. **Select concept** → `/student/concept/[conceptId]` landing page
3. **Choose pathway** → `/student/concept/[conceptId]/learn` or `/challenge`
4. **Interact with content/questions** → POST to API routes + log to `InteractionLog`
5. **Submit exam** → POST to `/api/student/attempt`, update `UserMastery`
6. **Mastery triggers unlock** → KST engine re-evaluates fringe

### 5.3 Key Backend Integrations
- **`getAuthSession()`**: protect all routes with `requireAuth()`
- **`getStudentConceptCatalog(userId)`**: dashboard data
- **`getConceptDetail(conceptId, userId)`**: concept detail + mastery state
- **`getConceptLearningWorkspace(userId, conceptId)`**: content + questions
- **`startPracticeAttempt()`, `submitPracticeAttempt()`**: practice interactions
- **`submitCheckpointAttempt()`, `submitExamAttempt()`**: assessment updates
- **`applyObservation()`**: BKT mastery update
- **`getSocraticGuidanceStream()`**: tutor integration
- **`awardXpForActivity()`**: gamification on submission
- **`recordDailyActivity()`**: streak tracking
- **Prisma models**: `User`, `UserMastery`, `Concept`, `Question`, `PracticeAttempt`, `CheckpointAttempt`, `ExamAttempt`, `InteractionLog`, `TutorSession`

### 5.4 State Management
- **Server-side rendering**: fetch concept/mastery data in page.tsx
- **Client state**: use React hooks for form input, loading states, UI toggles
- **Optimistic updates**: optional for UX (e.g., immediate feedback before server confirm)
- **Real-time analytics**: POST logs asynchronously to avoid blocking UX

### 5.5 Performance Considerations
- **Lazy load content blocks**: render chunks only when user scrolls
- **Prefetch next concept**: on dashboard, load concept data before user clicks
- **Debounce tutor input**: wait for user to finish typing before sending request
- **Stream exam results**: show feedback progressively instead of waiting for full score calculation
- **Analytics logging**: use request batching (POST 5–10 logs at once) instead of per-event

### 5.6 Accessibility & UX
- **Keyboard navigation**: all modals, forms, buttons accessible via Tab + Enter
- **ARIA labels**: status badges, progress bars, hints
- **Color + text**: don't rely on color alone for status (use text labels too)
- **Focus management**: trap focus in modals, restore on close
- **Loading states**: show spinners, disable buttons during async operations
- **Error handling**: user-friendly error messages (not stack traces)
- **dark/light theme compatable** Ensure all UI elements maintain WCAG AA minimum contrast ratios in both modes

---

## 6. Integration Pattern: When & Where to Log

All student interactions should contribute to the learning analytics layer. In this codebase, most assessment interactions are already persisted to `InteractionLog` by the shared service layer in `lib/assessment/attempts.ts`, so the frontend should rely on these helpers rather than rebuilding low-level logging.

### 6.1 Logging Strategy
- **Primary logging path**: use the `/lib/assessment` helpers for assessment interactions.
  - `submitPracticeAttempt(userId, attemptId, answer)` logs `PRACTICE_QUESTION`
  - `submitCheckpointAttempt(userId, attemptId, answer)` logs `CHECKPOINT_QUESTION`
  - `submitExamAttempt(userId, attemptId, answers)` logs `EXAM_RESPONSE`
- **Gamification is built in**: these helpers also call `awardXpForActivity()`, `recordDailyActivity()`, and badge helpers automatically.
- **Tutor requests**: use the existing `/api/tutor` endpoint, which delegates to `getSocraticGuidance(userId, conceptId, question)` and persists `TutorMessage`/`TutorSession` history.
- **Content-read events**: implement separate client logging only for reading/scrolling telemetry if desired. This can be a lightweight route or dedicated helper, but it is secondary to assessment logging.
- **Async UI behavior**: submit user actions through the API, then update the UI. Do not block the student on analytics persistence.

### 6.2 Event Types & Collection Points

| Screen | Event Type | Trigger | Destination | Notes |
|--------|------------|---------|-------------|-------|
| Dashboard | `CONTENT_READ` | View concept detail page | optional content-read logger | track engagement if implemented |
| Content Viewer | `CONTENT_READ` | Scroll/read chunk | optional content-read logger | debounce to avoid spam |
| Practice Question | `PRACTICE_QUESTION` | Submit answer | `lib/assessment/attempts.ts` | auto-logged by `submitPracticeAttempt()` |
| Checkpoint Question | `CHECKPOINT_QUESTION` | Submit answer | `lib/assessment/attempts.ts` | auto-logged by `submitCheckpointAttempt()` |
| Exam | `EXAM_RESPONSE` | Submit exam | `lib/assessment/attempts.ts` | auto-logged by `submitExamAttempt()` |
| Tutor Panel | `TUTOR_SESSION` / `TutorMessage` | Ask tutor question | `/api/tutor` → `getSocraticGuidance()` | persisted in `TutorSession`/`TutorMessage` |
| Concept Selection | metadata | Choose Learn vs Challenge | assessment workflow helper | captured in exam/checkpoint context |

### 6.3 Example: Practice Submission Flow

```typescript
// app/api/student/practice/route.ts (design)
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { submitPracticeAttempt } from '@/lib/assessment'

export async function POST(req: Request) {
  const session = await requireAuth()
  const { attemptId, answer } = await req.json()

  const result = await submitPracticeAttempt(session.user.id, attemptId, answer)
  return NextResponse.json(result)
}
```

```tsx
// components/student/practice-question.tsx
export function PracticeQuestion({ attempt, onResult }: Props) {
  const handleSubmit = async (selectedOptionId: string) => {
    const result = await fetch('/api/student/practice', {
      method: 'POST',
      body: JSON.stringify({
        attemptId: attempt.id,
        answer: selectedOptionId,
      }),
    }).then(res => res.json())

    onResult(result)
  }

  return (
    <button onClick={() => handleSubmit(selectedOptionId)}>
      Submit
    </button>
  )
}
```

### 6.4 Example: Exam Submission Flow

```typescript
// app/api/student/exam/route.ts (design)
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { submitExamAttempt } from '@/lib/assessment'

export async function POST(req: Request) {
  const session = await requireAuth()
  const { attemptId, answers } = await req.json()

  const result = await submitExamAttempt(session.user.id, attemptId, answers)
  return NextResponse.json(result)
}
```

```tsx
// app/(student)/concept/[conceptId]/exam/page.tsx
const handleSubmitExam = async (attemptId: string, answers: AnswerPayload[]) => {
  const result = await fetch('/api/student/exam', {
    method: 'POST',
    body: JSON.stringify({ attemptId, answers }),
  }).then(res => res.json())

  setExamResult(result)
}
```

### 6.5 Tutor Request Flow

```typescript
// app/api/tutor/route.ts
export async function POST(req: Request) {
  const session = await requireAuth()
  const { conceptId, question } = await req.json()
  return NextResponse.json(
    await getSocraticGuidance(session.user.id, conceptId, question)
  )
}
```

- UI should call `/api/tutor` with `{ conceptId, question }`.
- The backend persists a `TutorSession` and `TutorMessage` history.
- The response includes `content`, `retrievedContextIds`, and guardrail flags.

### 6.6 Optional Client-side Read Logging

If the student frontend needs fine-grained content-read telemetry, add a lightweight client logger:
- Collect `CONTENT_READ` events for chunk visibility only.
- Batch 5–10 events if you use a client-side route.
- Keep it optional: assessment interactions are the main source of analytics.

### 6.7 Analytics Aggregation

Backend analytics should reuse the existing `lib/studio/intelligence.ts` helpers.

```typescript
// lib/studio/intelligence.ts
export async function getStudentInsights(userId: string) {
  const interactions = await prisma.interactionLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const masteries = await prisma.userMastery.findMany({
    where: { userId },
  })

  return {
    recentActivity: interactions.slice(0, 10),
    conceptDifficulties: computeDifficultyCodes(interactions),
    timeSpentTrends: computeTrendData(interactions),
    masteryProgression: masteries,
  }
}
```

- Use this for the dashboard analytics panel and student insights.
- The assessment layer already writes the core event stream.
- Additional summary metrics can be derived from `InteractionLog` and `UserMastery`.

---

## 7. Using the `/lib` service layer

The student frontend should drive logic through the shared backend helpers in `ethio-adaptive-learning/lib`. These helpers are the canonical integration points for authentication, curriculum state, adaptive mastery, assessment workflows, tutoring, gamification, and analytics.

### 7.1 Import conventions
- Use `@/lib/...` imports from page and component server code.
- Example:
  - `import { getAuthSession, requireAuth } from '@/lib/auth'`
  - `import { getStudentConceptCatalog, getConceptDetail } from '@/lib/curriculum'`
  - `import { submitPracticeAttempt, submitExamAttempt } from '@/lib/assessment'`

### 7.2 Recommended frontend backend calls
- Dashboard: `getStudentConceptCatalog(userId)`
- Concept landing: `getConceptDetail(conceptId, userId)`
- Learning workspace: `getConceptLearningWorkspace(userId, conceptId)`
- Practice submission: `submitPracticeAttempt()`
- Checkpoint submission: `submitCheckpointAttempt()`
- Exam submission: `submitExamAttempt()`
- Tutor assistance: `getSocraticGuidanceStream(userId, conceptId, question)`
- Gamification: `awardXpForActivity(userId, activity)`, `recordDailyActivity(userId, date)`
- Analytics insights: `getStudentInsights(userId)` or `lib/studio/intelligence.ts`

### 7.3 Useful helper modules from `lib`
- `lib/auth.ts`: session management and route protection
- `lib/prisma.ts`: Prisma client singleton for server-side database access
- `lib/curriculum.ts`: curriculum catalog, fringe, and concept detail helpers
- `lib/adaptive/bkt.ts`: mastery update formulas and BKT observation handling
- `lib/adaptive/retention.ts`: decay, review scheduling, and status derivation
- `lib/adaptive/difficulty.ts`: difficulty tiering for questions
- `lib/assessment/attempts.ts`: attempt lifecycle and persistence
- `lib/assessment/selection.ts`: adaptive question selection logic
- `lib/assessment/workspace.ts`: builds concept learning workspace payloads
- `lib/ai/tutoring/socratic-engine.ts`: tutoring request handling
- `lib/gamification/xp.ts`: XP awards and level calculations
- `lib/gamification/streak.ts`: daily streak tracking
- `lib/gamification/badges.ts`: badge award rules
- `lib/studio/intelligence.ts`: analytics aggregation and insight queries

### 7.4 Why this matters
- The frontend should avoid re-implementing backend logic that already exists in `/lib`.
- Use the service layer for curriculum state, mastery updates, assessment flows, and tutor interaction.
- The frontend is primarily a presentation layer; `/lib` is the domain logic layer.

---

## Summary

This design ensures the student frontend is:

1. **Adaptive**: decisions and recommendations driven by BKT mastery state and retention signals
2. **Transparent**: students see why concepts are locked/available and what's recommended
3. **Agentic**: students choose their pathway (Learn vs Challenge) while system guidance is available
4. **Instrumented**: every interaction is logged for analytics and algorithmic improvement
5. **Modular**: reuses existing UI components and follows established patterns
6. **Scalable**: non-blocking logging, efficient data contracts, performance-optimized

The student journey flows from **Dashboard → Concept → Fork → Pathway → Assessment → Unlock/Review**, with continuous feedback and analytics collection at each step.
