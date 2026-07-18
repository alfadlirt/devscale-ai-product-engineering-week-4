import { zValidator } from "@hono/zod-validator";
import { createCompletionStream } from "@anvia/core/completion";
import { createEventStream } from "@anvia/server";
import { Hono } from "hono";
import { getModel } from "../../shared/openai-utils.js";
import {
  ChatRequestBodySchema,
  ContractIdParamSchema,
  ListContractsQuerySchema,
} from "./schema.js";
import {
  ContractChatError,
  extractLatestUserQuestion,
  prepareContractChat,
  streamContractChat,
} from "./services/chat-services.js";
import {
  getContract,
  listContracts,
  uploadContract,
} from "./services/contract-services.js";

export const contractsRouter = new Hono()
  .get("/", zValidator("query", ListContractsQuerySchema), async (c) => {
    const { limit } = c.req.valid("query");
    const contracts = await listContracts(limit);
    return c.json({ contracts });
  })
  .get("/:id", zValidator("param", ContractIdParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const contract = await getContract(id);

    if (!contract) {
      return c.json({ error: "Contract not found" }, 404);
    }

    return c.json({ contract });
  })
  .post("/:id/chat", zValidator("param", ContractIdParamSchema), async (c) => {
    const { id } = c.req.valid("param");

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const parsedBody = ChatRequestBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return c.json({ error: "Invalid chat request body" }, 400);
    }

    const question = extractLatestUserQuestion(parsedBody.data.messages ?? []);

    try {
      const prepared = await prepareContractChat(id, question);
      const model = getModel();
      const completionStream = createCompletionStream(
        model,
        prepared.streamOptions,
      );
      const events = streamContractChat(completionStream, id);

      return createEventStream(events, {
        format: "jsonl",
        headers: {
          "X-Questions-Remaining": String(prepared.remainingQuestions),
          "X-Question-Count": String(prepared.contract.questionCount),
        },
      });
    } catch (error) {
      if (error instanceof ContractChatError) {
        return c.json({ error: error.message }, error.status);
      }

      console.error(`[chat] unexpected error for contract ${id}`, error);
      return c.json({ error: "Failed to start chat stream" }, 500);
    }
  })
  .post("/", async (c) => {
    const body = await c.req.parseBody();
    const file = body.file;

    if (!(file instanceof File)) {
      return c.json({ error: "PDF file is required (field name: file)" }, 400);
    }

    try {
      const contract = await uploadContract(file);
      return c.json(
        {
          id: contract.id,
          status: contract.status,
          originalFileName: contract.originalFileName,
        },
        201,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload contract";
      return c.json({ error: message }, 400);
    }
  });
