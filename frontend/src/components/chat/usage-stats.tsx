import { Coins } from "lucide-react";

import type { TokenUsage } from "@/lib/types";

function formatCost(cost: number | null): string {
  if (cost === null) return "cost unknown";
  if (cost === 0) return "free (local model)";
  if (cost < 0.01) return `~$${cost.toFixed(4)}`;
  return `~$${cost.toFixed(2)}`;
}

export function UsageStats({ usage }: { usage: TokenUsage }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-dashed pt-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-amber-600 dark:text-amber-400">
        <Coins className="size-3" />
        {formatCost(usage.estimated_cost_usd)}
      </span>
      <span>
        {usage.input_tokens.toLocaleString()} in / {usage.output_tokens.toLocaleString()} out ·{" "}
        {usage.total_tokens.toLocaleString()} tokens
      </span>
    </div>
  );
}
