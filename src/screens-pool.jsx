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
  const ipoAllots  = D.allotments.filter(a => a.ipo === sel);
  const me         = D.members.find(m => m.you);

  // Once a pool is finalized it carries the rates used at that time, so the
  // math stays identical on every device. Before finalize, preview with the
  // current local settings.
  const stcgRate     = pool?.stcgRate  != null ? pool.stcgRate  : parseFloat(localStorage.getItem('stcg')      || '15');
  const brokerageAmt = pool?.brokerage != null ? pool.brokerage : parseFloat(localStorage.getItem('brokerage') || '0');

  // Unique categories in this IPO's allotments (order: SME, Retail, sHNI, bHNI)
  const CAT_ORDER  = ['SME', 'Retail', 'sHNI', 'bHNI'];
  const categories = CAT_ORDER.filter(c => ipoAllots.some(a => a.category === c));

  // Per-category math. Member shares split net profit equally per PAN APPLIED
  // (not per allottee): every applicant in a category shares in the profit from
  // that category's allotments, so someone with 2 PANs in sHNI gets 2× the
  // perPan share. PoolMath distributes the rounding remainder so the member
  // shares sum EXACTLY to the category net.
  const panToMember = (panId) => { const p = D.pan(panId); return p ? p.member : null; };
  const catData = categories.map(cat => {
    const catAllots = ipoAllots.filter(a => a.category === cat);
    const math = window.PoolMath.category(catAllots, stcgRate, brokerageAmt);
    const memberShares = window.PoolMath.memberShares(catAllots, stcgRate, brokerageAmt, panToMember);
    return { cat, catAllots, ...math, memberShares };
  });

  // Your combined share across ALL categories
  const myTotal    = catData.reduce((s, d) => s + (d.memberShares[me?.id]?.share || 0), 0);
  const myPanCount = catData.reduce((s, d) => s + (d.memberShares[me?.id]?.pans  || 0), 0);

  // Overall summary
  const totalPans     = ipoAllots.length;
  const totalAllotted = ipoAllots.filter(a => a.status === 'allotted').length;
  const totalNet      = catData.reduce((s, d) => s + d.net, 0);

  // Build settlement rows from computed catData and save to Supabase
  const finalizePayouts = async () => {
    setFinalizing(true); setFinalErr('');
    try {
      const rows = [];
      catData.forEach(d => {
        if (d.net <= 0) return;
        Object.entries(d.memberShares).forEach(([memberId, { pans, share }]) => {
          if (share > 0) rows.push({ memberId, category: d.cat, pans, amount: Math.round(share) });
        });
      });
      if (rows.length === 0) { setFinalErr('No profit to distribute yet.'); setFinalizing(false); return; }
      await D.mutations.createSettlements(sel, rows, { stcgRate, brokerage: brokerageAmt });
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
        {visiblePools.map(p => {
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
      {myTotal > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'var(--brand-tint)', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--brand)' }}>
          <Avatar name={me.name} hue={me.avatarHue} size={44} you />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>Your combined share across all categories</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
              {catData.filter(d => d.memberShares[me?.id]).map(d => {
                const r = d.memberShares[me.id];
                return `${CAT_META[d.cat]?.label || d.cat}: ${r.pans} PAN${r.pans > 1 ? 's' : ''} × ${f(d.perPan)}`;
              }).join(' · ')}
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
          { label: 'Net profit',    value: f(totalNet, { compact: true }),  icon: 'trend',  tone: 'profit' },
          { label: 'Your share',    value: f(myTotal),                      icon: 'wallet', tone: 'brand' },
        ].map(s => (
          <Card key={s.label} pad={16} style={{ background: s.tone === 'brand' ? 'var(--brand-tint)' : 'var(--surface)', borderColor: s.tone === 'brand' ? 'var(--brand)' : 'var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: s.tone === 'brand' ? 'var(--brand)' : 'var(--bg)', color: s.tone === 'brand' ? '#fff' : 'var(--ink-2)', display: 'grid', placeItems: 'center' }}>
                <Icon name={s.icon} size={15} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>{s.label}</span>
            </div>
            <div className="num" style={{ fontSize: 22, fontWeight: 800, color: s.tone === 'profit' ? 'var(--profit)' : s.tone === 'brand' ? 'var(--brand)' : 'var(--ink)' }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Total profit summary band */}
      {totalNet > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', background: 'var(--profit-soft)', borderRadius: 'var(--r-md)', border: '1px solid var(--profit)' }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink-2)' }}>Total net profit across all categories</span>
          <span className="num" style={{ fontSize: 20, fontWeight: 800, color: 'var(--profit)' }}>{f(totalNet)}</span>
        </div>
      )}

      {/* Per-category breakdown */}
      {catData.map(d => {
        const meta    = CAT_META[d.cat] || { label: d.cat, tone: 'neutral', desc: '', textColor: 'var(--ink-2)' };
        const hasProfit = d.net > 0;
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
                {hasProfit && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>Per PAN</div>
                    <div className="num" style={{ fontSize: 18, fontWeight: 800, color: meta.textColor }}>{f(d.perPan)}</div>
                  </div>
                )}
              </div>
            </div>

            {!hasProfit ? (
              /* No allotments in this category */
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', color: 'var(--ink-3)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--bg)', display: 'grid', placeItems: 'center' }}><Icon name="x" size={18} /></div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>No allotments in {meta.label} category</div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>{d.total} PAN{d.total !== 1 ? 's' : ''} applied — no profit distribution for this group.</div>
                </div>
              </div>
            ) : (
              <div className="pool-main" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                {/* Profit breakdown */}
                <div style={{ padding: '16px 20px', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Profit breakdown</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {[
                      ['Gross profit', d.gross, 'var(--ink)'],
                      [`STCG (${stcgRate}%)`, -d.stcgAmt, 'var(--loss)'],
                      ['Brokerage', -brokerageAmt, 'var(--loss)'],
                    ].map(([l, v, c]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600 }}>{l}</span>
                        <span className="num" style={{ fontSize: 13, fontWeight: 800, color: c }}>{v < 0 ? '-' : ''}{f(Math.abs(v))}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--brand-tint)', borderRadius: 'var(--r-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>Net ÷ {d.total} PANs</div>
                    </div>
                    <div className="num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)' }}>{f(d.perPan)}<span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)' }}>/PAN</span></div>
                  </div>
                </div>

                {/* Member shares in this category */}
                <div>
                  <div style={{ padding: '16px 20px 10px', fontSize: 13, fontWeight: 800 }}>Member shares ({meta.label})</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                        <th style={{ textAlign: 'left', fontWeight: 700, padding: '6px 20px' }}>Member</th>
                        <th style={{ textAlign: 'center', fontWeight: 700, padding: '6px 8px' }}>PANs</th>
                        <th style={{ textAlign: 'right', fontWeight: 700, padding: '6px 20px' }}>Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(d.memberShares).map(([mid, row]) => {
                        const m = D.member(mid);
                        if (!m) return null;
                        return (
                          <tr key={mid} style={{ borderTop: '1px solid var(--border)', background: m.you ? 'var(--brand-tint)' : 'transparent' }}>
                            <td style={{ padding: '10px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Avatar name={m.name} hue={m.avatarHue} size={28} you={m.you} />
                                <span style={{ fontSize: 13, fontWeight: 700 }}>{m.name.split(' ')[0]}{m.you && <span style={{ color: 'var(--brand)', fontWeight: 600 }}> · You</span>}</span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                                {Array.from({ length: row.pans }).map((_, i) => (
                                  <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: `hsl(${m.avatarHue} 55% 52%)` }} />
                                ))}
                              </div>
                            </td>
                            <td className="num" style={{ padding: '10px 20px', textAlign: 'right', fontSize: 14, fontWeight: 800, color: m.you ? 'var(--brand)' : 'var(--profit)' }}>{f(row.share)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        );
      })}

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
                  <div className="num" style={{ fontSize: 14, fontWeight: 800, color: 'var(--profit)', whiteSpace: 'nowrap' }}>+{f(a.gain, { compact: true })}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Finalize payouts */}
      {totalAllotted > 0 && totalNet > 0 && pool?.status !== 'Settled' && (
        <div style={{ padding: '16px 20px', background: 'var(--brand-tint)', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Ready to distribute</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 3 }}>
              {catData.filter(d => d.net > 0).map(d => `${d.cat}: ${f(d.perPan)}/PAN × ${d.total} applicants`).join(' · ')}
            </div>
            {finalErr && <div style={{ fontSize: 12.5, color: 'var(--loss)', marginTop: 4, fontWeight: 600 }}>{finalErr}</div>}
          </div>
          <Button variant="primary" icon="ledger"
            onClick={() => setConfirmFinal(true)}
            style={{ flexShrink: 0 }}>
            Finalize payouts →
          </Button>
        </div>
      )}

      {/* Confirm finalize dialog */}
      {confirmFinal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 70, display: 'grid', placeItems: 'center', padding: 16 }}>
          <div className="modal-card" style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', width: '100%', maxWidth: 400, padding: 24, boxShadow: 'var(--sh-pop)', display: 'flex', flexDirection: 'column', gap: 14, animation: 'popIn .22s cubic-bezier(.2,.7,.3,1)' }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Finalize payouts?</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              This will create settlement records for <strong>{catData.reduce((s, d) => s + Object.keys(d.memberShares).length, 0)} members</strong> totalling <strong>{f(totalNet)}</strong>. This cannot be easily undone.
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
