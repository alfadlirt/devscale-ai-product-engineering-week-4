import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ContractList } from "@/components/contract-list";
import { ContractUpload } from "@/components/contract-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { listContracts, type ContractListItem } from "@/utils/contracts";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const items = await listContracts();
      setContracts(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const hasActive = contracts.some(
      (contract) =>
        contract.status === "PENDING" || contract.status === "PROCESSING",
    );

    if (!hasActive) {
      return;
    }

    const timer = window.setInterval(() => {
      void refresh();
    }, 2500);

    return () => window.clearInterval(timer);
  }, [contracts, refresh]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-muted-foreground">
          Contract Analyzer
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Understand contracts before you sign
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Upload a PDF and get an overview, risk analysis, and an
          evidence-backed summary in under a minute.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Upload contract</CardTitle>
          <CardDescription>
            PDF only · analysis runs in the background
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContractUpload
            onUploaded={(id) => {
              void refresh();
              void navigate({ to: "/contracts/$id", params: { id } });
            }}
          />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Recent contracts
            </h2>
            <p className="text-sm text-muted-foreground">
              Status updates automatically while processing.
            </p>
          </div>
        </div>
        <Separator />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : (
          <ContractList contracts={contracts} loading={loading} />
        )}
      </section>
    </main>
  );
}
