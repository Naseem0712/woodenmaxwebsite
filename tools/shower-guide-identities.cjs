#!/usr/bin/env node
'use strict';

const SLUGS = [
  'bathroom-shower-design-price',
  'corner-shower-partition-price',
  'fixed-glass-shower-panel-price',
  'framed-vs-frameless-shower',
  'frameless-glass-shower-price',
  'glass-shower-partition-price',
  'shower-curtain-vs-glass-partition',
  'shower-enclosure-price',
  'shower-glass-maintenance',
  'shower-glass-thickness',
  'shower-glass-types',
  'shower-installation-cost',
  'sliding-shower-door-price',
  'small-bathroom-shower-design',
  'walk-in-shower-glass-price',
];

const LONG_PREFIX = '/products/shower-partitions/';

function isGuideHtml(relPath) {
  return SLUGS.includes(String(relPath).replace(/\\/g, '/').replace(/^products\/shower-partitions\//, '').replace(/\.html$/i, ''));
}

function shortPath(slug) {
  return `/${slug}`;
}

function longPath(slug) {
  return `${LONG_PREFIX}${slug}`;
}

module.exports = { SLUGS, LONG_PREFIX, isGuideHtml, shortPath, longPath };
