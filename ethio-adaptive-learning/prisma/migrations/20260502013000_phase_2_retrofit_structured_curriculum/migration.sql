-- AlterTable
ALTER TABLE "Course" ADD COLUMN "slug" TEXT;
ALTER TABLE "Unit" ADD COLUMN "slug" TEXT;
ALTER TABLE "Concept" ADD COLUMN "slug" TEXT;
ALTER TABLE "Question"
ADD COLUMN "slug" TEXT,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3);

-- Backfill slugs and timestamps for existing rows.
UPDATE "Course"
SET "slug" = COALESCE(
  NULLIF(TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE("title", '[^a-zA-Z0-9]+', '-', 'g'))), ''),
  'course-' || SUBSTRING("id" FROM 1 FOR 8)
);

UPDATE "Unit"
SET "slug" = COALESCE(
  NULLIF(TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE("title", '[^a-zA-Z0-9]+', '-', 'g'))), ''),
  'unit-' || SUBSTRING("id" FROM 1 FOR 8)
);

UPDATE "Concept"
SET "slug" = COALESCE(
  NULLIF(TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE("title", '[^a-zA-Z0-9]+', '-', 'g'))), ''),
  'concept-' || SUBSTRING("id" FROM 1 FOR 8)
);

UPDATE "Question"
SET
  "slug" = 'question-' || SUBSTRING("id" FROM 1 FOR 8),
  "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP);

ALTER TABLE "Course" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Unit" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Concept" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Question" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Question" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "Question" ALTER COLUMN "createdAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ConceptChunk" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyMd" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConceptChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkedExample" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "problemMd" TEXT NOT NULL,
    "solutionMd" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkedExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptClosure" (
    "ancestorConceptId" TEXT NOT NULL,
    "descendantConceptId" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,

    CONSTRAINT "ConceptClosure_pkey" PRIMARY KEY ("ancestorConceptId","descendantConceptId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_courseId_slug_key" ON "Unit"("courseId", "slug");
CREATE UNIQUE INDEX "Concept_unitId_slug_key" ON "Concept"("unitId", "slug");
CREATE UNIQUE INDEX "Question_conceptId_slug_key" ON "Question"("conceptId", "slug");
CREATE UNIQUE INDEX "ConceptChunk_conceptId_slug_key" ON "ConceptChunk"("conceptId", "slug");
CREATE UNIQUE INDEX "ConceptChunk_conceptId_order_key" ON "ConceptChunk"("conceptId", "order");
CREATE UNIQUE INDEX "WorkedExample_conceptId_slug_key" ON "WorkedExample"("conceptId", "slug");
CREATE UNIQUE INDEX "WorkedExample_conceptId_order_key" ON "WorkedExample"("conceptId", "order");
CREATE INDEX "ConceptClosure_descendantConceptId_idx" ON "ConceptClosure"("descendantConceptId");

-- Create unique course slugs last so the backfill can be corrected manually if needed.
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- AddForeignKey
ALTER TABLE "ConceptChunk" ADD CONSTRAINT "ConceptChunk_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConceptChunk" ADD CONSTRAINT "ConceptChunk_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkedExample" ADD CONSTRAINT "WorkedExample_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkedExample" ADD CONSTRAINT "WorkedExample_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConceptClosure" ADD CONSTRAINT "ConceptClosure_ancestorConceptId_fkey" FOREIGN KEY ("ancestorConceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConceptClosure" ADD CONSTRAINT "ConceptClosure_descendantConceptId_fkey" FOREIGN KEY ("descendantConceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill closure rows from existing direct edges using shortest depth.
WITH RECURSIVE "ClosurePaths" AS (
  SELECT
    c."id" AS "ancestorConceptId",
    c."id" AS "descendantConceptId",
    0 AS "depth"
  FROM "Concept" c

  UNION ALL

  SELECT
    cp."ancestorConceptId",
    edge."dependentConceptId" AS "descendantConceptId",
    cp."depth" + 1 AS "depth"
  FROM "ClosurePaths" cp
  JOIN "ConceptPrerequisite" edge
    ON edge."prerequisiteConceptId" = cp."descendantConceptId"
)
INSERT INTO "ConceptClosure" ("ancestorConceptId", "descendantConceptId", "depth")
SELECT
  "ancestorConceptId",
  "descendantConceptId",
  MIN("depth") AS "depth"
FROM "ClosurePaths"
GROUP BY "ancestorConceptId", "descendantConceptId";
