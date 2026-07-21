/* ============================================================
   IPO Pool — Dashboard (with layout variants)
   ============================================================ */

function KPICard({ icon, label, value, delta, tone = 'neutral', spark, sparkUp = true, big = false, onClick }) {
  const toneColor = { profit: 'var(--profit)', loss: 'var(--loss)', info: 'var(--info)', brand: 'var(--brand)', warn: 'var(--warn)', neutral: 'var(--ink)' };
  const toneSoft = { profit: 'var(--profit-soft)', loss: 'var(--loss-soft)', info: 'var(--info-soft)', brand: 'var(--brand-tint)', warn: 'var(--warn-soft)', neutral: 'var(--bg)' };
  return (
    <Card pad={16} hover onClick={onClick} style={{ display: 'flex', flexDirection: 'column', gap: big ? 14 : 10, cursor: onClick ? 'pointer' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: toneSoft[tone], color: toneColor[tone], display: 'grid', placeItems: 'center' }}>
            <Icon name={icon} size={17} stroke={2.2} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>{label}</span>
        </div>
        {spark && <Sparkline data={spark} up={sparkUp} w={64} h={24} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', rowGap: 6 }}>
        <span className="num" style={{ fontSize: big ? 30 : 23, fontWeight: 800, letterSpacing: '-.02em', whiteSpace: 'nowrap', color: toneColor[tone] === 'var(--ink)' ? 'var(--ink)' : (tone === 'profit' || tone === 'loss' ? toneColor[tone] : 'var(--ink)') }}>{value}</span>
        {delta && <Badge tone={delta.tone} icon={delta.tone === 'profit' ? 'arrowUp' : delta.tone === 'loss' ? 'arrowDown' : undefined}>{delta.label}</Badge>}
      </div>
    </Card>
  );
}

function ChartCard({ title, sub, right, children, style }) {
  return (
    <Card pad={18} style={style}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 800, whiteSpace: 'nowrap' }}>{title}</div>
          {sub && <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
        </div>
        {right}
      </div>
      {children}
    </Card>
  );
}

function Legend({ items }) {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {items.map(it => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: it.color }} /> {it.label}
          {it.value && <span className="num" style={{ color: 'var(--ink)', fontWeight: 800 }}>{it.value}</span>}
        </div>
      ))}
    </div>
  );
}

// Category → badge tone + bar colour, shared by the category card.
const CAT_TONE = { Retail: 'info', sHNI: 'brand', bHNI: 'warn', SME: 'sme' };
const CAT_COLOR = { Retail: 'var(--info)', sHNI: 'var(--brand)', bHNI: 'var(--warn)', SME: 'var(--sme)' };

// Sortable "Profit by IPO" table (net profit per IPO + combined total row).
function ProfitByIpoCard({ D, navigate, f }) {
  const cols = [
    { key: 'short',    label: 'IPO',        align: 'left'  },
    { key: 'type',     label: 'Board',      align: 'left'  },
    { key: 'applied',  label: 'Applied',    align: 'right', defDir: 'desc' },
    { key: 'allotted', label: 'Allotted',   align: 'right', defDir: 'desc' },
    { key: 'gross',    label: 'Gross gain', align: 'right', defDir: 'desc' },
    { key: 'net',      label: 'Net profit', align: 'right', defDir: 'desc' },
  ];
  const [sort, onSort] = useSortState(null);
  const rows = sortRows(D.profitByIpo || [], sort, cols);
  const tot = (D.profitByIpo || []).reduce((s, p) => ({
    gross: s.gross + p.gross, net: s.net + p.net, applied: s.applied + p.applied, allotted: s.allotted + p.allotted,
  }), { gross: 0, net: 0, applied: 0, allotted: 0 });

  return (
    <Card pad={0}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 14.5, fontWeight: 800 }}>Profit by IPO</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>Net profit per IPO and combined total · tap a heading to sort</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr style={{ fontSize: 11.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {cols.map(c => <SortTh key={c.key} col={c} sort={sort} onSort={onSort} style={{ padding: '11px 18px' }} />)}
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id} onClick={() => navigate('ipo', { id: p.id })} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 18px', fontWeight: 700, fontSize: 13.5 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    {p.short}
                    {D.pools.some(pl => pl.ipo === p.id && pl.status === 'Settled') && <Badge tone="profit">Settled</Badge>}
                  </span>
                </td>
                <td style={{ padding: '12px 18px' }}><Badge tone={p.type === 'SME' ? 'sme' : 'mainboard'}>{p.type}</Badge></td>
                <td className="num" style={{ padding: '12px 18px', textAlign: 'right', color: 'var(--ink-2)' }}>{p.applied}</td>
                <td className="num" style={{ padding: '12px 18px', textAlign: 'right', color: 'var(--ink-2)' }}>{p.allotted}</td>
                <td className="num" style={{ padding: '12px 18px', textAlign: 'right', color: 'var(--ink-2)' }}>{p.gross > 0 ? f(p.gross, { compact: true }) : '—'}</td>
                <td className="num" style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700, color: p.net > 0 ? 'var(--profit)' : 'var(--ink-3)' }}>{p.net > 0 ? f(p.net, { compact: true }) : '—'}</td>
              </tr>
            ))}
            {rows.length > 0 && (
              <tr style={{ borderTop: '2px solid var(--border-strong)', background: 'var(--surface-2)' }}>
                <td style={{ padding: '12px 18px', fontWeight: 800, fontSize: 13.5 }}>All IPOs together</td>
                <td style={{ padding: '12px 18px' }} />
                <td className="num" style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800 }}>{tot.applied}</td>
                <td className="num" style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800 }}>{tot.allotted}</td>
                <td className="num" style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800 }}>{tot.gross > 0 ? f(tot.gross, { compact: true }) : '—'}</td>
                <td className="num" style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, color: 'var(--profit)' }}>{tot.net > 0 ? f(tot.net, { compact: true }) : '—'}</td>
              </tr>
            )}
            {rows.length === 0 && (
              <tr style={{ borderTop: '1px solid var(--border)' }}>
                <td colSpan={cols.length} style={{ padding: '18px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No applications yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Per-category KPI chart + sortable report (Retail / sHNI / bHNI / SME).
function CategoryCard({ D, f }) {
  const cats = D.categoryStats || [];
  const cols = [
    { key: 'cat',       label: 'Category', align: 'left'  },
    { key: 'ipos',      label: 'IPOs',     align: 'right', defDir: 'desc' },
    { key: 'applied',   label: 'Applied',  align: 'right', defDir: 'desc' },
    { key: 'allotted',  label: 'Allotted', align: 'right', defDir: 'desc' },
    { key: 'allotRate', label: 'Rate',     align: 'right', defDir: 'desc' },
    { key: 'gross',     label: 'Gross',    align: 'right', defDir: 'desc' },
    { key: 'net',       label: 'Net',      align: 'right', defDir: 'desc' },
  ];
  const [sort, onSort] = useSortState('net', 'desc');
  const rows = sortRows(cats, sort, cols);
  const tot = cats.reduce((s, c) => ({
    ipos: s.ipos + c.ipos, applied: s.applied + c.applied, allotted: s.allotted + c.allotted, gross: s.gross + c.gross, net: s.net + c.net,
  }), { ipos: 0, applied: 0, allotted: 0, gross: 0, net: 0 });
  const barData = cats.map(c => ({ m: c.cat, applied: c.applied, allot: c.allotted }));

  return (
    <Card pad={0}>
      <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 800 }}>By category</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>Applications, allotments & net profit per category</div>
        </div>
        <Legend items={[{ label: 'Applied', color: 'var(--border-strong)' }, { label: 'Allotted', color: 'var(--brand)' }]} />
      </div>

      {cats.length === 0 ? (
        <div style={{ padding: '26px 18px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No applications yet.</div>
      ) : (
        <>
          {/* Net profit per category — coloured meters */}
          <div style={{ padding: '14px 18px', display: 'grid', gap: 10, borderBottom: '1px solid var(--border)' }}>
            {(() => { const maxNet = Math.max(1, ...cats.map(c => c.net)); return cats.map(c => (
              <div key={c.cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 58, flexShrink: 0 }}><Badge tone={CAT_TONE[c.cat] || 'neutral'}>{c.cat}</Badge></div>
                <div style={{ flex: 1, minWidth: 0 }}><Meter value={c.net} max={maxNet} color={CAT_COLOR[c.cat] || 'var(--brand)'} style={{ height: 8 }} /></div>
                <div className="num" style={{ width: 72, textAlign: 'right', fontSize: 13, fontWeight: 800, color: c.net > 0 ? 'var(--profit)' : 'var(--ink-3)' }}>{c.net > 0 ? f(c.net, { compact: true }) : '—'}</div>
              </div>
            )); })()}
          </div>

          {/* Applied vs allotted bars */}
          <div style={{ padding: '14px 18px 4px' }}>
            <BarChart data={barData} keys={['applied', 'allot']} colors={['var(--border-strong)', 'var(--brand)']} h={150} />
          </div>

          {/* Sortable report */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead>
                <tr style={{ fontSize: 11.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {cols.map(c => <SortTh key={c.key} col={c} sort={sort} onSort={onSort} style={{ padding: '10px 18px' }} />)}
                </tr>
              </thead>
              <tbody>
                {rows.map(c => (
                  <tr key={c.cat} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 18px' }}><Badge tone={CAT_TONE[c.cat] || 'neutral'}>{c.cat}</Badge></td>
                    <td className="num" style={{ padding: '11px 18px', textAlign: 'right', color: 'var(--ink-2)' }}>{c.ipos}</td>
                    <td className="num" style={{ padding: '11px 18px', textAlign: 'right', color: 'var(--ink-2)' }}>{c.applied}</td>
                    <td className="num" style={{ padding: '11px 18px', textAlign: 'right', color: 'var(--ink-2)' }}>{c.allotted}</td>
                    <td className="num" style={{ padding: '11px 18px', textAlign: 'right', color: 'var(--ink-2)' }}>{c.allotRate}%</td>
                    <td className="num" style={{ padding: '11px 18px', textAlign: 'right', color: 'var(--ink-2)' }}>{c.gross > 0 ? f(c.gross, { compact: true }) : '—'}</td>
                    <td className="num" style={{ padding: '11px 18px', textAlign: 'right', fontWeight: 700, color: c.net > 0 ? 'var(--profit)' : 'var(--ink-3)' }}>{c.net > 0 ? f(c.net, { compact: true }) : '—'}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid var(--border-strong)', background: 'var(--surface-2)' }}>
                  <td style={{ padding: '11px 18px', fontWeight: 800 }}>All</td>
                  <td className="num" style={{ padding: '11px 18px', textAlign: 'right', fontWeight: 800 }}>{tot.ipos}</td>
                  <td className="num" style={{ padding: '11px 18px', textAlign: 'right', fontWeight: 800 }}>{tot.applied}</td>
                  <td className="num" style={{ padding: '11px 18px', textAlign: 'right', fontWeight: 800 }}>{tot.allotted}</td>
                  <td className="num" style={{ padding: '11px 18px', textAlign: 'right', fontWeight: 800 }}>{tot.applied > 0 ? Math.round(tot.allotted / tot.applied * 100) : 0}%</td>
                  <td className="num" style={{ padding: '11px 18px', textAlign: 'right', fontWeight: 800 }}>{tot.gross > 0 ? f(tot.gross, { compact: true }) : '—'}</td>
                  <td className="num" style={{ padding: '11px 18px', textAlign: 'right', fontWeight: 800, color: 'var(--profit)' }}>{tot.net > 0 ? f(tot.net, { compact: true }) : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

function Dashboard({ navigate, tweaks }) {
  const D = window.DB;
  const layout = (tweaks && tweaks.dashLayout) || 'kpi';
  const f = (n, o) => D.fmtINR(n, o);

  const kpiCards = [
    { icon: 'calendar', label: 'IPOs Applied',        value: D.kpis.applied,                                tone: 'neutral', nav: 'admin' },
    { icon: 'check',    label: 'Total Allotments',    value: D.kpis.allotments,                             tone: 'neutral', nav: 'admin' },
    { icon: 'spark',    label: 'Allotment Rate',      value: D.kpis.allotRate + '%',                        tone: 'neutral', nav: 'admin' },
    { icon: 'wallet',   label: 'Total Investment',    value: f(D.kpis.invested, { compact: true }),         tone: 'neutral', nav: 'pooling', delta: { tone: 'neutral', label: 'this season' } },
    { icon: 'trend',    label: 'Total Profit',        value: f(D.kpis.profit,   { compact: true }),         tone: 'profit',  nav: 'pooling',
      delta: D.kpis.roi > 0 ? { tone: 'profit', label: '+' + D.kpis.roi + '% ROI' } : undefined },
    { icon: 'ledger',   label: 'Pending Settlements', value: D.kpis.pending,                                tone: 'warn',    nav: 'settlement',
      delta: D.kpis.pendingAmount > 0 ? { tone: 'warn', label: f(D.kpis.pendingAmount, { compact: true }) } : undefined },
  ];

  const ProfitTrend = (
    <ChartCard title="Monthly profit trend" sub="Pooled net profit · last 6 months"
      right={null}>
      <AreaChart data={D.monthlyProfit} h={184} fmt={v => f(v, { compact: true })} />
    </ChartCard>
  );
  const SmeVsMain = (
    <ChartCard title="SME vs Mainboard" sub="Profit split by board">
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <Donut size={150} stroke={20}
          segments={[{ v: D.smeVsMain.sme, color: 'var(--sme)' }, { v: D.smeVsMain.mainboard, color: 'var(--mainboard)' }]}
          centerLabel={f(D.smeVsMain.sme + D.smeVsMain.mainboard, { compact: true })} centerSub="net profit" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['SME', D.smeVsMain.sme, 'var(--sme)'], ['Mainboard', D.smeVsMain.mainboard, 'var(--mainboard)']].map(([l, v, c]) => (
            <div key={l}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: c }} /> {l}
              </div>
              <div className="num" style={{ fontSize: 19, fontWeight: 800, marginTop: 3 }}>{f(v, { compact: true })}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{(() => { const t = D.smeVsMain.sme + D.smeVsMain.mainboard; return t > 0 ? Math.round(v / t * 100) + '% of total' : '—'; })()}</div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
  const AllotHistory = (
    <ChartCard title="Allotment history" sub="Applications vs allotments"
      right={<Legend items={[{ label: 'Applied', color: 'var(--border-strong)' }, { label: 'Allotted', color: 'var(--brand)' }]} />}>
      <BarChart data={D.allotHistory} keys={['applied', 'allot']} colors={['var(--border-strong)', 'var(--brand)']} h={184} />
    </ChartCard>
  );

  const ProfitByIpo = <ProfitByIpoCard D={D} navigate={navigate} f={f} />;
  const ByCategory  = <CategoryCard D={D} f={f} />;

  // Recent activity = IPOs the pool actually applied to (any status), newest
  // first. Built from D.profitByIpo so the Profit column uses the shared PoolMath
  // net (matching the Profit by IPO table), then joined back to the full IPO for
  // logo/sector/status. Null-dated IPOs sort last.
  const recentActivity = (D.profitByIpo || [])
    .map(p => ({ ...p, ipo: D.ipo(p.id) }))
    .filter(r => r.ipo)
    .sort((a, b) => String(b.month || '').localeCompare(String(a.month || '')))
    .slice(0, 5);

  const RecentTable = (
    <Card pad={0}>
      <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 14.5, fontWeight: 800 }}>Recent IPO activity</div>
        <Button variant="ghost" size="sm" onClick={() => navigate('admin')}>View all →</Button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr style={{ fontSize: 11.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {['IPO', 'Board', 'Applied', 'Allotted', 'Profit', 'Status'].map((h, i) => (
                <th key={h} style={{ textAlign: i > 1 ? 'right' : 'left', fontWeight: 700, padding: '11px 18px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentActivity.map(({ ipo, applied, allotted, net }) => (
              <tr key={ipo.id} onClick={() => navigate('ipo', { id: ipo.id })} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '13px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <IpoLogo ipo={ipo} size={36} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{ipo.short}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{ipo.sector}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '13px 18px' }}><Badge tone={ipo.type === 'SME' ? 'sme' : 'mainboard'}>{ipo.type}</Badge></td>
                <td className="num" style={{ padding: '13px 18px', textAlign: 'right', color: 'var(--ink-2)' }}>{applied || '—'}</td>
                <td className="num" style={{ padding: '13px 18px', textAlign: 'right', color: 'var(--ink-2)' }}>{allotted || '—'}</td>
                <td className="num" style={{ padding: '13px 18px', textAlign: 'right', fontWeight: 700, color: net > 0 ? 'var(--profit)' : 'var(--ink-3)' }}>{net > 0 ? f(net, { compact: true }) : '—'}</td>
                <td style={{ padding: '13px 18px', textAlign: 'right' }}>
                  <Badge tone={ipo.status === 'Listed' ? 'profit' : ipo.status === 'Open' ? 'info' : 'neutral'}>{ipo.status}</Badge>
                </td>
              </tr>
            ))}
            {recentActivity.length === 0 && (
              <tr style={{ borderTop: '1px solid var(--border)' }}>
                <td colSpan={6} style={{ padding: '18px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No IPO activity yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );

  // Member leaderboard — every member ranked by total net profit across all IPOs
  // (D.memberProfits, computed once in loadDB via PoolMath). Highlights the top
  // earner, then lists everyone with a relative profit bar.
  const memberRanks = (D.memberProfits || []).filter(m => m.profit > 0);
  const topProfit   = memberRanks.length ? memberRanks[0].profit : 0;

  const MemberLeaderboard = (
    <Card pad={0}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 14.5, fontWeight: 800 }}>Member leaderboard</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>Net profit earned per member · across all IPOs</div>
      </div>
      {memberRanks.length > 0 ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'var(--profit-soft)', borderBottom: '1px solid var(--border)' }}>
            <Avatar name={memberRanks[0].name} hue={memberRanks[0].avatarHue} size={44} you={memberRanks[0].you} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Badge tone="profit" icon="spark">Top earner</Badge>
              <div style={{ fontSize: 15, fontWeight: 800, marginTop: 5 }}>
                {memberRanks[0].name}{memberRanks[0].you && <span style={{ color: 'var(--brand)', fontWeight: 600 }}> · You</span>}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{memberRanks[0].pans} PAN{memberRanks[0].pans === 1 ? '' : 's'} applied</div>
            </div>
            <div className="num" style={{ fontSize: 24, fontWeight: 800, color: 'var(--profit)', whiteSpace: 'nowrap' }}>{f(memberRanks[0].profit)}</div>
          </div>
          {memberRanks.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', background: m.you ? 'var(--brand-tint)' : 'transparent' }}>
              <span className="num" style={{ width: 18, textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--ink-3)' }}>{i + 1}</span>
              <Avatar name={m.name} hue={m.avatarHue} size={30} you={m.you} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.name}{m.you && <span style={{ color: 'var(--brand)', fontWeight: 600 }}> · You</span>}
                </div>
                <div style={{ marginTop: 5 }}><Meter value={m.profit} max={topProfit} color="var(--profit)" h={6} /></div>
              </div>
              <div className="num" style={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}>{f(m.profit, { compact: true })}</div>
            </div>
          ))}
        </>
      ) : (
        <div style={{ padding: '18px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No member profits yet.</div>
      )}
    </Card>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Spotlight hero (variant) */}
      {layout === 'spotlight' && (
        <div className="dash-spotlight">
          <Card pad={24} style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-700) 100%)', border: 'none', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,.08)', top: -120, right: -60 }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.8)' }}>Total pooled profit · this season</div>
              <div className="num" style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-.02em', margin: '6px 0' }}>{f(D.kpis.profit)}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {D.kpis.roi > 0 && <Badge tone="neutral" icon="arrowUp"><span style={{ color: '#fff' }}>+{D.kpis.roi}% ROI</span></Badge>}
                <span style={{ background: 'rgba(255,255,255,.16)', borderRadius: 999, padding: '3px 11px', fontSize: 12, fontWeight: 700 }}>{D.kpis.allotments} IPOs allotted</span>
                {D.kpis.pendingAmount > 0 && <span style={{ background: 'rgba(255,255,255,.16)', borderRadius: 999, padding: '3px 11px', fontSize: 12, fontWeight: 700 }}>{f(D.kpis.pendingAmount, { compact: true })} pending</span>}
              </div>
            </div>
          </Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
            {kpiCards.slice(0, 4).map((k, i) => <KPICard key={i} {...k} />)}
          </div>
        </div>
      )}

      {/* KPI grid */}
      {layout !== 'spotlight' && (
        <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: layout === 'compact' ? 'repeat(3,1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {kpiCards.map((k, i) => <KPICard key={i} {...k} onClick={k.nav ? () => navigate(k.nav) : undefined} />)}
        </div>
      )}

      {/* Charts */}
      {layout === 'compact' ? (
        <div className="dash-charts-2" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18 }}>
          {ProfitTrend}{SmeVsMain}
          <div style={{ gridColumn: '1 / -1' }}>{AllotHistory}</div>
        </div>
      ) : (
        <>
          <div className="dash-charts-2" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
            {ProfitTrend}{SmeVsMain}
          </div>
          <div className="dash-charts-2" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
            {AllotHistory}
          </div>
        </>
      )}

      {ByCategory}

      {ProfitByIpo}

      {MemberLeaderboard}

      {RecentTable}
    </div>
  );
}

Object.assign(window, { Dashboard, KPICard, ChartCard, Legend });
