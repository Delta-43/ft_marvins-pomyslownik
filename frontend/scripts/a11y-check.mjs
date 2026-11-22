// Automated accessibility run (issue #41): axe-core, a keyboard pass and reflow, in headless Chrome.
//
// axe-core is not a dependency of the app. Install it anywhere outside the repo and point the script at it:
//   npm install axe-core --prefix /tmp/axe
//   AXE=/tmp/axe/node_modules/axe-core/axe.min.js node scripts/a11y-check.mjs <out-dir> [config-filter] [page-filter]
// The app must run on http://localhost:3000 (BASE overrides it) with the live API, since the run signs in with the
// demo account through the landing's "demo" button. Chrome is the one in /Applications (CHROME overrides it).
//
// Output: <out-dir>/a11y-results.json (every violation with its nodes) and a summary on stdout: axe violations per
// page × config by impact, focus problems found by tabbing, and horizontal overflow.
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const AXE = process.env.AXE || process.argv.find((a) => a.endsWith("axe.min.js"));
if (!AXE) { console.error("Set AXE=/path/to/axe-core/axe.min.js (see the header of this file)"); process.exit(2); }
const args = process.argv.slice(2).filter((a) => !a.endsWith("axe.min.js"));
const out = args[0] || "a11y-out"; mkdirSync(out, { recursive: true });
const cfgFilter = args[1] && args[1] !== "all" ? new RegExp(args[1]) : null;
const pageFilter = args[2] ? new RegExp(args[2]) : null;
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const axeSrc = readFileSync(AXE, "utf8");
// INJECT_CSS=<file>: add that stylesheet to every page, to check CSS fixes against a server that runs older code.
const injectCss = process.env.INJECT_CSS ? readFileSync(process.env.INJECT_CSS, "utf8") : "";
const CARD = "d3adf685-81b9-4c6b-911e-103cd36e6e8a";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => { if (process.env.DEBUG) console.error(new Date().toISOString().slice(11, 19), ...a); };

// Configurations: viewport, language, display cookie ("text|contrast"), emulated media. "zoom200" is 200% browser
// zoom on a 1440 px window (720 CSS px) together with the 150% text setting.
const CONFIGS = [
  { name: "1440-pl", w: 1440, h: 900, lang: "pl", keys: true },
  { name: "1440-en", w: 1440, h: 900, lang: "en" },
  { name: "1440-uk", w: 1440, h: 900, lang: "uk" },
  { name: "390-pl", w: 390, h: 844, mobile: true, lang: "pl", keys: true },
  { name: "390-en", w: 390, h: 844, mobile: true, lang: "en" },
  { name: "390-uk", w: 390, h: 844, mobile: true, lang: "uk" },
  { name: "zoom200-150-pl", w: 720, h: 450, lang: "pl", display: "150|auto" },
  { name: "zoom200-150-uk", w: 720, h: 450, lang: "uk", display: "150|auto" },
  { name: "320-pl", w: 320, h: 640, mobile: true, lang: "pl" },
  { name: "320-150-uk", w: 320, h: 640, mobile: true, lang: "uk", display: "150|auto" },
  { name: "high-1440-pl", w: 1440, h: 900, lang: "pl", display: "100|high", keys: true },
  { name: "high-390-pl", w: 390, h: 844, mobile: true, lang: "pl", display: "100|high" },
  { name: "low-1440-pl", w: 1440, h: 900, lang: "pl", display: "100|low" },
  { name: "forced-1440-pl", w: 1440, h: 900, lang: "pl", media: [{ name: "forced-colors", value: "active" }], keys: true },
].filter((c) => !cfgFilter || cfgFilter.test(c.name));

// Pages. `out` = signed out; `prep` runs in the page before the checks; `phone` = only on narrow viewports.
const PAGES = [
  { name: "landing", path: "/", out: true },
  { name: "register", path: "/?konto=nowe", out: true },
  { name: "search", path: "/szukaj" },
  { name: "results", path: "/wyniki" },
  { name: "results-filtered", path: "/wyniki", filtered: true },
  { name: "filter-sheet", path: "/wyniki?filtry=1", phone: true },
  { name: "card", path: `/wyniki?karta=${CARD}`, prep: "document.querySelectorAll('.detail details').forEach((d) => { d.open = true; })" },
  { name: "sources", path: "/zrodla" },
  { name: "profile", path: "/profil" },
  { name: "terms", path: "/regulamin" },
  { name: "accessibility", path: "/dostepnosc" },
  { name: "methodology", path: "/metodologia" },
  { name: "missing-card", path: "/wyniki?karta=00000000-0000-0000-0000-000000000000" },
].filter((p) => !pageFilter || pageFilter.test(p.name));

async function browser() {
  const port = 9800 + Math.floor(Math.random() * 190);
  const proc = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, "--no-first-run", "--hide-scrollbars", "--user-data-dir=" + mkdtempSync(join(tmpdir(), "pomyslownik-a11y-")), "about:blank"], { stdio: "ignore" });
  let ws; let id = 0; const pending = new Map();
  for (let i = 0; i < 60 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === "page"); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch {} await sleep(200); }
  if (ws.readyState !== 1) await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  // Every call times out after 45 s, so a page that never settles fails its row instead of stalling the run.
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; const t = setTimeout(() => { pending.delete(i); rej(new Error(method + " timed out")); }, 45000); pending.set(i, (d) => { clearTimeout(t); d.error ? rej(new Error(method + " " + JSON.stringify(d.error))) : res(d.result); }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || r.exceptionDetails.text) + " in " + expr.slice(0, 80)); return r.result.value; };
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
  return { send, ev, close: () => proc.kill() };
}

const cookie = (name, value) => ({ name, value, url: BASE, path: "/" });

async function load(b, path) {
  log("load", path);
  await b.send("Page.navigate", { url: BASE + path });
  for (let i = 0; i < 60; i++) { await sleep(150); try { if ((await b.ev("document.readyState")) === "complete") break; } catch {} }
  await sleep(900);
  await b.ev("document.fonts.ready.then(() => true)");
  await b.ev("document.querySelectorAll('nextjs-portal').forEach((e) => e.remove()); true"); // the dev-mode overlay
  if (injectCss) { await b.ev(`(() => { const s = document.createElement("style"); s.textContent = ${JSON.stringify(injectCss)}; document.head.append(s); return true; })()`); await sleep(200); }
}

// Keyboard pass: Tab through the page; for each stop record where focus went, whether it is hidden or covered, and
// whether a focus indicator appears (outline or box-shadow on the element, its ::before/::after, its parent chain or
// the next sibling, compared with the same element after focus has moved on).
const STYLE_PROBE = `(() => {
  const sig = (el, pseudo) => { if (!el) return ""; const s = getComputedStyle(el, pseudo); return [s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0 ? s.outlineStyle + " " + s.outlineWidth + " " + s.outlineColor : "", s.boxShadow === "none" ? "" : s.boxShadow].join("|"); };
  window.__sig = (el) => [sig(el), sig(el, "::before"), sig(el, "::after"), sig(el.parentElement), sig(el.parentElement?.parentElement), sig(el.parentElement?.parentElement?.parentElement), sig(el.nextElementSibling)];
  window.__desc = (el) => { const t = el.tagName.toLowerCase(); const n = (el.getAttribute("aria-label") || el.innerText || el.value || el.name || "").trim().replace(/\\s+/g, " ").slice(0, 40); return t + (el.id ? "#" + el.id : "") + (el.classList.length ? "." + [...el.classList].slice(0, 2).join(".") : "") + (n ? " “" + n + "”" : ""); };
  window.__hidden = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return "zero size";
    // A native checkbox drawn by its sibling (the switch) is transparent on purpose; its sibling shows focus.
    const drawn = el.matches("input[type=checkbox], input[type=radio]") && el.nextElementSibling;
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: !drawn, visibilityProperty: true })) return "invisible";
    if (el.closest("[inert], [aria-hidden='true']")) return "inside inert or aria-hidden";
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return "off screen";
    // Covered (2.4.11): every sample point of the visible part lies under a sticky or fixed layer that is not the element.
    const ok = (hit) => !hit || hit === el || el.contains(hit) || hit.contains(el) || (el.labels && [...el.labels].some((l) => l.contains(hit)));
    const covering = (hit) => { for (let p = hit; p && p !== document.body; p = p.parentElement) { const pos = getComputedStyle(p).position; if (pos === "sticky" || pos === "fixed") return p; } return null; };
    const top = Math.max(r.top, 0) + 2, bottom = Math.min(r.bottom, innerHeight) - 2, left = Math.max(r.left, 0) + 2, right = Math.min(r.right, innerWidth) - 2;
    const pts = [[(left + right) / 2, top], [(left + right) / 2, (top + bottom) / 2], [(left + right) / 2, bottom], [left, (top + bottom) / 2], [right, (top + bottom) / 2]];
    let cover = null;
    for (const [x, y] of pts) { const hit = document.elementFromPoint(x, y); if (ok(hit)) return ""; const c = covering(hit); if (!c) return ""; cover = c; }
    return cover ? "covered by " + window.__desc(cover) : "";
  };
  return true;
})()`;

async function keyboardPass(b) {
  await b.ev(STYLE_PROBE);
  // Start from the top of the document whatever the page focused on load (the search box, a heading).
  await b.ev("(() => { window.scrollTo(0, 0); const s = document.createElement('div'); s.tabIndex = -1; s.id = '__a11y_start'; document.body.prepend(s); s.focus(); return true; })()");
  const stops = []; let prev = null; const seen = new Set();
  for (let i = 0; i < 120; i++) {
    await b.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await b.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await sleep(60);
    const s = await b.ev(`(() => {
      document.getElementById("__a11y_start")?.remove();
      const el = document.activeElement; if (!el || el === document.body) return null;
      if (!window.__stops) window.__stops = []; let idx = window.__stops.indexOf(el); const first = idx < 0; if (first) { window.__stops.push(el); idx = window.__stops.length - 1; }
      const prev = window.__prevEl; const prevBlur = prev ? window.__sig(prev) : null; window.__prevEl = el;
      return { idx, first, desc: window.__desc(el), focused: window.__sig(el), prevBlur, hidden: window.__hidden(el), fv: el.matches(":focus-visible") };
    })()`);
    if (prev && s?.prevBlur) prev.blurred = s.prevBlur;
    if (!s) { if (prev) { prev.blurred = await b.ev("window.__prevEl ? window.__sig(window.__prevEl) : null"); } break; }
    if (!s.first || seen.has(s.idx)) break; // wrapped around
    seen.add(s.idx); stops.push(s); prev = s;
  }
  const problems = [];
  for (const s of stops) {
    const indicator = s.blurred ? s.focused.some((v, i) => v && v !== s.blurred[i]) : s.focused.some(Boolean);
    if (s.hidden) problems.push(`${s.desc}: focus on hidden element (${s.hidden})`);
    else if (!indicator) problems.push(`${s.desc}: no visible focus indicator`);
  }
  return { stops: stops.length, problems };
}

async function overflow(b) {
  return b.ev(`(() => {
    const sw = document.documentElement.scrollWidth, w = innerWidth; if (sw <= w) return null;
    const bad = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect(); if (r.right <= w + 1 || r.width === 0) continue;
      let p = el.parentElement, clipped = false; while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o !== "visible") { clipped = true; break; } p = p.parentElement; }
      if (!clipped && !(el.parentElement && el.parentElement.getBoundingClientRect().right > w + 1 && bad.length)) bad.push(window.__desc ? window.__desc(el) : el.tagName + "." + el.className);
      if (bad.length > 6) break;
    }
    return { scrollWidth: sw, width: w, elements: bad };
  })()`);
}

async function runAxe(b) {
  if (!(await b.ev("typeof window.axe === 'object'"))) await b.ev(axeSrc + "\n;true");
  return b.ev(`axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] }, resultTypes: ["violations", "incomplete"] }).then((r) => ({
    violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, tags: v.tags.filter((t) => t.startsWith("wcag")), nodes: v.nodes.map((n) => ({ target: n.target.join(" "), summary: n.failureSummary.slice(0, 300) })) })),
    incomplete: r.incomplete.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length })),
  }))`);
}

async function runConfig(c) {
  const b = await browser(); const rows = [];
  try {
    await b.send("Emulation.setDeviceMetricsOverride", { width: c.w, height: c.h, deviceScaleFactor: 1, mobile: !!c.mobile });
    if (c.mobile) await b.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await b.send("Emulation.setEmulatedMedia", { features: c.media || [] });
    await b.send("Network.setCookies", { cookies: [cookie("NEXT_LOCALE", c.lang), cookie("pomyslownik_display", c.display || "100|auto")] });
    // Sign in with the demo account once; keep the session cookie to switch between signed in and out.
    await load(b, "/");
    await b.ev("document.querySelector('button[name=mode][value=demo]').click(); true");
    for (let i = 0; i < 40; i++) { await sleep(250); if ((await b.ev("location.pathname").catch(() => "")) === "/szukaj") break; }
    const session = (await b.send("Network.getCookies", { urls: [BASE] })).cookies.find((k) => k.name === "pomyslownik_session");
    if (!session) throw new Error("demo sign-in failed");
    let signedIn = true;
    for (const p of PAGES) {
      if (p.phone && c.w > 820) continue;
      if (p.out && signedIn) { await b.send("Network.deleteCookies", { name: "pomyslownik_session", url: BASE }); signedIn = false; }
      if (!p.out && !signedIn) { await b.send("Network.setCookies", { cookies: [{ ...cookie("pomyslownik_session", session.value), httpOnly: session.httpOnly }] }); signedIn = true; }
      let path = p.path;
      if (p.filtered) { await load(b, "/wyniki"); const q = await b.ev("(() => { const a = document.querySelector('input[name=area]'), l = document.querySelector('input[name=implementationLevel]'); return new URLSearchParams([...(a ? [['area', a.value]] : []), ...(l ? [['implementationLevel', l.value]] : [])]).toString(); })()"); path = "/wyniki?" + q; }
      await load(b, path);
      if (p.prep) { await b.ev(p.prep + "; true"); await sleep(400); }
      const row = { config: c.name, page: p.name, path, lang: await b.ev("document.documentElement.lang") };
      log("axe", p.name);
      try { const r = await runAxe(b); row.violations = r.violations; row.incomplete = r.incomplete; } catch (e) { row.error = String(e).slice(0, 200); }
      await b.ev(STYLE_PROBE);
      row.overflow = await overflow(b);
      if (c.keys) { await load(b, path); if (p.prep) { await b.ev(p.prep + "; true"); await sleep(300); } row.keyboard = await keyboardPass(b); }
      if (process.env.SHOTS) { const s = await b.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); writeFileSync(join(out, `${c.name}-${p.name}.png`), Buffer.from(s.data, "base64")); }
      rows.push(row);
      const byImp = count(row.violations || []);
      process.stdout.write(`${c.name.padEnd(16)} ${p.name.padEnd(17)} ${fmt(byImp)}${row.overflow ? `  OVERFLOW ${row.overflow.scrollWidth}>${row.overflow.width}` : ""}${row.keyboard ? `  keys ${row.keyboard.stops} stops, ${row.keyboard.problems.length} problems` : ""}${row.error ? "  ERROR " + row.error : ""}\n`);
    }
  } finally { b.close(); }
  return rows;
}

const IMPACTS = ["critical", "serious", "moderate", "minor"];
const count = (vs) => Object.fromEntries(IMPACTS.map((i) => [i, vs.filter((v) => v.impact === i).length]));
const fmt = (c) => IMPACTS.map((i) => `${i.slice(0, 3)} ${c[i]}`).join("  ");

const results = [];
const queue = [...CONFIGS];
await Promise.all(Array.from({ length: Number(process.env.JOBS || 3) }, async () => { while (queue.length) { const c = queue.shift(); try { results.push(...(await runConfig(c))); } catch (e) { console.log(`${c.name}: FAILED ${e.message}`); } } }));
writeFileSync(join(out, "a11y-results.json"), JSON.stringify(results, null, 1));

console.log("\n== axe violations by rule (config × page where it occurs)");
const byRule = new Map();
for (const r of results) for (const v of r.violations || []) { const k = `${v.impact} ${v.id}: ${v.help}`; if (!byRule.has(k)) byRule.set(k, []); byRule.get(k).push(`${r.config}/${r.page} (${v.nodes.length}: ${v.nodes[0].target.slice(0, 60)})`); }
for (const [k, l] of [...byRule].sort()) console.log(`${k}\n    ${l.slice(0, 8).join("\n    ")}${l.length > 8 ? `\n    … ${l.length - 8} more` : ""}`);
console.log("\n== keyboard problems");
for (const r of results) for (const p of r.keyboard?.problems || []) console.log(`${r.config}/${r.page}: ${p}`);
console.log("\n== horizontal overflow");
for (const r of results) if (r.overflow) console.log(`${r.config}/${r.page}: ${r.overflow.scrollWidth} > ${r.overflow.width}  ${r.overflow.elements.join(", ")}`);
const total = count(results.flatMap((r) => r.violations || []));
console.log(`\n${results.length} page runs. Violations (rule × page): ${fmt(total)}. Keyboard problems: ${results.reduce((n, r) => n + (r.keyboard?.problems.length || 0), 0)}. Overflowing pages: ${results.filter((r) => r.overflow).length}.`);
process.exit(0);
