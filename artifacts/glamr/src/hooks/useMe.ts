import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sentry, sentryEnabled } from "@/lib/sentry";
import { useAuth } from "@clerk/react";
import { api, type Profile } from "@/lib/api";

// The signed-in user's profile (shares the ["me"] cache with AuthedRoute).
// Use profile.userId rather than Clerk's id when comparing against API
// data: after the user migration the API's id can differ from Clerk's.
export function useMe() {
  const { isSignedIn } = useAuth();
  const query = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<Profile>("/me"),
    enabled: !!isSignedIn,
    retry: false,
    staleTime: 60_000,
  });
  // Tag error reports with the user id (never email) to group them.
  const userId = query.data?.userId;
  useEffect(() => {
    if (sentryEnabled) Sentry.setUser(userId ? { id: userId } : null);
  }, [userId]);
  return query;
}
