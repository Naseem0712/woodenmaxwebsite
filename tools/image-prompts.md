# WoodenMax — AI Image Prompt Library (v1)

> Drop-in prompts for the 700+ images the 16-silo content cluster needs.
> Tested with **Midjourney v6.1**, **FLUX 1.1 Pro**, **Imagen 3** and **DALL-E 3**.
> All output → WebP (q 78) → 1200 × 750 px (hero) or 600 × 450 px (gallery), ≤ 120 KB.

---

## 0. Universal style suffix (append to every prompt)

```
::style: photorealistic, professional architectural photography, natural daylight,
soft shadows, crisp focus, no people unless specified, premium luxury aesthetic,
clean composition, no watermarks, no text overlays, no logos, --ar 16:10 --q 1
```

For Indian context add: `Indian residential context, Indian villa architecture, modern Indian luxury home`

For studio/process shots: `industrial workshop lighting, clean factory environment, professional manufacturing photography`

For lifestyle / interior: `warm interior lighting, lifestyle photography, magazine-quality, soft golden hour through windows`

---

## 1. Aluminium Windows — prompt pack (60 images)

### Hero prompts

| Page | Prompt |
|------|--------|
| `slim-entrance-glass-door` | "Ultra-slim aluminium entrance door with full-height clear glass, 40mm matte black profile, premium Indian luxury villa entrance, marble flooring, natural daylight streaming in, polished interiors visible inside" |
| `aluminium-sliding-window` | "Modern 2-track aluminium sliding window in a contemporary Indian living room, slim grey aluminium profile, clear DGU glass, plants on windowsill, soft afternoon light, scandinavian-modern interior style" |
| `aluminium-casement-window` | "Outward-opening aluminium casement window in a luxury Indian bedroom, matte black 50mm profile, clear glass, indoor garden view, evening warm light" |
| `top-hung-casement-window` | "Top-hung aluminium casement window above kitchen counter, brushed silver profile, frosted glass option, modern Indian modular kitchen background" |
| `soundproof-aluminium-window` | "Triple-glazed aluminium sliding window in an upscale Mumbai high-rise bedroom, view of city traffic outside through closed glass, peaceful interior, sound-isolation theme" |
| `aluminium-bay-window` | "Aluminium bay window in a colonial-modern Indian villa, three-panel projection, wood-finish profile, plush window seat with cushions" |
| `aluminium-corner-window` | "Corner aluminium sliding window in a luxury penthouse, frameless 90-degree mitre glass joint, panoramic city skyline view" |
| `aluminium-arch-window` | "Half-circle aluminium arch window over an entry foyer, slim black profile, ornate but minimal, marble flooring below" |
| `aluminium-window-for-kitchen` | "Aluminium top-hung window above a stainless steel kitchen sink, frosted lower glass, mosquito mesh visible, Indian modular kitchen, morning light" |
| `aluminium-window-for-bathroom` | "Frosted-glass aluminium window in a luxury bathroom, freestanding bathtub below, white marble walls, indoor plants" |
| `aluminium-window-for-balcony` | "Floor-to-ceiling aluminium sliding window opening onto a high-rise balcony, Mumbai skyline, slim profile, lifestyle furniture" |
| `aluminium-window-for-villa-3bhk` | "Aluminium sliding window in a 3BHK Indian villa living room, matte champagne profile, clear DGU glass, view of small garden lawn, luxe interior" |
| `aluminium-window-for-farmhouse` | "Large 4-panel aluminium sliding window in a Hyderabad farmhouse, wood-finish profile, view of mango orchard, terracotta floor, rustic-modern decor" |
| `aluminium-window-for-apartments` | "Aluminium 2-track sliding window in a typical Indian apartment master bedroom, neutral grey walls, AC duct above, clear glass, simple curtains" |
| `aluminium-window-for-office-buildings` | "Continuous aluminium glazing on the facade of an office cabin, slim grey profile, view of city below, desk and chair in foreground" |
| `wood-finish-aluminium-window` | "Aluminium window with realistic walnut wood-finish profile, casement opening, Indian villa exterior, climbing greenery around" |
| `black-aluminium-window-luxury` | "Matte black aluminium window grid wall, 9-panel fixed glazing, ultra-luxury Indian villa double-height living room, marble floor, suspended chandelier" |
| `grey-aluminium-window-elevation` | "Anthracite-grey aluminium windows on a modern white villa elevation, multiple sizes mixed, Indian luxury home street view, dusk lighting" |
| `tilt-and-turn-aluminium-window` | "Tilt-and-turn aluminium window slightly open at the top, European-style hinge mechanism visible, modern Indian bedroom interior" |
| `pivot-aluminium-window` | "Pivoting aluminium window rotated 90 degrees on central axis, frameless minimal look, contemporary lounge interior" |
| `aluminium-louvre-window` | "Horizontal aluminium louvre window panels stacked open, bathroom ventilation context, frosted glass slats" |
| `awning-aluminium-window` | "Awning aluminium window angled outward from the bottom, rain protection demonstrated by water droplets sliding off glass, kitchen interior view" |
| `aluminium-window-with-georgian-bar-design` | "Aluminium casement window with white Georgian grid bars (3x3 muntin pattern), bay window setup, Indian heritage-modern home, sage-green wall behind" |
| `aluminium-window-with-grill-integrated` | "Aluminium sliding window with integrated decorative grill on outer face, modern laser-cut floral pattern, ground floor Indian home" |

### Spec / comparator / spec-sheet pages (GFX — no AI)

These use SVG infographics:
- profile cross-section diagrams (29mm vs 35mm vs 40mm)
- DGU layer diagram
- thermal-break vs non-thermal-break heat flow
- comparison tables (uPVC vs aluminium vs wood vs steel)
- handle / lock / roller exploded views

### Use-case lifestyle prompts (rooms)

```
"Modern Indian {room_type} with aluminium sliding window, slim grey profile,
{glass_type} glass, {context_object}, {time_of_day} lighting,
luxury Indian interior design, no people, magazine-style"
```

Variables (mix and match):
- `room_type`: master bedroom · pooja room · home office · living room · dining · kids bedroom · guest room
- `glass_type`: clear DGU · frosted · tinted bronze · low-E · acoustic laminated
- `context_object`: indoor plants · bookshelf · home theatre setup · study desk · bed with luxe linens
- `time_of_day`: morning · afternoon · golden hour · evening warm

---

## 2. Glass Elevation / Facade — prompt pack (~30 images)

### Hero prompts

| Page | Prompt |
|------|--------|
| `curtain-wall-system-india` | "Full-height glass curtain wall on an Indian corporate office building, vertical mullions, structural glazing, golden hour reflections in the glass, IT-park context" |
| `structural-glazing-system` | "Close-up of structural glazing detail — frameless edge with silicone joint, glass-to-glass joint, modern facade close-up, architectural detail photography" |
| `spider-glazing-system` | "Spider-fitting glass facade in a luxury Indian mall atrium, four-armed stainless steel spider connectors visible, tempered glass panels, dramatic interior space" |
| `unitized-curtain-wall` | "Pre-assembled unitised curtain wall module being lifted by crane, factory-finished glass-and-aluminium panel, construction site context" |
| `full-glass-villa-elevation-design` | "Modern Indian luxury villa with full glass elevation, double-height frameless glazing, swimming pool reflection in front, evening uplighters, Banjara Hills style" |
| `commercial-tower-glass-facade` | "30-storey commercial tower with curtain wall glass facade, blue-green reflective glass, dramatic sky background, Mumbai BKC architectural style" |
| `g-plus-3-glass-elevation` | "G+3 residential building with continuous glass facade, balconies framed by aluminium, modern Indian apartment block elevation" |
| `g-plus-1-glass-facade-residence` | "Two-storey Indian house with floor-to-ceiling glass facade, minimal black aluminium frames, white plastered walls between, modern Bangalore architecture" |
| `glass-facade-price-{city}` | Use one hero per city: "Modern luxury glass facade installation on a residential building in {city}, recognisable {city_landmark} skyline in distant background, golden hour" |

### Process / detail (GFX or AI macro)

- silicone joint cross-section (SVG)
- spider-fitting types (SVG isometric)
- anchor-bracket exploded view (SVG)
- DGU + laminated layer stack (SVG)

---

## 3. Pergola — prompt pack (~30 images)

### Hero prompts

| Page | Prompt |
|------|--------|
| `louvered-pergola-design-india` | "Motorised aluminium louvered pergola on a luxury Indian rooftop terrace, slats half-open, white profile, outdoor dining set below, evening city lights" |
| `motorised-louvered-pergola` | "Aluminium louvered pergola with louvres rotating, water beading off, monsoon rain scene, terrace deck with lounge furniture, dramatic lighting" |
| `pergola-with-skylight-design` | "Glass skylight pergola over a courtyard sitting area, modern Indian villa, sun rays passing through clear glass, indoor plants, warm tone" |
| `pergola-for-terrace-roof` | "Aluminium pergola on a Mumbai terrace, glass roof panels, outdoor dining table set for six, fairy lights wrapped around posts, sunset" |
| `pergola-for-restaurant-cafe` | "Outdoor restaurant seating area covered by louvered aluminium pergola, mood lighting, customers blurred in background, evening ambience" |
| `pergola-for-bungalow-garden` | "Garden pergola in a Bangalore bungalow, aluminium frame with climbing bougainvillea, swing seat below, daylight" |
| `pergola-for-rooftop-pool-deck` | "Rooftop swimming pool with retractable aluminium pergola alongside, sun loungers, glass railing, luxury hotel rooftop vibe" |
| `pergola-with-LED-lighting` | "Aluminium pergola with integrated LED strip lighting along beams, dusk lighting effect, modern outdoor lounge below" |
| `pergola-with-side-screens-curtains` | "Aluminium pergola with motorised vertical screen blinds rolled halfway, modern outdoor living room, rain barrier setup" |
| `pergola-price-{city}` | "Premium aluminium pergola installation in {city} terrace, {city_landmark} skyline in background" |

---

## 4. Shower Partitions — prompt pack (~25 images)

### Hero prompts

| Page | Prompt |
|------|--------|
| `walk-in-shower-design-ideas` | "Walk-in shower enclosure with 10mm clear tempered glass, black frame profile, marble walls with grey veins, rainfall showerhead, luxury Indian bathroom" |
| `black-frame-shower-partition-trend` | "U-shape shower enclosure with black aluminium profile, 10mm clear glass, white herringbone tile wall background, gold fixtures, magazine-style" |
| `gold-frame-shower-luxury` | "Walk-in shower with brushed gold frame profile, 12mm clear glass, gold-finish rain head, beige marble surroundings, ultra-luxury bathroom" |
| `rose-gold-frame-shower-design` | "Rose gold framed shower enclosure, 10mm glass, soft pink-cream tiles, modern feminine luxury bathroom aesthetic" |
| `u-shape-shower-enclosure` | "U-shape three-sided glass shower enclosure, slim aluminium profile, corner installation, white tile floor with shower drain visible" |
| `d-shape-shower-enclosure` | "Corner D-shape curved-front shower enclosure, frameless 8mm glass, white tiles, small bathroom context" |
| `curved-shower-enclosure` | "Quadrant curved shower enclosure with frameless 10mm glass, modern Indian apartment bathroom, compact layout" |
| `steam-room-glass-enclosure` | "Glass-walled home steam room with aluminium frame, wooden bench inside, low-voltage lighting, spa-like atmosphere" |
| `disability-friendly-walk-in-shower` | "Barrier-free walk-in shower with fold-down seat, grab bars, sloped floor, soft anti-slip tile, senior-friendly bathroom" |
| `shower-partition-price-{city}` | "Premium glass shower partition installation in a {city} master bathroom, neutral palette" |

---

## 5. Metal Louvers & Rafters — prompt pack (~20 images)

### Hero prompts

| Page | Prompt |
|------|--------|
| `round-aluminium-louvers-design` | "Vertical round-tube aluminium louvers on a modern Indian villa elevation, wood-finish coating, repeated rhythm, ground floor entry view" |
| `square-aluminium-louvers-design` | "Square-section aluminium louvers as a sun-shading screen on a south facade, anthracite grey, casting linear shadows" |
| `louvers-for-staircase-design` | "Wood-finish aluminium louvers as a staircase wall feature, light filtering through gaps, modern Indian interior staircase" |
| `louvers-for-pooja-room` | "Carved metal louver panels as pooja room partition, brass-finish, oil lamp glow filtering through, traditional Indian aesthetic" |
| `louvers-for-bedroom-headboard` | "Wood-finish aluminium louvers as a bedroom headboard wall, king-size bed in front, warm bedside lighting" |
| `louvers-for-shop-front-design` | "Aluminium louver facade on a modern boutique shop front, slatted screen with brand signage subtly behind, evening" |
| `aluminium-louvers-finishes-india` | Series: 6 small studio shots of louver samples — anodised silver, matte black, walnut wood finish, charcoal grey, champagne gold, copper |
| `louvers-price-{city}` | "Aluminium louver elevation on a {city} residential project" |

---

## 6. Glass Railing — prompt pack (~20 images)

### Hero prompts

| Page | Prompt |
|------|--------|
| `spigot-glass-railing-design` | "Glass spigot railing on a balcony — square stainless steel spigot fittings, frameless 12mm clear glass, polished marble floor, city view beyond" |
| `channel-glass-railing-system` | "Continuous channel-mount glass railing on a staircase, slim aluminium base channel, no top handrail, modern Indian villa interior" |
| `standoff-glass-railing-design` | "Standoff-mount glass railing on a balcony, polished standoff hardware, wood floor deck, ocean view beyond" |
| `aluminium-base-shoe-railing` | "Aluminium base-shoe glass railing on a luxury rooftop terrace, integrated LED strip light at base, evening" |
| `glass-railing-for-staircase-design-ideas` | "Open-tread staircase with frameless glass railing, oak wood treads, white risers, abstract art on adjacent wall" |
| `glass-railing-for-balcony-design-ideas` | "Multiple balconies on a luxury apartment with frameless glass railing, slim aluminium top cap, monsoon greenery below" |
| `glass-railing-for-pool-deck` | "Frameless glass railing around an infinity pool, glass meeting water edge, daylight, luxury Indian hotel rooftop" |
| `glass-railing-with-handrail-options` | "Glass railing with brushed steel cap handrail, indoor staircase context" |
| `glass-railing-price-{city}` | "Glass railing installation on a {city} balcony" |

---

## 7. Folding Systems — prompt pack (~18 images)

### Hero prompts

| Page | Prompt |
|------|--------|
| `4-panel-bifold-aluminium-door` | "4-panel aluminium bifold door fully open, accordion-stacked to one side, opening living room to garden, slim black profile" |
| `6-panel-multi-panel-folding-door` | "Six-panel folding glass door spanning 6 metres, fully open, large indoor-outdoor restaurant context" |
| `folding-door-for-restaurant-cafe` | "Cafe with bifold doors folded open onto street-side seating, baristas in background, golden hour" |
| `folding-door-for-living-room-balcony` | "Living room opening to balcony via 3-panel bifold door, half-open position, slim aluminium profile" |
| `folding-door-for-poolside-villa` | "Pool-side luxury villa with bifold doors opening to pool deck, frameless feel, blue water reflections" |

---

## 8. Telescope Windows — prompt pack (~15 images)

### Hero prompts

| Page | Prompt |
|------|--------|
| `telescopic-door-for-villa-elevation` | "Telescopic sliding aluminium door on a villa elevation, three panels stacking telescopically to one side, slim black profile, marble flooring" |
| `slim-frame-sliding-window-systems` | "Minimal frame sliding window — only 12mm visible profile between two large glass panels, luxury Indian living room" |
| `minimal-frame-luxury-window` | "Ultra-minimal aluminium window with barely-visible 10mm sightline, frameless feel, view of green garden beyond" |

---

## 9. Grills & Safety — prompt pack (~18 images)

### Hero prompts

| Page | Prompt |
|------|--------|
| `modern-grill-design-2026` | "Modern aluminium window grill with geometric pattern, matte black finish, contemporary Indian home elevation" |
| `laser-cut-grill-design-ideas` | "Laser-cut metal grill panel with floral pattern, mounted as window safety guard, ornate but modern" |
| `cnc-grill-design-india` | "CNC-cut decorative aluminium grill on a balcony, peacock motif, light filtering through" |
| `child-safety-balcony-grills` | "High-rise apartment balcony with vertical aluminium safety grills, child playing safely inside, soft focus" |
| `pet-safe-grills-design` | "Aluminium safety grill on a window, indoor cat sitting on windowsill behind, narrow spacing prevents escape" |
| `main-gate-grill-design-india` | "Decorative aluminium main gate of a Hyderabad villa, automated, modern Indian residential entrance" |
| `grills-price-{city}` | "Aluminium grill installation in a {city} home" |

---

## 10. Elevation Cladding — prompt pack (~18 images)

### Hero prompts

| Page | Prompt |
|------|--------|
| `acp-cladding-colour-options-2026` | "ACP cladding sample swatches in 12 colours arranged in a fan, brushed silver, wood finish, marble finish, copper, anthracite" |
| `hpl-cladding-wood-finish-design` | "Modern villa elevation clad with HPL panels in walnut wood finish, large glass openings between, evening uplighters" |
| `hpl-cladding-marble-finish-design` | "HPL cladding in white-marble finish on a commercial building entrance, premium luxury hotel vibe" |
| `wpc-cladding-for-elevation` | "WPC composite cladding on a residential exterior, vertical board pattern, mid-tone brown, sustainable architecture feel" |
| `cladding-price-{city}` | "Premium elevation cladding installation on a {city} residential project" |
| `elevation-design-trends-2026` | "Aerial perspective of a modern Indian luxury home with mixed cladding — HPL, glass, aluminium louvers — landscape lighting" |

---

## 11. EEAT pillars — special handling

| Page | Image strategy |
|------|----------------|
| `factory-tour-hyderabad` | **5 real photos minimum** of WoodenMax factory exterior + signboard. Supplement with **5 AI generic shots** (CNC, powder coating, assembly bay, QC table, warehouse). Mark AI shots with caption "Representative manufacturing operations". |
| `manufacturing-process` | **6 AI process shots** OK — sequential steps (cut → drill → weld → glaze → assemble → pack). Mark as "Illustrative process flow". |
| `quality-testing-process` | **GFX-only** — SVG diagrams of wind-load test rig, water-spray rig, dynamic load test. No need for AI or real. |
| `certifications-iso-qualicoat` | **Real scans** of certificates (must be authentic) OR **GFX badge-style** illustrations if certs not yet issued. |
| `material-sourcing-india` | **GFX-only** — supply-chain map (India) as SVG infographic, supplier logos. |
| `team-leadership` | **2 real photos minimum** (founder + senior team). Junior team can use **GFX avatars** with initials. |
| `founder-story-woodenmax` | **1 real founder portrait** mandatory + 2-3 supporting AI lifestyle shots (founder visiting site, founder at workshop — only if cast with same person). |
| `case-study-villa-hyderabad` | **3-5 real project photos** ideally. Fallback: rebrand page as "Premium Villa Elevation — Project Case A (Hyderabad, 2024)" with AI shots tagged "Project visualisation". |
| `case-study-commercial-tower-mumbai` | Same approach |
| `case-study-luxury-bungalow-delhi` | Same approach |
| `reviews-testimonials` | **GFX initials avatars** + real review screenshots from Google Maps / Justdial / IndiaMart (must be authentic). |

**Realistic minimum real shoot list (1-2 hour phone shoot):**
1. Factory front + signboard — 3 angles
2. Founder portrait — 1 clean shot
3. Team group photo on factory floor — 1
4. (Optional) 3-5 project completion photos with date + location

= **~10 photos for a credible EEAT cluster**. The other 30 from AI/GFX.

---

## 12. City landings — prompt pack (~11 images)

```
"Aerial view of {city}'s residential skyline at golden hour, modern Indian apartment buildings
with visible aluminium windows on facades, {city_landmark} faintly visible in background,
clean compositional, real-estate photography style"
```

| city | city_landmark |
|------|----------------|
| ahmedabad | Sabarmati riverfront |
| chandigarh | Sukhna Lake hills |
| indore | modern skyscraper cluster |
| kochi | backwaters and palm trees |
| coimbatore | Western Ghats |
| visakhapatnam | RK Beach lighthouse |
| bhubaneswar | KIIT campus |
| nagpur | Deekshabhoomi or Khindsi lake |
| raipur | Mahanadi backdrop |
| goa | coastal villa with palm trees |
| surat | Tapi river bridge |

---

## 13. Blog / Editorial — prompt pack (~15 images)

| Blog | Prompt |
|------|--------|
| `luxury-villa-elevation-checklist` | "Aerial twilight shot of a luxury Indian villa with full glass elevation, illuminated swimming pool, aluminium pergola on terrace, perfect home magazine cover" |
| `coastal-home-window-checklist` | "Beachfront Indian home with salt-resistant aluminium windows, palm trees, blue ocean horizon visible" |
| `north-india-winter-window-checklist` | "North Indian villa with frosted aluminium windows, snow visible outside, warm orange interior light" |
| `india-window-design-trends-2026` | "Mood board collage of trendy 2026 window designs — black slim, wood finish, full glazing, georgian bar, all in one frame" |

---

## 14. WebP optimisation workflow

```bash
# Single image
cwebp -q 78 -m 6 -af -resize 1200 750 input.png -o output.webp

# Batch over a folder
for f in *.png; do
  cwebp -q 78 -m 6 -af -resize 1200 750 "$f" -o "${f%.png}.webp"
done

# Target file size
# Hero (1200x750):  ≤ 120 KB  → q=78
# Gallery (600x450): ≤  60 KB  → q=78
# Thumb (300x225):   ≤  20 KB  → q=72
```

Alternative: **squoosh-cli** for batch processing with smart quality:

```bash
npx @squoosh/cli --webp '{"quality":78}' --resize '{"enabled":true,"width":1200}' input/*.png -d output/
```

---

## 15. Image-manifest tracking (auto-generated)

Use `tools/image-manifest.json` to track every generated asset:

```json
{
  "images": [
    {
      "src": "/images/products/aluminium-windows/slim-entrance-glass-door-hero.webp",
      "prompt": "Ultra-slim aluminium entrance door…",
      "type": "AI",
      "model": "midjourney-v6.1",
      "dimensions": "1200x750",
      "size_kb": 112,
      "alt": "Ultra-slim aluminium entrance glass door with 40mm matte black profile — WoodenMax",
      "used_on": ["/products/aluminium-windows/slim-entrance-glass-door"],
      "generated_at": "2026-05-18T18:00:00Z"
    }
  ]
}
```

This lets us re-optimise, swap, or audit any image later without losing context.
