// Tiny fetch wrapper. Clerk's session cookie travels automatically through
// the same-origin proxy, so we just need to set Content-Type and parse JSON.
const BASE = "/api";

/** Thrown for non-2xx responses; keeps the status and parsed body. */
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly body: unknown) {
    super(message);
    this.name = "ApiError";
  }

  /** The API's machine-readable `code`, when it sent one. */
  get code(): string | undefined {
    const b = this.body as { code?: unknown } | null;
    return b && typeof b === "object" && typeof b.code === "string" ? b.code : undefined;
  }
}

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
    throw new ApiError(msg, res.status, body);
  }
  return body as T;
}

export const api = {
  get: <T = unknown>(p: string) => request<T>(p),
  post: <T = unknown>(p: string, body?: unknown) =>
    request<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T = unknown>(p: string, body?: unknown) =>
    request<T>(p, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  del: <T = unknown>(p: string, body?: unknown) =>
    request<T>(p, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
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
  socialLinks: Partial<Record<
    "instagram" | "tiktok" | "youtube" | "twitter" | "pinterest" | "threads" | "snapchat" | "website",
    string
  >> | null;
  createdAt: string;
  /** Set on GET /profiles/:handle when the viewer has blocked this user. */
  blockedByMe?: boolean;
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
  imageUrl: string | null;
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

/* Profile + aggregate follower count, returned by Friends / Discover /
 * Featured endpoints. `followedAt` is only present on the friends list. */
export interface ProfileWithFollowers extends Profile {
  followerCount: number;
  followedAt?: string;
}

export const CLASS_DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type ClassDifficulty = typeof CLASS_DIFFICULTIES[number];
export const CLASS_MOODS = ["everyday", "soft", "bold", "editorial", "bridal", "drag", "pageant", "party"] as const;
export type ClassMood = typeof CLASS_MOODS[number];

export interface ClassRow {
  id: string;
  instructorId: string;
  title: string;
  description: string;
  learnings: string[];
  scheduledFor: string;
  durationMin: number;
  difficulty: ClassDifficulty;
  moodTag: ClassMood;
  coverUrl: string | null;
  videoUrl: string | null;
  isPremium: boolean;
  status: string;
  createdAt: string;
  instructor: Profile | null;
  reservationCount: number;
  reservedByMe: boolean;
  canWatch: boolean;
}

export interface PremiumStatus {
  active: boolean;
  until: string | null;
}

/* A saved makeup-look + wig pairing, scoped to the signed-in user.
 * `wigStyleId` of "none" means own hair, in which case `wigColorId` is null. */
export interface SavedCombo {
  id: string;
  userId: string;
  lookId: string;
  wigStyleId: string;
  wigColorId: string | null;
  intensity: number;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface AffiliateStatsResponse {
  totalClicks: number;
  totalEstCents: number;
  byProduct: Array<{ productId: string; c: number; product: Product | null; estCommissionCents: number }>;
  series: Array<{ day: string; c: number }>;
  days: number;
  estConversionRate: number;
}
