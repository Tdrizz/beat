import { Look } from "./looks";

// ── Season detection ──────────────────────────────────────────────────────────

export type Season = "Spring" | "Summer" | "Autumn" | "Winter";

export function getSeason(date: Date = new Date()): Season {
  const m = date.getMonth() + 1; // 1-12
  if (m >= 3 && m <= 5) return "Spring";
  if (m >= 6 && m <= 8) return "Summer";
  if (m >= 9 && m <= 11) return "Autumn";
  return "Winter";
}

// ── Day messages ─────────────────────────────────────────────────────────────

const DAY_MESSAGES: Record<number, { greeting: string; sub: string }> = {
  0: { greeting: "Sunday Reset",      sub: "Sundays are for self-care, stillness, and something soft." },
  1: { greeting: "Monday Power",       sub: "Start the week looking like you absolutely mean it." },
  2: { greeting: "Tuesday Energy",     sub: "Two days in — keep your momentum glowing." },
  3: { greeting: "Wednesday Drama",    sub: "The middle of the week deserves something extra." },
  4: { greeting: "Thursday Warmth",    sub: "Almost the weekend — begin celebrating early." },
  5: { greeting: "Friday Iconic",      sub: "It's Friday. Tonight belongs to you. Make it unforgettable." },
  6: { greeting: "Saturday Artistry",  sub: "No schedule, no rules — just pure creative freedom." },
};

// ── Seasonal look ID pools ────────────────────────────────────────────────────

const SEASONAL_POOLS: Record<Season, string[]> = {
  Spring: [
    "trend-cottagecore",
    "trend-clean-girl",
    "trend-ballet-core",
    "trend-glass-skin",
    "trend-soft-glam",
    "trend-no-makeup",
    "trend-indie-softgirl",
    "trend-bridal",
    "lip-cherry-bomb",
    "lip-strawberry",
    "eye-fairy",
    "trend-old-money",
    "lip-popsicle",
    "eye-doe",
  ],
  Summer: [
    "trend-festival",
    "trend-mermaid",
    "trend-hard-glam",
    "trend-night-out",
    "eye-chrome",
    "lip-popsicle",
    "lip-cold-girl",
    "trend-glass-skin",
    "eye-editorial-color",
    "trend-mob-wife",
    "eye-butterfly",
    "lip-strawberry",
    "trend-avant-garde",
    "lip-cherry-bomb",
  ],
  Autumn: [
    "trend-dark-academia",
    "trend-grunge",
    "trend-mob-wife",
    "trend-siren",
    "lip-warm-brown",
    "eye-foxy",
    "eye-arabic-kohl",
    "trend-old-money",
    "trend-y2k",
    "lip-french-blurred",
    "trend-office",
    "era-1970s-natural",
    "era-1940s-pin-up",
    "lip-orchid",
  ],
  Winter: [
    "trend-goth",
    "trend-ballet-core",
    "trend-glass-skin",
    "lip-whisper-pink",
    "eye-fairy",
    "trend-siren",
    "trend-dark-academia",
    "eye-arabic-kohl",
    "lip-orchid",
    "era-1920s-flapper",
    "trend-avant-garde",
    "eye-chrome",
    "lip-cold-girl",
    "trend-night-out",
  ],
};

// ── Season palette & theme ────────────────────────────────────────────────────

export const SEASON_THEME: Record<Season, {
  gradient: string;
  badge: string;
  badgeText: string;
  emoji: string;
}> = {
  Spring: {
    gradient: "linear-gradient(135deg, #f8e8f0 0%, #f0d8e8 40%, #e8f0e0 100%)",
    badge: "#e8b0d0",
    badgeText: "#6a2848",
    emoji: "🌸",
  },
  Summer: {
    gradient: "linear-gradient(135deg, #fff8d0 0%, #ffe8a0 40%, #ffc880 100%)",
    badge: "#f0c840",
    badgeText: "#5a3800",
    emoji: "☀️",
  },
  Autumn: {
    gradient: "linear-gradient(135deg, #f8ead0 0%, #e8c088 40%, #c87840 100%)",
    badge: "#c87840",
    badgeText: "#ffffff",
    emoji: "🍂",
  },
  Winter: {
    gradient: "linear-gradient(135deg, #e8f0f8 0%, #d0e0f0 40%, #b8d0e8 100%)",
    badge: "#8098c0",
    badgeText: "#ffffff",
    emoji: "❄️",
  },
};

// ── Motivation quotes by season ───────────────────────────────────────────────

const SEASON_QUOTES: Record<Season, string[]> = {
  Spring: [
    "Bloom where you're planted — and do it in colour.",
    "Spring is nature's way of saying: let's start over beautifully.",
    "Petals, pastels, and a whole new chapter.",
    "Everything is waking up. So are you.",
    "You are your own wildflower.",
    "Fresh starts begin with a fresh face.",
    "The world is flowering. Meet it halfway.",
  ],
  Summer: [
    "Golden hour is a state of mind.",
    "You were made for this light.",
    "Heat, colour, and no apologies.",
    "Sun-kissed and fully alive.",
    "This summer belongs to you.",
    "Bright days call for brighter lips.",
    "Soak it in. Every luminous second.",
  ],
  Autumn: [
    "There is beauty in the falling — and power in the staying.",
    "Autumn: the season that taught leaves to let go beautifully.",
    "Rich, warm, and absolutely in your element.",
    "The best thing about autumn is how gorgeous the transition is.",
    "Earthy, grounded, magnetic.",
    "Darkness has never looked this good on you.",
    "Crisp mornings, velvet evenings, and you — in the middle.",
  ],
  Winter: [
    "Ice doesn't dull diamonds.",
    "The coldest months belong to the boldest faces.",
    "Winter is quiet. Your look doesn't have to be.",
    "Porcelain and power.",
    "In the stillness of winter, be the thing that glows.",
    "Bold, cool, and entirely composed.",
    "The world goes pale. You don't.",
  ],
};

// ── Main function ─────────────────────────────────────────────────────────────

export interface DailyBeat {
  look: Look | null;
  season: Season;
  dayMessage: { greeting: string; sub: string };
  quote: string;
  dateLabel: string;
}

export function getDailyBeat(allLooks: Look[], date: Date = new Date()): DailyBeat {
  const season = getSeason(date);
  const dayOfWeek = date.getDay(); // 0 = Sunday
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000
  );

  // Build look pool: seasonal picks first, then fallback to full list
  const pool = SEASONAL_POOLS[season];
  const poolLooks: Look[] = [];
  for (const id of pool) {
    const found = allLooks.find(l => l.id === id);
    if (found) poolLooks.push(found);
  }
  // Pad with the rest if the pool is short
  const fallback = allLooks.filter(l => !pool.includes(l.id));
  const combinedPool = [...poolLooks, ...fallback];

  // Deterministic pick: use the day-of-year so it changes daily
  const look = combinedPool.length > 0
    ? combinedPool[dayOfYear % combinedPool.length]
    : null;

  // Day message
  const dayMessage = DAY_MESSAGES[dayOfWeek];

  // Quote: pick based on day-of-week within season pool
  const quotes = SEASON_QUOTES[season];
  const quote = quotes[dayOfWeek % quotes.length];

  // Date label
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return { look, season, dayMessage, quote, dateLabel };
}
