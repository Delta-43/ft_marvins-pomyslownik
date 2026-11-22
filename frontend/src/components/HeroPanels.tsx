"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";

export type HeroPanel = { kicker: React.ReactNode; title: React.ReactNode; lead: React.ReactNode };

/** Landing hero: four panels in one slot. Every panel stays in the page for assistive technology; without JavaScript
 *  they are stacked and all readable. With JavaScript one shows at a time, changing every 6 s until the reader pauses,
 *  picks a panel, or prefers reduced motion. Rotation also holds while the pointer or keyboard focus is on the hero
 *  text or its controls, so nothing moves under the reader. */
export function HeroPanels({ panels, labels }: { panels: HeroPanel[]; labels: { group: string; show: string[]; pause: React.ReactNode; play: React.ReactNode } }) {
  const [{ active, prev }, setShown] = useState({ active: 0, prev: -1 });
  const show = (next: number | ((i: number) => number)) => setShown((s) => { const n = typeof next === "function" ? next(s.active) : next; return n === s.active ? s : { active: n, prev: s.active }; });
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
  }, []);
  useEffect(() => {
    if (paused || hold || !ready) return;
    const id = window.setInterval(() => show((i) => (i + 1) % panels.length), 6000);
    return () => window.clearInterval(id);
  }, [paused, hold, ready, panels.length]);

  return (
    <div className="hero-foot" onFocus={() => setHold(true)} onBlur={() => setHold(false)} onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)}>
      <div className="panels" data-js={ready ? "" : undefined}>
        {panels.map((p, i) => {
          const Title = i === 0 ? "h1" : "h2";
          return (
            <div key={i} className="panel" data-active={i === active ? "" : undefined} data-leaving={i === prev ? "" : undefined}>
              <p className="panel-kicker">{p.kicker}</p>
              <Title className="panel-title">{p.title}</Title>
              <p className="panel-lead">{p.lead}</p>
            </div>
          );
        })}
      </div>
      {ready && (
        <div className="panel-controls" role="group" aria-label={labels.group}>
          <button type="button" className="panel-pause" onClick={() => setPaused((v) => !v)}>
            <Icon name={paused ? "play" : "pause"} />{paused ? labels.play : labels.pause}
          </button>
          {panels.map((p, i) => (
            <button key={i} type="button" className="panel-dot" aria-current={i === active ? "true" : undefined}
              aria-label={labels.show[i]} onClick={() => { show(i); setPaused(true); }} />
          ))}
        </div>
      )}
    </div>
  );
}
