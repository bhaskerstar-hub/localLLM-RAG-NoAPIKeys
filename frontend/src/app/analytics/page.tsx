"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Coins,
  ExternalLink,
  FileStack,
  type LucideIcon,
  MessagesSquare,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHero } from "@/components/layout/page-hero";
import { getAnalyticsSummary } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AnalyticsSummary } from "@/lib/types";

function formatPercent(ratio: number | null): string {
  if (ratio === null) return "—";
  return `${Math.round(ratio * 100)}%`;
}

function formatCostUsd(cost: number | null): string {
  if (cost === null) return "—";
  if (cost === 0) return "$0.00";
  return cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`;
}

interface ScoreCardProps {
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: string | number;
  helper: string;
}

function ScoreCard({ icon: Icon, iconClassName, label, value, helper }: ScoreCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="stat-label">{label}</p>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg [clip-path:polygon(15%_0,100%_0,85%_100%,0_100%)]",
            iconClassName
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="stat-value mt-2">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAnalyticsSummary()
      .then(setSummary)
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Failed to load analytics")
      )
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        icon={BarChart3}
        eyebrow="Scoreboard"
        title="Analytics"
        description="Usage and answer-quality metrics across all sessions."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <ScoreCard
              icon={FileStack}
              iconClassName="bg-indigo-500/10 text-indigo-400"
              label="Documents"
              value={summary.document_count}
              helper={`${summary.chunk_count} chunks indexed`}
            />
            <ScoreCard
              icon={MessagesSquare}
              iconClassName="bg-teal-500/10 text-teal-400"
              label="Chat messages"
              value={summary.chat_count}
              helper="Total questions answered"
            />
            <ScoreCard
              icon={Activity}
              iconClassName="bg-amber-500/10 text-amber-400"
              label="Feedback received"
              value={summary.feedback_count}
              helper={`${summary.positive_feedback_count} thumbs up`}
            />
            <ScoreCard
              icon={ThumbsUp}
              iconClassName="bg-emerald-500/10 text-emerald-400"
              label="Positive feedback"
              value={formatPercent(summary.positive_feedback_ratio)}
              helper="Share of feedback rated thumbs up"
            />
            <ScoreCard
              icon={Coins}
              iconClassName="bg-violet-500/10 text-violet-400"
              label="Estimated cost"
              value={formatCostUsd(summary.estimated_cost_usd)}
              helper={`${summary.total_tokens.toLocaleString()} tokens used`}
            />
          </div>

          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle>Trace-level observability</CardTitle>
              <CardDescription>
                {summary.langfuse_enabled
                  ? "Langfuse is enabled. Explore per-request traces, token usage, latency, and cost in the Langfuse dashboard."
                  : "Langfuse is disabled. Set ENABLE_LANGFUSE=true and configure API keys to unlock trace-level observability."}
              </CardDescription>
            </CardHeader>
            {summary.langfuse_enabled && summary.langfuse_host && (
              <CardContent>
                <a
                  href={summary.langfuse_host}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Open Langfuse dashboard
                  <ExternalLink className="size-3.5" />
                </a>
              </CardContent>
            )}
          </Card>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No analytics available.</p>
      )}
    </div>
  );
}
