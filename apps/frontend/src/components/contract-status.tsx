import type { ComponentProps } from "react";
import {
  Status,
  StatusIndicator,
  StatusLabel,
} from "@/components/kibo-ui/status";
import { Spinner } from "@/components/kibo-ui/spinner";
import type { ContractListItem } from "@/utils/contracts";

type KiboStatus = ComponentProps<typeof Status>["status"];

const STATUS_MAP: Record<
  ContractListItem["status"],
  { kibo: KiboStatus; label: string }
> = {
  READY: { kibo: "online", label: "Ready" },
  FAILED: { kibo: "offline", label: "Failed" },
  PROCESSING: { kibo: "maintenance", label: "Processing" },
  PENDING: { kibo: "degraded", label: "Pending" },
};

export function ContractStatusBadge({
  status,
}: {
  status: ContractListItem["status"];
}) {
  const mapped = STATUS_MAP[status];

  return (
    <span className="inline-flex items-center gap-2">
      {(status === "PROCESSING" || status === "PENDING") && (
        <Spinner className="size-4" variant="throbber" />
      )}
      <Status status={mapped.kibo}>
        <StatusIndicator />
        <StatusLabel>{mapped.label}</StatusLabel>
      </Status>
    </span>
  );
}
