import { createParsedCompletion } from "@anvia/core/completion";
import { getModel } from "../../../../shared/openai-utils.js";
import {
  ParsedContractSchema,
  type ParsedContract,
  truncateText,
} from "../schemas.js";

const INSTRUCTIONS = `You are a contract parser. Extract structured facts from the contract text.
Only use information present in the text. If a date is unknown, use null.
Return concise, accurate fields. Parties should be party names as written.`;

export async function parseContract(
  extractedText: string,
): Promise<ParsedContract> {
  const result = await createParsedCompletion(getModel(), {
    instructions: INSTRUCTIONS,
    input: truncateText(extractedText),
    schema: ParsedContractSchema,
    temperature: 0.1,
  });

  return result.data;
}
