// "use client": the form uploads files, shows previews and needs the visitor's session
"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, Loader2, Play, X } from "lucide-react";
import { API_URL } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useCustomerAuth } from "@/lib/customer/auth";
import { Link } from "@/i18n/navigation";
import type { MediaAsset, Story } from "@/types/cms";

const MAX_FILES = 6;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm";

interface Item {
  id: string;
  name: string;
  preview: string;
  isVideo: boolean;
  status: "uploading" | "done" | "error";
  asset?: MediaAsset;
}

// Sends a request to /api/customer/... with the session cookie; an expired session is refreshed once and retried
async function customerFetch(path: string, init: () => RequestInit): Promise<Response> {
  const send = () => fetch(`${API_URL}/customer${path}`, { credentials: "include", ...init() });
  const res = await send();
  if (res.status !== 401) return res;
  const refreshed = await fetch(`${API_URL}/customer/auth/refresh`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: "{}" });
  return refreshed.ok ? send() : res;
}

/** "Share your story" form for signed-in guests: title, place, text, photos and one short video. */
export function StoryForm() {
  const t = useTranslations("stories");
  const { customer, loading } = useCustomerAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [text, setText] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [mine, setMine] = useState<Story[]>([]);

  // YOUR STORIES (with their status), loaded once signed in and again after sending one
  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    customerFetch("/stories", () => ({ headers: { accept: "application/json" } }))
      .then((res) => res.json())
      .then((json: { data?: Story[] }) => {
        if (!cancelled && Array.isArray(json.data)) setMine(json.data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [customer, sent]);

  // Free the preview URLs when the form goes away
  const previews = useRef<string[]>([]);
  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), []);

  // ADD FILES: check them here first, then upload each one straight away
  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    setError("");
    let videos = items.filter((i) => i.isVideo).length;
    const accepted: { file: File; item: Item }[] = [];
    for (const file of files) {
      const isVideo = file.type.startsWith("video/");
      if (items.length + accepted.length >= MAX_FILES) {
        setError(t("tooManyFiles"));
        break;
      }
      if (isVideo && videos >= 1) {
        setError(t("oneVideo"));
        continue;
      }
      if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) {
        setError(t("fileTooBig", { name: file.name }));
        continue;
      }
      if (isVideo) videos += 1;
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      accepted.push({ file, item: { id: crypto.randomUUID(), name: file.name, preview, isVideo, status: "uploading" } });
    }
    if (!accepted.length) return;
    setItems((current) => [...current, ...accepted.map((a) => a.item)]);
    for (const { file, item } of accepted) void upload(file, item.id);
  }

  async function upload(file: File, id: string) {
    try {
      const res = await customerFetch("/stories/upload", () => {
        const body = new FormData();
        body.append("file", file);
        return { method: "POST", body };
      });
      const json = (await res.json().catch(() => null)) as { data?: MediaAsset; message?: string } | null;
      if (res.status !== 201 || !json?.data) throw new Error(json?.message ?? "upload failed");
      setItems((current) => current.map((i) => (i.id === id ? { ...i, status: "done", asset: json.data } : i)));
    } catch (err) {
      setItems((current) => current.map((i) => (i.id === id ? { ...i, status: "error" } : i)));
      setError(err instanceof Error && err.message !== "upload failed" ? err.message : t("uploadError", { name: file.name }));
    }
  }

  function remove(id: string) {
    setItems((current) => current.filter((i) => i.id !== id));
  }

  // SEND: only finished uploads go with the story
  async function submit(event: FormEvent) {
    event.preventDefault();
    const media = items.filter((i) => i.status === "done" && i.asset).map((i) => i.asset!);
    if (!media.length) {
      setError(t("needMedia"));
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await customerFetch("/stories", () => ({
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ title: title.trim(), place: place.trim() || undefined, text: text.trim(), media }),
      }));
      if (res.status === 201) {
        setSent(true);
        setTitle("");
        setPlace("");
        setText("");
        setItems([]);
      } else {
        setError(res.status === 429 ? t("tooManyPending") : t("submitError"));
      }
    } catch {
      setError(t("submitError"));
    } finally {
      setSending(false);
    }
  }

  // NOT SIGNED IN: explain why an account is needed
  if (loading) return <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-soft" aria-hidden />;
  if (!customer) {
    const next = encodeURIComponent("/stories/new");
    return (
      <div className="rounded-3xl border border-dashed border-gold-200 bg-surface/70 p-8 text-center shadow-soft">
        <p className="text-muted">{t("signInIntro")}</p>
        <Link href={`/account/login?next=${next}`} className="mt-5 inline-flex rounded-full bg-gold-500 px-6 py-3 text-sm font-medium text-forest-950 hover:bg-gold-400">
          {t("signInToShare")}
        </Link>
      </div>
    );
  }

  const uploading = items.some((i) => i.status === "uploading");
  const field = "mt-2 w-full rounded-xl border border-sand-200 bg-sand-50 p-3 text-ink focus:border-forest-600 focus:outline-none";

  return (
    <div className="space-y-10">
      {sent ? (
        // THANK YOU
        <div role="status" className="rounded-3xl bg-forest-800 p-8 text-center text-white shadow-card">
          <p className="text-lead">{t("submitted")}</p>
          <button type="button" onClick={() => setSent(false)} className="mt-5 rounded-full border border-white/50 px-6 py-2.5 text-sm hover:bg-surface hover:text-heading">
            {t("writeAnother")}
          </button>
        </div>
      ) : (
        // THE FORM
        <form onSubmit={submit} className="space-y-6 rounded-3xl bg-surface p-6 shadow-card sm:p-8">
          <div>
            <label htmlFor="story-title" className="text-sm font-medium text-heading">{t("titleLabel")}</label>
            <input id="story-title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={140} placeholder={t("titlePlaceholder")} className={field} />
          </div>
          <div>
            <label htmlFor="story-place" className="text-sm font-medium text-heading">{t("placeLabel")}</label>
            <input id="story-place" value={place} onChange={(e) => setPlace(e.target.value)} maxLength={120} placeholder={t("placePlaceholder")} className={field} />
          </div>
          <div>
            <label htmlFor="story-text" className="text-sm font-medium text-heading">{t("textLabel")}</label>
            <textarea id="story-text" value={text} onChange={(e) => setText(e.target.value)} required minLength={20} maxLength={5000} rows={7} placeholder={t("textPlaceholder")} className={field} />
          </div>

          {/* PHOTOS AND VIDEO: previews with upload state and a remove button */}
          <div>
            <p className="text-sm font-medium text-heading">{t("mediaLabel")}</p>
            <p className="mt-1 text-xs text-muted">{t("mediaHint")}</p>
            <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {items.map((item) => (
                <li key={item.id} className={cn("relative aspect-square overflow-hidden rounded-xl bg-sand-100", item.status === "error" && "ring-2 ring-red-500")}>
                  {item.isVideo ? (
                    <>
                      <video src={item.preview} muted playsInline className="h-full w-full object-cover" />
                      <Play className="absolute inset-0 m-auto h-8 w-8 fill-white text-white drop-shadow" aria-hidden />
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- local preview of a file that is not uploaded yet
                    <img src={item.preview} alt={item.name} className="h-full w-full object-cover" />
                  )}
                  {item.status === "uploading" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-forest-950/50 text-white">
                      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                      <span className="sr-only">{t("uploading")}</span>
                    </span>
                  )}
                  <button type="button" onClick={() => remove(item.id)} aria-label={`${t("remove")} ${item.name}`} className="absolute end-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-forest-950/70 text-white hover:bg-forest-950">
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
              {items.length < MAX_FILES && (
                <li>
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gold-200 text-xs text-brand transition-colors hover:border-gold-500 hover:bg-gold-100"
                  >
                    <ImagePlus className="h-6 w-6 text-gold-600" aria-hidden />
                    {t("addMedia")}
                  </button>
                </li>
              )}
            </ul>
            <input ref={fileInput} type="file" accept={ACCEPT} multiple onChange={addFiles} className="sr-only" tabIndex={-1} aria-hidden />
          </div>

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={sending || uploading} className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-7 py-3 font-medium text-forest-950 transition-colors hover:bg-gold-400 disabled:opacity-60">
            {(sending || uploading) && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {sending ? t("submitting") : uploading ? t("uploading") : t("submit")}
          </button>
        </form>
      )}

      {/* YOUR STORIES and whether they are published yet */}
      {mine.length > 0 && (
        <section>
          <h2 className="text-2xl text-heading">{t("myStories")}</h2>
          <ul className="mt-4 divide-y divide-sand-200 rounded-2xl bg-surface shadow-card">
            {mine.map((story) => (
              <li key={story._id} className="flex items-center justify-between gap-4 p-4 text-sm">
                {story.status === "published" ? (
                  <Link href={`/stories/${story._id}`} className="font-medium text-heading hover:underline">{story.title}</Link>
                ) : (
                  <span className="font-medium text-heading">{story.title}</span>
                )}
                <span
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                    story.status === "published" ? "bg-forest-50 text-brand-soft" : story.status === "rejected" ? "bg-red-50 text-red-700" : "bg-gold-100 text-earth-700",
                  )}
                >
                  {t(`status_${story.status ?? "pending"}`)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
