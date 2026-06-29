/* ============================================================
   IPO Pool — Mock data
   ============================================================ */
(function () {
  const fmtINR = (n, opts = {}) => {
    const { sign = false, compact = false } = opts;
    const neg = n < 0;
    let abs = Math.abs(n);
    let s;
    if (compact && abs >= 10000000) s = '₹' + (abs / 10000000).toFixed(2).replace(/\.00$/, '') + ' Cr';
    else if (compact && abs >= 100000) s = '₹' + (abs / 100000).toFixed(2).replace(/\.00$/, '') + ' L';
    else s = '₹' + abs.toLocaleString('en-IN');
    if (neg) return '-' + s;
    if (sign && n > 0) return '+' + s;
    return s;
  };
  const initials = (name) => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  // ---------- Members (admin adds these) ----------
  const members = [
    { id: 'm1', name: 'Rahul Mehta',    email: 'rahul.mehta@gmail.com',  role: 'Admin',  avatarHue: 152, you: true },
    { id: 'm2', name: 'Priya Nair',     email: 'priya.nair@gmail.com',   role: 'Member', avatarHue: 268 },
    { id: 'm3', name: 'Arjun Shah',     email: 'arjun.shah@gmail.com',   role: 'Member', avatarHue: 16 },
    { id: 'm4', name: 'Sneha Kulkarni', email: 'sneha.k@gmail.com',      role: 'Member', avatarHue: 320 },
    { id: 'm5', name: 'Vikram Iyer',    email: 'vikram.iyer@gmail.com',  role: 'Member', avatarHue: 200 },
    { id: 'm6', name: 'Ananya Rao',     email: 'ananya.rao@gmail.com',   role: 'Member', avatarHue: 38 },
  ];

  // ---------- PAN accounts — each linked to a member ----------
  // One member can have multiple PANs (spouse, parents, siblings).
  // Profit is shared equally per PAN applied — so more PANs = larger share.
  const pans = [
    // Rahul Mehta (m1) — 4 PANs
    { id: 'p1',  pan: 'AKLPM2391C', holder: 'Rahul Mehta',    relation: 'Self',   member: 'm1', status: 'Active', linkedBank: 'HDFC ••4021' },
    { id: 'p2',  pan: 'BNZPK7720F', holder: 'Sonal Mehta',    relation: 'Spouse', member: 'm1', status: 'Active', linkedBank: 'ICICI ••8830' },
    { id: 'p3',  pan: 'CRTPM1182A', holder: 'Suresh Mehta',   relation: 'Father', member: 'm1', status: 'Active', linkedBank: 'SBI ••1190' },
    { id: 'p4',  pan: 'DLMPM4408H', holder: 'Kavita Mehta',   relation: 'Mother', member: 'm1', status: 'Active', linkedBank: 'Axis ••6655' },
    // Priya Nair (m2) — 1 PAN
    { id: 'p5',  pan: 'PNRPK8821G', holder: 'Priya Nair',     relation: 'Self',   member: 'm2', status: 'Active', linkedBank: 'HDFC ••5519' },
    // Arjun Shah (m3) — 2 PANs (self + spouse)
    { id: 'p6',  pan: 'ASKHM3310D', holder: 'Arjun Shah',     relation: 'Self',   member: 'm3', status: 'Active', linkedBank: 'ICICI ••7743' },
    { id: 'p7',  pan: 'RSHAH9921K', holder: 'Riya Shah',      relation: 'Spouse', member: 'm3', status: 'Active', linkedBank: 'SBI ••3302' },
    // Sneha Kulkarni (m4) — 1 PAN
    { id: 'p8',  pan: 'SKULK1182J', holder: 'Sneha Kulkarni', relation: 'Self',   member: 'm4', status: 'Active', linkedBank: 'Axis ••1123' },
    // Vikram Iyer (m5) — 2 PANs (self + spouse)
    { id: 'p9',  pan: 'VIYER5530H', holder: 'Vikram Iyer',    relation: 'Self',   member: 'm5', status: 'Active', linkedBank: 'Kotak ••8871' },
    { id: 'p10', pan: 'MIYER2281F', holder: 'Meena Iyer',     relation: 'Spouse', member: 'm5', status: 'Active', linkedBank: 'HDFC ••4432' },
    // Ananya Rao (m6) — 1 PAN
    { id: 'p11', pan: 'ANAYR0091M', holder: 'Ananya Rao',     relation: 'Self',   member: 'm6', status: 'Active', linkedBank: 'Kotak ••6612' },
  ];
  // Total: 11 PANs across 6 members

  // ---------- IPOs ----------
  const ipos = [
    { id: 'i1', name: 'Vimal Agro Industries', short: 'Vimal Agro',   type: 'SME',      status: 'Listed',   band: '₹138–145', lot: 1000, lotValue: 145000, sub: 186.4, open: '12 May', close: '14 May', allotDate: '17 May', listDate: '21 May', listPrice: 214,  listGain: 47.6, sector: 'Agri & Food',   hue: 38,  logo: 'VA' },
    { id: 'i2', name: 'Surya Solar Technologies', short: 'Surya Solar', type: 'SME',     status: 'Listed',   band: '₹92–98',   lot: 1200, lotValue: 117600, sub: 241.7, open: '6 May',  close: '8 May',  allotDate: '12 May', listDate: '15 May', listPrice: 151,  listGain: 54.1, sector: 'Renewables',    hue: 142, logo: 'SS' },
    { id: 'i3', name: 'Kalyani Steelworks',       short: 'Kalyani Steel', type: 'Mainboard', status: 'Listed', band: '₹472–496', lot: 30,  lotValue: 14880,  sub: 64.2,  open: '28 Apr', close: '2 May',  allotDate: '5 May',  listDate: '8 May',  listPrice: 571,  listGain: 15.1, sector: 'Metals',        hue: 220, logo: 'KS' },
    { id: 'i4', name: 'Aanya Pharma',             short: 'Aanya Pharma', type: 'Mainboard', status: 'Listed', band: '₹305–321', lot: 46,  lotValue: 14766,  sub: 38.9,  open: '21 Apr', close: '24 Apr', allotDate: '28 Apr', listDate: '2 May',  listPrice: 358,  listGain: 11.5, sector: 'Pharma',        hue: 320, logo: 'AP' },
    { id: 'i5', name: 'Meghraj Logistics',        short: 'Meghraj Log.', type: 'SME',     status: 'Open',     band: '₹118–124', lot: 1000, lotValue: 124000, sub: 12.4,  open: '2 Jun',  close: '4 Jun',  allotDate: '6 Jun',  listDate: '10 Jun', listPrice: null, listGain: null, sector: 'Logistics',     hue: 16,  logo: 'ML' },
    { id: 'i6', name: 'Nexus Fintech',            short: 'Nexus Fintech', type: 'Mainboard', status: 'Open',  band: '₹540–570', lot: 26,  lotValue: 14820,  sub: 4.1,   open: '3 Jun',  close: '5 Jun',  allotDate: '9 Jun',  listDate: '12 Jun', listPrice: null, listGain: null, sector: 'Fintech',       hue: 200, logo: 'NF' },
    { id: 'i7', name: 'Greenply Modular',         short: 'Greenply',    type: 'SME',      status: 'Upcoming', band: '₹76–80',   lot: 1600, lotValue: 128000, sub: null,  open: '9 Jun',  close: '11 Jun', allotDate: '13 Jun', listDate: '17 Jun', listPrice: null, listGain: null, sector: 'Building Mat.', hue: 110, logo: 'GM' },
    { id: 'i8', name: 'Sapphire Foods Co',        short: 'Sapphire Foods', type: 'Mainboard', status: 'Upcoming', band: '₹680–715', lot: 20, lotValue: 14300, sub: null,  open: '12 Jun', close: '16 Jun', allotDate: '18 Jun', listDate: '21 Jun', listPrice: null, listGain: null, sector: 'QSR',          hue: 4,   logo: 'SF' },
    { id: 'i9', name: 'Indus Valley Cement',      short: 'Indus Cement', type: 'Mainboard', status: 'Closed', band: '₹212–224', lot: 66,  lotValue: 14784,  sub: 22.7,  open: '26 May', close: '28 May', allotDate: '31 May', listDate: '3 Jun',  listPrice: null, listGain: null, sector: 'Cement',        hue: 250, logo: 'IC' },
  ];

  // ---------- Allotments (PAN level, admin marks these) ----------
  // category drives profit pooling:
  //   SME IPOs     → single 'SME' category; all applicants share that pool
  //   Mainboard    → separate pools per category: 'Retail' / 'sHNI' / 'bHNI'
  //                  Retail  ≤ ₹2L application (1 lot)
  //                  sHNI    ₹2L–₹10L (typically 14 lots for Mainboard)
  //                  bHNI    > ₹10L
  // Profit split = netProfit ÷ total PANs applied IN SAME CATEGORY for that IPO.
  // Members who applied in Retail get no share of sHNI allotments, and vice-versa.
  const allotments = [
    // ── Vimal Agro (i1, SME) — all 10 PANs in SME category ──
    // 2 allotted (p1, p3). Gross = 2 × 1000 × ₹69 = ₹1,38,000
    // Net ₹1,17,000 (after 15% STCG + ₹300 brok) ÷ 10 PANs = ₹11,700/PAN
    // Rahul (4 PANs) ₹46,800 | Priya (1) ₹11,700 | Arjun (2) ₹23,400
    // Sneha (1) ₹11,700 | Vikram (1) ₹11,700 | Ananya (1) ₹11,700
    { ipo: 'i1', pan: 'p1',  category: 'SME', holder: 'Rahul Mehta',    status: 'allotted',     shares: 1000, invest: 145000, gain: 69000 },
    { ipo: 'i1', pan: 'p2',  category: 'SME', holder: 'Sonal Mehta',    status: 'not-allotted', shares: 0,    invest: 0,      gain: 0 },
    { ipo: 'i1', pan: 'p3',  category: 'SME', holder: 'Suresh Mehta',   status: 'allotted',     shares: 1000, invest: 145000, gain: 69000 },
    { ipo: 'i1', pan: 'p4',  category: 'SME', holder: 'Kavita Mehta',   status: 'not-allotted', shares: 0,    invest: 0,      gain: 0 },
    { ipo: 'i1', pan: 'p5',  category: 'SME', holder: 'Priya Nair',     status: 'not-allotted', shares: 0,    invest: 0,      gain: 0 },
    { ipo: 'i1', pan: 'p6',  category: 'SME', holder: 'Arjun Shah',     status: 'not-allotted', shares: 0,    invest: 0,      gain: 0 },
    { ipo: 'i1', pan: 'p7',  category: 'SME', holder: 'Riya Shah',      status: 'not-allotted', shares: 0,    invest: 0,      gain: 0 },
    { ipo: 'i1', pan: 'p8',  category: 'SME', holder: 'Sneha Kulkarni', status: 'not-allotted', shares: 0,    invest: 0,      gain: 0 },
    { ipo: 'i1', pan: 'p9',  category: 'SME', holder: 'Vikram Iyer',    status: 'not-allotted', shares: 0,    invest: 0,      gain: 0 },
    { ipo: 'i1', pan: 'p11', category: 'SME', holder: 'Ananya Rao',     status: 'not-allotted', shares: 0,    invest: 0,      gain: 0 },

    // ── Surya Solar (i2, SME) — all 6 PANs in SME category ──
    // 1 allotted (p1). Gross = 1200 × ₹53 = ₹63,600
    // Net ₹54,000 ÷ 6 PANs = ₹9,000/PAN
    // Rahul (4 PANs) ₹36,000 | Priya (1) ₹9,000 | Arjun (1) ₹9,000
    { ipo: 'i2', pan: 'p1',  category: 'SME', holder: 'Rahul Mehta',    status: 'allotted',     shares: 1200, invest: 117600, gain: 63600 },
    { ipo: 'i2', pan: 'p2',  category: 'SME', holder: 'Sonal Mehta',    status: 'not-allotted', shares: 0,    invest: 0,      gain: 0 },
    { ipo: 'i2', pan: 'p3',  category: 'SME', holder: 'Suresh Mehta',   status: 'not-allotted', shares: 0,    invest: 0,      gain: 0 },
    { ipo: 'i2', pan: 'p4',  category: 'SME', holder: 'Kavita Mehta',   status: 'not-allotted', shares: 0,    invest: 0,      gain: 0 },
    { ipo: 'i2', pan: 'p5',  category: 'SME', holder: 'Priya Nair',     status: 'not-allotted', shares: 0,    invest: 0,      gain: 0 },
    { ipo: 'i2', pan: 'p6',  category: 'SME', holder: 'Arjun Shah',     status: 'not-allotted', shares: 0,    invest: 0,      gain: 0 },

    // ── Kalyani Steel (i3, Mainboard) — MIXED categories ──
    // sHNI pool (3 PANs): p1 Rahul, p2 Sonal, p9 Vikram — each applied 14 lots (₹2,08,320)
    //   2 allotted (p1, p2). Gross = 2 × 30 × ₹75 = ₹4,500
    //   Net ₹3,750 (15% STCG ₹675, brok ₹75) ÷ 3 sHNI PANs = ₹1,250/PAN
    //   Rahul (2 sHNI PANs) ₹2,500 | Vikram (1) ₹1,250
    // Retail pool (2 PANs): p5 Priya, p6 Arjun — no allotments → ₹0
    { ipo: 'i3', pan: 'p1',  category: 'sHNI',   holder: 'Rahul Mehta',    status: 'allotted',     shares: 30, invest: 208320, gain: 2250 },
    { ipo: 'i3', pan: 'p2',  category: 'sHNI',   holder: 'Sonal Mehta',    status: 'allotted',     shares: 30, invest: 208320, gain: 2250 },
    { ipo: 'i3', pan: 'p9',  category: 'sHNI',   holder: 'Vikram Iyer',    status: 'not-allotted', shares: 0,  invest: 208320, gain: 0 },
    { ipo: 'i3', pan: 'p5',  category: 'Retail',  holder: 'Priya Nair',     status: 'not-allotted', shares: 0,  invest: 14880,  gain: 0 },
    { ipo: 'i3', pan: 'p6',  category: 'Retail',  holder: 'Arjun Shah',     status: 'not-allotted', shares: 0,  invest: 14880,  gain: 0 },

    // ── Aanya Pharma (i4, Mainboard) — MIXED categories ──
    // sHNI pool (1 PAN): p2 Sonal — allotted. Gross = 46 × ₹37 = ₹1,702
    //   Net ₹1,400 ÷ 1 sHNI PAN = ₹1,400. Rahul retains all (only sHNI applicant).
    // Retail pool (3 PANs): p5 Priya, p6 Arjun, p8 Sneha — no allotments → ₹0
    { ipo: 'i4', pan: 'p2',  category: 'sHNI',   holder: 'Sonal Mehta',    status: 'allotted',     shares: 46, invest: 206724, gain: 1702 },
    { ipo: 'i4', pan: 'p5',  category: 'Retail',  holder: 'Priya Nair',     status: 'not-allotted', shares: 0,  invest: 14766,  gain: 0 },
    { ipo: 'i4', pan: 'p6',  category: 'Retail',  holder: 'Arjun Shah',     status: 'not-allotted', shares: 0,  invest: 14766,  gain: 0 },
    { ipo: 'i4', pan: 'p8',  category: 'Retail',  holder: 'Sneha Kulkarni', status: 'not-allotted', shares: 0,  invest: 14766,  gain: 0 },
  ];

  // ---------- Pool status (computed from allotments; status is admin-managed) ----------
  const pools = [
    { ipo: 'i1', status: 'Distributing' },
    { ipo: 'i2', status: 'Settled' },
    { ipo: 'i3', status: 'Settled' },
    { ipo: 'i4', status: 'Settled' },
  ];

  // ---------- Settlements ----------
  // direction='pay' → Rahul (admin/allottee) pays this member their category share.
  // category field = which pool the share came from (SME / Retail / sHNI / bHNI).
  // For i4: Rahul is the only sHNI applicant — no payouts needed.
  const settlements = [
    // i1 — Vimal Agro (SME): ₹11,700/PAN × 10 PANs = ₹1,17,000
    { id: 's1', ipo: 'i1', member: 'm2', category: 'SME',  pans: 1, amount: 11700,  status: 'Paid',    date: '22 May' },
    { id: 's2', ipo: 'i1', member: 'm3', category: 'SME',  pans: 2, amount: 23400,  status: 'Paid',    date: '22 May' },
    { id: 's3', ipo: 'i1', member: 'm4', category: 'SME',  pans: 1, amount: 11700,  status: 'Pending', date: null },
    { id: 's4', ipo: 'i1', member: 'm5', category: 'SME',  pans: 1, amount: 11700,  status: 'Pending', date: null },
    { id: 's5', ipo: 'i1', member: 'm6', category: 'SME',  pans: 1, amount: 11700,  status: 'Paid',    date: '22 May' },
    // i2 — Surya Solar (SME): ₹9,000/PAN × 6 PANs = ₹54,000
    { id: 's6', ipo: 'i2', member: 'm2', category: 'SME',  pans: 1, amount: 9000,   status: 'Paid',    date: '16 May' },
    { id: 's7', ipo: 'i2', member: 'm3', category: 'SME',  pans: 1, amount: 9000,   status: 'Paid',    date: '16 May' },
    // i3 — Kalyani Steel (sHNI only): ₹1,250/PAN × 3 sHNI PANs = ₹3,750
    //        Retail pool had 0 allotments — no payouts for Retail applicants
    { id: 's8', ipo: 'i3', member: 'm5', category: 'sHNI', pans: 1, amount: 1250,   status: 'Paid',    date: '9 May' },
    // i4 — Aanya Pharma: Rahul is sole sHNI applicant → retains all ₹1,400; no payouts
  ];

  // ---------- Dashboard KPIs ----------
  const kpis = {
    applied: 25,
    allotments: 5,
    allotRate: 20.0,
    invested: 4826796,
    profit: 121452,
    pending: 2,
  };

  const monthlyProfit = [
    { m: 'Dec', v: 0 }, { m: 'Jan', v: 0 }, { m: 'Feb', v: 9200 },
    { m: 'Mar', v: 0 }, { m: 'Apr', v: 1400 }, { m: 'May', v: 57000 }, { m: 'Jun', v: 3750 },
  ];
  const smeVsMain = { sme: 117000, mainboard: 5150 };
  const allotHistory = [
    { m: 'Feb', applied: 2, allot: 1 }, { m: 'Mar', applied: 3, allot: 0 },
    { m: 'Apr', applied: 4, allot: 1 }, { m: 'May', applied: 16, allot: 3 }, { m: 'Jun', applied: 5, allot: 2 },
  ];

  window.DB = {
    fmtINR, initials,
    members, pans, ipos, allotments, pools, settlements,
    kpis, monthlyProfit, smeVsMain, allotHistory,
    member: (id) => members.find(m => m.id === id),
    ipo:    (id) => ipos.find(i => i.id === id),
    pan:    (id) => pans.find(p => p.id === id),
  };
})();
