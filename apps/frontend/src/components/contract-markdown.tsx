import Markdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";

type ContractMarkdownProps = {
  markdown: string;
};

export function ContractMarkdown({ markdown }: ContractMarkdownProps) {
  if (!markdown.trim()) {
    return (
      <p className="text-sm text-muted-foreground">No markdown summary yet.</p>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">
        Markdown report
      </h2>
      <ScrollArea className="h-[28rem] rounded-lg border border-border">
        <article className="prose prose-neutral max-w-none p-4 prose-headings:scroll-mt-4 prose-p:leading-relaxed">
          <Markdown>{markdown}</Markdown>
        </article>
      </ScrollArea>
    </section>
  );
}
