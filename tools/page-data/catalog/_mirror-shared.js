/** Shared tables, presets & copy for mirror profile SEO pages */

const SQUARE_PRESETS = [[2, 2], [2.5, 2.5], [3, 3], [3.5, 3.5], [4, 4]];

const MIRROR_HARDWARE_TABLE = {
  head: ['Component', 'Specification', 'Warranty'],
  rows: [
    ['Touch sensor (standard)', '3A capacitive', '1 year'],
    ['Touch sensor (upgrade)', '5A capacitive', '1 year'],
    ['LED driver (standard)', '5A', '1 year'],
    ['LED driver (upgrade)', '7A or 10A', '1 year'],
    ['LED strip', 'V120 or V220', '1 year'],
    ['Mirror glass', 'Saint-Gobain / as per line', 'Transit cover at dispatch'],
    ['Aluminium profile', 'Imported or standard line', '10 years manufacturing'],
  ],
};

const MIRROR_LED_COMPARISON = {
  head: ['Feature', 'V120', 'V220'],
  rows: [
    ['Brightness', 'Standard glow', 'Brighter / premium bath'],
    ['Typical use', 'Bedroom, wardrobe', 'Bathroom, dressing'],
    ['Power draw', 'Lower', 'Moderate'],
    ['Best with driver', '5A standard', '7A if large mirror'],
  ],
};

const MIRROR_POLICY_FAQ = [
  { q: 'What is the hardware warranty?', a: 'Touch sensor, LED driver and LED strip carry <strong>1 year</strong> warranty. Profile manufacturing defects are covered up to 10 years (line dependent).' },
  { q: 'Are packing and transport charges included?', a: '<strong>Packing and transit</strong> are quoted separately after order confirmation — safe crate or foam packing based on mirror size.' },
  { q: 'How long until dispatch?', a: 'Within <strong>7 working days</strong> after order confirmation and advance payment (once drawings are approved).' },
  { q: 'Is GST included in the calculator?', a: 'Calculator amounts are <strong>ex-GST</strong>. GST 18% is added on the invoice.' },
];

const MIRROR_CALC_INTRO = 'Select size, qty, profile colour, mirror glass brand, LED, touch and driver — the per-piece amount updates live. Submit the form or WhatsApp for a formal quote (GST, packing and transit confirmed separately).';

const MIRROR_PROFILE_COLORS = [
  { id: 'matt-black', label: 'Matt Black', premium: false, fill: '#232323' },
  { id: 'matt-grey', label: 'Matt Grey', premium: false, fill: '#8a9199' },
  { id: 'matt-gold', label: 'Matt Gold', premium: false, fill: '#d4af37' },
  { id: 'brush-gold', label: 'Brush Gold', premium: true, fill: '#b8860b' },
  { id: 'rose-gold', label: 'Rose Gold', premium: true, fill: '#c9957a' },
];

const MIRROR_PREMIUM_COLOR_PER_SQFT = 45;

const MIRROR_GLASS_BRANDS = [
  { id: 'saint-gobain', label: 'Saint Gobain' },
  { id: 'gold-plus', label: 'Gold Plus' },
];

const MIRROR_EEAT = {
  heading: 'Why designers trust WoodenMax for mirror profiles',
  body: '<p>WoodenMax is a <strong>fabricator-installer</strong>, not a trader — we machine aluminium profiles, integrate LED drivers and sensors, and deliver ready-to-hang mirror sets. Rates on this page match our live calculators used on 12,500+ residential and hospitality projects across India.</p>',
  subsections: [
    {
      h3: 'Experience you can verify',
      body: '<p>Factory at <strong>Aaghapura, Hyderabad</strong> with CNC cutting, imported profile banding and in-house QC. Site teams in Delhi NCR and Jaipur for measurement and installation. Case studies and factory tours available on request.</p>',
    },
    {
      h3: 'Luxury and standard lines',
      body: '<p>From ₹450/ft plain frames to <strong>dual-glass bevelled luxury mirrors</strong> with motion sensors — one vendor for drawing, fabrication, packing and warranty. Calculator amounts are ex-GST; formal BOQ confirms packing and transit.</p>',
    },
  ],
  links: [
    { href: '/about/manufacturing-process', label: 'How we manufacture' },
    { href: '/about/quality-testing-process', label: 'QC process' },
    { href: '/about/factory-tour-hyderabad', label: 'Factory tour' },
    { href: '/products/mirror-profiles/', label: 'All mirror calculators' },
  ],
};

const MIRROR_LUXURY_NOTE = '<p class="cluster-eyebrow">Luxury interior line</p><p>This product sits in our <strong>premium mirror portfolio</strong> — imported profiles, Saint-Gobain glass options, motion/touch sensors and white-glove packing. Ideal for master bathrooms, boutique hotels and high-end villa dressing rooms where finish and sensor reliability matter as much as price.</p>';

const MIRROR_RATE_COMPARISON = {
  head: ['Line', 'Price band', 'Typical project'],
  rows: [
    ['Plain aluminium frame', '₹450 – ₹820/ft', 'Budget bath, rental'],
    ['LED backlit profile', '₹720 – ₹1,280/ft', 'Modern homes'],
    ['Premium / imported LED', '₹950 – ₹1,850/sq.ft', 'Luxury bath and foyer'],
    ['Touch sensor (unit)', '₹8,500 – ₹18,000', 'Smart dressing'],
    ['Motion luxury glass', '₹1,850+/sq.ft', 'Boutique and villa'],
  ],
};

module.exports = {
  SQUARE_PRESETS,
  MIRROR_HARDWARE_TABLE,
  MIRROR_LED_COMPARISON,
  MIRROR_POLICY_FAQ,
  MIRROR_CALC_INTRO,
  MIRROR_PROFILE_COLORS,
  MIRROR_PREMIUM_COLOR_PER_SQFT,
  MIRROR_GLASS_BRANDS,
  MIRROR_EEAT,
  MIRROR_LUXURY_NOTE,
  MIRROR_RATE_COMPARISON,
};
