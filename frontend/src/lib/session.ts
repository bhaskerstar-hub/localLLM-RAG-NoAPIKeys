const SESSION_ID_KEY = "rag.session_id";
const USER_ID_KEY = "rag.user_id";

function getOrCreate(key: string, makeValue: () => string): string {
  if (typeof window === "undefined") return "server";

  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const value = makeValue();
  window.localStorage.setItem(key, value);
  return value;
}

/** Stable per-browser session id, used to group chat history in Langfuse. */
export function getSessionId(): string {
  return getOrCreate(SESSION_ID_KEY, () => crypto.randomUUID());
}

/** Stable per-browser pseudo user id (no auth in this app yet). */
export function getUserId(): string {
  return getOrCreate(USER_ID_KEY, () => `user-${crypto.randomUUID().slice(0, 8)}`);
}
