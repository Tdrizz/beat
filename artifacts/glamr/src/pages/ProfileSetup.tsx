import { useState } from "react";
import { useUser } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, Redirect } from "wouter";
import { api, type Profile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mandatory profile setup: every signed-in user must pick a handle + display
// name before they can access the social features. Redirects home once a
// profile already exists.
export default function ProfileSetup() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { data: existing, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<Profile>("/me"),
    enabled: isLoaded && !!isSignedIn,
    retry: false,
  });

  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.post<Profile>("/profiles", {
        handle: handle.trim().toLowerCase(),
        displayName: displayName.trim() || handle.trim(),
        bio: bio.trim() || null,
        avatarUrl: user?.imageUrl ?? null,
      }),
    onSuccess: (created) => {
      qc.setQueryData(["me"], created);
      navigate("/");
    },
  });

  if (!isLoaded || isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (existing) return <Redirect to="/" />;

  const valid = /^[a-z0-9_.]{3,24}$/.test(handle.trim().toLowerCase());

  return (
    <div className="min-h-screen vanity-bg flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Create your Beat profile</CardTitle>
          <p className="text-sm text-muted-foreground">Pick a handle to start sharing your looks. You can change anything but the handle later.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">HANDLE</label>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">@</span>
              <Input value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase())} placeholder="rosegold" maxLength={24} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">3–24 characters, lowercase letters, numbers, _ and . only.</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">DISPLAY NAME</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Rose G." maxLength={48} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">BIO (OPTIONAL)</label>
            <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Soft glam · NYC" maxLength={140} />
          </div>
          {create.isError && <p className="text-sm text-red-500">{(create.error as Error).message}</p>}
          <Button className="w-full rounded-full" disabled={!valid || create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? "Creating…" : "Create profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
