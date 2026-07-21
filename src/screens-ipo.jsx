/* ============================================================
   IPO Pool — IPO Details
   ============================================================ */

function Stat({ label, value, tone, sub }) {
  const c = { profit: 'var(--profit)', loss: 'var(--loss)', info: 'var(--info)' }[tone] || 'var(--ink)';
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{label}</div>
      <div className="num" style={{ fontSize: 18, fontWeight: 800, marginTop: 3, color: c }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function IpoDetails({ id, navigate }) {
  const D = window.DB;
  const ipo = D.ipo(id);
  const f = (n, o) => D.fmtINR(n, o);
  const allotsBase = D.allotments.filter(a => a.ipo === id);
  const applicantCols = [
    { key: 'holder',   label: 'PAN holder',   align: 'left',  get: a => { const p = D.pans.find(x => x.id === a.pan); return p ? p.holder : ''; } },
    { key: 'category', label: 'Category',     align: 'left',  get: a => a.category || '' },
    { key: 'status',   label: 'Status',       align: 'right', get: a => a.status || '' },
    { key: 'shares',   label: 'Shares',       align: 'right', get: a => a.shares || 0, defDir: 'desc' },
    { key: 'invest',   label: 'Invested',     align: 'right', get: a => a.invest || 0, defDir: 'desc' },
    { key: 'gain',     label: 'Listing gain', align: 'right', get: a => a.gain || 0, defDir: 'desc' },
  ];
  const [applicantSort, onApplicantSort] = useSortState(null);
  const allots = sortRows(allotsBase, applicantSort, applicantCols);
  const pool = D.pools.find(p => p.ipo === id);
  const poolNetProfit = (() => {
    const stcg = parseFloat(localStorage.getItem('stcg') || '15');
    const brok = parseFloat(localStorage.getItem('brokerage') || '0');
    const gross = allots.reduce((s, a) => s + (a.gain || 0), 0);
    return Math.max(0, gross - Math.round(gross * stcg / 100) - brok);
  })();
  const allottedCount = allots.filter(a => a.status === 'allotted').length;
  const timeline = [
    ['Open', ipo.open, true], ['Close', ipo.close, true], ['Allotment', ipo.allotDate, ipo.status === 'Listed' || ipo.status === 'Closed'],
    ['Listing', ipo.listDate, ipo.status === 'Listed'],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <button onClick={() => navigate('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: 'var(--ink-2)', fontWeight: 700, fontSize: 13.5, padding: 0 }}>
        <Icon name="chevL" size={16} /> Dashboard
      </button>

      {/* Header */}
      <Card pad={22}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <IpoLogo ipo={ipo} size={62} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 23, fontWeight: 800, margin: 0, letterSpacing: '-.02em' }}>{ipo.name}</h1>
                <Badge tone={ipo.type === 'SME' ? 'sme' : 'mainboard'}>{ipo.type}</Badge>
                <Badge tone={ipo.status === 'Listed' ? 'profit' : ipo.status === 'Open' ? 'info' : 'neutral'}>{ipo.status}</Badge>
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 5 }}>{ipo.sector} · Price band {ipo.band} · {ipo.lotSize ? `Lot ${ipo.lotSize.toLocaleString('en-IN')} shares` : ''}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {ipo.status === 'Open' && <Button variant="primary" icon="check" onClick={() => navigate('admin')}>Track applicants</Button>}
            {ipo.status === 'Listed' && <Button variant="primary" icon="trend" onClick={() => navigate('pooling', { id })}>View profit pool</Button>}
            <IconButton name="download" tip="Export" />
          </div>
        </div>

        {/* Timeline */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, marginTop: 22, position: 'relative' }} className="ipo-timeline">
          {timeline.map(([label, date, done], i) => (
            <div key={label} style={{ position: 'relative', textAlign: i === 0 ? 'left' : 'center', paddingTop: 22 }}>
              {i < 3 && <div style={{ position: 'absolute', top: 6, left: i === 0 ? 10 : '50%', right: i === 2 ? 10 : '-50%', height: 2, background: done ? 'var(--brand)' : 'var(--border)' }} />}
              <div style={{ position: 'absolute', top: 0, left: i === 0 ? 4 : '50%', transform: i === 0 ? 'none' : 'translateX(-50%)', width: 13, height: 13, borderRadius: 999, background: done ? 'var(--brand)' : 'var(--surface)', border: `2px solid ${done ? 'var(--brand)' : 'var(--border-strong)'}` }} />
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600, paddingLeft: i === 0 ? 2 : 0 }}>{label}</div>
              <div className="num" style={{ fontSize: 13.5, fontWeight: 700, marginTop: 1 }}>{date}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Key stats */}
      <div className="ipo-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
        <Card pad={20}>
          <SectionTitle title="IPO information" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px 16px' }}>
            <Stat label="Subscription" value={ipo.sub ? ipo.sub + 'x' : '—'} sub={ipo.sub ? 'oversubscribed' : 'not open'} />
            <Stat label="Lot value" value={f(ipo.lotValue, { compact: true })} sub="per application" />
            <Stat label="Listing gain" value={ipo.listGain ? `${ipo.listGain}%` : '—'} tone={ipo.listGain ? 'profit' : undefined} sub={ipo.listGain ? 'actual' : 'pending listing'} />
            <Stat label="Profit / lot" value={ipo.listGain ? f(Math.round(ipo.lotValue * ipo.listGain / 100), { compact: true }) : '—'} tone={ipo.listGain ? 'profit' : undefined} />
            <Stat label="Listing price" value={ipo.listPrice ? `₹${ipo.listPrice}` : '—'} tone={ipo.listPrice ? 'profit' : undefined} />
          </div>
          <div style={{ marginTop: 20, padding: 14, background: 'var(--brand-tint)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--brand)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="spark" size={18} /></div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              Pool applied with <strong style={{ color: 'var(--ink)' }}>{allots.length} PANs</strong>. {ipo.listGain ? <>Net pooled profit (after STCG &amp; charges) is <strong className="num" style={{ color: 'var(--brand)' }}>{f(poolNetProfit, { compact: true })}</strong>.</> : 'Allotment results will be visible after listing.'}
            </div>
          </div>
        </Card>

        <Card pad={20}>
          <SectionTitle title="Applications summary" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[['PANs applied', allots.length, 'neutral'], ['Allotted', allottedCount, 'profit'], ['Not allotted', allots.length - allottedCount, 'loss']].map(([l, v, t]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 600 }}>{l}</span>
                <span className="num" style={{ fontSize: 17, fontWeight: 800, color: t === 'profit' ? 'var(--profit)' : t === 'loss' ? 'var(--loss)' : 'var(--ink)' }}>{v}</span>
              </div>
            ))}
            <div style={{ height: 1, background: 'var(--border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 600 }}>Total invested</span>
              <span className="num" style={{ fontSize: 17, fontWeight: 800 }}>{f(allots.reduce((s, a) => s + (a.invest || 0), 0), { compact: true })}</span>
            </div>
            {pool && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 600 }}>Net pooled profit</span>
                <span className="num" style={{ fontSize: 17, fontWeight: 800, color: 'var(--profit)' }}>{f(poolNetProfit, { compact: true })}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Applied PANs + allotment results */}
      <Card pad={0}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14.5, fontWeight: 800 }}>Applied PAN accounts &amp; allotment results</div>
          {pool && <Button variant="soft" size="sm" icon="pool" onClick={() => navigate('pooling', { id })}>Profit pooling</Button>}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ fontSize: 11.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                {applicantCols.map(c => <SortTh key={c.key} col={c} sort={applicantSort} onSort={onApplicantSort} style={{ padding: '11px 20px' }} />)}
              </tr>
            </thead>
            <tbody>
              {allots.map((a, i) => {
                const pan     = D.pans.find(p => p.id === a.pan);
                const mem     = pan ? D.member(pan.member) : null;
                const catMeta = (window.CAT_META || {})[a.category] || { label: a.category || '—', tone: 'neutral' };
                return (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '13px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={pan?.holder || '?'} hue={mem?.avatarHue ?? (i * 47 % 360)} size={32} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{pan?.holder || '—'}</div>
                          <div className="num" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{pan?.pan || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <Badge tone={catMeta.tone}>{catMeta.label}</Badge>
                    </td>
                    <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                      <Badge tone={a.status === 'allotted' ? 'profit' : 'loss'} icon={a.status === 'allotted' ? 'check' : 'x'}>{a.status === 'allotted' ? 'Allotted' : 'Not allotted'}</Badge>
                    </td>
                    <td className="num" style={{ padding: '13px 20px', textAlign: 'right', color: 'var(--ink-2)' }}>{a.shares || '—'}</td>
                    <td className="num" style={{ padding: '13px 20px', textAlign: 'right', color: 'var(--ink-2)' }}>{a.invest ? f(a.invest) : '—'}</td>
                    <td className="num" style={{ padding: '13px 20px', textAlign: 'right', fontWeight: 700, color: a.gain ? 'var(--profit)' : 'var(--ink-3)' }}>{a.gain ? '+' + f(a.gain) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { IpoDetails });
