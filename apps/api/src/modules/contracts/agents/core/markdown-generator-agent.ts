import { createCompletion } from "@anvia/core/completion";
import { getModel } from "../../../../shared/openai-utils.js";
import type {
  ParsedContract,
  RiskAssessment,
  VerificationResult,
} from "../schemas.js";

const INSTRUCTIONS = `You write a clear Markdown contract summary for non-lawyers.
Use this structure exactly:

# Contract Summary

## Overview

## Parties

## Key Obligations

## Payment Terms

## Risks

## Termination & Penalties

## Recommendations

## Confidence & Coverage

Keep language plain. Bullet lists are fine. Do not invent facts not present in the structured inputs.
Cite severity for risks (LOW/MEDIUM/HIGH). When evidence is present (not "NONE"), include the citation string as-is (Page · Section · Lines · quote). Skip evidence that is "NONE".`;

export async function generateMarkdownSummary(input: {
  parsed: ParsedContract;
  risk: RiskAssessment;
  verification: VerificationResult;
}): Promise<string> {
  const prompt = [
    "## Parsed contract",
    JSON.stringify(input.parsed, null, 2),
    "",
    "## Risk analysis",
    JSON.stringify(input.risk, null, 2),
    "",
    "## Verification",
    JSON.stringify(input.verification, null, 2),
  ].join("\n");

  const result = await createCompletion(getModel(), {
    instructions: INSTRUCTIONS,
    input: prompt,
    temperature: 0.3,
  });

  return result.text.trim();
}
