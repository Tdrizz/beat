import { useEffect, useRef, useState } from "react";

/**
 * Minimal camera hook: starts the user-facing webcam, attaches the stream to
 * a video element, and surfaces a friendly error string when permissions fail.
 *
 * Replaces the older `useFaceAR` (which also ran MediaPipe + a canvas overlay)
 * — for the AI try-on flow we only need the live preview.
 */
export function useCamera(opts: { facingMode?: "user" | "environment" } = {}) {
  const facingMode = opts.facingMode ?? "user";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsReady(false);
    setError(null);
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      const video = videoRef.current;
      if (!video) return;

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera access is not available in this browser. Use Chrome, Safari or Firefox over HTTPS.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        video.srcObject = stream;
        try {
          await video.play();
        } catch {
          // Some browsers reject play() if the video isn't yet attached; readyState fallback below.
        }

        if (video.readyState >= 2 || video.videoWidth > 0) {
          setIsReady(true);
        } else {
          video.onloadeddata = () => setIsReady(true);
        }
      } catch (e) {
        const err = e as DOMException;
        const map: Record<string, string> = {
          NotAllowedError: "Camera access was blocked. Allow it in your browser settings and reload.",
          NotFoundError: "No camera was detected on this device.",
          NotReadableError: "Your camera is busy — close other apps using it and try again.",
          OverconstrainedError: "This camera doesn't support the required settings.",
          AbortError: "Camera initialisation was interrupted. Please reload.",
        };
        setError(map[err?.name] ?? "Could not access the camera. Make sure you're on HTTPS and have granted permission.");
      }
    }

    start();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach(t => t.stop());
      const video = videoRef.current;
      if (video) {
        video.srcObject = null;
        video.onloadeddata = null;
      }
    };
  }, [facingMode]);

  return { videoRef, isReady, error };
}
