-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'COURSE_WRITER', 'ADMIN');

-- CreateEnum
CREATE TYPE "StudentGrade" AS ENUM ('MIDDLE_SCHOOL', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12', 'ABOVE');

-- CreateEnum
CREATE TYPE "CmsPublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "MediaAssetKind" AS ENUM ('IMAGE', 'YOUTUBE_EMBED', 'PHET_SIMULATION');

-- CreateEnum
CREATE TYPE "MasteryStatus" AS ENUM ('LOCKED', 'FRINGE', 'IN_PROGRESS', 'MASTERED', 'REVIEW_NEEDED');

-- CreateEnum
CREATE TYPE "DifficultyTier" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuestionUsage" AS ENUM ('PRACTICE', 'CHECKPOINT', 'EXAM');

-- CreateEnum
CREATE TYPE "PathwayType" AS ENUM ('LEARN', 'CHALLENGE');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('STUDENT', 'AI');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "grade" "StudentGrade",
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityTitle" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "dailyStreak" INTEGER NOT NULL DEFAULT 0,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallProgress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "archivedAt" TIMESTAMP(3),
    "status" "CmsPublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "unpublishedAt" TIMESTAMP(3),
    "unpublishedById" TEXT,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "CmsPublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "unpublishedAt" TIMESTAMP(3),
    "unpublishedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concept" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "unitId" TEXT NOT NULL,
    "contentBody" TEXT,
    "contentBlocks" JSONB NOT NULL DEFAULT '[]',
    "unlockThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.90,
    "status" "CmsPublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "unpublishedAt" TIMESTAMP(3),
    "unpublishedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pLo" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "pT" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "pG" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "pS" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "decayLambda" DOUBLE PRECISION NOT NULL DEFAULT 0.01,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptPrerequisite" (
    "prerequisiteConceptId" TEXT NOT NULL,
    "dependentConceptId" TEXT NOT NULL,

    CONSTRAINT "ConceptPrerequisite_pkey" PRIMARY KEY ("prerequisiteConceptId","dependentConceptId")
);

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
    "status" "CmsPublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "unpublishedAt" TIMESTAMP(3),
    "unpublishedById" TEXT,

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
    "status" "CmsPublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "unpublishedAt" TIMESTAMP(3),
    "unpublishedById" TEXT,

    CONSTRAINT "WorkedExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptClosure" (
    "ancestorConceptId" TEXT NOT NULL,
    "descendantConceptId" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,

    CONSTRAINT "ConceptClosure_pkey" PRIMARY KEY ("ancestorConceptId","descendantConceptId")
);

-- CreateTable
CREATE TABLE "UserMastery" (
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "pMastery" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "lastAssessedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "unlockedAt" TIMESTAMP(3),
    "status" "MasteryStatus" NOT NULL DEFAULT 'LOCKED',
    "consecutiveFails" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserMastery_pkey" PRIMARY KEY ("userId","conceptId")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "difficulty" "DifficultyTier" NOT NULL,
    "usage" "QuestionUsage" NOT NULL,
    "content" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "distractors" JSONB,
    "hintText" TEXT,
    "explanation" TEXT,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "CmsPublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "unpublishedAt" TIMESTAMP(3),
    "unpublishedById" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "ResourceUsage" (
    "id" TEXT NOT NULL,
    "mediaAssetId" TEXT,
    "contentSnippetId" TEXT,
    "consumerType" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PracticeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckpointAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CheckpointAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "pathway" "PathwayType" NOT NULL,
    "questionIds" JSONB NOT NULL,
    "submittedAnswers" JSONB,
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER,
    "score" DOUBLE PRECISION,
    "timeSpentSec" INTEGER,
    "isPassed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteractionLog" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "questionId" TEXT,
    "activityType" TEXT NOT NULL,
    "isCorrect" BOOLEAN,
    "responseTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteractionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "TutorSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokens" INTEGER,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "retrievedContext" JSONB,

    CONSTRAINT "TutorMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_contentType_entityId_idx" ON "ActivityLog"("contentType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_archivedAt_idx" ON "Course"("archivedAt");

-- CreateIndex
CREATE INDEX "Course_status_idx" ON "Course"("status");

-- CreateIndex
CREATE INDEX "Unit_status_idx" ON "Unit"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_courseId_order_key" ON "Unit"("courseId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_courseId_slug_key" ON "Unit"("courseId", "slug");

-- CreateIndex
CREATE INDEX "Concept_status_idx" ON "Concept"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Concept_unitId_title_key" ON "Concept"("unitId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Concept_unitId_slug_key" ON "Concept"("unitId", "slug");

-- CreateIndex
CREATE INDEX "ConceptPrerequisite_dependentConceptId_idx" ON "ConceptPrerequisite"("dependentConceptId");

-- CreateIndex
CREATE INDEX "ConceptChunk_status_idx" ON "ConceptChunk"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptChunk_conceptId_slug_key" ON "ConceptChunk"("conceptId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptChunk_conceptId_order_key" ON "ConceptChunk"("conceptId", "order");

-- CreateIndex
CREATE INDEX "WorkedExample_status_idx" ON "WorkedExample"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkedExample_conceptId_slug_key" ON "WorkedExample"("conceptId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "WorkedExample_conceptId_order_key" ON "WorkedExample"("conceptId", "order");

-- CreateIndex
CREATE INDEX "ConceptClosure_descendantConceptId_idx" ON "ConceptClosure"("descendantConceptId");

-- CreateIndex
CREATE INDEX "UserMastery_userId_nextReviewAt_idx" ON "UserMastery"("userId", "nextReviewAt");

-- CreateIndex
CREATE INDEX "Question_status_idx" ON "Question"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Question_conceptId_slug_key" ON "Question"("conceptId", "slug");

-- CreateIndex
CREATE INDEX "CmsDraft_contentType_idx" ON "CmsDraft"("contentType");

-- CreateIndex
CREATE INDEX "CmsDraft_updatedAt_idx" ON "CmsDraft"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CmsDraft_contentType_entityId_key" ON "CmsDraft"("contentType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_publicId_key" ON "MediaAsset"("publicId");

-- CreateIndex
CREATE INDEX "MediaAsset_kind_idx" ON "MediaAsset"("kind");

-- CreateIndex
CREATE INDEX "MediaAsset_status_idx" ON "MediaAsset"("status");

-- CreateIndex
CREATE INDEX "MediaAsset_title_idx" ON "MediaAsset"("title");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSnippet_slug_key" ON "ContentSnippet"("slug");

-- CreateIndex
CREATE INDEX "ContentSnippet_status_idx" ON "ContentSnippet"("status");

-- CreateIndex
CREATE INDEX "ContentSnippet_title_idx" ON "ContentSnippet"("title");

-- CreateIndex
CREATE INDEX "ResourceUsage_mediaAssetId_idx" ON "ResourceUsage"("mediaAssetId");

-- CreateIndex
CREATE INDEX "ResourceUsage_contentSnippetId_idx" ON "ResourceUsage"("contentSnippetId");

-- CreateIndex
CREATE INDEX "ResourceUsage_consumerId_idx" ON "ResourceUsage"("consumerId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceUsage_mediaAssetId_consumerId_context_key" ON "ResourceUsage"("mediaAssetId", "consumerId", "context");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceUsage_contentSnippetId_consumerId_context_key" ON "ResourceUsage"("contentSnippetId", "consumerId", "context");

-- CreateIndex
CREATE INDEX "PracticeAttempt_userId_conceptId_createdAt_idx" ON "PracticeAttempt"("userId", "conceptId", "createdAt");

-- CreateIndex
CREATE INDEX "PracticeAttempt_questionId_idx" ON "PracticeAttempt"("questionId");

-- CreateIndex
CREATE INDEX "CheckpointAttempt_userId_conceptId_createdAt_idx" ON "CheckpointAttempt"("userId", "conceptId", "createdAt");

-- CreateIndex
CREATE INDEX "CheckpointAttempt_questionId_idx" ON "CheckpointAttempt"("questionId");

-- CreateIndex
CREATE INDEX "ExamAttempt_userId_conceptId_createdAt_idx" ON "ExamAttempt"("userId", "conceptId", "createdAt");

-- CreateIndex
CREATE INDEX "InteractionLog_userId_conceptId_createdAt_idx" ON "InteractionLog"("userId", "conceptId", "createdAt");

-- CreateIndex
CREATE INDEX "InteractionLog_userId_questionId_idx" ON "InteractionLog"("userId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "TutorSession_userId_conceptId_idx" ON "TutorSession"("userId", "conceptId");

-- CreateIndex
CREATE INDEX "TutorMessage_sessionId_idx" ON "TutorMessage"("sessionId");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Concept" ADD CONSTRAINT "Concept_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptPrerequisite" ADD CONSTRAINT "ConceptPrerequisite_prerequisiteConceptId_fkey" FOREIGN KEY ("prerequisiteConceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptPrerequisite" ADD CONSTRAINT "ConceptPrerequisite_dependentConceptId_fkey" FOREIGN KEY ("dependentConceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptChunk" ADD CONSTRAINT "ConceptChunk_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptChunk" ADD CONSTRAINT "ConceptChunk_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkedExample" ADD CONSTRAINT "WorkedExample_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkedExample" ADD CONSTRAINT "WorkedExample_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptClosure" ADD CONSTRAINT "ConceptClosure_ancestorConceptId_fkey" FOREIGN KEY ("ancestorConceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptClosure" ADD CONSTRAINT "ConceptClosure_descendantConceptId_fkey" FOREIGN KEY ("descendantConceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMastery" ADD CONSTRAINT "UserMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMastery" ADD CONSTRAINT "UserMastery_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSnippet" ADD CONSTRAINT "ContentSnippet_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceUsage" ADD CONSTRAINT "ResourceUsage_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceUsage" ADD CONSTRAINT "ResourceUsage_contentSnippetId_fkey" FOREIGN KEY ("contentSnippetId") REFERENCES "ContentSnippet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckpointAttempt" ADD CONSTRAINT "CheckpointAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckpointAttempt" ADD CONSTRAINT "CheckpointAttempt_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckpointAttempt" ADD CONSTRAINT "CheckpointAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionLog" ADD CONSTRAINT "InteractionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionLog" ADD CONSTRAINT "InteractionLog_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorSession" ADD CONSTRAINT "TutorSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorSession" ADD CONSTRAINT "TutorSession_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorMessage" ADD CONSTRAINT "TutorMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TutorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
