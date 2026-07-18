import type {
  AnalysisCategory,
  RiskSeverity,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../../shared/prisma.js";

export type AnalysisInsert = {
  category: AnalysisCategory;
  title: string;
  description: string;
  severity: RiskSeverity;
  evidence: string | null;
};

export async function listContracts(limit = 20) {
  return prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      originalFileName: true,
      title: true,
      contractType: true,
      status: true,
      confidenceScore: true,
      coverageScore: true,
      questionCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getContractById(id: string) {
  return prisma.contract.findUnique({
    where: { id },
    include: {
      analyses: {
        orderBy: { createdAt: "asc" },
      },
      chats: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getContractRecord(id: string) {
  return prisma.contract.findUnique({
    where: { id },
  });
}

export async function getContractWithChats(id: string) {
  return prisma.contract.findUnique({
    where: { id },
    include: {
      chats: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createPendingContract(originalFileName: string) {
  return prisma.contract.create({
    data: {
      originalFileName,
      fileUrl: "",
      extractedText: "",
      markdownSummary: "",
    },
  });
}

export async function setContractFileUrl(id: string, fileUrl: string) {
  return prisma.contract.update({
    where: { id },
    data: { fileUrl },
  });
}

export async function markContractProcessing(id: string) {
  return prisma.contract.update({
    where: { id },
    data: { status: "PROCESSING" },
  });
}

export async function markContractFailed(id: string) {
  return prisma.contract.update({
    where: { id },
    data: { status: "FAILED" },
  });
}

export async function setExtractedText(id: string, extractedText: string) {
  return prisma.contract.update({
    where: { id },
    data: { extractedText },
  });
}

export async function setParsedFields(
  id: string,
  data: {
    contractType: string;
    title: string;
    purpose: string;
  },
) {
  return prisma.contract.update({
    where: { id },
    data,
  });
}

export async function acceptUserQuestion(contractId: string, content: string) {
  return prisma.$transaction(async (tx) => {
    await tx.chatMessage.create({
      data: {
        contractId,
        role: "USER",
        content,
      },
    });

    return tx.contract.update({
      where: { id: contractId },
      data: {
        questionCount: { increment: 1 },
      },
    });
  });
}

export async function saveAssistantMessage(
  contractId: string,
  content: string,
) {
  const trimmed = content.trim();
  if (!trimmed) {
    return null;
  }

  return prisma.chatMessage.create({
    data: {
      contractId,
      role: "ASSISTANT",
      content: trimmed,
    },
  });
}

export async function persistPipelineResult(input: {
  contractId: string;
  markdownSummary: string;
  confidenceScore: number;
  coverageScore: number;
  analyses: AnalysisInsert[];
}) {
  const {
    contractId,
    markdownSummary,
    confidenceScore,
    coverageScore,
    analyses,
  } = input;

  await prisma.$transaction(async (tx) => {
    await tx.contractAnalysis.deleteMany({
      where: { contractId },
    });

    if (analyses.length > 0) {
      await tx.contractAnalysis.createMany({
        data: analyses.map((row) => ({
          contractId,
          ...row,
        })),
      });
    }

    await tx.contract.update({
      where: { id: contractId },
      data: {
        markdownSummary,
        confidenceScore,
        coverageScore,
        status: "READY",
      },
    });
  });
}
