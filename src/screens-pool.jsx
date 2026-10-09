/* ============================================================
   IPO Pool — Profit Pooling
   SME:        one pool — all applicants share equally per PAN.
   Mainboard:  separate pools per category (Retail / sHNI / bHNI).
               Profit from sHNI allotments splits only among sHNI applicants.
   ============================================================ */

// ── Category display metadata ──────────────────────────────────
const CAT_META = {
  SME:    { label: 'SME',    tone: 'sme',     desc: 'All applicants — single pool', textColor: 'var(--sme)' },
  Retail: { label: 'Retail', tone: 'neutral',  desc: 'Up to ₹2L application (1 lot)', textColor: 'var(--ink-2)' },
  sHNI:   { label: 'sHNI',   tone: 'info',    desc: '₹2L – ₹10L application', textColor: 'var(--info)' },
  bHNI:   { label: 'bHNI',   tone: 'warn',    desc: 'Above ₹10L application', textColor: 'var(--warn)' },
};

// Sortable member-shares table for one category pool. `bonuses` (optional)
// is each member's personal allotted-PAN bonus, kept on top of their equal
// pool share -- shown as its own column only when at least one is non-zero,
// so a pool with no bonus configured renders exactly as before.
function MemberSharesTable({ D, shares, f, bonuses, roles }) {
  const hasBonus = bonuses && Object.values(bonuses).some(b => b > 0);
  const rows = Object.entries(shares || {})
    .map(([mid, row]) => ({ mid, m: D.member(mid), pans: row.pans, share: row.share, bonus: (bonuses && bonuses[mid]) || 0 }))
    .filter(r => r.m);
  const cols = [
    { key: 'member', label: 'Member', align: 'left',   get: r => r.m.name || '' },
    { key: 'pans',   label: 'PANs',   align: 'center', get: r => r.pans || 0, defDir: 'desc' },
    ...(hasBonus ? [{ key: 'bonus', label: 'Bonus', align: 'right', get: r => r.bonus || 0, defDir: 'desc' }] : []),
    { key: 'share',  label: hasBonus ? 'Total' : 'Share', align: 'right', get: r => (r.share || 0) + (r.bonus || 0), defDir: 'desc' },
  ];
  const [sort, onSort] = useSortState('share', 'desc');
  const sorted = sortRows(rows, sort, cols);
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
          {cols.map((c, i) => <SortTh key={c.key} col={c} sort={sort} onSort={onSort} style={{ padding: i === 0 ? '6px 20px' : '6px 8px' }} />)}
        </tr>
      </thead>
      <tbody>
        {sorted.map(({ mid, m, pans, share, bonus }) => (
          <tr key={mid} style={{ borderTop: '1px solid var(--border)', background: m.you ? 'var(--brand-tint)' : 'transparent' }}>
            <td style={{ padding: '10px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar name={m.name} hue={m.avatarHue} size={28} you={m.you} />
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{m.name.split(' ')[0]}{m.you && <span style={{ color: 'var(--brand)', fontWeight: 600 }}> · You</span>}</span>
                  {roles && roles[mid] && (() => {
                    const r = roles[mid];
                    return (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                        {r.allotted && <Badge tone="profit" icon="check" style={{ fontSize: 9.5, padding: '1px 6px' }}>Allotted</Badge>}
                        {r.applied && !r.allotted && <Badge tone="info" icon="pan" style={{ fontSize: 9.5, padding: '1px 6px' }}>Pooled</Badge>}
                        {r.backer && <Badge tone="brand" icon="groups" style={{ fontSize: 9.5, padding: '1px 6px' }}>Backer</Badge>}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </td>
            <td style={{ textAlign: 'center', padding: '10px 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                {Array.from({ length: pans }).map((_, i) => (
                  <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: `hsl(${m.avatarHue} 55% 52%)` }} />
                ))}
              </div>
            </td>
            {hasBonus && (
              <td className="num" style={{ padding: '10px 8px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--warn)' }}>{bonus > 0 ? f(bonus) : '—'}</td>
            )}
            <td className="num" style={{ padding: '10px 20px', textAlign: 'right', fontSize: 14, fontWeight: 800, color: m.you ? 'var(--brand)' : ((share + bonus) < 0 ? 'var(--loss)' : 'var(--profit)') }}>{f(share + bonus)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ProfitPooling({ navigate, id }) {
  const D = window.DB;
  const f = (n, o) => D.fmtINR(n, o);

  const listedPools  = D.pools;
  // Settled pools are hidden from the working strip by default; a toggle reveals
  // them. If every pool is settled, show them so the screen isn't empty.
  const activeTabPools = listedPools.filter(p => p.status !== 'Settled');
  const settledPools   = listedPools.filter(p => p.status === 'Settled');
  const [sel, setSel] = useState(id || activeTabPools[0]?.ipo || listedPools[0]?.ipo);
  const [showSettled, setShowSettled] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalErr,   setFinalErr]   = useState('');
  const [confirmFinal, setConfirmFinal] = useState(false);
  const effectiveShow = showSettled || activeTabPools.length === 0;
  const visiblePools  = effectiveShow ? [...activeTabPools, ...settledPools] : activeTabPools;

  if (!listedPools.length) return (
    <Card pad={32} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
        <Icon name="pool" size={26} color="var(--ink-3)" />
      </div>
      <div style={{ fontSize: 16, fontWeight: 800 }}>No profit pools yet</div>
      <div style={{ fontSize: 13.5, color: 'var(--ink-3)', maxWidth: 360, lineHeight: 1.6 }}>
        Pools are created when you finalize allotments. Go to <strong>IPO Master → eye icon</strong>, mark allotment results for a closed IPO, then return here and click <strong>Finalize payouts</strong>.
      </div>
      <Button variant="primary" icon="settings" onClick={() => navigate('admin')}>Go to Admin Panel</Button>
    </Card>
  );

  const ipo        = D.ipo(sel);
  const pool       = D.pools.find(p => p.ipo === sel);
  const ipoAllots  = D.allotsOfIpo(sel);
  const me         = D.members.find(m => m.you);

  // Once a pool is finalized it carries the rates used at that time, so the
  // math stays identical on every device. Before finalize, preview with the
  // current local settings.
  const rates        = window.ratesForIpo(sel);
  const stcgRate     = rates.stcg;
  const brokerageAmt = rates.brok;
  const bonusRate    = rates.bonus;

  // Unique categories in this IPO's allotments (order: SME, Retail, sHNI, bHNI)
  const CAT_ORDER  = ['SME', 'Retail', 'sHNI', 'bHNI'];
  const categories = CAT_ORDER.filter(c => ipoAllots.some(a => a.category === c));

  // Per-category math. Member shares split net profit equally per PAN APPLIED
  // (not per allottee): every applicant in a category shares in the profit from
  // that category's allotments, so someone with 2 PANs in sHNI gets 2× the
  // perPan share. PoolMath distributes the rounding remainder so the member
  // shares sum EXACTLY to the category net.
  //
  // memberBonuses is a SEPARATE, personal reward on top of the equal share:
  // whoever actually got allotted keeps bonusRate% of their own after-tax gain
  // for themselves before the rest is even pooled. It is added to, never
  // instead of, memberShares.
  const panToMember = (panId) => { const p = D.pan(panId); return p ? p.member : null; };
  const catData = categories.map(cat => {
    const catAllots = ipoAllots.filter(a => a.category === cat);
    // This category's share of the IPO's single flat brokerage charge, not the
    // whole charge again — see ratesForCategory.
    const cr = window.ratesForCategory(sel, cat);
    const math = window.PoolMath.category(catAllots, cr.stcg, cr.brok, cr.bonus);
    const memberShares  = window.PoolMath.memberShares(catAllots, cr.stcg, cr.brok, panToMember, cr.bonus);
    const memberBonuses = window.PoolMath.memberBonuses(catAllots, cr.stcg, cr.brok, cr.bonus, panToMember);
    return { cat, catAllots, ...math, brok: cr.brok, bonusRate: cr.bonus, memberShares, memberBonuses };
  });

  // Your combined share across ALL categories (pool share + personal bonus)
  // SME IPOs split differently (combined lot/head pool with per-PAN opt-out),
  // so rebuild each category's member shares from the SAME payload Finalize will
  // write — PoolMath.smeShares via buildFinalizePayload — so the preview matches
  // the actual payout to the rupee. Mainboard keeps the per-category equal split.
  const isSME = ipo?.type === 'SME';
  const smeMemberShares = {}, smeMemberBonuses = {};
  // Always rebuild each category's member shares from the SAME payload Finalize
  // writes (window.buildFinalizePayload), so the preview matches the created
  // ledger to the rupee for EVERY IPO type. This payload is funding-aware: a
  // funded application's pool share goes to the PANs that funded it, not just
  // the holder — so for a mainboard IPO with a funding group the preview now
  // shows the funders as recipients instead of the pre-funding holder split.
  {
    const payload = window.buildFinalizePayload(sel);
    const byCat = {};
    payload.rows.forEach(r => { (byCat[r.category] = byCat[r.category] || {})[r.memberId] = r; });
    catData.forEach(d => {
      const ms = {}, mb = {};
      Object.keys(byCat[d.cat] || {}).forEach(mid => {
        const r = byCat[d.cat][mid];
        ms[mid] = { pans: r.pans, share: r.amount - r.bonusAmount };
        mb[mid] = r.bonusAmount;
      });
      d.memberShares = ms;
      d.memberBonuses = mb;
    });
    // Combined pool payouts (one row per member, summed across categories) —
    // SME shares profit across the whole opted-in pool, so a member who applied
    // in Retail can still receive a share of bHNI profit. The per-category cards
    // show where profit was GENERATED; this shows who actually RECEIVES it.
    if (isSME) {
      payload.rows.forEach(r => {
        if (!smeMemberShares[r.memberId]) smeMemberShares[r.memberId] = { pans: 0, share: 0 };
        smeMemberShares[r.memberId].pans  += r.pans;
        smeMemberShares[r.memberId].share += (r.amount - r.bonusAmount);
        smeMemberBonuses[r.memberId] = (smeMemberBonuses[r.memberId] || 0) + r.bonusAmount;
      });
    }
  }

  // Why each member is in the SME payout (allotted / pooled from own application
  // / backer via funding) — drives the "source" badges in the Member payouts
  // table so it's clear where each person's share came from.
  const memberRoles = isSME ? window.memberPoolRoles(sel) : {};

  const myPoolShare = catData.reduce((s, d) => s + (d.memberShares[me?.id]?.share || 0), 0);
  const myBonus     = catData.reduce((s, d) => s + (d.memberBonuses[me?.id] || 0), 0);
  const myTotal     = myPoolShare + myBonus;
  const myPanCount  = catData.reduce((s, d) => s + (d.memberShares[me?.id]?.pans  || 0), 0);

  // Overall summary. totalNet is the pool-only amount left to be split
  // equally; totalBonus is what's carved out and paid directly to allottees;
  // together they are the IPO's whole realised profit (matches groupNetProfit).
  const totalPans     = ipoAllots.length;
  const totalAllotted = ipoAllots.filter(a => a.status === 'allotted').length;
  const totalNet      = catData.reduce((s, d) => s + d.net, 0);
  const totalBonus    = catData.reduce((s, d) => s + d.bonusTotal, 0);

  // Build settlement rows and save to Supabase. Delegates the actual row/
  // panRow computation to window.buildFinalizePayload (db.js) -- the same
  // function the Settings screen's backfill repair reuses for every
  // historical IPO -- so this screen's live Finalize can never compute a
  // different payload than that repair does.
  const finalizePayouts = async () => {
    setFinalizing(true); setFinalErr('');
    try {
      const payload = window.buildFinalizePayload(sel);
      // No payable rows AND nothing allotted → results aren't in yet, block.
      // No payable rows but shares WERE allotted → the IPO simply made no
      // profit (sold at cost); finalizing with an empty payload is allowed and
      // marks the pool settled so it leaves the active list.
      if (payload.rows.length === 0 && totalAllotted === 0) {
        setFinalErr('Nothing to distribute yet — mark the allotment results first.'); setFinalizing(false); return;
      }
      await D.mutations.createSettlements(sel, payload.rows, payload.rates, payload.panRows);
      navigate('settlement', { id: sel });
    } catch (e) {
      setFinalErr(e.message || 'Failed to save settlements.');
      setFinalizing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* IPO selector pills */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2, alignItems: 'center' }}>
        {listedPools.length > 8 && (
          <JumpToIpo pools={listedPools} value={sel} onChange={ipoId => {
            if (settledPools.some(p => p.ipo === ipoId)) setShowSettled(true);
            setSel(ipoId);
          }} />
        )}
        {stripPools(visiblePools, sel).map(p => {
          const ip = D.ipo(p.ipo);
          const active = p.ipo === sel;
          return (
            <button key={p.ipo} onClick={() => setSel(p.ipo)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 'var(--r-md)', flexShrink: 0,
              border: '1px solid', borderColor: active ? 'var(--brand)' : 'var(--border)',
              background: active ? 'var(--brand-tint)' : 'var(--surface)', cursor: 'pointer',
              opacity: p.status === 'Settled' ? 0.72 : 1,
            }}>
              <IpoLogo ipo={ip} size={30} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--brand)' : 'var(--ink)' }}>{ip.short}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', display: 'flex', gap: 4, marginTop: 2 }}>
                  <Badge tone={ip.type === 'SME' ? 'sme' : 'mainboard'} style={{ fontSize: 10 }}>{ip.type}</Badge>
                  <Badge tone={p.status === 'Settled' ? 'profit' : 'warn'} style={{ fontSize: 10 }}>{p.status}</Badge>
                </div>
              </div>
            </button>
          );
        })}
        {settledPools.length > 0 && activeTabPools.length > 0 && (
          <Button variant="ghost" size="sm" style={{ flexShrink: 0 }}
            onClick={() => {
              const next = !showSettled;
              setShowSettled(next);
              if (!next && settledPools.some(p => p.ipo === sel)) setSel(activeTabPools[0]?.ipo);
            }}>
            {effectiveShow ? 'Hide settled' : `Show settled (${settledPools.length})`}
          </Button>
        )}
      </div>

      {/* Settled banner */}
      {pool?.status === 'Settled' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', background: 'var(--profit-soft)', borderRadius: 'var(--r-lg)', border: '1px solid var(--profit)' }}>
          <Icon name="check" size={18} color="var(--profit)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--profit)' }}>This pool is fully settled</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>All payouts have been distributed. This pool is read-only.</div>
          </div>
          <Button variant="ghost" size="sm" icon="ledger" onClick={() => navigate('settlement', { id: sel })}>View ledger</Button>
        </div>
      )}

      {/* Your combined share */}
      {myTotal !== 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'var(--brand-tint)', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--brand)' }}>
          <Avatar name={me.name} hue={me.avatarHue} size={44} you />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>Your combined share across all categories</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
              {catData.filter(d => d.memberShares[me?.id]).map(d => {
                const r = d.memberShares[me.id];
                // SME splits by lots/head, not a flat per-PAN figure, so show
                // the member's actual share for the category instead of "× perPan".
                if (isSME) return `${CAT_META[d.cat]?.label || d.cat}: ${f(r.share)}${r.pans > 1 ? ` (${r.pans} PANs)` : ''}`;
                // The remainder rupees go one each to the first few PANs, so a
                // share can be ₹1 above pans × perPan — say so rather than
                // show "1 PAN × ₹217" next to a ₹218 total.
                const extra = (r.share || 0) - r.pans * d.perPan;
                return `${CAT_META[d.cat]?.label || d.cat}: ${r.pans} PAN${r.pans > 1 ? 's' : ''} × ${f(d.perPan)}`
                  + (extra !== 0 ? ` + ${f(extra)} rounding` : '');
              }).join(' · ')}
              {myBonus > 0 && <span style={{ color: 'var(--warn)', fontWeight: 700 }}> · +{f(myBonus)} allotted-PAN bonus</span>}
            </div>
          </div>
          <div className="num" style={{ fontSize: 30, fontWeight: 800, color: 'var(--brand)' }}>{f(myTotal)}</div>
        </div>
      )}

      {/* Overall KPI summary */}
      <div className="pool-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'PANs applied',  value: totalPans,                       icon: 'pan',    tone: 'neutral' },
          { label: 'Allotted',      value: totalAllotted,                   icon: 'check',  tone: 'info' },
          { label: 'Net profit',    value: f(totalNet + totalBonus, { compact: true }), icon: 'trend', tone: (totalNet + totalBonus) >= 0 ? 'profit' : 'loss' },
          { label: 'Your share',    value: f(myTotal),                      icon: 'wallet', tone: 'brand' },
        ].map(s => (
          <Card key={s.label} pad={16} style={{ background: s.tone === 'brand' ? 'var(--brand-tint)' : 'var(--surface)', borderColor: s.tone === 'brand' ? 'var(--brand)' : 'var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: s.tone === 'brand' ? 'var(--brand)' : 'var(--bg)', color: s.tone === 'brand' ? '#fff' : 'var(--ink-2)', display: 'grid', placeItems: 'center' }}>
                <Icon name={s.icon} size={15} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>{s.label}</span>
            </div>
            <div className="num" style={{ fontSize: 22, fontWeight: 800, color: s.tone === 'profit' ? 'var(--profit)' : s.tone === 'loss' ? 'var(--loss)' : s.tone === 'brand' ? 'var(--brand)' : 'var(--ink)' }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Total profit summary band */}
      {totalNet !== 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', background: totalNet > 0 ? 'var(--profit-soft)' : 'var(--loss-soft)', borderRadius: 'var(--r-md)', border: `1px solid ${totalNet > 0 ? 'var(--profit)' : 'var(--loss)'}` }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink-2)' }}>{totalNet > 0 ? 'Total net profit across all categories' : 'Total net loss across all categories'}</span>
          <span className="num" style={{ fontSize: 20, fontWeight: 800, color: totalNet > 0 ? 'var(--profit)' : 'var(--loss)' }}>{f(totalNet)}</span>
        </div>
      )}

      {/* No profit at all: allotted shares sold at (or below) cost, nothing to
          distribute. Make that explicit instead of leaving empty category cards
          that read like something is pending. */}
      {totalNet === 0 && totalBonus === 0 && totalAllotted > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
          <Icon name="info" size={18} color="var(--ink-3)" />
          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
            <strong>No profit on this IPO.</strong> The allotted shares sold at cost, so there's nothing to distribute or settle here.
          </div>
        </div>
      )}

      {/* SME split explainer */}
      {isSME && (
        <div style={{ display: 'flex', gap: 10, padding: '11px 16px', background: 'var(--info-soft)', borderRadius: 'var(--r-md)', border: '1px solid var(--info)', alignItems: 'flex-start' }}>
          <Icon name="pool" size={16} color="var(--info)" />
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
            <strong>SME lot-based pooling.</strong> Each category's profit is shared across the opted-in pool by lots, capped at that category's lot level: Retail is per head, sHNI caps everyone at the sHNI level (so sHNI and bHNI tie), and bHNI uses full lots applied. PANs opted out (set on the PAN) take only the equal share of their own category.
          </div>
        </div>
      )}

      {/* Per-category breakdown */}
      {catData.map(d => {
        const meta    = CAT_META[d.cat] || { label: d.cat, tone: 'neutral', desc: '', textColor: 'var(--ink-2)' };
        // A category can legitimately have all its profit go to the bonus
        // (net rounds to 0 after a high bonus rate) and still have real
        // money to show -- not just an empty "no allotments" category. A
        // real LOSS (net < 0) counts too: it must still show its breakdown
        // and split, not be mistaken for "no allotments in this category".
        const hasProfit = d.net !== 0 || d.bonusTotal > 0;
        return (
          <Card key={d.cat} pad={0} style={{ borderColor: hasProfit ? 'var(--border)' : 'var(--border)', overflow: 'hidden' }}>
            {/* Category header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: hasProfit ? 'var(--surface-2)' : 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Badge tone={meta.tone} style={{ fontSize: 13, padding: '4px 12px', fontWeight: 800 }}>{meta.label}</Badge>
                <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{meta.desc}</span>
              </div>
              <div style={{ display: 'flex', gap: 18 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>PANs applied</div>
                  <div className="num" style={{ fontSize: 18, fontWeight: 800 }}>{d.total}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>Allotted</div>
                  <div className="num" style={{ fontSize: 18, fontWeight: 800, color: d.allotted > 0 ? 'var(--profit)' : 'var(--ink-3)' }}>{d.allotted}</div>
                </div>
                {hasProfit && !isSME && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>Per PAN</div>
                    <div className="num" style={{ fontSize: 18, fontWeight: 800, color: meta.textColor }}>{f(d.perPan)}</div>
                  </div>
                )}
                {hasProfit && isSME && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>Net profit</div>
                    <div className="num" style={{ fontSize: 18, fontWeight: 800, color: meta.textColor }}>{f(d.net)}</div>
                  </div>
                )}
              </div>
            </div>

            {!hasProfit ? (
              /* No profit generated in this category */
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', color: 'var(--ink-3)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--bg)', display: 'grid', placeItems: 'center' }}><Icon name="x" size={18} /></div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                    {d.allotted > 0 ? `${meta.label}: allotted, but no profit` : `No allotments in ${meta.label} category`}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>
                    {isSME
                      ? `${d.total} PAN${d.total !== 1 ? 's' : ''} applied — these still share the SME pool (see Member payouts below).`
                      : d.allotted > 0
                        ? `${d.allotted} PAN${d.allotted !== 1 ? 's' : ''} allotted but sold at cost — nothing to distribute for this group.`
                        : `${d.total} PAN${d.total !== 1 ? 's' : ''} applied — no profit distribution for this group.`}
                  </div>
                </div>
              </div>
            ) : (
              <div className="pool-main" style={{ display: 'grid', gridTemplateColumns: isSME ? '1fr' : '1fr 1fr', gap: 0 }}>
                {/* Profit breakdown */}
                <div style={{ padding: '16px 20px', borderRight: isSME ? 'none' : '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Profit breakdown</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {[
                      ['Gross profit', d.gross, 'var(--ink)'],
                      [`STCG (${stcgRate}%)`, -d.stcgAmt, 'var(--loss)'],
                      ...(d.bonusTotal > 0 ? [[`Allotted-PAN bonus (${d.bonusRate}%, kept personally)`, -d.bonusTotal, 'var(--warn)']] : []),
                      [categories.length > 1 ? 'Brokerage (share)' : 'Brokerage', -d.brok, 'var(--loss)'],
                    ].map(([l, v, c]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600 }}>{l}</span>
                        <span className="num" style={{ fontSize: 13, fontWeight: 800, color: c }}>{v < 0 ? '-' : ''}{f(Math.abs(v))}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--brand-tint)', borderRadius: 'var(--r-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    {isSME ? (
                      <>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>
                            Split {d.cat === 'bHNI' ? 'by lots applied' : d.cat === 'sHNI' ? 'by lots, capped at sHNI level' : 'per head (equal)'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                            shared across the opted-in pool
                          </div>
                        </div>
                        <div className="num" style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand)' }}>{f(d.net)}</div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>Net ÷ {d.total} PANs</div>
                          {d.remainder > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                              {d.remainder} PAN{d.remainder !== 1 ? 's' : ''} get ₹1 extra so every rupee is shared
                            </div>
                          )}
                        </div>
                        <div className="num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>{f(d.perPan)}<span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)' }}>/PAN</span></div>
                      </>
                    )}
                  </div>
                </div>

                {/* Member shares in this category (Mainboard: per-category equal.
                    SME shares across the whole pool, shown in one combined table below.) */}
                {!isSME && (
                  <div>
                    <div style={{ padding: '16px 20px 10px', fontSize: 13, fontWeight: 800 }}>Member shares ({meta.label})</div>
                    <MemberSharesTable D={D} shares={d.memberShares} bonuses={d.memberBonuses} f={f} />
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* Combined member payouts (SME) — who actually receives what, across the
          whole opted-in pool (Retail PANs can receive bHNI/sHNI profit, etc.). */}
      {isSME && Object.keys(smeMemberShares).length > 0 && (
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800 }}>Member payouts</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Each member's total share across the SME pool</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              <Badge tone="profit" icon="check" style={{ fontSize: 9.5, padding: '1px 6px' }}>Allotted</Badge>
              <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>got an allotment</span>
              <Badge tone="info" icon="pan" style={{ fontSize: 9.5, padding: '1px 6px' }}>Pooled</Badge>
              <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>share from own application</span>
              <Badge tone="brand" icon="groups" style={{ fontSize: 9.5, padding: '1px 6px' }}>Backer</Badge>
              <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>share from funding another PAN</span>
            </div>
          </div>
          <MemberSharesTable D={D} shares={smeMemberShares} bonuses={smeMemberBonuses} f={f} roles={memberRoles} />
        </Card>
      )}

      {/* Allotted PANs list */}
      {ipoAllots.some(a => a.status === 'allotted') && (
        <Card pad={20}>
          <SectionTitle title="Allotted PANs" sub="Shares received and sold on listing day" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px,1fr))', gap: 12, marginTop: 12 }}>
            {ipoAllots.filter(a => a.status === 'allotted').map((a, i) => {
              const panObj = D.pan(a.pan);
              const m = panObj ? D.member(panObj.member) : null;
              const meta = CAT_META[a.category] || { label: a.category, tone: 'neutral' };
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: m ? `hsl(${m.avatarHue} 55% 52%)` : 'var(--brand)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                    {panObj ? D.initials(panObj.holder) : '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{panObj?.holder || a.pan}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', gap: 5, alignItems: 'center', marginTop: 2 }}>
                      <Badge tone={meta.tone} style={{ fontSize: 10 }}>{meta.label}</Badge>
                      {a.shares.toLocaleString('en-IN')} shares · {m?.name.split(' ')[0]}
                    </div>
                  </div>
                  <div className="num" style={{ fontSize: 14, fontWeight: 800, color: a.gain < 0 ? 'var(--loss)' : 'var(--profit)', whiteSpace: 'nowrap' }}>{a.gain > 0 ? '+' : ''}{f(a.gain, { compact: true })}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Finalize payouts. totalNet !== 0 (not just > 0) so a loss-only pool
          can still be finalized -- a loss is distributed exactly like a
          profit, it just isn't hidden behind a "profit found" gate. */}
      {totalAllotted > 0 && pool?.status !== 'Settled' && (() => {
        const noProfit = totalNet === 0 && totalBonus === 0;
        return (
        <div style={{ padding: '16px 20px', background: noProfit ? 'var(--surface-2)' : 'var(--brand-tint)', borderRadius: 'var(--r-lg)', border: `1.5px solid ${noProfit ? 'var(--border)' : 'var(--brand)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{noProfit ? 'Close out this IPO' : totalNet >= 0 ? 'Ready to distribute' : 'Ready to settle (loss)'}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 3 }}>
              {noProfit
                ? 'No profit to distribute — finalizing records zero payouts and marks the pool settled, so it moves out of the active list.'
                : isSME
                ? catData.filter(d => d.net !== 0).map(d => `${d.cat}: ${f(d.net)} ${d.cat === 'bHNI' ? 'by lots' : d.cat === 'sHNI' ? 'capped lots' : 'per head'}`).join(' · ')
                : catData.filter(d => d.net !== 0).map(d => `${d.cat}: ${f(d.perPan)}/PAN × ${d.total} applicants`).join(' · ')}
            </div>
            {finalErr && <div style={{ fontSize: 12.5, color: 'var(--loss)', marginTop: 4, fontWeight: 600 }}>{finalErr}</div>}
          </div>
          <Button variant={noProfit ? 'ghost' : 'primary'} icon="check"
            onClick={() => setConfirmFinal(true)}
            style={{ flexShrink: 0 }}>
            {noProfit ? 'Mark settled →' : 'Finalize payouts →'}
          </Button>
        </div>
        );
      })()}

      {/* Confirm finalize dialog */}
      {confirmFinal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 70, display: 'grid', placeItems: 'center', padding: 16 }}>
          <div className="modal-card" style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', width: '100%', maxWidth: 400, padding: 24, boxShadow: 'var(--sh-pop)', display: 'flex', flexDirection: 'column', gap: 14, animation: 'popIn .22s cubic-bezier(.2,.7,.3,1)' }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{totalNet === 0 && totalBonus === 0 ? 'Mark this IPO settled?' : 'Finalize payouts?'}</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              {totalNet === 0 && totalBonus === 0
                ? <>This IPO made <strong>no profit</strong> (allotted shares sold at cost), so there are no payouts to record. Finalizing marks the pool settled and moves it out of the active list.</>
                : <>This will create settlement records for <strong>{catData.reduce((s, d) => s + Object.keys(d.memberShares).length, 0)} members</strong> totalling <strong>{f(totalNet)}</strong>. This cannot be easily undone.</>}
            </div>
            {finalErr && <div style={{ color: 'var(--loss)', fontSize: 13, fontWeight: 600 }}>{finalErr}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmFinal(false)} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '9px 16px', background: 'var(--surface)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Cancel</button>
              <button onClick={async () => { await finalizePayouts(); setConfirmFinal(false); }}
                style={{ border: 'none', borderRadius: 'var(--r-md)', padding: '9px 18px', background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', opacity: finalizing ? .7 : 1 }}>
                {finalizing ? 'Saving…' : 'Yes, finalize'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {pool?.status === 'Settled'
          ? <Button variant="primary" icon="ledger" onClick={() => navigate('settlement', { id: sel })}>View settlement ledger</Button>
          : <Button variant="ghost"   icon="ledger" onClick={() => navigate('settlement', { id: sel })}>Go to settlement ledger</Button>
        }
        <Button variant="ghost" icon="settings" onClick={() => navigate('settings')}>Tax &amp; brokerage settings</Button>
      </div>
    </div>
  );
}

Object.assign(window, { ProfitPooling, CAT_META });
