-- CreateTable
CREATE TABLE "CmsVersion" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "publishedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CmsVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CmsVersion_contentType_entityId_idx" ON "CmsVersion"("contentType", "entityId");

-- CreateIndex
CREATE INDEX "CmsVersion_createdAt_idx" ON "CmsVersion"("createdAt");
