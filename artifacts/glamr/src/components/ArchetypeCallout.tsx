import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useArchetype } from "../hooks/useArchetype";
import { ARCHETYPES } from "../lib/archetypes";

/**
 * Home-page entry point for the archetype quiz.
 *
 * Two states:
 *  - Pre-quiz: invite card with the "5 questions, 1 minute" promise so the
 *    cost-benefit is obvious before the user taps in.
 *  - Post-quiz: a personalised banner showing the user's archetype name,
 *    palette swatches, and a CTA back into the result page.
 *
 * We render this between the daily-beat card and the section shortcuts so
 * personalisation is the first decision the user makes after their daily
 * dose of variety — but doesn't push the catalogue below the fold.
 */
export function ArchetypeCallout() {
  const { archetype } = useArchetype();
  const arch = archetype ? ARCHETYPES[archetype] : null;

  if (!arch) {
    return (
      <div className="max-w-2xl mx-auto px-6 mb-8">
        <Link href="/archetype">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -2 }}
            className="cursor-pointer rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/5 to-background p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.22em] text-primary mb-1">
                  Personalise the app
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold leading-tight mb-1">
                  Find your beauty archetype
                </h3>
                <p className="text-sm text-muted-foreground leading-snug">
                  5 quick questions. We'll tune your colours, tips and look
                  recommendations around the answer.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-primary shrink-0 mt-1" />
            </div>
          </motion.div>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 mb-8">
      <Link href="/archetype">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ y: -2 }}
          className="cursor-pointer rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow"
          style={{
            background: `linear-gradient(135deg, ${arch.palette[0]} 0%, ${arch.palette[2]} 100%)`,
          }}
        >
          <div className="p-5 sm:p-6 flex items-center gap-4">
            <div className="flex-1 min-w-0 text-black/85">
              <div className="text-[10px] uppercase tracking-[0.22em] text-black/55 mb-1">
                You are
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-none mb-1">
                {arch.name}
              </h3>
              <p className="text-sm italic text-black/70 truncate">{arch.tagline}</p>
              <div className="flex gap-1.5 mt-3">
                {arch.palette.map((hex) => (
                  <div key={hex} className="w-5 h-5 rounded-full ring-2 ring-white/40"
                       style={{ background: hex }} />
                ))}
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-black/70 shrink-0" />
          </div>
        </motion.div>
      </Link>
    </div>
  );
}
