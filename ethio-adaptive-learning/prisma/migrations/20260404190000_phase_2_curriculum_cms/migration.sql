-- AlterTable
ALTER TABLE "Course" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Concept" ADD COLUMN "unlockThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.90;

-- CreateTable
CREATE TABLE "ConceptPrerequisite" (
    "prerequisiteConceptId" TEXT NOT NULL,
    "dependentConceptId" TEXT NOT NULL,

    CONSTRAINT "ConceptPrerequisite_pkey" PRIMARY KEY ("prerequisiteConceptId","dependentConceptId"),
    CONSTRAINT "ConceptPrerequisite_no_self_edge" CHECK ("prerequisiteConceptId" <> "dependentConceptId")
);

-- MigrateData
-- Prisma stores implicit self-relation join columns in alphabetical relation-field order.
-- The previous fields were `dependents` and `prerequisites`, so column B mapped to prerequisites
-- and column A mapped to dependents.
INSERT INTO "ConceptPrerequisite" ("prerequisiteConceptId", "dependentConceptId")
SELECT "B", "A"
FROM "_ConceptPrerequisites";

-- DropTable
DROP TABLE "_ConceptPrerequisites";

-- CreateIndex
CREATE INDEX "Course_archivedAt_idx" ON "Course"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_courseId_order_key" ON "Unit"("courseId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Concept_unitId_title_key" ON "Concept"("unitId", "title");

-- CreateIndex
CREATE INDEX "ConceptPrerequisite_dependentConceptId_idx" ON "ConceptPrerequisite"("dependentConceptId");

-- AddForeignKey
ALTER TABLE "ConceptPrerequisite" ADD CONSTRAINT "ConceptPrerequisite_prerequisiteConceptId_fkey" FOREIGN KEY ("prerequisiteConceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptPrerequisite" ADD CONSTRAINT "ConceptPrerequisite_dependentConceptId_fkey" FOREIGN KEY ("dependentConceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
