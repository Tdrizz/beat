import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@clerk/react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Wand2, RefreshCw, Loader2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { ALL_LOOKS_FLAT } from "@/lib/looks";
import { ARCHETYPES, type ArchetypeId } from "@/lib/archetypes";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ThreadResponse {
  threadId: string;
  messages: ChatMessage[];
  greetingName: string;
  archetype: string | null;
}

const STARTERS = [
  "Help me match a lipstick to my undertone",
  "Suggest a 5-minute glam routine",
  "Why is my foundation oxidising?",
];

let tmpCounter = 0;
const tmpId = () => `tmp-${Date.now()}-${tmpCounter++}`;

export default function AskIola() {
  const { isSignedIn, isLoaded } = useAuth();
  const { favorites } = useFavorites();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [greetingName, setGreetingName] = useState("there");
  const [archetype, setArchetype] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loadingThread, setLoadingThread] = useState(true);
  const [sending, setSending] = useState(false);
  const [waitingFirstToken, setWaitingFirstToken] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Resolve favourite look IDs → names (bounded) for prompt grounding.
  const favouriteNames = (() => {
    const byId = new Map(ALL_LOOKS_FLAT.map((l) => [l.id, l.name]));
    return [...favorites]
      .map((id) => byId.get(id))
      .filter((n): n is string => Boolean(n))
      .slice(0, 12);
  })();

  const loadThread = useCallback(async () => {
    setLoadingThread(true);
    try {
      const res = await fetch("/api/chat/thread", { credentials: "include" });
      if (res.ok) {
        const data: ThreadResponse = await res.json();
        setMessages(data.messages);
        setGreetingName(data.greetingName);
        setArchetype(data.archetype);
      }
    } catch {
      /* ignore — empty state will render */
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      void loadThread();
    } else {
      setLoadingThread(false);
    }
  }, [isLoaded, isSignedIn, loadThread]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, waitingFirstToken]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || sending) return;
      setInput("");
      setSending(true);
      setWaitingFirstToken(true);

      const userMsg: ChatMessage = { id: tmpId(), role: "user", content };
      const assistantId = tmpId();
      setMessages((m) => [...m, userMsg, { id: assistantId, role: "assistant", content: "" }]);

      try {
        const res = await fetch("/api/chat/messages", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, favourites: favouriteNames }),
        });

        if (!res.ok || !res.body) {
          const msg = res.status === 429
            ? "Whoa, slow down a sec — too many messages. Try again in a few minutes."
            : "Iola couldn't reply just now. Try again in a moment.";
          setMessages((m) =>
            m.map((x) => (x.id === assistantId ? { ...x, content: msg } : x)),
          );
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Parse the SSE stream frame by frame (event: <name>\n data: <json>\n\n).
        const handleEvent = (event: string, dataRaw: string) => {
          let data: unknown;
          try {
            data = JSON.parse(dataRaw);
          } catch {
            return;
          }
          if (event === "token") {
            const piece = (data as { text?: string }).text ?? "";
            if (piece) {
              setWaitingFirstToken(false);
              setMessages((m) =>
                m.map((x) => (x.id === assistantId ? { ...x, content: x.content + piece } : x)),
              );
            }
          } else if (event === "done") {
            const finalId = (data as { id?: string }).id;
            const finalContent = (data as { content?: string }).content;
            setMessages((m) =>
              m.map((x) =>
                x.id === assistantId
                  ? { id: finalId ?? x.id, role: "assistant", content: finalContent ?? x.content }
                  : x,
              ),
            );
          } else if (event === "error") {
            const errText = (data as { error?: string }).error ?? "Something went wrong.";
            setMessages((m) =>
              m.map((x) =>
                x.id === assistantId && !x.content ? { ...x, content: errText } : x,
              ),
            );
          }
        };

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let sep: number;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            let event = "message";
            let dataRaw = "";
            for (const line of frame.split("\n")) {
              if (line.startsWith("event:")) event = line.slice(6).trim();
              else if (line.startsWith("data:")) dataRaw += line.slice(5).trim();
            }
            if (dataRaw) handleEvent(event, dataRaw);
          }
        }
      } catch {
        setMessages((m) =>
          m.map((x) =>
            x.id === assistantId && !x.content
              ? { ...x, content: "Connection dropped. Try again in a moment." }
              : x,
          ),
        );
      } finally {
        setSending(false);
        setWaitingFirstToken(false);
      }
    },
    [sending, favouriteNames],
  );

  const startNewChat = useCallback(async () => {
    if (sending) return;
    try {
      await fetch("/api/chat/thread/reset", { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
    setMessages([]);
    setInput("");
  }, [sending]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const archetypeName =
    archetype && ARCHETYPES[archetype as ArchetypeId]
      ? ARCHETYPES[archetype as ArchetypeId].name
      : null;

  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen vanity-bg flex flex-col items-center justify-center px-6 text-center pb-20">
        <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
          <Wand2 className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-serif text-2xl text-primary mb-2">Ask Iola</h1>
        <p className="text-sm text-muted-foreground max-w-xs mb-5">
          Your personal beauty muse. Sign in to chat about products, routines, and what flatters
          your archetype.
        </p>
        <Link href="/sign-in">
          <Button className="rounded-full">Sign in to chat</Button>
        </Link>
      </div>
    );
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-screen vanity-bg flex flex-col pb-16 sm:pb-0">
      {/* Header */}
      <div className="max-w-2xl w-full mx-auto px-4 pt-4 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-lg leading-none text-primary">Ask Iola</h1>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              Your beauty muse{archetypeName ? ` · ${archetypeName}` : ""}
            </p>
          </div>
        </div>
        {!isEmpty && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full gap-1.5 text-xs"
            onClick={startNewChat}
            disabled={sending}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New chat
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto px-4 py-3 space-y-3">
          {loadingThread ? (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : isEmpty ? (
            <div className="py-8">
              <div className="text-center mb-6">
                <p className="font-serif text-xl text-foreground">
                  Hey, {greetingName} ✨
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  {archetypeName
                    ? `${archetypeName}, what are we creating today? Ask me anything beauty.`
                    : "What are we creating today? Ask me anything beauty — products, routines, undertones, dupes."}
                </p>
              </div>
              <div className="space-y-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="w-full text-left px-4 py-3 rounded-2xl bg-card/70 border border-border/50 text-sm hover:bg-card hover:border-primary/40 transition-colors flex items-center gap-2.5"
                  >
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border/50 rounded-bl-sm"
                  }`}
                >
                  {m.content || (
                    <span className="inline-flex gap-1 py-1 items-center text-muted-foreground">
                      <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-border/50 bg-background/90 backdrop-blur-md">
        <div className="max-w-2xl w-full mx-auto px-3 py-2.5 flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask Iola anything beauty…"
            aria-label="Message Iola"
            rows={1}
            className="resize-none min-h-[44px] max-h-32 rounded-2xl"
          />
          <Button
            size="icon"
            className="rounded-full shrink-0 h-11 w-11"
            onClick={() => void send(input)}
            disabled={sending || !input.trim()}
            aria-label="Send message"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}
