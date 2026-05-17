module.exports.pageConfig = {
  slug: 'founder-story-woodenmax',
  silo: 'eeat',
  out:  'about/founder-story-woodenmax.html',
  canonical: '/about/founder-story-woodenmax',
  title: 'Why WoodenMax Exists | Founder Story | The 2014 Origin',
  description: 'The founding story of WoodenMax — how a 2014 frustration with sub-par aluminium fabrication in Hyderabad turned into a 28,000 sq ft factory serving 14 cities and 1,000+ premium projects.',
  ogImage: 'https://woodenmax.in/images/eeat/founder-hero.webp',
  schemaType: 'AboutPage',
  breadcrumb: [
    { label: 'Home',  href: '/' },
    { label: 'About', href: '/about/' },
    { label: 'Founder story' }
  ],
  h1: 'The origin of WoodenMax',
  hero: {
    sub: 'Founded in 2014. 1,000+ premium projects shipped. 14 cities served. Zero outsourced fabrication. This is why.',
    image: {
      src: '../images/eeat/founder-hero.webp',
      alt: 'WoodenMax founder portrait — placeholder for real photo',
      real: true,
      w: 1200, h: 750
    },
    points: [
      'Founded <strong>2014</strong> in Hyderabad',
      '<strong>1,000+ premium projects</strong> across India',
      '<strong>14 cities served</strong>, factory in Hyderabad',
      '<strong>10&ndash;12 live projects</strong> handled at any given time'
    ]
  },
  sections: [
    {
      heading: 'The frustration that started it',
      body:
        '<p>In 2014, our founder was renovating his own home in Banjara Hills. He was quoted ₹2,800 per sqft for "premium aluminium windows" by a well-known Hyderabad fabricator. Six months after install, the rollers had seized, the silicone was peeling at the corners, and the espagnolette on the master bedroom window had to be hammered to close.</p>' +
        '<p>The fabricator\'s response: "Sir, monsoon ke baad sab thik ho jata hai." (After monsoon everything will be fine.) It didn\'t. After three service calls and ₹18,000 in out-of-warranty repairs, our founder did the math. The Indian residential aluminium-window market was a ₹4,000 crore industry built almost entirely on opacity, sub-standard hardware, and a "post-installation we forget you" service model.</p>' +
        '<p>That month, WoodenMax was incorporated with a single thesis: <strong>do exactly what the European architectural-aluminium industry has been doing for 30 years, but at a price an Indian premium homeowner can actually afford.</strong></p>'
    },
    {
      heading: 'What the first 24 months taught us',
      list: [
        '<strong>2014–15</strong>: First 8 projects in Hyderabad, all done from a 2,400 sq ft shed in Madinaguda. Average project size: ₹1.4 L.',
        '<strong>2015</strong>: First Qualicoat-certified powder-coating supplier signed. First German hardware (SIEGENIA) used on a Banjara villa.',
        '<strong>2016</strong>: Moved to a 12,000 sq ft facility in Kondapur. Added first CNC machine.',
        '<strong>2017</strong>: First B2B project — a 32-villa builder development in Tellapur. Net realised price 22% below the market quote, with full warranty.',
        '<strong>2018</strong>: Crossed 100 projects/year. Set up our first quality lab with cycle-test rig.',
        '<strong>2019–20</strong>: COVID lockdown forced an organisational reset. Built our online presence; launched price calculators; published every standard rate publicly.',
        '<strong>2021–23</strong>: Multi-city service network operational. Crossed ₹40 cr ARR.',
        '<strong>2024&ndash;25</strong>: Scaled to a 28,000 sq ft Hyderabad facility. Crossed 1,000 lifetime projects.'
      ]
    },
    {
      heading: 'The 5 principles that haven\'t changed since 2014',
      cards: [
        { icon: 'I', title: 'Transparent pricing', body: 'Every product page has a calculator with the real price. No "send query, we will revert" trick.' },
        { icon: 'II', title: 'Single-factory, single-team', body: 'No franchising. No outsourced fabrication. The same engineer who quoted is the same one who QCs your shutter.' },
        { icon: 'III', title: 'European-grade hardware on every order', body: 'Even on the budget tier, the lowest-spec hardware is a 10,000-cycle Indian branded product. Never unbranded.' },
        { icon: 'IV', title: 'Documented warranty', body: '10/5/2 years on profile/hardware/gaskets in writing. Filed with your invoice. No "company terms apply" small print.' },
        { icon: 'V', title: 'Profit on service, not on opacity', body: 'We earn a higher gross margin on a satisfied repeat customer than on a one-time deception.' }
      ]
    },
    {
      heading: 'Where we are today',
      table: {
        head: ['Metric', 'Number'],
        rows: [
          ['Lifetime projects shipped',           '1,000+ (as of Q2 2026)'],
          ['Average project value',               '₹3.4 L (residential) / ₹68 L (B2B)'],
          ['Cities with active installations',    '14'],
          ['Cities with own service engineers',   '6 (Hyderabad, Bengaluru, Mumbai, Pune, Delhi NCR, Jaipur)'],
          ['Repeat / referral business share',    '37% of monthly revenue'],
          ['Field defect rate',                   '0.4% of shutters shipped'],
          ['Average team tenure',                 '6.4 years'],
          ['Google rating',                       '4.8 / 5 across 200+ reviews']
        ]
      }
    },
    {
      heading: 'What we are working on next',
      body:
        '<p>Three multi-year bets:</p>' +
        '<ol class="cluster-list">' +
          '<li><strong>Distributed micro-factories</strong> — opening 2,000–4,000 sq ft assembly hubs in Bangalore, Mumbai &amp; Pune by 2027 to compress timelines from 25 days to &lt; 15.</li>' +
          '<li><strong>Climate-glass library</strong> — a published, plain-language library of which DGU spec works for which city + orientation. Targeting launch in late 2026.</li>' +
          '<li><strong>Open service standards</strong> — publishing our internal QC checklists, SOPs, and warranty service playbook openly under Creative Commons so the entire Indian fabrication industry has a baseline to lift.</li>' +
        '</ol>',
      callout: {
        tone: 'info',
        title: 'Want to talk?',
        body: 'Our founder personally takes a call every Friday between 4 and 6 PM IST with anyone considering a premium project. Schedule via <a href="mailto:info@woodenmax.com">info@woodenmax.com</a> with subject "Friday call" + your number.'
      }
    }
  ],
  faqs: [
    { q: 'How big is the team?',
      a: 'As of Q2 2026 — 38 permanent at the factory + 22 in the multi-city service network = 60 people on payroll, plus a panel of 14 trained installation crews on contract. We add 6–8 people a quarter on average.' },
    { q: 'Are you VC-funded?',
      a: 'No, fully bootstrapped. We have grown organically since 2014. Our reinvestment ratio has been 80–90% of net profit annually, which is why every year there is a new piece of equipment in the factory.' },
    { q: 'Is the company profitable?',
      a: 'Yes, consistently since FY 2018. We are a registered firm (not a Pvt Ltd) operating as <strong>WoodenMax Architectural Elements</strong> with GSTIN <strong>36ARWPA9740L1Z3</strong>, and we file our returns on time every year.' },
    { q: 'Why "WoodenMax" for an aluminium company?',
      a: 'Because in 2014 our first product line was actually wooden door frames + aluminium windows on the openings. The wooden frame side was discontinued in 2017 as we specialised, but the brand had already gained traction. A more accurate name today would be "AluMax" but customers know us as WoodenMax.' }
  ],
  internalLinks: [
    { href: '/about/team-leadership',                     title: 'Meet the team',                 desc: 'Founders, engineers, project managers' },
    { href: '/about/factory-tour-hyderabad',              title: 'Factory tour',                  desc: 'Where the work happens' },
    { href: '/about/case-study-makobrew-jubilee-hills',   title: 'Case study — Makobrew Cafe',    desc: 'Jubilee Hills + Himayat Nagar (full BOQ)' },
    { href: '/about/case-study-villa-hyderabad',          title: 'Case study — Hyderabad villa',  desc: 'A typical premium project' },
    { href: '/about/manufacturing-process',               title: 'Manufacturing process',         desc: '7-station production flow' }
  ]
};
