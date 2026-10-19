// "use client": likes, comments and the share buttons react to clicks and need the visitor's session
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Heart, Link2, MessageCircle, Share2 } from "lucide-react";
import { API_URL } from "@/lib/config";
import { cn, formatDate } from "@/lib/utils";
import { useCustomerAuth } from "@/lib/customer/auth";
import { Link } from "@/i18n/navigation";
import { SocialIcons } from "@/components/ui/icons";

interface Comment {
  _id: string;
  authorName: string;
  text: string;
  createdAt: string;
}
interface EngagementData {
  likes: number;
  liked: boolean;
  comments: Comment[];
}

// Calls /api/customer/engagement/... with the session cookie. An expired session is refreshed once, then the call is retried.
async function engagementCall(path: string, body?: unknown): Promise<{ status: number; json: { data?: unknown; message?: string } | null }> {
  const send = () =>
    fetch(`${API_URL}/customer/engagement${path}`, {
      method: body === undefined ? "GET" : "POST",
      credentials: "include",
      headers: { accept: "application/json", ...(body !== undefined ? { "content-type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  let res = await send();
  if (res.status === 401 && body !== undefined) {
    const refreshed = await fetch(`${API_URL}/customer/auth/refresh`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: "{}" });
    if (refreshed.ok) res = await send();
  }
  return { status: res.status, json: await res.json().catch(() => null) };
}

/**
 * Like button, share buttons and the comments under a blog post (type "blog", id = slug)
 * or a guest story (type "story", id = story id). `path` is the page's locale-less path, used to come back after sign-in.
 */
export function Engagement({ type, id, title, url, path }: { type: "blog" | "story"; id: string; title: string; url: string; path: string }) {
  const t = useTranslations("community");
  const locale = useLocale();
  const { customer, loading } = useCustomerAuth();
  const key = `/${type}/${encodeURIComponent(id)}`;
  const [data, setData] = useState<EngagementData>({ likes: 0, liked: false, comments: [] });
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [text, setText] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // RELOAD likes + approved comments (used when a like fails)
  const load = useCallback(async () => {
    try {
      const res = await engagementCall(key);
      if (res.status === 200 && res.json?.data) setData(res.json.data as EngagementData);
    } catch {
      // API unreachable: the page still reads fine without likes and comments
    }
  }, [key]);

  // LOAD on first view, and again after sign-in so "liked" is right
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    engagementCall(key)
      .then((res) => {
        if (!cancelled && res.status === 200 && res.json?.data) setData(res.json.data as EngagementData);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [key, loading, customer]);

  // LIKE / UNLIKE (the count changes at once, then follows the server's answer)
  async function toggleLike() {
    if (!customer || busy) return;
    setBusy(true);
    setData((d) => ({ ...d, liked: !d.liked, likes: d.likes + (d.liked ? -1 : 1) }));
    try {
      const res = await engagementCall(`${key}/like`, {});
      if (res.status === 200 && res.json?.data) setData((d) => ({ ...d, ...(res.json!.data as { liked: boolean; likes: number }) }));
      else await load();
    } catch {
      await load();
    } finally {
      setBusy(false);
    }
  }

  // SHARE: the phone's own share sheet when there is one, else copy the link
  async function share() {
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    await copyLink();
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked: nothing to do
    }
  }

  // COMMENT: sent for approval, so it does not appear in the list straight away
  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!customer || busy || text.trim().length < 2) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await engagementCall(`${key}/comments`, { text: text.trim() });
      if (res.status === 201) {
        setText("");
        setNotice({ ok: true, text: t("commentPending") });
      } else {
        setNotice({ ok: false, text: res.status === 429 ? t("commentTooMany") : t("commentError") });
      }
    } catch {
      setNotice({ ok: false, text: t("commentError") });
    } finally {
      setBusy(false);
    }
  }

  const encoded = encodeURIComponent(url);
  const shareLinks = [
    { key: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`, Icon: SocialIcons.facebook },
    { key: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, Icon: SocialIcons.whatsapp },
    { key: "x", label: "X", href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodeURIComponent(title)}`, Icon: SocialIcons.twitter },
  ];
  const signInHref = `/account/login?next=${encodeURIComponent(`${path}#comments`)}`;

  return (
    <section className="mt-12 border-t border-sand-200 pt-8" aria-label={t("engagementLabel")}>
      {/* LIKE + SHARE BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {customer ? (
          <button
            type="button"
            onClick={toggleLike}
            disabled={busy}
            aria-pressed={data.liked}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-colors",
              data.liked ? "border-rose-200 bg-rose-50 text-rose-700" : "border-sand-200 bg-white text-forest-800 hover:border-forest-800",
            )}
          >
            <Heart className={cn("h-5 w-5 transition-transform", data.liked && "scale-110 fill-current")} aria-hidden />
            {t("likes", { count: data.likes })}
          </button>
        ) : (
          <Link href={signInHref} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-sand-200 bg-white px-5 py-2 text-sm font-medium text-forest-800 hover:border-forest-800">
            <Heart className="h-5 w-5" aria-hidden />
            {t("likes", { count: data.likes })}
          </Link>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="me-1 text-sm text-muted">{t("share")}</span>
          {shareLinks.map(({ key: network, label, href, Icon }) => (
            <a
              key={network}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("shareOn", { network: label })}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-sand-200 bg-white text-forest-800 transition-colors hover:border-gold-500 hover:bg-gold-500 hover:text-forest-950"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
          <button
            type="button"
            onClick={copyLink}
            aria-label={t("copyLink")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-sand-200 bg-white text-forest-800 transition-colors hover:border-gold-500 hover:bg-gold-500 hover:text-forest-950"
          >
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={share}
            aria-label={t("share")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-forest-800 text-white transition-colors hover:bg-forest-700 sm:hidden"
          >
            <Share2 className="h-4 w-4" aria-hidden />
          </button>
          {/* Screen readers hear when the link was copied */}
          <span className="sr-only" aria-live="polite">{copied ? t("linkCopied") : ""}</span>
        </div>
      </div>

      {/* COMMENTS */}
      <div id="comments" className="mt-12 scroll-mt-28">
        <h2 className="flex items-center gap-2 text-2xl text-forest-900">
          <MessageCircle className="h-6 w-6 text-gold-600" aria-hidden />
          {t("comments", { count: data.comments.length })}
        </h2>

        {data.comments.length > 0 ? (
          <ul className="mt-6 space-y-4">
            {data.comments.map((comment) => (
              <li key={comment._id} className="flex gap-4 rounded-2xl bg-white p-5 shadow-card">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-800 font-display text-lg text-gold-400" aria-hidden>
                  {comment.authorName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold text-forest-900">{comment.authorName}</span>{" "}
                    <time dateTime={comment.createdAt} className="text-muted">· {formatDate(comment.createdAt, locale, { dateStyle: "medium" })}</time>
                  </p>
                  <p className="mt-1 whitespace-pre-line break-words text-ink/90">{comment.text}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-muted">{t("noComments")}</p>
        )}

        {/* WRITE A COMMENT (signed-in guests), or a sign-in link */}
        {customer ? (
          <form onSubmit={submitComment} className="mt-8 rounded-2xl border border-sand-200 bg-white p-5">
            <label htmlFor="comment-text" className="text-sm font-medium text-forest-900">
              {t("commentAs", { name: customer.name })}
            </label>
            <textarea
              id="comment-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
              rows={4}
              required
              minLength={2}
              className="mt-2 w-full rounded-xl border border-sand-200 bg-sand-50 p-3 text-ink focus:border-forest-600 focus:outline-none"
              placeholder={t("commentPlaceholder")}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted">{t("commentModeration")}</p>
              <button type="submit" disabled={busy || text.trim().length < 2} className="rounded-full bg-gold-500 px-6 py-2.5 text-sm font-medium text-forest-950 transition-colors hover:bg-gold-400 disabled:opacity-60">
                {t("postComment")}
              </button>
            </div>
            {notice && (
              <p role="status" className={cn("mt-3 text-sm", notice.ok ? "text-forest-700" : "text-red-700")}>
                {notice.text}
              </p>
            )}
          </form>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-gold-200 bg-white/70 p-5 text-center text-sm text-muted">
            <Link href={signInHref} className="font-semibold text-forest-800 underline underline-offset-4">
              {t("signInToComment")}
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
