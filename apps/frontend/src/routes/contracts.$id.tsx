import { Link, createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ContractChat } from "@/components/contract-chat";
import { ContractMarkdown } from "@/components/contract-markdown";
import { ContractOverview } from "@/components/contract-overview";
import { ContractRiskList } from "@/components/contract-risk-list";
import { ContractStatusBadge } from "@/components/contract-status";
import { Spinner } from "@/components/kibo-ui/spinner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getContract, type ContractDetail } from "@/utils/contracts";

export const Route = createFileRoute("/contracts/$id")({
  component: ContractDashboardPage,
});

function ContractDashboardPage() {
  const { id } = Route.useParams();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getContract(id);
      if (!data) {
        setError("Contract not found");
        setContract(null);
        return;
      }
      setContract(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contract");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!contract) {
      return;
    }

    if (contract.status === "READY" || contract.status === "FAILED") {
      return;
    }

    const timer = window.setInterval(() => {
      void refresh();
    }, 2500);

    return () => window.clearInterval(timer);
  }, [contract, refresh]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
        <Spinner variant="throbber" />
        Loading contract…
      </main>
    );
  }

  if (error || !contract) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-start justify-center gap-4 px-6">
        <p className="text-destructive">{error || "Contract not found"}</p>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </main>
    );
  }

  if (contract.status === "FAILED") {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-start justify-center gap-4 px-6">
        <ContractStatusBadge status="FAILED" />
        <h1 className="text-2xl font-semibold tracking-tight">
          Analysis failed
        </h1>
        <p className="text-muted-foreground">
          Something went wrong while processing{" "}
          <span className="font-medium text-foreground">
            {contract.originalFileName}
          </span>
          . Try uploading again from the home page.
        </p>
        <Button asChild>
          <Link to="/">Upload another contract</Link>
        </Button>
      </main>
    );
  }

  if (contract.status === "PENDING" || contract.status === "PROCESSING") {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <Spinner variant="throbber" />
        <ContractStatusBadge status={contract.status} />
        <h1 className="text-2xl font-semibold tracking-tight">
          Analyzing contract
        </h1>
        <p className="text-muted-foreground">
          Extracting text and running the Contract Analyzer agent pipeline. This
          page updates automatically.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </main>
    );
  }

  const title = contract.title || contract.originalFileName;

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-4 px-6 py-6">
          <div className="space-y-2">
            <Button asChild className="h-auto px-0" variant="link">
              <Link to="/">← All contracts</Link>
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <ContractStatusBadge status={contract.status} />
              <span className="text-sm text-muted-foreground">
                {contract.originalFileName}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <div className="space-y-8">
          <ContractOverview contract={contract} />
          <Separator />
          <ContractRiskList analyses={contract.analyses} />
          <Separator />
          <ContractMarkdown markdown={contract.markdownSummary} />
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <ContractChat
            chats={contract.chats}
            contractId={contract.id}
            onQuestionAccepted={() => {
              setContract((current) =>
                current
                  ? {
                      ...current,
                      questionCount: current.questionCount + 1,
                    }
                  : current,
              );
            }}
            questionCount={contract.questionCount}
          />
        </aside>
      </div>
    </main>
  );
}
