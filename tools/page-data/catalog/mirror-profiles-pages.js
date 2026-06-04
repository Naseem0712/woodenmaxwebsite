const H = require('./_helpers');
const { CITIES, MIRROR_RATES, MIRROR_RATES_JSON, mirrorCalcConfig, mirrorCalcKey, mirrorImg, ORIGIN } = H;
const SHARED = require('./_mirror-shared');
const {
  SQUARE_PRESETS,
  MIRROR_HARDWARE_TABLE,
  MIRROR_LED_COMPARISON,
  MIRROR_POLICY_FAQ,
  MIRROR_CALC_INTRO,
  MIRROR_EEAT,
  MIRROR_LUXURY_NOTE,
  MIRROR_RATE_COMPARISON,
} = SHARED;

const LUXURY_SLUGS = [
  'motion-sensor-mirror-profile',
  'backlit-mirror-profile-price',
  'custom-mirror-profile',
  'aluminium-mirror-frame-designs',
  'led-mirror-profile-price',
  'led-mirror-profile-delhi',
  'led-mirror-profile-hyderabad',
];

const SILO = 'mirror-profiles';
const OUT_DIR = 'products/mirror-profiles';
const BC_PARENT = { label: 'Mirror profiles', href: '/products/mirror-profiles/' };

function p(cfg) {
  var base = {
    silo: SILO,
    outDir: OUT_DIR,
    schemaType: 'Product',
    unit: 'ft',
    cities: CITIES,
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/catalog' },
      BC_PARENT,
      { label: cfg.breadcrumbLabel || cfg.h1 },
    ],
    canonical: '/products/mirror-profiles' + (cfg.slug === 'index' ? '/' : '/' + cfg.slug),
    out: OUT_DIR + '/' + (cfg.slug === 'index' ? 'index.html' : cfg.slug + '.html'),
  };
  var out = Object.assign(base, cfg);
  if (!out.eeatBlock && !cfg.skipEeat) out.eeatBlock = MIRROR_EEAT;
  var ck = cfg.calcMode || mirrorCalcKey(cfg.slug);
  if (ck) {
    if (!out.calcMode) out.calcMode = ck;
    var squareModes = ['round-touch', 'round-slim', 'square-touch', 'wooden-round'];
    var presets = squareModes.indexOf(ck) !== -1 ? SQUARE_PRESETS : RECT_PRESETS;
    out.calcConfig = mirrorCalcConfig(cfg.slug, Object.assign({
      presetSizes: presets,
      defaultW: cfg.defaultW != null ? cfg.defaultW : (squareModes.indexOf(ck) !== -1 ? 3 : ck === 'rect-led' ? 2.5 : 2),
      defaultH: cfg.defaultH != null ? cfg.defaultH : (ck === 'rect-led' ? 4 : 3),
    }, cfg.calcConfigExtras || {}), ck);
  }
  if (out.calcMode) {
    if (!out.hardwareTable) out.hardwareTable = MIRROR_HARDWARE_TABLE;
    if (out.comparisonTable !== false && !out.comparisonTable) out.comparisonTable = MIRROR_LED_COMPARISON;
    if (!out.calcIntro) out.calcIntro = MIRROR_CALC_INTRO;
    out.faqs = (cfg.faqs || []).concat(MIRROR_POLICY_FAQ);
  }
  if (LUXURY_SLUGS.indexOf(cfg.slug) !== -1 && !cfg.skipLuxury) {
    out.bodySections = out.bodySections || [];
    if (!out.bodySections.some(function (s) { return s.heading === 'Luxury mirror expertise'; })) {
      out.bodySections.unshift({
        heading: 'Luxury mirror expertise',
        body: MIRROR_LUXURY_NOTE,
        subsections: [
          { h3: 'White-glove delivery', body: '<p>Crate packing, edge protection and installation supervision on premium lines. Discuss hotel, villa or showroom requirements on the quote form below the calculator.</p>' },
          { h3: 'Sensor & LED reliability', body: '<p>Motion and touch modules are tested before dispatch. Drivers matched to mirror size — upgrade paths visible in the live calculator.</p>' },
        ],
      });
    }
  }
  return out;
}

const RECT_PRESETS = [[1.5, 2.5], [2, 3], [2.5, 4], [3, 5]];
const RECT_SIZES_NOTE = 'Ideal rectangle sizes: 1.5×2.5, 2×3, 2.5×4, 3×5 ft — custom sizes available.';

const ALL_CHILD_SLUGS = [
  'led-mirror-profile-price',
  'mirror-profile-without-led',
  'touch-sensor-mirror-profile',
  'motion-sensor-mirror-profile',
  'led-bathroom-mirror-profile',
  'wardrobe-mirror-profile',
  'backlit-mirror-profile-price',
  'round-mirror-profile',
  'rectangular-mirror-profile',
  'mirror-profile-price-per-foot',
  'custom-mirror-profile',
  'aluminium-mirror-frame-designs',
  'led-mirror-profile-delhi',
  'led-mirror-profile-hyderabad',
];

function hubLinks() {
  return [
    { slug: 'led-mirror-profile-price', title: 'C-type LED mirror', desc: 'Half-round & C-type', img: 'double-strip-led-mirror-profile-premium.webp' },
    { slug: 'mirror-profile-without-led', title: 'Plain mirror frame', desc: 'Frame only', img: 'aluminium-mirror-frame-profile-gold-finish.webp' },
    { slug: 'touch-sensor-mirror-profile', title: 'Touch round mirror', desc: 'Live calculator', img: 'touch-sensor-led-mirror-bathroom-india.webp' },
    { slug: 'motion-sensor-mirror-profile', title: 'Luxury motion mirror', desc: 'Dual glass custom', img: 'motion-sensor-mirror-auto-on-bathroom.webp' },
    { slug: 'led-bathroom-mirror-profile', title: 'LED bathroom mirror', desc: 'Large rectangle', img: 'led-bathroom-mirror-waterproof-profile.webp' },
    { slug: 'wardrobe-mirror-profile', title: 'Wooden round wardrobe', desc: '2×2 – 4×4 ft', img: 'wooden-finish-mirror-profile-wardrobe-design.webp' },
    { slug: 'backlit-mirror-profile-price', title: 'Touch backlit rectangle', desc: 'Bedroom vanity', img: 'backlit-led-mirror-profile-bedroom-design.webp' },
    { slug: 'round-mirror-profile', title: 'Round slim profile', desc: 'Touch LED round', img: 'round-led-mirror-profile-bathroom-design.webp' },
    { slug: 'rectangular-mirror-profile', title: 'Rect / square touch', desc: 'Same as round line', img: 'rectangular-backlit-mirror-profile-india.webp' },
    { slug: 'mirror-profile-price-per-foot', title: 'Rate list per foot', desc: 'All types 2026', img: 'aluminium-mirror-profile-price-per-foot-india.webp' },
    { slug: 'custom-mirror-profile', title: 'Custom shapes', desc: 'Any size & finish', img: 'custom-shape-led-mirror-profile-design.webp' },
    { slug: 'aluminium-mirror-frame-designs', title: 'Frame designs', desc: '50+ ideas', img: 'matt-black-aluminium-mirror-frame-profile.webp' },
    { slug: 'led-mirror-profile-delhi', title: 'Delhi NCR supply', desc: 'Install & delivery', img: 'led-mirror-profile-installation-hyderabad.webp' },
    { slug: 'led-mirror-profile-hyderabad', title: 'Hyderabad supply', desc: 'Factory direct', img: 'led-mirror-profile-installation-hyderabad.webp' },
  ];
}

const pages = [
  p({
    slug: 'index',
    isHub: true,
    breadcrumbLabel: 'Mirror profiles hub',
    title: 'Aluminium Mirror Profiles Price India — LED, Touch & Motion Sensor | WoodenMax',
    description: 'LED mirror profile ₹720–1,850/ft, plain aluminium ₹450–820/ft, touch sensor from ₹8,500, motion sensor from ₹9,200 — WoodenMax fabricates & installs across Delhi, Jaipur, Hyderabad. Free estimate.',
    h1: 'Aluminium Mirror Profiles — LED, Backlit & Sensor Models | Fabricated by WoodenMax',
    heroSub: 'WoodenMax manufactures aluminium mirror profiles with optional LED, touch and motion sensors. Transparent ₹/ft rates from ₹450 to ₹1,850 per foot. Factory-fabricated, site-installed across India.',
    image: 'led-aluminium-mirror-profile-bathroom-price-india.webp',
    imageAlt: 'LED aluminium mirror profile for bathroom — price from ₹720/ft | WoodenMax India',
    imageCaption: 'LED aluminium mirror profile — WoodenMax fabricates bathroom, wardrobe and custom mirror frames',
    calcMode: 'rect-led',
    calcIntro:
      'Live hub calculator — width × height (ft). V120 ₹850/sqft · V220 ₹950/sqft. Profile colour, glass brand, touch & driver update the amount instantly. For C-type, round, plain frame or luxury lines open the dedicated pages below.',
    defaultW: 2.5,
    defaultH: 4,
    priceTable: {
      head: ['Mirror type', 'Price range (₹/ft)', 'Best for'],
      rows: [
        ['Plain aluminium frame', '₹450 – ₹580', 'Budget bathrooms'],
        ['LED backlit profile', '₹720 – ₹1,280', 'Modern bathrooms'],
        ['Premium LED profile', '₹1,280 – ₹1,850', 'Luxury interiors'],
        ['Touch sensor mirror (unit)', '₹' + MIRROR_RATES_JSON.unitProducts.touchSensorMirror.min.toLocaleString('en-IN') + ' – ₹' + MIRROR_RATES_JSON.unitProducts.touchSensorMirror.max.toLocaleString('en-IN'), 'Premium homes'],
        ['Motion sensor mirror (unit)', '₹' + MIRROR_RATES_JSON.unitProducts.motionSensorMirror.min.toLocaleString('en-IN') + ' – ₹' + MIRROR_RATES_JSON.unitProducts.motionSensorMirror.max.toLocaleString('en-IN'), 'Smart homes'],
      ],
    },
    comparisonTableTitle: 'Mirror product lines compared',
    comparisonTable: MIRROR_RATE_COMPARISON,
    bodySections: [
      {
        heading: 'Why WoodenMax for mirror profiles',
        body: '<p>We fabricate the aluminium frame, integrate LED drivers, powder-coat finishes and deliver ready-to-install mirror sets. Every rate on this hub is indicative — final BOQ after free site measurement. GST 18% always extra.</p>',
        subsections: [
          { h3: 'Luxury & standard under one roof', body: '<p>From <a href="mirror-profile-without-led">plain frames</a> to <a href="motion-sensor-mirror-profile">dual-glass luxury mirrors</a> — same factory QC and warranty policy.</p>' },
          { h3: 'City supply', body: '<p>Factory Hyderabad · install teams <a href="led-mirror-profile-delhi">Delhi NCR</a> · <a href="led-mirror-profile-hyderabad">Hyderabad</a> · Jaipur projects.</p>' },
        ],
      },
    ],
    faqs: [
      { q: 'What is the starting price for LED mirror profile per foot?', a: 'LED mirror aluminium profile starts from <strong>₹720/ft</strong> for single-strip systems and goes up to <strong>₹1,850/ft</strong> for premium warm-white double-strip profiles with dimming.' },
      { q: 'Do you supply only profile or complete mirror?', a: 'Both — we can supply profile-only for your glazier, or a complete mirror panel with glass, LED and installation.' },
      { q: 'Which cities do you deliver to?', a: 'Primary fabrication from Hyderabad with installation teams in <strong>Delhi NCR, Jaipur, Mumbai, Bengaluru</strong> and project-based dispatch pan-India.' },
      { q: 'Is the LED mirror profile waterproof?', a: 'Bathroom-grade profiles use IP-rated LED strips and sealed aluminium channels suitable for humid environments when installed correctly.' },
      { q: 'What warranty do you offer?', a: 'LED driver warranty 2 years, aluminium profile 10 years against manufacturing defects. Glass breakage in transit is covered at dispatch.' },
    ],
    hubLinks: hubLinks(),
    productSchema: { name: 'Aluminium Mirror Profiles', lowPrice: 450, highPrice: 1850, unitCode: 'FOT' },
  }),

  p({
    slug: 'led-mirror-profile-price',
    title: 'C-Type LED Mirror Price — More Than Half Round | WoodenMax',
    description: 'C-type (more than half-round) LED mirror with imported profile, V120 ₹950/sqft, V220 ₹1,050/sqft. Connectors & banding. WoodenMax India.',
    h1: 'C-Type LED Mirror — More Than Half Round Design',
    heroSub: 'Premium C-type mirror (arc greater than semicircle) with imported aluminium profile, connector joints with banding, Saint-Gobain glass and V120/V220 backlight.',
    image: 'double-strip-led-mirror-profile-premium.webp',
    imageAlt: 'C-type more than half round LED mirror with imported profile | WoodenMax',
    calcMode: 'half-round',
    calcConfigExtras: { shapeLabel: 'C-type (>half round)' },
    calcIntro: 'Enter bounding width × height (ft). V120 ₹950/sqft · V220 +₹100/sqft. Same rate band as D-type half-round.',
    priceTable: {
      head: ['LED', 'Rate/sq.ft', 'Notes'],
      rows: [
        ['V120 single strip', '₹950', 'C-type half-round+ arc'],
        ['V220 premium', '₹1,050', 'V120 + ₹100/sq.ft'],
        ['Profile', 'Imported', 'Connectors + banding at joints'],
      ],
    },
    bodySections: [{
      heading: 'C-type vs D-type',
      body: '<p><strong>C-type</strong> mirrors cover more than a semicircle (wider arc). <strong>D-type</strong> is exactly half-round. Both use the same LED rate card and imported machining (etching, banding, cutting).</p>',
    }],
    faqs: [
      { q: 'What is a C-type mirror?', a: 'When the mirror arc is wider than a semicircle — popular for bathroom vanities and feature walls.' },
      { q: 'Why is the rate the same as D-type?', a: 'Both use the same imported profile, connector banding and LED strip specification — billable area is width × height.' },
    ],
    productSchema: { name: 'C-Type LED Mirror', lowPrice: 950, highPrice: 1050, unitCode: 'FTK' },
  }),

  p({
    slug: 'mirror-profile-without-led',
    title: 'Plain Aluminium Mirror Profile Price — Without LED Frame | WoodenMax',
    description: 'Plain aluminium mirror profile ₹450–820/ft. Silver, black, gold, wooden finish. Custom sizes. WoodenMax Delhi, Hyderabad, Jaipur.',
    h1: 'Aluminium Mirror Frame Without LED — ₹450 to ₹820 per Foot',
    heroSub: 'Powder-coated aluminium mirror frames without LED — for glaziers, contractors and budget bathroom upgrades. Silver anodized, matt black, gold and wooden texture finishes.',
    image: 'aluminium-mirror-frame-profile-gold-finish.webp',
    imageAlt: 'Gold finish aluminium mirror frame profile without LED | WoodenMax',
    calcTypes: [
      { label: MIRROR_RATES.plain.label, min: MIRROR_RATES.plain.min, max: MIRROR_RATES.plain.max },
      { label: MIRROR_RATES.black.label, min: MIRROR_RATES.black.min, max: MIRROR_RATES.black.max },
      { label: MIRROR_RATES.gold.label, min: MIRROR_RATES.gold.min, max: MIRROR_RATES.gold.max },
      { label: MIRROR_RATES.wood.label, min: MIRROR_RATES.wood.min, max: MIRROR_RATES.wood.max },
    ],
    priceTable: {
      head: ['Finish', 'Price/ft', 'Thickness'],
      rows: [
        ['Plain silver anodized', '₹' + MIRROR_RATES.plain.min + ' – ₹' + MIRROR_RATES.plain.max, '1.2 mm'],
        ['Matt black powder coat', '₹' + MIRROR_RATES.black.min + ' – ₹' + MIRROR_RATES.black.max, '1.2 mm'],
        ['Gold powder coat', '₹' + MIRROR_RATES.gold.min + ' – ₹' + MIRROR_RATES.gold.max, '1.2 mm'],
        ['Wooden finish texture', '₹' + MIRROR_RATES.wood.min + ' – ₹' + MIRROR_RATES.wood.max, '1.4 mm'],
      ],
    },
    faqs: [
      { q: 'Can plain profile be made in custom sizes?', a: 'Yes — we fabricate to any length and width, minimum order 6 ft linear.' },
      { q: 'Is glass included?', a: 'Profile-only or complete mirror with glass — both options available.' },
    ],
    productSchema: { name: 'Plain Aluminium Mirror Profile', lowPrice: 450, highPrice: 820, unitCode: 'FOT' },
  }),

  p({
    slug: 'touch-sensor-mirror-profile',
    title: 'Touch Round LED Mirror Price — Standard Profile | WoodenMax',
    description: 'Round touch LED mirror with standard aluminium profile. Sizes 2×2 to 4×4 ft. Live calculator — per piece amount. WoodenMax India.',
    h1: 'Touch Round LED Mirror — Standard Profile Design',
    heroSub: 'General round mirror line with integrated 3A touch sensor (5A optional), V120/V220 backlight and standard aluminium profile. Popular for bathroom and dressing.',
    image: 'touch-sensor-led-mirror-bathroom-india.webp',
    imageAlt: 'Touch sensor round LED mirror standard profile | WoodenMax',
    calcMode: 'round-touch',
    priceTable: {
      head: ['Size (ft)', 'Typical use', 'LED options'],
      rows: [
        ['2 × 2', 'Compact bath', 'V120 or V220'],
        ['2.5 × 2.5', 'Standard bath', 'V120 or V220'],
        ['3 × 3', 'Dressing / master bath', 'V120 or V220'],
        ['3.5 × 3.5', 'Large vanity', 'V120 or V220'],
        ['4 × 4', 'Feature wall', 'V120 or V220'],
      ],
    },
    bodySections: [{
      heading: 'Standard vs slim round line',
      body: '<p>This page is the <strong>standard profile</strong> round touch mirror. For a slimmer face, see the <a href="round-mirror-profile">round slim profile page</a> (+₹100/sq.ft vs this line).</p>',
    }],
    faqs: [
      { q: 'What is the default touch sensor?', a: '<strong>3A capacitive touch</strong> is standard. Select 5A upgrade in the calculator (+₹' + MIRROR_RATES_JSON.hardware.touch5AUpgrade + '/pc).' },
      { q: 'What driver options are available?', a: '<strong>5A driver</strong> is standard. 7A (+₹' + MIRROR_RATES_JSON.hardware.driver7AUpgrade + '/pc) or 10A (+₹' + MIRROR_RATES_JSON.hardware.driver10AUpgrade + '/pc) for larger mirrors.' },
    ],
    productSchema: { name: 'Touch Round LED Mirror', lowPrice: 650, highPrice: 750, unitCode: 'FTK' },
  }),

  p({
    slug: 'motion-sensor-mirror-profile',
    title: 'Luxury Custom Backlit Mirror — Motion & Touch Sensor | WoodenMax',
    description: 'Highly customised luxury mirror — dual glass shapes, beveling, backlight without profile. V120 ₹1,850/sqft. Motion ₹1,220/glass. Touch ₹850/pc.',
    h1: 'Luxury Custom Backlit Mirror — Dual Glass, Beveling & Sensors',
    heroSub: 'Profile-free luxury line: two separate glass shapes cut and bevelled, joined on a back support, then backlight added. Motion sensor standard; optional 5A touch sensor.',
    image: 'motion-sensor-mirror-auto-on-bathroom.webp',
    imageAlt: 'Luxury custom backlit mirror motion sensor dual glass beveling | WoodenMax',
    calcMode: 'luxury-glass',
    calcIntro: 'Width × height (ft). Billable area includes 1.5× wastage by default. Pick LED, sensor & glass piece count.',
    priceTable: {
      head: ['Item', 'Rate'],
      rows: [
        ['Glass + bevel + backlight V120', '₹1,850 / sq.ft (on billable area)'],
        ['V220 LED', '+ ₹100 / sq.ft'],
        ['5A touch sensor', '₹850 / pc'],
        ['Motion sensor', '₹1,220 / glass piece'],
        ['Wastage factor', '1.5× on entered size (default)'],
      ],
    },
    bodySections: [{
      heading: 'How this luxury mirror is built',
      list: [
        'Two different glass shapes — CNC cut & bevelled separately',
        'Back support frame joins both glasses (no visible aluminium profile on face)',
        'Backlight installed after assembly',
        'Motion sensor standard; touch sensor optional',
      ],
    }],
    faqs: [
      { q: 'Why is there a 1.5× wastage factor?', a: 'Custom dual-glass cutting has higher material loss — the calculator uses 1.5× billable area by default for a realistic quote.' },
      { q: 'Can I have both touch and motion sensors?', a: 'Yes — touch ₹' + MIRROR_RATES_JSON.calculators['luxury-glass'].touchPc + '/pc, motion ₹' + MIRROR_RATES_JSON.calculators['luxury-glass'].motionPerGlass + ' per glass piece. Select options in the calculator.' },
    ],
    productSchema: { name: 'Luxury Custom Backlit Mirror', lowPrice: 1850, highPrice: 1950, unitCode: 'FTK' },
  }),

  p({
    slug: 'led-bathroom-mirror-profile',
    title: 'LED Bathroom Backlit Mirror — Large Rectangle | WoodenMax',
    description: 'Large rectangle backlit bathroom mirror — normal profile, touch-ready, V120 ₹850/sqft, V220 ₹950/sqft. Sizes 1.5×2.5 ft to 3×5 ft. WoodenMax.',
    h1: 'LED Bathroom Backlit Mirror — Large Rectangle Sizes',
    heroSub: 'Same backlit system as bedroom line but sized for bathrooms — standard aluminium profile (not imported oval line), connectors at all joints, touch-sensor ready.',
    image: 'led-bathroom-mirror-waterproof-profile.webp',
    imageAlt: 'Large rectangle LED backlit bathroom mirror | WoodenMax',
    calcMode: 'rect-led',
    defaultW: 2.5,
    defaultH: 4,
    calcIntro: RECT_SIZES_NOTE + ' V120 ₹850/sqft · V220 ₹950/sqft.',
    priceTable: {
      head: ['Size (ft)', 'Area', 'V120 approx', 'V220 approx'],
      rows: [
        ['1.5 × 2.5', '3.75 sq.ft', '₹3,188', '₹3,563'],
        ['2 × 3', '6 sq.ft', '₹5,100', '₹5,700'],
        ['2.5 × 4', '10 sq.ft', '₹8,500', '₹9,500'],
        ['3 × 5', '15 sq.ft', '₹12,750', '₹14,250'],
      ],
    },
    productSchema: { name: 'LED Bathroom Backlit Mirror', lowPrice: 850, highPrice: 950, unitCode: 'FTK' },
  }),

  p({
    slug: 'wardrobe-mirror-profile',
    title: 'Wooden Finish Round Wardrobe Mirror — Touch LED | WoodenMax',
    description: 'Wooden colour coating round wardrobe mirror with touch sensor. Sizes 2×2 to 4×4 ft. V120 with wooden coating. Live calculator. WoodenMax.',
    h1: 'Wooden Finish Round Mirror — Wardrobe & Sliding',
    heroSub: 'Wooden texture powder-coat on aluminium profile, round design, touch sensor integrated. Standard square sizes from 2×2 ft up to 4×4 ft for wardrobe shutters and dressing.',
    image: 'wooden-finish-mirror-profile-wardrobe-design.webp',
    imageAlt: 'Wooden finish round touch LED wardrobe mirror | WoodenMax',
    calcMode: 'wooden-round',
    priceTable: {
      head: ['Size (ft)', 'Profile finish', 'Notes'],
      rows: [
        ['2 × 2', 'Wooden coating + touch', 'Sliding wardrobe'],
        ['2.5 × 2.5', 'Wooden coating + touch', 'Popular shutter size'],
        ['3 × 3', 'Wooden coating + touch', 'Dressing / walk-in'],
        ['3.5 × 3.5', 'Wooden coating + touch', 'Master wardrobe'],
        ['4 × 4', 'Wooden coating + touch', 'Feature panel'],
      ],
    },
    bodySections: [{
      heading: 'Wardrobe application',
      list: [
        'Sliding wardrobe shutters — wooden finish matches laminate',
        'Fixed dressing panels with touch on/off',
        'Round face with square cut size (width × height bounding box)',
      ],
    }],
    faqs: [
      { q: 'What is the wooden coating?', a: '<strong>Wooden texture powder coat</strong> on aluminium profile — not real wood, maintenance-free finish.' },
      { q: 'How much extra is V220?', a: '<strong>+₹' + MIRROR_RATES_JSON.calculators['wooden-round'].v220Extra + '/sq.ft</strong> over the V120 wooden coating rate (select in calculator).' },
    ],
    productSchema: { name: 'Wooden Round Wardrobe Mirror', lowPrice: 1350, highPrice: 1450, unitCode: 'FTK' },
  }),

  p({
    slug: 'backlit-mirror-profile-price',
    title: 'Touch Backlit Mirror Price — Rectangle LED Mirror | WoodenMax',
    description: 'Rectangle touch backlit mirror — connectors at joints, V120 ₹850/sqft, V220 ₹950/sqft. Custom sizes. WoodenMax India.',
    h1: 'Touch Backlit Rectangle Mirror — Connectors & LED Options',
    heroSub: 'Imported-profile rectangle mirror with touch sensor, Saint-Gobain glass (max 5 mm), connectors at every joint, and single-strip V120 or V220 backlight.',
    image: 'backlit-led-mirror-profile-bedroom-design.webp',
    imageAlt: 'Touch backlit rectangle LED mirror bedroom | WoodenMax',
    calcMode: 'backlit-touch',
    calcIntro: RECT_SIZES_NOTE + ' Calculator: width × height · V120 ₹850/sqft · V220 ₹950/sqft.',
    priceTable: {
      head: ['LED strip', 'Supply rate/sq.ft', 'Typical use'],
      rows: [
        ['V120 single', '₹850', 'Bedroom vanity'],
        ['V220 premium', '₹950', 'Brighter bath / dressing'],
        ['Touch sensor', 'Integrated', 'Dim / on-off on glass'],
        ['Connectors', 'All joints', 'Imported profile system'],
      ],
    },
    bodySections: [{
      heading: 'Specification',
      list: [
        'Touch sensor integrated on mirror glass',
        'Connectors used at all profile joints',
        'Saint-Gobain mirror glass (non-toughened), max 5 mm in this profile',
        'Custom rectangle sizes beyond standard four presets',
      ],
    }],
    productSchema: { name: 'Touch Backlit Mirror', lowPrice: 850, highPrice: 950, unitCode: 'FTK' },
  }),

  p({
    slug: 'round-mirror-profile',
    title: 'Round Slim Profile Touch LED Mirror Price | WoodenMax',
    description: 'Round touch LED mirror with slim aluminium profile — same line as standard round +₹100/sq.ft. Live calculator. WoodenMax India.',
    h1: 'Round Slim Profile — Touch LED Mirror',
    heroSub: 'Same round touch design as our standard line but with a slimmer aluminium profile face — priced +₹100/sq.ft over the standard round rate.',
    image: 'round-led-mirror-profile-bathroom-design.webp',
    imageAlt: 'Round slim profile touch LED mirror bathroom | WoodenMax',
    calcMode: 'round-slim',
    priceTable: {
      head: ['Line', 'Profile', 'Vs standard round'],
      rows: [
        ['Standard round touch', 'Regular face width', 'Base line'],
        ['Slim round (this page)', 'Narrow profile face', '+₹100/sq.ft'],
        ['Sizes', '2×2 – 4×4 ft', 'Preset or custom'],
      ],
    },
    bodySections: [{
      heading: 'When to choose slim profile',
      list: [
        'Minimal frame look on bathroom wall',
        'Match slim shower partition lines',
        'Same touch, driver & LED options as standard round',
      ],
    }],
    productSchema: { name: 'Round Slim Touch Mirror', lowPrice: 750, highPrice: 850, unitCode: 'FTK' },
  }),

  p({
    slug: 'rectangular-mirror-profile',
    title: 'Rectangular Touch LED Mirror — Square & Rectangle | WoodenMax',
    description: 'Rectangular or square touch LED mirror — same rates as standard round line. V120/V220, 3A touch. Live calculator. WoodenMax.',
    h1: 'Rectangular & Square Touch LED Mirror',
    heroSub: 'Rect / square face design with the same hardware stack and pricing as our standard round touch mirror — ideal for vanity, bath and full-height panels.',
    image: 'rectangular-backlit-mirror-profile-india.webp',
    imageAlt: 'Rectangular square touch LED mirror profile | WoodenMax',
    calcMode: 'square-touch',
    defaultW: 2,
    defaultH: 3,
    priceTable: {
      head: ['Shape', 'Standard sizes', 'Same rate as'],
      rows: [
        ['Square', '2×2 – 4×4 ft', 'Round touch line'],
        ['Rectangle', 'Custom W×H', 'Round touch line'],
        ['Profile', 'Standard aluminium', 'Not slim line'],
      ],
    },
    bodySections: [{
      heading: 'Rectangle vs round pricing',
      body: '<p>Calculator uses <strong>width × height</strong> in feet (billable sq.ft). Rate band matches <a href="touch-sensor-mirror-profile">round touch mirror</a> — for slim profile see <a href="round-mirror-profile">round slim page</a>.</p>',
    }],
    productSchema: { name: 'Rectangular Touch LED Mirror', lowPrice: 650, highPrice: 750, unitCode: 'FTK' },
  }),

  p({
    slug: 'mirror-profile-price-per-foot',
    title: 'Custom Beveled Mirror Price — Glass Only & Add-On Profile/LED | WoodenMax',
    description: 'Customised beveled mirror ₹850/sqft (glass only). Add profile +₹250/sqft, LED V120 +₹120, V220 +₹200. WoodenMax.',
    h1: 'Custom Beveled Mirror — Glass, Profile & LED Add-Ons',
    heroSub: 'This design is beveling-focused — base rate is glass with bevel finish only. Optionally add imported profile (+₹250/sqft) and LED strips (V120 +₹120/sqft, V220 +₹200/sqft).',
    image: 'aluminium-mirror-profile-price-per-foot-india.webp',
    imageAlt: 'Custom beveled mirror glass with optional profile and LED | WoodenMax',
    calcMode: 'bevel-modular',
    calcIntro: 'Base = beveling only ₹850/sqft. Tick add-ons for profile and/or LED tiers.',
    priceTable: {
      head: ['Component', 'Add to billable sq.ft'],
      rows: [
        ['Beveled glass (base)', '₹850 / sq.ft'],
        ['+ Imported profile', '+ ₹250 / sq.ft'],
        ['+ LED V120', '+ ₹120 / sq.ft'],
        ['+ LED V220', '+ ₹200 / sq.ft'],
      ],
    },
    productSchema: { name: 'Custom Beveled Mirror', lowPrice: 850, highPrice: 1320, unitCode: 'FTK' },
  }),

  p({
    slug: 'custom-mirror-profile',
    title: 'Custom Height Mirror Profile — Up to 7 ft | WoodenMax',
    description: 'Custom mirror profile height up to 7 ft, min width 2 ft. V120 ₹1,750/sqft, V220 ₹1,900/sqft. Same LED options. WoodenMax.',
    h1: 'Custom Mirror Profile — Up to 7 ft Height, Min 2 ft Width',
    heroSub: 'Same imported profile family and V120/V220 LED as our standard backlit line — built to your drawing with min width 2 ft and height up to 7 ft.',
    image: 'custom-shape-led-mirror-profile-design.webp',
    imageAlt: 'Custom height LED mirror profile up to 7 feet | WoodenMax',
    calcMode: 'custom-rect-led',
    defaultH: 5,
    calcIntro: 'Min width 2 ft · max height 7 ft. V120 ₹1,750/sqft · V220 ₹1,900/sqft.',
    priceTable: {
      head: ['LED', 'Rate/sq.ft', 'Limit'],
      rows: [
        ['V120', '₹1,750', 'Height ≤ 7 ft'],
        ['V220', '₹1,900', 'V120 + ₹150'],
        ['Min width', '2 ft', 'Custom length OK'],
      ],
    },
    bodySections: [{
      heading: 'Custom fabrication',
      list: [
        'Same profile & LED options as standard rectangle line',
        'Ideal for tall vanity, wardrobe or foyer feature walls',
        'Imported machining: etching, banding, precision cutting',
      ],
    }],
    productSchema: { name: 'Custom Height Mirror Profile', lowPrice: 1750, highPrice: 1900, unitCode: 'FTK' },
  }),

  p({
    slug: 'aluminium-mirror-frame-designs',
    title: 'Black Oval Imported Profile Mirror — Motion Sensor | WoodenMax',
    description: 'Black imported profile oval mirror, vertical pattern, motion sensor, Saint-Gobain glass max 5mm. V120 ₹1,050/sqft, V220 ₹1,150. Packing ₹500/pc.',
    h1: 'Black Oval Mirror — Imported Profile, Motion Sensor & Vertical Pattern',
    heroSub: 'Matt black imported aluminium profile in oval form with vertical line pattern, motion sensor, Saint-Gobain mirror glass (without toughening, max 5 mm thickness). Etching, banding & cutting on imported machines.',
    image: 'matt-black-aluminium-mirror-frame-profile.webp',
    imageAlt: 'Black oval imported profile mirror motion sensor vertical pattern | WoodenMax',
    calcMode: 'imported-motion',
    calcIntro: RECT_SIZES_NOTE + ' V120 ₹1,050/sqft · V220 ₹1,150/sqft · packing ₹500/pc optional.',
    priceTable: {
      head: ['Item', 'Detail', 'Rate'],
      rows: [
        ['Profile', 'Imported black, oval vertical pattern', 'Included'],
        ['Glass', 'Saint-Gobain, max 5 mm', 'Included'],
        ['Sensor', 'Motion sensor', 'Included in supply rate'],
        ['V120 LED', 'Per sq.ft', '₹1,050'],
        ['V220 LED', 'Per sq.ft', '₹1,150'],
        ['Packing', 'Per piece', '₹500 extra'],
      ],
    },
    bodySections: [{
      heading: 'Standard rectangle sizes (ideal)',
      list: [
        '1.5 × 2.5 ft · 2 × 3 ft · 2.5 × 4 ft · 3 × 5 ft',
        'Custom width × height also fabricated',
        'All machining — etching, banding, cutting — on imported equipment',
      ],
    }],
    faqs: [
      { q: 'Is the glass toughened?', a: 'This line uses Saint-Gobain glass <strong>without toughening</strong>; maximum <strong>5 mm</strong> thickness in this profile.' },
      { q: 'What is the packing charge?', a: '₹' + MIRROR_RATES_JSON.hardware.packingPerPiece + ' per piece extra — export-grade safe packing for dispatch.' },
    ],
    productSchema: { name: 'Black Oval Imported Profile Mirror', lowPrice: 1050, highPrice: 1150, unitCode: 'FTK' },
  }),

  p({
    slug: 'led-mirror-profile-delhi',
    title: 'D-Type Half Round LED Mirror Price | WoodenMax',
    description: 'D-type half-round LED mirror — 2 connectors with banding, V120 ₹950/sqft, V220 ₹1,050/sqft. Supply Delhi NCR & pan-India.',
    h1: 'D-Type Half Round LED Mirror — 2 Connectors & Banding',
    heroSub: 'Half-round (semicircle) mirror with imported profile, two connector joints with banding, Saint-Gobain glass and V120/V220 backlight. Also supplied to Delhi NCR projects.',
    image: 'led-mirror-profile-installation-hyderabad.webp',
    imageAlt: 'D-type half round LED mirror installation | WoodenMax',
    calcMode: 'half-round',
    calcConfigExtras: { shapeLabel: 'D-type half-round' },
    defaultW: 2,
    defaultH: 2,
    calcIntro: 'Bounding width × height in feet. V120 ₹950/sqft · V220 ₹1,050/sqft (+₹100).',
    priceTable: {
      head: ['Feature', 'Specification'],
      rows: [
        ['Shape', 'D-type — half round (semicircle)'],
        ['Joints', '2 connectors with banding'],
        ['V120', '₹950 / sq.ft'],
        ['V220', '₹1,050 / sq.ft'],
        ['Delhi NCR install', 'Available on request'],
      ],
    },
    bodySections: [{
      heading: 'Delhi NCR supply',
      body: '<p>WoodenMax supplies and installs across <strong>Gurgaon, Noida, Faridabad, Ghaziabad & Delhi</strong>. Factory fabrication from Hyderabad; site team for NCR mounting.</p>',
    }],
    productSchema: { name: 'D-Type Half Round LED Mirror', lowPrice: 950, highPrice: 1050, unitCode: 'FTK' },
  }),

  p({
    slug: 'led-mirror-profile-hyderabad',
    title: 'LED Mirror Profile Price Hyderabad — Aluminium Mirror Frame | WoodenMax',
    description: 'LED mirror profile Hyderabad factory direct ₹720–1,850/ft. Same-week fabrication for standard sizes.',
    h1: 'LED Mirror Profile Hyderabad — Supply & Installation',
    heroSub: 'Factory-direct LED and plain mirror profiles from our Aaghapura plant — fastest turnaround for Telangana villas, apartments and hotel bath packages.',
    image: 'led-mirror-profile-installation-hyderabad.webp',
    imageAlt: 'LED mirror profile installation Hyderabad | WoodenMax factory',
    calcTypes: [
      { label: 'LED profile Hyderabad', min: 720, max: 1850 },
    ],
    bodySections: [
      {
        heading: 'Hyderabad factory advantage',
        body: '<p>Primary fabrication at our <strong>Aaghapura, Nampally</strong> facility — faster lead times and direct QC for Hyderabad and Telangana projects.</p>',
      },
    ],
    productSchema: { name: 'LED Mirror Profile Hyderabad', lowPrice: 720, highPrice: 1850, unitCode: 'FOT' },
  }),
];

const MIRROR_LINK_MAP = {
  'round-mirror-profile': [
    { href: '/products/mirror-profiles/touch-sensor-mirror-profile', title: 'Standard round touch', desc: 'Base line' },
    { href: '/products/mirror-profiles/rectangular-mirror-profile', title: 'Rect / square touch', desc: 'Same rates' },
  ],
  'rectangular-mirror-profile': [
    { href: '/products/mirror-profiles/touch-sensor-mirror-profile', title: 'Round touch line', desc: '2×2 – 4×4 ft' },
    { href: '/products/mirror-profiles/backlit-mirror-profile-price', title: 'Backlit rectangle', desc: 'Imported profile' },
  ],
  'backlit-mirror-profile-price': [
    { href: '/products/mirror-profiles/led-bathroom-mirror-profile', title: 'LED bathroom mirror', desc: 'Waterproof line' },
    { href: '/products/mirror-profiles/rectangular-mirror-profile', title: 'Rect touch mirror', desc: 'Standard profile' },
  ],
  'custom-mirror-profile': [
    { href: '/products/mirror-profiles/motion-sensor-mirror-profile', title: 'Luxury motion mirror', desc: 'Dual glass' },
    { href: '/products/mirror-profiles/mirror-profile-price-per-foot', title: 'Rate list per foot', desc: 'All lines' },
  ],
  'aluminium-mirror-frame-designs': [
    { href: '/products/mirror-profiles/motion-sensor-mirror-profile', title: 'Motion luxury oval', desc: 'Imported profile' },
    { href: '/products/mirror-profiles/mirror-profile-without-led', title: 'Plain frame only', desc: 'No LED' },
  ],
  'touch-sensor-mirror-profile': [
    { href: '/products/mirror-profiles/round-mirror-profile', title: 'Slim round profile', desc: '+₹100/sq.ft' },
    { href: '/products/mirror-profiles/rectangular-mirror-profile', title: 'Rect touch mirror', desc: 'Same hardware' },
    { href: '/products/mirror-profiles/led-bathroom-mirror-profile', title: 'Bathroom backlit', desc: 'Large rectangle' },
  ],
  'motion-sensor-mirror-profile': [
    { href: '/products/mirror-profiles/touch-sensor-mirror-profile', title: 'Touch round line', desc: 'Standard profile' },
    { href: '/products/mirror-profiles/backlit-mirror-profile-price', title: 'Touch backlit rect', desc: 'Bedroom vanity' },
    { href: '/products/mirror-profiles/custom-mirror-profile', title: 'Custom height', desc: 'Up to 7 ft' },
  ],
  'led-bathroom-mirror-profile': [
    { href: '/products/mirror-profiles/backlit-mirror-profile-price', title: 'Touch backlit', desc: 'Imported profile' },
    { href: '/products/mirror-profiles/mirror-profile-without-led', title: 'Frame only', desc: 'No LED' },
  ],
  'mirror-profile-without-led': [
    { href: '/products/mirror-profiles/led-mirror-profile-price', title: 'C-type LED mirror', desc: 'Half-round+' },
    { href: '/products/mirror-profiles/aluminium-mirror-frame-designs', title: 'Black oval imported', desc: 'Motion sensor' },
  ],
  'led-mirror-profile-price': [
    { href: '/products/mirror-profiles/led-mirror-profile-delhi', title: 'D-type half-round', desc: 'Delhi supply' },
    { href: '/products/mirror-profiles/backlit-mirror-profile-price', title: 'Rectangle touch', desc: 'V120/V220' },
  ],
  'wardrobe-mirror-profile': [
    { href: '/products/mirror-profiles/touch-sensor-mirror-profile', title: 'Standard round touch', desc: 'Non-wooden coat' },
    { href: '/products/metal-louvers/wooden-finish-aluminium-louvers', title: 'Wooden facade louvers', desc: 'Match elevation' },
  ],
  'mirror-profile-price-per-foot': [
    { href: '/products/mirror-profiles/custom-mirror-profile', title: 'Custom height LED', desc: 'Up to 7 ft' },
    { href: '/products/mirror-profiles/motion-sensor-mirror-profile', title: 'Luxury dual glass', desc: 'Motion sensor' },
  ],
  'led-mirror-profile-delhi': [
    { href: '/products/mirror-profiles/led-mirror-profile-hyderabad', title: 'Hyderabad factory', desc: 'Fabrication' },
    { href: '/city/delhi', title: 'Delhi city page', desc: 'All products' },
  ],
  'led-mirror-profile-hyderabad': [
    { href: '/about/factory-tour-hyderabad', title: 'Factory tour', desc: 'See production' },
    { href: '/products/mirror-profiles/led-mirror-profile-delhi', title: 'Delhi NCR supply', desc: 'D-type mirror' },
  ],
};

pages.forEach(function (pg) {
  if (pg.isHub) return;
  var extra = MIRROR_LINK_MAP[pg.slug] || [];
  pg.internalLinks = [
    { href: '/products/mirror-profiles/', title: 'Mirror profiles hub', desc: 'All 15 pages' },
  ].concat(extra).concat([
    { href: '/products/mirror-profiles/touch-sensor-mirror-profile', title: 'Round touch mirror', desc: 'Live calculator' },
    { href: '/products/mirror-profiles/motion-sensor-mirror-profile', title: 'Luxury motion mirror', desc: 'Dual glass' },
    { href: '/products/mirror-profiles/mirror-profile-price-per-foot', title: 'Bevel modular', desc: 'Glass + add-ons' },
    { href: '/products/shower-partitions', title: 'Shower partitions', desc: 'Pair with bath glass' },
    { href: '/products/aluminium-windows', title: 'Aluminium windows', desc: 'Match bath suite' },
    { href: '/products/metal-louvers', title: 'Metal louvers', desc: 'Facade & bath vents' },
    { href: '/contact?intent=mirror-quote', title: 'Formal quote', desc: 'Free site visit' },
  ]).filter(function (l, i, arr) {
    var dup = arr.findIndex(function (x) { return x.href === l.href; }) !== i;
    var self = l.href.indexOf('/' + pg.slug) !== -1;
    return !dup && !self;
  });
});

module.exports = { pages, ALL_CHILD_SLUGS };
