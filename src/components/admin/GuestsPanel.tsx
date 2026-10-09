"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarCheck, Download, Eraser, Mail, MessageCircle, MessageSquare, Phone, Repeat, Search, Sparkles, UserRound, Users } from "lucide-react";
import { api, downloadFile, errorMessage, qs } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { Button, ConfirmDialog, Empty, ErrorBlock, Input, Label, LoadingBlock, Modal, PaginationBar, Select, Spinner, StatusBadge } from "@/components/admin/ui";
import { StatTile } from "@/components/admin/StatTile";

interface GuestRow {
  email: string;
  name: string;
  phone: string;
  whatsapp: string;
  country: string;
  bookings: number;
  enquiries: number;
  messages: number;
  firstSeen: string;
  lastSeen: string;
  accountId: string | null;
}
interface GuestDetail extends Omit<GuestRow, "bookings" | "enquiries" | "messages"> {
  counts: { bookings: number; enquiries: number; messages: number };
  bookings: { _id: string; reference: string; type: string; itemTitle?: string; status: string; startDate?: string; adults?: number; children?: number; quotedAmount?: number; currency?: string; createdAt: string }[];
  enquiries: { _id: string; reference: string; status: string; arrivalDate?: string; durationDays?: number; adults?: number; children?: number; createdAt: string }[];
  messages: { _id: string; subject?: string; message: string; status: string; createdAt: string }[];
}

const fmt = (d?: string | null) => (d ? formatDate(d, "en", { dateStyle: "medium" }) : "—");
const waLink = (n: string) => `https://wa.me/${n.replace(/\D/g, "")}`;

/**
 * Admin → Customers → Guests: everyone who booked, sent a tailor-made enquiry or a contact message without
 * an account, one row per email address. Guests have no record of their own – edits apply to their requests.
 */
export function GuestsPanel({ onOpenAccount }: { onOpenAccount: (id: string) => void }) {
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [account, setAccount] = useState("");
  const [sort, setSort] = useState("-lastSeen");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query = { page, limit: 25, type, status: account, sort, search };
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["guests", query],
    queryFn: () => api.get<GuestRow[]>(`/admin/guests${qs(query)}`),
    placeholderData: keepPreviousData,
  });
  const stats = data?.stats ?? {};
  const filtered = !!(search || type || account);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Users} label="Guests" value={stats.total} />
        <StatTile icon={Sparkles} label="First contact in 30 days" value={stats.last30Days} accent />
        <StatTile icon={CalendarCheck} label="Sent a booking request" value={stats.booked} suffix={stats.total ? `${Math.round(((stats.booked ?? 0) / stats.total) * 100)}%` : undefined} />
        <StatTile icon={Repeat} label="Got in touch more than once" value={stats.repeat} />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name, email or phone" className="ps-8" aria-label="Search guests" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="w-44">
              <Select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
                aria-label="Activity"
              >
                <option value="">Any activity</option>
                <option value="booked">Sent a booking request</option>
                <option value="enquiry">Enquiries / messages only</option>
              </Select>
            </div>
            <div className="w-40">
              <Select
                value={account}
                onChange={(e) => {
                  setAccount(e.target.value);
                  setPage(1);
                }}
                aria-label="Account"
              >
                <option value="">With or without account</option>
                <option value="noAccount">No account</option>
                <option value="account">Has an account now</option>
              </Select>
            </div>
            <div className="w-44">
              <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
                <option value="-lastSeen">Latest contact</option>
                <option value="firstSeen">First contact (oldest)</option>
                <option value="-bookings">Most booking requests</option>
                <option value="name">Name A–Z</option>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => downloadFile(`/admin/guests/export${qs({ type, status: account, sort, search })}`, `guests-${new Date().toISOString().slice(0, 10)}.csv`).catch((e) => toast.error(errorMessage(e)))}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {isLoading ? (
          <LoadingBlock />
        ) : error || !data ? (
          <div className="p-4">
            <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />
          </div>
        ) : data.data.length === 0 ? (
          <div className="p-6">
            <Empty>{filtered ? "No guests match these filters." : "No guests yet. Anyone who books, enquires or writes to you without signing in will appear here."}</Empty>
          </div>
        ) : (
          <div className={cn("overflow-x-auto transition-opacity", isFetching && "opacity-60")}>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">Guest</th>
                  <th className="px-4 py-3 text-start font-medium">Phone</th>
                  <th className="px-4 py-3 text-start font-medium">Country</th>
                  <th className="px-4 py-3 text-start font-medium">Activity</th>
                  <th className="px-4 py-3 text-start font-medium">Last contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((g) => (
                  <tr key={g.email} onClick={() => setOpenEmail(g.email)} className="cursor-pointer transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button type="button" className="flex items-center gap-3 text-start" onClick={() => setOpenEmail(g.email)}>
                        <Initial name={g.name || g.email} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 truncate font-medium text-slate-900">
                            {g.name || "—"}
                            {g.accountId && <span className="rounded bg-forest-50 px-1.5 py-0.5 text-[11px] font-medium text-forest-700 ring-1 ring-inset ring-forest-600/20">Has account</span>}
                          </span>
                          <span className="block truncate text-xs text-slate-500">{g.email}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{g.phone || g.whatsapp || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{g.country || "—"}</td>
                    <td className="px-4 py-3">
                      <ActivityCounts bookings={g.bookings} enquiries={g.enquiries} messages={g.messages} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{fmt(g.lastSeen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data?.meta && data.data.length > 0 && <PaginationBar page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
      </div>

      <GuestDrawer
        email={openEmail}
        onClose={() => setOpenEmail(null)}
        onOpenAccount={onOpenAccount}
        canUpdate={can("customers:update")}
        canErase={can("customers:delete")}
        canBookings={can("bookings:read")}
        canEnquiries={can("enquiries:read")}
        canMessages={can("contacts:read")}
      />
    </div>
  );
}

function Initial({ name, large }: { name: string; large?: boolean }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold uppercase text-slate-600", large ? "h-14 w-14 text-xl" : "h-9 w-9 text-sm")}>
      {name.trim().charAt(0) || "?"}
    </span>
  );
}

function ActivityCounts({ bookings, enquiries, messages }: { bookings: number; enquiries: number; messages: number }) {
  const items = [
    { n: bookings, label: "booking", icon: CalendarCheck },
    { n: enquiries, label: "tailor-made", icon: Sparkles },
    { n: messages, label: "message", icon: MessageSquare },
  ].filter((i) => i.n > 0);
  return (
    <span className="flex flex-wrap gap-1.5">
      {items.map(({ n, label, icon: Icon }) => (
        <span key={label} className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600" title={`${n} ${label}${n === 1 ? "" : "s"}`}>
          <Icon className="h-3 w-3" />
          {n} {label}
          {n === 1 ? "" : "s"}
        </span>
      ))}
    </span>
  );
}

type DrawerProps = {
  email: string | null;
  onClose: () => void;
  onOpenAccount: (id: string) => void;
  canUpdate: boolean;
  canErase: boolean;
  canBookings: boolean;
  canEnquiries: boolean;
  canMessages: boolean;
};

const CONTACT_FIELDS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "country", label: "Country" },
] as const;
type ContactKey = (typeof CONTACT_FIELDS)[number]["key"];

function GuestDrawer({ email, onClose, onOpenAccount, canUpdate, canErase, canBookings, canEnquiries, canMessages }: DrawerProps) {
  const qc = useQueryClient();
  const path = email ? `/admin/guests/${encodeURIComponent(email)}` : "";
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["guest", email], queryFn: () => api.get<GuestDetail>(path), enabled: !!email });
  const [draft, setDraft] = useState<Partial<Record<ContactKey, string>>>({});
  const [saving, setSaving] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [confirmErase, setConfirmErase] = useState(false);
  const g = data?.data;

  const close = () => {
    setDraft({});
    onClose();
  };
  const changes = g ? Object.fromEntries(Object.entries(draft).filter(([k, v]) => v !== undefined && v.trim() !== (g[k as ContactKey] ?? ""))) : {};
  const nameInvalid = changes.name !== undefined && changes.name.trim().length < 2;

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(path, Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.trim()])));
      toast.success("Contact details updated on all of this guest’s requests");
      setDraft({});
      await Promise.all([qc.invalidateQueries({ queryKey: ["guest", email] }), qc.invalidateQueries({ queryKey: ["guests"] }), qc.invalidateQueries({ queryKey: ["crm"] })]);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const erase = async () => {
    setErasing(true);
    try {
      await api.post(`${path}/erase`);
      toast.success("Personal data erased");
      setConfirmErase(false);
      close();
      qc.removeQueries({ queryKey: ["guest", email] });
      await Promise.all([qc.invalidateQueries({ queryKey: ["guests"] }), qc.invalidateQueries({ queryKey: ["crm"] })]);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setErasing(false);
    }
  };

  return (
    <>
      <Modal open={!!email} onClose={close} title="Guest" wide>
        {isLoading ? (
          <div className="flex justify-center p-10">
            <Spinner />
          </div>
        ) : error || !g ? (
          <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <Initial name={g.name || g.email} large />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold text-slate-900">{g.name || "—"}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <a href={`mailto:${g.email}`} className="inline-flex items-center gap-1.5 text-forest-700 hover:underline">
                    <Mail className="h-3.5 w-3.5" /> {g.email}
                  </a>
                  {g.phone && (
                    <a href={`tel:${g.phone}`} className="inline-flex items-center gap-1.5 text-forest-700 hover:underline">
                      <Phone className="h-3.5 w-3.5" /> {g.phone}
                    </a>
                  )}
                  {g.whatsapp && (
                    <a href={waLink(g.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-forest-700 hover:underline">
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
              {g.accountId ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    close();
                    onOpenAccount(g.accountId!);
                  }}
                >
                  <UserRound className="h-4 w-4" /> Open account
                </Button>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Guest – no account</span>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-4">
              <Fact label="First contact" value={fmt(g.firstSeen)} />
              <Fact label="Last contact" value={fmt(g.lastSeen)} />
              <Fact label="Country" value={g.country || "—"} />
              <Fact label="Requests" value={<ActivityCounts {...g.counts} />} />
            </dl>

            {canUpdate && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {CONTACT_FIELDS.map((f) => (
                    <div key={f.key}>
                      <Label htmlFor={`guest-${f.key}`}>{f.label}</Label>
                      <Input id={`guest-${f.key}`} value={draft[f.key] ?? g[f.key] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button disabled={!Object.keys(changes).length || nameInvalid} loading={saving} onClick={save}>
                    Save contact details
                  </Button>
                  {Object.keys(draft).length > 0 && (
                    <Button variant="ghost" onClick={() => setDraft({})}>
                      Reset
                    </Button>
                  )}
                  {canErase && (
                    <Button variant="ghost" className="ms-auto text-red-600 hover:bg-red-50" onClick={() => setConfirmErase(true)}>
                      <Eraser className="h-4 w-4" /> Erase personal data
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-500">Changes are applied to every booking request, tailor-made enquiry and message from this email address.</p>
              </div>
            )}
            {!canUpdate && canErase && (
              <div className="flex justify-end">
                <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmErase(true)}>
                  <Eraser className="h-4 w-4" /> Erase personal data
                </Button>
              </div>
            )}

            <History title="Booking requests" count={g.bookings.length}>
              {g.bookings.map((b) => (
                <HistoryRow
                  key={b._id}
                  href={canBookings ? `/admin/bookings/${b._id}` : undefined}
                  title={b.itemTitle || b.type}
                  meta={`${b.reference} · requested ${fmt(b.createdAt)}${b.startDate ? ` · starts ${fmt(b.startDate)}` : ""}`}
                  side={
                    <>
                      {b.quotedAmount != null && <span className="text-xs tabular-nums text-slate-600">{formatPrice(b.quotedAmount, b.currency)}</span>}
                      <StatusBadge status={b.status} />
                    </>
                  }
                />
              ))}
            </History>
            <History title="Tailor-made enquiries" count={g.enquiries.length}>
              {g.enquiries.map((e) => (
                <HistoryRow
                  key={e._id}
                  href={canEnquiries ? `/admin/tailor-made/${e._id}` : undefined}
                  title={e.durationDays ? `${e.durationDays}-day trip` : "Tailor-made trip"}
                  meta={`${e.reference} · sent ${fmt(e.createdAt)}${e.arrivalDate ? ` · arrives ${fmt(e.arrivalDate)}` : ""}`}
                  side={<StatusBadge status={e.status} />}
                />
              ))}
            </History>
            <History title="Contact messages" count={g.messages.length}>
              {g.messages.map((m) => (
                <HistoryRow
                  key={m._id}
                  href={canMessages ? `/admin/messages?open=${m._id}` : undefined}
                  title={m.subject || m.message}
                  meta={`sent ${fmt(m.createdAt)}`}
                  side={<StatusBadge status={m.status} />}
                />
              ))}
            </History>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmErase}
        title="Erase this guest’s personal data?"
        message={`Name, email, phone and free-text details are removed from all ${g ? g.counts.bookings + g.counts.enquiries + g.counts.messages : ""} of ${g?.email}’s requests. The requests stay (reference, dates, status) so your records and reports remain complete. This cannot be undone.`}
        confirmLabel="Erase"
        loading={erasing}
        onCancel={() => setConfirmErase(false)}
        onConfirm={erase}
      />
    </>
  );
}

function History({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  if (!count) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-800">
        {title} ({count})
      </h3>
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">{children}</ul>
    </div>
  );
}

function HistoryRow({ href, title, meta, side }: { href?: string; title: string; meta: string; side: ReactNode }) {
  const body = (
    <>
      <span className="min-w-0">
        <span className="block truncate font-medium text-slate-900">{title}</span>
        <span className="block truncate text-xs text-slate-500">{meta}</span>
      </span>
      <span className="flex shrink-0 items-center gap-3">{side}</span>
    </>
  );
  const cls = "flex items-center justify-between gap-3 px-3 py-2.5 text-sm";
  return (
    <li>
      {href ? (
        <Link href={href} className={cn(cls, "hover:bg-slate-50")}>
          {body}
        </Link>
      ) : (
        <div className={cls}>{body}</div>
      )}
    </li>
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 truncate font-medium text-slate-800">{value}</dd>
    </div>
  );
}
