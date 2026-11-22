// Screenshot each step of the prototype artifact, desktop and phone frames.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
const out = process.argv[2] ?? "out"; mkdirSync(out, { recursive: true });
const port = 9700 + Math.floor(Math.random() * 100);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${port}`, "--no-first-run", "--window-size=1600,1400", "--hide-scrollbars", "--allow-file-access-from-files", "--user-data-dir=" + out + "/profile", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
for (let i = 0; i < 50; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === "page"); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {} await sleep(200); }
await new Promise((r) => (ws.onopen = r));
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, (d) => (d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result))); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1400, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "file://" + process.cwd() + "/prototype.html" });
await sleep(4000);
console.log("frame:", await evaluate("(() => { const f = document.getElementById('frame'); const r = f.getBoundingClientRect(); return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height}); })()"));
async function shotFrame(name) {
  const r = JSON.parse(await evaluate("(() => { const f = document.getElementById('frame'); f.scrollIntoView(); const r = f.getBoundingClientRect(); return JSON.stringify({x:r.x+window.scrollX,y:r.y+window.scrollY,w:r.width,h:r.height}); })()"));
  const s = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
  writeFileSync(`${out}/${name}.png`, Buffer.from(s.data, "base64"));
}
for (const vp of ["desktop", "phone"]) {
  await evaluate(`(() => { const b = document.querySelector('[data-vp="${vp}"]'); if (b) b.click(); return !!b; })()`);
  await sleep(600);
  await evaluate(`(() => { const b = document.querySelector('#stepSeg button[data-step="search"]'); if (b) b.click(); return !!b; })()`);
  await sleep(1500);
  console.log("DATA:", await evaluate("typeof DATA === 'undefined' ? 'undef' : (DATA ? Object.keys(DATA).join(',') + ' cards=' + (DATA.cards||[]).length : 'null')"));
  await evaluate(`(() => { const f = document.getElementById('searchForm'); f.requestSubmit(); return true; })()`);
  await sleep(2500);
  await shotFrame(`${vp}-results2`);
  console.log("cards in list:", await evaluate("document.querySelectorAll('#list .card').length"), await evaluate("document.getElementById('resultsMain')?.innerText.slice(0,200)"));
  await evaluate(`(() => { const b = document.querySelector('.card-open'); if (b) b.click(); return !!b; })()`);
  await sleep(2500);
  await shotFrame(`${vp}-detail2`);
}
chrome.kill(); process.exit(0);
