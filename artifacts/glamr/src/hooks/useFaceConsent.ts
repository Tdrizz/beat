import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Bump when the camera / face-data explanation changes materially; users
// are asked again for the new version.
export const FACE_CONSENT_VERSION = "1";
const STORAGE_KEY = "glamr.faceConsent";

function readLocal(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeLocal(version: string | null) {
  try {
    if (version) window.localStorage.setItem(STORAGE_KEY, version);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // private mode etc. — the in-memory state still gates this session
  }
}

interface ConsentsResponse {
  consents: Record<string, { version: string; grantedAt: string }>;
}

/**
 * Whether the user agreed to camera / face-data use for the current
 * version. Signed-in consent is recorded server-side (so it follows the
 * account across devices); signed-out users (Look Match) are tracked on the
 * device and synced to the account once they sign in.
 */
export function useFaceConsent() {
  const { isSignedIn, isLoaded } = useAuth();
  const qc = useQueryClient();
  const [local, setLocal] = useState<string | null>(() => readLocal());
  const server = useQuery({
    queryKey: ["me", "consents"],
    queryFn: () => api.get<ConsentsResponse>("/me/consents"),
    enabled: !!isSignedIn,
    staleTime: 5 * 60_000,
  });
  const serverVersion = server.data?.consents.face_data?.version ?? null;

  // Carry a device-level consent given while signed out over to the account.
  useEffect(() => {
    if (isSignedIn && server.isSuccess && local === FACE_CONSENT_VERSION && serverVersion !== FACE_CONSENT_VERSION) {
      api.put(`/me/consents/face_data`, { version: FACE_CONSENT_VERSION })
        .then(() => qc.invalidateQueries({ queryKey: ["me", "consents"] }))
        .catch(() => undefined);
    }
  }, [isSignedIn, server.isSuccess, local, serverVersion, qc]);

  const granted = isSignedIn
    ? serverVersion === FACE_CONSENT_VERSION || local === FACE_CONSENT_VERSION
    : local === FACE_CONSENT_VERSION;

  const grant = useCallback(async () => {
    writeLocal(FACE_CONSENT_VERSION);
    setLocal(FACE_CONSENT_VERSION);
    if (isSignedIn) {
      await api.put(`/me/consents/face_data`, { version: FACE_CONSENT_VERSION });
      await qc.invalidateQueries({ queryKey: ["me", "consents"] });
    }
  }, [isSignedIn, qc]);

  const withdraw = useCallback(async () => {
    writeLocal(null);
    setLocal(null);
    if (isSignedIn) {
      await api.del(`/me/consents/face_data`);
      await qc.invalidateQueries({ queryKey: ["me", "consents"] });
    }
  }, [isSignedIn, qc]);

  return {
    granted,
    grantedAt: server.data?.consents.face_data?.grantedAt ?? null,
    // Don't wait on Clerk: until it loads, the device-level record decides.
    isLoading: !!isLoaded && !!isSignedIn && server.isLoading && local !== FACE_CONSENT_VERSION,
    grant,
    withdraw,
  };
}
