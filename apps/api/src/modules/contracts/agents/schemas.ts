import z from "zod";

export const SeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const FindingSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: SeveritySchema,
  evidence: z.string().nullable(),
});

export type Finding = z.infer<typeof FindingSchema>;

export const ParsedContractSchema = z.object({
  contractType: z.string(),
  title: z.string(),
  parties: z.array(z.string()),
  purpose: z.string(),
  effectiveDate: z.string().nullable(),
  expirationDate: z.string().nullable(),
  keyObligations: z.array(z.string()),
});

export type ParsedContract = z.infer<typeof ParsedContractSchema>;

export const RiskAssessmentSchema = z.object({
  paymentTerms: z.array(FindingSchema),
  terminationClauses: z.array(FindingSchema),
  penalties: z.array(FindingSchema),
  riskyClauses: z.array(FindingSchema),
  unusualConditions: z.array(FindingSchema),
  recommendations: z.array(FindingSchema),
});

export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

export const VerificationSchema = z.object({
  confidence: z.number().min(0).max(100),
  coverage: z.number().min(0).max(100),
  warnings: z.array(z.string()),
  missingInformation: z.array(z.string()),
});

export type VerificationResult = z.infer<typeof VerificationSchema>;

/** Soft cap so prompts stay within context for long PDFs. */
export function truncateText(text: string, maxChars = 80_000): string {
  if (text.length <= maxChars) {
    return text;
  }

  return `${text.slice(0, maxChars)}\n\n[...truncated ${text.length - maxChars} characters...]`;
}
