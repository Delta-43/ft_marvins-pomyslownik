"use client";

import { useEffect, useRef, useState } from "react";
import { PauseButton, useMotion } from "./LandingClient";

// HERO-MAIN: the 3D symbol render. If the Blender loop is published at /landing/hero-loop.webm or .mp4
// it plays instead (muted, looped). Pause and reduced motion come from the landing's shared motion state.
const VIDEO_SOURCES = [
  { src: "/landing/hero-loop.webm", type: "video/webm" },
  { src: "/landing/hero-loop.mp4", type: "video/mp4" },
];
type Source = (typeof VIDEO_SOURCES)[number];

export function HeroArt() {
  const { paused, reduced } = useMotion();
  const [sources, setSources] = useState<Source[]>([]);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Only use the video if it is actually published.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      VIDEO_SOURCES.map((s) => fetch(s.src, { method: "HEAD", cache: "no-store" }).then((r) => (r.ok ? s : null)).catch(() => null)),
    ).then((found) => { if (!cancelled) setSources(found.filter((s): s is Source => s !== null)); });
    return () => { cancelled = true; };
  }, []);

  const motion = sources.length > 0 && !reduced;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true; // React does not reliably reflect the muted attribute; autoplay needs it.
    if (paused || !motion) v.pause();
    else v.play().catch(() => {});
  }, [paused, motion, sources]);

  const showVideo = motion && playing;
  return (
    <div className="relative mt-6 -ml-[clamp(1rem,4vw,3rem)] flex-[1_0_clamp(320px,38vw,560px)] overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-4 bottom-4 left-0 aspect-square max-w-full animate-[p-drift_8s_ease-in-out_infinite_alternate]"
        style={{ animationPlayState: paused || reduced ? "paused" : "running" }}
      >
        <picture className={showVideo ? "hidden" : "block h-full w-full"}>
          <source srcSet="/landing/hero-sygnet.avif" type="image/avif" />
          <img src="/landing/hero-sygnet.webp" alt="" width={2000} height={2000} className="block h-full w-full object-contain" />
        </picture>
        {/* No backing colour: the video blends (darken) straight into the hero colour fade behind it. */}
        {motion && (
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload="auto"
              poster="/landing/hero-loop-poster.webp"
              onPlaying={() => setPlaying(true)}
              onError={() => setSources([])}
              className={`h-full w-full object-contain mix-blend-darken [mask-image:radial-gradient(closest-side,#000_72%,transparent_100%)] ${showVideo ? "block" : "hidden"}`}
            >
              {sources.map((s) => <source key={s.src} src={s.src} type={s.type} />)}
            </video>
          </div>
        )}
      </div>
      <PauseButton className="absolute right-0 bottom-6" />
    </div>
  );
}
