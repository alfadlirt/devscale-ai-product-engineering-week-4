import { useChat, type UIMessage } from "@anvia/react";
import { useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import { Spinner } from "@/components/kibo-ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MAX_CONTRACT_QUESTIONS,
  type ContractChatItem,
} from "@/utils/contract-types";
import { contractChatEndpoint } from "@/utils/contracts";

type ContractChatProps = {
  contractId: string;
  questionCount: number;
  chats: ContractChatItem[];
  onQuestionAccepted?: () => void;
};

function chatsToUiMessages(chats: ContractChatItem[]): UIMessage[] {
  return chats.map((chat) => ({
    id: chat.id,
    role: chat.role === "USER" ? "user" : "assistant",
    parts: [
      {
        id: `${chat.id}-text`,
        type: "text" as const,
        text: chat.content,
      },
    ],
  }));
}

export function ContractChat({
  contractId,
  questionCount,
  chats,
  onQuestionAccepted,
}: ContractChatProps) {
  const [input, setInput] = useState("");
  const [localQuestionCount, setLocalQuestionCount] = useState(questionCount);

  useEffect(() => {
    setLocalQuestionCount(questionCount);
  }, [questionCount]);

  const initialMessages = useMemo(() => chatsToUiMessages(chats), [chats]);
  const remaining = Math.max(0, MAX_CONTRACT_QUESTIONS - localQuestionCount);
  const exhausted = remaining <= 0;

  const { messages, send, status, error } = useChat({
    endpoint: contractChatEndpoint(contractId),
    format: "jsonl",
    initialMessages,
  });

  const streaming = status === "streaming";

  async function handleSend() {
    const text = input.trim();
    if (!text || exhausted || streaming) {
      return;
    }

    setInput("");
    setLocalQuestionCount((count) => count + 1);

    try {
      await send(text);
      onQuestionAccepted?.();
    } catch {
      setLocalQuestionCount((count) => Math.max(0, count - 1));
    }
  }

  return (
    <div className="flex h-full min-h-[32rem] flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="font-medium text-foreground">
            Ask about this contract
          </h2>
          <p className="text-xs text-muted-foreground">
            Grounded on the summary and original text
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Questions remaining</p>
          <p className="text-lg font-semibold tabular-nums">
            {remaining} / {MAX_CONTRACT_QUESTIONS}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ask about payment terms, termination, penalties, or anything
              unclear in the report.
            </p>
          ) : null}
          {messages.map((message) => (
            <div
              key={message.id}
              className={message.role === "user" ? "text-right" : "text-left"}
            >
              <div
                className={
                  message.role === "user"
                    ? "ml-auto inline-block max-w-[90%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "inline-block max-w-[90%] rounded-2xl bg-muted px-3 py-2 text-sm text-foreground"
                }
              >
                {message.parts.map((part) =>
                  part.type === "text" ? (
                    message.role === "assistant" ? (
                      <div
                        key={part.id}
                        className="prose prose-sm prose-neutral max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:mb-1 prose-headings:mt-2"
                      >
                        <Markdown>{part.text}</Markdown>
                      </div>
                    ) : (
                      <p key={part.id} className="whitespace-pre-wrap">
                        {part.text}
                      </p>
                    )
                  ) : null,
                )}
              </div>
            </div>
          ))}
          {streaming ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" variant="throbber" />
              Thinking…
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <div className="space-y-2 border-t border-border p-4">
        {exhausted ? (
          <p className="text-sm text-muted-foreground">
            Question limit reached for this contract.
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error instanceof Error ? error.message : "Chat failed"}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Input
            disabled={exhausted || streaming}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder={
              exhausted ? "No questions remaining" : "Ask a question…"
            }
            value={input}
          />
          <Button
            disabled={exhausted || streaming || !input.trim()}
            onClick={() => void handleSend()}
            type="button"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
