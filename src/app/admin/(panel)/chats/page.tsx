// "use client": the admin screens load data in the browser with the admin's session (react-query)
"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Card, Empty, ErrorBlock, Label, LoadingBlock, Modal, PageHeader, PaginationBar, Select, StatusBadge, Textarea } from "@/components/admin/ui";
import { api, errorMessage, qs } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { formatDate } from "@/lib/utils";

interface ChatRow {
  _id: string;
  locale: string;
  leadStatus: string;
  handoff?: { requested: boolean; reason?: string };
  contact?: { name?: string; email?: string };
  booking?: { reference?: string };
  messageCount: number;
  firstMessage: string;
  updatedAt: string;
}

interface ChatDetail extends ChatRow {
  messages: { role: string; text: string; createdAt: string }[];
  staffNote?: string;
  inputTokens: number;
  outputTokens: number;
}

interface Usage {
  totals: { requests: number; inputTokens: number; outputTokens: number; estimatedUsd: number };
  chats: number;
  handoffs: number;
  converted: number;
}

const LEAD_STATUSES = ["none", "new", "contacted", "converted", "closed"];

// One chat: the whole conversation, lead status, staff note, delete
function ChatModal({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { can } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["chat", id], queryFn: () => api.get<ChatDetail>(`/admin/chats/${id}`) });
  const chat = data?.data;
  const [note, setNote] = useState<string | null>(null);

  async function save(patch: Record<string, string>) {
    try {
      await api.patch(`/admin/chats/${id}`, patch);
      await qc.invalidateQueries({ queryKey: ["chats"] });
      await refetch();
      toast.success("Updated");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function remove() {
    try {
      await api.del(`/admin/chats/${id}`);
      await qc.invalidateQueries({ queryKey: ["chats"] });
      toast.success("Chat deleted");
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={chat?.contact?.name || "AI chat"}
      footer={can("bookings:delete") ? <Button variant="danger" className="me-auto" onClick={remove}>Delete chat</Button> : undefined}
    >
      {error ? (
        <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />
      ) : isLoading || !chat ? (
        <LoadingBlock />
      ) : (
        <div className="space-y-4">
          {/* LEAD */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="lead-status">Lead status</Label>
              <Select id="lead-status" value={chat.leadStatus} disabled={!can("bookings:update")} onChange={(e) => save({ leadStatus: e.target.value })}>
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div className="text-sm text-slate-600">
              <p>{chat.contact?.email || "No email yet"}</p>
              {chat.booking?.reference && <p>Booking request: {chat.booking.reference}</p>}
              {chat.handoff?.requested && <p className="font-medium text-amber-700">Wants a person: {chat.handoff.reason || "—"}</p>}
              <p>
                Language {chat.locale} · {chat.inputTokens + chat.outputTokens} tokens
              </p>
            </div>
          </div>

          {/* MESSAGES - plain text, never HTML */}
          <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
            {chat.messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "ms-10 rounded-lg bg-slate-800 p-2.5 text-sm text-white" : "me-10 rounded-lg bg-slate-100 p-2.5 text-sm"}>
                <p className="whitespace-pre-wrap">{m.text}</p>
                <p className="mt-1 text-[11px] opacity-60">{formatDate(m.createdAt, "en", { dateStyle: "short", timeStyle: "short" })}</p>
              </div>
            ))}
          </div>

          {/* STAFF NOTE */}
          {can("bookings:update") && (
            <div>
              <Label htmlFor="staff-note">Staff note</Label>
              <Textarea id="staff-note" rows={3} value={note ?? chat.staffNote ?? ""} onChange={(e) => setNote(e.target.value)} />
              <Button size="sm" className="mt-2" disabled={note === null} onClick={() => save({ staffNote: note ?? "" })}>
                Save note
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// Admin → AI Chats
export default function ChatsPage() {
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const [leadStatus, setLeadStatus] = useState("");
  const [handoff, setHandoff] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["chats", page, leadStatus, handoff],
    queryFn: () => api.get<ChatRow[]>(`/admin/chats${qs({ page, leadStatus: leadStatus || undefined, handoff: handoff ? "true" : undefined })}`),
  });
  const usage = useQuery({ queryKey: ["chats", "usage"], queryFn: () => api.get<Usage>("/admin/chats/usage?days=30"), enabled: can("analytics:read") });
  const u = usage.data?.data;

  return (
    <div className="space-y-6">
      <PageHeader title="AI Chats" description="Conversations with the website's AI travel assistant. Chats are deleted automatically after the retention period." />

      {/* USAGE (last 30 days) */}
      {u && (
        <div className="grid gap-3 sm:grid-cols-5">
          {[
            ["Chats", u.chats],
            ["Wanted a person", u.handoffs],
            ["Booking requests", u.converted],
            ["Gemini requests", u.totals.requests],
            ["Est. cost (USD)", `$${u.totals.estimatedUsd.toFixed(2)}`],
          ].map(([label, value]) => (
            <Card key={String(label)}>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xl font-semibold">{value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-3">
        <Select aria-label="Lead status" value={leadStatus} onChange={(e) => (setLeadStatus(e.target.value), setPage(1))} className="w-48">
          <option value="">All lead statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={handoff} onChange={(e) => (setHandoff(e.target.checked), setPage(1))} />
          Wants a person
        </label>
      </div>

      {/* LIST */}
      {list.error ? (
        <ErrorBlock message={errorMessage(list.error)} onRetry={() => list.refetch()} />
      ) : list.isLoading ? (
        <LoadingBlock />
      ) : !list.data?.data.length ? (
        <Empty>No chats yet.</Empty>
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {list.data.data.map((c) => (
              <li key={c._id}>
                <button type="button" onClick={() => setOpenId(c._id)} className="flex w-full items-center gap-4 px-2 py-3 text-start hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.contact?.name || c.firstMessage || "(no message)"}</p>
                    <p className="truncate text-xs text-slate-500">
                      {c.messageCount} messages · {c.locale} · {formatDate(c.updatedAt, "en", { dateStyle: "medium", timeStyle: "short" })}
                      {c.booking?.reference ? ` · ${c.booking.reference}` : ""}
                    </p>
                  </div>
                  {c.handoff?.requested && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Wants a person</span>}
                  <StatusBadge status={c.leadStatus} />
                </button>
              </li>
            ))}
          </ul>
          {list.data.meta && <PaginationBar page={page} totalPages={list.data.meta.totalPages} total={list.data.meta.total} onPage={setPage} />}
        </Card>
      )}

      {openId && <ChatModal id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
