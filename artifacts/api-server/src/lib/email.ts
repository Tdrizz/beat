import type { DigestEmailMessage } from "./digest";

// Thin email sender built on the Replit-managed Resend connector. We read the
// API key from the connector credential proxy at call time (never cached —
// tokens rotate) and POST directly to the Resend REST API, so no extra SDK
// dependency is required.

interface ResendConnection {
  apiKey: string;
  fromEmail?: string;
}

async function getResendConnection(): Promise<ResendConnection> {
  // Direct API key (set as a secret) takes precedence over the managed
  // connector, so the digest works whether or not Resend was connected
  // through Replit's integration flow.
  const directKey = process.env.RESEND_API_KEY;
  if (directKey) {
    return { apiKey: directKey, fromEmail: process.env.DIGEST_FROM_EMAIL };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? `repl ${process.env.REPL_IDENTITY}`
    : process.env.WEB_REPL_RENEWAL
      ? `depl ${process.env.WEB_REPL_RENEWAL}`
      : null;
  if (!hostname || !xReplitToken) {
    throw new Error(
      "Resend integration not provisioned (missing connector env). Connect Resend first.",
    );
  }
  const resp = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=resend`,
    { headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken } },
  );
  if (!resp.ok) {
    throw new Error(`Resend connector lookup failed (${resp.status}).`);
  }
  const data = (await resp.json()) as {
    items?: Array<{ settings?: Record<string, unknown> }>;
  };
  const settings = data.items?.[0]?.settings ?? {};
  const apiKey = (settings["api_key"] ?? settings["apiKey"]) as string | undefined;
  if (!apiKey) {
    throw new Error("Resend not connected (no api_key in connector settings).");
  }
  const fromEmail = (settings["from_email"] ?? settings["fromEmail"]) as
    | string
    | undefined;
  return { apiKey, fromEmail };
}

// Sender address. Prefer an explicit env override, then whatever the connector
// reports, then Resend's shared onboarding sender (only delivers to the
// account owner until a custom domain is verified).
function fromAddress(connectionFrom: string | undefined): string {
  return (
    process.env.DIGEST_FROM_EMAIL ??
    connectionFrom ??
    "Glamr <onboarding@resend.dev>"
  );
}

export async function sendEmail(msg: DigestEmailMessage): Promise<void> {
  const conn = await getResendConnection();
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${conn.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(conn.fromEmail),
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      headers: msg.headers,
    }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Resend send failed (${resp.status}): ${body.slice(0, 300)}`);
  }
}
