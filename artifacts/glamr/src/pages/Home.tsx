import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { allLooks, byEraLooks, celebrityLooks, Look } from "../lib/looks";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Camera } from "lucide-react";

function LookCard({ look, index }: { look: Look; index: number }) {
  const gradientStyles = {
    background: `linear-gradient(135deg, ${look.palette[0]} 0%, ${look.palette[1]} 50%, ${look.palette[2]} 100%)`,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
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
            <Button variant="outline" className="w-full">See More</Button>
          </Link>
          <Link href={`/try-on/${look.id}`} className="w-full">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Camera className="w-4 h-4 mr-2" />
              Try Now
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
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
            Glamr <Sparkles className="w-8 h-8 text-accent" />
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-light tracking-wide">
            Iconic artistry. Live on your face.
          </p>
        </motion.div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <Tabs defaultValue="era" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="era" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                By Era
              </TabsTrigger>
              <TabsTrigger value="celebrity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Celebrity Icons
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="era" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {byEraLooks.map((look, i) => (
                <LookCard key={look.id} look={look} index={i} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="celebrity" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {celebrityLooks.map((look, i) => (
                <LookCard key={look.id} look={look} index={i} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
