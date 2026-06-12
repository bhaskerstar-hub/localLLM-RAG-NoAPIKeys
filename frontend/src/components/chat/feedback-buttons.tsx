"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { submitFeedback } from "@/lib/api";
import { cn } from "@/lib/utils";

export function FeedbackButtons({
  chatMessageId,
  traceId,
}: {
  chatMessageId: string;
  traceId: string | null;
}) {
  const [score, setScore] = useState<1 | -1 | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleFeedback(value: 1 | -1) {
    if (submitting || score !== null) return;

    setSubmitting(true);
    try {
      await submitFeedback({
        chat_message_id: chatMessageId,
        trace_id: traceId,
        score: value,
      });
      setScore(value);
      toast.success("Thanks for the feedback!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-2 flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-7", score === 1 && "text-green-600")}
        disabled={submitting || score !== null}
        onClick={() => void handleFeedback(1)}
        aria-label="Good response"
      >
        <ThumbsUp className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-7", score === -1 && "text-red-600")}
        disabled={submitting || score !== null}
        onClick={() => void handleFeedback(-1)}
        aria-label="Bad response"
      >
        <ThumbsDown className="size-4" />
      </Button>
    </div>
  );
}
