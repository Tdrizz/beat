import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users, Search, Sparkles, UserPlus, UserMinus, Heart, X, Crown, Loader2,
} from "lucide-react";
import { api, type ProfileWithFollowers } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ── Friends page ───────────────────────────────────────────────────────
 * Three modes share one screen:
 *   1. Featured creators carousel (top): always visible, even without a
 *      search query. Driven by the `/profiles/featured` endpoint which
 *      promotes flagged creators + most-followed accounts.
 *   2. Tab: "Friends" — accounts the signed-in user already follows.
 *   3. Tab: "Discover" — live search by handle / display-name / email,
 *      with a small "follow" CTA per row. Empty state shows the same
 *      featured list as a "people you might like" surface.
 *
 * Search is debounced (250ms) and gated at >= 2 chars to avoid hammering
 * the server. Follow status is fetched in bulk for whichever set of rows
 * is currently on screen so the buttons paint correct labels at first
 * render.                                                                */

interface FriendsResponse { friends: ProfileWithFollowers[] }
interface FeaturedResponse { featured: ProfileWithFollowers[] }
interface SearchResponse { results: ProfileWithFollowers[] }
interface FollowStatusResponse { followingIds: string[] }

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

/* Small Follow / Following toggle. Optimistically updates the list of
 * followingIds so the button responds instantly. */
function FollowButton({
  userId,
  isFollowing,
  onToggle,
  size = "sm",
}: {
  userId: string;
  isFollowing: boolean;
  onToggle: (next: boolean) => void;
  size?: "sm" | "xs";
}) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) await api.del(`/follows/${userId}`);
      else await api.post(`/follows/${userId}`);
    },
    onMutate: () => onToggle(!isFollowing),
    onError: () => onToggle(isFollowing),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["follow-stats"] });
    },
  });
  const compact = size === "xs";
  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      disabled={mutation.isPending}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); mutation.mutate(); }}
      className={`rounded-full gap-1 ${compact ? "h-7 px-3 text-[11px]" : "h-8 px-3.5 text-xs"}`}
    >
      {mutation.isPending
        ? <Loader2 className="w-3 h-3 animate-spin" />
        : isFollowing
          ? <><UserMinus className="w-3 h-3" /> Following</>
          : <><UserPlus className="w-3 h-3" /> Follow</>}
    </Button>
  );
}

/* Compact creator row used by Friends + Search results. */
function CreatorRow({
  profile,
  isFollowing,
  onToggle,
}: {
  profile: ProfileWithFollowers;
  isFollowing: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <Link href={`/u/${profile.handle}`}>
      <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-card/70 transition-colors border border-transparent hover:border-border/60">
        <Avatar className="w-12 h-12 ring-2 ring-rose-200/40">
          <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.displayName} />
          <AvatarFallback className="bg-gradient-to-br from-rose-200 to-pink-300 text-rose-900 font-semibold">
            {profile.displayName.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm truncate">{profile.displayName}</span>
            {profile.isCreator && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[9px] gap-0.5 bg-amber-100 text-amber-800 border-amber-200">
                <Crown className="w-2.5 h-2.5" /> Creator
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            @{profile.handle} · {formatFollowers(profile.followerCount)} followers
          </p>
        </div>
        <FollowButton userId={profile.userId} isFollowing={isFollowing} onToggle={onToggle} />
      </div>
    </Link>
  );
}

/* Featured creator card — taller, gradient-backed, used in the top
 * carousel. Visually distinct from the row layout to underline that
 * these are *promoted* accounts. */
function FeaturedCard({
  profile,
  isFollowing,
  onToggle,
  index,
}: {
  profile: ProfileWithFollowers;
  isFollowing: boolean;
  onToggle: (next: boolean) => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="snap-start shrink-0 w-44"
    >
      <Link href={`/u/${profile.handle}`}>
        <div className="relative h-56 rounded-3xl overflow-hidden border border-border/50 bg-gradient-to-br from-rose-100 via-pink-100 to-fuchsia-100 dark:from-rose-900/40 dark:via-pink-900/30 dark:to-fuchsia-900/30 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center p-4 pt-6">
          {/* Promoted ribbon — small but unmistakable badge so users know
            * these are surfaced, not just any random account. */}
          <div className="absolute top-2 right-2">
            <Badge className="bg-gradient-to-r from-amber-400 to-pink-500 text-white border-0 h-5 px-2 text-[9px] gap-0.5 shadow">
              <Sparkles className="w-2.5 h-2.5" /> Featured
            </Badge>
          </div>
          <Avatar className="w-16 h-16 ring-4 ring-white/70 shadow-lg">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.displayName} />
            <AvatarFallback className="bg-gradient-to-br from-pink-300 to-fuchsia-400 text-white font-bold text-lg">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="mt-2 font-semibold text-sm text-foreground truncate w-full">{profile.displayName}</p>
          <p className="text-[11px] text-muted-foreground truncate w-full">@{profile.handle}</p>
          {profile.bio && (
            <p className="text-[11px] text-foreground/70 mt-1 line-clamp-2 leading-snug">{profile.bio}</p>
          )}
          <p className="text-[10px] font-bold text-foreground/80 mt-auto pt-2">
            {formatFollowers(profile.followerCount)} followers
          </p>
          <div className="mt-2 w-full" onClick={(e) => e.preventDefault()}>
            <FollowButton userId={profile.userId} isFollowing={isFollowing} onToggle={onToggle} size="xs" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Friends() {
  const [tab, setTab] = useState<"friends" | "discover">("friends");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 250);

  /* Local override so optimistic Follow/Unfollow updates feel instant
   * across all three lists without re-fetching every time. */
  const [followingOverrides, setFollowingOverrides] = useState<Record<string, boolean>>({});
  const setFollowing = (userId: string, next: boolean) =>
    setFollowingOverrides((prev) => ({ ...prev, [userId]: next }));

  const friendsQ = useQuery({
    queryKey: ["friends"],
    queryFn: () => api.get<FriendsResponse>("/profiles/me/friends"),
  });

  const featuredQ = useQuery({
    queryKey: ["featured-creators"],
    queryFn: () => api.get<FeaturedResponse>("/profiles/featured"),
  });

  const searchQ = useQuery({
    queryKey: ["creator-search", debouncedQuery],
    enabled: debouncedQuery.trim().length >= 2,
    queryFn: () => api.get<SearchResponse>(
      `/profiles/search?q=${encodeURIComponent(debouncedQuery.trim())}`,
    ),
  });

  /* Bulk follow-status query: collect every userId currently visible
   * (friends + featured + search results) and ask the server which ones
   * the viewer follows in a single round-trip. The server answer seeds
   * the local override map. */
  const visibleIds = useMemo(() => {
    const ids = new Set<string>();
    friendsQ.data?.friends.forEach((p) => ids.add(p.userId));
    featuredQ.data?.featured.forEach((p) => ids.add(p.userId));
    searchQ.data?.results.forEach((p) => ids.add(p.userId));
    return [...ids];
  }, [friendsQ.data, featuredQ.data, searchQ.data]);

  const followStatusQ = useQuery({
    queryKey: ["follow-status", visibleIds.sort().join(",")],
    enabled: visibleIds.length > 0,
    queryFn: () => api.get<FollowStatusResponse>(
      `/follows/status?ids=${visibleIds.join(",")}`,
    ),
  });

  const isFollowing = (userId: string): boolean => {
    if (userId in followingOverrides) return followingOverrides[userId]!;
    // Anyone in the friends list is by definition followed.
    if (friendsQ.data?.friends.some((p) => p.userId === userId)) return true;
    return followStatusQ.data?.followingIds.includes(userId) ?? false;
  };

  const friends = friendsQ.data?.friends ?? [];
  const featured = featuredQ.data?.featured ?? [];
  const searchResults = searchQ.data?.results ?? [];
  const isSearching = debouncedQuery.trim().length >= 2;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-24">
      <div className="max-w-3xl mx-auto px-4 pt-6">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-5"
        >
          <h1 className="font-serif text-4xl font-bold bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 bg-clip-text text-transparent">
            Friends
          </h1>
          <p className="font-script text-base text-foreground/70 mt-0.5">
            Find your beauty besties.
          </p>
        </motion.div>

        {/* Featured creators carousel — always shown so promotion lives
          * above the fold regardless of which tab is active. */}
        <section className="mb-6">
          <div className="flex items-end justify-between mb-2 px-1">
            <h2 className="font-serif text-lg font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Top creators
            </h2>
            <span className="text-[11px] text-muted-foreground">Hand-picked + most-followed</span>
          </div>
          {featuredQ.isLoading ? (
            <div className="flex gap-3 overflow-hidden">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-44 h-56 rounded-3xl bg-card animate-pulse shrink-0" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">No featured creators yet — check back soon.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-2">
              {featured.map((p, i) => (
                <FeaturedCard
                  key={p.userId}
                  profile={p}
                  index={i}
                  isFollowing={isFollowing(p.userId)}
                  onToggle={(next) => setFollowing(p.userId, next)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Search input — controls Discover tab. Typing auto-switches the
          * user there so they immediately see the results land. */}
        <div className="mb-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            aria-label="Search creators by username, name or email"
            placeholder="Search by username, name or email…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim().length >= 2 && tab !== "discover") setTab("discover");
            }}
            className="pl-9 pr-9 h-11 rounded-full bg-card/80 border-border/60"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "friends" | "discover")} className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-card/80 h-11 p-1 rounded-full">
            <TabsTrigger value="friends" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Friends {friends.length > 0 && <span className="text-[10px] opacity-80">({friends.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="discover" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Discover
            </TabsTrigger>
          </TabsList>

          {/* ── Friends tab ── */}
          <TabsContent value="friends" className="mt-4">
            {friendsQ.isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-card animate-pulse" />)}
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-12 px-6 rounded-3xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40 border border-rose-200/40">
                <Heart className="w-10 h-10 mx-auto text-rose-400 mb-3" />
                <h3 className="font-serif text-lg font-semibold">No friends yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-xs mx-auto">
                  Follow creators you love and they'll show up here.
                </p>
                <Button onClick={() => setTab("discover")} className="rounded-full">
                  <Search className="w-3.5 h-3.5 mr-1.5" /> Discover creators
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {friends.map((p) => (
                  <CreatorRow
                    key={p.userId}
                    profile={p}
                    isFollowing={isFollowing(p.userId)}
                    onToggle={(next) => setFollowing(p.userId, next)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Discover tab ── */}
          <TabsContent value="discover" className="mt-4">
            {!isSearching ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Type a username, name or email above to find creators.
              </p>
            ) : searchQ.isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-card animate-pulse" />)}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground">No accounts match "{debouncedQuery}".</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different spelling, or search by email.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {searchResults.map((p) => (
                  <CreatorRow
                    key={p.userId}
                    profile={p}
                    isFollowing={isFollowing(p.userId)}
                    onToggle={(next) => setFollowing(p.userId, next)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
