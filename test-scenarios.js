/**
 * IPO Pool — End-to-end test scenarios
 * Run each function in the browser console after logging in.
 * The app must be loaded at the correct URL.
 *
 * Usage:
 *   1. Open the app, log in
 *   2. Open DevTools → Console
 *   3. Paste this entire file and press Enter
 *   4. Then call: await runAllTests()  — OR run individual tests
 */

const TEST = {
  // ── Helpers ──────────────────────────────────────────────────────────────────
  log: (msg, ok = true) => console[ok ? 'log' : 'error'](`%c${ok ? '✓' : '✗'} ${msg}`, `color:${ok ? '#0B8A4B' : '#E5484D'};font-weight:700`),
  assert: (cond, msg) => { TEST.log(msg, !!cond); if (!cond) throw new Error('FAIL: ' + msg); },
  section: (name) => console.log(`%c\n── ${name} ──`, 'color:#2563EB;font-size:14px;font-weight:800'),

  // Track created IDs for cleanup
  created: { member: null, pan: null, ipo: null },

  // ── Scenario 1: Verify DB load ────────────────────────────────────────────────
  async s1_verifyLoad() {
    TEST.section('1. Verify DB load');
    const D = window.DB;
    TEST.assert(D, 'window.DB exists');
    TEST.assert(Array.isArray(D.members),    'members is array');
    TEST.assert(Array.isArray(D.pans),       'pans is array');
    TEST.assert(Array.isArray(D.ipos),       'ipos is array');
    TEST.assert(Array.isArray(D.allotments), 'allotments is array');
    TEST.assert(Array.isArray(D.pools),      'pools is array');
    TEST.assert(Array.isArray(D.settlements),'settlements is array');
    TEST.log(`Members: ${D.members.length}, PANs: ${D.pans.length}, IPOs: ${D.ipos.length}`);
    TEST.log(`Allotments: ${D.allotments.length}, Pools: ${D.pools.length}, Settlements: ${D.settlements.length}`);
    TEST.assert(D.me, 'D.me is set (current user found in members)');
    TEST.log(`Logged in as: ${D.me?.name} (admin=${D.me?.isAdmin})`);
  },

  // ── Scenario 2: Add a test member ─────────────────────────────────────────────
  async s2_addMember() {
    TEST.section('2. Add Member');
    const D = window.DB;
    const before = D.members.length;
    const m = await D.mutations.addMember({
      name: '__Test Member__',
      email: 'testmember+ipo@example.com',
      avatarHue: 180,
      isAdmin: false,
    });
    TEST.assert(m.id, 'addMember returned a member with id');
    TEST.assert(D.members.length === before + 1, 'members count incremented');
    TEST.assert(D.member(m.id)?.name === '__Test Member__', 'member is accessible via D.member()');
    TEST.created.member = m.id;
    TEST.log(`Created member: ${m.name} (id=${m.id})`);
  },

  // ── Scenario 3: Add a PAN to the test member ──────────────────────────────────
  async s3_addPan() {
    TEST.section('3. Add PAN');
    const D = window.DB;
    TEST.assert(TEST.created.member, 'member must exist from s2');
    const before = D.pans.length;
    const p = await D.mutations.addPan({
      memberId: TEST.created.member,
      pan: 'TSTPM9999Z',
      holderName: 'Test Holder',
      relation: 'Self',
      bank: 'HDFC ••0001',
    });
    TEST.assert(p.id, 'addPan returned a pan with id');
    TEST.assert(D.pans.length === before + 1, 'pans count incremented');
    TEST.assert(D.pan(p.id)?.holder === 'Test Holder', 'pan accessible via D.pan()');
    TEST.created.pan = p.id;
    TEST.log(`Created PAN: ${p.pan} (id=${p.id})`);
  },

  // ── Scenario 4: Add a test IPO ────────────────────────────────────────────────
  async s4_addIpo() {
    TEST.section('4. Add IPO');
    const D = window.DB;
    const before = D.ipos.length;
    const ipo = await D.mutations.addIpo({
      name: '__Test SME IPO__',
      shortName: 'TestSME',
      type: 'SME',
      sector: 'Testing',
      status: 'Closed',
      bandLow: 90,
      bandHigh: 100,
      lotSize: 1000,
      lotValue: 100000,
      openDate: '2026-06-01',
      closeDate: '2026-06-03',
      allotDate: '2026-06-05',
      listDate: '2026-06-10',
      hue: 200,
    });
    TEST.assert(ipo.id, 'addIpo returned an ipo with id');
    TEST.assert(D.ipos.length === before + 1, 'ipos count incremented');
    TEST.assert(D.ipo(ipo.id)?.bandHigh === 100, 'bandHigh correctly stored');
    TEST.assert(D.ipo(ipo.id)?.lotSize === 1000, 'lotSize correctly stored');
    TEST.created.ipo = ipo.id;
    TEST.log(`Created IPO: ${ipo.name} (id=${ipo.id})`);
  },

  // ── Scenario 5: Add applications (who applied) ────────────────────────────────
  async s5_addApplications() {
    TEST.section('5. Add Applications (mark who applied)');
    const D = window.DB;
    TEST.assert(TEST.created.ipo, 'ipo must exist from s4');
    TEST.assert(TEST.created.pan, 'pan must exist from s3');
    const me = D.me;
    TEST.assert(me, 'must be logged in');
    const myPans = D.pans.filter(p => p.member === me.id);
    TEST.assert(myPans.length > 0, `current user has PANs (found ${myPans.length})`);

    const rows = [
      { panId: TEST.created.pan, category: 'SME' },
      ...(myPans.length > 0 ? [{ panId: myPans[0].id, category: 'SME' }] : []),
    ];

    const beforeAllots = D.allotments.length;
    await D.mutations.addApplications(TEST.created.ipo, rows);
    const newAllots = D.allotments.filter(a => a.ipo === TEST.created.ipo);
    TEST.assert(newAllots.length === rows.length, `created ${rows.length} allotment rows`);
    TEST.assert(newAllots.every(a => a.status === 'pending'), 'all new allotments are pending');
    TEST.log(`Created ${newAllots.length} application(s) for IPO ${TEST.created.ipo}`);
  },

  // ── Scenario 6: Mark allotment results ────────────────────────────────────────
  async s6_markAllotments() {
    TEST.section('6. Mark Allotment Results');
    const D = window.DB;
    TEST.assert(TEST.created.ipo, 'ipo must exist');
    const allots = D.allotments.filter(a => a.ipo === TEST.created.ipo);
    TEST.assert(allots.length > 0, 'allotments exist for test IPO');

    // Mark the first allotment as allotted, rest as not_allotted
    const changes = allots.map((a, i) => ({
      id: a.id,
      status: i === 0 ? 'allotted' : 'not_allotted',
      shares: i === 0 ? 1000 : 0,
      gain: i === 0 ? 50000 : 0,  // ₹100 sell - ₹100 issue × 1000 shares = ₹50,000 gain assuming sell=150
    }));

    await D.mutations.saveAllotmentChanges(changes);
    const updated = D.allotments.filter(a => a.ipo === TEST.created.ipo);
    const allotted = updated.filter(a => a.status === 'allotted');
    TEST.assert(allotted.length === 1, 'exactly 1 allotment marked as allotted');
    TEST.assert(allotted[0].shares === 1000, 'shares stored correctly');
    TEST.assert(allotted[0].gain === 50000, 'gain stored correctly');
    TEST.log(`Marked allotments: ${allotted.length} allotted, ${updated.length - allotted.length} not_allotted`);
  },

  // ── Scenario 7: KPIs update correctly ─────────────────────────────────────────
  async s7_verifyKpis() {
    TEST.section('7. Verify KPI Computation');
    const D = window.DB;
    const kpis = D.kpis;
    TEST.assert(typeof kpis.applied === 'number',     'applied (unique IPOs) is number');
    TEST.assert(typeof kpis.allotments === 'number',  'allotments count is number');
    TEST.assert(typeof kpis.profit === 'number',      'profit is number');
    TEST.assert(kpis.applied > 0, `applied IPOs = ${kpis.applied} (> 0)`);

    // Verify the unique-IPO fix: applied should be count of unique IPOs, not PANs
    const uniqueIpoIds = new Set(D.allotments.map(a => a.ipo)).size;
    TEST.assert(kpis.applied === uniqueIpoIds, `applied=${kpis.applied} matches unique IPO count=${uniqueIpoIds}`);
    TEST.log(`KPIs: applied=${kpis.applied} IPOs, allotments=${kpis.allotments}, profit=₹${kpis.profit.toLocaleString('en-IN')}`);
  },

  // ── Scenario 8: Pool math ─────────────────────────────────────────────────────
  async s8_verifyPoolMath() {
    TEST.section('8. Verify Pool Math');
    const D = window.DB;
    TEST.assert(TEST.created.ipo, 'ipo must exist');
    const ipoAllots = D.allotments.filter(a => a.ipo === TEST.created.ipo);
    TEST.assert(ipoAllots.length > 0, 'allotments exist for test IPO');

    const gross = ipoAllots.reduce((s, a) => s + (a.gain || 0), 0);
    const stcgRate = parseFloat(localStorage.getItem('stcg') || '15');
    const brok = parseFloat(localStorage.getItem('brokerage') || '0');
    const stcgAmt = Math.round(gross * stcgRate / 100);
    const net = Math.max(0, gross - stcgAmt - brok);
    const total = ipoAllots.length;
    const perPan = total > 0 ? Math.round(net / total) : 0;

    TEST.log(`Pool math: gross=₹${gross.toLocaleString('en-IN')}, STCG=${stcgRate}%=₹${stcgAmt.toLocaleString('en-IN')}, net=₹${net.toLocaleString('en-IN')}, ${total} PANs → ₹${perPan.toLocaleString('en-IN')}/PAN`);
    TEST.assert(gross >= 0, 'gross >= 0');
    TEST.assert(net >= 0,   'net >= 0');
    TEST.assert(net <= gross, 'net <= gross');
  },

  // ── Scenario 9: Finalize payouts (createSettlements) ─────────────────────────
  async s9_finalizePayouts() {
    TEST.section('9. Finalize Payouts');
    const D = window.DB;
    TEST.assert(TEST.created.ipo, 'ipo must exist');
    const ipoAllots = D.allotments.filter(a => a.ipo === TEST.created.ipo);

    const stcgRate = parseFloat(localStorage.getItem('stcg') || '15');
    const brok = parseFloat(localStorage.getItem('brokerage') || '0');

    // Compute what createSettlements will produce
    const catAllots = ipoAllots.filter(a => a.category === 'SME');
    const gross = catAllots.reduce((s, a) => s + (a.gain || 0), 0);
    const net = Math.max(0, gross - Math.round(gross * stcgRate / 100) - brok);
    const perPan = catAllots.length > 0 ? Math.round(net / catAllots.length) : 0;

    if (net <= 0) {
      TEST.log('No net profit to distribute (skipping createSettlements call)', true);
      return;
    }

    // Build rows per member
    const memberShares = {};
    catAllots.forEach(a => {
      const panObj = D.pan(a.pan);
      if (!panObj) return;
      const mid = panObj.member;
      if (!memberShares[mid]) memberShares[mid] = { pans: 0, share: 0 };
      memberShares[mid].pans++;
      memberShares[mid].share += perPan;
    });

    const rows = Object.entries(memberShares).map(([memberId, { pans, share }]) => ({
      memberId, category: 'SME', pans, amount: Math.round(share),
    }));
    TEST.assert(rows.length > 0, `${rows.length} settlement row(s) to create`);

    const before = D.settlements.length;
    await D.mutations.createSettlements(TEST.created.ipo, rows);
    const newSettlements = D.settlements.filter(s => s.ipo === TEST.created.ipo);
    TEST.assert(newSettlements.length >= rows.length, `settlements created (${newSettlements.length})`);
    TEST.assert(newSettlements.every(s => s.status === 'Pending'), 'all new settlements are Pending');
    TEST.created.settlement = newSettlements[0]?.id;
    TEST.log(`Created ${newSettlements.length} settlement(s) for IPO`);
  },

  // ── Scenario 10: Mark settlement paid ────────────────────────────────────────
  async s10_markPaid() {
    TEST.section('10. Mark Settlement Paid');
    const D = window.DB;
    if (!TEST.created.settlement) {
      TEST.log('No settlement created (skipping)', true); return;
    }
    await D.mutations.markSettlementPaid(TEST.created.settlement);
    const s = D.settlements.find(s => s.id === TEST.created.settlement);
    TEST.assert(s?.status === 'Paid', 'settlement marked as Paid');
    TEST.assert(s?.date, `paid_date set to ${s?.date}`);
    TEST.log(`Settlement ${TEST.created.settlement} → Paid on ${s?.date}`);
  },

  // ── Scenario 11: Cleanup test data ───────────────────────────────────────────
  async s11_cleanup() {
    TEST.section('11. Cleanup Test Data');
    const D = window.DB;
    // IPO cascade-deletes applications → allotments → pool → settlements
    if (TEST.created.ipo) {
      await D.mutations.deleteIpo(TEST.created.ipo);
      TEST.assert(!D.ipo(TEST.created.ipo), 'test IPO deleted');
      TEST.log(`Deleted IPO ${TEST.created.ipo}`);
    }
    // PAN before member (FK: pan_accounts → members ON DELETE CASCADE, but delete explicitly to be safe)
    if (TEST.created.pan) {
      // If still in _pans (might have been cascade-deleted if ipo was deleted, pans survive)
      if (D.pan(TEST.created.pan)) {
        await D.mutations.deletePan(TEST.created.pan);
        TEST.assert(!D.pan(TEST.created.pan), 'test PAN deleted');
        TEST.log(`Deleted PAN ${TEST.created.pan}`);
      }
    }
    if (TEST.created.member) {
      await D.mutations.deleteMember(TEST.created.member);
      TEST.assert(!D.member(TEST.created.member), 'test member deleted');
      TEST.log(`Deleted member ${TEST.created.member}`);
    }
  },

  // ── Run all scenarios sequentially ───────────────────────────────────────────
  async runAll() {
    console.clear();
    console.log('%cIPO Pool — Test Scenarios', 'color:#0B8A4B;font-size:18px;font-weight:800');
    console.log('%cRunning all 11 scenarios…', 'color:#5B6472;font-size:13px');
    const start = Date.now();
    const tests = [
      TEST.s1_verifyLoad,
      TEST.s2_addMember,
      TEST.s3_addPan,
      TEST.s4_addIpo,
      TEST.s5_addApplications,
      TEST.s6_markAllotments,
      TEST.s7_verifyKpis,
      TEST.s8_verifyPoolMath,
      TEST.s9_finalizePayouts,
      TEST.s10_markPaid,
      TEST.s11_cleanup,
    ];
    let passed = 0, failed = 0;
    for (const t of tests) {
      try {
        await t.call(TEST);
        passed++;
      } catch (e) {
        console.error('  Error:', e.message);
        failed++;
      }
    }
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`%c\n── Results: ${passed} passed, ${failed} failed (${elapsed}s) ──`,
      `color:${failed ? '#E5484D' : '#0B8A4B'};font-size:15px;font-weight:800`);
    return { passed, failed };
  },
};

// Quick-access shortcuts
window.runAllTests   = () => TEST.runAll();
window.testDB        = TEST;

console.log('%cIPO Pool tests loaded! Run: await runAllTests()', 'color:#0B8A4B;font-weight:700;font-size:14px');
