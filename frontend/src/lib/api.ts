import { getSessionId, getUserId } from "@/lib/session";
import type {
  AnalyticsSummary,
  ChatResponse,
  DocumentOut,
  IngestResponse,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8100";

function sessionHeaders(): HeadersInit {
  return {
    "X-Session-Id": getSessionId(),
    "X-User-Id": getUserId(),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    throw new Error(
      typeof detail === "string" ? detail : `Request failed with status ${res.status}`
    );
  }
  return (await res.json()) as T;
}

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...sessionHeaders() },
    body: JSON.stringify({ message }),
  });
  return handleResponse<ChatResponse>(res);
}

export async function listDocuments(): Promise<DocumentOut[]> {
  const res = await fetch(`${API_URL}/api/documents`, { headers: sessionHeaders() });
  return handleResponse<DocumentOut[]>(res);
}

export async function uploadDocument(file: File): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/documents/upload`, {
    method: "POST",
    headers: sessionHeaders(),
    body: formData,
  });
  return handleResponse<IngestResponse>(res);
}

export async function ingestUrl(url: string): Promise<IngestResponse> {
  const res = await fetch(`${API_URL}/api/documents/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...sessionHeaders() },
    body: JSON.stringify({ url }),
  });
  return handleResponse<IngestResponse>(res);
}

export async function setDocumentActive(
  documentId: string,
  isActive: boolean
): Promise<DocumentOut> {
  const res = await fetch(`${API_URL}/api/documents/${documentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...sessionHeaders() },
    body: JSON.stringify({ is_active: isActive }),
  });
  return handleResponse<DocumentOut>(res);
}

export async function deleteDocument(documentId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/documents/${documentId}`, {
    method: "DELETE",
    headers: sessionHeaders(),
  });
  await handleResponse(res);
}

export async function submitFeedback(payload: {
  chat_message_id?: string;
  trace_id?: string | null;
  score: 1 | -1;
  comment?: string;
}): Promise<void> {
  const res = await fetch(`${API_URL}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...sessionHeaders() },
    body: JSON.stringify(payload),
  });
  await handleResponse(res);
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_URL}/api/analytics/summary`, {
    headers: sessionHeaders(),
  });
  return handleResponse<AnalyticsSummary>(res);
}
