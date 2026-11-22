// Usage: node scripts/stability-check.mjs   (the dev server must run on :3000)
// 1. Language: every screen in pl, en and uk; the boxes of the interface elements must not move or resize.
// 2. Text size: at 125% and 150% every measured box must scale by the same factor as the text (no px leftovers).
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const env = Object.fromEntries(readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
const api = env.NEXT_PUBLIC_API_BASE_URL;
const token = (await (await fetch(api + "/api/v1/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ provider: "sandbox_id", providerSubject: "demo-jury" }) })).json()).data.token;
const port = 9600 + Math.floor(Math.random() * 90);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${port}`, "--no-first-run", "--hide-scrollbars", "--user-data-dir=" + mkdtempSync(join(tmpdir(), "pomyslownik-stab-")), "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
for (let i = 0; i < 50; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === "page"); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {} await sleep(200); }
await new Promise((r) => (ws.onopen = r));
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, (d) => (d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result))); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
const cookie = (name, value) => send("Network.setCookie", { name, value, domain: "localhost", path: "/" });
const card = (await (await fetch(api + "/api/v1/cards?limit=1", { headers: { Authorization: "Bearer " + token } })).json()).data[0].id;

// Interface elements whose box must not depend on the language. Content from the API (titles, summaries) is excluded,
// except result tiles, which are clamped to a fixed number of lines.
const SEL = {
  "/": [".login-card", ".login-card h2", ".login-card .btn-primary", ".login-card .btn-secondary", ".lang-row", ".login-links", ".hero-foot"],
  "/szukaj": [".nav", ".navlinks", ".nav-right", ".search-title", ".search-form", ".search-form .btn", ".tags-block", ".examples", ".example"],
  "/wyniki": [".nav", ".search-form", ".filters", ".fhead", ".rhead", ".rhead .sort", ".list > li:nth-child(1)", ".list > li:nth-child(2)", ".pager"],
  ["/wyniki?karta=" + card]: [".nav", ".d-head .jump", ".detail-bar", ".detail-bar .btn-primary", "#d-facts > h2", "#d-sources summary", "#d-evidence summary"],
};
const measure = (sels) => ev(`JSON.stringify(${JSON.stringify(sels)}.map(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }))`).then(JSON.parse);
let fails = 0;
await cookie("pomyslownik_session", token);
for (const [vp, w, h, mobile] of [["desktop", 1440, 900, false], ["phone", 390, 844, true]]) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
  console.log(`\n== ${vp}: language`);
  for (const [path, sels] of Object.entries(SEL)) {
    const byLang = {};
    for (const l of ["pl", "en", "uk"]) {
      await cookie("NEXT_LOCALE", l); await cookie("pomyslownik_display", "100|auto");
      if (path === "/") await send("Network.deleteCookies", { name: "pomyslownik_session", domain: "localhost" }); else await cookie("pomyslownik_session", token);
      await send("Page.navigate", { url: "http://localhost:3000" + path }); await sleep(2600); await ev("document.fonts.ready.then(() => 1)"); await sleep(200);
      byLang[l] = await measure(sels);
    }
    sels.forEach((s, i) => {
      const [a, b, c] = ["pl", "en", "uk"].map((l) => byLang[l][i]);
      if (!a) return console.log(`  --   ${path} ${s} (not on page)`);
      const same = JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(a) === JSON.stringify(c);
      if (!same) fails++;
      console.log(`  ${same ? "ok  " : "MOVE"} ${path.slice(0, 18)} ${s}  ${same ? JSON.stringify(a) : `pl ${a} en ${b} uk ${c}`}`);
    });
  }
}
// Text size: measure a set of components at 100 / 125 / 150 on a wide desktop, where the layout does not reflow.
console.log("\n== text size (1920 wide)");
await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1200, deviceScaleFactor: 1, mobile: false });
await cookie("NEXT_LOCALE", "pl"); await cookie("pomyslownik_session", token);
const comps = [".nav", ".navlink", ".search-form", ".search-form .btn", ".chip", ".fsel select", ".opt", ".card", ".badge", ".pager ul a", ".avatar"];
const at = {};
for (const size of ["100", "125", "150"]) {
  await cookie("pomyslownik_display", `${size}|auto`);
  await send("Page.navigate", { url: "http://localhost:3000/wyniki" }); await sleep(2600); await ev("document.fonts.ready.then(() => 1)");
  at[size] = await ev(`JSON.stringify(${JSON.stringify(comps)}.map(s => { const e = document.querySelector(s); if (!e) return null; const c = getComputedStyle(e); return { h: e.getBoundingClientRect().height, pad: parseFloat(c.paddingTop) + parseFloat(c.paddingLeft), r: parseFloat(c.borderTopLeftRadius), gap: parseFloat(c.rowGap) || 0 }; }))`).then(JSON.parse);
}
comps.forEach((s, i) => {
  const base = at["100"][i]; if (!base) return console.log(`  --   ${s} (not on page)`);
  for (const [size, k] of [["125", 1.25], ["150", 1.5]]) {
    const m = at[size][i];
    const bad = ["pad", "r", "gap", "h"].filter((p) => base[p] > 0 && p !== "r" && Math.abs(m[p] / base[p] - k) > (p === "h" ? 0.12 : 0.03) || (p === "r" && base.r > 0 && base.r < 100 && Math.abs(m.r / base.r - k) > 0.03));
    if (bad.length) fails++;
    console.log(`  ${bad.length ? "OFF " : "ok  "} ${size}% ${s}  ${bad.length ? bad.map((p) => `${p} ${base[p].toFixed(1)}→${m[p].toFixed(1)}`).join(", ") : `h ×${(m.h / base.h).toFixed(2)}`}`);
  }
});
console.log(fails ? `\n${fails} PROBLEM(S)` : "\nNO MOVEMENT, EVEN SCALING");
chrome.kill(); process.exit(0);
