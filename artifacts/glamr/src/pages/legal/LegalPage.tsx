import { LEGAL_LAST_UPDATED, LEGAL_PLACEHOLDER, type LegalSection } from "@/lib/legalContent";

export function LegalPage({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <div className="min-h-screen vanity-bg">
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-1">
          <h1 className="font-serif text-3xl">{title}</h1>
          <p className="text-xs text-muted-foreground">Last updated: {LEGAL_LAST_UPDATED}</p>
        </header>
        {LEGAL_PLACEHOLDER && (
          <p role="note" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Placeholder text. The final version will replace this before launch.
          </p>
        )}
        {sections.map((s) => (
          <section key={s.heading} className="space-y-2">
            <h2 className="font-serif text-xl">{s.heading}</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/90">
              {s.body.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
