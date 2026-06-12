"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteDocument, setDocumentActive } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { DocumentOut } from "@/lib/types";

export const SOURCE_TYPE_STYLES: Record<string, string> = {
  pdf: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  excel: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  csv: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  url: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

export function DocumentTable({
  documents,
  onDeleted,
  onToggled,
}: {
  documents: DocumentOut[];
  onDeleted: () => void;
  onToggled: () => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteDocument(id);
      toast.success("Document removed");
      onDeleted();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleActive(doc: DocumentOut, checked: boolean) {
    setTogglingId(doc.id);
    try {
      await setDocumentActive(doc.id, checked);
      toast.success(
        checked ? `${doc.source} included in search` : `${doc.source} excluded from search`
      );
      onToggled();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update document");
    } finally {
      setTogglingId(null);
    }
  }

  if (documents.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No documents ingested yet. Upload a file or ingest a URL to get started.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Chunks</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ingested</TableHead>
          <TableHead>Search</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id} className={cn(!doc.is_active && "opacity-50")}>
            <TableCell className="max-w-xs truncate font-medium" title={doc.source}>
              {doc.source}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn(
                  "border-transparent uppercase",
                  SOURCE_TYPE_STYLES[doc.source_type] ?? "bg-secondary text-secondary-foreground"
                )}
              >
                {doc.source_type}
              </Badge>
            </TableCell>
            <TableCell>{doc.num_chunks}</TableCell>
            <TableCell>{doc.status}</TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(doc.ingested_at).toLocaleString()}
            </TableCell>
            <TableCell>
              <Switch
                checked={doc.is_active}
                disabled={togglingId === doc.id}
                onCheckedChange={(checked) => void handleToggleActive(doc, checked)}
                aria-label={
                  doc.is_active
                    ? `Exclude ${doc.source} from search`
                    : `Include ${doc.source} in search`
                }
              />
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={deletingId === doc.id}
                onClick={() => void handleDelete(doc.id)}
                aria-label={`Delete ${doc.source}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
