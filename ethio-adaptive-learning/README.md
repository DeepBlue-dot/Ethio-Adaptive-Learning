# Ethio Adaptive Learning

A Phase 1 foundation for a role-aware adaptive learning platform built with Next.js, Prisma, PostgreSQL, and credentials-based authentication.

## Local Setup

1. Copy `.env.example` to `.env` and set your database credentials.
2. Make sure these variables are present:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `AUTH_SECRET`
   - `AUTH_TRUST_HOST`
   - `SEED_ADMIN_EMAIL`
   - `SEED_ADMIN_PASSWORD`
   - `SEED_WRITER_EMAIL`
   - `SEED_WRITER_PASSWORD`
   - `SEED_STUDENT_EMAIL`
   - `SEED_STUDENT_PASSWORD`
3. Generate the Prisma client:

```bash
npm run prisma:generate
```

4. Create and apply your local migration:

```bash
npm run prisma:migrate
```

If your local database already existed before Phase 1 and Prisma reports missing columns like `User.name`, sync it first with:

```bash
npm run db:push
```

5. Seed the initial admin and demo student:

```bash
npm run db:seed
# or
npx prisma db seed
```

6. Start the app:

```bash
npm run dev
```

7. Run the Phase 1 verification suite:

```bash
npm run test
npm run lint
```

## Phase 1 Deliverables

- Student registration with automatic `UserProfile` creation
- Credentials login with email or username
- Role-aware routing for students and admins
- Protected application shell with sign-out
- Seeded development admin and student accounts

## Phase 2 Additions

- Admin and course-writer CMS for courses, units, concepts, prerequisites, and questions
- Explicit prerequisite graph with cycle protection
- Student concept catalog driven by real curriculum and unlock status
- Seeded Grade 12 Mathematics demo content and question bank

## Default Seed Accounts

- Admin email: `SEED_ADMIN_EMAIL`
- Course writer email: `SEED_WRITER_EMAIL`
- Student email: `SEED_STUDENT_EMAIL`
- Passwords come from the matching env vars in `.env`

## Troubleshooting

- If registration fails with `The column "name" does not exist in the current database`, your database schema is older than the current Prisma schema. Run:

```bash
npm run db:push
npm run db:seed
```

- If the Phase 2 CMS pages error on missing fields like `Course.archivedAt`, `Concept.unlockThreshold`, or `ConceptPrerequisite`, sync the current Prisma schema and reseed:

```bash
npm run db:push
npm run db:seed
```

- If `npx prisma db seed` says it cannot reach `localhost:5432`, Prisma is already wired correctly and the remaining issue is just database availability. Start PostgreSQL or update `DATABASE_URL`, then rerun:

```bash
npx prisma db seed
```

- If you see a `NEXTAUTH_URL` warning during local development, make sure `NEXT_PUBLIC_APP_URL` is set in `.env`. The app now uses that value as a fallback for local auth URLs.
