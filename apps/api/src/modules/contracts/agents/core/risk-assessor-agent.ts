import { createParsedCompletion } from "@anvia/core/completion";
import { getModel } from "../../../../shared/openai-utils.js";
import {
  RiskAssessmentSchema,
  type ParsedContract,
  type RiskAssessment,
  truncateText,
} from "../schemas.js";

const INSTRUCTIONS = `You are a legal risk analyst for contracts.
The contract text includes markers like "--- Page N ---". Use those for page citations.
Identify payment terms, termination clauses, penalties, risky clauses, unusual conditions, and practical recommendations.
For every finding include:
- title (short)
- description (plain language)
- severity: LOW | MEDIUM | HIGH
- evidence: citation string in this format when a quote exists:
  Page <n> · Section <id or heading if known> · Lines <approx range if known> · "<verbatim quote>"
  Example: Page 3 · Section 8.2 · Lines 12-18 · "This agreement shall automatically renew..."
If page/section/lines are unknown, omit that segment but keep whatever you know, always including the quote.
If there is no useful quote to show as evidence, set evidence to exactly "NONE" (not null, not empty).
Be conservative: only flag what the text supports. Prefer fewer high-quality findings over speculation.
Do not invent page numbers that are not supported by "--- Page N ---" markers.`;

export async function assessRisk(input: {
  parsed: ParsedContract;
  extractedText: string;
}): Promise<RiskAssessment> {
  const prompt = [
    "## Parsed contract summary",
    JSON.stringify(input.parsed, null, 2),
    "",
    "## Original contract text",
    truncateText(input.extractedText),
  ].join("\n");

  const result = await createParsedCompletion(getModel(), {
    instructions: INSTRUCTIONS,
    input: prompt,
    schema: RiskAssessmentSchema,
    temperature: 0.2,
  });

  return result.data;
}
