import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { api, type Profile } from "@/lib/api";

// The signed-in user's profile (shares the ["me"] cache with AuthedRoute).
// Use profile.userId rather than Clerk's id when comparing against API
// data: after the user migration the API's id can differ from Clerk's.
export function useMe() {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<Profile>("/me"),
    enabled: !!isSignedIn,
    retry: false,
    staleTime: 60_000,
  });
}
