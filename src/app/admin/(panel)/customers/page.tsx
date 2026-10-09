"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Ban, Download, LogOut, Mail, Search, ShieldCheck, Trash2, UserCheck, UserRound } from "lucide-react";
import { api, downloadFile, errorMessage, qs } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { Button, ConfirmDialog, Empty, ErrorBlock, Input, Label, LoadingBlock, Modal, PageHeader, PaginationBar, Select, Spinner, StatusBadge, Tabs } from "@/components/admin/ui";
import { StatTile } from "@/components/admin/StatTile";
import { GuestsPanel } from "@/components/admin/GuestsPanel";

interface CustomerRow {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  status: "active" | "suspended";
  emailVerified: boolean;
  google: boolean;
  hasPassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  bookingCount: number;
}
interface CustomerDetail extends CustomerRow {
  bookings: { _id: string; reference: string; type: string; itemTitle?: string; status: string; startDate?: string; adults?: number; children?: number; quotedAmount?: number; currency?: string; createdAt: string; linked: boolean }[];
}

const STATUS_TABS = [
  { value: "", label: "All", stat: "total" },
  { value: "active", label: "Active", stat: "active" },
  { value: "suspended", label: "Suspended", stat: "suspended" },
  { value: "unverified", label: "Email not verified", stat: "" },
] as const;

const fmt = (d?: string | null, time = false) => (d ? formatDate(d, "en", time ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }) : "—");

function Avatar({ c, size = "sm" }: { c: Pick<CustomerRow, "name" | "avatar">; size?: "sm" | "lg" }) {
  const box = size === "lg" ? "h-14 w-14 text-xl" : "h-9 w-9 text-sm";
  if (c.avatar) {
    // Google profile photo (not a Cloudinary asset).
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={c.avatar} alt="" referrerPolicy="no-referrer" className={cn("shrink-0 rounded-full object-cover", box)} />;
  }
  return <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-forest-100 font-semibold uppercase text-forest-800", box)}>{c.name.trim().charAt(0) || "?"}</span>;
}

function SignInBadges({ c }: { c: Pick<CustomerRow, "google" | "hasPassword"> }) {
  return (
    <span className="flex flex-wrap gap-1">
      {c.google && <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20">Google</span>}
      {c.hasPassword && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">Password</span>}
    </span>
  );
}

export default function CustomersPage() {
  const { can } = useAuth();
  const [tab, setTab] = useState<"accounts" | "guests">("accounts");
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="Customers" description="Accounts signed up on the website. Guests booked, enquired or wrote to you without an account." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "accounts", label: "Accounts" },
          { value: "guests", label: "Guests" },
        ]}
      />
      {tab === "accounts" ? (
        <AccountsPanel onOpen={setOpenId} />
      ) : (
        <GuestsPanel
          onOpenAccount={(id) => {
            setTab("accounts");
            setOpenId(id);
          }}
        />
      )}
      <CustomerDrawer id={openId} onClose={() => setOpenId(null)} canUpdate={can("customers:update")} canDelete={can("customers:delete")} canBookings={can("bookings:read")} />
    </div>
  );
}

function AccountsPanel({ onOpen: setOpenId }: { onOpen: (id: string) => void }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Search as you type, without a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query = { page, limit: 25, status, type, sort, search };
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["customers", query],
    queryFn: () => api.get<CustomerRow[]>(`/admin/customers${qs(query)}`),
    placeholderData: keepPreviousData,
  });
  const stats = data?.stats ?? {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Separate from admin users. Suspending an account signs it out everywhere immediately.</p>
        <Button
          variant="outline"
          onClick={() => downloadFile(`/admin/customers/export${qs({ status, type, search })}`, `customers-${new Date().toISOString().slice(0, 10)}.csv`).catch((e) => toast.error(errorMessage(e)))}
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={UserRound} label="Total customers" value={stats.total} />
        <StatTile icon={UserCheck} label="New in last 30 days" value={stats.last30Days} accent />
        <StatTile icon={BadgeCheck} label="Verified email" value={stats.verified} suffix={stats.total ? `${Math.round(((stats.verified ?? 0) / stats.total) * 100)}%` : undefined} />
        <StatTile icon={Ban} label="Suspended" value={stats.suspended} />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Status">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={status === t.value}
                onClick={() => {
                  setStatus(t.value);
                  setPage(1);
                }}
                className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", status === t.value ? "bg-forest-800 text-white" : "text-slate-600 hover:bg-slate-100")}
              >
                {t.label}
                {t.stat && stats[t.stat] !== undefined && <span className={cn("ms-1.5 text-xs tabular-nums", status === t.value ? "text-white/70" : "text-slate-400")}>{stats[t.stat]}</span>}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name or email" className="ps-8" aria-label="Search customers" />
            </div>
            <div className="w-36">
            <Select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              aria-label="Sign-in method"
            >
              <option value="">Any sign-in</option>
              <option value="google">Google</option>
              <option value="password">Password</option>
            </Select>
            </div>
            <div className="w-44">
            <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
              <option value="-createdAt">Newest first</option>
              <option value="createdAt">Oldest first</option>
              <option value="-lastLoginAt">Recently signed in</option>
              <option value="name">Name A–Z</option>
            </Select>
            </div>
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
            <Empty>{search || status || type ? "No customers match these filters." : "No customer accounts yet. Visitors can create one from the website’s Sign in link."}</Empty>
          </div>
        ) : (
          <div className={cn("overflow-x-auto transition-opacity", isFetching && "opacity-60")}>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">Customer</th>
                  <th className="px-4 py-3 text-start font-medium">Sign-in</th>
                  <th className="px-4 py-3 text-end font-medium">Bookings</th>
                  <th className="px-4 py-3 text-start font-medium">Last sign-in</th>
                  <th className="px-4 py-3 text-start font-medium">Joined</th>
                  <th className="px-4 py-3 text-start font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((c) => (
                  <tr key={c._id} onClick={() => setOpenId(c._id)} className="cursor-pointer transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button type="button" className="flex items-center gap-3 text-start" onClick={() => setOpenId(c._id)}>
                        <Avatar c={c} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900">{c.name}</span>
                          <span className="flex items-center gap-1 truncate text-xs text-slate-500">
                            {c.email}
                            {c.emailVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-label="Verified email" />}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <SignInBadges c={c} />
                    </td>
                    <td className="px-4 py-3 text-end font-semibold tabular-nums text-slate-900">{c.bookingCount}</td>
                    <td className="px-4 py-3 text-slate-500">{fmt(c.lastLoginAt, true)}</td>
                    <td className="px-4 py-3 text-slate-500">{fmt(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data?.meta && data.data.length > 0 && <PaginationBar page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
      </div>
    </div>
  );
}

function CustomerDrawer({ id, onClose, canUpdate, canDelete, canBookings }: { id: string | null; onClose: () => void; canUpdate: boolean; canDelete: boolean; canBookings: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["customer", id], queryFn: () => api.get<CustomerDetail>(`/admin/customers/${id}`), enabled: !!id });
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"delete" | "suspend" | null>(null);
  const [name, setName] = useState<string | null>(null);
  const c = data?.data;

  const refresh = async () => {
    await Promise.all([qc.invalidateQueries({ queryKey: ["customers"] }), qc.invalidateQueries({ queryKey: ["customer", id] })]);
  };
  const run = async (key: string, fn: () => Promise<unknown>, success: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(success);
      await refresh();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  };
  const close = () => {
    setName(null);
    onClose();
  };

  return (
    <>
      <Modal open={!!id} onClose={close} title="Customer" wide>
        {isLoading ? (
          <div className="flex justify-center p-10">
            <Spinner />
          </div>
        ) : error || !c ? (
          <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar c={c} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold text-slate-900">{c.name}</p>
                <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 truncate text-sm text-forest-700 hover:underline">
                  <Mail className="h-3.5 w-3.5" />
                  {c.email}
                </a>
              </div>
              <StatusBadge status={c.status} />
            </div>

            <dl className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-4">
              <Fact label="Joined" value={fmt(c.createdAt)} />
              <Fact label="Last sign-in" value={fmt(c.lastLoginAt, true)} />
              <Fact label="Sign-in" value={<SignInBadges c={c} />} />
              <Fact
                label="Email"
                value={
                  c.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <BadgeCheck className="h-4 w-4" /> Verified
                    </span>
                  ) : (
                    <span className="text-amber-700">Not verified</span>
                  )
                }
              />
            </dl>

            {canUpdate && (
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="cust-name">Name</Label>
                    <Input id="cust-name" value={name ?? c.name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <Button
                    variant="outline"
                    disabled={name === null || name.trim() === c.name || name.trim().length < 2}
                    loading={busy === "name"}
                    onClick={() => run("name", () => api.patch(`/admin/customers/${c._id}`, { name: name?.trim() }), "Name updated").then(() => setName(null))}
                  >
                    Save
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.status === "active" ? (
                    <Button variant="outline" onClick={() => setConfirm("suspend")}>
                      <Ban className="h-4 w-4 text-red-600" /> Suspend account
                    </Button>
                  ) : (
                    <Button variant="outline" loading={busy === "activate"} onClick={() => run("activate", () => api.patch(`/admin/customers/${c._id}`, { status: "active" }), "Account re-activated")}>
                      <UserCheck className="h-4 w-4 text-emerald-600" /> Re-activate
                    </Button>
                  )}
                  <Button variant="outline" loading={busy === "revoke"} onClick={() => run("revoke", () => api.post(`/admin/customers/${c._id}/revoke-sessions`), "Signed out on all devices")}>
                    <LogOut className="h-4 w-4" /> Sign out everywhere
                  </Button>
                  {!c.emailVerified && (
                    <Button variant="outline" loading={busy === "verify"} onClick={() => run("verify", () => api.patch(`/admin/customers/${c._id}`, { emailVerified: true }), "Email marked as verified")}>
                      <ShieldCheck className="h-4 w-4" /> Mark email verified
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="ghost" className="ms-auto text-red-600 hover:bg-red-50" onClick={() => setConfirm("delete")}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  )}
                </div>
                {!c.emailVerified && (
                  <p className="text-xs text-slate-500">Only mark an email verified if you have confirmed the customer owns it – verified accounts also see guest bookings made with that address.</p>
                )}
              </div>
            )}

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Bookings ({c.bookings.length})</h3>
              {c.bookings.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No bookings yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {c.bookings.map((b) => {
                    const row = (
                      <>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900">{b.itemTitle || b.type}</span>
                          <span className="block truncate text-xs text-slate-500">
                            {b.reference} · requested {fmt(b.createdAt)}
                            {b.startDate && ` · starts ${fmt(b.startDate)}`}
                            {!b.linked && " · matched by email"}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          {b.quotedAmount !== undefined && b.quotedAmount !== null && <span className="text-xs tabular-nums text-slate-600">{formatPrice(b.quotedAmount, b.currency)}</span>}
                          <StatusBadge status={b.status} />
                        </span>
                      </>
                    );
                    return (
                      <li key={b._id}>
                        {canBookings ? (
                          <Link href={`/admin/bookings/${b._id}`} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm hover:bg-slate-50">
                            {row}
                          </Link>
                        ) : (
                          <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">{row}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirm === "suspend"}
        title="Suspend this account?"
        message={`${c?.name} will be signed out on every device and cannot sign in until re-activated. Their bookings are not affected.`}
        confirmLabel="Suspend"
        loading={busy === "suspend"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => c && run("suspend", () => api.patch(`/admin/customers/${c._id}`, { status: "suspended" }), "Account suspended")}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        title="Delete this account?"
        message={`${c?.name} (${c?.email}) will be deleted permanently. Their booking requests stay in Bookings but are no longer linked to an account.`}
        loading={busy === "delete"}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (!c) return;
          setBusy("delete");
          try {
            await api.del(`/admin/customers/${c._id}`);
            toast.success("Customer deleted");
            setConfirm(null);
            close();
            qc.removeQueries({ queryKey: ["customer", c._id] });
            await qc.invalidateQueries({ queryKey: ["customers"] });
          } catch (e) {
            toast.error(errorMessage(e));
          } finally {
            setBusy(null);
          }
        }}
      />
    </>
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
