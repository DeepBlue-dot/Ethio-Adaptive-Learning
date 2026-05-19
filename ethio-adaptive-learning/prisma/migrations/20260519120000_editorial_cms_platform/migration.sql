-- Editorial CMS platform: lifecycle, drafts, media assets, reusable snippets, and content blocks.

CREATE TYPE "CmsPublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED');
CREATE TYPE "MediaAssetKind" AS ENUM ('IMAGE', 'YOUTUBE_EMBED');

ALTER TABLE "Course"
  ADD COLUMN "status" "CmsPublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "publishedById" TEXT,
  ADD COLUMN "unpublishedAt" TIMESTAMP(3),
  ADD COLUMN "unpublishedById" TEXT;

ALTER TABLE "Unit"
  ADD COLUMN "status" "CmsPublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "publishedById" TEXT,
  ADD COLUMN "unpublishedAt" TIMESTAMP(3),
  ADD COLUMN "unpublishedById" TEXT;

ALTER TABLE "Concept"
  ADD COLUMN "contentBlocks" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "status" "CmsPublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "publishedById" TEXT,
  ADD COLUMN "unpublishedAt" TIMESTAMP(3),
  ADD COLUMN "unpublishedById" TEXT;

ALTER TABLE "ConceptChunk"
  ADD COLUMN "status" "CmsPublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "publishedById" TEXT,
  ADD COLUMN "unpublishedAt" TIMESTAMP(3),
  ADD COLUMN "unpublishedById" TEXT;

ALTER TABLE "WorkedExample"
  ADD COLUMN "status" "CmsPublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "publishedById" TEXT,
  ADD COLUMN "unpublishedAt" TIMESTAMP(3),
  ADD COLUMN "unpublishedById" TEXT;

ALTER TABLE "Question"
  ADD COLUMN "status" "CmsPublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "publishedById" TEXT,
  ADD COLUMN "unpublishedAt" TIMESTAMP(3),
  ADD COLUMN "unpublishedById" TEXT;

UPDATE "Course" SET "publishedAt" = NOW() WHERE "status" = 'PUBLISHED';
UPDATE "Unit" SET "publishedAt" = NOW() WHERE "status" = 'PUBLISHED';
UPDATE "Concept" SET "publishedAt" = NOW() WHERE "status" = 'PUBLISHED';
UPDATE "ConceptChunk" SET "publishedAt" = NOW() WHERE "status" = 'PUBLISHED';
UPDATE "WorkedExample" SET "publishedAt" = NOW() WHERE "status" = 'PUBLISHED';
UPDATE "Question" SET "publishedAt" = NOW() WHERE "status" = 'PUBLISHED';

UPDATE "Concept" AS concept
SET "contentBlocks" = COALESCE(
  (
    SELECT jsonb_agg(block ORDER BY sort_order)
    FROM (
      SELECT
        0 AS sort_order,
        jsonb_build_object(
          'id', concat('legacy-overview-', concept.id),
          'type', 'paragraph',
          'text', concept."contentBody"
        ) AS block
      WHERE concept."contentBody" IS NOT NULL AND btrim(concept."contentBody") <> ''

      UNION ALL

      SELECT
        1000 + chunk."order" AS sort_order,
        jsonb_build_object(
          'id', chunk.id,
          'type', 'paragraph',
          'title', chunk.title,
          'text', chunk."bodyMd"
        ) AS block
      FROM "ConceptChunk" AS chunk
      WHERE chunk."conceptId" = concept.id

      UNION ALL

      SELECT
        2000 + example."order" AS sort_order,
        jsonb_build_object(
          'id', example.id,
          'type', 'paragraph',
          'title', concat('Example: ', example.title),
          'text', concat('Problem', E'\n\n', example."problemMd", E'\n\nSolution', E'\n\n', example."solutionMd")
        ) AS block
      FROM "WorkedExample" AS example
      WHERE example."conceptId" = concept.id
    ) AS migrated_blocks
  ),
  '[]'::jsonb
);

CREATE TABLE "CmsDraft" (
  "id" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "createdById" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CmsDraft_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "kind" "MediaAssetKind" NOT NULL,
  "title" TEXT,
  "alt" TEXT,
  "caption" TEXT,
  "publicId" TEXT,
  "url" TEXT,
  "width" INTEGER,
  "height" INTEGER,
  "bytes" INTEGER,
  "videoId" TEXT,
  "thumbnailUrl" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "status" "CmsPublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
  "publishedAt" TIMESTAMP(3),
  "publishedById" TEXT,
  "unpublishedAt" TIMESTAMP(3),
  "unpublishedById" TEXT,

  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentSnippet" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "contentBlocks" JSONB NOT NULL DEFAULT '[]',
  "authorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "status" "CmsPublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
  "publishedAt" TIMESTAMP(3),
  "publishedById" TEXT,
  "unpublishedAt" TIMESTAMP(3),
  "unpublishedById" TEXT,

  CONSTRAINT "ContentSnippet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CmsDraft_contentType_entityId_key" ON "CmsDraft"("contentType", "entityId");
CREATE INDEX "CmsDraft_contentType_idx" ON "CmsDraft"("contentType");
CREATE INDEX "CmsDraft_updatedAt_idx" ON "CmsDraft"("updatedAt");

CREATE UNIQUE INDEX "MediaAsset_publicId_key" ON "MediaAsset"("publicId");
CREATE INDEX "MediaAsset_kind_idx" ON "MediaAsset"("kind");
CREATE INDEX "MediaAsset_status_idx" ON "MediaAsset"("status");

CREATE UNIQUE INDEX "ContentSnippet_slug_key" ON "ContentSnippet"("slug");
CREATE INDEX "ContentSnippet_status_idx" ON "ContentSnippet"("status");
CREATE INDEX "ContentSnippet_authorId_idx" ON "ContentSnippet"("authorId");

ALTER TABLE "ContentSnippet"
  ADD CONSTRAINT "ContentSnippet_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Course_status_idx" ON "Course"("status");
CREATE INDEX "Unit_status_idx" ON "Unit"("status");
CREATE INDEX "Concept_status_idx" ON "Concept"("status");
CREATE INDEX "ConceptChunk_status_idx" ON "ConceptChunk"("status");
CREATE INDEX "WorkedExample_status_idx" ON "WorkedExample"("status");
CREATE INDEX "Question_status_idx" ON "Question"("status");
