import { api } from "@/utils/api";
import type { ContractDetail } from "@/utils/contract-types";

export type { ContractDetail } from "@/utils/contract-types";
export { MAX_CONTRACT_QUESTIONS } from "@/utils/contract-types";

const API_BASE = "http://localhost:8000";

export type ContractListItem = {
  id: string;
  originalFileName: string;
  title: string | null;
  contractType: string | null;
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  confidenceScore: number | null;
  coverageScore: number | null;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
};

export async function listContracts(limit = 20): Promise<ContractListItem[]> {
  const res = await api.contracts.$get({
    query: { limit: String(limit) },
  });

  if (!res.ok) {
    throw new Error("Failed to load contracts");
  }

  const data = await res.json();
  return data.contracts as ContractListItem[];
}

export async function getContract(id: string): Promise<ContractDetail | null> {
  const res = await api.contracts[":id"].$get({
    param: { id },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Failed to load contract");
  }

  const data = await res.json();
  return data.contract as ContractDetail;
}

export async function uploadContract(file: File): Promise<{
  id: string;
  status: string;
  originalFileName: string;
}> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/contracts`, {
    method: "POST",
    body: form,
  });

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    originalFileName?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error || "Upload failed");
  }

  if (!data.id) {
    throw new Error("Upload succeeded but no contract id returned");
  }

  return {
    id: data.id,
    status: data.status || "PENDING",
    originalFileName: data.originalFileName || file.name,
  };
}

export function contractChatEndpoint(id: string) {
  return `${API_BASE}/contracts/${id}/chat`;
}
