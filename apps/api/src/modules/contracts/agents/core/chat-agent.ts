import type { CreateCompletionStreamOptions } from "@anvia/core/completion";
import { UserContent, type Message } from "@anvia/core/completion";
import { truncateText } from "../schemas.js";

export type ChatHistoryMessage = {
  role: "USER" | "ASSISTANT" | "user" | "assistant";
  content: string;
};

export type BuildContractChatOptions = {
  markdownSummary: string;
  extractedText: string;
  history?: ChatHistoryMessage[];
  question?: string;
};

const CHAT_INSTRUCTIONS = `You are Contract Analyzer, a helpful contract assistant.
Answer only using the provided contract summary and original contract text.
If the answer is not supported by those sources, say you cannot find it in the contract.
Be concise and practical. Prefer quoting short evidence when relevant.
When citing the contract, include page markers from the text (e.g. Page 3) when available.
Format answers in Markdown (short headings, bullets, bold for key terms) so they render cleanly in chat.
Do not give formal legal advice disclaimers beyond a brief note when discussing legal risk.`;

function toAssistantMessage(content: string): Message {
  return {
    role: "assistant",
    content: [{ type: "text", text: content }],
  };
}

function toUserMessage(content: string): Message {
  return {
    role: "user",
    content: [UserContent.text(content)],
  };
}

function isAssistantRole(role: ChatHistoryMessage["role"]): boolean {
  return role.toUpperCase() === "ASSISTANT";
}

function historyToMessages(history: ChatHistoryMessage[]): Message[] {
  return history
    .filter((message) => message.content.trim().length > 0)
    .map((message) =>
      isAssistantRole(message.role)
        ? toAssistantMessage(message.content)
        : toUserMessage(message.content),
    );
}

export function buildContractChatRequest(
  options: BuildContractChatOptions,
): CreateCompletionStreamOptions {
  const context = [
    "## Contract summary (markdown)",
    options.markdownSummary || "(empty)",
    "",
    "## Original contract text",
    truncateText(options.extractedText || "(empty)"),
  ].join("\n");

  const messages = historyToMessages(options.history ?? []);

  if (options.question?.trim()) {
    messages.push(toUserMessage(options.question.trim()));
  }

  return {
    instructions: `${CHAT_INSTRUCTIONS}\n\n${context}`,
    messages,
    temperature: 0.2,
  };
}
