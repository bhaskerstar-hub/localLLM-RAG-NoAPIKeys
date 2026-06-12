import Link from "next/link";
import { ArrowRight, Coins, Quote, ToggleRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SOURCE_TYPE_STYLES } from "@/components/documents/document-table";
import { cn } from "@/lib/utils";
import type { DocumentOut } from "@/lib/types";

const HOW_IT_WORKS = [
  {
    icon: Quote,
    iconClassName: "bg-indigo-500/10 text-indigo-400",
    text: "Every claim in an answer is backed by a numbered [n] citation pointing back to the exact source chunk.",
  },
  {
    icon: Coins,
    iconClassName: "bg-amber-500/10 text-amber-400",
    text: "Token usage and an estimated cost are shown under each answer — local models always run for $0.00.",
  },
  {
    icon: ToggleRight,
    iconClassName: "bg-teal-500/10 text-teal-400",
    text: "Flip a document's search toggle off on the Documents page to exclude it from retrieval.",
  },
];

export function ChatSidebar({
  documents,
  isLoading,
}: {
  documents: DocumentOut[];
  isLoading: boolean;
}) {
  const activeDocuments = documents.filter((doc) => doc.is_active);

  return (
    <aside className="hidden min-h-0 flex-col gap-4 overflow-y-auto lg:flex">
      <div className="rounded-2xl border border-white/10 bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="stat-label">Knowledge base</p>
          <Badge
            variant="outline"
            className="border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
          >
            {activeDocuments.length} / {documents.length} searchable
          </Badge>
        </div>

        {isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading sources...</p>
        ) : documents.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No documents ingested yet — head to Documents to add a PDF, spreadsheet, CSV, or
            webpage.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {documents.slice(0, 6).map((doc) => (
              <li
                key={doc.id}
                className={cn(
                  "flex items-center gap-2 text-xs",
                  !doc.is_active && "opacity-40"
                )}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "border-transparent uppercase",
                    SOURCE_TYPE_STYLES[doc.source_type] ?? "bg-secondary text-secondary-foreground"
                  )}
                >
                  {doc.source_type}
                </Badge>
                <span className="truncate text-muted-foreground" title={doc.source}>
                  {doc.source}
                </span>
              </li>
            ))}
            {documents.length > 6 && (
              <li className="text-xs text-muted-foreground">
                +{documents.length - 6} more
              </li>
            )}
          </ul>
        )}

        <Link
          href="/documents"
          className="mt-4 flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          Manage sources
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card p-4">
        <p className="stat-label">How answers work</p>
        <ul className="mt-3 flex flex-col gap-3">
          {HOW_IT_WORKS.map(({ icon: Icon, iconClassName, text }, index) => (
            <li key={index} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg [clip-path:polygon(15%_0,100%_0,85%_100%,0_100%)]",
                  iconClassName
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <p className="text-xs text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
