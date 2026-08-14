-- CreateEnum
CREATE TYPE "MeasureMode" AS ENUM ('fast', 'accurate');

-- CreateTable
CREATE TABLE "AnalysisResult" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "mode" "MeasureMode" NOT NULL,
    "bytes" INTEGER NOT NULL,
    "green" BOOLEAN NOT NULL,
    "gco2e" DOUBLE PRECISION NOT NULL,
    "rating" TEXT NOT NULL,
    "cleanerThan" DOUBLE PRECISION,
    "gridLabel" TEXT,
    "gridIntensity" DOUBLE PRECISION,
    "fixes" JSONB NOT NULL,
    "mocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "dailyLimit" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisResult_slug_key" ON "AnalysisResult"("slug");
CREATE INDEX "AnalysisResult_hostname_mode_createdAt_idx" ON "AnalysisResult"("hostname", "mode", "createdAt");
CREATE INDEX "AnalysisResult_expiresAt_idx" ON "AnalysisResult"("expiresAt");
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");
CREATE INDEX "RateLimitBucket_key_idx" ON "RateLimitBucket"("key");
CREATE UNIQUE INDEX "RateLimitBucket_key_windowStart_key" ON "RateLimitBucket"("key", "windowStart");
