import { Badge } from "@/components/ui/badge";
import type { ContractDetail } from "@/utils/contract-types";

type ContractOverviewProps = {
  contract: ContractDetail;
};

export function ContractOverview({ contract }: ContractOverviewProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">Overview</h2>
        <div className="mt-2 space-y-2">
          {contract.contractType ? (
            <Badge variant="outline">{contract.contractType}</Badge>
          ) : null}
          {contract.purpose ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {contract.purpose}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No overview yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="text-xs text-muted-foreground">Confidence</p>
          <p className="text-xl font-semibold tabular-nums">
            {contract.confidenceScore ?? "—"}
            {contract.confidenceScore != null ? "%" : ""}
          </p>
        </div>
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="text-xs text-muted-foreground">Coverage</p>
          <p className="text-xl font-semibold tabular-nums">
            {contract.coverageScore ?? "—"}
            {contract.coverageScore != null ? "%" : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
