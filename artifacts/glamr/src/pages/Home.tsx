import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { byEraLooks, celebrityLooks, eyeLooks, lipLooks, allCompleteLooks, Look } from "../lib/looks";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Camera, Eye, Smile, Layers } from "lucide-react";

function LookCard({ look, index }: { look: Look; index: number }) {
  const gradientStyles = {
    background: `linear-gradient(135deg, ${look.palette[0]} 0%, ${look.palette[1]} 50%, ${look.palette[2]} 100%)`,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
    >
      <Card className="overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer h-full flex flex-col">
        <div className="h-32 w-full relative" style={gradientStyles}>
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-500" />
          <div className="absolute bottom-2 left-2 flex gap-2">
            <Badge variant="secondary" className="bg-black/50 backdrop-blur-md text-white border-none">
              {look.difficulty}
            </Badge>
            <Badge variant="outline" className="bg-black/50 backdrop-blur-md text-white border-white/20">
              {look.timeEstimate}
            </Badge>
          </div>
        </div>
        <CardHeader className="pb-2 flex-grow">
          <CardTitle className="font-serif text-xl text-foreground">{look.name}</CardTitle>
          <CardDescription className="text-muted-foreground flex justify-between items-center">
            <span>{look.era || look.celebrity}</span>
            <span className="italic text-primary/80">{look.mood}</span>
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link href={`/looks/${look.id}`} className="w-full">
            <Button variant="outline" className="w-full" data-testid={`btn-see-more-${look.id}`}>See More</Button>
          </Link>
          <Link href={`/try-on/${look.id}`} className="w-full">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" data-testid={`btn-try-${look.id}`}>
              <Camera className="w-4 h-4 mr-2" />
              Try Now
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="text-primary">{icon}</div>
      <div>
        <h2 className="font-serif text-2xl text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function LookGrid({ looks }: { looks: Look[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {looks.map((look, i) => (
        <LookCard key={look.id} look={look} index={i} />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-20">
      <header className="pt-16 pb-12 px-6 text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-primary tracking-tight mb-4 flex items-center justify-center gap-3">
            Beat <Sparkles className="w-8 h-8 text-accent" />
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-light tracking-wide">
            Iconic artistry. Live on your face.
          </p>
        </motion.div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <Tabs defaultValue="complete" className="w-full">
          <div className="flex justify-center mb-10 overflow-x-auto pb-2">
            <TabsList className="bg-card border border-border flex-shrink-0 h-auto p-1 gap-1">
              <TabsTrigger
                value="complete"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-4 py-2"
                data-testid="tab-complete"
              >
                <Layers className="w-4 h-4" />
                Complete Styles
              </TabsTrigger>
              <TabsTrigger
                value="era"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
                data-testid="tab-era"
              >
                By Era
              </TabsTrigger>
              <TabsTrigger
                value="celebrity"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
                data-testid="tab-celebrity"
              >
                Celebrity Icons
              </TabsTrigger>
              <TabsTrigger
                value="eyes"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-4 py-2"
                data-testid="tab-eyes"
              >
                <Eye className="w-4 h-4" />
                Eye Styles
              </TabsTrigger>
              <TabsTrigger
                value="lips"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-4 py-2"
                data-testid="tab-lips"
              >
                <Smile className="w-4 h-4" />
                Lip Styles
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="complete" className="mt-0">
            <SectionHeader
              icon={<Layers className="w-6 h-6" />}
              title="Complete Makeup Styles"
              subtitle={`${allCompleteLooks.length} full looks — from face to finish`}
            />
            <LookGrid looks={allCompleteLooks} />
          </TabsContent>

          <TabsContent value="era" className="mt-0">
            <SectionHeader
              icon={<Sparkles className="w-6 h-6" />}
              title="By Era"
              subtitle="A century of iconic beauty, decade by decade"
            />
            <LookGrid looks={byEraLooks} />
          </TabsContent>

          <TabsContent value="celebrity" className="mt-0">
            <SectionHeader
              icon={<Sparkles className="w-6 h-6" />}
              title="Celebrity Icons"
              subtitle="The looks that defined a generation"
            />
            <LookGrid looks={celebrityLooks} />
          </TabsContent>

          <TabsContent value="eyes" className="mt-0">
            <SectionHeader
              icon={<Eye className="w-6 h-6" />}
              title="Eye Styles"
              subtitle={`${eyeLooks.length} eye-focused looks — from natural to editorial`}
            />
            <LookGrid looks={eyeLooks} />
          </TabsContent>

          <TabsContent value="lips" className="mt-0">
            <SectionHeader
              icon={<Smile className="w-6 h-6" />}
              title="Lip Styles"
              subtitle={`${lipLooks.length} lip-focused looks — every finish, every mood`}
            />
            <LookGrid looks={lipLooks} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
