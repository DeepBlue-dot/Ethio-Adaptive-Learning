# Database Design Documentation

The Ethio-Adaptive-Learning platform utilizes a PostgreSQL database managed via Prisma ORM. The schema is designed to support a complex, content-heavy Intelligent Tutoring System (ITS) with deep adaptive tracking and content management capabilities.

## 1. Core Architecture Overview

The database is structured around four primary pillars:
1.  **Curriculum Graph**: A hierarchical and relational structure of learning nodes.
2.  **Adaptive Mastery**: Per-user tracking of knowledge states using probabilistic models.
3.  **Content Management System (CMS)**: Professional authoring workflow with drafts and publication lifecycles.
4.  **Learning Interaction**: Recording every student action for analytics and AI-driven recommendations.

---

## 2. Curriculum Data Model

The curriculum follows a strict hierarchy: **Course → Unit → Concept**.

### 2.1. Hierarchy Models
*   **`Course`**: The top-level container (e.g., "Grade 12 Mathematics"). Supports a publication lifecycle (`DRAFT`, `PUBLISHED`).
*   **`Unit`**: Sub-sections of a course (e.g., "Unit 1: Sequences and Series"). Maintains an `order` field for linear progression.
*   **`Concept`**: The atomic unit of learning. This is the level where mastery is tracked and content is authored.

### 2.2. The Knowledge Graph (KST Implementation)
Prerequisites are managed at the concept level to create a **Directed Acyclic Graph (DAG)**.
*   **`ConceptPrerequisite`**: A self-referential relationship table between concepts. Defines direct dependencies.
*   **`ConceptClosure`**: A **Transitive Closure** table. It stores all reachable ancestors/descendants and their `depth`, enabling high-performance "unlock" queries without recursive SQL operations.

---

## 3. Adaptive Intelligence & Mastery

### 3.1. Bayesian Knowledge Tracing (BKT) Parameters
The `Concept` model stores the "Ideal" BKT parameters for each node:
*   `pLo`: Initial probability of knowledge.
*   `pT`: Transition probability (learning rate).
*   `pG`: Guess probability.
*   `pS`: Slip probability.

### 3.2. User Mastery Tracking
*   **`UserMastery`**: Stores the current state of a specific student for a specific concept.
    *   `pMastery`: Current probability of mastery ($P(L)$).
    *   `status`: Derived state (`LOCKED`, `FRINGE`, `IN_PROGRESS`, `MASTERED`, `REVIEW_NEEDED`).
    *   `lastAssessedAt` / `nextReviewAt`: Tracks assessment frequency for the spaced repetition engine.

---

## 4. Content Authoring (CMS Subsystem)

### 4.1. Block-Based Content
*   **`ConceptChunk`**: Explanatory content segments associated with a concept.
*   **`WorkedExample`**: Step-by-step problem-solving guides.
*   **`Question`**: Multiple-choice assessment nodes with `difficulty` and `usage` (Practice vs. Exam) tags.

### 4.2. Asset Management & Reusability
*   **`MediaAsset`**: Centralized repository for images, YouTube embeds, and PhET simulations.
*   **`ContentSnippet`**: Reusable blocks of content that can be injected into multiple concepts.
*   **`ResourceUsage`**: A cross-reference table that tracks where specific assets are used across the curriculum, ensuring integrity during deletions.

### 4.3. Authoring Workflow
*   **`CmsDraft`**: Stores working copies of content as JSON. This allows authors to iterate on curriculum nodes without affecting the live student experience until "Publish" is triggered.

---

## 5. Learning Interaction & Analytics

### 5.1. Assessment Attempts
*   **`PracticeAttempt`**: Logs individual practice sessions.
*   **`CheckpointAttempt`**: Records results of concept-level gateways.
*   **`ExamAttempt`**: Full-scale mock exam results with time-tracking and automated scoring.

### 5.2. Interaction Logging
*   **`InteractionLog`**: A high-volume table using `BigInt` IDs. It captures every response, correctness bit, and `responseTimeMs`, serving as the primary data source for the Studio Intelligence dashboard.

---

## 6. AI Tutoring & Gamification

### 6.1. Socratic AI Tutor
*   **`TutorSession`**: Groups AI messages by User and Concept.
*   **`TutorMessage`**: Individual chat exchanges. Includes `isFlagged` and `flagReason` for Socratic guardrail monitoring.

### 6.2. Gamification Layer
*   **`UserProfile`**: Extends the core `User` model to track motivational metrics.
    *   `totalXP`: Experience points earned through activities.
    *   `currentLevel`: Derived from XP.
    *   `dailyStreak`: Consecutive days of activity.

---

## 7. Authentication & Security
Uses the standard **NextAuth.js** pattern:
*   **`User`**: Core account details and role-based access control (`ADMIN`, `COURSE_WRITER`, `STUDENT`).
*   **`Account`**, **`Session`**, **`VerificationToken`**: Infrastructure for secure logins and social providers.
*   **`PasswordResetToken`**: Self-service account recovery logic.
