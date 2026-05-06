import type { ArchetypeId } from "./archetypes";
import { ARCHETYPE_LIST } from "./archetypes";

/**
 * 5-question quiz that maps each answer to a single archetype. The
 * highest-scoring archetype wins; ties are broken by the order answers
 * were given (earlier answers weigh slightly more — first-impression
 * bias is good for personality quizzes since people second-guess later
 * answers). Five questions is the sweet spot — enough to separate six
 * buckets confidently, short enough that nobody bails halfway.
 */
export interface QuizAnswer {
  label: string;
  archetype: ArchetypeId;
  /** Optional sensory cue we render inside the option chip. */
  emoji?: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  /** Sub-prompt — sets the imaginative scene for the answers. */
  hint?: string;
  answers: QuizAnswer[];
}

export const ARCHETYPE_QUIZ: QuizQuestion[] = [
  {
    id: "saturday-night",
    prompt: "Pick a Saturday night.",
    hint: "First instinct — don't overthink it.",
    answers: [
      { label: "Candle-lit dinner with someone you adore", archetype: "romantic", emoji: "🕯️" },
      { label: "A sweaty underground concert", archetype: "rebel", emoji: "🎸" },
      { label: "Gallery opening, then late-night noodles", archetype: "muse", emoji: "🖼️" },
      { label: "A rooftop bar in the dress", archetype: "siren", emoji: "🍷" },
      { label: "Black-tie gala — you're seated front of room", archetype: "icon", emoji: "👑" },
      { label: "Hike at golden hour, picnic basket in hand", archetype: "naturalist", emoji: "🌿" },
    ],
  },
  {
    id: "wardrobe",
    prompt: "Your wardrobe's hero piece.",
    answers: [
      { label: "A silk slip dress in oyster pink", archetype: "romantic", emoji: "👗" },
      { label: "A perfectly cut leather jacket", archetype: "rebel", emoji: "🧥" },
      { label: "A vintage kimono you found abroad", archetype: "muse", emoji: "🪡" },
      { label: "A black dress that fits like a glove", archetype: "siren", emoji: "🖤" },
      { label: "A camel cashmere coat — investment piece", archetype: "icon", emoji: "🧣" },
      { label: "A linen set, lived-in and lovely", archetype: "naturalist", emoji: "👕" },
    ],
  },
  {
    id: "scent",
    prompt: "If you were a fragrance…",
    answers: [
      { label: "Rose, vanilla, a smudge of musk", archetype: "romantic", emoji: "🌹" },
      { label: "Smoke, leather, a sliver of oud", archetype: "rebel", emoji: "🔥" },
      { label: "Iris, sandalwood, something hard to name", archetype: "muse", emoji: "🌌" },
      { label: "Tuberose, amber, warm skin", archetype: "siren", emoji: "✨" },
      { label: "Cedar, jasmine, neroli — composed", archetype: "icon", emoji: "🥂" },
      { label: "Citrus, white tea, salt air", archetype: "naturalist", emoji: "🍋" },
    ],
  },
  {
    id: "art",
    prompt: "Pick a soundtrack for your week.",
    answers: [
      { label: "Indie folk and slow piano", archetype: "romantic", emoji: "🎹" },
      { label: "Punk, industrial, anything loud", archetype: "rebel", emoji: "📢" },
      { label: "World fusion, ambient, jazz remix", archetype: "muse", emoji: "🎷" },
      { label: "Sultry R&B, a little Sade", archetype: "siren", emoji: "🎤" },
      { label: "Jazz standards, classical strings", archetype: "icon", emoji: "🎻" },
      { label: "Acoustic, lo-fi, something gentle", archetype: "naturalist", emoji: "🌾" },
    ],
  },
  {
    id: "philosophy",
    prompt: "Your makeup philosophy in one sentence.",
    answers: [
      { label: "Soften everything — I want to glow.", archetype: "romantic", emoji: "💗" },
      { label: "Break a rule. On purpose.", archetype: "rebel", emoji: "💥" },
      { label: "Treat my face like a canvas.", archetype: "muse", emoji: "🎨" },
      { label: "If it's not powerful, why bother.", archetype: "siren", emoji: "💋" },
      { label: "Polished. Intentional. Forever.", archetype: "icon", emoji: "💎" },
      { label: "My skin, just on a really good day.", archetype: "naturalist", emoji: "🌞" },
    ],
  },
];

/**
 * Score answers and return the winning archetype. Earlier answers get
 * marginally higher weight to reflect first-impression dominance and to
 * avoid the "I changed my mind on Q5" tie-breaker problem.
 */
export function scoreQuiz(
  answers: Array<ArchetypeId | null>,
): ArchetypeId {
  const scores = new Map<ArchetypeId, number>();
  for (const a of ARCHETYPE_LIST) scores.set(a.id, 0);
  answers.forEach((arch, idx) => {
    if (!arch) return;
    const weight = 1 + (ARCHETYPE_QUIZ.length - idx) * 0.05; // 1.25 → 1.05
    scores.set(arch, (scores.get(arch) ?? 0) + weight);
  });
  let bestId: ArchetypeId = "naturalist";
  let bestScore = -Infinity;
  for (const [id, s] of scores) {
    if (s > bestScore) {
      bestScore = s;
      bestId = id;
    }
  }
  return bestId;
}
