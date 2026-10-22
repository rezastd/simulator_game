// Screenshots for the 10 new games + contact sheet.
//   node tools/shoot_new_games.js   (starts its own server on 8123)
const { chromium } = require('playwright');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const APPS = ['desert-oasis', 'pirate-cove', 'moon-base', 'rainbow-lab', 'castle-quest', 'frog-pond', 'lighthouse-bay', 'ant-city', 'balloon-sky', 'feelings-stage'];
const SHOTS = path.join(ROOT, 'visual-plan', 'preview');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const srv = spawn('python3', ['-m', 'http.server', '8123'], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  let launchOpts = { args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--autoplay-policy=no-user-gesture-required'] };
  if (fs.existsSync(CHROME)) launchOpts.executablePath = CHROME;
  else { try { require('child_process').execSync('npx playwright install chromium --only-shell', { stdio: 'ignore' }); } catch (e) {} }
  let browser = null;
  try {
    browser = await chromium.launch(launchOpts);
  } catch (e) {
    console.log('browser launch failed (offline/sandbox?): ' + e.message.split('\n')[0]);
  }
  const summary = [];
  if (!browser) {
    fs.writeFileSync(path.join(SHOTS, 'shoot-report.txt'), 'NO BROWSER — tiles rendered as data sheets\n');
    const py = spawnSync('python3', [path.join(ROOT, 'tools', 'make_contact.py')], { cwd: ROOT, stdio: 'inherit' });
    process.exit(py.status || 0);
  }
  for (const app of APPS) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 700 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    try {
      await page.goto('http://localhost:8123/' + app + '/index.html', { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(4000);
      const canvas = await page.evaluate(() => { const c = document.querySelector('#app canvas'); return c ? (c.width + 'x' + c.height) : 'MISSING'; });
      await page.screenshot({ path: path.join(SHOTS, 'shot-' + app + '.png') });
      console.log('shot ' + app + ' canvas=' + canvas + ' errors=' + errors.length);
      errors.slice(0, 3).forEach(e => console.log('   ! ' + e.slice(0, 200)));
      summary.push(app + ': canvas=' + canvas + ' errors=' + errors.length);
    } catch (e) {
      console.log('shot ' + app + ' FATAL: ' + e.message);
      summary.push(app + ': FATAL ' + e.message);
    }
    await ctx.close();
  }
  await browser.close();
  srv.kill();
  fs.writeFileSync(path.join(SHOTS, 'shoot-report.txt'), summary.join('\n') + '\n');
  const py = spawnSync('python3', [path.join(ROOT, 'tools', 'make_contact.py')], { cwd: ROOT, stdio: 'inherit' });
  process.exit(py.status || 0);
})();
