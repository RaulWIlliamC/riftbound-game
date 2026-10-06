# Wizard animation artwork

Generated using the built-in image-generation tool from the approved compact wizard reference (`exec-1514bf0b-6c4a-4ae4-adf8-05cddab5357e.png`).

Generation brief: preserve the short broad human wizard, purple hat/band, visible face and brown hair, layered detailed purple clothes with tan piping, belt/pouch and small boots. Create exactly six columns and four rows: South, East, West, North; idle relaxed, idle breathing, left step, right step, casting wind-up, casting follow-through. Remove only the staff for independent layering. No magic, labels, scenery or extra designs. A follow-up background extraction retained the frame layout.

Staff brief: isolate the matching simple crooked brown wooden staff, with curled top and neutral ivory sphere, upright on transparency; no character, hand, glow, text or effects.

`wizard-animations.png` is the 24-frame atlas. `wizard-staff.png` is the independent staff. The importer reads alpha bounds, ignores low-opacity background remnants and small adjacent-frame spills, locates the anatomical right hand from the single carry pose in each facing direction and caches textile/sphere palettes. Original source files are retained unchanged. No separate elemental character models are generated.

The renderer uses the first frame in each row for a stable carry pose, animates legs from walking frames, and separates the right sleeve and hand for a shoulder-driven M1 slash with body follow-through. The generated casting frames are excluded because their arm positions are inconsistent.

## Sanctuary image assets

`hub/sanctuary-source.png` is the user's supplied background, copied unchanged into the project. `hub/sanctuary-clean-yard.png` is an imagegen edit removing only the three painted practice dummies. Runtime uses just three small floor patches from that edit, retaining the original source everywhere else. Foreground silhouettes, original dummy textures and portal/wind textures are extracted and cached in Canvas at load time; no additional sprite-sheet library is needed. Map annotations are in `src/hub/layout.js`, in source-image coordinates with one uniform world transform.

Spell audio: `audio/` contains 34 original Mirelo WAV effects, level reports and provider/prompt/job provenance. `audio/raw/` retains the unprocessed originals. Runtime uses the balanced WAVs directly; generation credentials or remote service access are never needed by players. `previews/spell-sound-showcase.wav` is a five-element listening sampler.

## Enemy artwork

`enemy-sprites-simple.png` is the active six-creature gameplay atlas, generated with built-in imagegen using the actual wizard gameplay screenshot as its style reference. Broad pixel clusters, simpler silhouettes, and minimal surface detail replace the rejected concept-like designs. The generation brief is saved in `concepts/enemy-sprites-simple.md`. Each sprite has measured alpha crop bounds and is cached at half its gameplay size, then enlarged without smoothing for a consistent coarser pixel grid. The previous `enemy-sprites.png` remains as an archived source and is not used in the game.

## Riftling animations

The user-supplied `riftling-animations-source.png` replaces the Riftling's static sprite. Its transparent 1448×1086 layout has six rows with 4/6/4/6/3/6 frames. Several poses cross the nominal cell boundaries; `scripts/import-riftling-animations.py` crops through transparent gaps and uses the sprite-pipeline skill's normalizer with one shared scale for all 29 frames. The resulting `riftling-animations.png` has an 8×6 grid of 64px cells, with unused cells transparent. `riftling-animations.json` records the import layout and scale.

`src/enemy-animation.js` selects idle/run, wind-up, pounce/recovery, hit, and death frames from authoritative enemy state. The first four pounce frames play over the 0.32s lunge, the last two over its 0.35s recovery. Damage starts at frame three. Death runs once for 0.75s, then disappears; the supplied last frame contains particles. Frames are cached at 32px and drawn at 64px without smoothing to match the simplified gameplay pixel grid. Preview: `/previews/riftling-animation.html`.

## Guardian animations

The supplied `guardian-animations-source.png` had an opaque checkerboard. Built-in imagegen removed that background in `guardian-animations-cutout.png`, preserving the supplied layout and poses. `scripts/import-guardian-animations.py` uses measured gaps, a shared 0.3 scale, and foot anchors to export `guardian-animations.png` as an 8×6 atlas of 96px cells. `guardian-animations.json` records the import. The rows have 4/6/6/6/2/6 frames; this sheet supplies two hit poses.

Guardian cells draw at 2× with their feet anchored at row 92, preserving the pixel grid and leaving room for the overhead hammer. `src/guardian-animation.js` drives idle/walk, the 0.95s preparation, a 0.6s slam, hit reactions, and a 1.2s one-shot collapse. The supplied ground-contact pose is slam frame four; combat resolves exactly once at that pose. Facing remains locked during the swing. Preview: `/previews/guardian-animation.html`.

## Bog Slime animations

The supplied transparent `slime-animations-source.png` contains 31 poses in six rows (4/6/6/6/3/6). Some stretched poses have overlapping bounding boxes, so `scripts/import-slime-animations.py` groups connected silhouettes and their nearby droplets instead of cutting at grid lines. Alpha below 32 is discarded to remove invisible export noise. One shared 0.2 scale and measured row baselines produce `slime-animations.png`, a 6×6 grid of 64px cells, with metadata in `slime-animations.json`. Cells draw at 2× with a ground anchor of 60.

`src/slime-animation.js` animates idle, movement, body bash, puddle release, hit and a one-shot death. Combat alternates puddle release and body bash, with a 0.7s warning and a 0.6s action. Frame four applies damage once; the puddle release leaves a 5s slowing pool at the Slime's base, while the bash moves toward the locked target. Facing is locked through preparation and attack. Preview: `/previews/slime-animation.html`.

## Ash Archer animations

The user supplied `archer-animations-source.png` with an opaque checkerboard. Built-in imagegen produced the transparent `archer-animations-cutout.png`. `scripts/import-archer-animations.py` imports 31 frames (4/6/6/6/3/6) into a 6×6 atlas of 64px cells at one shared 0.22 scale, with measured row boundaries and foot anchors recorded in `archer-animations.json`.

`src/archer-animation.js` animates idle, walking, fire arrow, Inferno Shot, hit and one-shot death. Arrows release once at action frame four. Every third shot charges for 1.15s instead of 0.8s, then launches a faster, wider 22-damage Inferno arrow instead of the normal 14-damage fire arrow. Both use flame-shaped projectiles with ember trails. Facing and aim remain locked through charging and release. `/previews/archer-animation.html` includes animation loops and a live firing demonstration using the encounter and game renderer.

## Rift Seer animations

The supplied `seer-animations-source.png` had a baked checkerboard. Built-in imagegen produced `seer-animations-cutout.png` with transparency. `scripts/import-seer-animations.py` uses measured row boundaries, shared 0.2 scale and foot anchors to import 31 poses (4/6/6/6/3/6) into a 6×6 atlas of 64px cells. Metadata is saved in `seer-animations.json`.

`src/seer-animation.js` drives hover, glide, rift bolt, ally shield, hit and one-shot death. Casts resolve once on frame four. When nearby allies exist, the Seer alternates bolts with a shield-casting pulse; alone it continues casting bolts. The existing 60% ally damage mitigation remains tied to a living, uncaptured Seer within 210 units and disappears on its death or capture. Facing remains locked during casts. Preview: `/previews/seer-animation.html`.

## Riftling attack effects

`riftling-effects-padded.png` is the edited 2048×1024 RGBA attack atlas: four rows of eight 256px cells for charge, trail, impact, and aftershock. `scripts/normalize-riftling-effects.py` records the layout and verifies at least 24px transparent margins in every cell. `src/riftling-effects.js` caches 128px tiles and selects frames from combat timers. Charge plays over the 0.48s warning, trail over the 0.32s pounce, and successful hits play a 0.5s impact with delayed aftershock. Trails draw behind the creature, impacts above characters, and aftershocks on the ground. Riftling cosmetic hit hazards carry their direction in encounter snapshots. Procedural danger markings remain for dodge readability.

## Guardian attack effects

`guardian-effects-source.png` is the supplied 32-frame attack sheet with a baked checkerboard. Built-in imagegen extracted `guardian-effects-edit.png`; `scripts/normalize-guardian-effects.py` imports four eight-frame rows into `guardian-effects-padded.png`, a transparent 2048×1024 atlas of 256px cells with verified margins. Faint extraction noise below alpha 64 is discarded.

`src/guardian-effects.js` selects charge, swing, rock impact and fracture shockwave frames. The charge follows the six measured hammer-head positions during preparation. The swing plays through the 0.6s slam; the existing frame-four damage event starts a 0.5s rock burst and delayed shockwave. Ground fractures draw below characters and the rock burst above them. Procedural Guardian charge/impact decoration is replaced; the danger warning remains. Preview: `/previews/enemy-abilities.html`.

## Bog Slime attack effects

`slime-effects-source.png` is the supplied transparent 32-frame sheet. `scripts/normalize-slime-effects.py` packs four eight-frame rows into a 2048×1024 atlas with verified transparent margins, preserving each row's relative animation scale. `src/slime-effects.js` plays bubbling charge, directional bash trail, contact splash, and a looping puddle. Splash and puddle visible widths follow their hazard radii. Gameplay timing, damage, and slowing remain unchanged. Preview: `/previews/slime-effects.html`.

The current slime renderer uses `slime-effects-v2-padded.png`, generated from `slime-effects-v2-source.png` with a brighter jade/lime/mint palette and a pool drawn directly from above. `normalize-slime-effects.py` now reproduces this version. The pool renders at its original proportions, without the previous stretched oval or circular clipping. Puddle warning, splash damage and slowing radius are 75px (previously 65px). Original supplied assets are retained.

## Experimental Thunder Strike sheet

`thunder-strike-test-source.png` retains the supplied alternate artwork. `normalize-thunder-strike-test.py` creates a padded 32-frame atlas; `src/thunder-strike-test.js` plays anticipation for 0.16s, then bolt, burst, and aftershock through the existing 0.8s spell lifetime. The original procedural `thunder` renderer remains intact. `THUNDER_STRIKE_SHEET_TEST` in `src/testing.js` controls the default, and `?thunder=classic` selects the original per browser. Compare both at `/previews/thunder-strike-test.html`. Damage, hit radius, cooldown and sound remain unchanged.

## Ash Archer attack effects

`archer-effects-source.png` retains the supplied sheet with its baked checkerboard. Imagegen extracted `archer-effects-edit.png` with true transparency. `normalize-archer-effects.py` creates four padded eight-frame rows for charge, normal flame arrow, impact, and Inferno Shot. `src/archer-effects.js` synchronizes charge with each windup, loops flight frames, rotates arrows along projectile velocity, and plays impacts once. The normal and stronger attacks retain existing timing, speed and damage. Preview: `/previews/archer-effects.html`.

## Rift Seer attack effects

`seer-effects-source.png` retains the supplied sheet with baked checkerboard. Imagegen extracted true transparency into `seer-effects-edit.png`; `normalize-seer-effects.py` packs 32 padded frames. `src/seer-effects.js` selects charge, looping rift bolt, one-shot impact, and looping ally shield. The shield uses a faint center and brighter rim to preserve creature readability, sizing to the protected creature. Existing ally links and shield mitigation remain unchanged. Preview: `/previews/seer-effects.html`.
