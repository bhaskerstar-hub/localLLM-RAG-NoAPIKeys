import { Badge } from "@/components/ui/badge";
import type { SourceChunk } from "@/lib/types";

export function CitationList({ sources }: { sources: SourceChunk[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">Sources</p>
      <div className="flex flex-col gap-2">
        {sources.map((source) => (
          <div
            key={source.index}
            className="rounded-md border border-primary/15 bg-primary/5 p-2 text-xs"
          >
            <div className="mb-1 flex flex-wrap items-center gap-2 font-medium">
              <Badge className="bg-primary/15 text-primary">[{source.index}]</Badge>
              <span className="truncate">{source.source}</span>
              {source.page !== null && (
                <span className="text-muted-foreground">page {source.page + 1}</span>
              )}
              {source.sheet && (
                <span className="text-muted-foreground">sheet: {source.sheet}</span>
              )}
            </div>
            <p className="line-clamp-3 whitespace-pre-wrap text-muted-foreground">
              {source.snippet}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
