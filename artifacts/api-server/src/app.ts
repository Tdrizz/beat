import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes";
import { logger } from "./lib/logger";
import { stripeWebhookRouter } from "./lib/stripeWebhook";
import { Sentry, sentryEnabled } from "./lib/sentry";

const app: Express = express();

// We sit behind the host's reverse proxy (and, in production, a Vercel
// rewrite in front of that). Trust exactly that many hops so req.ip
// resolves to the real client IP (needed for accurate rate limiting +
// audit logs). Too low and every request shares the proxy's IP; too high
// and clients can spoof X-Forwarded-For. Verify on staging.
const trustProxyHops = Number(process.env["TRUST_PROXY_HOPS"] ?? "1");
app.set("trust proxy", Number.isInteger(trustProxyHops) && trustProxyHops >= 0 ? trustProxyHops : 1);

// Don't advertise the framework — small but free win against fingerprinting.
app.disable("x-powered-by");

// Security headers via helmet. CSP is intentionally NOT enabled here
// because the API serves JSON (not HTML) and the SPA has its own CSP
// surface; enabling a CSP for an API would only mask real issues.
// We do enable: HSTS, noSniff, frameguard, referrer policy, COOP, etc.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      includeSubDomains: true,
      preload: false,
    },
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

/**
 * CORS — lock origin to ALLOWED_ORIGINS (comma-separated full origins,
 * e.g. "https://glamr.app,https://www.glamr.app") in production. In
 * development we reflect the request origin.
 *
 * Why this matters: `origin: true` reflects ANY origin including
 * attacker-controlled domains. With `credentials: true`, that means
 * an attacker page can read authenticated responses from a victim's
 * browser. Allow-listing prevents that class of CSRF.
 */
const allowedOrigins = (process.env["ALLOWED_ORIGINS"] ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin(origin, cb) {
      // Same-origin requests (no Origin header), curl, and server-to-
      // server calls always allowed.
      if (!origin) return cb(null, true);
      if (process.env["NODE_ENV"] !== "production") return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(Object.assign(new Error("Origin not allowed by CORS policy"), { status: 403, expose: true }));
    },
  }),
);

// Stripe webhook handler must be mounted *before* express.json() so its
// internal raw-body parser can verify the request signature against the
// untouched bytes. The router itself uses express.raw() per-route.
app.use("/api", stripeWebhookRouter);
// 15mb covers full-resolution camera frames sent to /api/ai-tryon.
// Anything larger is rejected at parse time so we never allocate the
// full buffer for an oversize request.
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

/**
 * Global API rate limit (a safety net, not the per-route limit).
 *
 * Per-route limits (like the 10/5-min on /ai-tryon) are still the
 * primary defense against expensive endpoints. This guard catches
 * everything else — credential stuffing, scraping, blind enumeration,
 * and any newly-added route that forgot its own limit.
 */
app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    limit: 300, // 300 req/min per IP — generous for normal app use
    standardHeaders: "draft-7",
    legacyHeaders: false,
    // Skip preflight so the browser doesn't burn requests negotiating.
    skip: (req) => req.method === "OPTIONS",
  }),
);

app.use(clerkMiddleware());

app.use("/api", router);

// Report unhandled errors to Sentry (no-op without SENTRY_DSN), then fall
// through to the JSON handler below.
if (sentryEnabled) Sentry.setupExpressErrorHandler(app);

// Last-resort error handler: always answer JSON, never leak stack traces.
// Malformed ids (e.g. "/posts/not-a-uuid") surface from Postgres as
// invalid_text_representation (22P02); report those as 400 instead of 500.
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;
  const e = err as { status?: number; statusCode?: number; expose?: boolean; message?: string; code?: string; cause?: { code?: string } };
  if (e?.code === "22P02" || e?.cause?.code === "22P02") {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const status = e?.status ?? e?.statusCode;
  if (status && status >= 400 && status < 500) {
    res.status(status).json({ error: e.expose && e.message ? e.message : "Bad request" });
    return;
  }
  req.log?.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Something went wrong" });
});

export default app;
