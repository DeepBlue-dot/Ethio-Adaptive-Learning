# Ethio Adaptive Learning Platform

An AI-powered adaptive learning platform designed to improve student performance on Ethiopia's Grade 12 National Examination (EHSLCE). Using intelligent tutoring systems and personalized learning pathways, the platform adapts content difficulty and recommendations based on real-time mastery tracking.

## The Problem

Ethiopia's national examination system shows significant performance gaps across regions and demographics. Traditional one-size-fits-all education cannot account for individual learning speeds, prerequisite gaps, or varied learning styles. This platform leverages Intelligent Tutoring Systems (ITS) to provide personalized, evidence-based learning experiences.

## Core Features

### Adaptive Learning Engine
- **Mastery Tracking**: Real-time probability estimation of student knowledge using Bayesian Knowledge Tracing (BKT)
- **Prerequisite-Based Progression**: Knowledge Space Theory (KST) creates curriculum dependency graphs, ensuring students learn in logical sequences
- **Difficulty Calibration**: Item Response Theory (IRT) aligns question difficulty to student ability level
- **Dynamic Recommendations**: System suggests "Learn" or "Challenge" pathways based on current mastery state

### Student Experience
- **Adaptive Practice**: Questions selected based on mastery probability, avoiding tedious repetition or premature jumping
- **Checkpoint Gates**: Single validation question before mastery exam ensures readiness
- **AI Socratic Tutoring**: LLM-powered hint system provides guided learning without direct answers
- **Progress Gamification**: XP system, daily streaks, and badges motivate consistent learning
- **Retention Scheduling**: Spaced repetition triggered when mastery probability decays over time

### Admin & Content Management
- **CMS for Curriculum**: Role-based interface for admins and course writers to create courses, units, concepts, and questions
- **Conflict-Free Authoring**: Draft system prevents content collisions during collaborative editing
- **Audit Trail**: Complete activity log of all content changes for accountability
- **Bulk Operations**: Efficient management of large content sets with filtering and filtering capabilities

### Role-Based System
- **Students**: Access personalized learning paths, practice assessments, and track progress
- **Course Writers**: Author curriculum content, create questions, and manage units
- **Admins**: Oversee system health, configure adaptive parameters, and audit activity

## How It Works

```
┌─────────────────┐
│ Student learns  │
│   a concept     │
└────────┬────────┘
         │
         ↓
    ┌────────────────────────────┐
    │ Prerequisite Unlocked?     │
    │ (Knowledge Space Theory)   │
    └────────┬───────┬───────────┘
             │       │
         YES │       │ NO
             ↓       ↓
        [FRINGE]  [LOCKED]
             │
             ↓
    ┌─────────────────────────┐
    │ Learn or Challenge?     │
    │ (pMastery based)        │
    └────────┬────────┬───────┘
             │        │
        LEARN│        │CHALLENGE
             ↓        ↓
    ┌──────────────┐ ┌────────────────┐
    │ Study Content│ │ Direct Exam    │
    │ Practice Qs  │ │ (No hints)     │
    │ Checkpoint   │ │                │
    │ Mastery Exam │ │ Instant Result │
    └──────┬───────┘ └───────┬────────┘
           │                 │
           └────────┬────────┘
                    ↓
          ┌─────────────────────┐
          │ Update Mastery (BKT)│
          │ Unlock Dependents   │
          │ Award Gamification  │
          │ Schedule Review     │
          └─────────────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js, Next.js, TypeScript, Tailwind CSS |
| Backend | Node.js, Next.js API routes |
| Database | PostgreSQL, Prisma ORM |
| AI | LLM-based Socratic tutoring (Claude/OpenAI) |
| Algorithms | BKT, KST, IRT |
| Auth | NextAuth.js (Credentials) |
| Content Delivery | Cloudinary (media), YouTube (videos) |

## Key Algorithms Explained

**Bayesian Knowledge Tracing (BKT)**: Estimates the probability that a student has learned a concept. Updated after each assessment attempt based on whether they succeeded or failed.

**Knowledge Space Theory (KST)**: Models the prerequisite graph—which concepts must be mastered before attempting others. Prevents students from encountering locked content.

**Item Response Theory (IRT)**: Calibrates question difficulty against student ability. A "hard" question is one where the student has ~50% probability of success based on their current mastery.

## Project Structure

```
ethio-adaptive-learning/
├── app/
│   ├── (admin)/          # Admin dashboard routes
│   ├── (public)/         # Login, register, password reset
│   ├── (student)/        # Student learning interface
│   └── api/              # API endpoints
├── lib/
│   ├── assessment/       # Question selection, grading logic
│   ├── curriculum/       # Prerequisite graphs, state tracking
│   ├── adaptive/         # BKT, mastery calculations
│   ├── ai/               # LLM tutoring integration
│   ├── cms/              # Content management core
│   ├── gamification/     # XP, streak, badge logic
│   └── ...
├── components/
│   ├── admin/            # CMS UI components
│   ├── student/          # Learning interface components
│   ├── cms/              # Content authoring components
│   └── ui/               # Reusable UI primitives
├── prisma/
│   ├── schema.prisma     # Data model (User, Course, Question, etc.)
│   └── migrations/       # Database migration history
└── types/                # TypeScript type definitions
```

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation Steps

1. **Clone and navigate**:
```bash
git clone <repo-url>
cd ethio-adaptive-learning
```

2. **Set environment variables**:
```bash
cp .env.example .env
```

   Required variables:
   - `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://user:password@localhost:5432/ethio_db`)
   - `NEXT_PUBLIC_APP_URL`: Local development URL (e.g., `http://localhost:3000`)
   - `AUTH_SECRET`: NextAuth session secret (generate with `openssl rand -base64 32`)
   - `AUTH_TRUST_HOST`: Set to `true` for local development
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`: Default admin credentials
   - `SEED_WRITER_EMAIL` / `SEED_WRITER_PASSWORD`: Default course writer credentials
   - `SEED_STUDENT_EMAIL` / `SEED_STUDENT_PASSWORD`: Default student credentials

3. **Install dependencies**:
```bash
npm install
```

4. **Generate Prisma client**:
```bash
npm run prisma:generate
```

5. **Create and migrate database**:
```bash
npm run prisma:migrate
```

   If migrating an existing database:
```bash
npm run db:push
```

6. **Seed demo data**:
```bash
npm run db:seed
```

   This creates admin, course writer, and student accounts with the credentials from your `.env` file.

7. **Start development server**:
```bash
npm run dev
```

   Access the app at `http://localhost:3000`

8. **Verify the setup**:
```bash
npm run test
npm run lint
```

## Default Development Accounts

After seeding, log in with:

| Role | Email | Password |
|------|-------|----------|
| Admin | `SEED_ADMIN_EMAIL` | `SEED_ADMIN_PASSWORD` |
| Course Writer | `SEED_WRITER_EMAIL` | `SEED_WRITER_PASSWORD` |
| Student | `SEED_STUDENT_EMAIL` | `SEED_STUDENT_PASSWORD` |

## Development Guide

### Adding a New Concept
1. Log in as admin or course writer
2. Navigate to `/admin/cms/concepts/new`
3. Define the concept name, description, and prerequisites
4. Add instructional chunks (Markdown, LaTeX, media)
5. Create checkpoint and mastery exam questions
6. Publish when ready

### Testing Student Learning Flow
1. Log in as the seeded student
2. Navigate to `/student/dashboard`
3. Select a concept in the "FRINGE" state (unlocked but not mastered)
4. Choose "Learn" or "Challenge" pathway
5. Complete practice questions and exams
6. Observe mastery probability updates and gamification rewards

### Debugging Adaptive Logic
- Check `lib/adaptive/bkt.ts` for mastery probability calculations
- Review `lib/curriculum/graph.ts` for prerequisite unlocking logic
- Test question selection in `lib/assessment/selection.ts`

## Troubleshooting

### Database Schema Mismatch
**Error**: `The column "name" does not exist in the current database`

**Solution**: Your database schema is out of sync with Prisma:
```bash
npm run db:push
npm run db:seed
```

### CMS Pages Show Missing Fields
**Error**: Pages error on missing fields like `Course.archivedAt` or `Concept.unlockThreshold`

**Solution**: Sync the Prisma schema and reseed:
```bash
npm run db:push
npm run db:seed
```

### Cannot Connect to PostgreSQL
**Error**: `npx prisma db seed` says it cannot reach `localhost:5432`

**Solution**: Ensure PostgreSQL is running and `DATABASE_URL` is correct:
```bash
# Check if PostgreSQL is running (Linux/Mac)
ps aux | grep postgres

# Update DATABASE_URL in .env if needed, then:
npm run db:seed
```

### NextAuth Warning
**Warning**: NEXTAUTH_URL warning during local development

**Solution**: Make sure `NEXT_PUBLIC_APP_URL` is set in `.env` (e.g., `http://localhost:3000`)

## Contributing

1. **Create a feature branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and test locally:
   ```bash
   npm run test
   npm run lint
   npm run dev
   ```

3. **Commit with descriptive messages** (follow conventional commits):
   ```bash
   git commit -m "feat: add spaced repetition scheduling for review concepts"
   ```

4. **Push and create a Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Address code review feedback** and iterate until approved

See the project documentation in `doc/` for detailed system architecture and design decisions.

## Documentation

- [System Architecture](../doc/readme/System%20Implementation.md)
- [Adaptive Decision Flow](../doc/readme/Adaptive-Decision-Flow.md)
- [Database Design](../doc/readme/db-desgin.md)
- [CMS Architecture](../doc/cms.md)
- [Student Frontend Design](../doc/readme/student-frontend-design.md)

## License

See LICENSE file for details.

## Support

For questions or issues, open a GitHub issue or contact the development team.
