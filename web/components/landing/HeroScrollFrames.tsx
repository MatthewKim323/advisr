"use client";

import { useEffect, useRef, useState } from "react";

/**
 * HeroScrollFrames — scroll-scrubbed "video" that actually feels smooth.
 *
 * THE PROBLEM with scrubbing a <video> via `video.currentTime = t`:
 *   Every assignment triggers a seek. Each seek decodes a keyframe plus
 *   all the delta frames up to the target. Browsers rate-limit this
 *   hard — you get 2-5fps scrub no matter how well-lerped your rAF loop
 *   is. This is not a bug you can optimize past.
 *
 * THE FIX (same approach iris uses in `ScrollFrames`):
 *   Decode the clip into an array of ImageBitmaps once, upfront. Then
 *   on scroll, pick the target frame index and `drawImage` it onto a
 *   2D canvas. Blits are GPU-accelerated, ~60fps trivially, and we
 *   never seek again — we just index into memory.
 *
 * CAPTURE STRATEGY:
 *   - Offscreen <video> plays through once at 1.5x (muted, CORS-enabled).
 *   - `requestVideoFrameCallback` fires per decoded frame. We sample
 *     down to `TARGET_FRAMES` (~60) evenly across the clip's duration,
 *     using `createImageBitmap(..., {resizeWidth, resizeHeight})` to
 *     downsize frames to display-appropriate resolution. ImageBitmap
 *     lives in GPU memory, so memory pressure stays sane.
 *   - Fires a CORS-safe request (`crossOrigin = "anonymous"`) so the
 *     canvas never gets tainted.
 *
 * FALLBACK:
 *   If capture fails for any reason (CORS, unsupported browser,
 *   decode error), we pivot to the old "autoplay loop + parallax"
 *   mode so the hero never just dies.
 *
 * SCROLL → FRAME:
 *   Hero's visible scroll window (top entering → bottom leaving
 *   viewport) maps to frame 0 → lastFrame. A lerp'd rAF smooths the
 *   scroll signal so frame transitions feel weighted instead of
 *   stepping one-to-one with trackpad noise. Lenis (installed in
 *   CritiqueLanding) also contributes inertial scroll deltas.
 */

interface Props {
  src: string;
  heroRef: React.RefObject<HTMLElement | null>;
}

const TARGET_FRAMES = 72;
const CAPTURE_WIDTH = 960;
const CAPTURE_PLAYBACK_RATE = 1.5;

type Status = "loading" | "ready" | "fallback";

export function HeroScrollFrames({ src, heroRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const framesRef = useRef<ImageBitmap[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [progress, setProgress] = useState(0);

  /* Capture pass — runs once on mount. */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const video = document.createElement("video");
    videoRef.current = video;
    video.src = src;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.style.position = "fixed";
    video.style.left = "-9999px";
    video.style.top = "-9999px";
    video.style.width = "16px";
    video.style.height = "16px";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    document.body.appendChild(video);

    let cancelled = false;
    let captureStep = 0;
    let nextCaptureTime = 0;

    const giveUpToFallback = (reason: string) => {
      if (cancelled) return;
      console.warn("[HeroScrollFrames] fallback:", reason);
      setStatus("fallback");
    };

    const hasRVFC =
      "requestVideoFrameCallback" in HTMLVideoElement.prototype;

    const handleFrame = async () => {
      if (cancelled) return;
      const duration = video.duration;
      if (!duration || !Number.isFinite(duration)) {
        return giveUpToFallback("no duration");
      }
      if (captureStep === 0) {
        nextCaptureTime = 0;
        captureStep = duration / TARGET_FRAMES;
      }

      if (
        video.currentTime + 0.001 >= nextCaptureTime &&
        framesRef.current.length < TARGET_FRAMES
      ) {
        try {
          const aspect = video.videoHeight / video.videoWidth || 9 / 16;
          const bmp = await createImageBitmap(video, {
            resizeWidth: CAPTURE_WIDTH,
            resizeHeight: Math.round(CAPTURE_WIDTH * aspect),
            resizeQuality: "medium",
          });
          if (cancelled) {
            bmp.close();
            return;
          }
          framesRef.current.push(bmp);
          nextCaptureTime += captureStep;
          setProgress(framesRef.current.length / TARGET_FRAMES);
        } catch (err) {
          return giveUpToFallback(`createImageBitmap: ${String(err)}`);
        }
      }

      if (
        framesRef.current.length >= TARGET_FRAMES ||
        video.ended ||
        video.currentTime >= duration - 0.01
      ) {
        // capture complete
        video.pause();
        if (framesRef.current.length < 4) {
          return giveUpToFallback("too few frames");
        }
        setStatus("ready");
        return;
      }

      if (hasRVFC) {
        (video as HTMLVideoElement & {
          requestVideoFrameCallback: (cb: VideoFrameRequestCallback) => number;
        }).requestVideoFrameCallback(handleFrame);
      } else {
        requestAnimationFrame(handleFrame);
      }
    };

    const startCapture = () => {
      if (cancelled || prefersReduced) {
        setStatus("fallback");
        return;
      }
      video.playbackRate = CAPTURE_PLAYBACK_RATE;
      void video.play().then(
        () => {
          if (hasRVFC) {
            (video as HTMLVideoElement & {
              requestVideoFrameCallback: (
                cb: VideoFrameRequestCallback,
              ) => number;
            }).requestVideoFrameCallback(handleFrame);
          } else {
            // No rVFC (older Safari/FF) — just poll on rAF
            requestAnimationFrame(handleFrame);
          }
        },
        (err) => giveUpToFallback(`play: ${String(err)}`),
      );
    };

    const onMeta = () => {
      if (!video.duration || video.duration < 0.5) {
        return giveUpToFallback("bad duration");
      }
      startCapture();
    };

    const onError = () => giveUpToFallback("video error");

    video.addEventListener("loadedmetadata", onMeta, { once: true });
    video.addEventListener("error", onError, { once: true });

    // safety timeout — if we're still "loading" 20s in, bail to fallback.
    const killT = window.setTimeout(() => {
      if (!cancelled && framesRef.current.length < 4) {
        giveUpToFallback("timeout");
      }
    }, 20_000);

    return () => {
      cancelled = true;
      window.clearTimeout(killT);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("error", onError);
      try {
        video.pause();
      } catch {
        /* noop */
      }
      for (const bmp of framesRef.current) bmp.close?.();
      framesRef.current = [];
      video.remove();
      videoRef.current = null;
    };
  }, [src]);

  /* Scroll → frame index render loop. Only runs once status === "ready". */
  useEffect(() => {
    if (status !== "ready") return;
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    const hero = heroRef.current;
    if (!canvas || !hero) return;

    const frames = framesRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Size the backing buffer to display * DPR for crispness.
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
    };
    resize();

    let targetIdx = 0;
    let displayIdx = 0;
    let raf = 0;
    let lastDrawnIdx = -1;

    const computeTarget = () => {
      const rect = hero.getBoundingClientRect();
      const total = rect.height + window.innerHeight;
      const scrolled = Math.max(
        0,
        Math.min(total, window.innerHeight - rect.top),
      );
      const p = total > 0 ? scrolled / total : 0;
      targetIdx = p * (frames.length - 1);
    };

    const draw = (idx: number) => {
      const i = Math.max(0, Math.min(frames.length - 1, Math.round(idx)));
      if (i === lastDrawnIdx) return;
      lastDrawnIdx = i;
      const bmp = frames[i];
      // object-fit: cover; object-position: right center (matches the
      // original CSS rule on .hero-bg video so framing is unchanged)
      const cw = canvas.width;
      const ch = canvas.height;
      const bw = bmp.width;
      const bh = bmp.height;
      const scale = Math.max(cw / bw, ch / bh);
      const dw = bw * scale;
      const dh = bh * scale;
      const dx = cw - dw; // flush right
      const dy = (ch - dh) / 2;
      ctx.drawImage(bmp, dx, dy, dw, dh);
    };

    const tick = () => {
      displayIdx += (targetIdx - displayIdx) * 0.18;
      if (Math.abs(targetIdx - displayIdx) < 0.01) displayIdx = targetIdx;
      draw(displayIdx);
      raf = requestAnimationFrame(tick);
    };

    computeTarget();
    displayIdx = targetIdx;
    draw(displayIdx);

    const onScroll = () => computeTarget();
    const onResize = () => {
      resize();
      lastDrawnIdx = -1;
      draw(displayIdx);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [status, heroRef]);

  /* Fallback: inline <video> with autoplay loop + parallax, so if capture
   * fails we still show something alive. */
  if (status === "fallback") {
    return (
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      >
        <source src={src} type="video/mp4" />
      </video>
    );
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          // Hide the blank canvas while capturing so the hero fallback
          // (gradient / bg) reads first; reveal once frames are ready.
          opacity: status === "ready" ? 1 : 0,
          transition: "opacity 480ms ease-out",
          zIndex: 0,
        }}
      />
      {status === "loading" && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 24,
            bottom: 24,
            fontFamily:
              '"Syne Mono", "JetBrains Mono", ui-monospace, monospace',
            fontSize: 10,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(230,165,89,0.82)",
            zIndex: 3,
            pointerEvents: "none",
            textShadow: "0 0 12px rgba(230,165,89,0.35)",
          }}
        >
          decoding hull · {Math.round(progress * 100)}%
        </div>
      )}
    </>
  );
}
