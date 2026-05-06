import {
  Instagram, Youtube, Twitter, Globe, Music2, Image as ImageIcon,
  AtSign, Camera,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const SOCIAL_PLATFORMS = [
  "instagram", "tiktok", "youtube", "twitter", "pinterest",
  "threads", "snapchat", "website",
] as const;
export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];
export type SocialLinks = Partial<Record<SocialPlatform, string>>;

export interface PlatformMeta {
  id: SocialPlatform;
  label: string;
  prefix: string;        // What to render in the input adornment.
  placeholder: string;
  icon: LucideIcon;
  color: string;         // Tailwind text colour for the icon chip.
  bg: string;            // Tailwind bg colour for the icon chip.
  /** Build the public URL from the stored value (handle or full url). */
  toUrl: (v: string) => string;
}

const handle = (v: string) => v.replace(/^@/, "").trim();

export const PLATFORMS: Record<SocialPlatform, PlatformMeta> = {
  instagram: {
    id: "instagram",
    label: "Instagram",
    prefix: "instagram.com/",
    placeholder: "your.handle",
    icon: Instagram,
    color: "text-white",
    bg: "bg-gradient-to-br from-pink-500 via-fuchsia-500 to-orange-400",
    toUrl: (v) => `https://instagram.com/${handle(v)}`,
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    prefix: "tiktok.com/@",
    placeholder: "your.handle",
    icon: Music2,
    color: "text-white",
    bg: "bg-black",
    toUrl: (v) => `https://tiktok.com/@${handle(v)}`,
  },
  youtube: {
    id: "youtube",
    label: "YouTube",
    prefix: "youtube.com/@",
    placeholder: "yourchannel",
    icon: Youtube,
    color: "text-white",
    bg: "bg-red-600",
    toUrl: (v) => `https://youtube.com/@${handle(v)}`,
  },
  twitter: {
    id: "twitter",
    label: "X / Twitter",
    prefix: "x.com/",
    placeholder: "your_handle",
    icon: Twitter,
    color: "text-white",
    bg: "bg-neutral-900",
    toUrl: (v) => `https://x.com/${handle(v)}`,
  },
  pinterest: {
    id: "pinterest",
    label: "Pinterest",
    prefix: "pinterest.com/",
    placeholder: "your.handle",
    icon: ImageIcon,
    color: "text-white",
    bg: "bg-rose-600",
    toUrl: (v) => `https://pinterest.com/${handle(v)}`,
  },
  threads: {
    id: "threads",
    label: "Threads",
    prefix: "threads.net/@",
    placeholder: "your.handle",
    icon: AtSign,
    color: "text-white",
    bg: "bg-black",
    toUrl: (v) => `https://threads.net/@${handle(v)}`,
  },
  snapchat: {
    id: "snapchat",
    label: "Snapchat",
    prefix: "snapchat.com/add/",
    placeholder: "your.handle",
    icon: Camera,
    color: "text-black",
    bg: "bg-yellow-300",
    toUrl: (v) => `https://snapchat.com/add/${handle(v)}`,
  },
  website: {
    id: "website",
    label: "Website",
    prefix: "",
    placeholder: "https://yoursite.com",
    icon: Globe,
    color: "text-white",
    bg: "bg-gradient-to-br from-rose-500 to-violet-600",
    toUrl: (v) => (v.startsWith("http") ? v : `https://${v}`),
  },
};

const handleRegex = /^[A-Za-z0-9_.\-]{1,40}$/;

/** Returns null when valid; otherwise a human error string. */
export function validateSocialValue(p: SocialPlatform, raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (p === "website") {
    try {
      const u = new URL(v.startsWith("http") ? v : `https://${v}`);
      if (!/^https?:$/.test(u.protocol)) return "Use http(s)://";
      if (v.length > 200) return "Too long";
      return null;
    } catch { return "Not a valid URL"; }
  }
  return handleRegex.test(handle(v)) ? null : "Letters, digits, _ . or -";
}

/** Normalise to what the API expects (no @, trimmed). */
export function normaliseSocialValue(p: SocialPlatform, raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  return p === "website" ? v : handle(v);
}
