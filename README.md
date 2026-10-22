# 3D Learning Simulators (for age 7)

Twenty-one browser-based 3D learning apps for a 7-year-old. Each is a single HTML file — open in any modern browser (Chrome/Edge/Safari). No install, no build.

## Run it
```bash
open index.html
```
Or open any app folder's `index.html` directly. Needs internet on first load (fetch Three.js from CDN). All apps use the shared `assets/kid-lib.*` library.

## The apps
### 🌍 Worlds & Wildlife
| Folder | Topic | What the kid learns |
|---|---|---|
| `space-trip` | Solar system | Planets, order, moons, orbit counting |
| `ocean-explorer` | Underwater world | Creatures, colors, sizes |
| `dino-park` | Dinosaurs | Names, herbivores vs carnivores, big numbers |
| `farm-friends` | Farm animals | Animals, sounds, counting eggs |
| `weather-park` | Weather & seasons | 4 seasons, rain/snow, temperature |
| `jungle-safari` | Wild animals | Animals + "spot the animal" game |
| `garden-plants` | Plants & growing | Plant seeds, water them, watch them grow |
| `rainforest-layers` | Rainforest | Animals by layer (canopy → floor) |
| `polar-world` | Polar regions | Penguins, bears, ice habitats |
| `bug-garden` | Minibeasts | Insects, spiders, metamorphosis |
| `water-cycle` | Water | Evaporation, clouds, rain, rivers |
| `volcano-lab` | Geology | Erupt a volcano, learn rock types |

### 🧠 Ideas & Imagination
| Folder | Topic | What the kid learns |
|---|---|---|
| `construction-city` | Building | Shapes (cube/cylinder/cone/sphere), colors, counting |
| `supermarket` | Shopping | Counting, money, paying exact amount |
| `my-body` | Human body | Brain, heart, lungs, stomach, bones, muscles |
| `music-studio` | Music | Instruments, sounds, loud vs soft |
| `transport-museum` | Vehicles | How cars, trains, planes, rockets move |
| `my-house` | Home | Rooms and what happens in them |
| `sports-park` | Sports | Soccer, basketball, tennis, swimming |
| `numbers-forest` | Math | Counting and adding with apples |
| `robo-town` | Machines | Robots, drones, gears |

## Every app includes
- **Real HDRI sky lighting** — 4 real 360° HDR environments in `assets/hdr/` drive the image-based lighting, so every surface catches real-world reflections
- **Art-directed gradient skies** — a painted sky dome (vertex-gradient + sun glow) per world, so each scene has a vivid, deliberate sky rather than a flat colour
- **Cinematic post-processing** — `EffectComposer` + `UnrealBloomPass` + `OutputPass` for soft glow and filmic tone mapping
- **Real 3D models** — 17 PBR-textured glTF models in `assets/models/` (horse, duck, fox, parrot, flamingo, stork, Ferrari, milk truck, animated robot, gears, pool, bathroom, mug, brain, rigged human, …) with real geometry and textures
- **Detailed articulated models** — animals built from jointed limbs, segmented tails, expressive eyes and per-species animation (walking strides, wing flaps, trunk curls) via `assets/models-lib.js`
- **Custom SVG icon system** — 24 hand-drawn line icons (`assets/icons.svg`), inlined so they work from any protocol
- **🔊 Read-aloud** on every fact via `KidLib.speak()` — prefers Microsoft/neural voices when available (great on Windows + Edge), with a **voice picker** in every app
- **🎵 Ambient scene audio** — a procedural soundscape per game (waves, wind, crickets, birdsong, city hum) with a mute toggle
- **✨ Intro pulse** — a golden ring highlights the first tappable thing so a child learns the interaction instantly
- **🏷️ Floating name labels** that keep a constant on-screen size at any distance
- **🧠 Learn more** button — each planet/animal/thing has 2 extra facts to explore
- **💡 Did-you-know tip bar** — a rotating fun fact at the bottom corner
- **🎓 Mini Quiz** (❓ button) — cheer-up quiz that rewards a score and stars
- Modern glass-morphism UI: frosted panels, gradient accents, playful micro-interactions, accessibility (focus rings + reduced-motion support)
- Big friendly buttons, bright kid-safe design, “← Home” links

> 💡 **Tip:** For the free Microsoft neural TTS voices, run the apps in **Microsoft Edge on Windows** and pick a voice marked ✨ (e.g. *Microsoft Aria Online (Natural)*) in the “Voice:” dropdown.

## Testing
A functional test drives every app in a real browser: it loads each page, verifies the 3D scene renders, clicks every control, opens the quiz, answers a question, and fails on any runtime error.

```bash
npm i playwright --no-save
python3 -m http.server 8123      # in the project root
node test/functional-test.js
```

Expected: `PASS=21 FAIL=0`. Screenshots land in `/tmp/simshots/fn-*.png`.

## Shared library
`assets/kid-lib.css` + `assets/kid-lib.js` power the tip bar, quiz, and Learn-more button for all apps. No build step.

## File layout
```
simulator_game/
  assets/kid-lib.css       # shared design system (glass UI, quiz, tips)
  assets/kid-lib.js        # shared engine: tips, quiz, learn-more, voice, ambience, labels
  assets/models-lib.js     # articulated animal/creature model builders + real glTF loader
  assets/realism.js        # HDRI lighting, gradient sky domes, bloom post-processing
  assets/icons.svg         # 24 hand-drawn SVG icons
  assets/hdr/*-small.hdr   # 4 real 360° HDR environments, downsampled to 512×256 (2 MB total)
  assets/models/*.glb      # 17 real PBR-textured glTF models (Draco + Meshopt supported)
  tools/shrink_hdr.py      # utility that produced the downsampled HDRs
  test/functional-test.js  # browser-driven test for all 21 apps
  index.html                # hub menu linking all ten apps
  space-trip/index.html
  ocean-explorer/index.html
  dino-park/index.html
  farm-friends/index.html
  weather-park/index.html
  jungle-safari/index.html
  construction-city/index.html
  supermarket/index.html
  my-body/index.html
  music-studio/index.html
  rainforest-layers/index.html
  polar-world/index.html
  bug-garden/index.html
  water-cycle/index.html
  volcano-lab/index.html
  transport-museum/index.html
  my-house/index.html
  sports-park/index.html
  numbers-forest/index.html
  robo-town/index.html
```

> Note: apps need internet on first load to fetch Three.js. Offline version = save Three.js files locally (ask if you want that).
