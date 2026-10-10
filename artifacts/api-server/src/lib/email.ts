import type { DigestEmailMessage } from "./digest";

// Thin email sender that POSTs directly to the Resend REST API, so no extra
// SDK dependency is required. DIGEST_FROM_EMAIL must be an address on a
// domain verified in Resend.

function requireEnv(name: "RESEND_API_KEY" | "DIGEST_FROM_EMAIL"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set to send email`);
  }
  return value;
}

export async function sendEmail(msg: DigestEmailMessage): Promise<void> {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("DIGEST_FROM_EMAIL");
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
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
