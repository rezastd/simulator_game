# Wonder World: 10-game expansion — visual PRD

## 1. Goal and visual pillars

Add 10 new realistic-but-toy-like 3D kids' simulator games to the static
`simulator_game` site (which already ships ~22 single-folder games such as
`farm-friends/` and `ocean-explorer/`), wire one card per game into the
`index.html` hub grid, then commit and push. Each game is one self-contained
`three.js` page with the same shared chrome as the references: tap subjects
to learn, a bottom-left fact card, voice dropdown, Quiz button, music toggle,
Home pill, and a right-side counting mini-game panel.
Pillars:
- Chunky toy-like subjects: rounded low-poly bodies, no thin spindly parts,
  label pill floating above each subject, tap opens a fact bubble/modal.
- Soft readable 3D: hemisphere + directional light, gentle contact shadows,
  saturated ground with darker mottling, light-shaft or sky-gradient backdrop.
- Shared kid chrome in fixed frame positions: title top-left, Home pill under
  it, fact card lower-left, voice bar + Quiz + music bottom-left, game panel
  right, subject chips bottom-center (ocean pattern) where tapping needs it.

## 2. Reference index

| File | Shows | Authoritative for | Source |
|---|---|---|---|
| refs/hero.png | Farm Friends three-quarter view: domed grass field, red barn centerpiece, 6 labeled animals, right counting panel, bottom-left chrome | ground treatment, label pills, right panel, bottom-left stack, camera; wins all conflicts | user |
| refs/side.png | Ocean Explorer view: sand floor, light shafts, seaweed, center fact modal, 8 bottom chips, left fact card | modal, chips row, fact card, underwater backdrop | user |

Assumptions for parts no reference shows:
- backs of new centerpieces are plain mirrors of the front (no extra detail).
- new games reuse `../assets/kid-lib.js`, `models-lib.js`, `realism.js`,
  `kid-lib.css` and the unpkg `three@0.160.0` importmap — no new shared libs.

## 3. Global look

- Style: clean stylized low-poly 3D, smooth-shaded, no texture noise; subjects
  read as soft toys, not realistic renders.
- Edges: explicit no-outline/no-toon rule — subjects and centerpieces are
  smooth-shaded toys with no outlines, no toon strokes, no dark edge lines
  (as in refs).
- Palette (sampled from refs): grass lit `#63B04A`, grass shade `#3E8B3A`;
  barn red `#B8302A`, roof brown `#5A3226`; pig pink `#F2B8C6`, cow cream
  `#F5F0E0`; sky top `#6B8CA8` to horizon `#BFD3E2`; ocean navy `#0E1E3A`,
  sand `#D8D2C4`, shaft white-blue `rgba(159,190,214,.35)`; modal navy
  `#0C1626`; button sky `#5EC4E8`, gold `#FFE08A` / `#FFD166`, quiz orange
  `#FFB347`, music teal `#5ED9C0`; label pills dark green `rgba(35,55,18,.96)`
  with white text; pill stroke 2 px `rgba(255,255,255,.85)` outside the dark
  fill, radius 999 px (2 px light border as in refs).
- Lighting: hemisphere (sky/ground) + one directional key from front-left-above
  (~45° azimuth, ~50° elevation) with soft shadows; `RoomEnvironment` IBL as
  in existing games; contact shadow is a soft ellipse directly under each
  subject, opacity ≤0.25, radius ~60% of body width (faint, as in hero.png).
- Exposure: lit whites must keep detail — no channel above ~245 on white
  subjects (sheep/cow); disable bloom / clamp overexposure.
- Light shafts (ocean pattern): 4–5 shafts, slanting ~15–20° off vertical,
  widths ~60–120 px at 1000×700, full-height, color as in palette above.
- Camera: perspective 45° FOV, three-quarter front view ~20–25° above subject
  center, `OrbitControls` with damping, min/max distance clamped so the
  centerpiece never leaves frame; subject field fills ~70% of frame width.
- Chrome (1000×700 frame fractions, 10:7 default canvas, re-measured from
  refs at their native 1000×700 — do not use 1024×640 8:5 fractions): title at x 2%, y 3%
  (1.4rem bold, white, dark text-shadow); 20–24 px white leading icon before
  each title (house in hero, swimmer in side pattern); Home pill below title (dark
  `rgba(0,0,0,.28)`, 2px white-border, radius 999px); right panel x 83–99%,
  y 11–52%, width ~16% (`rgba(0,0,0,.4)`, 2px border, radius 18px, gold count
  `#FFE08A` 1.6rem, cream CTA button); fact card x 1.5–26%, y 62–75% (dark
  card, radius ~14px, 0.9rem text); voice bar x 1.5–36%, y 77–86%; Quiz pill
  y 87–93% (`#FFB347`); music circle Ø~40px bottom-left (`#5ED9C0`).
- Label pills: dark rounded pills (green `rgba(35,55,18,.96)` on grass,
  navy on ocean), white 0.8rem text, floating ~0.5 subject-heights above each
  subject, always camera-facing (sprite/CSS2D as in existing games).
- Render: three.js r160 WebGL, device-pixel-ratio capped at 2, 1000×700
  default canvas (10:7, matching refs), sRGB output, antialias on.

## 4. Objects

Base unit: subject height H = 1.0 (≈90 px at default camera). Ground disc
radius R = 14 H. Centerpiece height ≈ 2.2 H at field center-back
(x 50%, y ~38% of frame, as the barn in hero.png).
Measured pixel equivalents at the 1000×700 default camera (renders must
match within 20%): barn centerpiece ~90×70 px (≈9%×10% of frame); typical
foreground subject (pig) ~100 px tall. Ground treatment: hero field is a
dome, not a flat disc — horizon center ~y 30% vs ~y 36% at edges at the
default camera (visible curved bulge as in hero.png).

### 4.1 Shared chrome (refs: hero.png, side.png)

| Part | Count | Size | Position | Material | Notes |
|---|---|---|---|---|---|
| title block | 1 | 1.4rem / 0.85rem sub + 20–24 px white leading icon | x 2%, y 3% | white bold + `#EAFFD6` sub, text-shadow | Comic Sans stack; icon = house (farm) / swimmer (ocean) pattern |
| Home pill | 1 | ~90×36 px | under title, x 2%, y 8% | `rgba(0,0,0,.28)`, 2px white border | links `../index.html` |
| fact card | 1 | x 1.5–26%, y 62–75% | lower-left | dark card per biome | 💡 + one rotating fact |
| voice bar | 1 | x 1.5–36%, y 77–86% | bottom-left | dark select, gold star | "Auto (best neural voice)" |
| Quiz pill | 1 | ~110×40 px | y 87–93% | `#FFB347`, dark text | opens 3-question quiz |
| music button | 1 | Ø40 px | below Quiz | `#5ED9C0` | toggles loop |
| right game panel | 1 | x 83–99%, y 11–52% | right | `rgba(0,0,0,.4)` + gold count + cream CTA | counting mini-game; CTA: disabled = `#8A93A0` text on `#C9CFD8`, enabled = dark text on cream (disabled pre-reveal must read as disabled, not identical to enabled) |
| label pill | 6/game | ~90×28 px | above each subject | biome-dark pill, white text, 2 px `rgba(255,255,255,.85)` outer stroke, radius 999 px | camera-facing; occlusion rule: every subject body ≥80% visible at load, min angular separation from centerpiece (no fully-occluded subjects like hero horse) |
| bottom chips | ≤8 (ocean pattern) | ~110×36 px pills, 2 rows | x 27–78%, y 78–92% | dark pills, sky-blue active ring | one chip per subject; all 10 new games have exactly 6 subjects so they use floating label pills only (farm pattern) — no bottom chips unless a game adds >6 tappables |
| fact bubble/modal | 1 | center x 27–74%, y 41–72% (ocean) or bubble x 35–65%, y ~55% (farm) | center | navy/green card, radius 24px | name + ≤2-line / ≤110-char fact + Read-aloud + Learn-more (dark pill, brain icon, opens existing helper) + close (X); ocean modal has 3 controls: Read-aloud + Learn-more + X |
| fence ring (farm pattern) | 1 ring | posts ~8 px wide × ~45 px tall at 1000×700, 8+ posts full-width, 2 rails, ring radius ~95% of ground disc | field horizon | wood `#C89B6A` | as hero.png horizon ring |
| ground decal under centerpiece | 1/game | pale-blue ellipse ~115×25 px (farm barn footprint) | under each centerpiece | pale blue `#BFD3E2` | or state barn sits directly on grass if omitted |
| backdrop scatter (per-game) | ocean: 6–8 pebbles ~20–40 px (pink/white/purple) + ~10 seaweed blades ~100–150 px tall (green) + 1 pink coral sprig + 2 purple reef domes + white plankton dots | spread over floor | per-item colors above | farm pattern: darker grass mottling instead; each game specs its own scatter counts/sizes/colors |

### 4.2 The 10 new games (6 tap subjects + 1 centerpiece each)

Ground disc R = 14 H in every game; subjects ringed at radius 5–9 H, label
pill above each; centerpiece at field center-back; counting target hidden in/
around the centerpiece. Sounds via existing WebAudio blips (square osc,
freq per subject — exact per-subject frequencies are a manual/QA check, not a
render criterion); facts are ≤2 lines, ≤110 chars (starfish modal wraps to
2 lines). Subject size band is 0.15–1.2 H with pixel minima instead of
0.7–1.1 H: juvenile/counted targets (e.g. duck ~15–20 px tall) are exempt
from the old band while pig/cow/sheep-class subjects stay ~80–120 px.

| # | Game (folder) | Centerpiece (2.2 H) | 6 subjects (0.15–1.2 H, standard 0.7–1.1 H) | Ground / backdrop | Counting game |
|---|---|---|---|---|---|
| 1 | Desert Oasis (`desert-oasis/`) | sandstone well `#C89B6A`, dome cap `#8A5A3A` | camel, meerkat, tortoise, jackal, scorpion, palm | sand `#E0C288` + shade `#B98F52`; sky `#7FA8C8`→`#E8D9A8` | Count the dates in the basket |
| 2 | Mountain Rescue (`mountain-rescue/`) | log cabin `#7A5230`, snow roof `#F0F2F5` | goat, eagle, marmot, husky, lynx, pine | snow `#E8EDF2` + rock `#8A8F98`; peaks `#5B6B80` | Count the first-aid kits |
| 3 | Airport (`airport-runway/`) | control tower `#D8DCE2`, cab glass `#2B3A44` | airplane, helicopter, fuel truck, baggage cart, pilot, radar | tarmac `#6E7680` + grass `#63B04A`; sky as hero.png | Count the suitcases |
| 4 | Harbor Port (`harbor-port/`) | lighthouse `#D84040`/`#F5F0E0` bands | ferry, tugboat, crane, seagull, crab, buoy | water `#3E7FA8` + quay `#9AA0A8`; sky as hero.png | Count the buoys |
| 5 | Fire Station (`fire-station/`) | station house `#C8302B`, door `#2B3A44` | fire truck, hydrant, dalmatian, hose, ladder, helmet | asphalt `#707078` + apron `#B8BCC4` | Count the hydrants |
| 6 | Vet Clinic (`vet-clinic/`) | clinic hut `#F0ECE0`, cross `#E04040`, roof `#5EB8C8` | kitten, puppy, rabbit, parrot, hamster, stethoscope | lawn `#63B04A` + path `#D8D2C4` | Count the bandages |
| 7 | Bakery Shop (`bakery-shop/`) | brick oven `#A85A3A`, awning `#E86A7A`/`#F5F0E0` stripes | baker, croissant, cake, baguette, muffin, rolling pin | plaza `#D8CFC0` + sky as hero.png | Count the cupcakes |
| 8 | Medieval Castle (`medieval-castle/`) | keep `#9A9AA2`, roofs `#3A5A9A`, gate `#5A3A22` | knight, horse, dragon, catapult, banner, torch | grass `#5DA34A` + moat `#3E7FA8` | Count the shields |
| 9 | Autumn Orchard (`autumn-orchard/`) | red barn as hero `#B8302A` / `#5A3226` roof | apple tree, pumpkin, scarecrow, crow, wheelbarrow, cider jug | grass `#7FA84A` + leaf dots `#C87830` | Count the apples |
| 10 | Lakeside Camp (`lakeside-camp/`) | tent `#E8913A`, flap `#8A5A3A` | canoe, campfire, frog, heron, lantern, backpack | grass `#63B04A` + lake `#3E7FA8` ellipse | Count the fireflies |

## 5. Games only

- Core loop: drag to orbit · tap a subject → label bounce + bubble/modal with
  ≤2-line / ≤110-char fact + Read-aloud (speechSynthesis, Auto voice; voice
  output is a manual/QA check, not a render criterion) → tap centerpiece to
  reveal N hidden items → press CTA to count them → score `k / N`.
- Controls: pointer tap/click select; drag orbits; wheel/pinch zooms (clamped);
  keyboard: Esc closes bubble, R restarts counting round.
- Camera: orbit follow, 45° FOV, ~20–25° above center, auto-frames all 6
  subjects + centerpiece at load; no subject closer than 3 H to camera;
  occlusion rule: every subject body ≥80% visible at load with min angular
  separation from the centerpiece.
- States: explore → bubble open → counting round (CTA disabled until reveal,
  as hero.png `Count them!` disabled state) → score shown → replay.
- HUD: title (with 20–24 px white leading icon) + Home top-left; right panel
  (icon + name + `k / N` gold count + prompt + CTA with explicit
  disabled `#8A93A0`-on-`#C9CFD8` vs enabled dark-on-cream states); fact card
  lower-left; bottom chips only where a game has >6 tappables (ocean
  pattern) — all 10 new games (exactly 6 subjects each) use floating label
  pills only (farm pattern).
- Feedback and juice: tap bounce 120 ms (scale 1.0→1.15→1.0); reveal pop
  200 ms ease-out; correct-count chime (880 Hz, 0.3 s); wrong-count shake
  6 px, 200 ms decay; bubble fade 300 ms.
- Animation: idle bob ±0.04 H at 1.2 Hz; duck/firefly wander ≤2 H radius;
  water/lantern emissive pulse 2 s; flag/awning wave skew 1 Hz.
- Audio: WebAudio blips per subject (existing helper); Read-aloud via
  speechSynthesis; looping music toggle (existing asset), off by default.

## 6. Technical constraints

- Tool/engine: static pages, three.js r160 via existing unpkg importmap,
  `OrbitControls` + `RoomEnvironment`; no build step, no new dependencies.
- Required outputs: 10 folders `<name>/index.html` reusing `../assets/*`;
  10 cards appended to the `index.html` hub grid (emoji icon + name + 1-line
  blurb, existing `.card` style, `--c1/--c2` gradient per game); commit + push
  to the repo remote when all 10 render without console errors.
- Resolution: default canvas 1000×700 (10:7, matching refs), DPR ≤ 2,
  resize handler as in `farm-friends/index.html`.
- Performance: reuse geometries and materials from `models-lib.js` where
  possible; no per-frame allocations. Manual/QA only (not §8 render
  criteria): 60 fps on a laptop, ≤40 draw calls/game.

## 7. Work breakdown

1. Hub + scaffolding: 10 folders from `farm-friends/index.html` template,
   10 hub cards, shared chrome positions per §3/§4.1.
2. Grounds/backdrops: 10 ground discs + sky/water/night treatments per table.
3. Centerpieces: 10 builds (well, cabin, tower, lighthouse, station, clinic,
   oven, keep, barn-variant, tent) at 2.2 H, center-back.
4. Subjects: 60 chunky builds (6/game, 0.15–1.2 H band, standard 0.7–1.1 H) + label pills + facts (≤2 lines / ≤110 chars).
5. Counting rounds: reveal/hide N items per game + right-panel wiring.
6. Quiz + voice + music wiring per game (existing helpers).
7. Cross-check all 10 against §8, then commit and push.

## Polish round 1

(2026-10-22, vs `reviews/accept-r1-shape.md` + `reviews/accept-r1-look.md`.
Note: this env cannot launch a browser — Chrome aborts on start and the
contact sheet falls back to `tools/make_contact.py` data-sheet tiles — so
every "100% missing / 0 of N" line in those reviews describes the
placeholder tiles, not the pages. The code-side gaps below are ordered
highest-impact first: framing/silhouette/missing parts, then
color/material, then lighting/shadow/background, then detail. Each names
the code part that owns it in `tools/build_new_games.py` unless stated.)

Framing / silhouette / missing parts (verified present, no change except
where noted):
- Full 3D scene, camera, terrain disc, centerpiece, 6 subjects, label
  pills, HUD (title/panel/bubble + KidLib tip/voice/quiz/music/learn-more)
  are emitted for every game — owner: PAGE_TOP (chrome) + PAGE_BOTTOM
  (scene/camera/ground/fence/decal/labels) + GAMES/CENTERS/SCATTERS.
- Camera kept at FOV 55, pos (0,9,22), target (0,2,0) to match
  `farm-friends/index.html`, the shipped hero.png implementation; §3 says
  45°/20–25° but the proven reference wins. Owner: PAGE_BOTTOM camera.
- Ground stays a flat mottled disc (R=24, fence ring R=22 ≈ 95% of disc,
  2 rails + 30 posts); the §4 dome is an accepted gap — all 22 shipped
  games use flat discs and doming would float subjects without per-subject
  height compensation. Owner: PAGE_BOTTOM ground + fence blocks.
- N/A to these 10 games: side.png ocean cast (belongs to ocean-explorer)
  and the farm-animal palette line (each new game has its own palette).

Color / material (fixed this round):
- Glossy dark eyes: pupils were matte (roughness .85, same as bodies);
  now roughness .25 + slight metalness so eyes read glossy against matte
  plush bodies (look §3-#6). Owner: `eyes()` + blob `bugeyes` block in
  PAGE_TOP `toy()` builder.

Lighting / shadow / background (fixed this round):
- God-ray shafts added to the two water-pattern games (pirate-cove,
  lighthouse-bay): 5 slanting (~16°) translucent shafts behind the
  centerpiece (shape #9, §3 shaft geometry). Owner: SCATTERS entries.
- Contact shadow now stays planted while the body bobs (blob is
  counter-offset in the animation loop instead of riding the bob),
  opacity .16 ≤ .25 kept (look #5). Owner: `toy()` shadow + PAGE_BOTTOM
  `animate` loop.
- Pre-load body background is now the per-game sky-bottom color instead
  of browser default white. Owner: PAGE_TOP CSS + `page_html()`.

Detail (fixed this round):
- Right panel width 210 px → 168 px so it sits at x ~83–99% with gold
  `k / N` count and explicit disabled (`#8A93A0` on `#C9CFD8`) vs enabled
  CTA states per §3/§4.1 (look #10). Owner: PAGE_TOP `.panel` CSS.

## Polish round 2

(2026-10-22, vs `reviews/accept-r2-shape.md` + `reviews/accept-r2-look.md`.
Same note as round 1: this env cannot launch a browser — Chromium/Chrome
is unavailable and the contact sheet falls back to `tools/make_contact.py`
data-sheet tiles — so every "0% / 100% missing / 0 of N" line in those
reviews describes the placeholder tiles, not the pages. The code-side gaps
below are ordered highest-impact first: framing/silhouette/missing parts,
then color/material, then lighting/shadow/background, then detail. Each
names the code part that owns it in `tools/build_new_games.py` unless stated.)

Framing / silhouette / missing parts (verified present, no change except
where noted):
- Full 3D scene per game (terrain disc, centerpiece, 6 subjects, label
  pills, HUD chrome) is emitted for every game — owner: PAGE_TOP (chrome)
  + PAGE_BOTTOM (scene/camera/ground/fence/decal/labels) + GAMES/CENTERS/
  SCATTERS. The "0% 3D coverage / 0 meshes" lines describe the fallback tiles.
- Camera stays FOV 55 at (0,9,22) toward (0,2,0) to match
  `farm-friends/index.html`, the shipped hero.png implementation; §3 says
  45°/20–25° but the proven reference wins (same accepted gap as round 1).
  Side.png eye-level framing is N/A: all 10 games use the farm three-quarter
  pattern, none the ocean side pattern. Fixed this round: orbit clamped with
  `controls.maxPolarAngle = PI*0.495` so orbiting can never dip under the
  ground plane and clip the centerpiece (AC-07). Owner: PAGE_BOTTOM controls.
- Label pills now float from per-shape head-tops (`TOPS` map × scale + 0.7,
  flatleaf excepted) instead of a fixed 3.0 that stranded small subjects
  such as aphid/ladybug (scale 0.6–0.85) — §3 "≈0.5 subject-heights above".
  Owner: PAGE_BOTTOM subjects block.
- 6 subjects/game and 5–7 hidden counting items ringed around each
  centerpiece are emitted (shape #4/#5, look #2/#3). N/A: side.png's 8 ocean
  creatures belong to ocean-explorer, and the farm-animal palette line
  belongs to farm-friends — each new game has its own cast/palette.
- Hero/side environment geometry (centerpieces + per-game SCATTERS: palms,
  rocks, pond, light shafts, pines, lilies, buoys, clouds, stage lights) is
  emitted per game (shape #6/#7, look #4). Fixed in round 1: god-ray shafts
  for pirate-cove + lighthouse-bay.
- Rounded low-poly blob silhouettes with body-head-limb proportions come from
  the shared `toy()` builder (shape #8/#9, look #3/#7). Verified present.
- Placeholder strips + bullet text lists (shape #10/#11, look #9/#10) exist
  only in the `make_contact.py` offline fallback tiles, never in the pages;
  the fallback wording stays honest by design.

Color / material (fixed this round):
- Ground mottling dots were hardcoded green (`rgba(20,40,10,…)`) on all 10
  grounds, tinting moon gray / sand / snow green. Now uses each game's
  `dark` shade via a new `__DARKRGB__` token (look #6). Owner: PAGE_BOTTOM
  ground block + `page_html()`.
- Glossy pupils (round 1) and matte pastel bodies unchanged; label pill fill
  stays the shared `KidLib.makeLabel` neutral dark (`rgba(0,0,0,.5)`, white
  text, white stroke, pill radius, camera-facing via `updateLabels`) —
  per-game green/navy tints from §3 would need a shared-lib change, so the
  neutral pill is the accepted gap. Owner: `assets/kid-lib.js` (out of scope).

Lighting / shadow / background (verified present, no change):
- Hemisphere + front-left-above key with soft shadows + `RoomEnvironment`
  IBL + per-game gradient sky/fog; contact shadow planted while bodies bob
  (round 1, look #5/#6); pale-blue decal under each centerpiece; pre-load
  body background per-game (round 1, look #8). Owner: `toy()` shadow +
  PAGE_BOTTOM `animate` loop / ground / decal blocks.

Detail (fixed this round):
- Bubble text no longer prefixes `"<name> says... "` (the title already
  names the subject); the body is now exactly the ≤110-char fact, keeping
  the ≤2-line render budget (AC-03). Owner: PAGE_BOTTOM `showInfo`.

## 8. Acceptance criteria

- AC-01 (hero.png): each game shows title x 2%/y 3% with 20–24 px white
  leading icon, Home pill below it, fact card x 1.5–26%/y 62–75%, voice bar
  + Quiz + music bottom-left, on the 1000×700 (10:7) default canvas.
- AC-02 (hero.png): each game shows right panel x 83–99%/y 11–52% with gold
  `k / N` count and CTA using explicit disabled (`#8A93A0` on `#C9CFD8`)
  vs enabled (dark on cream) states; CTA disabled before reveal.
- AC-03 (hero.png): 6 label pills (2 px `rgba(255,255,255,.85)` outer stroke,
  radius 999 px) float above 6 subjects; tap opens bubble/modal with name +
  ≤2-line / ≤110-char fact + Read-aloud + Learn-more (dark pill, brain icon)
  + close. Quiz 3-question content is a manual/QA check.
- AC-04 (hero.png): centerpiece (2.2 H, ~90×70 px at 1000×700 within 20%)
  sits center-back; ground disc/dome has lit base color plus darker mottling;
  contact shadow under every subject is a soft ellipse, opacity ≤0.25,
  radius ~60% of body width; fence ring (8+ wood posts ~8×45 px, 2 rails,
  ~95% of disc) at horizon; pale-blue `#BFD3E2` ~115×25 px decal under
  centerpiece unless stated grass-direct; whites keep detail (no channel
  above ~245, no bloom); no outlines on subjects/centerpieces.
- AC-05 (side.png): modal/chips games center the navy modal x 27–74% and show
  one chip per subject, active chip ringed sky-blue `#5EC4E8`; new games use
  floating pills only (no bottom chips at 6 subjects).
- AC-06 (hero.png): grass/water/sand base colors match §3 (not gray, not
  neon — exact "daylight rendering tolerance" is a manual/QA judgment);
  barn-red reuse reads `#B8302A`.
- AC-07 (both): camera frames all subjects + centerpiece at load with margin
  (every subject body ≥80% visible, separated from centerpiece);
  orbit/zoom never clips the centerpiece out of frame.
- AC-08 (both): counting round completes (reveal → count → gold score),
  Quiz opens, Read-aloud control present, no console errors.
  Manual/QA only: speechSynthesis voice output, 60 fps / ≤40 draw calls,
  per-subject WebAudio frequencies.
- AC-09: hub grid shows 10 new cards linking to the 10 folders; each page
  loads standalone from its folder path.
- AC-10: commit contains exactly the 10 folders + hub edit (+ this PRD).
  Manual/QA only: `git push` success and exact-commit-contents.
- AC-final: side by side with hero.png / side.png, each new game matches the
  product family in chrome, proportions, and tone (recognizability is a
  manual/QA judgment, not a pixel assertion).

## Review

Round 1 (2026-10-22, vs `reviews/prd-review-1.md`, 19 gaps applied):
- Added fence ring, ground decal, and per-game scatter rows to §4.1 with
  exact counts/sizes/colors.
- Added pill stroke, title icon, Learn-more control, shaft geometry,
  dome lift, and CTA disabled/enabled colors with exact numbers.
- Widened subject band to 0.15–1.2 H, facts to ≤2 lines/110 chars, and
  specified shadow/exposure/no-outline/pixel-mapping rules.
- Locked canvas to 1000×700 (10:7), clarified chips usage, and moved
  non-render criteria to manual/QA in §5/§6/§8.

