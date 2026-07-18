-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- Drop scaffold Research model if present
DROP TABLE IF EXISTS "Research";

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "AnalysisCategory" AS ENUM ('PAYMENT', 'PENALTY', 'TERMINATION', 'OBLIGATION', 'RISK', 'UNUSUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "extractedText" TEXT NOT NULL,
    "markdownSummary" TEXT NOT NULL,
    "contractType" TEXT,
    "title" TEXT,
    "purpose" TEXT,
    "confidenceScore" INTEGER,
    "coverageScore" INTEGER,
    "status" "ContractStatus" NOT NULL DEFAULT 'PENDING',
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractAnalysis" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "category" "AnalysisCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ContractAnalysis" ADD CONSTRAINT "ContractAnalysis_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
