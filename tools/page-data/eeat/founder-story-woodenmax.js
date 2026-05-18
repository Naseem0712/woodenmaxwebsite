module.exports.pageConfig = {
  slug: 'founder-story-woodenmax',
  silo: 'eeat',
  out:  'about/founder-story-woodenmax.html',
  canonical: '/about/founder-story-woodenmax',
  title: 'Naseem Ahmad — Founder of WoodenMax | 26 Years in Aluminium, Hardware & Custom Architectural Work',
  description: 'Meet Naseem Ahmad — 26 years of hands-on experience in aluminium fabrication, hardware engineering and customised architectural elements. Started as an apprentice in NCR in 2000, worked his way up, and founded WoodenMax Architectural Elements in Hyderabad in 2014.',
  ogImage: 'https://woodenmax.in/images/Founder-Naseem.webp',
  schemaType: 'AboutPage',
  // Real-named-author signal for Google EEAT — emitted as a separate
  // Person JSON-LD block and inlined into the Article author field.
  person: {
    name:        'Naseem Ahmad',
    givenName:   'Naseem',
    familyName:  'Ahmad',
    jobTitle:    'Founder, WoodenMax Architectural Elements',
    description: '26 years hands-on in architectural aluminium, hardware engineering and customised metal-and-glass work. Founder of WoodenMax Architectural Elements — based out of Hyderabad with a 60-person workshop + project crew, and a further ~60 partner-led teams across India (~120 people end-to-end). Originally from NCR.',
    image:       '/images/Founder-Naseem.webp',
    url:         'https://woodenmax.in/about/founder-story-woodenmax',
    worksFor: {
      name: 'WoodenMax Architectural Elements',
      url:  'https://woodenmax.in'
    },
    knowsAbout: [
      'Architectural Aluminium Fabrication',
      'Aluminium Profile Selection (6063 T5 / T6)',
      'Window & Door Hardware Engineering',
      'Custom Architectural Metalwork',
      'System Windows',
      'Structural Glazing',
      'Powder Coating (Qualicoat)',
      'CNC Manufacturing',
      'Facade Engineering',
      'Frameless Shower Partitions',
      'Aluminium Pergolas',
      'HPL & ACP Elevation Cladding',
      'Glass Railings',
      'Bespoke Lighting & Ceiling Work'
    ],
    // Personal address (NCR — where the founder is from / lives).
    // Business address is published separately at the Organization
    // schema level (Hyderabad HQ).
    homeLocation: {
      '@type': 'Place',
      'name': 'NCR (Delhi National Capital Region)',
      'address': {
        '@type': 'PostalAddress',
        addressLocality:  'NCR',
        addressRegion:    'Delhi',
        addressCountry:   'IN'
      }
    },
    workLocation: {
      '@type': 'Place',
      'name': 'WoodenMax HQ — Hyderabad',
      'address': {
        '@type': 'PostalAddress',
        streetAddress:    '5-6-411/413, Aaghapura',
        addressLocality:  'Nampally, Hyderabad',
        addressRegion:    'Telangana',
        postalCode:       '500001',
        addressCountry:   'IN'
      }
    },
    nationality: 'Indian'
  },
  breadcrumb: [
    { label: 'Home',  href: '/' },
    { label: 'About', href: '/about/' },
    { label: 'Founder story' }
  ],
  h1: 'Naseem Ahmad — 26 years in aluminium, hardware &amp; custom architectural work',
  hero: {
    sub: 'Started as a young apprentice in NCR in 2000. Worked his way up through master-fabricator workshops and larger firms — building a 14-year ground-up education in aluminium profiles, hardware engineering and bespoke architectural fabrication. In 2014, took that craft to Hyderabad and founded WoodenMax Architectural Elements. Today: 60-person crew in Hyderabad and ~120 people across India.',
    image: {
      src: '../images/Founder-Naseem.webp',
      alt: 'Naseem Ahmad — Founder of WoodenMax Architectural Elements, 26 years experience in aluminium, hardware & custom architectural work',
      caption: 'Naseem Ahmad · Founder · WoodenMax Architectural Elements · originally from NCR, operating out of Hyderabad',
      credit:  'Photographed at the WoodenMax Hyderabad facility',
      w: 1200, h: 750
    },
    points: [
      '<strong>26 years</strong> hands-on in aluminium, hardware &amp; custom architectural work',
      'Career arc: apprentice in NCR (2000) &rarr; senior fabricator &rarr; founder (2014)',
      'Deep expertise in <strong>aluminium profiles, hardware engineering &amp; customisation</strong>',
      '<strong>60 people</strong> in Hyderabad (workshops + project sites) · <strong>~120</strong> across India'
    ]
  },
  sections: [
    {
      heading: 'About Naseem Ahmad',
      cards: [
        {
          photo: {
            src: '../images/Founder-Naseem.webp',
            alt: 'Portrait of Naseem Ahmad — Founder of WoodenMax Architectural Elements',
            w: 480, h: 480
          },
          title:    'Naseem Ahmad',
          subtitle: 'Founder &amp; Managing Partner · WoodenMax Architectural Elements',
          body:
            '26 years hands-on in the aluminium, hardware and custom-architectural trade. Started as a young apprentice in NCR back in 2000, worked his way up through master-fabricator workshops and larger firms, and in 2014 brought that ground-up craft education to Hyderabad to found WoodenMax. Today personally signs off on every B2B project above &#8377;15&#160;L and reads every escalation email within 24&#160;hours. ' +
            '<br><br><strong>Originally from:</strong> NCR (Delhi region) &middot; <strong>Operates from:</strong> Hyderabad (where WoodenMax HQ &amp; workshops are based).',
          meta:
            '<strong>Reachable on:</strong> <a href="mailto:info@woodenmax.com">info@woodenmax.com</a> &middot; ' +
            '<strong>Friday calls:</strong> 4&ndash;6&#160;PM&#160;IST (subject "Friday call")'
        }
      ]
    },
    {
      heading: 'The 26-year arc — apprentice &rarr; senior fabricator &rarr; founder',
      body:
        '<p>The WoodenMax story does not start in 2014. It starts in <strong>2000</strong>, with a teenager from NCR walking into a small aluminium-fabrication workshop to learn the trade.</p>' +
        '<p>For the first stretch — roughly <strong>2000 to 2007</strong> — the work was the classic North-Indian fabricator&rsquo;s ground school: ' +
          'sliding window assembly, doors, mitre cuts on hand-saws, putty &amp; glazing, hardware fitment, and (most importantly) understanding which profile, gasket and roller actually lasted versus which one looked the same in the catalogue but failed in two monsoons. ' +
          'That stretch built the muscle memory for <strong>aluminium profiles and hardware engineering</strong> that still drives every WoodenMax design choice today.</p>' +
        '<p>The second stretch — <strong>2008 to 2013</strong> — was inside larger firms: bigger project sites, system windows, structural glazing, facade work, and a lot of <strong>customised architectural elements</strong> — bespoke partitions, retractable pergolas, ceiling-light fabrication, ACP &amp; HPL cladding, fluted wood panels. That phase taught the project-management discipline: BOQs, site coordination, multi-trade sequencing, and the brutal calculus of how a single under-spec hardware piece can sink a six-figure project.</p>' +
        '<p>By <strong>2014</strong>, after 14 years inside the trade, one thing had become obvious: the average Indian fabricator was repeating the same shortcuts that the master craftsmen of NCR had warned against in 2002. ' +
          'Bad rollers. Wrong gaskets. Hardware bought on price, not on cycle-life. &ldquo;Service&rdquo; that meant ignoring the customer after install. ' +
          'There was no shortage of demand for premium work — there was a shortage of <em>operators</em> willing to do it the right way.</p>' +
        '<p>So in 2014, WoodenMax Architectural Elements was founded out of Hyderabad with a single thesis: ' +
          '<strong>take 14 years of master-fabricator know-how and run it as one accountable brand &mdash; transparent prices, European-grade hardware, documented warranty, and a single owner who personally signs off the work.</strong></p>'
    },
    {
      heading: 'The WoodenMax timeline (2014 &rarr; today)',
      list: [
        '<strong>2014</strong>: WoodenMax incorporated in Hyderabad. First workshop set up, first crew hired. Founder relocated operations to Hyderabad while keeping family base in NCR.',
        '<strong>2015&ndash;16</strong>: First Qualicoat-certified powder-coating supplier signed. First German hardware on a Hyderabad villa project. Crew strength 8&ndash;12.',
        '<strong>2016&ndash;17</strong>: Moved to a larger Hyderabad facility. First CNC machine added. First B2B project &mdash; multi-villa builder development with full warranty.',
        '<strong>2018</strong>: Crossed 100 projects/year. Set up an in-house functional-test bench (cycle, water, weathering).',
        '<strong>2019&ndash;20</strong>: COVID forced a reset &mdash; built the online presence, launched live price calculators, published every standard rate openly. The "transparent pricing" pillar became code.',
        '<strong>2021&ndash;23</strong>: Multi-city service network operational. Project network grew across NCR, Mumbai, Bengaluru, Pune, Jaipur, Hyderabad.',
        '<strong>2024&ndash;25</strong>: Scaled the Hyderabad operation. <strong>60-person crew</strong> across workshops + live project sites in Hyderabad alone, plus a partner-led network of ~60 more across India &mdash; ~<strong>120 people</strong> end-to-end on a WoodenMax project at any given time.',
        '<strong>2026</strong>: ~10&ndash;12 live projects running in parallel across the country, personally signed off by the founder.'
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
          ['Founder industry experience',         '26 years (apprentice in 2000 &rarr; founder in 2014)'],
          ['Hyderabad crew (own workshops + project sites)', '~60 people'],
          ['All-India crew incl. partner teams',  '~120 people on a live WoodenMax project at any given time'],
          ['Live projects running in parallel',   '10&ndash;12'],
          ['Cities with active installations',    '14'],
          ['Cities with own service engineers',   '6 (Hyderabad, Bengaluru, Mumbai, Pune, Delhi NCR, Jaipur)'],
          ['Repeat / referral business share',    '~35% of monthly revenue'],
          ['Field defect rate',                   '&lt; 0.5% of shutters shipped'],
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
      a: 'In Hyderabad alone we have about <strong>60 people</strong> across our own workshops and live project sites. Across India, including partner-led project crews coordinated by us, the number on a typical WoodenMax project at any given time is <strong>around 120 people</strong>. We run <strong>10&ndash;12 live projects in parallel</strong> across the country.' },
    { q: 'How much actual industry experience does the founder have?',
      a: 'Naseem Ahmad has <strong>26 years in the trade</strong>. He started as an apprentice in NCR in 2000, spent the first 14 years inside fabrication workshops and larger architectural-aluminium firms learning profiles, hardware engineering and customised work end-to-end, and then founded WoodenMax in Hyderabad in 2014. Every design decision &mdash; from which profile thickness to spec to which hardware cycle-life to insist on &mdash; is shaped by those 26 years of hands-on practice.' },
    { q: 'Why is the founder in Hyderabad if he is from NCR?',
      a: 'Naseem is originally from NCR (Delhi region), and that is where his family is based. WoodenMax\'s operational HQ, workshops and primary project base are in Hyderabad because of the customer profile, vendor ecosystem and weather conditions that made the business model viable. He spends most of his working time in Hyderabad and travels regularly to our other project cities (NCR, Mumbai, Bengaluru, Pune, Jaipur).' },
    { q: 'Are you VC-funded?',
      a: 'No, fully bootstrapped. We have grown organically since 2014. Reinvestment ratio has been 80&ndash;90% of net profit annually, which is why every year there is new equipment in the workshop.' },
    { q: 'Is the company profitable and properly registered?',
      a: 'Yes &mdash; consistently profitable since FY 2018. We are a registered firm operating as <strong>WoodenMax Architectural Elements</strong> with GSTIN <strong>36ARWPA9740L1Z3</strong>, and we file our returns on time every year.' },
    { q: 'Why the name "WoodenMax" for an aluminium-first brand?',
      a: 'Because in 2014 our first product line included wooden door frames alongside aluminium windows on the openings. The wood-frame side was discontinued in 2017 as we specialised in aluminium and glass, but the brand had already gained traction with early customers, so we kept the name. A more accurate name today would be "AluMax", but customers know us as WoodenMax.' }
  ],
  internalLinks: [
    { href: '/about/team-leadership',                     title: 'Meet the team',                 desc: 'Founders, engineers, project managers' },
    { href: '/about/factory-tour-hyderabad',              title: 'Factory tour',                  desc: 'Where the work happens' },
    { href: '/about/case-study-makobrew-jubilee-hills',   title: 'Case study — Makobrew Cafe',    desc: 'Jubilee Hills + Himayat Nagar (full BOQ)' },
    { href: '/about/case-study-villa-hyderabad',          title: 'Case study — Hyderabad villa',  desc: 'A typical premium project' },
    { href: '/about/manufacturing-process',               title: 'Manufacturing process',         desc: '7-station production flow' }
  ]
};
