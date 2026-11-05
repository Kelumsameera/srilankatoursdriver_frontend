import { API_URL } from "@/lib/config";

/*
 * Browser calls to the AI travel assistant (/api/chat). The chat cookie is httpOnly, so this code never sees it;
 * credentials: "include" just lets the browser send it. Never throws.
 */

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface ChatResult<T> {
  ok: boolean;
  status: number;
  data?: T;
}

export async function chatRequest<T>(method: "GET" | "POST" | "DELETE", path: string, body?: unknown): Promise<ChatResult<T>> {
  try {
    const res = await fetch(`${API_URL}/chat${path}`, {
      method,
      credentials: "include",
      // The API refuses chat changes without this header (cross-site forms cannot set it)
      headers: { accept: "application/json", "x-requested-with": "sltd-chat", ...(body !== undefined ? { "content-type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json().catch(() => null)) as { success?: boolean; data?: T } | null;
    return { ok: res.ok && Boolean(json?.success), status: res.status, data: json?.data };
  } catch {
    return { ok: false, status: 0 };
  }
}

// Links the visitor's current chat to their signed-in account (lives under /customer because the login
// cookie is only sent there). Harmless when there is no chat yet or nobody is signed in.
export async function linkChatToAccount(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/customer/chat/link`, {
      method: "POST",
      credentials: "include",
      headers: { accept: "application/json", "content-type": "application/json", "x-requested-with": "sltd-chat" },
      body: "{}",
    });
    return res.ok;
  } catch {
    return false;
  }
}
