/** Shared tables, FAQ & copy for metal-louver SEO catalog pages */

const LOUVER_PROFILE_COMPARISON = {
 head: ['Profile', 'Size (mm)', 'Price/sqft', 'Best for'],
 rows: [
 ['Economy vent', '50 × 25', '₹450 – ₹580', 'Ducts, plant rooms'],
 ['Standard facade', '75 × 38', '₹580 – ₹750', 'Residential elevation'],
 ['Heavy elevation', '100 × 50', '₹680 – ₹950', 'Villas, commercial'],
 ['Premium span', '150 × 50', '₹780 – ₹1,050', 'Large facades'],
 ],
};

const LOUVER_FINISH_COMPARISON = {
 head: ['Finish', 'UV stability', 'Maintenance', 'Typical ₹/sqft'],
 rows: [
 ['Plain powder coat', 'Good', 'Wash yearly', '₹450 – ₹680'],
 ['Matt black', 'Very good', 'Low', '₹580 – ₹820'],
 ['Wooden texture', 'Excellent', 'Wipe only', '₹680 – ₹920'],
 ['Perforated panel', 'Good', 'Low', '₹620 – ₹880'],
 ],
};

const LOUVER_SPECS_TABLE = {
 head: ['Specification', 'Standard value'],
 rows: [
 ['Alloy', '6063-T6 extruded aluminium'],
 ['Wall thickness', '1.2 – 1.6 mm (profile dependent)'],
 ['Coating', 'Polyester / PVDF powder coat'],
 ['Wind load', 'Designed per elevation drawing'],
 ['Warranty', '10 years on profile coating (manufacturing)'],
 ['GST', '18% extra on all rates shown'],
 ],
};

const LOUVER_POLICY_FAQ = [
 { q: 'Does the rate include installation?', a: 'Yes — our typical ₹/sqft range includes <strong>fabrication, powder coat and site fixing</strong>. MS sub-frame may be quoted separately if the existing structure needs reinforcement.' },
 { q: 'What is the minimum order area?', a: 'Rates on these pages are indicative. Practical minimum is <strong>80–120 sq.ft</strong> facade area — smaller patch jobs receive a consolidated quote after a site visit.' },
 { q: 'What is the lead time?', a: 'Standard fixed louvers: <strong>12–18 working days</strong> fabrication after drawing sign-off. Motorized systems add 5–7 days.' },
 { q: 'Is GST included?', a: 'No. All rates are <strong>ex-GST</strong>. GST 18% is added on the invoice.' },
 { q: 'Which cities do you install in?', a: 'Primary teams: <strong>Hyderabad, Delhi NCR, Jaipur</strong>. Mumbai and Bengaluru are project-based. Pan-India dispatch available for bulk supply.' },
];

const LOUVER_CALC_INTRO = 'Indicative ₹/sqft range — enter facade area for a quick band. For item-wise BOQ with gaps, brackets and finish, use our live product calculators linked below. GST 18% extra.';

const LOUVER_EEAT = {
 heading: 'Why architects choose WoodenMax for louvers',
 body: '<p>WoodenMax fabricates architectural aluminium louvers in-house from <strong>6063-T6 profiles</strong>, powder-coats in controlled booths, and installs with dedicated facade crews. We have executed residential villas, commercial towers and hospitality facades across Hyderabad, Delhi NCR and Jaipur — with documented case studies and factory QC you can verify before placing an order.</p>',
 subsections: [
 {
 h3: 'Fabrication and quality control',
 body: '<p>Every batch is cut to drawing, hole-punched for bracket fixing, and coated after aluminium pretreatment. Gap between blades, blade angle and bracket spacing are locked on the approved BOQ so site teams do not improvise.</p>',
 },
 {
 h3: 'Transparent pricing',
 body: '<p>Rates on this page are <strong>indicative bands</strong> for budget planning. Final quote after site measurement includes profile size, finish, area, access difficulty and sub-frame requirement — shared as a locked PDF BOQ.</p>',
 },
 ],
 links: [
 { href: '/about/manufacturing-process', label: 'Manufacturing process' },
 { href: '/about/quality-testing-process', label: 'Quality control' },
 { href: '/about/factory-tour-hyderabad', label: 'Factory tour Hyderabad' },
 { href: '/products/metal-louvers', label: 'Live louver calculators' },
 ],
};

const LOUVER_CALC_PRODUCT_LINKS = [
 { href: 'wooden-finish-aluminium-louvers.html', title: 'Wooden finish elevation rafters', desc: 'Live ₹520/sqft calculator' },
 { href: 'curved-architectural-louvers.html', title: 'Curved architectural louvers', desc: 'Custom arc facade BOQ' },
 { href: 'ceiling-pergola-louvers.html', title: 'Ceiling pergola louvers', desc: 'Pergola and soffit calc' },
 { href: 'louver-canopy-facade.html', title: 'Canopy and duct louvers', desc: 'Entrance canopy pricing' },
];

module.exports = {
 LOUVER_PROFILE_COMPARISON,
 LOUVER_FINISH_COMPARISON,
 LOUVER_SPECS_TABLE,
 LOUVER_POLICY_FAQ,
 LOUVER_CALC_INTRO,
 LOUVER_EEAT,
 LOUVER_CALC_PRODUCT_LINKS,
};
