const H = require('./_helpers');
const { CITIES, LOUVER_RATES } = H;
const SHARED = require('./_louver-shared');
const {
 LOUVER_PROFILE_COMPARISON,
 LOUVER_FINISH_COMPARISON,
 LOUVER_SPECS_TABLE,
 LOUVER_POLICY_FAQ,
 LOUVER_CALC_INTRO,
 LOUVER_EEAT,
 LOUVER_CALC_PRODUCT_LINKS,
} = SHARED;

const SILO = 'metal-louvers';
const OUT_DIR = 'products/metal-louvers';
const BC_PARENT = { label: 'Metal louvers', href: '/products/metal-louvers/' };

function p(cfg) {
 var base = {
 silo: SILO,
 outDir: OUT_DIR,
 schemaType: 'Product',
 unit: 'sqft',
 cities: CITIES,
 calcIntro: LOUVER_CALC_INTRO,
 eeatBlock: LOUVER_EEAT,
 calcProductLinks: LOUVER_CALC_PRODUCT_LINKS,
 breadcrumb: [
 { label: 'Home', href: '/' },
 { label: 'Products', href: '/catalog' },
 { label: 'Louvers', href: '/products/metal-louvers.html' },
 BC_PARENT,
 { label: cfg.breadcrumbLabel || cfg.h1 },
 ],
 canonical: '/products/metal-louvers' + (cfg.slug === 'index' ? '/' : '/' + cfg.slug),
 out: OUT_DIR + '/' + (cfg.slug === 'index' ? 'index.html' : cfg.slug + '.html'),
 };
 var out = Object.assign(base, cfg);
 out.faqs = (cfg.faqs || []).concat(LOUVER_POLICY_FAQ);
 if (!out.isHub && !cfg.skipDefaultBody) {
 if (!out.bodySections) out.bodySections = [];
 if (!cfg.skipSpecs) {
 out.specsTable = cfg.specsTable || LOUVER_SPECS_TABLE;
 out.bodySections.unshift({
 heading: 'What is included in ₹/sqft',
 body: '<p>Typical supply includes profiles, brackets, powder coat, cutting, packing and installation labour. MS sub-frame, scaffolding or difficult access may be quoted separately after site visit.</p>',
 subsections: [
 { h3: 'Profile & finish', body: '<p>Blade size, gap and finish are locked on the signed drawing. Wooden texture, matt black and plain colours use UV-stable polyester or PVDF systems.</p>' },
 { h3: 'Site measurement', body: '<p>Site measurement in <strong>Hyderabad, Delhi NCR & Jaipur</strong> for projects above minimum area. Other cities — video survey or architect drawing accepted.</p>' },
 ],
 });
 }
 }
 return out;
}

function hubLinks() {
 return [
 { slug: 'aluminium-facade-louver-price', title: 'Facade louver price', desc: '₹580–820/sqft', img: 'aluminium-facade-louver-75x38mm-wooden-finish-delhi.webp' },
 { slug: 'ventilation-louver-price-per-sqft', title: 'Ventilation louver', desc: '₹450–620/sqft', img: 'fixed-aluminium-luxury-louver-ventilation-panel.webp' },
 { slug: 'fixed-vs-motorized-louver', title: 'Fixed vs motorized', desc: 'Compare', img: 'aluminium-louver-curved-architectural-design.webp' },
 { slug: 'motorized-louver-price-india', title: 'Motorized louver', desc: '₹1,100–1,450/sqft', img: 'Aluminium-elevation-twisted-louvers.webp' },
 { slug: 'perforated-aluminium-panel-price', title: 'Perforated panel', desc: '₹620–880/sqft', img: 'black-powder-coat-aluminium-louver-facade.webp' },
 { slug: 'aluminium-louver-design-building', title: 'Building designs', desc: '30+ ideas', img: 'commercial-building-aluminium-louver-installation.webp' },
 { slug: 'louver-vs-acp-cladding', title: 'Louver vs ACP', desc: 'Comparison', img: 'building-exterior-aluminium-louver-cladding-india.webp' },
 { slug: 'louver-installation-guide', title: 'Installation guide', desc: 'Process & cost', img: 'aluminium-louver-installation-ncr-project.webp' },
 { slug: 'louver-price-delhi', title: 'Delhi NCR price', desc: 'Supply & install', img: 'aluminium-louver-installation-ncr-project.webp' },
 { slug: 'louver-price-hyderabad', title: 'Hyderabad price', desc: 'Facade fabricator', img: 'residential-aluminium-facade-louver-hyderabad.webp' },
 { slug: 'louver-price-jaipur', title: 'Jaipur price', desc: 'Ventilation & facade', img: 'wooden-finish-aluminium-louver-building-exterior.webp' },
 { slug: 'aluminium-louvre-75x38mm-price', title: '75×38 mm profile', desc: 'Specs & rate', img: 'aluminium-louver-75x38mm-profile-close-up.webp' },
 { slug: 'aluminium-louvre-100x50mm-price', title: '100×50 mm profile', desc: 'Heavy duty', img: 'elevation-louvers-rafters-3d.webp' },
 { slug: 'commercial-building-louvers', title: 'Commercial bulk', desc: 'Volume discounts', img: 'commercial-building-aluminium-louver-installation.webp' },
 ];
}

const LINK_MAP = {
 'aluminium-facade-louver-price': [
 { href: '/products/metal-louvers/aluminium-louvre-75x38mm-price', title: '75×38 mm profile', desc: 'Most popular facade size' },
 { href: '/products/metal-louvers/ventilation-louver-price-per-sqft', title: 'Ventilation louver', desc: 'Duct & plant rooms' },
 { href: '/products/metal-louvers/louver-price-delhi', title: 'Delhi NCR rates', desc: 'NCR install team' },
 ],
 'ventilation-louver-price-per-sqft': [
 { href: '/products/metal-louvers/aluminium-facade-louver-price', title: 'Facade louver', desc: 'Building exterior' },
 { href: '/products/metal-louvers/commercial-building-louvers', title: 'Commercial bulk', desc: 'Volume pricing' },
 ],
 'fixed-vs-motorized-louver': [
 { href: '/products/metal-louvers/motorized-louver-price-india', title: 'Motorized price', desc: '₹1,100–1,450/sqft' },
 { href: '/products/metal-louvers/aluminium-facade-louver-price', title: 'Fixed facade', desc: '₹580–820/sqft' },
 ],
 'motorized-louver-price-india': [
 { href: '/products/metal-louvers/fixed-vs-motorized-louver', title: 'Fixed vs motorized', desc: 'Full comparison' },
 { href: '/products/metal-louvers/aluminium-louver-design-building', title: 'Design ideas', desc: 'Premium facades' },
 ],
 'perforated-aluminium-panel-price': [
 { href: '/products/metal-louvers/aluminium-facade-louver-price', title: 'Solid facade louver', desc: 'Blade screening' },
 { href: '/products/metal-louvers/louver-vs-acp-cladding', title: 'Louver vs ACP', desc: 'Material compare' },
 ],
 'aluminium-louver-design-building': [
 { href: '/products/metal-louvers/wooden-finish-aluminium-louvers.html', title: 'Wooden finish rafters', desc: 'Live calculator' },
 { href: '/products/metal-louvers/curved-architectural-louvers.html', title: 'Curved louvers', desc: 'Feature facades' },
 ],
 'louver-price-hyderabad': [
 { href: '/products/metal-louvers/aluminium-louvre-75x38mm-price', title: '75×38 profile', desc: 'Factory direct' },
 { href: '/about/factory-tour-hyderabad', title: 'Factory tour', desc: 'See fabrication' },
 ],
 'louver-price-delhi': [
 { href: '/products/metal-louvers/louver-installation-guide', title: 'Installation guide', desc: 'NCR process' },
 { href: '/products/metal-louvers/commercial-building-louvers', title: 'Commercial rates', desc: 'Bulk projects' },
 ],
};

const pages = [
 p({
 slug: 'index',
 isHub: true,
 skipDefaultBody: true,
 breadcrumbLabel: 'Louvers price hub',
 title: 'Aluminium Louver Price per Sqft India 2026 — Facade, Ventilation & Motorized | WoodenMax',
 description: 'Aluminium louver ₹450–1,450/sqft installed. Facade, ventilation, wooden finish, motorized & perforated panels. WoodenMax fabricates in Hyderabad — site visits in Delhi, Jaipur, Hyderabad.',
 h1: 'Aluminium Louvers — Price, Types & Installation | WoodenMax Fabricator',
 heroSub: 'Architectural aluminium louvers for building facades, ventilation panels and premium motorized systems. Transparent ₹/sqft rates from ₹450 to ₹1,450 per square foot — fabrication + install by WoodenMax.',
 image: 'building-exterior-aluminium-louver-cladding-india.webp',
 imageAlt: 'Building exterior aluminium louver cladding India price per sqft | WoodenMax',
 imageCaption: 'Aluminium facade louver cladding — indicative rates updated 2026',
 calcTypes: [
 { label: 'Standard fixed ventilation', min: LOUVER_RATES.standard.min, max: LOUVER_RATES.standard.max },
 { label: 'Architectural facade', min: LOUVER_RATES.facade.min, max: LOUVER_RATES.facade.max },
 { label: 'Wooden finish premium', min: LOUVER_RATES.wood.min, max: LOUVER_RATES.wood.max },
 { label: 'Motorized louver', min: LOUVER_RATES.motorized.min, max: LOUVER_RATES.motorized.max },
 ],
 priceTableTitle: 'Aluminium louver price list 2026 (₹/sqft)',
 priceTable: {
 head: ['Louver type', 'Price/sqft', 'Best use'],
 rows: [
 ['Standard fixed ventilation', '₹450 – ₹580', 'Ducts, plant rooms'],
 ['Architectural facade', '₹580 – ₹820', 'Building exterior'],
 ['Wooden finish elevation', '₹680 – ₹920', 'Villas & resorts'],
 ['Perforated panel', '₹620 – ₹880', 'Decorative screen'],
 ['Motorized adjustable', '₹1,100 – ₹1,450', 'Premium sun control'],
 ],
 },
 comparisonTableTitle: 'Profile size comparison',
 comparisonTable: LOUVER_PROFILE_COMPARISON,
 bodySections: [
 {
 heading: 'Choose the right louver type',
 body: '<p>Not sure which page to open? Use this hub to compare rates, then jump to the dedicated guide or our <strong>live product calculators</strong> for item-wise BOQ.</p>',
 subsections: [
 { h3: 'Residential villas', body: '<p>Most villa elevations use <strong>75×38 mm</strong> or <strong>100×50 mm</strong> profiles with wooden texture or matt black. See <a href="aluminium-facade-louver-price.html">facade louver price</a> and <a href="wooden-finish-aluminium-louvers.html">wooden finish calculator</a>.</p>' },
 { h3: 'Commercial towers', body: '<p>Large facades qualify for bulk rates — <a href="commercial-building-louvers.html">commercial building louvers</a>. Fixed louvers are standard; motorized for premium HQ buildings.</p>' },
 { h3: 'Ventilation & plant rooms', body: '<p>Fixed luxury vent panels from <a href="ventilation-louver-price-per-sqft.html">₹450/sqft</a> — high airflow, clean finish.</p>' },
 ],
 },
 {
 heading: 'Live BOQ calculators',
 alt: true,
 body: '<p>These product pages have full calculators (profile, gap, brackets): <a href="wooden-finish-aluminium-louvers.html">wooden finish rafters</a>, <a href="curved-architectural-louvers.html">curved louvers</a>, <a href="ceiling-pergola-louvers.html">pergola louvers</a>, <a href="louver-canopy-facade.html">canopy louvers</a>.</p>',
 },
 ],
 faqs: [
 { q: 'What is the aluminium louver price per sqft?', a: 'Standard fixed ventilation louvers start from <strong>₹450/sqft</strong> and premium motorized systems go up to <strong>₹1,450/sqft</strong> including fabrication and installation in metro cities.' },
 { q: 'Do you supply wooden finish aluminium louvers?', a: 'Yes — UV-stable wood-texture powder coat on 6063-T6 profiles, a termite-free alternative to timber rafters. See <a href="wooden-finish-aluminium-louvers.html">wooden finish page</a>.' },
 { q: 'Which projects suit motorized louvers best?', a: 'Premium villas, corporate facades and sun-control where adjustable blades are required — <a href="motorized-louver-price-india.html">motorized price guide</a>.' },
 { q: 'How long does installation take?', a: '100–300 sqft facade: typically <strong>5–10 working days</strong> on site after profile delivery.' },
 ],
 hubLinks: hubLinks(),
 productSchema: { name: 'Aluminium Louvers', lowPrice: 450, highPrice: 1450, unitCode: 'FTK' },
 }),

 p({
 slug: 'aluminium-facade-louver-price',
 title: 'Aluminium Facade Louver Price per Sqft 2026 — Building Exterior | WoodenMax',
 description: 'Facade aluminium louver ₹580–820/sqft installed. Profiles 50×25 to 150×50 mm. Gap, finish & bracket BOQ. WoodenMax Delhi, Hyderabad, Jaipur.',
 h1: 'Aluminium Facade Louver — ₹580 to ₹820 per Sqft',
 heroSub: 'Horizontal and vertical facade screening with 6063-T6 aluminium blades — powder coat or wooden texture. Price includes fabrication, brackets and standard installation.',
 image: 'aluminium-facade-louver-75x38mm-wooden-finish-delhi.webp',
 imageAlt: 'Aluminium facade louver 75x38mm wooden finish Delhi price | WoodenMax',
 imageCaption: '75×38 mm wooden-finish facade louver — Delhi NCR project',
 calcTypes: [
 { label: '50×25 mm profile', min: 450, max: 580 },
 { label: '75×38 mm profile', min: 580, max: 750 },
 { label: '100×50 mm profile', min: 680, max: 820 },
 { label: '150×50 mm profile', min: 780, max: 950 },
 ],
 priceTableTitle: 'Facade louver rate by profile size',
 priceTable: {
 head: ['Profile size', 'Price/sqft', 'Gap', 'Wall'],
 rows: [
 ['50×25 mm', '₹450 – ₹580', '20 mm', '1.2 mm'],
 ['75×38 mm', '₹580 – ₹750', '25–38 mm', '1.2 mm'],
 ['100×50 mm', '₹680 – ₹820', '38–50 mm', '1.4 mm'],
 ['150×50 mm', '₹780 – ₹950', '50 mm', '1.6 mm'],
 ],
 },
 comparisonTableTitle: 'Finish options for facade',
 comparisonTable: LOUVER_FINISH_COMPARISON,
 bodySections: [
 {
 heading: 'Where facade louvers are used',
 subsections: [
 { h3: 'West & south sun control', body: '<p>Vertical or horizontal blades cut direct heat while keeping airflow — popular on villa front elevations and office curtain-wall zones.</p>' },
 { h3: 'Privacy without blocking air', body: '<p>Denser gaps (25 mm) for privacy; wider gaps (38–50 mm) for feature walls and parking facades.</p>' },
 ],
 },
 ],
 faqs: [
 { q: 'Which facade profile is most popular?', a: '<strong>75×38 mm</strong> — balance of span, weight and cost. Heavy villas often use <a href="aluminium-louvre-100x50mm-price.html">100×50 mm</a>.' },
 { q: 'Wooden finish facade louver rate?', a: 'Typically <strong>₹680–₹920/sqft</strong> depending on area and access — see wooden finish on <a href="wooden-finish-aluminium-louvers.html">live calculator</a>.' },
 ],
 productSchema: { name: 'Aluminium Facade Louver', lowPrice: 450, highPrice: 950, unitCode: 'FTK' },
 }),

 p({
 slug: 'ventilation-louver-price-per-sqft',
 title: 'Ventilation Louver Price per Sqft India 2026 — Aluminium Vent Panel | WoodenMax',
 description: 'Ventilation aluminium louver ₹450–620/sqft. Fixed panels for ducts, STP, plant rooms & parking. WoodenMax supply & install India.',
 h1: 'Ventilation Aluminium Louver — ₹450 to ₹620 per Sqft',
 heroSub: 'Fixed aluminium vent panels for high airflow — STP rooms, generator plinths, basement parking and facade vents. Luxury finish options for visible elevations.',
 image: 'fixed-aluminium-luxury-louver-ventilation-panel.webp',
 imageAlt: 'Fixed aluminium luxury louver ventilation panel price India | WoodenMax',
 priceTableTitle: 'Ventilation panel price bands',
 priceTable: {
 head: ['Panel type', 'Price/sqft', 'Application'],
 rows: [
 ['Standard vent', '₹450 – ₹520', 'Plant room, duct'],
 ['Luxury vent', '₹520 – ₹620', 'Visible facade vent'],
 ['With bird mesh', 'On request', 'Open terraces'],
 ],
 },
 comparisonTableTitle: 'Vent louver vs solid facade',
 comparisonTable: {
 head: ['Factor', 'Vent panel', 'Solid facade louver'],
 rows: [
 ['Airflow', 'High', 'Moderate (gap dependent)'],
 ['Price/sqft', '₹450 – ₹620', '₹580 – ₹820'],
 ['Visibility', 'Often hidden', 'Architectural feature'],
 ['Best for', 'MEP rooms', 'Elevation design'],
 ],
 },
 calcTypes: [
 { label: 'Standard vent panel', min: 450, max: 520 },
 { label: 'Luxury vent panel', min: 520, max: 620 },
 ],
 bodySections: [
 {
 heading: 'Ventilation louver applications',
 list: [
 'STP & pump room exhaust facades',
 'Generator and electrical plinth screening',
 'Basement ramp and parking airflow panels',
 'Kitchen & bathroom duct outlets (where specified)',
 ],
 subsections: [
 { h3: 'Standard vs luxury vent', body: '<p><strong>Standard</strong> panels use simpler profiles for hidden areas. <strong>Luxury</strong> lines match main building finish when vents face the street or pool deck.</p>' },
 ],
 },
 ],
 faqs: [
 { q: 'Is bird mesh included?', a: 'Optional — stainless mesh behind blades quoted per opening size.' },
 { q: 'Vent louver maintenance?', a: 'Wash with water yearly; aluminium does not rust like MS grills.' },
 ],
 productSchema: { name: 'Ventilation Aluminium Louver', lowPrice: 450, highPrice: 620, unitCode: 'FTK' },
 }),

 p({
 slug: 'fixed-vs-motorized-louver',
 title: 'Fixed vs Motorized Louver — Price & Comparison 2026 | WoodenMax',
 description: 'Fixed aluminium louver ₹450–820/sqft vs motorized ₹1,100–1,450/sqft. Maintenance, sun control & ROI compared by WoodenMax.',
 h1: 'Fixed vs Motorized Aluminium Louver — Complete Comparison',
 heroSub: 'Should you choose fixed architectural blades or motorized adjustable louvers? Compare price, maintenance, sun control and best project fit.',
 image: 'aluminium-louver-curved-architectural-design.webp',
 imageAlt: 'Fixed vs motorized aluminium louver comparison | WoodenMax',
 priceTableTitle: 'Fixed vs motorized — side by side',
 priceTable: {
 head: ['Feature', 'Fixed louver', 'Motorized louver'],
 rows: [
 ['Price/sqft', '₹450 – ₹820', '₹1,100 – ₹1,450'],
 ['Maintenance', 'Wash only', 'Motor service yearly'],
 ['Sun control', 'Fixed blade angle', 'Adjustable via remote/app'],
 ['Power', 'None', 'Electrical point required'],
 ['Best for', 'Most facades & vents', 'Premium HQ, villas'],
 ],
 },
 comparisonTable: LOUVER_PROFILE_COMPARISON,
 calcTypes: [
 { label: 'Fixed louver', min: 450, max: 820 },
 { label: 'Motorized louver', min: 1100, max: 1450 },
 ],
 bodySections: [
 {
 heading: 'When to choose fixed',
 body: '<p>Fixed louvers cover <strong>90% of Indian residential and commercial facades</strong> — lower cost, zero motor failure risk, and predictable maintenance. Ideal when blade angle is decided once on drawing.</p>',
 subsections: [
 { h3: 'When motorized is worth it', body: '<p>Motorized systems make sense for <strong>adjustable sun control</strong> on corporate HQs, premium villas and west-facing curtain walls where owners want seasonal angle changes. See <a href="motorized-louver-price-india.html">motorized price page</a>.</p>' },
 ],
 },
 ],
 faqs: [
 { q: 'How much more does a motorized louver cost?', a: 'Roughly <strong>40–70% higher</strong> than equivalent fixed facade area — motor, controller and cabling included in our ₹/sqft band.' },
 ],
 productSchema: { name: 'Fixed vs Motorized Louver', lowPrice: 450, highPrice: 1450, unitCode: 'FTK' },
 }),

 p({
 slug: 'motorized-louver-price-india',
 title: 'Motorized Aluminium Louver Price India 2026 — Electric Louvre | WoodenMax',
 description: 'Motorized aluminium louver ₹1,100–1,450/sqft with motor, controller & install. Premium sun-control facades. WoodenMax India.',
 h1: 'Motorized Louver Price — ₹1,100 to ₹1,450 per Sqft',
 heroSub: 'Electrically adjustable aluminium louvers for premium facades — motor, limit switches, remote/control panel and installation included in indicative rates.',
 image: 'Aluminium-elevation-twisted-louvers.webp',
 imageAlt: 'Motorized aluminium louver elevation India price | WoodenMax',
 priceTableTitle: 'Motorized system price bands',
 priceTable: {
 head: ['Tier', 'Price/sqft', 'Includes'],
 rows: [
 ['Standard motorized', '₹1,100 – ₹1,280', 'Motor + basic remote'],
 ['Premium motorized', '₹1,280 – ₹1,450', 'App/control panel options'],
 ['Annual service', 'On request', 'Motor lubrication & limits'],
 ],
 },
 calcTypes: [
 { label: 'Motorized standard', min: 1100, max: 1280 },
 { label: 'Motorized premium', min: 1280, max: 1450 },
 ],
 bodySections: [
 {
 heading: 'What is included',
 list: [
 '6063-T6 blade profiles and carriers',
 'Geared motor with end limits',
 'Control panel or remote (spec on BOQ)',
 'Fabrication, powder coat & site install',
 ],
 subsections: [
 { h3: 'Electrical requirement', body: '<p>Client provides power point near motor line — our team coordinates with your electrician for load and conduit.</p>' },
 ],
 },
 ],
 faqs: [
 { q: 'Motor warranty?', a: 'Motor & controller typically <strong>2 years</strong> manufacturing warranty when supplied by WoodenMax.' },
 { q: 'Are motorized louvers OK in rain?', a: 'Outdoor-rated motors with covered drives — blades designed for drainage; annual service recommended.' },
 ],
 productSchema: { name: 'Motorized Aluminium Louver', lowPrice: 1100, highPrice: 1450, unitCode: 'FTK' },
 }),

 p({
 slug: 'perforated-aluminium-panel-price',
 title: 'Perforated Aluminium Panel Price per Sqft India 2026 | WoodenMax',
 description: 'Perforated aluminium facade panel ₹620–880/sqft. Round, square & custom CNC patterns. Black, wood, anodized finishes. WoodenMax.',
 h1: 'Perforated Aluminium Panel — ₹620 to ₹880 per Sqft',
 heroSub: 'CNC perforated aluminium sheets for decorative facades, screens and feature walls — powder coated with custom hole patterns.',
 image: 'black-powder-coat-aluminium-louver-facade.webp',
 imageAlt: 'Perforated black powder coat aluminium panel facade | WoodenMax',
 priceTableTitle: 'Perforation pattern vs price',
 priceTable: {
 head: ['Perforation pattern', 'Price/sqft', 'Thickness'],
 rows: [
 ['Round holes 3 mm', '₹620 – ₹720', '1.5 mm'],
 ['Round holes 5 mm', '₹680 – ₹780', '1.5 mm'],
 ['Square pattern', '₹720 – ₹820', '2 mm'],
 ['Custom pattern', '₹780 – ₹880', 'Custom'],
 ],
 },
 comparisonTableTitle: 'Perforated panel vs blade louver',
 comparisonTable: {
 head: ['Factor', 'Perforated sheet', 'Blade louver'],
 rows: [
 ['Look', 'Flat decorative screen', '3D depth & shadow'],
 ['Ventilation', 'Hole % defined', 'Gap between blades'],
 ['Price/sqft', '₹620 – ₹880', '₹580 – ₹820'],
 ['Best for', 'Logos, patterns', 'Sun shading'],
 ],
 },
 calcTypes: [
 { label: 'Standard perforation', min: 620, max: 780 },
 { label: 'Custom pattern', min: 780, max: 880 },
 ],
 bodySections: [
 {
 heading: 'Perforated facade uses',
 subsections: [
 { h3: 'Feature walls & signage', body: '<p>Custom hole layouts for logos and geometric patterns — popular on retail and hospitality entries.</p>' },
 { h3: 'Combined with louvers', body: '<p>Many projects mix <a href="aluminium-facade-louver-price.html">blade louvers</a> on main elevation and perforated panels on ancillary blocks.</p>' },
 ],
 },
 ],
 faqs: [
 { q: 'How do I send a custom pattern drawing?', a: 'Send DWG/PDF with hole size, pitch and open area % — our CNC team confirms feasibility before quote.' },
 ],
 productSchema: { name: 'Perforated Aluminium Panel', lowPrice: 620, highPrice: 880, unitCode: 'FTK' },
 }),

 p({
 slug: 'aluminium-louver-design-building',
 title: 'Aluminium Louver Design for Building Exterior — 30+ Ideas & Price | WoodenMax',
 description: '30+ aluminium louver building exterior design ideas with ₹/sqft rates. Horizontal, vertical, curved, canopy & wooden finish. WoodenMax gallery.',
 h1: 'Aluminium Louver Designs — 30+ Building Exterior Ideas',
 heroSub: 'Inspiration gallery for architects and homeowners — horizontal screening, vertical sun blades, curved features, canopies and wooden-finish rafters with indicative pricing.',
 image: 'commercial-building-aluminium-louver-installation.webp',
 imageAlt: 'Commercial building aluminium louver installation design | WoodenMax',
 priceTableTitle: 'Design style vs indicative rate',
 priceTable: {
 head: ['Design style', 'Indicative ₹/sqft', 'Notes'],
 rows: [
 ['Horizontal screening', '₹580 – ₹750', '75×38 common'],
 ['Vertical sun blades', '₹580 – ₹820', 'West wall'],
 ['Curved feature', '₹720 – ₹980', 'Custom bending'],
 ['Canopy / entrance', '₹650 – ₹900', 'See canopy calc'],
 ['Wooden finish rafters', '₹680 – ₹920', 'Villa elevation'],
 ],
 },
 comparisonTable: LOUVER_FINISH_COMPARISON,
 bodySections: [
 {
 heading: 'Design categories',
 list: [
 'Horizontal facade screening on balconies',
 'Vertical sun blades on west-facing walls',
 'Curved architectural feature louvers',
 'Canopy & entrance sunshades',
 'Wooden-finish elevation rafters on villas',
 'Perforated feature panels at lobby',
 ],
 subsections: [
 { h3: 'Work with your architect', body: '<p>We review architect elevations, suggest profile sizes and gap, then issue a locked BOQ. Share PDF on <a href="././contact?intent=louver-quote">contact form</a>.</p>' },
 ],
 },
 ],
 calcTypes: [
 { label: 'Facade screening', min: 580, max: 820 },
 { label: 'Wooden finish elevation', min: 680, max: 920 },
 ],
 faqs: [
 { q: 'Do you offer 3D design support?', a: 'Yes — basic layout support on paid projects; architect drawing preferred for final fabrication.' },
 ],
 productSchema: { name: 'Aluminium Louver Building Designs', lowPrice: 450, highPrice: 1450, unitCode: 'FTK' },
 }),

 p({
 slug: 'louver-vs-acp-cladding',
 title: 'Louver vs ACP Cladding — Price, Ventilation & Which is Better? | WoodenMax',
 description: 'Aluminium louver vs ACP cladding compared — ₹/sqft, ventilation, maintenance, design. WoodenMax facade guide for architects.',
 h1: 'Aluminium Louver vs ACP Cladding — Complete Comparison',
 heroSub: 'ACP is cheaper per sqft but blocks airflow. Louvers cost more but ventilate and create depth. Compare both for your building exterior decision.',
 image: 'building-exterior-aluminium-louver-cladding-india.webp',
 imageAlt: 'Aluminium louver vs ACP cladding building exterior | WoodenMax',
 priceTableTitle: 'Louver vs ACP — feature comparison',
 priceTable: {
 head: ['Feature', 'Aluminium louver', 'ACP cladding'],
 rows: [
 ['Price/sqft', '₹450 – ₹920', '₹85 – ₹220'],
 ['Ventilation', 'Yes — airflow', 'No — sealed panel'],
 ['Depth / shadow', '3D blades', 'Flat panel'],
 ['Maintenance', 'Low — wash', 'Very low'],
 ['Best for', 'Screening, sun, vents', 'Full wrap cladding'],
 ],
 },
 calcTypes: [
 { label: 'Aluminium louver', min: 450, max: 920 },
 { label: 'ACP cladding (reference)', min: 85, max: 220 },
 ],
 bodySections: [
 {
 heading: 'Can you combine both?',
 body: '<p>Yes — many towers use <strong>ACP on main fields</strong> and <strong>louvers on spandrels, vents and feature zones</strong>. WoodenMax supplies both via partner ACP vendors when needed.</p>',
 subsections: [
 { h3: 'When louver wins', body: '<p>Plant rooms, parking vents, west sun, villa elevations needing wood look without termites — <a href="aluminium-facade-louver-price.html">facade louver rates</a>.</p>' },
 ],
 },
 ],
 faqs: [
 { q: 'What is cheaper than ACP?', a: 'ACP panel cladding is lower ₹/sqft but does not replace ventilated screening — compare total project goals, not a single number.' },
 ],
 productSchema: { name: 'Louver vs ACP Comparison', lowPrice: 450, highPrice: 920, unitCode: 'FTK' },
 }),

 p({
 slug: 'louver-installation-guide',
 title: 'Aluminium Louver Installation Guide — Process, Timeline & Cost | WoodenMax',
 description: 'Aluminium louver installation steps, timeline, tools & cost factors. WoodenMax NCR & Hyderabad installation teams.',
 h1: 'Aluminium Louver Installation — Step by Step Process & Cost',
 heroSub: 'How WoodenMax installs facade louvers — survey, fabrication, coating, bracket fixing, blade alignment and handover. Typical timelines for 100–500 sqft facades.',
 image: 'aluminium-louver-installation-ncr-project.webp',
 imageAlt: 'Aluminium louver installation NCR project | WoodenMax',
 priceTableTitle: 'Installation timeline guide',
 priceTable: {
 head: ['Facade area', 'Fabrication', 'Site install'],
 rows: [
 ['100–200 sqft', '10–14 days', '4–6 days'],
 ['200–500 sqft', '14–18 days', '6–10 days'],
 ['500+ sqft', '18–25 days', '10–15 days'],
 ],
 },
 bodySections: [
 {
 heading: 'Installation steps',
 list: [
 'Site survey & BOQ with gap/finish selection',
 'Fabrication of 6063-T6 profiles and brackets',
 'Powder coating / wooden texture finish',
 'Bracket fixing on MS or aluminium sub-frame',
 'Louver blade clipping and alignment',
 'Final QC and handover',
 ],
 subsections: [
 { h3: 'Sub-frame responsibility', body: '<p>If existing RCC/steel is not ready, we quote MS or aluminium sub-frame separately after inspection.</p>' },
 { h3: 'Safety & access', body: '<p>Scaffolding or boom lift for high facades — included or excluded per BOQ line item.</p>' },
 ],
 },
 ],
 calcTypes: [
 { label: 'Fixed louver installed', min: 450, max: 820 },
 { label: 'Motorized installed', min: 1100, max: 1450 },
 ],
 faqs: [
 { q: 'Is installation charged separately?', a: 'Standard install is in our ₹/sqft band for normal access. Difficult sites quoted separately.' },
 ],
 productSchema: { name: 'Aluminium Louver Installation', lowPrice: 450, highPrice: 1450, unitCode: 'FTK' },
 }),

 p({
 slug: 'louver-price-delhi',
 title: 'Aluminium Louver Price Delhi NCR 2026 — Supply & Installation | WoodenMax',
 description: 'Aluminium louver Delhi NCR ₹450–1,450/sqft. Gurgaon, Noida, Faridabad install. WoodenMax NCR facade team.',
 h1: 'Aluminium Louver Price Delhi NCR — ₹450 to ₹1,450 per Sqft',
 heroSub: 'Facade louver supply and installation across Delhi NCR — factory fabrication from Hyderabad with local measurement and fixing crew.',
 image: 'aluminium-louver-installation-ncr-project.webp',
 imageAlt: 'Aluminium louver price Delhi NCR installation | WoodenMax',
 priceTableTitle: 'Delhi NCR louver rates',
 priceTable: {
 head: ['Type', 'NCR ₹/sqft', 'Notes'],
 rows: [
 ['Fixed vent', '₹450 – ₹580', 'Plant & duct'],
 ['Facade 75×38', '₹580 – ₹750', 'Most villas'],
 ['Wooden finish', '₹680 – ₹920', 'Elevation rafters'],
 ['Motorized', '₹1,100 – ₹1,450', 'Premium'],
 ],
 },
 calcTypes: [
 { label: 'Delhi NCR fixed louver', min: 450, max: 820 },
 { label: 'Delhi NCR motorized', min: 1100, max: 1450 },
 ],
 bodySections: [
 {
 heading: 'Delhi NCR service area',
 body: '<p>We measure and install in <strong>Gurgaon, Noida, Greater Noida, Faridabad, Ghaziabad & New Delhi</strong>. Lead time includes transport from Hyderabad factory — plan 2–3 weeks for standard villas.</p>',
 subsections: [
 { h3: 'Popular NCR projects', body: '<p>Independent floors, builder floors and villa facades on 75×38 and 100×50 profiles — see <a href="aluminium-facade-louver-price.html">facade price guide</a>.</p>' },
 ],
 },
 ],
 faqs: [
 { q: 'Do you offer site visits in Delhi NCR?', a: 'Yes — site visit for projects typically above <strong>120 sq.ft</strong> facade area in NCR.' },
 ],
 productSchema: { name: 'Aluminium Louver Delhi', lowPrice: 450, highPrice: 1450, unitCode: 'FTK' },
 }),

 p({
 slug: 'louver-price-hyderabad',
 title: 'Aluminium Louver Price Hyderabad 2026 — Factory Direct Facade | WoodenMax',
 description: 'Aluminium louver Hyderabad factory direct ₹450–1,450/sqft. Fastest lead times. Residential & commercial facade at Aaghapura plant.',
 h1: 'Aluminium Louver Price Hyderabad — Supply & Installation',
 heroSub: 'Factory-direct facade louvers from our Hyderabad plant — shortest lead times and on-site QC for Telangana & AP projects.',
 image: 'residential-aluminium-facade-louver-hyderabad.webp',
 imageAlt: 'Residential aluminium facade louver Hyderabad price | WoodenMax',
 priceTableTitle: 'Hyderabad indicative rates',
 priceTable: {
 head: ['Type', 'Hyderabad ₹/sqft', 'Lead time'],
 rows: [
 ['Fixed facade', '₹450 – ₹820', '12–16 days'],
 ['Wooden finish', '₹680 – ₹920', '14–18 days'],
 ['Motorized', '₹1,100 – ₹1,450', '18–22 days'],
 ],
 },
 calcTypes: [
 { label: 'Hyderabad fixed louver', min: 450, max: 820 },
 { label: 'Hyderabad wooden finish', min: 680, max: 920 },
 ],
 bodySections: [
 {
 heading: 'Hyderabad factory advantage',
 body: '<p>Primary fabrication at <strong>5-6-411/413, Aaghapura, Nampally</strong> — no long-distance transport for local villas. Same-week survey possible for urgent projects.</p>',
 subsections: [
 { h3: 'Visit the factory', body: '<p>Architects welcome — <a href="/about/factory-tour-hyderabad">book factory tour</a> to see profiling and coating.</p>' },
 ],
 },
 ],
 faqs: [
 { q: 'What is the wooden finish rate in Hyderabad?', a: 'Typically <strong>₹680–₹920/sqft</strong> — exact figure on <a href="wooden-finish-aluminium-louvers.html">wooden finish calculator</a>.' },
 ],
 productSchema: { name: 'Aluminium Louver Hyderabad', lowPrice: 450, highPrice: 1450, unitCode: 'FTK' },
 }),

 p({
 slug: 'louver-price-jaipur',
 title: 'Aluminium Louver Price Jaipur 2026 — Facade & Ventilation | WoodenMax',
 description: 'Aluminium louver Jaipur ₹450–1,450/sqft. Villa facades, haveli-style elevations, commercial vents. WoodenMax Rajasthan projects.',
 h1: 'Aluminium Louver Jaipur — Fabrication & Installation',
 heroSub: 'Facade and ventilation louvers for Jaipur villas, resorts and commercial buildings — wooden texture popular for heritage-style elevations.',
 image: 'wooden-finish-aluminium-louver-building-exterior.webp',
 imageAlt: 'Wooden finish aluminium louver building exterior Jaipur | WoodenMax',
 priceTableTitle: 'Jaipur rate guide',
 priceTable: {
 head: ['Type', 'Jaipur ₹/sqft', 'Typical use'],
 rows: [
 ['Facade 75×38', '₹580 – ₹750', 'Villa front'],
 ['Wooden finish', '₹680 – ₹920', 'Heritage look'],
 ['Vent panel', '₹450 – ₹620', 'Courtyard vent'],
 ],
 },
 calcTypes: [
 { label: 'Jaipur facade louver', min: 580, max: 820 },
 { label: 'Jaipur wooden finish', min: 680, max: 920 },
 ],
 bodySections: [
 {
 heading: 'Jaipur project notes',
 body: '<p>Dust and sun exposure favour <strong>UV-stable wooden texture</strong> over real wood. We dispatch from Hyderabad with Jaipur install crew — plan 2–3 weeks total.</p>',
 subsections: [
 { h3: 'Popular profiles', body: '<p>75×38 mm horizontal screening and 100×50 mm entry canopies — link: <a href="aluminium-louvre-75x38mm-price.html">75×38 specs</a>.</p>' },
 ],
 },
 ],
 faqs: [
 { q: 'Do you offer site visits in Jaipur?', a: 'Site visit for qualifying facade area — confirm on WhatsApp with plot photos.' },
 ],
 productSchema: { name: 'Aluminium Louver Jaipur', lowPrice: 450, highPrice: 1450, unitCode: 'FTK' },
 }),

 p({
 slug: 'aluminium-louvre-75x38mm-price',
 title: '75x38mm Aluminium Louvre Price India 2026 — Specs per Sqft | WoodenMax',
 description: '75×38 mm aluminium louver ₹580–750/sqft. Gap 25/38 mm, 1.2 mm wall. Most popular facade profile. WoodenMax specs & rates.',
 h1: '75x38mm Aluminium Louver Profile — Price & Specifications',
 heroSub: 'India’s most specified facade louver profile — 75×38 mm blade, 1.2 mm wall, 25 or 38 mm gap options. Plain, black or wooden texture finishes.',
 image: 'aluminium-louver-75x38mm-profile-close-up.webp',
 imageAlt: '75x38mm aluminium louver profile close up price India | WoodenMax',
 priceTableTitle: '75×38 mm specification table',
 priceTable: {
 head: ['Spec', 'Value'],
 rows: [
 ['Profile size', '75 mm × 38 mm'],
 ['Wall thickness', '1.2 mm standard'],
 ['Gap options', '25 mm / 38 mm'],
 ['Price/sqft', '₹580 – ₹750'],
 ['Finish', 'Plain / wooden / black'],
 ['Weight/sqft', '~4.2 kg approx'],
 ],
 },
 comparisonTableTitle: '75×38 vs 100×50 profile',
 comparisonTable: {
 head: ['Spec', '75×38 mm', '100×50 mm'],
 rows: [
 ['Price/sqft', '₹580 – ₹750', '₹680 – ₹950'],
 ['Span', 'Moderate', 'Longer spans'],
 ['Weight', 'Lighter', 'Heavier'],
 ['Best for', 'Most villas', 'Large elevation'],
 ],
 },
 calcTypes: [
 { label: '75×38 plain', min: 580, max: 680 },
 { label: '75×38 wooden finish', min: 680, max: 750 },
 ],
 bodySections: [
 {
 heading: 'Why 75×38 is the default',
 body: '<p>Architects specify this size for <strong>cost-to-span balance</strong> on Indian villa elevations. Pair with <a href="aluminium-facade-louver-price.html">facade louver guide</a> for full building rates.</p>',
 },
 ],
 faqs: [
 { q: 'Should I choose 25 mm or 38 mm gap?', a: '25 mm for privacy and a denser look; 38 mm for stronger shadow lines and airflow.' },
 ],
 productSchema: { name: '75x38mm Aluminium Louver', lowPrice: 580, highPrice: 750, unitCode: 'FTK' },
 }),

 p({
 slug: 'aluminium-louvre-100x50mm-price',
 title: '100x50mm Aluminium Louvre Price India 2026 — Heavy Duty | WoodenMax',
 description: '100×50 mm heavy-duty aluminium louver ₹680–950/sqft. Villa & commercial elevation. 1.4 mm wall. WoodenMax.',
 h1: '100x50mm Aluminium Louver — Price & Specifications',
 heroSub: 'Heavy-duty 100×50 mm blades for long spans, bold shadows and premium villa elevations — also used as wooden-finish elevation rafters.',
 image: 'elevation-louvers-rafters-3d.webp',
 imageAlt: '100x50mm aluminium elevation louvers 3D | WoodenMax',
 priceTableTitle: '100×50 mm specification table',
 priceTable: {
 head: ['Spec', 'Value'],
 rows: [
 ['Profile size', '100 mm × 50 mm'],
 ['Wall thickness', '1.4 mm typical'],
 ['Gap options', '38 – 50 mm'],
 ['Plain ₹/sqft', '₹680 – ₹820'],
 ['Wooden finish ₹/sqft', '₹780 – ₹950'],
 ],
 },
 comparisonTable: LOUVER_PROFILE_COMPARISON,
 calcTypes: [
 { label: '100×50 plain', min: 680, max: 820 },
 { label: '100×50 wooden finish', min: 780, max: 950 },
 ],
 bodySections: [
 {
 heading: 'Heavy-duty applications',
 list: [
 'Double-height villa facades',
 'Commercial entry feature walls',
 'Wooden-finish elevation rafter systems',
 'Canopy undersides with wide spans',
 ],
 subsections: [
 { h3: 'Live calculator', body: '<p>Wood-look rafter line: <a href="wooden-finish-aluminium-louvers.html">wooden finish aluminium louvers calculator</a> (100×50×1.2 mm system).</p>' },
 ],
 },
 ],
 faqs: [
 { q: 'When should I choose 100×50 mm?', a: 'When span exceeds 3 m or the design needs bolder blade depth — cost is roughly 10–15% above 75×38.' },
 ],
 productSchema: { name: '100x50mm Aluminium Louver', lowPrice: 680, highPrice: 950, unitCode: 'FTK' },
 }),

 p({
 slug: 'commercial-building-louvers',
 title: 'Commercial Building Aluminium Louver Price India — Bulk Rates | WoodenMax',
 description: 'Commercial building louver bulk ₹450–820/sqft with 5–15% volume discounts. Pan-India supply. WoodenMax facade division.',
 h1: 'Commercial Building Louvers — Large Scale Supply & Installation',
 heroSub: 'Volume pricing for IT parks, hospitals, schools and retail facades — tiered ₹/sqft by project size with dedicated project manager.',
 image: 'commercial-building-aluminium-louver-installation.webp',
 imageAlt: 'Commercial building aluminium louver bulk installation | WoodenMax',
 priceTableTitle: 'Commercial volume price tiers',
 priceTable: {
 head: ['Project size', 'Price/sqft', 'Discount'],
 rows: [
 ['Up to 500 sqft', '₹580 – ₹820', 'Standard'],
 ['500–2,000 sqft', '₹520 – ₹750', '5–8%'],
 ['2,000+ sqft', '₹450 – ₹680', '10–15%'],
 ],
 },
 comparisonTableTitle: 'Commercial vs residential pricing',
 comparisonTable: {
 head: ['Factor', 'Commercial bulk', 'Single villa'],
 rows: [
 ['Typical area', '500 – 5,000+ sqft', '80 – 300 sqft'],
 ['₹/sqft', 'Lower tier', 'Standard tier'],
 ['Documentation', 'BOQ + milestones', 'Simplified BOQ'],
 ['Payment', 'Milestone based', 'Advance + dispatch'],
 ],
 },
 calcTypes: [
 { label: 'Up to 500 sqft', min: 580, max: 820 },
 { label: '500–2000 sqft', min: 520, max: 750 },
 { label: '2000+ sqft', min: 450, max: 680 },
 ],
 bodySections: [
 {
 heading: 'Commercial delivery process',
 list: [
 'Tender BOQ or architect GFC review',
 'Sample panel & colour sign-off',
 'Phased fabrication lots',
 'Site install with safety plan',
 'Final snag & handover report',
 ],
 subsections: [
 { h3: 'Architect & contractor enquiries', body: '<p>Email GFC PDF for fast indicative — <strong>info@woodenmax.com</strong> or WhatsApp from this page calculator.</p>' },
 ],
 },
 ],
 faqs: [
 { q: 'Is credit available on bulk orders?', a: 'Milestone payments for registered contractors on approved projects — discuss with sales.' },
 ],
 productSchema: { name: 'Commercial Building Louvers', lowPrice: 450, highPrice: 820, unitCode: 'FTK' },
 }),
];

pages.forEach(function (pg) {
 if (pg.isHub) return;
 var extra = LINK_MAP[pg.slug] || [];
 pg.internalLinks = [
 { href: '/products/metal-louvers/', title: 'Louvers price hub', desc: 'All 15 guides' },
 ].concat(extra).concat([
 { href: '/products/metal-louvers/aluminium-facade-louver-price', title: 'Facade louver', desc: '₹580–820/sqft' },
 { href: '/products/metal-louvers/fixed-vs-motorized-louver', title: 'Fixed vs motorized', desc: 'Compare' },
 { href: '/products/metal-louvers.html', title: 'Live BOQ calculators', desc: 'Product tools' },
 { href: '/contact?intent=louver-quote', title: 'Site visit', desc: 'Locked PDF quote' },
 ]).filter(function (l, i, arr) {
 var dup = arr.findIndex(function (x) { return x.href === l.href; }) !== i;
 var self = l.href.indexOf(pg.slug) !== -1 && l.href.indexOf('metal-louvers.html') === -1;
 return !dup && !self;
 });
});

module.exports = { pages };
