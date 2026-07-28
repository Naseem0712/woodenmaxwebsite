/**
 * Add simple "Why choose / Best for" blocks on sliding window pages only.
 * Skips casement, openable, and entrance-door-only pages.
 * Run: node tools/inject-sliding-why-choose.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CHECK = 'wm-why-choose';

function block(title, body) {
  return `
  <!-- WHY CHOOSE (sliding) -->
  <section class="wm-why-choose" style="padding: 3.5rem 0; background: #FFFFFF;">
    <div class="container" style="max-width: 900px; margin: 0 auto; padding: 0 1rem;">
      <h2 class="section-title" style="margin-bottom: 1.25rem; color: #0F172A; font-size: 1.5rem;">${title}</h2>
      ${body}
    </div>
  </section>

`;
}

const PAGES = [
  {
    file: 'products/aluminium-windows/aluminium-sliding-window.html',
    marker: '  <!-- Q&A SECTION -->',
    html: block('Why Choose a Premium 29mm Sliding Window?', `
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>In simple words:</strong> Panels slide left–right on tracks — no swing space inside the room. You get big glass, easy daily use, and a clean modern look.</p>
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>Best for:</strong> Living room, bedroom, and balcony openings where you want maximum glass and smooth sliding every day. Works well in flats and villas when you pick the right series (29mm and above for high-rise).</p>
      <p style="color:#475569;line-height:1.8;margin:0;"><strong>Not the first choice when:</strong> The opening is very small (like a bathroom vent) — a small openable window is easier there. Need sliding mesh on its own track? Look at a <a href="3-track-sliding-window" style="color:#1E40AF;font-weight:600;">3-track window</a> instead of basic 2-track.</p>`)
  },
  {
    file: 'products/aluminium-windows/2-track-aluminium-window-price.html',
    marker: '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
    html: block('Why Choose a 2-Track Sliding Window?', `
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>In simple words:</strong> Two shutters on two tracks — usually glass + glass. It is the simplest sliding setup and often the most economical per opening.</p>
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>Best for:</strong> Bedrooms, medium living windows, and internal partitions where you do not need a separate sliding mosquito mesh shutter.</p>
      <p style="color:#475569;line-height:1.8;margin:0;"><strong>Honest point:</strong> Both tracks are used by glass — you cannot add a third sliding mesh panel on the same frame. For glass + mesh sliding together (common in India), choose a <a href="3-track-sliding-window" style="color:#1E40AF;font-weight:600;">3-track window</a>.</p>`)
  },
  {
    file: 'products/aluminium-windows/3-track-sliding-window.html',
    marker: '  <!-- FAQ SECTION -->',
    html: block('Why Choose a 3-Track Sliding Window?', `
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>In simple words:</strong> Three tracks let you slide glass + glass + mosquito mesh together — the most practical everyday window for Indian homes.</p>
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>Best for:</strong> Bedrooms, balconies, and ground-floor rooms where you want ventilation without insects. Budget projects often use 27mm Domal 3-track; homes that need sealed joints and high-rise stability should step up to <a href="system-sliding-window-price" style="color:#1E40AF;font-weight:600;">29mm system 3-track</a>.</p>
      <p style="color:#475569;line-height:1.8;margin:0;"><strong>When to skip 3-track:</strong> Large living openings where you only want glass and maximum view — a <a href="2-track-aluminium-window-price" style="color:#1E40AF;font-weight:600;">2-track</a> or <a href="4-track-sliding-window-price" style="color:#1E40AF;font-weight:600;">4-track</a> wide opening may fit better.</p>`)
  },
  {
    file: 'products/aluminium-windows/4-track-sliding-window-price.html',
    marker: '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
    html: block('Why Choose a 4-Track Sliding Window?', `
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>In simple words:</strong> Four shutters on four tracks — made for wide openings. When panels stack to one side, you get a very large clear opening (balcony, living-to-terrace, etc.).</p>
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>Best for:</strong> Full-width balcony walls, wide living room openings, and villa façades where width matters more than saving track cost.</p>
      <p style="color:#475569;line-height:1.8;margin:0;"><strong>Important:</strong> Wide 4-track carries heavy glass — use <a href="system-sliding-window-price" style="color:#1E40AF;font-weight:600;">29mm system series or above</a>, not basic Domal, for smooth long-term operation. Keep each shutter width at least half of its height.</p>`)
  },
  {
    file: 'products/aluminium-windows/domal-window-price.html',
    marker: '  <!-- FAQ SECTION -->',
    html: block('Why Choose a Domal (27mm) Sliding Window?', `
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>In simple words:</strong> Domal (27x65) is India\'s most common budget sliding profile — lowest price, light frame, mesh option available.</p>
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>Best for:</strong> Rental homes, builder projects, budget renovations, low floors, and openings under 6 ft height where cost matters most.</p>
      <p style="color:#475569;line-height:1.8;margin:0;"><strong>Honest limits:</strong> Joints are rarely fully sealed — water and sound leakage are common. Only wheels can be replaced later. For high-rise or taller openings, upgrade to 25mm slim system or <a href="system-sliding-window-price" style="color:#1E40AF;font-weight:600;">29mm system sliding</a>.</p>`)
  },
  {
    file: 'products/aluminium-windows/system-sliding-window-price.html',
    marker: '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
    html: block('Why Choose a System Sliding Window?', `
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>In simple words:</strong> A system sliding window uses tested profiles, proper seals, and replaceable parts — track, wheels, and dust pads can be changed without removing the whole window.</p>
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>Best for:</strong> Flats, villas, balconies, and entry sliding openings where you want zero vibration in high-rise (from 29mm up), long smooth sliding, and lower maintenance over 10–15 years.</p>
      <p style="color:#475569;line-height:1.8;margin:0;"><strong>Compared to Domal:</strong> Higher upfront cost, but sealed joints and full serviceability. Compare options on <a href="system-window-vs-normal-window" style="color:#1E40AF;font-weight:600;">system vs normal window</a>.</p>`)
  },
  {
    file: 'products/aluminium-windows/slim-aluminium-window-price-luxury.html',
    marker: '  <section style="padding:3rem 0;background:#fff;" id="faqs">',
    html: block('Why Choose a 38/40mm Minimal Sliding Window?', `
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>In simple words:</strong> Maximum glass, minimum visible frame — bottom track can sit almost flush in the floor. Built for luxury views and very tall openings (12–14 ft).</p>
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>Best for:</strong> High-value villas, farmhouses, and feature walls where the view is the main design element — not typical bedroom budget windows.</p>
      <p style="color:#475569;line-height:1.8;margin:0;"><strong>Honest note:</strong> Heavy profile and premium price. Standard-sized openings often get most of the performance from <a href="system-sliding-window-price" style="color:#1E40AF;font-weight:600;">29mm or 31/34/35mm system sliding</a> at lower cost.</p>`)
  },
  {
    file: 'products/aluminium-windows/2-track-french-sliding-door.html',
    marker: '  <!-- FAQ SECTION -->',
    html: block('Why Choose a French Sliding Window?', `
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>In simple words:</strong> French sliding windows use an arch or divided-glass look on sliding tracks — wider, brighter openings with a premium feel. They slide like normal windows; they do not swing open like casement.</p>
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>Best for:</strong> Balcony openings into the living room and entrance / lobby windows where you want a special look — not the default choice for every bedroom or utility window.</p>
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>Georgian bar option:</strong> Aluminium Georgian bars on the glass add strength and a classic premium look. Simple bar design is roughly <strong>₹3,000–3,500 extra per panel</strong>; complicated patterns can add <strong>₹5,000–7,000 per panel</strong>. See <a href="french-door-georgian-bar" style="color:#1E40AF;font-weight:600;">Georgian bar French windows</a> for details.</p>
      <p style="color:#475569;line-height:1.8;margin:0;"><strong>Not everyday mass product:</strong> If a client wants this look, we can do it — cost is higher than plain sliding. For standard rooms, a normal <a href="2-track-aluminium-window-price" style="color:#1E40AF;font-weight:600;">2-track</a> or <a href="3-track-sliding-window" style="color:#1E40AF;font-weight:600;">3-track</a> window is usually enough.</p>`)
  },
  {
    file: 'products/aluminium-windows/french-door-georgian-bar.html',
    marker: '  <!-- FAQ SECTION -->',
    html: block('Why Choose a Georgian Bar French Window?', `
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>In simple words:</strong> Georgian bars are slim aluminium grids fixed on the glass. They make large glass panels stronger and give a classic, premium European look — popular on French-style sliding windows.</p>
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>Best for:</strong> Entrance windows, balcony-facing living openings, and villa front elevations where design matters — the same places people choose French sliding windows, not regular bedroom sliders.</p>
      <p style="color:#475569;line-height:1.8;margin:0 0 1rem;"><strong>Extra cost (approximate):</strong> Simple Georgian bar design — about <strong>₹3,000–3,500 per door/window panel</strong> on top of base price. If the pattern is complicated, expect about <strong>₹5,000–7,000 per panel</strong> extra. Final quote depends on size and design drawing.</p>
      <p style="color:#475569;line-height:1.8;margin:0;"><strong>Regular product nahi hai — lekin ho sakta hai:</strong> Ye har ghar ke liye standard nahi hota. Jis client ko ye look chahiye, hum bana dete hain — bas base sliding window se cost badh jati hai. Plain sliding ke liye dekho <a href="2-track-french-sliding-door" style="color:#1E40AF;font-weight:600;">French sliding window</a> ya <a href="aluminium-sliding-window" style="color:#1E40AF;font-weight:600;">29mm sliding</a>.</p>`)
  }
];

PAGES.forEach(function (cfg) {
  const filePath = path.join(ROOT, cfg.file);
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes(CHECK)) {
    console.log('SKIP:', cfg.file);
    return;
  }
  if (!html.includes(cfg.marker)) {
    console.error('MARKER MISSING:', cfg.file);
    return;
  }
  html = html.replace(cfg.marker, cfg.html + cfg.marker);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('OK:', cfg.file);
});

console.log('Done.');
