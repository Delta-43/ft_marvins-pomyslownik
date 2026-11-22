// Headless flow test: landing → sign in (demo) → search → results → card → back, on desktop and phone.
// Checks URLs, titles, focus, view-transition animations, languages, reduced motion, console errors.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const out = process.argv[2]; mkdirSync(out, { recursive: true });
const port = 9900 + Math.floor(Math.random() * 90);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${port}`, "--no-first-run", "--hide-scrollbars", "--user-data-dir=" + mkdtempSync(join(tmpdir(), "pomyslownik-flow-")), "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pending = new Map(); const errors = [];
for (let i = 0; i < 50; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === "page"); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {} await sleep(200); }
await new Promise((r) => (ws.onopen = r));
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } if (d.method === "Runtime.exceptionThrown") errors.push("EXC " + d.params.exceptionDetails.text + " " + (d.params.exceptionDetails.exception?.description ?? "").slice(0, 300)); if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errors.push(d.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 300)); };
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, (d) => (d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result))); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " in " + expr.slice(0, 80)); return r.result.value; };
await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
let fails = 0;
const check = (name, ok, detail = "") => { if (!ok) fails++; console.log((ok ? "  ok   " : "  FAIL ") + name + (detail ? "  " + detail : "")); };
const state = async () => JSON.parse(await ev("JSON.stringify({ path: location.pathname + location.search, title: document.title, focus: (document.activeElement?.id || document.activeElement?.className || document.activeElement?.tagName || '').toString().slice(0, 30), h1: document.querySelector('h1')?.innerText.slice(0, 50), lang: document.documentElement.lang })"));
// Run an action and collect the view-transition animations that start in the next 400 ms.
const withAnims = async (action) => {
  await ev(`(() => { window.__a = new Set(); const t0 = performance.now(); const tick = () => { for (const a of document.getAnimations()) { const p = a.effect?.pseudoElement; if (p && p.startsWith("::view-transition")) window.__a.add(p.replace("::view-transition-", "") + "=" + a.animationName + "/" + a.effect.getTiming().duration); } if (performance.now() - t0 < 1500) requestAnimationFrame(tick); }; requestAnimationFrame(tick); })()`);
  await ev(action); await sleep(2600);
  return (await ev("JSON.stringify([...window.__a])")).replace(/[\[\]"]/g, "").split(",").filter(Boolean);
};
const has = (list, s) => list.some((x) => x.includes(s));
const shot = async (name) => { await ev('document.querySelectorAll("nextjs-portal").forEach(e => e.remove())'); const s = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(`${out}/${name}.png`, Buffer.from(s.data, "base64")); };
const key = async (k, code) => { await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: k, windowsVirtualKeyCode: code }); await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: k, windowsVirtualKeyCode: code }); };

for (const [vp, w, h, mobile] of [["desktop", 1440, 900, false], ["phone", 390, 844, true]].filter((v) => !process.argv[3] || process.argv[3] === v[0])) {
  console.log(`\n== ${vp} ${w}x${h}`);
  await send("Network.clearBrowserCookies");
  await send("Emulation.setEmulatedMedia", { features: [] });
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send("Page.navigate", { url: "http://localhost:3000/szukaj" }); await sleep(2500);
  let s = await state(); check("gate sends a visitor to the landing", s.path.startsWith("/?next="), s.path);
  await send("Page.navigate", { url: "http://localhost:3000/" }); await sleep(3000);
  // 1. sign in (action 1)
  let a = await withAnims(`document.querySelector('button[name=mode][value=demo]').click()`);
  await sleep(1500); s = await state();
  check("demo sign-in lands on search", s.path === "/szukaj", s.path);
  check("opening: window sweep", has(a, "new(app-window)=vt-sweep/640"), a.join(" | "));
  if (!mobile) check("opening: logo is one moving object", has(a, "group(brand-logo)"), "");
  check("search box has focus", s.focus === "q", s.focus);
  // 2. search (action 2)
  await ev(`(() => { const i = document.getElementById('q'); i.value = ''; })()`);
  a = await withAnims(`document.querySelector('.search-form').requestSubmit()`);
  s = await state();
  check("search goes to results", s.path === "/wyniki", s.path);
  check("nav card still on screen after search", (await ev("Math.round(document.querySelector('.nav').getBoundingClientRect().top)")) >= 0);
  check("search → results: bar glides", has(a, "group(search-bar)") , a.filter((x) => x.includes("search-bar")).join(" "));
  check("search → results: results rise", has(a, "new(results-area)=vt-rise/280"));
  const n = await ev("document.querySelectorAll('.list .card').length"); check("results list has cards", n > 0, n + " cards");
  // 3. open a card (action 3)
  a = await withAnims(`(() => { const l = document.querySelectorAll('.card-open')[${mobile ? 0 : 1}]; l.focus(); l.click(); })()`);
  s = await state();
  check("card opens in place", s.path.includes("karta=") && s.focus === "dTitle", s.path.slice(0, 30) + " focus=" + s.focus);
  check("card grows (clip-path 380 ms)", has(a, "new(card-detail)=vt-card-grow/380"), a.join(" ").slice(0, 200));
  check("card has its own page title", !s.title.startsWith("Wyniki"), s.title.slice(0, 50));
  const sec = JSON.parse(await ev("JSON.stringify({ h2: [...document.querySelectorAll('.detail h2')].map(h => h.firstChild.textContent.trim()), cmpRows: document.querySelectorAll('table.cmp tbody tr').length, best: document.querySelectorAll('table.cmp .best').length, sources: document.querySelectorAll('.sources .src').length, ev: document.querySelectorAll('table.ev tbody tr').length, top: Math.round(document.querySelector('.detail').getBoundingClientRect().top) })"));
  check("card sections present", sec.h2.length >= 8 && sec.sources > 0 && sec.ev > 0, JSON.stringify(sec).slice(0, 260));
  check("comparison table with similar cards", sec.cmpRows >= 2 && sec.best > 0, `${sec.cmpRows} rows, ${sec.best} best marks`);
  await shot(`${vp}-flow-card`);
  // back with Esc
  a = await withAnims(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  s = await state();
  check("Esc returns to the list, focus on the card", s.path === "/wyniki" && s.focus === "card-open", s.path + " focus=" + s.focus);
  check("card shrinks (240 ms)", has(a, "old(card-detail)=vt-card-shrink/240"), a.join(" ").slice(0, 160));
  // filter: no view transition, no reload
  await ev("window.__mark = 1");
  a = await withAnims(`document.querySelector('input[name=area]').click()`);
  s = await state();
  check("filter applies in place", s.path.includes("area=") && (await ev("window.__mark === 1")), s.path);
  check("filter starts no card growth and nothing rises", !has(a, "vt-card") && !has(a, "vt-rise") && !has(a, "vt-sink") && !has(a, "app-window"), a.filter((x) => !x.includes("-ua-")).join(" "));
  // a filter change while a card is open must not replay the shrink with old measurements
  await ev("document.querySelector('.card-open').click()"); await sleep(2600);
  a = await withAnims("document.querySelector('input[name=implementationLevel]').click()");
  s = await state(); check("filter with a card open: back to the list, fade only", !s.path.includes("karta=") && !has(a, "vt-card"), a.filter((x) => x.includes("card-detail") && !x.includes("-ua-")).join(" "));
  // "Wróć do wyników" by click
  await ev("document.querySelector('.card-open').click()"); await sleep(2600);
  a = await withAnims("document.querySelector('.detail-bar a.btn-secondary').click()");
  s = await state(); check("Wróć closes the card with the shrink, focus on the card", has(a, "old(card-detail)=vt-card-shrink/240") && s.focus === "card-open", s.focus);
  // nav back to search
  a = await withAnims(`document.querySelector('.navlink').click()`);
  s = await state(); check("Szukaj returns to search", s.path === "/szukaj", s.path);
  check("results → search: bar glides back", has(a, "group(search-bar)"));
  // languages
  for (const [code, word] of [["en", "What do you need?"], ["uk", "Що ви шукаєте?"], ["pl", "Czego szukasz?"]]) {
    await ev(`(() => { const d = document.querySelector('details.menu'); d.open = true; d.querySelector('button[value=${code}]').click(); })()`); await sleep(2500);
    s = await state(); check(`language ${code}`, s.h1 === word && s.lang === code, `${s.lang} "${s.h1}"`);
    if (code === "uk") { await send("Page.navigate", { url: "http://localhost:3000/wyniki" }); await sleep(3000); await shot(`${vp}-flow-uk`); const t = await ev("[...document.querySelectorAll('.card-open')].map(e => e.innerText).join(' | ')"); const cyr = t.split(" | ").filter((x) => /[а-яіїє]/i.test(x)).length; check("card text in Ukrainian", cyr > 0, cyr + " of " + t.split(" | ").length + " titles in Cyrillic"); await send("Page.navigate", { url: "http://localhost:3000/szukaj" }); await sleep(2500); }
  }
  // other pages
  for (const [path, h1] of [["/zrodla", "Źródła"], ["/profil", "Profil"], ["/regulamin", "Regulamin"], ["/dostepnosc", null], ["/metodologia", null]]) {
    await send("Page.navigate", { url: "http://localhost:3000" + path }); await sleep(2200); s = await state();
    const sw = await ev("document.documentElement.scrollWidth");
    check(`page ${path}`, s.path === path && !!s.h1 && (h1 === null || s.h1 === h1) && sw <= w, `"${s.h1}" width ${sw}`);
  }
  // reduced motion: only short fades
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Page.navigate", { url: "http://localhost:3000/wyniki" }); await sleep(3000);
  a = await withAnims(`document.querySelector('.card-open').click()`);
  check("reduced motion: card cross-fades only", a.length > 0 && a.every((x) => /=vt-(in|out)\/150$/.test(x) || x.startsWith("group(") || x.startsWith("::view-transition=") || x.includes("-ua-mix-blend")), a.filter((x) => !/=vt-(in|out)\/150$/.test(x) && !x.startsWith("group(") && !x.includes("-ua-mix-blend")).join(" "));
  await send("Emulation.setEmulatedMedia", { features: [] });
  // no-JS path of the card URL and the redirect
  await send("Page.navigate", { url: "http://localhost:3000/karta/00000000-0000-0000-0000-000000000000" }); await sleep(2500); s = await state();
  check("/karta/<id> redirects to the in-place card", s.path.startsWith("/wyniki?karta="), s.path.slice(0, 40));
}
const real = [...new Set(errors)].filter((e) => !e.includes("[api] GET /api/v1/cards/00000000"));
console.log("\nconsole errors:", real.length ? "\n" + real.join("\n") : "none");
console.log(fails ? `\n${fails} CHECK(S) FAILED` : "\nALL CHECKS PASSED");
chrome.kill(); process.exit(0);
