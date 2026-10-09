"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, Car, Check, ChevronDown, Compass, Loader2, LogOut, Map as MapIcon, MapPin, RefreshCw, Sparkles, Users, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useCustomerAuth } from "@/lib/customer/auth";
import { useCustomerBookings, type BookingStatus, type CustomerBooking } from "@/lib/customer/bookings";
import { buttonClass, ButtonLink } from "@/components/ui/Button";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { Avatar } from "./AccountMenu";

/** Customer-facing progress: the admin's seven statuses collapse into four steps. */
const STEP_OF: Record<BookingStatus, number> = { new: 0, contacted: 1, quoted: 1, pending: 1, confirmed: 2, completed: 3, cancelled: -1 };
const STEPS = ["stepReceived", "stepReview", "stepConfirmed", "stepCompleted"] as const;

const STATUS_TONE: Record<BookingStatus, string> = {
  new: "bg-sky-50 text-sky-800 ring-sky-600/20",
  contacted: "bg-amber-50 text-amber-800 ring-amber-600/25",
  quoted: "bg-amber-50 text-amber-800 ring-amber-600/25",
  pending: "bg-amber-50 text-amber-800 ring-amber-600/25",
  confirmed: "bg-forest-50 text-forest-800 ring-forest-600/25",
  completed: "bg-forest-50 text-forest-800 ring-forest-600/25",
  cancelled: "bg-red-50 text-red-700 ring-red-600/20",
};
const TYPE_ICON = { tour: MapIcon, excursion: Compass, vehicle: Car, general: Sparkles } as const;

type Filter = "all" | "active" | "past";
const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0));
const isPast = (b: CustomerBooking) =>
  b.status === "completed" || b.status === "cancelled" || (!!b.startDate && new Date(b.endDate ?? b.startDate) < startOfToday());

/** Signed-in customer's profile and their booking requests with live status. Booking stays open to guests. */
export function AccountPanel() {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { customer, loading, logout } = useCustomerAuth();
  const [leaving, setLeaving] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const { bookings, loading: loadingBookings, error, retry } = useCustomerBookings(!!customer);

  useEffect(() => {
    if (!loading && !customer && !leaving) router.replace("/account/login?next=/account");
  }, [loading, customer, leaving, router]);

  const summary = useMemo(() => {
    const list = bookings ?? [];
    const today = startOfToday();
    return {
      total: list.length,
      upcoming: list.filter((b) => b.status === "confirmed" && b.startDate && new Date(b.startDate) >= today).length,
      inProgress: list.filter((b) => STEP_OF[b.status] === 0 || STEP_OF[b.status] === 1).length,
      completed: list.filter((b) => b.status === "completed").length,
    };
  }, [bookings]);

  const visible = useMemo(
    () => (bookings ?? []).filter((b) => (filter === "all" ? true : filter === "past" ? isPast(b) : !isPast(b))),
    [bookings, filter],
  );

  if (loading || !customer) {
    return (
      <div className="flex justify-center py-16 text-white/70" role="status">
        <Loader2 className="h-6 w-6 animate-spin" aria-label={t("loading")} />
      </div>
    );
  }

  const signOut = async () => {
    setLeaving(true);
    await logout();
    router.replace("/");
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[320px_1fr]" data-testid="account-panel">
      {/* Profile */}
      <aside className="h-fit rounded-3xl bg-white p-6 shadow-card sm:p-8 lg:sticky lg:top-28">
        <div className="flex flex-col items-center text-center">
          <Avatar customer={customer} size="lg" />
          <h1 className="mt-4 max-w-full truncate text-2xl text-forest-900">{t("hello", { name: customer.name.split(" ")[0] })}</h1>
          <p className="mt-1 max-w-full truncate text-sm text-muted">{customer.email}</p>
        </div>
        <dl className="mt-6 space-y-3 border-t border-sand-200 pt-6 text-sm">
          <ProfileRow label={t("name")} value={customer.name} />
          <ProfileRow label={t("email")} value={customer.email} />
          {customer.createdAt && <ProfileRow label={t("memberSince")} value={formatDate(customer.createdAt, locale, { month: "long", year: "numeric" })} />}
          <ProfileRow
            label={t("signInMethods")}
            value={
              <span className="flex flex-wrap justify-end gap-1.5">
                {customer.google && <span className="rounded-full bg-forest-50 px-2 py-0.5 text-xs text-forest-800">Google</span>}
                {customer.hasPassword && <span className="rounded-full bg-sand-100 px-2 py-0.5 text-xs text-earth-700">{t("password")}</span>}
              </span>
            }
          />
        </dl>
        <div className="mt-6 grid gap-2">
          <ButtonLink href="/booking" variant="primary" className="w-full">
            {tc("bookNow")}
          </ButtonLink>
          <button type="button" onClick={signOut} disabled={leaving} className={buttonClass("outline", "md", "w-full")}>
            {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            {t("signOut")}
          </button>
        </div>
      </aside>

      {/* Bookings */}
      <section className="min-w-0 rounded-3xl bg-white p-6 shadow-card sm:p-8" aria-labelledby="my-bookings">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="my-bookings" className="text-3xl text-forest-900">
              {t("myBookings")}
            </h2>
            <p className="mt-1 text-sm text-muted">{t("myBookingsIntro")}</p>
          </div>
          {bookings && bookings.length > 0 && (
            <div role="tablist" aria-label={t("myBookings")} className="flex rounded-full bg-sand-100 p-1 text-sm">
              {(["all", "active", "past"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={cn("rounded-full px-4 py-1.5 transition-colors", filter === f ? "bg-forest-800 text-white shadow-sm" : "text-earth-700 hover:text-forest-900")}
                >
                  {t(`filter_${f}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        {bookings && bookings.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={t("statTotal")} value={summary.total} />
            <Stat label={t("statInProgress")} value={summary.inProgress} />
            <Stat label={t("statUpcoming")} value={summary.upcoming} highlight />
            <Stat label={t("statCompleted")} value={summary.completed} />
          </div>
        )}

        <div className="mt-6">
          {loadingBookings ? (
            <div className="space-y-3" role="status" aria-label={t("loading")}>
              {[0, 1].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-sand-100" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              <p>{t("bookingsError")}</p>
              <button type="button" onClick={retry} className={buttonClass("outline", "sm", "mt-3")}>
                <RefreshCw className="h-4 w-4" />
                {t("retry")}
              </button>
            </div>
          ) : !bookings || bookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sand-200 bg-sand-50 px-6 py-12 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-100 text-gold-600">
                <CalendarDays className="h-6 w-6" />
              </span>
              <p className="mt-4 text-lg text-forest-900">{t("noBookings")}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{t("noBookingsHint")}</p>
              <ButtonLink href="/booking" variant="primary" className="mt-6">
                {tc("bookNow")}
              </ButtonLink>
            </div>
          ) : visible.length === 0 ? (
            <p className="rounded-2xl bg-sand-50 p-8 text-center text-sm text-muted">{t("noBookingsFilter")}</p>
          ) : (
            <ul className="space-y-4">
              {visible.map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-end font-medium text-ink">{value}</dd>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={cn("rounded-2xl p-4", highlight ? "bg-forest-800 text-white" : "bg-sand-50 text-forest-900")}>
      <p className={cn("text-xs uppercase tracking-wide", highlight ? "text-white/70" : "text-muted")}>{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const t = useTranslations("account");
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", STATUS_TONE[status])}>
      {status === "cancelled" ? <X className="h-3 w-3" /> : STEP_OF[status] >= 2 ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {t(`status_${status}`)}
    </span>
  );
}

function BookingCard({ booking: b }: { booking: CustomerBooking }) {
  const t = useTranslations("account");
  const tb = useTranslations("booking");
  const locale = useLocale();
  const Icon = TYPE_ICON[b.type] ?? Sparkles;
  const step = STEP_OF[b.status];
  const cancelled = b.status === "cancelled";
  const dates = b.startDate ? [formatDate(b.startDate, locale), b.endDate ? formatDate(b.endDate, locale) : ""].filter(Boolean).join(" – ") : "";
  const quote = b.quotedAmount !== undefined ? formatPrice(b.quotedAmount, b.currency, locale) : null;
  const history = [...b.statusHistory].reverse();

  return (
    <li className="overflow-hidden rounded-2xl border border-sand-200 transition-shadow hover:shadow-soft">
      <div className="flex flex-wrap items-start gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-sans text-base font-semibold text-forest-900">{b.itemTitle || tb(b.type)}</h3>
            <BookingStatusBadge status={b.status} />
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted">
            {b.reference} · {t("requestedOn", { date: formatDate(b.createdAt, locale) })}
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-earth-700">
            {dates && (
              <li className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-gold-600" />
                {dates}
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-gold-600" />
              {t("travellers", { adults: b.adults, children: b.children })}
            </li>
            {b.pickupLocation && (
              <li className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gold-600" />
                {b.pickupLocation}
              </li>
            )}
          </ul>
        </div>
        {quote && (
          <div className="text-end">
            <p className="text-xs uppercase tracking-wide text-muted">{t("quote")}</p>
            <p className="text-xl font-semibold text-forest-900">{quote}</p>
          </div>
        )}
      </div>

      {/* Progress tracker */}
      <div className="border-t border-sand-200 bg-sand-50 px-5 py-4">
        {cancelled ? (
          <p className="flex items-center gap-2 text-sm text-red-700">
            <X className="h-4 w-4" />
            {t("cancelledNote")}
          </p>
        ) : (
          <ol className="grid grid-cols-4" aria-label={t("progress")}>
            {STEPS.map((key, i) => {
              const done = i <= step;
              const current = i === step;
              return (
                <li key={key} className="relative flex flex-col items-center text-center" aria-current={current ? "step" : undefined}>
                  {i > 0 && <span aria-hidden className={cn("absolute end-1/2 top-3.5 h-0.5 w-full -translate-y-1/2", i <= step ? "bg-forest-600" : "bg-sand-200")} />}
                  <span
                    className={cn(
                      "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold",
                      done ? "border-forest-600 bg-forest-600 text-white" : "border-sand-200 bg-white text-muted",
                      current && "ring-4 ring-forest-600/15",
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={cn("mt-2 text-[11px] leading-tight sm:text-xs", done ? "font-medium text-forest-900" : "text-muted")}>{t(key)}</span>
                </li>
              );
            })}
          </ol>
        )}

        {history.length > 0 && (
          <details className="group mt-3">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-forest-700 hover:text-forest-900">
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
              {t("history")}
            </summary>
            <ol className="ms-1.5 mt-3 space-y-2 border-s border-sand-200 ps-4 text-xs">
              {history.map((h, i) => (
                <li key={`${h.status}-${h.changedAt}-${i}`} className="relative">
                  <span aria-hidden className="absolute -start-[21px] top-1 h-2 w-2 rounded-full bg-forest-600" />
                  <span className="font-medium text-ink">{t(`status_${h.status}`)}</span>
                  <span className="text-muted"> · {formatDate(h.changedAt, locale, { dateStyle: "medium", timeStyle: "short" })}</span>
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>
    </li>
  );
}
