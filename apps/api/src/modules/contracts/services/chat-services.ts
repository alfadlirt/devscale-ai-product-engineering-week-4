import {
  buildContractChatRequest,
  type ChatHistoryMessage,
} from "../agents/core/chat-agent.js";
import {
  acceptUserQuestion,
  getContractWithChats,
  saveAssistantMessage,
} from "../data/contract.repository.js";
import { MAX_CONTRACT_QUESTIONS } from "../schema.js";

export class ContractChatError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 403 | 404 = 400,
  ) {
    super(message);
    this.name = "ContractChatError";
  }
}

function partText(part: unknown): string {
  if (
    part &&
    typeof part === "object" &&
    "text" in part &&
    typeof (part as { text: unknown }).text === "string"
  ) {
    return (part as { text: string }).text;
  }
  return "";
}

export function getMessageText(message: unknown): string {
  if (!message || typeof message !== "object") {
    return "";
  }

  const role =
    "role" in message ? String((message as { role: unknown }).role) : "";
  const content = (message as { content?: unknown }).content;

  if (role === "system" && typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map(partText).filter(Boolean).join("");
  }

  if (typeof content === "string") {
    return content;
  }

  const parts = (message as { parts?: unknown }).parts;
  if (Array.isArray(parts)) {
    return parts.map(partText).filter(Boolean).join("");
  }

  return "";
}

export function extractLatestUserQuestion(messages: unknown[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (
      message &&
      typeof message === "object" &&
      "role" in message &&
      String((message as { role: unknown }).role).toLowerCase() === "user"
    ) {
      const text = getMessageText(message).trim();
      if (text) {
        return text;
      }
    }
  }

  return "";
}

export async function prepareContractChat(
  contractId: string,
  question: string,
) {
  const trimmed = question.trim();
  if (!trimmed) {
    throw new ContractChatError("A user question is required", 400);
  }

  const contract = await getContractWithChats(contractId);

  if (!contract) {
    throw new ContractChatError("Contract not found", 404);
  }

  if (contract.status !== "READY") {
    throw new ContractChatError(
      `Contract is not ready for chat (status: ${contract.status})`,
      400,
    );
  }

  if (contract.questionCount >= MAX_CONTRACT_QUESTIONS) {
    throw new ContractChatError(
      `Question limit reached (${MAX_CONTRACT_QUESTIONS}/${MAX_CONTRACT_QUESTIONS})`,
      403,
    );
  }

  const history: ChatHistoryMessage[] = contract.chats.map((chat) => ({
    role: chat.role,
    content: chat.content,
  }));

  const updated = await acceptUserQuestion(contractId, trimmed);

  const streamOptions = buildContractChatRequest({
    markdownSummary: contract.markdownSummary,
    extractedText: contract.extractedText,
    history,
    question: trimmed,
  });

  return {
    contract: updated,
    streamOptions,
    question: trimmed,
    remainingQuestions: MAX_CONTRACT_QUESTIONS - updated.questionCount,
  };
}

export async function* streamContractChat(
  events: AsyncIterable<{ type: string; delta?: string }>,
  contractId: string,
) {
  let assistantText = "";

  try {
    for await (const event of events) {
      if (event.type === "text_delta" && typeof event.delta === "string") {
        assistantText += event.delta;
      }
      yield event;
    }
  } finally {
    try {
      await saveAssistantMessage(contractId, assistantText);
    } catch (error) {
      console.error(
        `[chat] failed to save assistant message for ${contractId}`,
        error,
      );
    }
  }
}
