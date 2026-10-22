// Functional test for the 3D learning simulators.
//
//   npm i playwright --no-save        (once)
//   python3 -m http.server 8123        (in the project root)
//   node test/functional-test.js
//
// For each app it: loads the page, checks the 3D scene actually renders,
// exercises every interactive control, opens the quiz and answers a
// question, and reports any runtime error.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.env.SHOTS || '/tmp/simshots';
const BASE = process.env.BASE || 'http://localhost:8123';
const EXEC = process.env.CHROME_PATH || undefined; // e.g. macOS Chrome for Testing

const APPS = [
  'space-trip', 'ocean-explorer', 'dino-park', 'farm-friends', 'weather-park',
  'jungle-safari', 'construction-city', 'supermarket', 'my-body', 'music-studio',
  'garden-plants', 'rainforest-layers', 'polar-world', 'transport-museum',
  'volcano-lab', 'bug-garden', 'water-cycle', 'sports-park', 'my-house',
  'numbers-forest', 'robo-town',
  'desert-oasis', 'pirate-cove', 'moon-base', 'rainbow-lab', 'castle-quest', 'frog-pond', 'lighthouse-bay', 'ant-city', 'balloon-sky', 'feelings-stage',
];

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({
    executablePath: EXEC,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
           '--autoplay-policy=no-user-gesture-required'],
  });
  const results = [];

  for (const app of APPS) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 700 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

    const report = { app, errors, checks: {}, ok: false };

    try {
      await page.goto(`${BASE}/${app}/index.html`, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(2500);

      report.checks.errorBanner = await page.evaluate(() => {
        const e = document.getElementById('err');
        return !!(e && e.style.display !== 'none' && e.textContent.trim());
      }) ? 'SHOWN' : 'ok';

      report.checks.canvas = await page.evaluate(() => {
        const c = document.querySelector('#app canvas');
        return c ? `${c.width}x${c.height}` : 'MISSING';
      });

      // scene really renders? (analyse the screenshot; WebGL readback is blank)
      const shot = await page.screenshot();
      report.checks.scene = await page.evaluate(async (b64) => {
        const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + b64; });
        const t = document.createElement('canvas');
        t.width = 80; t.height = 56;
        const g = t.getContext('2d');
        g.drawImage(img, 0, 0, 80, 56);
        const d = g.getImageData(0, 0, 80, 56).data;
        const set = new Set();
        for (let i = 0; i < d.length; i += 4) set.add(d[i] + ',' + d[i+1] + ',' + d[i+2]);
        return set.size > 25 ? `rendered(${set.size} colors)` : `flat(${set.size})`;
      }, shot.toString('base64'));

      // shared learning UI
      report.checks.tipBar = await page.locator('#kid-tip').count() ? 'ok' : 'MISSING';
      report.checks.quizBtn = await page.locator('#kid-quiz-btn').count() ? 'ok' : 'MISSING';
      report.checks.voiceSel = await page.locator('#kid-voice').count() ? 'ok' : 'MISSING';
      report.checks.learnMore = await page.locator('#kid-more').count() ? 'ok' : 'MISSING';

      // click every app control
      const sel = '.strip button, .panel button, .game button, .controls button';
      const n = await page.locator(sel).count();
      report.checks.controls = n;
      for (let i = 0; i < Math.min(n, 14); i++) {
        const b = page.locator(sel).nth(i);
        if (await b.count()) await b.click({ timeout: 1500, force: true }).catch(() => {});
      }
      await page.waitForTimeout(400);

      // quiz opens + answers
      const qb = page.locator('#kid-quiz-btn');
      if (await qb.count()) {
        await qb.click({ timeout: 2000, force: true }).catch(() => {});
        await page.waitForTimeout(500);
        report.checks.quizOpens = await page.evaluate(() => {
          const m = document.getElementById('kid-modal');
          return m && m.classList.contains('on');
        }) ? 'ok' : 'FAIL';
        const opts = await page.locator('#kid-q .kid-opt').count();
        report.checks.quizOptions = opts;
        if (opts) {
          await page.locator('#kid-q .kid-opt').first().click({ timeout: 2000, force: true }).catch(() => {});
          await page.waitForTimeout(400);
          report.checks.quizAnswer = await page.evaluate(() => {
            const d = document.getElementById('kid-feedback');
            return d && d.textContent.trim() ? d.textContent.trim() : 'NO FEEDBACK';
          });
        }
        await page.locator('#kid-close').click({ timeout: 1500, force: true }).catch(() => {});
        await page.waitForTimeout(300);
      }

      await page.screenshot({ path: path.join(SHOTS, `fn-${app}.png`) });

      report.ok = report.checks.errorBanner === 'ok'
        && report.checks.canvas !== 'MISSING'
        && report.checks.scene.startsWith('rendered')
        && report.checks.quizOpens === 'ok'
        && report.checks.quizOptions > 0
        && report.checks.quizAnswer !== 'NO FEEDBACK'
        && errors.length === 0;
    } catch (e) {
      report.errors.push('FATAL: ' + e.message);
    }
    results.push(report);
    await ctx.close();
  }

  await browser.close();

  let pass = 0, fail = 0;
  for (const r of results) {
    if (r.ok) pass++; else fail++;
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.app.padEnd(20)} canvas=${r.checks.canvas} scene=${r.checks.scene} quiz=${r.checks.quizOpens} opts=${r.checks.quizOptions} controls=${r.checks.controls} errs=${r.errors.length}`);
    r.errors.slice(0, 4).forEach(e => console.log(`        ! ${e.slice(0, 220)}`));
  }
  console.log(`\n==== PASS=${pass} FAIL=${fail} TOTAL=${results.length} ====`);
  fs.writeFileSync(path.join(SHOTS, 'fn-report.json'), JSON.stringify(results, null, 2));
  process.exit(fail ? 1 : 0);
})();
