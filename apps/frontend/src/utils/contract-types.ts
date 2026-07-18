export const MAX_CONTRACT_QUESTIONS = 10;

export type ContractAnalysisItem = {
  id: string;
  contractId: string;
  category: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  evidence: string | null;
  createdAt: string;
};

export type ContractChatItem = {
  id: string;
  contractId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
};

export type ContractDetail = {
  id: string;
  originalFileName: string;
  fileUrl: string;
  extractedText: string;
  markdownSummary: string;
  contractType: string | null;
  title: string | null;
  purpose: string | null;
  confidenceScore: number | null;
  coverageScore: number | null;
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  questionCount: number;
  createdAt: string;
  updatedAt: string;
  analyses: ContractAnalysisItem[];
  chats: ContractChatItem[];
};
