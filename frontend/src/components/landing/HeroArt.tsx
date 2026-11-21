"use client";

import { useEffect, useRef, useState } from "react";

// Hero artwork: the 3D symbol render. If the Blender loop has been published to
// /landing/hero-loop.webm or .mp4 it plays instead (muted, looped), with a pause control.
// With prefers-reduced-motion the still render is shown and nothing moves (WCAG 2.2.2).
const VIDEO_SOURCES = [
  { src: "/landing/hero-loop.webm", type: "video/webm" },
  { src: "/landing/hero-loop.mp4", type: "video/mp4" },
];

export function HeroArt() {
  const [sources, setSources] = useState<typeof VIDEO_SOURCES>([]);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Only use the video if it is actually published.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      VIDEO_SOURCES.map((s) =>
        fetch(s.src, { method: "HEAD", cache: "no-store" }).then((r) => (r.ok ? s : null)).catch(() => null),
      ),
    ).then((found) => {
      if (!cancelled) setSources(found.filter((s): s is (typeof VIDEO_SOURCES)[number] => s !== null));
    });
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

  return (
    <div className="relative h-full min-h-[320px]">
      <div
        aria-hidden="true"
        className="absolute inset-y-4 left-0 aspect-square max-w-full motion-safe:animate-[p-drift_8s_ease-in-out_infinite_alternate]"
        style={{ animationPlayState: paused ? "paused" : "running" }}
      >
        <picture className={playing && motion ? "hidden" : "block h-full w-full"}>
          <source srcSet="/landing/hero-sygnet.avif" type="image/avif" />
          <img src="/landing/hero-sygnet.webp" alt="" width={2000} height={2000} className="h-full w-full object-contain" />
        </picture>
        {motion && (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="auto"
            onPlaying={() => setPlaying(true)}
            onError={() => setSources([])}
            className={`h-full w-full object-contain mix-blend-darken [mask-image:radial-gradient(closest-side,#000_72%,transparent_100%)] ${playing ? "block" : "hidden"}`}
          >
            {sources.map((s) => <source key={s.src} src={s.src} type={s.type} />)}
          </video>
        )}
      </div>
      {!reduced && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="btn-secondary absolute bottom-6 right-0 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-base font-bold"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d={paused ? "M5 3v10l8.5-5Z" : "M4 3h3v10H4Z M9 3h3v10H9Z"} fill="currentColor" />
          </svg>
          {paused ? "Wznów animację" : "Zatrzymaj animację"}
        </button>
      )}
    </div>
  );
}
