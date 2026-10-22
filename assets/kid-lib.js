/* ===== Kid Learning Library (classic script) =====
   Adds: rotating "Did you know?" tip bar, a mini quiz,
   a "Learn more" button, and a voice picker for read-aloud.
   Prefers Microsoft/neural voices when the OS/browser provides them
   (e.g. Edge on Windows) and falls back to the best native voice.

   Usage:
     <link rel="stylesheet" href="../assets/kid-lib.css">
     <script src="../assets/kid-lib.js"></script>
     ... app sets window.__MORE = { Name: [extraFact, ...], ... } ...
     ... app calls:  KidLib.init({ tips:[...], quiz:[...] });
     ... app read buttons call:  KidLib.speak(text);
*/
(function () {
  "use strict";

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // ---- voice management ----
  var chosenVoice = null;
  var voiceList = [];

  function refreshVoices() {
    try { voiceList = window.speechSynthesis.getVoices() || []; } catch (e) { voiceList = []; }
    buildVoiceSelect();
  }

  function isNeural(v) {
    return /microsoft|neural|natural|online|jenny|aria|guy|samantha|zira|hazel|premium/i.test(v.name);
  }

  function pickVoice() {
    if (chosenVoice) return chosenVoice;
    if (!voiceList.length) return null;
    var neural = voiceList.filter(isNeural);
    if (neural.length) return neural[0];
    return voiceList[0];
  }

  function speak(text, rate) {
    try {
      if (!window.speechSynthesis) return;
      var u = new SpeechSynthesisUtterance(text);
      var v = pickVoice();
      if (v) u.voice = v;
      u.rate = rate || 0.95;
      u.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  function buildVoiceSelect() {
    var sel = document.getElementById('kid-voice');
    if (!sel) return;
    // keep current selection
    var cur = chosenVoice ? chosenVoice.name : '';
    sel.innerHTML = '';
    var auto = document.createElement('option');
    auto.value = '';
    auto.textContent = '⭐ Auto (best neural voice)';
    sel.appendChild(auto);
    voiceList.forEach(function (v, i) {
      var o = document.createElement('option');
      o.value = v.name;
      o.textContent = v.name + (isNeural(v) ? '  ✨' : '');
      sel.appendChild(o);
      if (v.name === cur) sel.selectedIndex = i + 1;
    });
  }

  function init(cfg) {
    cfg = cfg || {};
    var tips = cfg.tips || [];
    var questions = cfg.quiz || [];

    // ---- tip bar + quiz + voice picker ----
    if (!document.getElementById('kid-ui')) {
      var ui = el('div', '', '');
      ui.id = 'kid-ui';
      var tip = el('div', '', '');
      tip.id = 'kid-tip';
      var voiceWrap = el('div', '', '');
      var vLabel = el('span', '', '🔊 Voice: ');
      var vSel = document.createElement('select');
      vSel.id = 'kid-voice';
      vSel.style.cssText = 'background:rgba(0,0,0,.5);color:#fff;border:2px solid rgba(255,255,255,.35);border-radius:8px;padding:6px;font-family:inherit;font-size:.85rem;max-width:240px;cursor:pointer;';
      voiceWrap.appendChild(vLabel);
      voiceWrap.appendChild(vSel);
      var qbtn = el('button', '', '❓ Quiz');
      qbtn.id = 'kid-quiz-btn';
      ui.appendChild(tip);
      ui.appendChild(voiceWrap);
      ui.appendChild(qbtn);
      document.body.appendChild(ui);
      // adopt an orphan mute button if ambience() ran before init();
      // clear the temporary fixed positioning so it flows inside #kid-ui
      var orphan = document.getElementById('kid-amb');
      if (orphan && orphan.parentElement !== ui) {
        orphan.style.position = '';
        orphan.style.left = '';
        orphan.style.bottom = '';
        orphan.style.top = '';
        ui.appendChild(orphan);
      }

      vSel.addEventListener('change', function () {
        var name = vSel.value;
        chosenVoice = name ? voiceList.filter(function (v) { return v.name === name; })[0] || null : null;
      });

      var ti = 0;
      var showTip = function () {
        if (!tips.length) { tip.classList.remove('show'); return; }
        tip.textContent = '💡 ' + tips[ti % tips.length];
        tip.classList.add('show');
      };
      showTip();
      setInterval(function () { ti++; showTip(); }, 8000);
    } else {
      var qbtn = document.getElementById('kid-quiz-btn');
    }

    if (window.speechSynthesis) {
      refreshVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = refreshVoices;
      }
      // some browsers need a nudge after a moment
      setTimeout(refreshVoices, 500);
      setTimeout(refreshVoices, 1500);
    }

    // ---- "Learn more" button in the bubble ----
    var bubble = document.getElementById('bubble') || document.getElementById('msg');
    var tEl = document.getElementById('bTitle') || document.getElementById('mTitle');
    var xEl = document.getElementById('bText') || document.getElementById('mText');
    var closeBtn = document.getElementById('bClose') || document.getElementById('mClose');
    if (bubble && !document.getElementById('kid-more')) {
      var more = el('button', '', '🧠 Learn more');
      more.id = 'kid-more';
      more.type = 'button';
      var bar = document.querySelector('#bubble > div');
      if (bar) bar.insertBefore(more, bar.lastElementChild); else bubble.appendChild(more);
      var moreState = {};
      more.addEventListener('click', function () {
        var title = (tEl ? tEl.textContent : '').trim();
        var arr = (window.__MORE && window.__MORE[title]) || [];
        if (!arr.length) { more.textContent = 'No extra facts yet'; setTimeout(function () { more.textContent = '🧠 Learn more'; }, 1200); return; }
        moreState[title] = (moreState[title] || 0) + 1;
        var idx = (moreState[title] - 1) % arr.length;
        if (xEl) xEl.textContent = arr[idx];
        more.textContent = '🧠 More (' + (idx + 1) + '/' + arr.length + ')';
      });
      if (closeBtn) closeBtn.addEventListener('click', function () { more.textContent = '🧠 Learn more'; });
    }

    // ---- quiz ----
    var modal = document.getElementById('kid-modal');
    if (!modal) {
      modal = el('div', '', '');
      modal.id = 'kid-modal';
      var scrim = el('div', 'scrim', '');
      var card = el('div', '', '');
      card.id = 'kid-card';
      card.appendChild(el('h3', '', '🎓 Mini Quiz'));
      var q = el('div', '', '');
      q.id = 'kid-q';
      var feed = el('div', '', '');
      feed.id = 'kid-feedback';
      var close = el('button', '', '✕ Close');
      close.id = 'kid-close';
      card.appendChild(q);
      card.appendChild(feed);
      card.appendChild(close);
      modal.appendChild(scrim);
      modal.appendChild(card);
      document.body.appendChild(modal);
      scrim.addEventListener('click', hide);
      close.addEventListener('click', hide);
    }
    qbtn.addEventListener('click', function () {
      if (!questions.length) { alert('No quiz ready yet!'); return; }
      quizState = { score: 0, answers: 0, idx: 0, qs: questions.slice().sort(function () { return Math.random() - 0.5; }) };
      modal.classList.add('on');
      renderQ();
    });

    var quizState = null;

    function hide() { modal.classList.remove('on'); quizState = null; }

    function renderQ() {
      var qs = quizState.qs, question = qs[quizState.idx];
      q.innerHTML = '';
      feed.textContent = '';
      var prompt = el('div', '', (quizState.idx + 1) + '. ' + question.q);
      prompt.style.fontWeight = '700';
      q.appendChild(prompt);
      var order = question.opts.map(function (_, i) { return i; }).sort(function () { return Math.random() - 0.5; });
      question.order = order;
      order.forEach(function (oi) {
        var b = el('button', 'kid-opt', question.opts[oi]);
        b.addEventListener('click', function () { answer(oi, b); });
        q.appendChild(b);
      });
    }

    function answer(oi, btn) {
      var qs = quizState.qs, question = qs[quizState.idx];
      var right = question.ans === oi;
      var btns = q.querySelectorAll('.kid-opt');
      btns.forEach(function (b) { b.disabled = true; });
      if (right) { btn.classList.add('right'); quizState.score++; feed.textContent = '✅ Correct!'; }
      else {
        btn.classList.add('wrong');
        btns[question.order.indexOf(question.ans)].classList.add('right');
        feed.textContent = '❌ Not quite — the right answer is shown.';
      }
      quizState.answers++;
      setTimeout(function () {
        if (!quizState) return; // quiz was closed before the timer fired
        quizState.idx++;
        if (quizState.idx < qs.length) renderQ();
        else {
          var stars = quizState.score >= qs.length * 0.8 ? '⭐⭐⭐' : quizState.score >= qs.length * 0.5 ? '⭐⭐' : '⭐';
          q.innerHTML = '<div style="font-size:1.2rem">Done! You got <b>' + quizState.score + '</b> of ' + qs.length + ' right.</div>' +
            '<div style="font-size:1.7rem;margin-top:8px">' + stars + '</div>';
          feed.textContent = '';
        }
      }, 1400);
    }
  }

  // ---- floating name label sprite ----
  function makeLabel(name, opts) {
    opts = opts || {};
    var w = opts.width || 256, h = opts.height || 128;
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    var size = Math.min(64, Math.max(28, Math.floor(w / (name.length + 2))));
    ctx.font = 'bold ' + size + 'px "Comic Sans MS", "Chalkboard SE", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // pill background
    var ww = ctx.measureText(name).width + size * 1.6;
    var x0 = (w - ww) / 2, y0 = (h - size * 1.7) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(x0, y0, ww, size * 1.7, size * 0.85);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillText(name, w / 2, h / 2 + 2);
    var T = window.__THREE || null;
    if (!T) return null;
    var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    var s = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: opts.depthTest !== false }));
    var sc = opts.scale || 1.6;
    s.scale.set(sc, sc * h / w, 1);
    s.renderOrder = 999;
    s.userData.isKidLabel = true;
    s.userData.aspect = h / w;
    s.userData.baseW = sc;
    return s;
  }

  // Keep labels a constant on-screen size no matter how far away they are.
  function updateLabels(scene, camera) {
    var T2 = window.__THREE; if (!T2 || !scene || !camera) return;
    var wp = new T2.Vector3(), ws = new T2.Vector3();
    scene.traverse(function (o) {
      if (!o.userData || !o.userData.isKidLabel) return;
      if (!o.parent) return;
      o.getWorldPosition(wp);
      o.parent.getWorldScale(ws);
      var ps = ws.x || 1;
      var d = camera.position.distanceTo(wp);
      // width in world units that maps to a constant fraction of the screen
      var w = (d * 0.15 * (o.userData.baseW / 1.6)) / ps;
      o.scale.set(w, w * o.userData.aspect, 1);
    });
  }

  // ---------------- ambient scene audio ----------------
  var ambCtx = null, ambMaster = null, ambSeed = null, ambMuted = false, ambStarted = false;
  function ambInit() {
    if (ambCtx) return ambCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      ambCtx = new AC();
      ambMaster = ambCtx.createGain();
      ambMaster.gain.value = 0.0;
      ambMaster.connect(ambCtx.destination);
      // noise buffer (reusable)
      var len = ambCtx.sampleRate * 2;
      ambSeed = ambCtx.createBuffer(1, len, ambCtx.sampleRate);
      var d = ambSeed.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      resumeAmb();
      return ambCtx;
    } catch (e) { return null; }
  }
  function resumeAmb() { if (ambCtx && ambCtx.state === 'suspended') ambCtx.resume(); }

  function loopNoise(filterType, freq, q, gain) {
    var src = ambCtx.createBufferSource(); src.buffer = ambSeed; src.loop = true;
    var f = ambCtx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q || 1;
    var g = ambCtx.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(ambMaster); src.start();
    return { src: src, filter: f };
  }
  function loopTone(freq, type, gain, detune) {
    var o = ambCtx.createOscillator(); o.type = type || 'sine';
    o.frequency.value = freq; o.detune.value = detune || 0;
    var g = ambCtx.createGain(); g.gain.value = gain;
    o.connect(g); g.connect(ambMaster); o.start();
    return { osc: o, gain: g };
  }
  var chirpTimer = null;
  function startChirps() {
    stopChirps();
    function chirp() {
      if (ambMuted || !ambCtx) return;
      var t0 = ambCtx.currentTime;
      var base = 1800 + Math.random() * 1600;
      var n = 2 + Math.floor(Math.random() * 3);
      for (var k = 0; k < n; k++) {
        var o = ambCtx.createOscillator(); o.type = 'sine';
        var freq = base + k * 300 + Math.random() * 200;
        o.frequency.setValueAtTime(freq, t0 + k * 0.07);
        o.frequency.exponentialRampToValueAtTime(freq * 1.4, t0 + k * 0.07 + 0.05);
        var g = ambCtx.createGain();
        g.gain.setValueAtTime(0, t0 + k * 0.07);
        g.gain.linearRampToValueAtTime(0.25, t0 + k * 0.07 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + k * 0.07 + 0.09);
        o.connect(g); g.connect(ambMaster);
        o.start(t0 + k * 0.07); o.stop(t0 + k * 0.07 + 0.12);
      }
    }
    chirpTimer = setInterval(chirp, 900 + Math.random() * 1500);
  }
  function stopChirps() { if (chirpTimer) { clearInterval(chirpTimer); chirpTimer = null; } }

  function setAmbMuted(muted, notify) {
    ambMuted = muted;
    if (ambMaster) {
      // smooth ramp
      var t = ambCtx.currentTime;
      ambMaster.gain.cancelScheduledValues(t);
      ambMaster.gain.setValueAtTime(ambMaster.gain.value, t);
      ambMaster.gain.linearRampToValueAtTime(muted ? 0 : 0.5, t + 0.6);
    }
    var btn = document.getElementById('kid-amb');
    if (btn) btn.textContent = muted ? '🔇' : '🎵';
    if (notify && window.speechSynthesis) { /* keep quiet */ }
  }

  var ambBuilt = false, ambType = null;
  function buildAmbient() {
    if (ambBuilt) return;
    if (!ambInit()) return;
    ambBuilt = true;
    var type = ambType || 'soft';
    switch (type) {
      case 'waves': loopNoise('lowpass', 420, 0.8, 0.5); loopTone(70, 'sine', 0.06); break;
      case 'wind': loopNoise('bandpass', 320, 0.6, 0.4); loopTone(55, 'sine', 0.05); break;
      case 'forest': loopNoise('bandpass', 500, 0.5, 0.28); startChirps(); break;
      case 'city': loopNoise('lowpass', 300, 0.8, 0.3); loopTone(60, 'triangle', 0.05); break;
      case 'space': loopNoise('lowpass', 200, 1, 0.2); loopTone(38, 'sine', 0.05); break;
      case 'robo': loopNoise('bandpass', 700, 1.5, 0.18); loopTone(110, 'triangle', 0.04); break;
      case 'crowd': loopNoise('bandpass', 900, 0.4, 0.22); break;
      case 'breeze': loopNoise('bandpass', 260, 0.5, 0.3); break;
      case 'crickets': loopNoise('bandpass', 4000, 2, 0.1); break;
      default: loopNoise('lowpass', 300, 0.7, 0.3); break;
    }
  }
  function ambience(type) {
    ambType = type || 'soft';
    // add mute button immediately
    if (!document.getElementById('kid-amb')) {
      var btn = document.createElement('button');
      btn.id = 'kid-amb'; btn.textContent = '🎵';
      btn.style.cssText = 'background:linear-gradient(135deg,#7fd18a,#35c0c0);color:#062;border:none;border-radius:999px;padding:9px 14px;font-weight:800;font-size:.95rem;cursor:pointer;font-family:inherit;box-shadow:0 6px 18px rgba(40,180,150,.35);transition:transform .15s;pointer-events:auto;position:relative;z-index:18;';
      btn.addEventListener('click', function () { setAmbMuted(!ambMuted, false); });
      var ui = document.getElementById('kid-ui');
      if (ui) ui.appendChild(btn);
      else {
        // init() hasn't run yet: pin it visibly until init() adopts it
        btn.style.position = 'fixed'; btn.style.left = '14px'; btn.style.bottom = '14px';
        document.body.appendChild(btn);
      }
    }
    // Only build audio nodes + resume AFTER a real user gesture (autoplay policy).
    var kick = function () {
      buildAmbient();
      resumeAmb();
      if (!ambStarted) { ambStarted = true; setAmbMuted(false, false); }
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('keydown', kick);
    };
    window.addEventListener('pointerdown', kick);
    window.addEventListener('keydown', kick);
  }

  // ---------------- intro pulse highlight ----------------
  function pulse(scene, position, color) {
    var T = window.__THREE; if (!T) return;
    var ring = new T.Mesh(
      new T.TorusGeometry(1.2, 0.09, 10, 32),
      new T.MeshBasicMaterial({ color: color || 0xffd166, transparent: true, opacity: 1 })
    );
    ring.position.copy(position); ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    var ring2 = ring.clone(); ring2.scale.setScalar(0.4); ring2.material = ring2.material.clone(); ring2.material.opacity = 0.6; scene.add(ring2);
    var t0 = performance.now();
    (function tick() {
      var p = (performance.now() - t0) / 3800;
      if (p >= 1) { scene.remove(ring); scene.remove(ring2); return; }
      ring.scale.setScalar(0.6 + p * 2.4);
      ring.material.opacity = 1 - p;
      ring2.scale.setScalar(0.4 + p * 3);
      ring2.material.opacity = 0.6 * (1 - p);
      ring.position.y = position.y + Math.sin(p * Math.PI) * 0.5;
      requestAnimationFrame(tick);
    })();
  }

  window.KidLib = { init: init, speak: speak, pickVoice: pickVoice, refreshVoices: refreshVoices, makeLabel: makeLabel, updateLabels: updateLabels, ambience: ambience, pulse: pulse };
})();
