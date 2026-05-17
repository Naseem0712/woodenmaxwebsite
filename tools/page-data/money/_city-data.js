// Shared city + product matrix data used by money-page configs.
// Each city entry provides the climate, wind, salinity, sample pricing band,
// landmark localities, distance from Hyderabad factory (for free-transport flag).

module.exports.cities = {
  bangalore: {
    name: 'Bengaluru',
    state: 'Karnataka',
    distanceKm: 575,
    freeTransport: true,
    climate: 'temperate, moderate humidity, 6-month rain window',
    saltCoast: false,
    windZone: 'Low (Zone 2)',
    designWind: '1.2 kPa (~115 km/h)',
    pinPattern: '5600xx',
    landmarks: ['Indiranagar', 'Whitefield', 'Hebbal', 'Sarjapur Road', 'JP Nagar', 'HSR Layout'],
    nearbyTowns: ['Mysuru', 'Hosur', 'Tumkur', 'Doddaballapur'],
    designersStack: [
      'Slim aluminium casement (cool nights + bug protection)',
      'Lift-and-slide doors for villa-pool decks (Whitefield/Sarjapur)',
      'Soundproof acoustic DGU on ORR + airport-corridor homes'
    ]
  },
  mumbai: {
    name: 'Mumbai',
    state: 'Maharashtra',
    distanceKm: 711,
    freeTransport: true,
    climate: 'coastal, high humidity, very heavy monsoon',
    saltCoast: true,
    windZone: 'Moderate (Zone 3)',
    designWind: '1.8 kPa (~155 km/h gust)',
    pinPattern: '4000xx',
    landmarks: ['BKC', 'Worli', 'Powai', 'Andheri', 'Borivali', 'Thane West'],
    nearbyTowns: ['Navi Mumbai', 'Kalyan', 'Vasai', 'Panvel'],
    designersStack: [
      'Qualicoat Class-2 Seaside coating mandatory (salt-spray rated)',
      'Class-9A water tightness on high-rises 12+ floors',
      'Acoustic DGU (STC 35+) on western-railway-facing buildings'
    ]
  },
  delhi: {
    name: 'Delhi NCR',
    state: 'Delhi / Haryana / UP',
    distanceKm: 1283,
    freeTransport: false,
    climate: 'extreme — 47 &deg;C summer, 3 &deg;C winter, dust + smog',
    saltCoast: false,
    windZone: 'Moderate (Zone 4 for Gurugram)',
    designWind: '1.5 kPa (~140 km/h)',
    pinPattern: '110xxx / 122xxx',
    landmarks: ['Vasant Vihar', 'Greater Kailash', 'DLF Phase 5', 'Golf Course Road', 'Noida Sector 50', 'Faridabad'],
    nearbyTowns: ['Gurugram', 'Noida', 'Faridabad', 'Ghaziabad'],
    designersStack: [
      'Thermal-break profile + low-E DGU (32 &deg;C summer-to-winter delta)',
      'Dust-tight gaskets — Delhi PM 2.5 ingress is the silent killer',
      'Heritage 22-mm slim casement for Lutyens Zone restorations'
    ]
  },
  pune: {
    name: 'Pune',
    state: 'Maharashtra',
    distanceKm: 558,
    freeTransport: true,
    climate: 'pleasant year-round, moderate monsoon, low humidity',
    saltCoast: false,
    windZone: 'Low (Zone 2)',
    designWind: '1.2 kPa (~115 km/h)',
    pinPattern: '4110xx',
    landmarks: ['Koregaon Park', 'Kalyani Nagar', 'Baner', 'Hinjewadi', 'Kondhwa', 'Magarpatta'],
    nearbyTowns: ['Pimpri-Chinchwad', 'Lonavla', 'Talegaon', 'Hadapsar'],
    designersStack: [
      'Slim casement preferred (Pune\'s villa-deep window reveals look great)',
      'Lift-and-slide for IT-park duplexes',
      'Standard powder coating sufficient — non-coastal'
    ]
  },
  warangal: {
    name: 'Warangal',
    state: 'Telangana',
    distanceKm: 145,
    freeTransport: true,
    climate: 'hot summer (44 &deg;C), moderate monsoon, mild winter',
    saltCoast: false,
    windZone: 'Low (Zone 2)',
    designWind: '1.2 kPa (~115 km/h)',
    pinPattern: '506xxx',
    landmarks: ['Hanamkonda', 'Kazipet', 'Hunter Road', 'Mulugu Road', 'KU Campus', 'NIT Warangal'],
    nearbyTowns: ['Hanamkonda', 'Kazipet', 'Bhupalpally', 'Mahabubabad'],
    designersStack: [
      'Slim casement with thermal-break for 44 &deg;C summer afternoons',
      'Same-day site visit available (factory just 145 km away)',
      'Standard powder coating sufficient — non-coastal'
    ]
  },
  chandigarh: {
    name: 'Chandigarh',
    state: 'Punjab / Haryana',
    distanceKm: 1565,
    freeTransport: false,
    climate: 'hot summer (45 &deg;C), cold winter (3 &deg;C), heavy monsoon, dust',
    saltCoast: false,
    windZone: 'Moderate (Zone 4)',
    designWind: '1.5 kPa (~140 km/h)',
    pinPattern: '1600xx / 1601xx',
    landmarks: ['Sector 8', 'Sector 9', 'Sector 17', 'Sector 35', 'Mohali Phase 7', 'Panchkula Sector 5'],
    nearbyTowns: ['Mohali', 'Panchkula', 'Zirakpur', 'Kharar'],
    designersStack: [
      'Thermal-break profile + low-E DGU — handles 42 &deg;C summer-to-winter delta',
      'Dust-tight EPDM gaskets — dry-season dust ingress is the silent failure mode',
      'Heritage casement for Sector-grid Corbusier-era restorations'
    ]
  },
  vijayawada: {
    name: 'Vijayawada',
    state: 'Andhra Pradesh',
    distanceKm: 275,
    freeTransport: true,
    climate: 'hot &amp; humid summer (45 &deg;C, 80% RH), heavy monsoon, mild winter',
    saltCoast: false,
    windZone: 'Moderate (Zone 3 — cyclone-edge)',
    designWind: '1.5 kPa (~140 km/h)',
    pinPattern: '520xxx / 521xxx',
    landmarks: ['Benz Circle', 'Bandar Road', 'MG Road', 'Patamata', 'Tadepalli', 'Penamaluru'],
    nearbyTowns: ['Guntur', 'Tenali', 'Mangalagiri', 'Tadepalli'],
    designersStack: [
      'Thermal-break + low-E DGU for summer heat-gain control',
      'Class-9A water tightness on monsoon-facing facades',
      'Standard powder coating — inland city, no coastal salinity'
    ]
  },
  visakhapatnam: {
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    distanceKm: 615,
    freeTransport: true,
    climate: 'coastal, salty air, heavy monsoon, cyclone-prone',
    saltCoast: true,
    windZone: 'High (Zone 4 — cyclonic)',
    designWind: '2.0 kPa (~180 km/h gust)',
    pinPattern: '5300xx / 5301xx',
    landmarks: ['MVP Colony', 'Seethammadhara', 'Madhurawada', 'Beach Road', 'Rushikonda', 'Kommadi'],
    nearbyTowns: ['Anakapalle', 'Bheemunipatnam', 'Gajuwaka'],
    designersStack: [
      'Qualicoat Class-2 Seaside coating mandatory (salt-spray rated)',
      'Cyclone-grade +2.0 kPa qualification on facades within 5 km of coast',
      'Reinforced corners on lift-and-slide doors (high wind suction)'
    ]
  }
};

module.exports.products = {
  'aluminium-window': {
    hub: '/products/aluminium-windows',
    title: 'Aluminium Window',
    pluralTitle: 'Aluminium Windows',
    productSlug: 'aluminium-window',
    priceLow:  550,
    priceHigh: 2250,
    bestVariant: '2-track sliding (mid-range)',
    bestVariantPrice: 1150,
    typicalProject: '3 BHK — 12 openings',
    typicalProjectValue: 248000,
    relatedProducts: [
      { slug: 'aluminium-sliding-window',     name: '2-track sliding window' },
      { slug: 'aluminium-casement-window',    name: 'Casement window' },
      { slug: 'slim-entrance-glass-door',     name: 'Slim entrance glass door' },
      { slug: 'soundproof-aluminium-window',  name: 'Soundproof aluminium window' }
    ]
  },
  'glass-elevation': {
    hub: '/products/glass-elevation',
    title: 'Glass Elevation',
    pluralTitle: 'Glass Elevations',
    productSlug: 'glass-elevation',
    priceLow:  850,
    priceHigh: 3400,
    bestVariant: 'Structural glazing with low-E DGU',
    bestVariantPrice: 1880,
    typicalProject: 'G+1 villa facade (310 sqft)',
    typicalProjectValue: 583000,
    relatedProducts: [
      { slug: 'curtain-wall-system-india',    name: 'Curtain wall system' },
      { slug: 'spider-glazing-system',        name: 'Spider glazing' },
      { slug: 'structural-glazing-system',    name: 'Structural glazing' },
      { slug: 'full-glass-villa-elevation',   name: 'Full glass villa elevation' }
    ]
  }
};
