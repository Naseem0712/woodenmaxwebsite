/** Shared image path helpers for catalog SEO pages */
const RATES_JSON = require('../../../data/rates.json');
const MIRROR_RATES_JSON = RATES_JSON.mirror_profiles;

const IMG_MIRROR = '../images/products/mirror-profiles/';
const IMG_LOUVER = '../images/products/metal-louvers/';
const ORIGIN = 'https://woodenmax.in';

function mirrorImg(file) {
  return {
    src: IMG_MIRROR + file,
    og: ORIGIN + '/images/products/mirror-profiles/' + file,
    alt: '',
  };
}
function louverImg(file) {
  return {
    src: IMG_LOUVER + file,
    og: ORIGIN + '/images/products/metal-louvers/' + file,
  };
}

const CITIES = ['Hyderabad', 'Delhi NCR', 'Jaipur', 'Mumbai', 'Bengaluru'];

/** Mirror profile rates ₹/ft — from data/mirror-rates.json */
const MIRROR_RATES = MIRROR_RATES_JSON.profilePerFoot;

/** Louver rates ₹/sqft — site-wide band ₹450–₹1,450 */
const LOUVER_RATES = {
  standard: { min: 450, max: 580 },
  facade: { min: 580, max: 820 },
  wood: { min: 680, max: 920 },
  perforated: { min: 620, max: 880 },
  motorized: { min: 1100, max: 1450 },
  bulk: { min: 520, max: 750 },
};

/** Build calcConfig for a mirror SEO page from data/mirror-rates.json */
function mirrorCalcConfig(slug, extra) {
  var key = MIRROR_RATES_JSON.pageCalculator[slug];
  if (!key) return extra || {};
  var base = Object.assign({}, MIRROR_RATES_JSON.calculators[key]);
  delete base.description;
  return Object.assign(base, extra || {});
}

function mirrorCalcKey(slug) {
  return MIRROR_RATES_JSON.pageCalculator[slug] || null;
}

module.exports = {
  IMG_MIRROR,
  IMG_LOUVER,
  ORIGIN,
  CITIES,
  MIRROR_RATES,
  MIRROR_RATES_JSON,
  LOUVER_RATES,
  mirrorImg,
  louverImg,
  mirrorCalcConfig,
  mirrorCalcKey,
};
