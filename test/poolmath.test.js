// Money invariants for src/db.js. Run with:  node test/poolmath.test.js
//
// The app has no build step and no test runner, so this is deliberately plain
// Node with zero dependencies: it evaluates db.js in a VM context with a stub
// `window` (nothing hits the network at load time -- loadDB is only called
// explicitly, against a stubbed Supabase client) and asserts the properties
// that, when they broke, silently paid members the wrong amount.
//
// Exits non-zero on any failure.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const win = { localStorage: { getItem: () => null, setItem: () => {} } };
const sandbox = { window: win, localStorage: win.localStorage, console, document: { addEventListener(){} } };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'db.js'), 'utf8'), sandbox, { filename: 'db.js' });

const { PoolMath, rowGain } = win;

let failures = 0;
function check(name, cond, detail) {
  if (cond) { console.log('  PASS  ' + name); }
  else { failures++; console.log('  FAIL  ' + name + (detail ? '\n        ' + detail : '')); }
}
function section(s) { console.log('\n' + s); }

const row = (id, status, gain) => ({ id, status, gain, category: 'Retail', ipo: 'i1', pan: 'p' + id });

// ── 1.1  not_allotted rows must not contribute profit ────────────────────────
section('1.1  phantom profit from not_allotted rows');
{
  // The exact reported flow: "All got" filled a sell price on 4 rows, then the
  // admin corrected one PAN to not_allotted but its gain survived in the data.
  const cats = [row(1,'allotted',10000), row(2,'allotted',10000),
                row(3,'allotted',10000), row(4,'not_allotted',10000)];
  const m = PoolMath.category(cats, 0, 0);
  check('gross counts only allotted rows', m.gross === 30000, 'gross=' + m.gross + ' expected 30000');
  check('divisor still counts every applicant', m.total === 4, 'total=' + m.total);
  check('perPan splits winners across all applicants', m.perPan === 7500, 'perPan=' + m.perPan);

  const allNone = [row(1,'not_allotted',10000), row(2,'not_allotted',5000)];
  check('nobody allotted => zero pool', PoolMath.category(allNone, 15, 0).net === 0);
}

// ── remainder invariant (pre-existing guarantee — must not regress) ──────────
section('remainder distribution (must not regress)');
{
  for (const [n, gross] of [[3, 10000], [7, 12345], [18, 99999], [11, 1]]) {
    const rows = Array.from({ length: n }, (_, i) => row(i + 1, 'allotted', i === 0 ? gross : 0));
    const m = PoolMath.category(rows, 15, 0);
    const amounts = PoolMath.panAmounts(rows, 15, 0);
    const sum = Object.values(amounts).reduce((a, b) => a + b, 0);
    check(`n=${n} gross=${gross}: per-PAN amounts sum exactly to net (${m.net})`, sum === m.net,
      'sum=' + sum + ' net=' + m.net);
    const spread = Math.max(...Object.values(amounts)) - Math.min(...Object.values(amounts));
    check(`n=${n}: no PAN differs by more than 1 rupee`, spread <= 1, 'spread=' + spread);
  }
}

// ── 1.5  losses are visible per PAN but never distributed as a pay-in ───────
section('1.5  loss handling');
{
  check('rowGain reports a real loss', rowGain('allotted', 90, 100, 50) === -500,
    'got ' + rowGain('allotted', 90, 100, 50));
  check('rowGain is zero for a not_allotted row with a stale sell price',
    rowGain('not_allotted', 150, 100, 50) === 0);
  check('rowGain is zero for a pending row', rowGain('pending', 150, 100, 50) === 0);
  check('rowGain rounds a fractional sell price', rowGain('allotted', 100.5, 100, 3) === 2,
    'got ' + rowGain('allotted', 100.5, 100, 3));

  const losing = [row(1,'allotted',-5000), row(2,'allotted',-3000)];
  const m = PoolMath.category(losing, 15, 0);
  check('a losing pool reports its true gross', m.gross === -8000, 'gross=' + m.gross);
  check('a losing pool never distributes a negative amount', m.net === 0, 'net=' + m.net);
  check('no STCG is charged on a loss', m.stcgAmt === 0, 'stcg=' + m.stcgAmt);
  const amounts = PoolMath.panAmounts(losing, 15, 0);
  check('no PAN is asked to pay in', Object.values(amounts).every(v => v >= 0));
}

// ── STCG still applies normally on a profit ─────────────────────────────────
section('STCG on a profitable pool');
{
  const m = PoolMath.category([row(1,'allotted',100000), row(2,'allotted',0)], 15, 0);
  check('15% STCG on 100000 gross', m.stcgAmt === 15000, 'stcg=' + m.stcgAmt);
  check('net = gross - stcg', m.net === 85000, 'net=' + m.net);
}

// ── allotted-PAN bonus (kept personally, on top of the equal pool share) ────
section('allotted-PAN bonus');
{
  const panToMember = (panId) => ({ p1: 'm1', p2: 'm2', p3: 'm3' })[panId];

  // Backward compatibility: omitting bonusRate, or passing 0, must reproduce
  // today's numbers exactly -- this is the default and must never regress.
  const rows0 = [row(1, 'allotted', 2250), row(2, 'allotted', 31500), row(3, 'not_allotted', 0)];
  const noArg  = PoolMath.category(rows0, 15, 0);
  const zero   = PoolMath.category(rows0, 15, 0, 0);
  check('omitting bonusRate matches explicit 0', noArg.net === zero.net,
    'noArg.net=' + noArg.net + ' zero.net=' + zero.net);
  check('bonusRate=0 sets bonusTotal=0', zero.bonusTotal === 0);

  // The exact worked example: ₹100 gross, 20% STCG -> ₹80 after tax, 5% of
  // that (₹4) kept by the allottee, ₹76 into the pool.
  const hundred = [row(1, 'allotted', 100)];
  const worked = PoolMath.category(hundred, 20, 0, 5);
  check('worked example: afterTax=80', worked.afterTax === 80, 'got ' + worked.afterTax);
  check('worked example: bonusTotal=4 (5% of 80)', worked.bonusTotal === 4, 'got ' + worked.bonusTotal);
  check('worked example: net=76 (goes to the pool)', worked.net === 76, 'got ' + worked.net);

  // Multi-PAN worked example (Kalyani Steel numbers from this session):
  // Rao ₹2,250, Spouse ₹31,500 allotted; Father not allotted. STCG 20%, bonus 5%.
  const kalyani = [row(1, 'allotted', 2250), row(2, 'allotted', 31500), row(3, 'not_allotted', 0)];
  const km = PoolMath.category(kalyani, 20, 0, 5);
  check('gross=33750',   km.gross === 33750,   'got ' + km.gross);
  check('afterTax=27000 (20% STCG)', km.afterTax === 27000, 'got ' + km.afterTax);
  check('bonusTotal=1350 (5% of 27000)', km.bonusTotal === 1350, 'got ' + km.bonusTotal);
  check('net=25650 (goes to the pool)', km.net === 25650, 'got ' + km.net);

  const bonuses = PoolMath.panBonuses(kalyani, 20, 0, 5);
  check('bonus pro-rata by gain: Rao ~90',    bonuses[1] === 90,   'got ' + bonuses[1]);
  check('bonus pro-rata by gain: Spouse ~1260', bonuses[2] === 1260, 'got ' + bonuses[2]);
  check('not-allotted PAN gets no bonus', bonuses[3] === 0, 'got ' + bonuses[3]);
  check('bonuses sum EXACTLY to bonusTotal (largest-remainder guarantee)',
    Object.values(bonuses).reduce((a, b) => a + b, 0) === km.bonusTotal,
    'sum=' + Object.values(bonuses).reduce((a, b) => a + b, 0) + ' bonusTotal=' + km.bonusTotal);

  const memberBonuses = PoolMath.memberBonuses(kalyani, 20, 0, 5, panToMember);
  check('memberBonuses aggregates by member correctly',
    memberBonuses.m1 === 90 && memberBonuses.m2 === 1260 && memberBonuses.m3 === 0,
    JSON.stringify(memberBonuses));

  // The pool split (net) must still sum exactly across all applicants,
  // remainder rounding unaffected by the bonus carve-out.
  const amounts = PoolMath.panAmounts(kalyani, 20, 0, 5);
  check('per-PAN pool amounts still sum exactly to net',
    Object.values(amounts).reduce((a, b) => a + b, 0) === km.net,
    'sum=' + Object.values(amounts).reduce((a, b) => a + b, 0) + ' net=' + km.net);

  // A losing category must never produce a positive bonus.
  const losing = [row(1, 'allotted', -5000)];
  const lm = PoolMath.category(losing, 15, 0, 5);
  check('a losing pool has no bonus (afterTax floors at 0)', lm.bonusTotal === 0, 'got ' + lm.bonusTotal);

  // Many small PANs: bonus proportions must still sum exactly (largest-
  // remainder correctness at scale, not just a 2-PAN toy example).
  const many = Array.from({ length: 7 }, (_, i) => row(i + 1, 'allotted', (i + 1) * 137));
  const mm = PoolMath.category(many, 12.5, 0, 5);
  const manyBonuses = PoolMath.panBonuses(many, 12.5, 0, 5);
  check('7-PAN bonus split sums exactly to bonusTotal',
    Object.values(manyBonuses).reduce((a, b) => a + b, 0) === mm.bonusTotal,
    'sum=' + Object.values(manyBonuses).reduce((a, b) => a + b, 0) + ' bonusTotal=' + mm.bonusTotal);
}

// ── registrar paste parser ──────────────────────────────────────────────────
section('parseAllotmentPaste (bulk allotment import)');
{
  const p = win.parseAllotmentPaste;
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  check('tab-separated, header ignored',
    eq(p('PAN\tShares\nABCDE1234F\t30\nFGHIJ5678K\t0').rows,
       [{ pan: 'ABCDE1234F', shares: 30 }, { pan: 'FGHIJ5678K', shares: 0 }]));
  check('comma-separated', eq(p('ABCDE1234F,30').rows, [{ pan: 'ABCDE1234F', shares: 30 }]));
  check('pipe-separated',  eq(p('ABCDE1234F|30|allotted').rows, [{ pan: 'ABCDE1234F', shares: 30 }]));
  check('lower-case PAN is normalised',
    eq(p('abcde1234f 15').rows, [{ pan: 'ABCDE1234F', shares: 15 }]));
  check('thousands separator is one number, not two',
    eq(p('Rao ABCDE1234F 1,200 Allotted').rows, [{ pan: 'ABCDE1234F', shares: 1200 }]));
  check('a leading serial or date does not win over the share count',
    eq(p('1  12/05/2026  ABCDE1234F  1,200').rows, [{ pan: 'ABCDE1234F', shares: 1200 }]));
  check('shares before the PAN still parse',
    eq(p('30 ABCDE1234F').rows, [{ pan: 'ABCDE1234F', shares: 30 }]));
  check('no number means not allotted',
    eq(p('ABCDE1234F Not Allotted').rows, [{ pan: 'ABCDE1234F', shares: 0 }]));
  check('lines without a PAN are skipped, not guessed at',
    eq(p('Allotment Status\n\nABCDE1234F 30\nTotal: 30 shares').rows,
       [{ pan: 'ABCDE1234F', shares: 30 }]));
  check('a repeated PAN is reported once (first wins)',
    eq(p('ABCDE1234F 30\nABCDE1234F 60').rows, [{ pan: 'ABCDE1234F', shares: 30 }]));
  check('empty input is empty output', eq(p('').rows, []) && eq(p(null).rows, []));
}

// ── 1.4  brokerage is charged exactly once per IPO ──────────────────────────
section('1.4  brokerage charged once per IPO, not once per category');
{
  // brokerageByCategory reads the module-level _allotments, so drive it through
  // the real loader path: stub Supabase with a Mainboard IPO spanning all three
  // categories, then load.
  const seedIpo = { id: 'i1', name: 'Kalyani Steel', short_name: 'Kalyani', type: 'Mainboard',
                    status: 'Listed', band_high: 496, lot_size: 30, lot_value: 14880 };
  const seedSme = { id: 'i2', name: 'Vimal Agro', short_name: 'Vimal', type: 'SME',
                    status: 'Listed', band_high: 145, lot_size: 1000, lot_value: 145000 };
  const apps = [
    { id: 'a1', ipo_id: 'i1', pan_id: 'p1', category: 'Retail', lots: 1 },
    { id: 'a2', ipo_id: 'i1', pan_id: 'p2', category: 'sHNI',   lots: 14 },
    { id: 'a3', ipo_id: 'i1', pan_id: 'p3', category: 'bHNI',   lots: 68 },
    { id: 'a4', ipo_id: 'i2', pan_id: 'p1', category: 'SME',    lots: 1 },
  ];
  const allots = [
    { id: 'al1', application_id: 'a1', status: 'allotted', shares: 30,   gain: 30000, sell_price: 1496, applications: apps[0] },
    { id: 'al2', application_id: 'a2', status: 'allotted', shares: 420,  gain: 50000, sell_price: 1496, applications: apps[1] },
    { id: 'al3', application_id: 'a3', status: 'allotted', shares: 2040, gain: 20000, sell_price: 1496, applications: apps[2] },
    { id: 'al4', application_id: 'a4', status: 'allotted', shares: 1000, gain: 40000, sell_price: 185,  applications: apps[3] },
  ];
  const tables = {
    members: [{ id: 'm1', name: 'A', is_admin: true }],
    pan_accounts: [{ id: 'p1', member_id: 'm1', pan: 'AAAAA1111A', holder: 'A' },
                   { id: 'p2', member_id: 'm1', pan: 'AAAAA2222A', holder: 'B' },
                   { id: 'p3', member_id: 'm1', pan: 'AAAAA3333A', holder: 'C' }],
    ipos: [seedIpo, seedSme], applications: apps, allotments: allots,
    profit_pools: [], settlements: [],
  };
  const qb = (name) => {
    const p = Promise.resolve({ data: tables[name] || [], error: null });
    p.select = () => qb(name); p.order = () => qb(name); p.eq = () => qb(name);
    p.in = () => qb(name); p.limit = () => qb(name);
    return p;
  };
  win.sb = { from: qb, auth: { getUser: async () => ({ data: { user: null } }) } };

  return win.loadDB().then(() => {
    const BROK = 900;
    win.localStorage.getItem = (k) => (k === 'brokerage' ? String(BROK) : k === 'stcg' ? '15' : null);

    const split = win.brokerageByCategory('i1', BROK);
    const parts = Object.values(split);
    check('split covers all three categories', Object.keys(split).length === 3,
      JSON.stringify(split));
    check('the parts sum to exactly one flat charge',
      parts.reduce((a, b) => a + b, 0) === BROK, JSON.stringify(split));
    check('the biggest-gross category carries the biggest share',
      split.sHNI > split.Retail && split.Retail > split.bHNI, JSON.stringify(split));

    // Total cost across the IPO must equal STCG + exactly one brokerage.
    const cats = ['Retail', 'sHNI', 'bHNI'];
    let gross = 0, net = 0;
    cats.forEach(c => {
      const rows = win.DB.allotments.filter(a => a.ipo === 'i1' && a.category === c);
      const r = win.ratesForCategory('i1', c);
      const m = PoolMath.category(rows, r.stcg, r.brok);
      gross += m.gross; net += m.net;
    });
    const cost = gross - net;
    const expected = Math.round(30000 * 0.15) + Math.round(50000 * 0.15) + Math.round(20000 * 0.15) + BROK;
    check('total cost = STCG + ONE brokerage (was 3x before)', cost === expected,
      'cost=' + cost + ' expected=' + expected + ' (3x brokerage would be ' + (expected + 2 * BROK) + ')');

    const i1Allots = win.DB.allotments.filter(a => a.ipo === 'i1');
    check('groupNetProfit agrees with the per-category sum',
      win.groupNetProfit(i1Allots) === net,
      'groupNetProfit=' + win.groupNetProfit(i1Allots) + ' perCategorySum=' + net);

    // The dashboard's category charts slice by category ACROSS IPOs; those
    // slices must still add up to the whole-book total, or the report and the
    // KPI row disagree.
    const whole = win.groupNetProfit(win.DB.allotments);
    const bySlice = ['Retail', 'sHNI', 'bHNI', 'SME']
      .reduce((s, c) => s + win.groupNetProfit(win.DB.allotments.filter(a => a.category === c)), 0);
    check('per-category slices sum to the whole-book net', whole === bySlice,
      'whole=' + whole + ' slices=' + bySlice);

    // A single-category (SME) IPO must be unaffected, and the split must scope
    // to one IPO rather than bleeding across them.
    const smeSplit = win.brokerageByCategory('i2', BROK);
    check('single-category IPO bears the whole flat charge',
      Object.keys(smeSplit).length === 1 && smeSplit.SME === BROK, JSON.stringify(smeSplit));
    check('the split is scoped to one IPO', split.SME === undefined && smeSplit.Retail === undefined,
      JSON.stringify({ i1: split, i2: smeSplit }));

    // ── SME category split (SEBI ICDR amendment, effective 1 Jul 2025) ──────
    // SME IPOs now split applicants into Individual/S-HNI/B-HNI exactly like
    // Mainboard, but the Individual/NII boundary is a FIXED lot count (2 lots
    // max / 3 lots min), not value-based like Mainboard's Retail/NII boundary.
    // Verified against a real SME lot-size table: lot value ₹1,20,400 gives
    // Individual=2 lots (₹2,40,800), S-HNI 3-8 lots (₹3,61,200-₹9,63,200),
    // B-HNI from 9 lots (₹10,83,600) -- the ₹10L bHNI split stays value-based.
    section('SME category thresholds (SEBI, 1 Jul 2025)');
    const smeLotValue = 120400;
    check('SME sHNI floor is the fixed 3-lot minimum, not the value-based 2',
      win.catMinLots('sHNI', smeLotValue, true) === 3,
      'got ' + win.catMinLots('sHNI', smeLotValue, true));
    check('Mainboard sHNI floor stays value-based (2 lots here)',
      win.catMinLots('sHNI', smeLotValue, false) === 2,
      'got ' + win.catMinLots('sHNI', smeLotValue, false));
    check('bHNI floor is identical on both boards (value-based, ₹10L)',
      win.catMinLots('bHNI', smeLotValue, true) === 9 && win.catMinLots('bHNI', smeLotValue, true) === win.catMinLots('bHNI', smeLotValue, false),
      'sme=' + win.catMinLots('bHNI', smeLotValue, true) + ' mainboard=' + win.catMinLots('bHNI', smeLotValue, false));
    check('Retail/SME never carries a floor', win.catMinLots('Retail', smeLotValue, true) === 1 && win.catMinLots('SME', smeLotValue, true) === 1);
    // A low-lot-value edge case: the value floor for sHNI could exceed 3 lots;
    // SME must still take the LARGER of the fixed floor and the value floor,
    // never let a cheap lot slip into NII below the ₹2L SEBI requirement.
    check('SME sHNI floor never drops below the value floor either',
      win.catMinLots('sHNI', 50000, true) === Math.max(3, Math.floor(200000/50000)+1),
      'got ' + win.catMinLots('sHNI', 50000, true));

    console.log('\n' + (failures ? failures + ' FAILURE(S)' : 'all invariants hold'));
    process.exit(failures ? 1 : 0);
  });
}

console.log('\n' + (failures ? failures + ' FAILURE(S)' : 'all invariants hold'));
process.exit(failures ? 1 : 0);
