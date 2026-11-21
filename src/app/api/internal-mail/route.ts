import { createHmac, timingSafeEqual } from "node:crypto";
import nodemailer, { type Transporter } from "nodemailer";
import { z } from "zod";

/**
 * The website's only email sender. The backend never connects to SMTP: it POSTs every email here
 * (authenticated with a token derived from REVALIDATE_SECRET) and this route sends it through Titan.
 * Server environment: REVALIDATE_SECRET (same value as the backend) and SMTP_PASSWORD (Titan mailbox).
 */
export const runtime = "nodejs";

const SMTP_HOST = "smtp.titan.email";
const SMTP_PORT = 465;
const SMTP_USER = "info@srilankatoursdriver.com";
const sender = "Sri Lanka Tours Driver <info@srilankatoursdriver.com>";

const mailSchema = z.object({
  to: z.array(z.email()).min(1).max(50),
  subject: z.string().min(1),
  html: z.string(),
  text: z.string(),
  replyTo: z.email().optional(),
});

function authorized(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || secret.length < 32) return false;
  const expected = Buffer.from(`Bearer ${createHmac("sha256", secret).update("internal-mail").digest("hex")}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const pass = process.env.SMTP_PASSWORD;
  if (!pass) return null;
  transporter ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    auth: { user: SMTP_USER, pass },
  });
  return transporter;
}

/** Log only safe metadata: SMTP errors can contain credentials or message content. */
function logSmtpError(error: unknown, operation: string) {
  const e = error as { code?: unknown; responseCode?: unknown } | null;
  const code = typeof e?.code === "string" && /^[A-Z_]+$/.test(e.code) ? e.code : "UNKNOWN";
  const responseCode = typeof e?.responseCode === "number" ? e.responseCode : undefined;
  console.error(
    code === "EAUTH" || responseCode === 535 ? "Titan authentication failed: check the mailbox password and third-party access" : "Titan SMTP operation failed",
    { code, responseCode, operation },
  );
}

/** Health check used by the backend's verify:email script: Titan TLS + login, no email sent. */
export async function HEAD(request: Request) {
  if (!authorized(request)) return new Response(null, { status: 401 });
  const t = getTransporter();
  if (!t) return new Response(null, { status: 503 });
  try {
    await t.verify();
    return new Response(null, { status: 204 });
  } catch (error) {
    logSmtpError(error, "verify");
    return new Response(null, { status: 502 });
  }
}

/** 204 only when Titan accepted every recipient; the backend never retries, so partial sends are failures. */
export async function POST(request: Request) {
  if (!authorized(request)) return new Response(null, { status: 401 });

  const t = getTransporter();
  if (!t) return new Response(null, { status: 503 });

  const parsed = mailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  const mail = parsed.data;

  try {
    const result = await t.sendMail({ ...mail, from: sender });
    const accepted = new Set((result.accepted ?? []).map((a) => String(a).toLowerCase()));
    const complete = (result.rejected ?? []).length === 0 && mail.to.every((a) => accepted.has(a.toLowerCase()));
    if (!complete) {
      console.error("Titan did not accept all recipients", { accepted: accepted.size, expected: mail.to.length });
      return new Response(null, { status: 502 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    logSmtpError(error, "send");
    return new Response(null, { status: 502 });
  }
}
