/* ============================================================
   IPO Pool — Settlement Ledger
   Admin distributes net profit to members who applied.
   Profit = perPan × memberPanCount (for each member who applied).
   ============================================================ */

function SettlementLedger({ navigate, id }) {
  const D = window.DB;
  const f = (n, o) => D.fmtINR(n, o);

  // Select IPO (from nav context or default to first pool)
  const [selIpo, setSelIpo] = useState(id || D.pools[0]?.ipo);
  const pool    = D.pools.find(p => p.ipo === selIpo) || D.pools[0] || null;
  const me      = D.members.find(m => m.you);

  if (!pool) return (
    <Card pad={32} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
        <Icon name="ledger" size={26} color="var(--ink-3)" />
      </div>
      <div style={{ fontSize: 16, fontWeight: 800 }}>No settlements yet</div>
      <div style={{ fontSize: 13.5, color: 'var(--ink-3)', maxWidth: 360, lineHeight: 1.6 }}>
        Go to <strong>Profit Pool</strong>, review the calculated splits, then click <strong>Finalize payouts</strong> to generate the settlement ledger.
      </div>
      <Button variant="primary" icon="pool" onClick={() => window.__navigate && window.__navigate('pooling')}>Go to Profit Pool</Button>
    </Card>
  );

  const ipo = D.ipo(pool.ipo);

  // Compute net profit per category (same logic as screens-pool.jsx)
  const stcgRate     = parseFloat(localStorage.getItem('stcg')      || '15');
  const brokerageAmt = parseFloat(localStorage.getItem('brokerage')  || '0');
  const ipoAllots    = D.allotments.filter(a => a.ipo === selIpo);
  const CAT_ORDER    = ['SME', 'Retail', 'sHNI', 'bHNI'];
  const categories   = CAT_ORDER.filter(c => ipoAllots.some(a => a.category === c));
  const catSummaries = categories.map(cat => {
    const ca      = ipoAllots.filter(a => a.category === cat);
    const gross   = ca.reduce((s, a) => s + (a.gain || 0), 0);
    const stcg    = Math.round(gross * stcgRate / 100);
    const net     = Math.max(0, gross - stcg - brokerageAmt);
    const perPan  = ca.length > 0 ? Math.round(net / ca.length) : 0;
    return { cat, net, perPan, total: ca.length };
  });
  const totalNet = catSummaries.reduce((s, d) => s + d.net, 0);

  // Your retained share (sum across all categories)
  const myPanIds = D.pans.filter(p => p.member === me?.id).map(p => p.id);
  const myShare  = catSummaries.reduce((sum, d) => {
    const myCatPans = ipoAllots.filter(a => a.category === d.cat && myPanIds.includes(a.pan)).length;
    return sum + myCatPans * d.perPan;
  }, 0);

  // Settlement rows for this IPO
  const [rows, setRows] = useState(D.settlements.filter(s => s.ipo === selIpo));

  // ── Minimal-transfer plan ─────────────────────────────────────────────────
  // Each member's net position across ALL categories for this IPO:
  //   received = gross gain from their allotted PANs (money already in account)
  //   after_stcg = received × (1 - stcgRate/100) — they'll pay STCG to govt
  //   owed = their total settlement share across categories
  //   net = after_stcg - owed
  //     positive → they received more than their share → PAYER
  //     negative → they received less                 → RECEIVER
  const transferPlan = useMemo(() => {
    if (!rows.length) return [];

    // Sum settlement amounts per member
    const memberOwed = {};
    rows.forEach(r => { memberOwed[r.member] = (memberOwed[r.member] || 0) + r.amount; });

    // Sum allotted gains per member
    const memberReceived = {};
    ipoAllots.forEach(a => {
      if (a.status !== 'allotted') return;
      const panObj = D.pan(a.pan);
      if (!panObj) return;
      const mid = panObj.member;
      memberReceived[mid] = (memberReceived[mid] || 0) + (a.gain || 0);
    });

    // Net position per member (combine all who appear in either set)
    const allIds = new Set([...Object.keys(memberOwed), ...Object.keys(memberReceived)]);
    const netPos = [];
    allIds.forEach(id => {
      const received = memberReceived[id] || 0;
      const afterStcg = received * (1 - stcgRate / 100);
      const owed = memberOwed[id] || 0;
      const net = Math.round(afterStcg - owed);
      if (Math.abs(net) > 5) netPos.push({ id, net });
    });

    // Greedy debt minimization
    const payers    = netPos.filter(n => n.net > 0).map(n => ({ ...n, bal: n.net  })).sort((a,b) => b.bal - a.bal);
    const receivers = netPos.filter(n => n.net < 0).map(n => ({ ...n, bal: -n.net })).sort((a,b) => b.bal - a.bal);

    const transfers = [];
    let pi = 0, ri = 0;
    while (pi < payers.length && ri < receivers.length) {
      const p = payers[pi], r = receivers[ri];
      const amt = Math.min(p.bal, r.bal);
      transfers.push({ from: p.id, to: r.id, amount: amt });
      p.bal -= amt; r.bal -= amt;
      if (p.bal < 5) pi++;
      if (r.bal < 5) ri++;
    }
    return transfers;
  }, [rows, ipoAllots, stcgRate]);

  const [tab,     setTab]     = useState('All');
  const [marking, setMarking] = useState(null);

  const pendingRows    = rows.filter(r => r.status === 'Pending');
  const paidRows       = rows.filter(r => r.status === 'Paid');
  const pendingPayout  = pendingRows.reduce((s, r) => s + r.amount, 0);
  const paidPayout     = paidRows.reduce((s, r) => s + r.amount, 0);
  const settledCount   = paidRows.length;
  const filtered       = tab === 'All' ? rows : tab === 'Pending' ? pendingRows : paidRows;

  const markPaid = async (settlementId) => {
    setMarking(settlementId);
    try {
      await D.mutations.markSettlementPaid(settlementId);
      const updated = D.settlements.filter(s => s.ipo === selIpo);
      setRows(updated);
      if (updated.length > 0 && updated.every(s => s.status === 'Paid')) {
        await D.mutations.markPoolSettled(selIpo);
      }
    } catch(e) { console.error(e); }
    setMarking(null);
  };

  const [markingAll, setMarkingAll] = useState(false);
  const markAllPaid = async () => {
    const pending = rows.filter(r => r.status === 'Pending');
    if (!pending.length) return;
    setMarkingAll(true);
    try {
      for (const r of pending) {
        await D.mutations.markSettlementPaid(r.id);
      }
      const updated = D.settlements.filter(s => s.ipo === selIpo);
      setRows(updated);
      if (updated.length > 0 && updated.every(s => s.status === 'Paid')) {
        await D.mutations.markPoolSettled(selIpo);
      }
    } catch(e) { console.error(e); }
    setMarkingAll(false);
  };

  const exportCSV = () => {
    const esc = v => `"${String(v).replace(/"/g,'""')}"`;
    const header = ['Member', 'Category', 'PANs', 'Amount', 'Status', 'Date'];
    const lines = filtered.map(r => {
      const m = D.member(r.member);
      return [m?.name || r.member, r.category, r.pans, r.amount, r.status, r.date || ''].map(esc).join(',');
    });
    const csv = [header.map(esc).join(','), ...lines].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `settlements-${ipo?.short || selIpo}-${tab}.csv`;
    a.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* IPO switcher */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {D.pools.map(p => {
          const ip = D.ipo(p.ipo);
          const active = p.ipo === selIpo;
          return (
            <button key={p.ipo} onClick={() => { setSelIpo(p.ipo); setRows(D.settlements.filter(s => s.ipo === p.ipo)); setTab('All'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 'var(--r-md)', flexShrink: 0, border: '1px solid', borderColor: active ? 'var(--brand)' : 'var(--border)', background: active ? 'var(--brand-tint)' : 'var(--surface)', cursor: 'pointer' }}>
              <IpoLogo ipo={ip} size={24} />
              <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--brand)' : 'var(--ink)' }}>{ip.short}</span>
              <Badge tone={p.status === 'Settled' ? 'profit' : 'warn'} style={{ fontSize: 10.5 }}>{p.status}</Badge>
            </button>
          );
        })}
      </div>

      {/* Your retained share */}
      {myShare > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'var(--brand-tint)', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--brand)' }}>
          <Avatar name={me.name} hue={me.avatarHue} size={44} you />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Your retained share</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              {catSummaries.filter(d => {
                const n = ipoAllots.filter(a => a.category === d.cat && myPanIds.includes(a.pan)).length;
                return n > 0;
              }).map(d => {
                const n = ipoAllots.filter(a => a.category === d.cat && myPanIds.includes(a.pan)).length;
                return `${d.cat}: ${n} PAN${n>1?'s':''} × ${f(d.perPan)}`;
              }).join(' · ')} — already in your account
            </div>
          </div>
          <div className="num" style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand)' }}>{f(myShare)}</div>
        </div>
      )}

      {/* KPI cards */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        <Card pad={18}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icon name="wallet" size={15} color="var(--profit)" /> Total payout to group
          </div>
          <div className="num" style={{ fontSize: 28, fontWeight: 800, color: 'var(--profit)', margin: '8px 0 2px' }}>{f(rows.reduce((s,r) => s+r.amount, 0))}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{rows.length} recipient{rows.length !== 1 ? 's' : ''} · {catSummaries.map(d => `${d.cat} ₹${d.perPan.toLocaleString('en-IN')}/PAN`).join(' · ')}</div>
        </Card>
        <Card pad={18}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icon name="clock" size={15} color="var(--warn)" /> Still to transfer
          </div>
          <div className="num" style={{ fontSize: 28, fontWeight: 800, color: 'var(--warn)', margin: '8px 0 2px' }}>{f(pendingPayout)}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{rows.filter(r => r.status === 'Pending').length} pending transfers</div>
        </Card>
        <Card pad={18}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icon name="check" size={15} color="var(--brand)" /> Transferred
          </div>
          <div className="num" style={{ fontSize: 28, fontWeight: 800, margin: '8px 0 2px' }}>{f(paidPayout)}</div>
          <Meter value={settledCount} max={rows.length} color="var(--brand)" style={{ marginTop: 8 }} />
        </Card>
      </div>

      {/* Empty state — no settlements generated yet */}
      {rows.length === 0 && (
        <Card pad={28} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-3)' }}>
            <Icon name="ledger" size={24} />
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 800 }}>No payouts generated yet</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 340 }}>
            Go to the Profit Pool screen, review the calculated splits, then click <strong>Finalize payouts</strong> to generate the settlement ledger.
          </div>
          <Button variant="primary" icon="pool" onClick={() => window.__navigate && window.__navigate('pooling', { id: selIpo })}>Go to Profit Pool</Button>
        </Card>
      )}

      {/* Ledger table */}
      {rows.length > 0 && <Card pad={0}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800 }}>Distribution ledger</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{ipo.name} · {catSummaries.map(d => `${d.cat}: ${f(d.net, {compact:true})} net`).join(' · ')}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Segmented
              options={[`All (${rows.length})`, `Pending (${pendingRows.length})`, `Paid (${paidRows.length})`]}
              value={tab === 'All' ? `All (${rows.length})` : tab === 'Pending' ? `Pending (${pendingRows.length})` : `Paid (${paidRows.length})`}
              onChange={v => setTab(v.split(' ')[0])}
              size="sm" />
            {pendingRows.length > 0 && (
              <Button variant="primary" size="sm" icon="check"
                onClick={markAllPaid}
                style={{ opacity: markingAll ? .7 : 1, pointerEvents: markingAll ? 'none' : 'auto' }}>
                {markingAll ? 'Marking…' : `Mark all paid (${pendingRows.length})`}
              </Button>
            )}
            <Button variant="ghost" size="sm" icon="download" onClick={exportCSV}>Export</Button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ fontSize: 11.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                {['Member', 'Category', 'PANs', 'Amount', 'Status', 'Date'].map((h, i) => (
                  <th key={i} style={{ textAlign: i >= 2 ? 'right' : 'left', fontWeight: 700, padding: '11px 18px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const m    = D.member(r.member);
                if (!m) return null;
                const isPaid = r.status === 'Paid';
                const catMeta = (window.CAT_META || {})[r.category] || { label: r.category || '—', tone: 'neutral' };
                const catPerPan = catSummaries.find(d => d.cat === r.category)?.perPan || 0;
                return (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={m.name} hue={m.avatarHue} size={32} />
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{m.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <Badge tone={catMeta.tone}>{catMeta.label}</Badge>
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
                        {Array.from({ length: r.pans }).map((_, i) => (
                          <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: `hsl(${m.avatarHue} 55% 52%)` }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, textAlign: 'right' }}>{r.pans} × {f(catPerPan)}</div>
                    </td>
                    <td className="num" style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, color: 'var(--ink)' }}>{f(r.amount)}</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      {isPaid ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: 'var(--profit)' }}>
                          <StatusDot tone="profit" /> Paid
                        </span>
                      ) : (
                        <button
                          onClick={() => markPaid(r.id)}
                          disabled={marking === r.id}
                          style={{ border: '1px solid var(--profit)', borderRadius: 'var(--r-sm)', padding: '5px 12px', background: 'var(--profit-soft)', color: 'var(--profit)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', opacity: marking === r.id ? .6 : 1 }}>
                          {marking === r.id ? '…' : '✓ Mark paid'}
                        </button>
                      )}
                    </td>
                    <td className="num" style={{ padding: '12px 18px', textAlign: 'right', color: 'var(--ink-3)', fontSize: 13 }}>{r.date || '—'}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '28px 18px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No entries for this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>}

      {/* ── Minimal Transfer Plan ── */}
      {transferPlan.length > 0 && (
        <Card pad={0}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 800 }}>Minimal transfer plan</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                Fewest transfers to settle all balances · {transferPlan.length} transfer{transferPlan.length !== 1 ? 's' : ''} needed
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>
              (without pooling this would be {rows.filter(r => r.amount > 0).length} transfers)
            </div>
          </div>
          <div style={{ padding: '8px 18px 18px' }}>
            {transferPlan.map((t, i) => {
              const payer    = D.member(t.from);
              const receiver = D.member(t.to);
              if (!payer || !receiver) return null;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < transferPlan.length - 1 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap' }}>
                  {/* Payer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 130 }}>
                    <Avatar name={payer.name} hue={payer.avatarHue} size={36} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{payer.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--loss)', fontWeight: 600 }}>Pays</div>
                    </div>
                  </div>

                  {/* Arrow + amount */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 120 }}>
                    <div className="num" style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)' }}>{f(t.amount)}</div>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 0 }}>
                      <div style={{ flex: 1, height: 2, background: 'var(--border)' }} />
                      <div style={{ fontSize: 16, color: 'var(--ink-3)', lineHeight: 1, padding: '0 4px' }}>→</div>
                      <div style={{ flex: 1, height: 2, background: 'var(--brand)', opacity: .5 }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>bank transfer</div>
                  </div>

                  {/* Receiver */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 130, justifyContent: 'flex-end', flexDirection: 'row-reverse' }}>
                    <Avatar name={receiver.name} hue={receiver.avatarHue} size={36} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{receiver.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--profit)', fontWeight: 600 }}>Receives</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Net-position breakdown */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '12px 18px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Net positions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(() => {
                const memberOwed = {};
                rows.forEach(r => { memberOwed[r.member] = (memberOwed[r.member] || 0) + r.amount; });
                const memberReceived = {};
                ipoAllots.forEach(a => {
                  if (a.status !== 'allotted') return;
                  const panObj = D.pan(a.pan);
                  if (!panObj) return;
                  memberReceived[panObj.member] = (memberReceived[panObj.member] || 0) + (a.gain || 0);
                });
                const allIds = new Set([...Object.keys(memberOwed), ...Object.keys(memberReceived)]);
                return [...allIds].map(id => {
                  const m         = D.member(id);
                  if (!m) return null;
                  const received  = memberReceived[id] || 0;
                  const afterStcg = received * (1 - stcgRate / 100);
                  const owed      = memberOwed[id] || 0;
                  const net       = Math.round(afterStcg - owed);
                  const isPayer   = net > 0;
                  const maxBar    = Math.max(...[...allIds].map(xid => {
                    const r = memberReceived[xid] || 0;
                    const o = memberOwed[xid] || 0;
                    return Math.abs(Math.round(r * (1 - stcgRate/100) - o));
                  }));
                  const barPct = maxBar > 0 ? Math.abs(net) / maxBar * 100 : 0;
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={m.name} hue={m.avatarHue} size={28} />
                      <div style={{ width: 100, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{m.name}</div>
                      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: barPct + '%', background: isPayer ? 'var(--loss)' : 'var(--profit)', borderRadius: 999 }} />
                      </div>
                      <div className="num" style={{ fontSize: 13, fontWeight: 800, color: isPayer ? 'var(--loss)' : 'var(--profit)', width: 90, textAlign: 'right' }}>
                        {isPayer ? '−' : '+'}{f(Math.abs(net))}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', width: 50, textAlign: 'right', fontWeight: 600 }}>
                        {isPayer ? 'pays' : 'gets'}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-3)' }}>
              Net = allotted gain × (1 − {stcgRate}% STCG) − pool share. Positive = owes others; negative = owed by others.
            </div>
          </div>
        </Card>
      )}

    </div>
  );
}

Object.assign(window, { SettlementLedger });
