"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ingestUrl } from "@/lib/api";

export function UrlIngestForm({ onIngested }: { onIngested: () => void }) {
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await ingestUrl(trimmed);
      toast.success(`Ingested "${trimmed}"`);
      setUrl("");
      onIngested();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to ingest URL");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://example.com/article"
        disabled={isSubmitting}
        required
      />
      <Button type="submit" disabled={isSubmitting || !url.trim()}>
        {isSubmitting ? "Ingesting..." : "Ingest"}
      </Button>
    </form>
  );
}
