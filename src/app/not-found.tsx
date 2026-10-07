import Link from "next/link";

/** Fallback for URLs outside any locale (rare – the proxy normally adds a locale). */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#08261a", color: "#fff", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "4rem", margin: 0, color: "#c99a3b" }}>404</p>
          <p>Page not found</p>
          <Link href="/" style={{ color: "#dcb76a" }}>
            Home
          </Link>
        </div>
      </body>
    </html>
  );
}
