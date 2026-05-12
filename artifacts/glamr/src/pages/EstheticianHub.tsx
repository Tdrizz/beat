import { motion } from "framer-motion";
import { Crown, Star, MapPin, Calendar, ExternalLink, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

interface Esthetician {
  id: string;
  name: string;
  title: string;
  specialty: string;
  location: string;
  rating: number;
  reviews: number;
  bio: string;
  services: string[];
  gradient: string;
}

const FEATURED_ESTHETICIANS: Esthetician[] = [
  {
    id: "est-1",
    name: "Dr. Maya Chen",
    title: "Licensed Esthetician & Skin Specialist",
    specialty: "Acne & Hyperpigmentation",
    location: "Los Angeles, CA",
    rating: 4.9,
    reviews: 312,
    bio: "Specialising in acne-prone and melanin-rich skin. 10+ years helping clients achieve their clearest, most radiant skin.",
    services: ["Chemical Peels", "Microneedling", "LED Therapy", "Customised Facials"],
    gradient: "from-rose-400 to-pink-500",
  },
  {
    id: "est-2",
    name: "Keisha Williams",
    title: "Master Esthetician",
    specialty: "Anti-Aging & Rejuvenation",
    location: "Atlanta, GA",
    rating: 4.8,
    reviews: 247,
    bio: "Expert in non-invasive anti-aging treatments. I believe every woman deserves to feel confident in her skin at any age.",
    services: ["Dermaplane", "Hydrafacial", "Microcurrent", "Enzyme Peels"],
    gradient: "from-violet-400 to-purple-500",
  },
  {
    id: "est-3",
    name: "Sofia Reyes",
    title: "Holistic Skin Therapist",
    specialty: "Sensitive Skin & Rosacea",
    location: "Miami, FL",
    rating: 4.9,
    reviews: 189,
    bio: "Combining clinical expertise with holistic approaches. Gentle, effective treatments for even the most reactive skin types.",
    services: ["Calming Facials", "Lymphatic Drainage", "Oxygen Therapy", "Barrier Repair"],
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    id: "est-4",
    name: "Jasmine Park",
    title: "Celebrity Esthetician",
    specialty: "Glass Skin & K-Beauty",
    location: "New York, NY",
    rating: 5.0,
    reviews: 421,
    bio: "Trained in Seoul, practising in NYC. Bringing the best of Korean skincare innovation to American clients.",
    services: ["Glass Skin Facial", "Aqua Peel", "Collagen Induction", "Skin Cycling Consult"],
    gradient: "from-sky-400 to-blue-500",
  },
  {
    id: "est-5",
    name: "Aisha Johnson",
    title: "Brow & Lash Specialist",
    specialty: "Brows, Lashes & Microblading",
    location: "Houston, TX",
    rating: 4.7,
    reviews: 156,
    bio: "The brow queen of Houston. Specialising in microblading, lamination, and lash lifts that frame your face perfectly.",
    services: ["Microblading", "Brow Lamination", "Lash Lift & Tint", "Henna Brows"],
    gradient: "from-amber-400 to-orange-500",
  },
  {
    id: "est-6",
    name: "Dr. Rachel Torres",
    title: "Medical Esthetician",
    specialty: "Laser & Advanced Treatments",
    location: "San Diego, CA",
    rating: 4.8,
    reviews: 298,
    bio: "Board-certified with expertise in laser treatments, injectables consultation, and advanced skin rejuvenation protocols.",
    services: ["Laser Resurfacing", "IPL Photofacial", "PRP Therapy", "Body Contouring"],
    gradient: "from-fuchsia-400 to-pink-500",
  },
];

export default function EstheticianHub() {
  return (
    <div className="min-h-screen vanity-bg">
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500">
              <Crown className="w-5 h-5 text-white" />
            </span>
            <div>
              <h1 className="font-serif text-3xl">Esthetician Hub</h1>
              <div className="flex items-center gap-1.5">
                <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-none text-[10px]">
                  <Lock className="w-2.5 h-2.5 mr-0.5" /> Premium
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Verified professionals promoting their services
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Connect with licensed estheticians who specialise in your specific
            skin concerns. Every professional listed is verified and reviewed by
            the Beat community.
          </p>
        </header>

        <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 rounded-2xl p-5 border border-amber-200/30 dark:border-amber-800/30">
          <div className="flex items-start gap-3">
            <Crown className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm mb-1">
                Are you a licensed esthetician?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Join the Beat Esthetician Hub to promote your business, connect
                with clients, and grow your practice. Premium members get a
                verified profile, booking integration, and featured placement.
              </p>
              <Button size="sm" className="rounded-full gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white">
                <Crown className="w-3.5 h-3.5" /> Apply to join
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURED_ESTHETICIANS.map((est, i) => (
            <EstheticianCard key={est.id} est={est} index={i} />
          ))}
        </div>

        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-3">
            More estheticians coming soon as the network grows.
          </p>
          <Button variant="outline" className="rounded-full" disabled>
            Browse all estheticians
          </Button>
        </div>
      </main>
    </div>
  );
}

function EstheticianCard({
  est,
  index,
}: {
  est: Esthetician;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.4), duration: 0.3 }}
    >
      <Card className="overflow-hidden bg-card border-border hover:border-primary/40 transition-all h-full flex flex-col">
        <div
          className={`h-24 bg-gradient-to-br ${est.gradient} relative`}
        >
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
            <Badge
              variant="secondary"
              className="bg-white/90 text-foreground/80 text-[10px] backdrop-blur-sm"
            >
              <Star className="w-3 h-3 text-amber-500 mr-0.5 fill-amber-500" />
              {est.rating} ({est.reviews})
            </Badge>
            <Badge
              variant="secondary"
              className="bg-white/90 text-foreground/80 text-[10px] backdrop-blur-sm"
            >
              <MapPin className="w-3 h-3 mr-0.5" />
              {est.location}
            </Badge>
          </div>
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-lg leading-tight">
            {est.name}
          </CardTitle>
          <p className="text-xs text-primary font-semibold">{est.title}</p>
          <p className="text-xs text-muted-foreground italic">
            {est.specialty}
          </p>
        </CardHeader>
        <div className="px-6 pb-3 flex-1 space-y-2">
          <p className="text-xs text-foreground/80 leading-relaxed">
            {est.bio}
          </p>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Services
            </p>
            <div className="flex flex-wrap gap-1">
              {est.services.map((s) => (
                <span
                  key={s}
                  className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
        <CardFooter className="pt-2 pb-4 flex gap-2">
          <Button
            size="sm"
            className="flex-1 rounded-full gap-1.5 text-xs"
          >
            <Calendar className="w-3 h-3" /> Book consult
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-1 text-xs"
          >
            <ExternalLink className="w-3 h-3" /> Profile
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
