import { type ReactNode } from "react";
import { useUser } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { api, type Profile } from "@/lib/api";

// Wraps a page that requires (1) a signed-in Clerk user AND (2) an existing
// Beat profile. Redirects to /sign-in or /onboarding as appropriate.
export function AuthedRoute({ children, requireProfile = true }: { children: ReactNode; requireProfile?: boolean }) {
  const { isLoaded, isSignedIn } = useUser();
  const { data: profile, isLoading, isError, error } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<Profile>("/me"),
    enabled: isLoaded && !!isSignedIn,
    retry: (count, err: unknown) => {
      if (err instanceof Error && err.message === "Profile not created") return false;
      return count < 2;
    },
  });

  if (!isLoaded || (isSignedIn && isLoading)) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (requireProfile) {
    const noProfile = isError && error instanceof Error && error.message === "Profile not created";
    if (noProfile || !profile) return <Redirect to="/onboarding" />;
  }
  return <>{children}</>;
}
