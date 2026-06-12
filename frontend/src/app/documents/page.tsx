"use client";

import { useCallback, useEffect, useState } from "react";
import { FileUp, Globe, Library } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentTable } from "@/components/documents/document-table";
import { FileUploader } from "@/components/documents/file-uploader";
import { UrlIngestForm } from "@/components/documents/url-ingest-form";
import { PageHero } from "@/components/layout/page-hero";
import { listDocuments } from "@/lib/api";
import type { DocumentOut } from "@/lib/types";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentOut[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setDocuments(await listDocuments());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Failed to load documents")
      )
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        icon={Library}
        eyebrow="Knowledge base"
        title="Documents"
        description="Ingest PDFs, Excel workbooks, CSV files, and webpages for the chat assistant to search."
      >
        <div className="flex gap-6 sm:gap-10">
          <div>
            <p className="stat-value">{documents.length}</p>
            <p className="stat-label">Sources</p>
          </div>
          <div>
            <p className="stat-value">
              {documents.reduce((sum, doc) => sum + doc.num_chunks, 0)}
            </p>
            <p className="stat-label">Chunks</p>
          </div>
        </div>
      </PageHero>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileUp className="size-4" />
              </span>
              Upload a file
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploader onUploaded={() => void refresh()} />
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-teal-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Globe className="size-4" />
              </span>
              Ingest a webpage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UrlIngestForm onIngested={() => void refresh()} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingested documents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <DocumentTable
              documents={documents}
              onDeleted={() => void refresh()}
              onToggled={() => void refresh()}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
