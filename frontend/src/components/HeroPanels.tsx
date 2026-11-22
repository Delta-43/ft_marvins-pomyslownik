"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";
import { HeroScene } from "@/components/HeroScene";

export type HeroPanel = { kicker: React.ReactNode; title: React.ReactNode; lead: React.ReactNode };

/** Landing hero: four panels in one slot. Every panel stays in the page for assistive technology; without JavaScript
 *  they are stacked and all readable. With JavaScript one shows at a time, changing every 6 s until the reader pauses,
 *  picks a panel, or prefers reduced motion. Rotation also holds while the pointer or keyboard focus is on the hero
 *  text or its controls, so nothing moves under the reader, and while a field of the sign-in card has focus, so nothing
 *  moves beside someone who is typing: the panels wait and the scene stops where it is. */
export function HeroPanels({ panels, labels }: { panels: HeroPanel[]; labels: { group: string; show: string[]; pause: React.ReactNode; play: React.ReactNode } }) {
  const [{ active, prev }, setShown] = useState({ active: 0, prev: -1 });
  const show = (next: number | ((i: number) => number)) => setShown((s) => { const n = typeof next === "function" ? next(s.active) : next; return n === s.active ? s : { active: n, prev: s.active }; });
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [ready, setReady] = useState(false);
  // The pause button also stops the scene mid-flight; picking a panel lets its act play through once.
  const [frozen, setFrozen] = useState(false);
  // Flips on every picked panel, so the scene's short fade-in restarts for that cut only.
  const [jump, setJump] = useState("");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    setReady(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
  }, []);
  useEffect(() => {
    const FIELDS = ".login-card :is(input, select, textarea)";
    const inField = (el: EventTarget | Element | null) => el instanceof Element && el.matches(FIELDS);
    const onIn = (e: FocusEvent) => setTyping(inField(e.target));
    const onOut = (e: FocusEvent) => { if (!inField(e.relatedTarget)) setTyping(false); };
    setTyping(inField(document.activeElement)); // a field focused on load (after a failed sign-in)
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => { document.removeEventListener("focusin", onIn); document.removeEventListener("focusout", onOut); };
  }, []);
  useEffect(() => {
    if (paused || hold || typing || !ready) return;
    const id = window.setInterval(() => show((i) => (i + 1) % panels.length), 6000);
    return () => window.clearInterval(id);
  }, [paused, hold, typing, ready, panels.length]);

  return (
    <>
    <HeroScene scene={ready ? active + 1 : null} frozen={frozen || typing} jump={jump} />
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
          <button type="button" className="panel-pause" onClick={() => { setFrozen(!paused); setPaused(!paused); }}>
            <Icon name={paused ? "play" : "pause"} />{paused ? labels.play : labels.pause}
          </button>
          {panels.map((p, i) => (
            <button key={i} type="button" className="panel-dot" aria-current={i === active ? "true" : undefined}
              aria-label={labels.show[i]} onClick={() => { if (i !== active) setJump((j) => (j === "a" ? "b" : "a")); show(i); setPaused(true); setFrozen(false); }} />
          ))}
        </div>
      )}
    </div>
    </>
  );
}
