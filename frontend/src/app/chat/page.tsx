"use client";

import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import { toast } from "sonner";

import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { PageHero } from "@/components/layout/page-hero";
import { listDocuments } from "@/lib/api";
import type { DocumentOut } from "@/lib/types";

export default function ChatPage() {
  const [documents, setDocuments] = useState<DocumentOut[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Failed to load documents")
      )
      .finally(() => setIsLoadingDocuments(false));
  }, []);

  const activeDocuments = documents.filter((doc) => doc.is_active);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <PageHero
        icon={MessageSquareText}
        eyebrow="Live Q&A"
        title="Chat"
        description="Ask questions about your ingested documents and get cited, source-grounded answers."
      >
        <div className="flex gap-6 sm:gap-10">
          <div>
            <p className="stat-value">
              {activeDocuments.length}/{documents.length}
            </p>
            <p className="stat-label">Active sources</p>
          </div>
          <div>
            <p className="stat-value">{messageCount}</p>
            <p className="stat-label">Messages</p>
          </div>
        </div>
      </PageHero>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ChatWindow onMessagesChange={setMessageCount} />
        <ChatSidebar documents={documents} isLoading={isLoadingDocuments} />
      </div>
    </div>
  );
}
