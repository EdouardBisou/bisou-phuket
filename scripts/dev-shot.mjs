// Mobile-emulated screenshots via Chrome DevTools Protocol (headless Chrome on Windows
// enforces a minimum window width, so --window-size alone cannot render a 375px phone).
// usage: node shot.mjs <url> <out.png> [width=375] [height=812] [full=0|1] [scrollTo=0]
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [url, out, w = '375', h = '812', full = '0', scrollTo = '0'] = process.argv.slice(2);
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9333 + Math.floor(Math.random() * 500);
const profile = `${process.env.TEMP || '.'}/cdp-profile-${port}`;
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--no-first-run',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getWsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      const j = await res.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('chrome did not start');
}

try {
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map(); const events = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    else events.push(d);
  };
  const send = (method, params = {}, sessionId) => new Promise((res) => {
    const msg = { id: ++id, method, params }; if (sessionId) msg.sessionId = sessionId;
    pending.set(msg.id, res); ws.send(JSON.stringify(msg));
  });
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const S = (m, p) => send(m, p, sessionId);
  await S('Page.enable');
  await S('Runtime.enable');
  await S('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: +w < 700 });
  if (+w < 700) await S('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36' });
  await S('Emulation.setTouchEmulationEnabled', { enabled: +w < 700 });
  await S('Page.navigate', { url });
  // wait for load event
  for (let i = 0; i < 80; i++) { if (events.some((e) => e.method === 'Page.loadEventFired')) break; await sleep(100); }
  await S('Runtime.evaluate', { expression: 'document.fonts ? document.fonts.ready.then(()=>1) : 1', awaitPromise: true });
  await sleep(600);
  if (+scrollTo) {
    await S('Runtime.evaluate', { expression: `window.scrollTo(0, ${+scrollTo}); 1` });
    await sleep(900);
  }
  const metrics = await S('Runtime.evaluate', { expression: 'JSON.stringify({sw: document.documentElement.scrollWidth, iw: innerWidth, sh: document.documentElement.scrollHeight})', returnByValue: true });
  process.stderr.write('metrics ' + metrics.result.result.value + '\n');
  let clip;
  if (full === '1') {
    const { result: { cssContentSize } } = await S('Page.getLayoutMetrics');
    clip = { x: 0, y: 0, width: cssContentSize.width, height: Math.min(cssContentSize.height, 12000), scale: 1 };
    await S('Emulation.setDeviceMetricsOverride', { width: +w, height: Math.ceil(clip.height), deviceScaleFactor: 2, mobile: +w < 700 });
    await sleep(400);
  }
  const shot = await S('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full === '1', ...(clip ? { clip } : {}) });
  writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  process.stderr.write('wrote ' + out + '\n');
  ws.close();
} finally {
  chrome.kill();
}
