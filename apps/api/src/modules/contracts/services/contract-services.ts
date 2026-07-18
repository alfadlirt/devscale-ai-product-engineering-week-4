import { contractsQueue } from "../../../config/queue.js";
import type { AnalysisCategory } from "../../../generated/prisma/client.js";
import { extractPdfText } from "../../../shared/pdf-utils.js";
import {
  assessRisk,
  generateMarkdownSummary,
  parseContract,
  verifyAnalysis,
  type Finding,
  type RiskAssessment,
} from "../agents/index.js";
import {
  createPendingContract,
  getContractById as getContractByIdFromRepo,
  getContractRecord,
  listContracts as listContractsFromRepo,
  markContractProcessing,
  persistPipelineResult,
  setContractFileUrl,
  setExtractedText,
  setParsedFields,
  type AnalysisInsert,
} from "../data/contract.repository.js";
import { saveContractPdf } from "../data/storage.js";

export async function listContracts(limit = 20) {
  return listContractsFromRepo(limit);
}

export async function getContract(id: string) {
  return getContractByIdFromRepo(id);
}

export async function uploadContract(file: File) {
  const originalFileName = file.name || "contract.pdf";
  const isPdf =
    originalFileName.toLowerCase().endsWith(".pdf") ||
    file.type === "application/pdf";

  if (!isPdf) {
    throw new Error("Only PDF files are accepted");
  }

  const contract = await createPendingContract(originalFileName);
  const filePath = await saveContractPdf(contract.id, file);
  const updated = await setContractFileUrl(contract.id, filePath);

  await contractsQueue.add("process-contract", {
    contractId: contract.id,
  });

  return updated;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeEvidence(evidence: string | null | undefined): string | null {
  const trimmed = evidence?.trim();
  if (!trimmed || trimmed.toUpperCase() === "NONE") {
    return null;
  }
  return trimmed;
}

function findingToRow(
  finding: Finding,
  category: AnalysisCategory,
): AnalysisInsert {
  return {
    category,
    title: finding.title,
    description: finding.description,
    severity: finding.severity,
    evidence: normalizeEvidence(finding.evidence),
  };
}

function mapRiskToAnalyses(risk: RiskAssessment): AnalysisInsert[] {
  const rows: AnalysisInsert[] = [];

  for (const finding of risk.paymentTerms) {
    rows.push(findingToRow(finding, "PAYMENT"));
  }
  for (const finding of risk.terminationClauses) {
    rows.push(findingToRow(finding, "TERMINATION"));
  }
  for (const finding of risk.penalties) {
    rows.push(findingToRow(finding, "PENALTY"));
  }
  for (const finding of risk.riskyClauses) {
    rows.push(findingToRow(finding, "RISK"));
  }
  for (const finding of risk.unusualConditions) {
    rows.push(findingToRow(finding, "UNUSUAL"));
  }
  for (const finding of risk.recommendations) {
    rows.push(findingToRow(finding, "OTHER"));
  }

  return rows;
}

function mapObligationsToAnalyses(obligations: string[]): AnalysisInsert[] {
  return obligations
    .map((obligation) => obligation.trim())
    .filter(Boolean)
    .map((obligation) => ({
      category: "OBLIGATION" as const,
      title:
        obligation.length > 80 ? `${obligation.slice(0, 77)}...` : obligation,
      description: obligation,
      severity: "LOW" as const,
      evidence: null,
    }));
}

export async function processContract(contractId: string): Promise<void> {
  const contract = await getContractRecord(contractId);

  if (!contract) {
    throw new Error(`Contract not found: ${contractId}`);
  }

  if (!contract.fileUrl) {
    throw new Error(`Contract ${contractId} has no fileUrl`);
  }

  await markContractProcessing(contractId);

  console.log(`[pipeline] extracting text for ${contractId}`);
  const extractedText = await extractPdfText(contract.fileUrl);

  if (!extractedText) {
    throw new Error("PDF text extraction returned empty content");
  }

  await setExtractedText(contractId, extractedText);

  console.log(`[pipeline] parsing contract ${contractId}`);
  const parsed = await parseContract(extractedText);

  const purposeParts = [parsed.purpose];
  if (parsed.parties.length > 0) {
    purposeParts.push(`Parties: ${parsed.parties.join(", ")}`);
  }
  if (parsed.effectiveDate) {
    purposeParts.push(`Effective: ${parsed.effectiveDate}`);
  }
  if (parsed.expirationDate) {
    purposeParts.push(`Expires: ${parsed.expirationDate}`);
  }

  await setParsedFields(contractId, {
    contractType: parsed.contractType,
    title: parsed.title,
    purpose: purposeParts.filter(Boolean).join("\n"),
  });

  console.log(`[pipeline] assessing risk for ${contractId}`);
  const risk = await assessRisk({ parsed, extractedText });

  console.log(`[pipeline] verifying analysis for ${contractId}`);
  const verification = await verifyAnalysis({
    parsed,
    risk,
    extractedText,
  });

  console.log(`[pipeline] generating markdown for ${contractId}`);
  const markdownSummary = await generateMarkdownSummary({
    parsed,
    risk,
    verification,
  });

  const analyses = [
    ...mapObligationsToAnalyses(parsed.keyObligations),
    ...mapRiskToAnalyses(risk),
  ];

  const confidenceScore = clampScore(verification.confidence);
  const coverageScore = clampScore(verification.coverage);

  await persistPipelineResult({
    contractId,
    markdownSummary,
    confidenceScore,
    coverageScore,
    analyses,
  });

  console.log(
    `[pipeline] contract ${contractId} READY (analyses=${analyses.length}, confidence=${confidenceScore}, coverage=${coverageScore})`,
  );
}
