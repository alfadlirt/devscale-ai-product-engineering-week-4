import { Badge } from "@/components/ui/badge";
import type { ContractAnalysisItem } from "@/utils/contract-types";

type ContractRiskListProps = {
  analyses: ContractAnalysisItem[];
};

function severityVariant(
  severity: ContractAnalysisItem["severity"],
): "destructive" | "secondary" | "outline" {
  if (severity === "HIGH") {
    return "destructive";
  }
  if (severity === "MEDIUM") {
    return "secondary";
  }
  return "outline";
}

function displayEvidence(evidence: string | null | undefined): string | null {
  const trimmed = evidence?.trim();
  if (!trimmed || trimmed.toUpperCase() === "NONE") {
    return null;
  }
  return trimmed;
}

/** Split "Page 3 · Section 8.2 · Lines 12-18 · \"quote\"" into location + quote when possible. */
function splitEvidence(evidence: string): {
  location: string | null;
  quote: string;
} {
  const quoteMatch = evidence.match(/[“"]([^”"]+)[”"]\s*$/);
  if (quoteMatch && quoteMatch.index != null && quoteMatch.index > 0) {
    const location = evidence
      .slice(0, quoteMatch.index)
      .replace(/[·•]\s*$/, "")
      .trim();
    return {
      location: location || null,
      quote: quoteMatch[1] ?? evidence,
    };
  }

  const parts = evidence.split("·").map((part) => part.trim());
  if (parts.length >= 2) {
    const last = parts[parts.length - 1] ?? evidence;
    const location = parts.slice(0, -1).join(" · ");
    return { location, quote: last.replace(/^["“]|["”]$/g, "") };
  }

  return { location: null, quote: evidence };
}

export function ContractRiskList({ analyses }: ContractRiskListProps) {
  const severityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
  const risks = analyses
    .filter((item) => item.category !== "OBLIGATION")
    .slice()
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  const obligations = analyses.filter((item) => item.category === "OBLIGATION");

  if (analyses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No findings recorded.</p>
    );
  }

  return (
    <div className="space-y-6">
      {risks.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Risk summary
          </h2>
          <ul className="space-y-3">
            {risks.map((item) => {
              const evidence = displayEvidence(item.evidence);
              const split = evidence ? splitEvidence(evidence) : null;

              return (
                <li
                  key={item.id}
                  className="space-y-2 rounded-lg border border-border px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={severityVariant(item.severity)}>
                      {item.severity}
                    </Badge>
                    <Badge variant="outline">{item.category}</Badge>
                    <p className="font-medium text-foreground">{item.title}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                  {split ? (
                    <blockquote className="space-y-1 border-l-2 border-border pl-3 text-sm text-foreground/90">
                      {split.location ? (
                        <p className="font-medium not-italic text-foreground">
                          {split.location}
                        </p>
                      ) : null}
                      <p className="italic">“{split.quote}”</p>
                    </blockquote>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {obligations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Key obligations
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {obligations.map((item) => (
              <li key={item.id}>{item.description}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
