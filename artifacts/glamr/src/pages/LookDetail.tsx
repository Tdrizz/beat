import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { allLooks, eyeLooks, lipLooks } from "../lib/looks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, Clock, Star, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function LookDetail() {
  const { lookId } = useParams();
  const ALL_LOOKS = [...allLooks, ...eyeLooks, ...lipLooks];
  const look = ALL_LOOKS.find((l) => l.id === lookId);

  if (!look) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h2 className="text-2xl font-serif mb-4">Look not found</h2>
          <Link href="/">
            <Button variant="outline">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const gradientStyles = {
    background: `linear-gradient(135deg, ${look.palette[0]} 0%, ${look.palette[1]} 50%, ${look.palette[2]} 100%)`,
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-24">
      <div className="h-64 md:h-80 w-full relative" style={gradientStyles}>
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <Link href="/" className="absolute top-6 left-6">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      <main className="max-w-3xl mx-auto px-6 -mt-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-card border border-border rounded-xl p-8 shadow-2xl mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-primary text-primary-foreground">{look.mood}</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="w-3 h-3" /> {look.difficulty}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {look.timeEstimate}
              </Badge>
              <Badge variant="secondary">{look.era || look.celebrity}</Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{look.name}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {look.description}
            </p>

            <Link href={`/try-on/${look.id}`}>
              <Button size="lg" className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 h-14">
                <Camera className="w-5 h-5 mr-2" />
                Start Try-On Experience
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-xl p-8">
              <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                The Guide
              </h2>
              <div className="space-y-6">
                {Object.values(look.steps).map((step, idx) => (
                  <div key={step.id} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{step.name}</h3>
                      <p className="text-muted-foreground">{step.instruction}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-8">
              <h2 className="text-2xl font-serif font-bold mb-6">Products Needed</h2>
              <div className="space-y-4">
                {Object.values(look.steps).map((step) => (
                  <div key={`product-${step.id}`} className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full border border-border flex-shrink-0"
                      style={{ backgroundColor: step.color === 'transparent' ? 'transparent' : step.color }}
                    />
                    <div>
                      <p className="font-medium text-foreground">{step.colorName}</p>
                      <p className="text-sm text-muted-foreground">{step.name} Product</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-6" />
              
              <div className="text-sm text-muted-foreground italic">
                These generic products will be digitally applied to your face in real-time using our AR engine.
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
