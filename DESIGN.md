# Lajjha — DESIGN.md (draft v0.4, storytelling landing)

Follows the awesome-design-md convention: what the brand is, then the tokens and rules needed to extend the page without drifting.

## 1. Brand in one line
Handcrafted, hand-oxidised German silver and 92.5 statement pieces from Siliguri, for women 18–34 who wear their jewellery loud. Est. 2019, reborn 2026. Lajjha by Preeti Maurya.
**Positioning:** between ₹199 zinc fast fashion and ₹20,000+ pure-silver artisans. **Voice:** short, dry, confident, bilingual. No fake urgency, no invented reviews.

## 2. Visual theme: "Heritage, turned up"
Built on the **Lajjha Brand Guidelines** palette and type, used with Gen-Z energy: the guideline colours become whole colour blocks (one per chapter), antique gold is foil (lines, jaal lattice, Devanagari words, 3D frame), headlines clash an upright Cormorant line with a condensed gold grotesk line, and buttons carry a vermilion offset shadow. Guideline voice kept: "Maximal in expression. Minimal in intention."

| Section | Ground |
|---|---|
| Hero | Lajjha burgundy + jaal lattice |
| Story · धातु | Royal indigo |
| Story · शिल्प | Peacock teal |
| Story · संग्रह | Deep emerald |
| Shop | Lajjha ivory, sandstone image beds |
| Instagram | Ink black + jaal |
| Care | Terracotta |
| Closer | Burgundy |

## 3. Colour (from the guidelines, plus two derived tokens)
| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--burgundy` | `#641F2B` | Hero, closer, buttons on ivory | ivory 10:1 |
| `--brass` | `#A9782C` | "Add to bag" fill (ink text), rules on ivory | ink on brass 4.7:1; never small text |
| `--indigo` / `--teal` / `--emerald` | `#283A68` / `#176B68` / `#245B43` | Story chapter grounds (painted in WebGL, blended as you scroll) | ivory ≥5.3:1 |
| `--terracotta` | `#A94E3B` | Care band | ivory 4.6:1 |
| `--rani` | `#B83D6A` | "View in 3D" tag, shop Devanagari heading | ivory on rani 4.6:1 |
| `--vermilion` | `#C64A2F` | Offset shadows, ribbon rule, small marks only | |
| `--ivory` / `--sandstone` | `#F5EBDD` / `#DCCBB5` | Text on dark grounds / secondary text, image beds | |
| `--cocoa` / `--ink` | `#3B211A` / `#171414` | Text on ivory / Instagram ground | |
| `--foil` (derived) | `#D8AE62` | Light end of antique-gold foil: emphasis + Devanagari on dark grounds, primary button fill | 5.7:1 on burgundy |
| `--cocoa-2` (derived) | `#5C4A3F` | Secondary text on ivory | 7.1:1 |

Guideline note: the guide's brass button with white text is ~3:1. We use ink text on brass instead.

## 4. Typography (guidelines)
| Role | Face | Setting |
|---|---|---|
| H1/H2 | Cormorant Garamond SemiBold | Sentence case, line-height 0.92, large |
| Statement line | Anybody, condensed 900 | One line per headline, uppercase, foil gold (`.display .em`, hero `.t-grot`) |
| Body | Manrope Regular | 16–18px, line-height 1.6 |
| Labels | Manrope SemiBold | 12px uppercase, 0.12em tracking (`.label`) |
| Devanagari | Tiro Devanagari Marathi | Chapter words, लज्जा, product names. 3D words drawn via `WordPlane` with a faux-bold stroke |

## 5. 3D
- **Models** (`src/three/jewellery.js`): procedural Three.js reconstructions of Ira, Kaveri, Nira and Aditi, following img2threejs: decompose the photo → swept tubes / lathe / instancing → project the photo's own engraving (grayscale + normal map from `scripts/prepare-textures.mjs`); filigree is real openwork (alpha from the photo). Approximate, single-view: say so in the UI.
- **Material** `silver()`: oxidised-silver PBR with `uEngrave / uOxidise / uBlacken` uniforms that drive the making story.
- **Hero:** gold-foil लज्जा in 3D, Nira ring orbiting through it, draggable Ira crescent, jhumkas at depth, silver dust.
- **Story** (sticky, scroll-driven): धातु two metals → शिल्प cut/engrave/oxidise/buff → संग्रह turntable. Text panes are HTML, readable at rest.
- **Lighting** (`Stage.jsx` `Studio`): warm key spot, cool rim lights behind the subject, and slowly orbiting Lightformers so reflections travel across the silver. Local only (no remote HDR).
- **Depth** (`Effects`): N8AO ambient occlusion in engraving recesses, restrained bloom for specular glints, vignette, SMAA; soft ContactShadows under pieces. Engraved zones carry real displacement from the photo (`relief`), faded at part edges so there are no cracks.

## 6. Do / don't
- Do keep trust facts (COD, 7-day exchange, 500+ orders) next to the first CTA.
- Don't add viewer counters, "only 3 left", countdowns, random "verified" toasts, auto-scrolling marquees or glow effects.
- Don't use AI models wearing jewellery Lajjha doesn't sell.
