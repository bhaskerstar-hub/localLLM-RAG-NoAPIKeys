"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { sendChatMessage } from "@/lib/api";

import { MessageBubble, type ChatMessageData } from "./message-bubble";

const QUICK_PROMPTS = [
  "Summarize the documents I've ingested",
  "What topics are covered in my knowledge base?",
  "Pull out any key statistics or numbers",
  "What can you help me with here?",
];

export function ChatWindow({
  onMessagesChange,
}: {
  onMessagesChange?: (count: number) => void;
}) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    onMessagesChange?.(messages.length);
  }, [messages, onMessagesChange]);

  async function handleSend(message: string) {
    if (!message || sending) return;

    const userMessage: ChatMessageData = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };
    const pendingId = crypto.randomUUID();
    const pendingMessage: ChatMessageData = {
      id: pendingId,
      role: "assistant",
      content: "",
      pending: true,
    };

    setMessages((prev) => [...prev, userMessage, pendingMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await sendChatMessage(message);
      setMessages((prev) =>
        prev.map((existing) =>
          existing.id === pendingId
            ? {
                id: response.chat_message_id,
                role: "assistant",
                content: response.answer,
                sources: response.sources,
                usage: response.usage,
                traceId: response.trace_id,
              }
            : existing
        )
      );
    } catch (error) {
      setMessages((prev) => prev.filter((existing) => existing.id !== pendingId));
      toast.error(error instanceof Error ? error.message : "Failed to get a response");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend(input.trim());
    }
  }

  function handlePromptClick(prompt: string) {
    setInput(prompt);
    textareaRef.current?.focus();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-2xl border border-white/10 bg-card/40 p-3 shadow-sm sm:p-4">
      <ScrollArea className="flex-1">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_0_30px_-6px_var(--color-primary)] [clip-path:polygon(15%_0,100%_0,85%_100%,0_100%)]">
              <Sparkles className="size-7" />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight">Ask Querion anything</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Answers are grounded in your ingested documents, with numbered citations and a
                token / cost breakdown for every response.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handlePromptClick(prompt)}
                  className="rounded-full border border-white/10 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-1 py-1">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>
      <div className="flex items-end gap-2 border-t border-white/10 pt-3">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your documents..."
          rows={2}
          className="resize-none border-none bg-transparent px-2 shadow-none focus-visible:ring-0"
          disabled={sending}
        />
        <Button onClick={() => void handleSend(input.trim())} disabled={sending || !input.trim()}>
          <Send className="size-4" />
          Send
        </Button>
      </div>
    </div>
  );
}
