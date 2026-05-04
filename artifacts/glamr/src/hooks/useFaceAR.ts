import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { Look } from "../lib/looks";
import { drawMakeup } from "../lib/makeupRenderer";

export function useFaceAR(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  activeSteps: Record<string, number>, // stepId -> opacity (0 to 1)
  currentLook: Look | null
) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false
        });

        if (active) {
          landmarkerRef.current = faceLandmarker;
          startCamera();
        }
      } catch (err: any) {
        console.error("Failed to init MediaPipe", err);
        if (active) setError("Failed to load AR model.");
      }
    }

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 1280, height: 720 },
          audio: false
        });
        if (videoRef.current && active) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          videoRef.current.onloadedmetadata = () => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              setIsReady(true);
            }
          };
        }
      } catch (err: any) {
        console.error("Camera error", err);
        if (active) setError("Camera access denied.");
      }
    }

    init();

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      if (landmarkerRef.current) landmarkerRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (!isReady || !landmarkerRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastVideoTime = -1;

    function renderLoop() {
      if (video.readyState === 4) {
        let startTimeMs = performance.now();
        if (lastVideoTime !== video.currentTime) {
          lastVideoTime = video.currentTime;
          
          try {
            const results = landmarkerRef.current!.detectForVideo(video, startTimeMs);
            
            ctx!.clearRect(0, 0, canvas.width, canvas.height);

            if (results.faceLandmarks && results.faceLandmarks.length > 0 && currentLook) {
              const landmarks = results.faceLandmarks[0];
              drawMakeup(ctx!, landmarks, canvas.width, canvas.height, activeSteps, currentLook);
            }
          } catch(e) {
            console.error(e);
          }
        }
      }
      requestRef.current = requestAnimationFrame(renderLoop);
    }

    requestRef.current = requestAnimationFrame(renderLoop);

    return () => cancelAnimationFrame(requestRef.current);
  }, [isReady, currentLook, activeSteps]);

  return { isReady, error };
}
