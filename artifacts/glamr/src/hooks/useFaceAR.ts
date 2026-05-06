import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { Look } from "../lib/looks";
import { drawMakeup } from "../lib/makeupRenderer";

export function useFaceAR(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  activeSteps: Record<string, number>,
  currentLook: Look | null
) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  // Exposed so TryOn can sample skin for shade-matching
  const latestLandmarksRef = useRef<NormalizedLandmark[] | null>(null);

  useEffect(() => {
    let active = true;
    let activeStream: MediaStream | null = null;

    function describeCameraError(err: any): string {
      const name = err?.name || "";
      if (!navigator.mediaDevices?.getUserMedia) {
        return "Your browser doesn't support camera access. Try Chrome, Safari, or Firefox.";
      }
      if (window.isSecureContext === false) {
        return "Camera requires a secure (HTTPS) connection.";
      }
      switch (name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
          return "Camera permission was blocked. Please allow camera access in your browser and reload.";
        case "NotFoundError":
        case "DevicesNotFoundError":
          return "No camera was found on this device.";
        case "NotReadableError":
        case "TrackStartError":
          return "Your camera is being used by another app. Close it and try again.";
        case "OverconstrainedError":
          return "No camera matches the requested resolution.";
        case "AbortError":
          return "Camera initialization was interrupted. Please retry.";
        default:
          return "Camera access failed. " + (err?.message || "");
      }
    }

    async function attachStream(stream: MediaStream) {
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      try {
        await video.play();
      } catch (err) {
        // iOS/Safari may reject autoplay; user gesture required is rare for muted video, but log just in case
        console.warn("video.play() rejected", err);
      }

      const onReady = () => {
        if (!active) return;
        const canvas = canvasRef.current;
        if (canvas && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          setIsReady(true);
        }
      };

      // If metadata already loaded (HMR / reattach), fire immediately; otherwise wait
      if (video.readyState >= 1 && video.videoWidth > 0) {
        onReady();
      } else {
        video.addEventListener("loadedmetadata", onReady, { once: true });
      }
    }

    async function init() {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        if (!active) return;
        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false
        });
        if (!active) { faceLandmarker.close(); return; }
        landmarkerRef.current = faceLandmarker;
        await startCamera();
      } catch (err: any) {
        console.error("Failed to init MediaPipe", err);
        if (active) setError("Failed to load the AR engine. Check your network and reload.");
      }
    }

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw Object.assign(new Error("getUserMedia unsupported"), { name: "NotSupportedError" });
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        // If we were unmounted while awaiting permission, clean up the stream.
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        activeStream = stream;
        await attachStream(stream);
      } catch (err: any) {
        console.error("Camera error", err);
        if (active) setError(describeCameraError(err));
      }
    }

    init();

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      const v = videoRef.current;
      if (v && v.srcObject) {
        (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        v.srcObject = null;
      }
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
        activeStream = null;
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady || !landmarkerRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── One-Euro filter ────────────────────────────────────────────────────
    // Adaptive low-pass filter that beats fixed EMA for face tracking:
    //   • Heavy smoothing when the user is still → no jitter
    //   • Light smoothing when the user moves fast → no lag
    // Reference: Casiez, Roussel, Vogel (2012). One state buffer per landmark
    // coordinate. Tuned for ~30Hz face landmarks.
    const ONE_EURO_MIN_CUTOFF = 1.2;   // Hz — base cutoff (lower = smoother when still)
    const ONE_EURO_BETA       = 0.020; // velocity coefficient (higher = faster response to motion)
    const ONE_EURO_D_CUTOFF   = 1.0;   // Hz — derivative cutoff

    type EuroState = { x: number; dx: number; t: number; init: boolean };
    const makeState = (n: number): EuroState[] =>
      Array.from({ length: n }, () => ({ x: 0, dx: 0, t: 0, init: false }));

    let xStates: EuroState[] | null = null;
    let yStates: EuroState[] | null = null;
    let zStates: EuroState[] | null = null;

    const alphaFor = (cutoff: number, dt: number) => {
      const tau = 1 / (2 * Math.PI * cutoff);
      return 1 / (1 + tau / dt);
    };

    const oneEuro = (state: EuroState, value: number, t: number) => {
      if (!state.init) {
        state.x = value; state.dx = 0; state.t = t; state.init = true;
        return value;
      }
      const dt = Math.max(1e-3, (t - state.t) / 1000);
      state.t = t;
      // Derivative estimate, low-passed
      const dxRaw = (value - state.x) / dt;
      const aD = alphaFor(ONE_EURO_D_CUTOFF, dt);
      state.dx = aD * dxRaw + (1 - aD) * state.dx;
      // Adaptive cutoff
      const cutoff = ONE_EURO_MIN_CUTOFF + ONE_EURO_BETA * Math.abs(state.dx);
      const a = alphaFor(cutoff, dt);
      state.x = a * value + (1 - a) * state.x;
      return state.x;
    };

    let lastVideoTime = -1;

    function renderLoop() {
      if (video.readyState === 4) {
        const startTimeMs = performance.now();
        if (lastVideoTime !== video.currentTime) {
          lastVideoTime = video.currentTime;
          try {
            // Keep canvas internal resolution in sync with the video stream.
            // If the camera resolution changes (e.g. orientation switch), the
            // canvas must follow or the overlay will scale incorrectly relative
            // to the normalized landmarks.
            if (
              video.videoWidth > 0 &&
              (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)
            ) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }

            const results = landmarkerRef.current!.detectForVideo(video, startTimeMs);
            ctx!.clearRect(0, 0, canvas.width, canvas.height);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              const raw = results.faceLandmarks[0];

              if (!xStates || xStates.length !== raw.length) {
                xStates = makeState(raw.length);
                yStates = makeState(raw.length);
                zStates = makeState(raw.length);
              }

              const out = new Array(raw.length);
              for (let i = 0; i < raw.length; i++) {
                const p = raw[i];
                out[i] = {
                  x: oneEuro(xStates[i], p.x, startTimeMs),
                  y: oneEuro(yStates![i], p.y, startTimeMs),
                  z: oneEuro(zStates![i], p.z ?? 0, startTimeMs),
                  visibility: p.visibility,
                };
              }

              latestLandmarksRef.current = out as any;
              if (currentLook) {
                drawMakeup(ctx!, out as any, canvas.width, canvas.height, activeSteps, currentLook);
              }
            } else {
              latestLandmarksRef.current = null;
              // Reset filter state so it re-initializes cleanly when the face returns
              xStates = null; yStates = null; zStates = null;
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      requestRef.current = requestAnimationFrame(renderLoop);
    }

    requestRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isReady, currentLook, activeSteps]);

  return { isReady, error, latestLandmarksRef };
}
