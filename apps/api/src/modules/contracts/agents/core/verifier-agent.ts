import { createParsedCompletion } from "@anvia/core/completion";
import { getModel } from "../../../../shared/openai-utils.js";
import {
  VerificationSchema,
  type ParsedContract,
  type RiskAssessment,
  type VerificationResult,
  truncateText,
} from "../schemas.js";

const INSTRUCTIONS = `You verify prior contract analysis for accuracy and coverage.
Compare the parser and risk outputs against the original contract text.
- confidence: 0-100 how reliable the analysis seems (penalize hallucinations)
- coverage: 0-100 how much of the material contract content was covered
- warnings: issues found in the analysis
- missingInformation: important topics the analysis likely missed
Do not invent contract clauses that are not in the original text.`;

export async function verifyAnalysis(input: {
  parsed: ParsedContract;
  risk: RiskAssessment;
  extractedText: string;
}): Promise<VerificationResult> {
  const prompt = [
    "## Parsed contract",
    JSON.stringify(input.parsed, null, 2),
    "",
    "## Risk analysis",
    JSON.stringify(input.risk, null, 2),
    "",
    "## Original contract text",
    truncateText(input.extractedText),
  ].join("\n");

  const result = await createParsedCompletion(getModel(), {
    instructions: INSTRUCTIONS,
    input: prompt,
    schema: VerificationSchema,
    temperature: 0.1,
  });

  return result.data;
}
