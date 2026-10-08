"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";

/** Public OAuth client ID – must match GOOGLE_CLIENT_ID in the backend. Unset hides the button. */
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

interface GoogleId {
  initialize(opts: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: "popup"; use_fedcm_for_button?: boolean }): void;
  renderButton(el: HTMLElement, opts: Record<string, string | number>): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Google script failed to load"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** Google Identity Services button; hands the signed ID token to `onCredential` for the API to verify. */
export function GoogleSignInButton({ onCredential, onError }: { onCredential: (credential: string) => void; onError: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  // Keep the latest callbacks without re-rendering Google's button on every render.
  const handlers = useRef({ onCredential, onError });
  useEffect(() => {
    handlers.current = { onCredential, onError };
  });

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        const el = ref.current;
        const gid = window.google?.accounts.id;
        if (cancelled || !el || !gid) return;
        gid.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: "popup",
          use_fedcm_for_button: true,
          callback: (r) => (r.credential ? handlers.current.onCredential(r.credential) : handlers.current.onError()),
        });
        gid.renderButton(el, { type: "standard", theme: "outline", size: "large", shape: "pill", text: "continue_with", width: Math.min(el.offsetWidth || 360, 400), locale });
      })
      .catch(() => !cancelled && handlers.current.onError());
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (!GOOGLE_CLIENT_ID) return null;
  return <div ref={ref} className="flex min-h-11 w-full justify-center" data-testid="google-signin" />;
}
