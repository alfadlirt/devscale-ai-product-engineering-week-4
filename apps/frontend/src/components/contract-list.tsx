import { Link } from "@tanstack/react-router";
import { ContractStatusBadge } from "@/components/contract-status";
import { Spinner } from "@/components/kibo-ui/spinner";
import { Badge } from "@/components/ui/badge";
import type { ContractListItem } from "@/utils/contracts";

type ContractListProps = {
  contracts: ContractListItem[];
  loading?: boolean;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function ContractList({ contracts, loading }: ContractListProps) {
  if (loading && contracts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" variant="throbber" />
        Loading contracts…
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No contracts yet. Upload a PDF to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {contracts.map((contract) => {
        const title = contract.title || contract.originalFileName;

        return (
          <li key={contract.id}>
            <Link
              className="flex items-start justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
              params={{ id: contract.id }}
              to="/contracts/$id"
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium text-foreground">{title}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(contract.createdAt)}</span>
                  {contract.contractType ? (
                    <Badge variant="outline">{contract.contractType}</Badge>
                  ) : null}
                  {contract.status === "READY" &&
                  contract.confidenceScore != null ? (
                    <span>Confidence {contract.confidenceScore}%</span>
                  ) : null}
                </div>
              </div>
              <ContractStatusBadge status={contract.status} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
