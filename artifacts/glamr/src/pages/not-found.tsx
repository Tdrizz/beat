import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] vanity-bg flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-4">
        <p className="font-serif text-5xl text-primary">404</p>
        <h1 className="font-serif text-2xl">We couldn't find that page</h1>
        <p className="text-sm text-muted-foreground">It may have moved, or the link might be broken.</p>
        <Link href="/">
          <Button className="rounded-full">Back to home</Button>
        </Link>
      </div>
    </div>
  );
}
