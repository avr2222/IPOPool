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

  const ProfitByIpo = (
    <Card pad={0}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 14.5, fontWeight: 800 }}>Profit by IPO</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>Net profit per IPO and combined total</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr style={{ fontSize: 11.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {['IPO', 'Board', 'Applied', 'Allotted', 'Gross gain', 'Net profit'].map((h, i) => (
                <th key={h} style={{ textAlign: i > 1 ? 'right' : 'left', fontWeight: 700, padding: '11px 18px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(D.profitByIpo || []).map(p => (
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
            {(D.profitByIpo || []).length > 0 && (() => {
              const totGross = D.profitByIpo.reduce((s, p) => s + p.gross, 0);
              const totNet   = D.profitByIpo.reduce((s, p) => s + p.net, 0);
              const totApp   = D.profitByIpo.reduce((s, p) => s + p.applied, 0);
              const totAllot = D.profitByIpo.reduce((s, p) => s + p.allotted, 0);
              return (
                <tr style={{ borderTop: '2px solid var(--border-strong)', background: 'var(--surface-2)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 800, fontSize: 13.5 }}>All IPOs together</td>
                  <td style={{ padding: '12px 18px' }} />
                  <td className="num" style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800 }}>{totApp}</td>
                  <td className="num" style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800 }}>{totAllot}</td>
                  <td className="num" style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800 }}>{totGross > 0 ? f(totGross, { compact: true }) : '—'}</td>
                  <td className="num" style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, color: 'var(--profit)' }}>{totNet > 0 ? f(totNet, { compact: true }) : '—'}</td>
                </tr>
              );
            })()}
            {(D.profitByIpo || []).length === 0 && (
              <tr style={{ borderTop: '1px solid var(--border)' }}>
                <td colSpan={6} style={{ padding: '18px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No applications yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );

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
                <span style={{ background: 'rgba(255,255,255,.16)', borderRadius: 999, padding: '3px 11px', fontSize: 12, fontWeight: 700 }}>{D.kpis.allotments} allotments</span>
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

      {ProfitByIpo}

      {MemberLeaderboard}

      {RecentTable}
    </div>
  );
}

Object.assign(window, { Dashboard, KPICard, ChartCard, Legend });
