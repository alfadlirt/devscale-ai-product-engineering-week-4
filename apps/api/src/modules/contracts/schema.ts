import z from "zod";

export const ContractIdParamSchema = z.object({
  id: z.string().min(1),
});

export const ListContractsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const MAX_CONTRACT_QUESTIONS = 10;

export const ChatRequestBodySchema = z.object({
  messages: z.array(z.unknown()).optional(),
  stream: z.boolean().optional(),
  metadata: z.unknown().optional(),
});
