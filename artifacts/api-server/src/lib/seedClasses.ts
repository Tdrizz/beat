import { db, classesTable, profilesTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { logger } from "./logger";

// Idempotent seed — populates a starter class catalog the first time the
// server boots against an empty classes table. Without this the Classes
// page is empty on a fresh deploy and the feature looks broken.
//
// All instructor profiles + cover images here intentionally span a wide
// range of skin tones, ethnicities, and aesthetics (Black, Latina, Asian,
// SWANA, white) because Beat's audience is global and the catalog is the
// first impression of who teaches here.

interface SeedInstructor {
  userId: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
}

const INSTRUCTORS: SeedInstructor[] = [
  {
    userId: "seed_creator_amara",
    handle: "amara.glow",
    displayName: "Amara Okafor",
    bio: "Editorial MUA · melanin-first techniques · Lagos / NYC.",
    avatarUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80&auto=format&fit=crop",
  },
  {
    userId: "seed_creator_isabella",
    handle: "isabella.beauty",
    displayName: "Isabella Reyes",
    bio: "Bridal & quinceañera looks · CDMX based.",
    avatarUrl: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&q=80&auto=format&fit=crop",
  },
  {
    userId: "seed_creator_mei",
    handle: "mei.flutter",
    displayName: "Mei Tanaka",
    bio: "Soft glam · douyin-style eyes · Tokyo.",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80&auto=format&fit=crop",
  },
  {
    userId: "seed_creator_zaina",
    handle: "zaina.kohl",
    displayName: "Zaina El-Sayed",
    bio: "SWANA glam · kohl, henna, and bridal · Cairo.",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&auto=format&fit=crop",
  },
  {
    userId: "seed_creator_keisha",
    handle: "keisha.studio",
    displayName: "Keisha Williams",
    bio: "Pageant + drag-grade contour · Atlanta.",
    avatarUrl: "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=400&q=80&auto=format&fit=crop",
  },
  {
    userId: "seed_creator_priya",
    handle: "priya.kajal",
    displayName: "Priya Sharma",
    bio: "South Asian bridal · kajal and gold · Mumbai / London.",
    avatarUrl: "https://images.unsplash.com/photo-1601412436009-d964bd02edbc?w=400&q=80&auto=format&fit=crop",
  },
];

// Diverse, model-forward cover imagery for each class. Sourced from
// Unsplash (free to use). Intentional mix of African American, Latina,
// Asian, SWANA, mixed-race, and white subjects.
const COVERS = {
  blackEditorial: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80&auto=format&fit=crop",
  blackBridal:    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80&auto=format&fit=crop",
  latinaSoft:     "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=800&q=80&auto=format&fit=crop",
  latinaBold:     "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&q=80&auto=format&fit=crop",
  asianDouyin:    "https://images.unsplash.com/photo-1592621385612-4d7129426394?w=800&q=80&auto=format&fit=crop",
  asianMinimal:   "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80&auto=format&fit=crop",
  swanaBridal:    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80&auto=format&fit=crop",
  southAsian:     "https://images.unsplash.com/photo-1601412436009-d964bd02edbc?w=800&q=80&auto=format&fit=crop",
  mixedParty:     "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&q=80&auto=format&fit=crop",
  drag:           "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&q=80&auto=format&fit=crop",
  pageant:        "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&q=80&auto=format&fit=crop",
  everyday:       "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80&auto=format&fit=crop",
};

interface SeedClass {
  title: string;
  description: string;
  learnings: string[];
  durationMin: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  moodTag: "everyday" | "soft" | "bold" | "editorial" | "bridal" | "drag" | "pageant" | "party";
  coverUrl: string;
  videoUrl: string | null;
  isPremium: boolean;
  instructorIndex: number;
  daysFromNow: number;
}

const CLASS_TEMPLATE: SeedClass[] = [
  {
    title: "Melanin-First Foundation Mapping",
    description: "Stop matching to your face — match to your neck. We'll map foundation, contour, and concealer for deep skin tones so your base looks like skin, not paint.",
    learnings: ["Match foundation to the neck, not the cheek", "Layering colour-correctors for hyperpigmentation", "Powder placement that won't go grey"],
    durationMin: 60, difficulty: "intermediate", moodTag: "everyday", coverUrl: COVERS.blackEditorial,
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    isPremium: false, instructorIndex: 0, daysFromNow: 1,
  },
  {
    title: "Soft Bridal Glam — Latina Edition",
    description: "A diffused-eye and lifted-cheek bridal look that photographs gorgeously in warm-toned light. Built around the natural undertones of olive and golden skin.",
    learnings: ["A 4-shadow soft halo eye", "Lip liner that flatters warm undertones", "Setting spray combos that survive a 12h day"],
    durationMin: 75, difficulty: "intermediate", moodTag: "bridal", coverUrl: COVERS.latinaSoft,
    videoUrl: null, isPremium: true, instructorIndex: 1, daysFromNow: 2,
  },
  {
    title: "Douyin-Style Glass Skin & Hover Eyes",
    description: "The viral Tokyo / Shanghai glass-skin finish, with hovering aegyo-sal under-eyes and a blurred lip.",
    learnings: ["Glass skin prep + product layering", "Aegyo-sal placement", "Blurred-lip technique without a tightline"],
    durationMin: 45, difficulty: "beginner", moodTag: "soft", coverUrl: COVERS.asianDouyin,
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    isPremium: false, instructorIndex: 2, daysFromNow: 3,
  },
  {
    title: "Kohl, Gold, and Smoke — A SWANA Bridal Eye",
    description: "Deep kohl rim, hand-applied gold pigment, and a soft smoked outer corner. Built for the warm depth of SWANA bridal photography.",
    learnings: ["Kohl rim that doesn't migrate", "Foiling gold pigment without glitter fallout", "Smoke + structure on a hooded lid"],
    durationMin: 90, difficulty: "advanced", moodTag: "bridal", coverUrl: COVERS.swanaBridal,
    videoUrl: null, isPremium: true, instructorIndex: 3, daysFromNow: 5,
  },
  {
    title: "Pageant Crown Glam, From Sketch to Stage",
    description: "Stage-lighting-ready glam. We'll sculpt for the camera, set for sweat, and finish with a lip that won't transfer onto the crown.",
    learnings: ["Stage-light contour mapping", "Long-wear base for hot lights", "Transfer-proof lip seal"],
    durationMin: 90, difficulty: "advanced", moodTag: "pageant", coverUrl: COVERS.pageant,
    videoUrl: null, isPremium: true, instructorIndex: 4, daysFromNow: 7,
  },
  {
    title: "Mumbai Bridal — Kajal, Gold Leaf & Bindi",
    description: "A festive Indian bridal eye + lip. We'll layer kajal, leaf-foil pigment, and a deep berry lip for a look that holds across the haldi → reception.",
    learnings: ["Layered kajal that frames the eye", "Gold-leaf placement on the lid", "Berry lip with crisp matte edge"],
    durationMin: 75, difficulty: "intermediate", moodTag: "bridal", coverUrl: COVERS.southAsian,
    videoUrl: null, isPremium: false, instructorIndex: 5, daysFromNow: 9,
  },
  {
    title: "5-Minute Everyday Glow",
    description: "The minimum-effort routine that still looks intentional. Tinted balm, cream blush, lash flutter — out the door.",
    learnings: ["Cream-only base finish", "One-product cheek and lip", "30-second brow comb-and-go"],
    durationMin: 20, difficulty: "beginner", moodTag: "everyday", coverUrl: COVERS.everyday,
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    isPremium: false, instructorIndex: 2, daysFromNow: 10,
  },
  {
    title: "Bold Editorial Eye on Deep Skin",
    description: "A graphic colour eye that reads true on deep skin — choosing the right pigment density and finish so the colour stays vibrant on camera.",
    learnings: ["Picking pigments that pop on deep skin", "Sharp graphic liner without a stencil", "Editorial highlight placement"],
    durationMin: 60, difficulty: "advanced", moodTag: "editorial", coverUrl: COVERS.blackBridal,
    videoUrl: null, isPremium: true, instructorIndex: 0, daysFromNow: 12,
  },
  {
    title: "Drag-Grade Contour 101",
    description: "Big, theatrical, beautiful. We'll learn the structural contour underneath every queen's mug — sized for both stage and high-def camera.",
    learnings: ["Mapping the bone structure you wish you had", "Cream → powder lock-in", "Setting under stage lights"],
    durationMin: 90, difficulty: "advanced", moodTag: "drag", coverUrl: COVERS.drag,
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    isPremium: true, instructorIndex: 4, daysFromNow: 14,
  },
  {
    title: "Latina Going-Out Glam — Bronze & Berry",
    description: "Sun-kissed bronze across the lid, lifted cheek, and a berry-stained lip. Easy 25-minute night-out face.",
    learnings: ["Bronze wash without muddiness", "Lifted blush placement", "Berry stain layering"],
    durationMin: 35, difficulty: "beginner", moodTag: "party", coverUrl: COVERS.latinaBold,
    videoUrl: null, isPremium: false, instructorIndex: 1, daysFromNow: 16,
  },
  {
    title: "Minimal Skin Finish for Asian Skin Tones",
    description: "Skin-first finishing — choosing the right under-eye depth, avoiding ash, and finding the lip stain that flatters cool and warm undertones in East Asian skin.",
    learnings: ["Under-eye colour theory", "Foundation finish for naturally smooth skin", "Lip stain harmony with undertone"],
    durationMin: 40, difficulty: "beginner", moodTag: "soft", coverUrl: COVERS.asianMinimal,
    videoUrl: null, isPremium: false, instructorIndex: 2, daysFromNow: 18,
  },
  {
    title: "Festival Glam — Mixed-Tone Glitter, Done Right",
    description: "Festival face: chunky glitter, graphic colour, and a base that won't melt in the sun. Adapted across skin tones.",
    learnings: ["Glitter adhesive without irritation", "Heat-proof base", "Removing glitter without ripping your skin"],
    durationMin: 50, difficulty: "intermediate", moodTag: "party", coverUrl: COVERS.mixedParty,
    videoUrl: null, isPremium: false, instructorIndex: 5, daysFromNow: 21,
  },
];

export async function seedClassesIfEmpty(): Promise<void> {
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(classesTable);
  if (c > 0) return;

  logger.info("Seeding starter classes + instructor profiles");

  // Insert instructor profiles first — onConflictDoNothing so we never
  // clobber a real user that happens to share a seed handle.
  await db
    .insert(profilesTable)
    .values(INSTRUCTORS.map((i) => ({
      userId: i.userId,
      handle: i.handle,
      displayName: i.displayName,
      bio: i.bio,
      avatarUrl: i.avatarUrl,
      isCreator: true,
    })))
    .onConflictDoNothing({ target: profilesTable.userId });

  // Resolve the userIds we ended up with (in case a handle collided we
  // still want to point classes at the existing profile).
  const handles = INSTRUCTORS.map((i) => i.handle);
  const placeholderRows = await Promise.all(
    handles.map((h) => db.select({ userId: profilesTable.userId, handle: profilesTable.handle }).from(profilesTable).where(eq(profilesTable.handle, h)).limit(1)),
  );
  const resolvedIds = placeholderRows.map((r, i) => r[0]?.userId ?? INSTRUCTORS[i].userId);

  const now = Date.now();
  await db.insert(classesTable).values(CLASS_TEMPLATE.map((cls) => ({
    instructorId: resolvedIds[cls.instructorIndex],
    title: cls.title,
    description: cls.description,
    learnings: cls.learnings,
    scheduledFor: new Date(now + cls.daysFromNow * 86_400_000),
    durationMin: cls.durationMin,
    difficulty: cls.difficulty,
    moodTag: cls.moodTag,
    coverUrl: cls.coverUrl,
    videoUrl: cls.videoUrl,
    isPremium: cls.isPremium,
  })));

  logger.info("Class seed complete");
}
