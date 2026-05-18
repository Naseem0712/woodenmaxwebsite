module.exports.pageConfig = {
  slug: 'team-leadership',
  silo: 'eeat',
  out:  'about/team-leadership.html',
  canonical: '/about/team-leadership',
  title: 'WoodenMax Team & Leadership | Naseem Ahmad + 60-person Hyderabad Crew + ~120 All-India',
  description: 'Meet the WoodenMax team led by founder Naseem Ahmad (26 years in aluminium, hardware & custom architectural work). 60 people in Hyderabad workshops + project sites, plus ~60 partner-led crews across India — about 120 people end-to-end on a live WoodenMax project at any given time.',
  ogImage: 'https://woodenmax.in/images/Founder-Naseem.webp',
  schemaType: 'AboutPage',
  // Real-named-author signal (founder is also the author/spokesperson)
  person: {
    name:        'Naseem Ahmad',
    givenName:   'Naseem',
    familyName:  'Ahmad',
    jobTitle:    'Founder &amp; Managing Partner, WoodenMax Architectural Elements',
    description: 'Founder of WoodenMax Architectural Elements. 26 years hands-on in aluminium, hardware and customised architectural work. Leads a 60-person Hyderabad crew and a further ~60-person partner-led network across India (~120 people end-to-end on live WoodenMax projects).',
    image:       '/images/Founder-Naseem.webp',
    url:         'https://woodenmax.in/about/founder-story-woodenmax',
    worksFor: {
      name: 'WoodenMax Architectural Elements',
      url:  'https://woodenmax.in'
    }
  },
  breadcrumb: [
    { label: 'Home',  href: '/' },
    { label: 'About', href: '/about/' },
    { label: 'Team &amp; leadership' }
  ],
  h1: 'Team &amp; leadership',
  hero: {
    sub: '60 people in Hyderabad across our own workshops and live project sites, plus a partner-led network of ~60 more across India — roughly 120 people end-to-end on a live WoodenMax project at any given time. Led by founder Naseem Ahmad (26 years in the aluminium &amp; hardware trade).',
    image: {
      src: '../images/Founder-Naseem.webp',
      alt: 'Naseem Ahmad — Founder of WoodenMax Architectural Elements, leading a 60-person Hyderabad crew and ~120-person all-India project network',
      caption: 'Naseem Ahmad · Founder &amp; Managing Partner · WoodenMax Architectural Elements',
      credit:  'Wider team photoshoot scheduled for July 2026',
      w: 1200, h: 750
    },
    points: [
      '<strong>~60 people</strong> in Hyderabad (workshops + project sites)',
      '<strong>~60 more</strong> across India via long-running partner crews',
      '<strong>~120 people</strong> end-to-end on a typical live WoodenMax project',
      '<strong>10&ndash;12 live projects</strong> running in parallel across the country'
    ]
  },
  sections: [
    {
      heading: 'Leadership',
      cards: [
        {
          photo: {
            src: '../images/Founder-Naseem.webp',
            alt: 'Naseem Ahmad — Founder of WoodenMax Architectural Elements',
            w: 480, h: 480
          },
          title:    'Naseem Ahmad',
          subtitle: 'Founder &amp; Managing Partner',
          body:    '<strong>26 years</strong> hands-on in aluminium, hardware engineering and customised architectural work. Started as an apprentice in NCR in 2000, worked through master-fabricator workshops and larger firms, and founded WoodenMax in Hyderabad in 2014. Originally from NCR, operates from Hyderabad. Personally signs off on every B2B project &gt; ₹15 L and reads every escalation email within 24 hours.',
          meta:    '<a href="../about/founder-story-woodenmax">Read the full founder story &rarr;</a>'
        },
        { icon: 'O', title: 'Head of Operations',                   body: 'Joined 2016. Runs the factory, the QC lab, vendor management and capacity planning. Owns the 18–25 day SLA.' },
        { icon: 'E', title: 'Head of Engineering',                  body: 'Joined 2017. Owns shop drawings, system development, wind-load qualification, and the materials database.' },
        { icon: 'S', title: 'Head of Sales &amp; Customer Success', body: 'Joined 2019. Owns inbound enquiry conversion, B2B account management, and CSAT.' },
        { icon: 'X', title: 'Head of Service',                      body: 'Joined 2018. Runs the multi-city engineer network, AMC contracts, and the warranty-claim resolution SLA.' }
      ],
      callout: {
        tone: 'info',
        title: 'Want to talk directly to the team?',
        body: 'For the founder, write to <a href="mailto:info@woodenmax.com">info@woodenmax.com</a> with subject "Friday call" + your number (Fridays 4–6 PM IST). For any department head, request a 30-minute introduction call via the same address.'
      }
    },
    {
      heading: 'How the 60 + ~60 split works',
      body:
        '<p>Two layers — both run end-to-end by WoodenMax:</p>' +
        '<div class="cluster-table-wrap"><table class="cluster-table">' +
          '<thead><tr><th>Layer</th><th>Where</th><th>People</th><th>What they do</th></tr></thead>' +
          '<tbody>' +
            '<tr><td><strong>Layer 1 &mdash; WoodenMax core</strong></td><td>Hyderabad (workshops + live project sites)</td><td>~60</td><td>Fabrication, powder-coating, glazing, hardware fitment, QC, project supervision, design + sales</td></tr>' +
            '<tr><td><strong>Layer 2 &mdash; long-running partner crews</strong></td><td>NCR, Mumbai, Bengaluru, Pune, Jaipur + other project cities</td><td>~60</td><td>On-site installation, site civil interface, finishing trades &mdash; CLRA-licensed crews we have worked with for 4&ndash;9 years; PF / ESI / WC routed via us</td></tr>' +
            '<tr><td colspan="2" style="text-align:right"><strong>Total people on a live WoodenMax project at any time</strong></td><td><strong>~120</strong></td><td>Coordinated by the WoodenMax PMO</td></tr>' +
          '</tbody>' +
        '</table></div>' +
        '<p>The numbers below break down the <strong>~60-person Hyderabad core</strong>.</p>'
    },
    {
      heading: 'Engineering &amp; design — 12 people',
      list: [
        '<strong>4 mechanical engineers</strong> with B.E./M.E. degrees, average 7 years aluminium fabrication experience',
        '<strong>3 architectural draftspersons</strong> on AutoCAD + SolidWorks, all trained on facade detailing',
        '<strong>2 structural engineers</strong> on consultancy panel — used for wind-load + seismic sign-off on high-rises',
        '<strong>3 production engineers</strong> on the factory floor — own CNC programs, mitre setups, and shift quality'
      ]
    },
    {
      heading: 'Production &amp; QC — 26 people',
      table: {
        head: ['Role',                         'Count', 'Reports to'],
        rows: [
          ['Production supervisor',            '2',  'Head of Operations'],
          ['Mitre-saw &amp; CNC operators',    '6',  'Production supervisor'],
          ['Powder-coating line operators',    '4',  'Coating supervisor'],
          ['Glazing line technicians',         '5',  'Glazing supervisor'],
          ['Hardware fitters',                 '4',  'Glazing supervisor'],
          ['QC inspectors',                    '3',  'Head of Engineering'],
          ['Material &amp; dispatch coordinators', '2', 'Head of Operations']
        ]
      }
    },
    {
      heading: 'Field service — 14 cities',
      body:
        '<p>Our service footprint covers the 14 cities listed below. <strong>Own engineers</strong> (W2 employees) operate in 6 base cities; <strong>certified service partners</strong> (independent fabricators we have trained and qualified) operate in the remaining 8.</p>',
      table: {
        head: ['Tier', 'Cities', 'Engineer model', 'Response time SLA'],
        rows: [
          ['Own engineers', 'Hyderabad, Bengaluru, Mumbai, Pune, Delhi NCR, Jaipur', 'WoodenMax W2', '72 hours'],
          ['Certified partners', 'Chennai, Kolkata, Ahmedabad, Indore, Lucknow, Chandigarh, Kochi, Goa', 'Independent firm under SLA', '7 working days']
        ]
      }
    },
    {
      heading: 'Sales &amp; customer success — 8 people',
      list: [
        '<strong>3 inside sales</strong> handling inbound calls, calculator-converted leads, WhatsApp inquiries',
        '<strong>3 account managers</strong> handling B2B (architects, builders, project managers)',
        '<strong>1 design consultant</strong> for premium residential projects — site visit + facade visualisation',
        '<strong>1 customer success</strong> owning order-to-install handoff, snag closure, and post-install NPS'
      ]
    },
    {
      heading: 'How we hire',
      body:
        '<p>Three principles, written on the wall in our HR room:</p>' +
        '<ol class="cluster-list">' +
          '<li><strong>Hire on character first</strong> — anyone with a "the customer was wrong" attitude is filtered out at the second round, regardless of skill.</li>' +
          '<li><strong>Hire for 5-year tenure</strong> — every offer we make assumes the candidate will be with us in 2031. We invest accordingly.</li>' +
          '<li><strong>Promote first, recruit second</strong> — 4 of our 5 department heads were internal promotions, not lateral hires.</li>' +
        '</ol>'
    }
  ],
  faqs: [
    { q: 'Can I meet the engineer designing my project?',
      a: 'Yes. For projects &gt; ₹5 L, the assigned design engineer accompanies the site visit. For B2B/architect projects, we set up a 30-min design-kickoff call after the first site visit.' },
    { q: 'Who do I escalate to if my project is going wrong?',
      a: 'First — your account manager. If unresolved in 48 hours — write to <a href="mailto:info@woodenmax.com">info@woodenmax.com</a> with subject "Escalation — &lt;Quote No&gt;". The founder personally reads every escalation within 24 hours.' },
    { q: 'Are your installation crews on payroll?',
      a: 'In Hyderabad, our core fabrication, QC, glazing and supervision crew (~60 people) is on our books. Across our other project cities (NCR, Mumbai, Bengaluru, Pune, Jaipur, etc.), the on-site installation crews (~60 more people) are long-running partner teams under CLRA-licensed agreements, with workmen\'s compensation, ESI and PF cover routed via us. We have worked with the same partner leads for 4&ndash;9 years on average.' },
    { q: 'So how many people in total are on a live WoodenMax project?',
      a: 'About <strong>120 people</strong> end-to-end — ~60 from our Hyderabad core (fabrication, coating, glazing, QC, design, project supervision) plus ~60 from long-running partner crews on the project sites in the destination cities. All coordinated through the WoodenMax Project Management Office.' },
    { q: 'Do you hire?',
      a: 'Always — engineering, production, and field service. Send a CV to <a href="mailto:info@woodenmax.com">info@woodenmax.com</a> (subject "Careers"). We respond to every CV within 7 days even when there is no open role.' }
  ],
  internalLinks: [
    { href: '/about/founder-story-woodenmax',           title: 'Founder story',          desc: 'How WoodenMax began' },
    { href: '/about/factory-tour-hyderabad',            title: 'Factory tour',           desc: 'Where the team works' },
    { href: '/about/manufacturing-process',             title: 'Manufacturing',          desc: 'What the team builds' },
    { href: '/about/case-study-makobrew-jubilee-hills', title: 'Case study — Makobrew',  desc: 'A 13,000+ sft hospitality project' }
  ]
};
