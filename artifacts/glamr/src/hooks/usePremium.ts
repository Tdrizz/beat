import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { api, type PremiumStatus } from "@/lib/api";

// Reads the signed-in user's Premium subscription status from the server
// (`profiles.premium_until > now()`). Returns `{ active: false }` for
// signed-out users without hitting the API. Refetched every minute so a
// just-completed checkout flips the host-class CTA without a hard reload.
export function usePremium() {
  const { isSignedIn } = useAuth();
  const q = useQuery<PremiumStatus>({
    queryKey: ["me", "premium"],
    queryFn: () => api.get<PremiumStatus>("/me/premium"),
    enabled: !!isSignedIn,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  return {
    active: !!q.data?.active,
    until: q.data?.until ?? null,
    isLoading: !!isSignedIn && q.isLoading,
  };
}
