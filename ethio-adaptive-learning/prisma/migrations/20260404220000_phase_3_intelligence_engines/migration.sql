-- AlterTable
ALTER TABLE "UserMastery"
ADD COLUMN "lastAssessedAt" TIMESTAMP(3),
ADD COLUMN "nextReviewAt" TIMESTAMP(3),
ADD COLUMN "unlockedAt" TIMESTAMP(3);

-- Backfill existing mastery rows into the new retention fields.
UPDATE "UserMastery"
SET
  "lastAssessedAt" = "lastInteractionAt",
  "unlockedAt" = CASE
    WHEN "status" <> 'LOCKED' THEN "lastInteractionAt"
    ELSE NULL
  END;

-- AlterTable
ALTER TABLE "UserMastery"
DROP COLUMN "memoryStability",
DROP COLUMN "lastInteractionAt";

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

-- AlterTable
ALTER TABLE "ExamAttempt"
ADD COLUMN "questionIds" JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN "submittedAnswers" JSONB,
ADD COLUMN "questionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "correctCount" INTEGER,
ADD COLUMN "completedAt" TIMESTAMP(3),
ALTER COLUMN "score" DROP NOT NULL,
ALTER COLUMN "timeSpentSec" DROP NOT NULL,
ALTER COLUMN "isPassed" DROP NOT NULL;

ALTER TABLE "ExamAttempt" ALTER COLUMN "questionIds" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "UserMastery_userId_nextReviewAt_idx" ON "UserMastery"("userId", "nextReviewAt");

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
