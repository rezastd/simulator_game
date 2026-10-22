/* ============================================================
   Realism module — real sky lighting + cinematic post-processing.
   Loaded as an ES module from each app:
       import '../assets/realism.js';
   Usage:
       const fx = Realism.setup(scene, renderer, camera, {
         hdr: 'sky-park.hdr', sky: true, bloom: 0.35
       });
       // in the render loop:
       fx.render(scene, camera);
   Everything degrades gracefully: if the HDRI or post-processing
   is unavailable the app still runs with plain rendering.
   ============================================================ */
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

let composer = null, bloomPass = null, renderPass = null, outputPass = null;
let composerEnabled = false;
let envReady = false;

const BLOOM_PRESETS = {
  soft:   { strength: 0.22, radius: 0.6, threshold: 0.85 },
  gentle: { strength: 0.35, radius: 0.7, threshold: 0.78 },
  glow:   { strength: 0.55, radius: 0.85, threshold: 0.7 },
};

function buildComposer(renderer, scene, camera, bloomName) {
  try {
    const EffectComposer = _three_addons.EffectComposer;
    const RenderPass = _three_addons.RenderPass;
    const UnrealBloomPass = _three_addons.UnrealBloomPass;
    const OutputPass = _three_addons.OutputPass;

    composer = new EffectComposer(renderer);
    renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const preset = BLOOM_PRESETS[bloomName] || BLOOM_PRESETS.gentle;
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      preset.strength, preset.radius, preset.threshold
    );
    composer.addPass(bloomPass);

    outputPass = new OutputPass();
    composer.addPass(outputPass);

    composerEnabled = true;
  } catch (e) {
    console.warn('Realism: post-processing unavailable, using plain render.', e);
    composerEnabled = false;
  }
}

// The postprocessing addons are loaded lazily so a failure there can never
// break the app's own module.
const _three_addons = {};

async function loadPostprocessing() {
  if (_three_addons.EffectComposer) return true;
  try {
    const [ec, rp, ubp, op] = await Promise.all([
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
      import('three/addons/postprocessing/OutputPass.js'),
    ]);
    _three_addons.EffectComposer = ec.EffectComposer;
    _three_addons.RenderPass = rp.RenderPass;
    _three_addons.UnrealBloomPass = ubp.UnrealBloomPass;
    _three_addons.OutputPass = op.OutputPass;
    return true;
  } catch (e) {
    console.warn('Realism: could not load post-processing addons.', e);
    return false;
  }
}

/**
 * A painted sky dome: a large inverted sphere with a vertical gradient
 * (and an optional sun glow). Gives a vivid, art-directed sky while the
 * HDRI still does the lighting. Much more controllable than a photo sky.
 */
function skyDome(scene, opts) {
  opts = opts || {};
  const radius = opts.radius || 80;           // must stay inside the camera far plane
  const top = new THREE.Color(opts.top || 0x2f6fd0);
  const bottom = new THREE.Color(opts.bottom || 0xcfe4f5);
  const geo = new THREE.SphereGeometry(radius, 32, 20);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / radius;             // -1 .. 1
    const t = Math.pow(Math.max(0, Math.min(1, y * 0.5 + 0.5)), 0.65);
    c.copy(bottom).lerp(top, t);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false, fog: false });
  const dome = new THREE.Mesh(geo, mat);
  dome.renderOrder = -1000;
  dome.frustumCulled = false;
  scene.add(dome);

  // sun glow
  if (opts.sun) {
    const sunPos = new THREE.Vector3().copy(opts.sun).normalize().multiplyScalar(radius * 0.9);
    const glowTex = (function () {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256;
      const g2 = cv.getContext('2d');
      const grd = g2.createRadialGradient(128, 128, 0, 128, 128, 128);
      grd.addColorStop(0, 'rgba(255,250,225,1)');
      grd.addColorStop(0.18, 'rgba(255,235,170,0.85)');
      grd.addColorStop(0.45, 'rgba(255,210,120,0.25)');
      grd.addColorStop(1, 'rgba(255,200,110,0)');
      g2.fillStyle = grd; g2.fillRect(0, 0, 256, 256);
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
    glow.position.copy(sunPos);
    const ss = (opts.sunSize || 60) * (radius / 120);
    glow.scale.set(ss, ss, 1);
    glow.renderOrder = -999;
    glow.frustumCulled = false;
    scene.add(glow);
  }
  return dome;
}

function setup(scene, renderer, camera, opts) {
  opts = opts || {};
  const state = {
    ready: false,
    render: function (s, c) {
      if (composerEnabled && composer) composer.render();
      else renderer.render(s, c);
    },
    resize: function (w, h) {
      if (composerEnabled && composer) composer.setSize(w, h);
    },
    setBloom: function (name) {
      if (!bloomPass) return;
      const p = BLOOM_PRESETS[name] || BLOOM_PRESETS.gentle;
      bloomPass.strength = p.strength;
      bloomPass.radius = p.radius;
      bloomPass.threshold = p.threshold;
    },
  };

  // --- 1. real environment lighting from an HDRI ---
  if (opts.hdr) {
    const loader = new RGBELoader();
    const url = opts.hdr;
    loader.load(
      url,
      function (texture) {
        try {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          const pmrem = new THREE.PMREMGenerator(renderer);
          pmrem.compileEquirectangularShader();
          const envRT = pmrem.fromEquirectangular(texture);
          scene.environment = envRT.texture;
          envReady = true;

          if (opts.sky === 'gradient' && opts.skyOptions) {
            skyDome(scene, opts.skyOptions);
          } else if (opts.sky) {
            // Show the real sky as the backdrop
            scene.background = texture;
            scene.backgroundIntensity = opts.skyIntensity != null ? opts.skyIntensity : 1.0;
          }
          if (opts.envIntensity != null) scene.environmentIntensity = opts.envIntensity;
          pmrem.dispose();
        } catch (e) {
          console.warn('Realism: HDRI setup failed.', e);
        }
      },
      undefined,
      function () {
        console.warn('Realism: could not load HDRI "' + url + '" — using fallback lighting.');
      }
    );
  }

  // --- 2. cinematic post-processing ---
  if (opts.bloom !== false) {
    loadPostprocessing().then(function (ok) {
      if (ok) buildComposer(renderer, scene, camera, opts.bloom);
    });
  }

  return state;
}

window.Realism = { setup: setup, skyDome: skyDome, BLOOM_PRESETS: BLOOM_PRESETS };
