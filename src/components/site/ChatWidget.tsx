// "use client": the chat keeps its messages in state and talks to the API from the browser
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, MessageCircle, Send, Trash2, X } from "lucide-react";
import { chatRequest, linkChatToAccount, type ChatMessage } from "@/lib/chat";
import { useCustomerAuth } from "@/lib/customer/auth";
import { whatsappLink } from "@/lib/utils";

// The booking request the assistant prepared, shown for the visitor to check
interface BookingDraft {
  tourTitle: string;
  startDate: string;
  adults: number;
  children: number;
  name: string;
  email: string;
  phone?: string;
}

// Extra state the API sends with each answer
interface ChatState {
  bookingDraft?: BookingDraft | null;
  handoff?: boolean;
}

/** Floating AI travel assistant (bottom-end, above the WhatsApp button). Hidden while the API has the chat switched off. */
export function ChatWidget({ whatsapp }: { whatsapp?: string }) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const { customer } = useCustomerAuth();
  const id = useId();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const loaded = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [handoff, setHandoff] = useState(false);
  const listEnd = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // Show the button only when the assistant is switched on
  useEffect(() => {
    chatRequest<{ enabled: boolean }>("GET", "/status").then((r) => setEnabled(Boolean(r.data?.enabled)));
  }, []);

  // On first open, load the visitor's earlier chat (if their cookie still has one)
  useEffect(() => {
    if (!open || loaded.current) return;
    loaded.current = true;
    chatRequest<ChatState & { messages: ChatMessage[] }>("GET", "/session").then((r) => {
      if (!r.ok || !r.data) return;
      setMessages(r.data.messages);
      setDraft(r.data.bookingDraft ?? null);
      setHandoff(Boolean(r.data.handoff));
    });
  }, [open]);

  // A guest who signs in (or opens the chat while signed in): link their existing chat to the account.
  // The API checks both cookies; when there is no chat yet it just answers 404, which is fine.
  useEffect(() => {
    if (open && enabled && customer?.id) void linkChatToAccount();
  }, [open, enabled, customer?.id]);

  // Keep the newest message in view
  useEffect(() => {
    listEnd.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  // Escape closes the panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Send a message; starts a chat first when the visitor has none
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setError("");
    setText("");
    setMessages((m) => [...m, { role: "user", text: message }]);

    let reply = await chatRequest<ChatState & ChatMessage>("POST", "/messages", { text: message });
    if (reply.status === 404) {
      const started = await chatRequest("POST", "/session", { locale });
      if (started.ok) {
        // Signed in: link the new chat before the first message, so the assistant already knows the customer
        if (customer) await linkChatToAccount();
        reply = await chatRequest<ChatState & ChatMessage>("POST", "/messages", { text: message });
      }
    }
    if (reply.ok && reply.data) {
      const { role, text: answer, bookingDraft, handoff: wantsPerson } = reply.data;
      setMessages((m) => [...m, { role, text: answer }]);
      setDraft(bookingDraft ?? null);
      setHandoff(Boolean(wantsPerson));
    } else setError(reply.status === 429 ? t("errorLimit") : t("error"));
    setBusy(false);
  }

  // The visitor pressed Confirm: the request goes to our team through the normal booking system
  async function confirm() {
    setBusy(true);
    setError("");
    const result = await chatRequest<{ reference: string }>("POST", "/booking/confirm", {});
    if (result.ok && result.data) {
      setMessages((m) => [...m, { role: "assistant", text: t("bookingSent", { reference: result.data!.reference }) }]);
      setDraft(null);
    } else setError(t("bookingError"));
    setBusy(false);
  }

  // The visitor deletes their chat from our database
  async function clear() {
    await chatRequest("DELETE", "/session");
    setMessages([]);
    setDraft(null);
    setHandoff(false);
    setError("");
  }

  if (!enabled) return null;

  return (
    <div className="fixed bottom-24 end-5 z-40 sm:bottom-28 sm:end-7">
      {/* PANEL */}
      {open && (
        <div
          id={`${id}-panel`}
          role="dialog"
          aria-labelledby={`${id}-title`}
          data-testid="chat-panel"
          className="absolute bottom-16 end-0 flex h-[min(32rem,calc(100dvh-9rem))] w-[min(22rem,calc(100vw-2.5rem))] flex-col rounded-3xl border border-sand-200 bg-surface shadow-card"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-sand-200 px-5 py-3">
            <h2 id={`${id}-title`} className="font-sans text-base font-semibold text-heading">
              {t("title")}
            </h2>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button type="button" onClick={clear} className="rounded-full p-1.5 text-muted hover:bg-sand-100" aria-label={t("delete")} title={t("delete")}>
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 text-muted hover:bg-sand-100" aria-label={t("close")}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* MESSAGES - shown as plain text only (React escapes it), never as HTML */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            <p className="rounded-2xl bg-forest-50 px-4 py-3 text-sm text-ink">{t("welcome")}</p>
            {messages.map((m, i) => (
              <p
                key={i}
                className={
                  m.role === "user"
                    ? "ms-8 whitespace-pre-wrap rounded-2xl bg-forest-800 px-4 py-2.5 text-sm text-white"
                    : "me-8 whitespace-pre-wrap rounded-2xl bg-sand-100 px-4 py-2.5 text-sm text-ink"
                }
              >
                {m.text}
              </p>
            ))}
            {/* BOOKING DRAFT - nothing is sent until the visitor presses Confirm */}
            {draft && (
              <div className="rounded-2xl border border-forest-600/30 bg-forest-50 p-4 text-sm text-ink" data-testid="chat-booking-draft">
                <p className="mb-2 font-semibold text-heading">{t("draftTitle")}</p>
                <dl className="space-y-1">
                  <div><dt className="inline text-muted">{t("draftTour")}: </dt><dd className="inline">{draft.tourTitle}</dd></div>
                  <div><dt className="inline text-muted">{t("draftDate")}: </dt><dd className="inline">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(draft.startDate))}</dd></div>
                  <div><dt className="inline text-muted">{t("draftTravellers")}: </dt><dd className="inline">{t("draftPeople", { adults: draft.adults, children: draft.children })}</dd></div>
                  <div><dt className="inline text-muted">{t("draftContact")}: </dt><dd className="inline break-all">{draft.name} · {draft.email}</dd></div>
                </dl>
                <p className="mt-2 text-xs text-muted">{t("draftNote")}</p>
                <button type="button" onClick={confirm} disabled={busy} className="mt-3 w-full rounded-full bg-forest-800 px-4 py-2 font-medium text-white disabled:opacity-50">
                  {t("confirm")}
                </button>
              </div>
            )}
            {/* HANDOFF to our team */}
            {handoff && whatsapp && (
              <a href={whatsappLink(whatsapp)} target="_blank" rel="noopener noreferrer" className="block rounded-2xl bg-whatsapp px-4 py-2.5 text-center text-sm font-medium text-forest-950">
                {t("whatsapp")}
              </a>
            )}
            {busy && <Loader2 className="h-5 w-5 animate-spin text-forest-600" aria-label={t("thinking")} />}
            {error && (
              <p role="alert" className="text-sm text-earth-700">
                {error}{" "}
                {whatsapp && (
                  <a href={whatsappLink(whatsapp)} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                    {t("whatsapp")}
                  </a>
                )}
              </p>
            )}
            <div ref={listEnd} />
          </div>

          {/* FORM */}
          <form onSubmit={send} className="flex items-center gap-2 border-t border-sand-200 p-3">
            <label htmlFor={`${id}-input`} className="sr-only">
              {t("placeholder")}
            </label>
            <input
              id={`${id}-input`}
              value={text}
              maxLength={1000}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("placeholder")}
              className="min-w-0 flex-1 rounded-xl border border-sand-200 bg-surface px-3 py-2.5 text-sm text-ink focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
            />
            <button type="submit" disabled={busy || !text.trim()} className="rounded-full bg-forest-800 p-2.5 text-gold-400 disabled:opacity-50" aria-label={t("send")}>
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="px-4 pb-3 text-[11px] leading-snug text-muted">{t("disclaimer")}</p>
        </div>
      )}

      {/* TOGGLE BUTTON */}
      <button
        ref={toggle}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        aria-label={t("title")}
        title={t("title")}
        data-testid="chat-toggle"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-800 text-gold-400 shadow-card transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
