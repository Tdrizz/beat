// Tiny fetch wrapper. Clerk's session cookie travels automatically through
// the same-origin proxy, so we just need to set Content-Type and parse JSON.
const BASE = "/api";

async function request<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(BASE + path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") ?? "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = typeof body === "object" && body && "error" in body ? (body as { error: string }).error : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body as T;
}

export const api = {
  get: <T = unknown>(p: string) => request<T>(p),
  post: <T = unknown>(p: string, body?: unknown) =>
    request<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T = unknown>(p: string, body?: unknown) =>
    request<T>(p, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  del: <T = unknown>(p: string) => request<T>(p, { method: "DELETE" }),
};

// Shapes returned by the API. Kept loose since the social/messaging
// endpoints don't go through OpenAPI codegen (per architecture decision).
export interface Profile {
  userId: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  isCreator: boolean;
  archetype: string | null;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  caption: string | null;
  imageUrl: string;
  lookId: string | null;
  season: string | null;
  productIds: string[] | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author: Profile | null;
  likedByMe: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  website: string;
  logoUrl: string | null;
}

export interface Product {
  id: string;
  brandId: string;
  name: string;
  category: string;
  color: string | null;
  priceCents: number;
  currency: string;
  affiliateUrl: string;
  commissionBps: number | null;
  step?: string;
}

export interface Conversation {
  id: string;
  userA: string;
  userB: string;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  other: Profile | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  actorId: string | null;
  kind: "like" | "comment" | "follow" | "message" | "system" | "match";
  postId: string | null;
  conversationId: string | null;
  body: string;
  readAt: string | null;
  createdAt: string;
  actor: Profile | null;
}

export interface RemixStats {
  count: number;
  recent: Post[];
}

export interface AffiliateStatsResponse {
  totalClicks: number;
  totalEstCents: number;
  byProduct: Array<{ productId: string; c: number; product: Product | null; estCommissionCents: number }>;
  series: Array<{ day: string; c: number }>;
  days: number;
  estConversionRate: number;
}
