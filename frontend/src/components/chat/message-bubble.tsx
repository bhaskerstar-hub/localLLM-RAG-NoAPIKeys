import { Sparkles, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { SourceChunk, TokenUsage } from "@/lib/types";

import { CitationList } from "./citation-list";
import { FeedbackButtons } from "./feedback-buttons";
import { UsageStats } from "./usage-stats";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
  usage?: TokenUsage | null;
  traceId?: string | null;
  pending?: boolean;
}

export function MessageBubble({ message }: { message: ChatMessageData }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full items-start gap-2.5", isUser && "flex-row-reverse")}>
      <Avatar size="sm" className="mt-0.5">
        <AvatarFallback
          className={cn(
            isUser
              ? "bg-secondary text-secondary-foreground"
              : "bg-gradient-to-br from-primary to-accent text-primary-foreground"
          )}
        >
          {isUser ? <User className="size-3.5" /> : <Sparkles className="size-3.5" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          isUser
            ? "rounded-tr-sm bg-gradient-to-br from-primary to-primary/85 text-primary-foreground"
            : "rounded-tl-sm border border-white/10 bg-card"
        )}
      >
        {message.pending ? (
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="flex size-2 animate-pulse rounded-full bg-accent" />
            Thinking...
          </span>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}

        {!isUser && !message.pending && message.sources && message.sources.length > 0 && (
          <CitationList sources={message.sources} />
        )}

        {!isUser && !message.pending && message.usage && <UsageStats usage={message.usage} />}

        {!isUser && !message.pending && (
          <FeedbackButtons chatMessageId={message.id} traceId={message.traceId ?? null} />
        )}
      </div>
    </div>
  );
}
