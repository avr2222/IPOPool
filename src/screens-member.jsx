/* ============================================================
   IPO Pool — Member self-service portal (PAN login, no password)
   Opened via the shared deep link  #/apply/<ipoId>
   Talks ONLY to window.MemberAPI (SECURITY DEFINER RPCs); never
   loads the full admin dataset.
   ============================================================ */

const MEMBER_CATS = ['Retail', 'sHNI', 'bHNI'];
const MEMBER_SESSION_KEY = 'ipopool_member';

// Minimum application value (in ₹) a category must EXCEED. Retail has no floor
// (starts at 1 lot); the HNI buckets need enough lots to cross their threshold.
const CAT_FLOOR = { sHNI: 200000, bHNI: 1000000 };

// Smallest number of lots that qualifies for a category, given one lot's value
// (lot_size × cut-off price). e.g. lot value ₹15,000 → sHNI needs ⌊2L/15k⌋+1 = 14 lots.
function catMinLots(cat, lotValue) {
  const floor = CAT_FLOOR[cat];
  if (!floor || !lotValue) return 1;
  return Math.floor(floor / lotValue) + 1;
}

function MemberPortal({ ipoId }) {
  const [ipo,     setIpo]     = useState(null);
  const [ipoErr,  setIpoErr]  = useState('');
  const [tab,     setTab]     = useState('apply');
  const [session, setSession] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(MEMBER_SESSION_KEY) || 'null'); }
    catch (e) { return null; }
  });

  // Load the linked IPO once (works pre-login).
  useEffect(() => {
    if (!ipoId) { setIpoErr('This link is missing an IPO.'); return; }
    let alive = true;
    window.MemberAPI.getApplyIpo(ipoId)
      .then(d => { if (alive) { if (d) setIpo(d); else setIpoErr('This IPO could not be found.'); } })
      .catch(() => alive && setIpoErr('Could not load this IPO. Check your connection.'));
    return () => { alive = false; };
  }, [ipoId]);

  const onLogin = (s) => {
    setSession(s);
    try { sessionStorage.setItem(MEMBER_SESSION_KEY, JSON.stringify(s)); } catch (e) {}
  };
  const onLogout = () => {
    setSession(null);
    try { sessionStorage.removeItem(MEMBER_SESSION_KEY); } catch (e) {}
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(1100px 480px at 50% -8%, var(--brand-tint), transparent 62%), var(--bg)', display: 'grid', placeItems: 'center', padding: '28px 14px calc(28px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="animate" style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Logo size={26} />
          {session && (
            <button onClick={onLogout} style={{ border: 'none', background: 'none', color: 'var(--ink-3)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Log out
            </button>
          )}
        </div>

        {ipoErr && !ipo
          ? <Card pad={28} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Can't open this link</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>{ipoErr}</div>
            </Card>
          : !session
            ? <MemberLogin ipo={ipo} onLogin={onLogin} />
            : (
              <>
                <div style={{ display: 'flex', gap: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 4, marginBottom: 16 }}>
                  {[['apply', 'Apply'], ['summary', 'My profits']].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)} style={{
                      flex: 1, border: 'none', borderRadius: 'var(--r-sm)', padding: '9px 12px', cursor: 'pointer',
                      fontSize: 13.5, fontWeight: 700,
                      background: tab === key ? 'var(--surface)' : 'transparent',
                      color: tab === key ? 'var(--brand)' : 'var(--ink-3)',
                      boxShadow: tab === key ? 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,.06))' : 'none',
                    }}>{label}</button>
                  ))}
                </div>
                {tab === 'apply'
                  ? <MemberApply ipo={ipo} session={session} />
                  : <MemberSummary session={session} />}
              </>
            )}
      </div>
    </div>
  );
}

function MemberSummary({ session }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');
  const f = (n, o) => (window.fmtINR ? window.fmtINR(n, o) : '₹' + (n || 0));

  useEffect(() => {
    let alive = true;
    window.MemberAPI.summary(session.loginPan)
      .then(d => { if (alive) { setData(d || {}); setLoading(false); } })
      .catch(() => { if (alive) { setErr('Could not load your profits. Please try again.'); setLoading(false); } });
    return () => { alive = false; };
  }, [session.loginPan]);

  if (loading) return <Card pad={28} style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 13.5 }}>Loading your profits…</Card>;
  if (err)     return <Card pad={28} style={{ textAlign: 'center', color: 'var(--loss)', fontSize: 13.5, fontWeight: 600 }}>{err}</Card>;

  const d        = data || {};
  const ipos     = d.ipos || [];
  const applied  = d.pans_applied || 0;
  const allot    = d.allotments || 0;
  const rate     = applied > 0 ? Math.round(allot / applied * 100) : 0;
  const isFamily = d.scope ? d.scope === 'family' : !!session.isHead;

  const SETTLE = {
    paid:     { label: 'Paid',      tone: 'profit' },
    partly:   { label: 'Part paid', tone: 'info' },
    pending:  { label: 'Pending',   tone: 'warn' },
    awaiting: { label: 'Awaiting',  tone: 'neutral' },
    '-':      { label: '—',         tone: 'neutral' },
  };

  const Stat = ({ label, value, sub, tone }) => (
    <Card pad={16} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{label}</span>
      <span className="num" style={{ fontSize: 20, fontWeight: 800, color: tone || 'var(--ink)' }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{sub}</span>}
    </Card>
  );

  const cols = [
    { key: 'short',         label: 'IPO',      align: 'left',  get: p => p.short || '' },
    { key: 'applied',       label: 'Applied',  align: 'right', get: p => p.applied || 0, defDir: 'desc' },
    { key: 'allotted',      label: 'Allotted', align: 'right', get: p => p.allotted || 0, defDir: 'desc' },
    { key: 'profit',        label: 'Profit',   align: 'right', get: p => p.profit || 0, defDir: 'desc' },
    { key: 'settle_status', label: 'Status',   align: 'right', get: p => p.settle_status || '' },
  ];
  const [iposSort, onIposSort] = useSortState('profit', 'desc');
  const sortedIpos = sortRows(ipos, iposSort, cols);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 700 }}>
        Signed in as {session.holder || d.login_holder || d.name || session.name}
        {(() => { const pool = d.name || session.name; const who = session.holder || d.login_holder; return pool && who && pool !== who ? <span style={{ fontWeight: 600, color: 'var(--ink-4, var(--ink-3))' }}> · {pool}'s pool</span> : null; })()}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Stat label={isFamily ? 'Profit till date' : 'Your profit'} value={f(d.total_profit, { compact: true })} tone="var(--profit)"
          sub={(d.pending_profit > 0 ? f(d.pending_profit, { compact: true }) + ' pending' : 'all settled')} />
        <Stat label="IPOs applied" value={d.ipos_applied || 0} />
        <Stat label="Allotments" value={allot} sub={applied + (isFamily ? ' PAN applications' : ' applications')} />
        <Stat label="Allotment rate" value={rate + '%'} />
      </div>

      <Card pad={0}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 800 }}>
          {isFamily ? 'Your IPOs' : 'Your applications'}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
            <thead>
              <tr style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                {cols.map(c => <SortTh key={c.key} col={c} sort={iposSort} onSort={onIposSort} style={{ padding: '10px 16px' }} />)}
              </tr>
            </thead>
            <tbody>
              {sortedIpos.map(p => {
                const st = SETTLE[p.settle_status] || SETTLE['-'];
                return (
                  <tr key={p.ipo_id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{p.short}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.type}</div>
                    </td>
                    <td className="num" style={{ padding: '11px 16px', textAlign: 'right', color: 'var(--ink-2)' }}>{p.applied}</td>
                    <td className="num" style={{ padding: '11px 16px', textAlign: 'right', color: 'var(--ink-2)' }}>{p.allotted || '—'}</td>
                    <td className="num" style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: p.profit > 0 ? 'var(--profit)' : 'var(--ink-3)' }}>{p.profit > 0 ? f(p.profit, { compact: true }) : '—'}</td>
                    <td style={{ padding: '11px 16px', textAlign: 'right' }}><Badge tone={st.tone} style={{ fontSize: 10 }}>{st.label}</Badge></td>
                  </tr>
                );
              })}
              {ipos.length === 0 && (
                <tr style={{ borderTop: '1px solid var(--border)' }}>
                  <td colSpan={cols.length} style={{ padding: '18px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No applications yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MemberLogin({ ipo, onLogin }) {
  const [pan,     setPan]     = useState('');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  const clean = pan.trim().toUpperCase();
  const looksValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(clean);

  const submit = async () => {
    if (!clean) { setErr('Enter your PAN number.'); return; }
    setLoading(true); setErr('');
    try {
      const res = await window.MemberAPI.login(clean);
      if (!res || !res.member_id) {
        setErr("That PAN isn't registered in this pool. Ask the admin to add it.");
        setLoading(false);
        return;
      }
      onLogin({ loginPan: clean, memberId: res.member_id, name: res.name, holder: res.login_holder || '', isHead: !!res.is_head, pans: res.pans || [] });
    } catch (e) {
      setErr('Could not verify your PAN. Check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <Card pad={26}>
      {ipo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <IpoLogo ipo={{ hue: 220, logo: (ipo.short || ipo.name || '?').slice(0, 2).toUpperCase() }} size={40} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{ipo.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', display: 'flex', gap: 6, alignItems: 'center' }}>
              <Badge tone={ipo.type === 'SME' ? 'sme' : 'mainboard'}>{ipo.type}</Badge>
              {ipo.band_high ? <span>₹{ipo.band_low}–{ipo.band_high}</span> : null}
            </div>
          </div>
        </div>
      )}
      <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.01em' }}>Apply to this IPO</div>
      <div style={{ fontSize: 13.5, color: 'var(--ink-3)', margin: '4px 0 20px' }}>
        Enter your PAN to record which of your family PANs applied. No password needed.
      </div>

      <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 8 }}>Your PAN number</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid', borderColor: looksValid ? 'var(--brand)' : 'var(--border-strong)', borderRadius: 'var(--r-md)', padding: '13px 15px', background: 'var(--surface)', marginBottom: err ? 10 : 20 }}>
        <Icon name="pan" size={16} color="var(--ink-2)" style={{ flexShrink: 0 }} />
        <input value={pan} onChange={e => { setPan(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="ABCDE1234F" autoCapitalize="characters" autoCorrect="off" spellCheck={false}
          style={{ border: 'none', outline: 'none', fontSize: 15, fontWeight: 700, letterSpacing: '.06em', width: '100%', background: 'transparent', color: 'var(--ink)', textTransform: 'uppercase' }} />
      </div>

      {err && <div style={{ color: 'var(--loss)', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{err}</div>}

      <Button variant="primary" size="lg" full onClick={submit} iconRight={loading ? undefined : 'chevR'}
        style={{ opacity: loading ? .7 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
        {loading ? 'Checking…' : 'Continue'}
      </Button>
      <div style={{ fontSize: 11.5, color: 'var(--ink-4, var(--ink-3))', textAlign: 'center', marginTop: 14 }}>
        Only PANs the admin has registered can apply.
      </div>
    </Card>
  );
}

function MemberApply({ ipo, session }) {
  const isSME = ipo && ipo.type === 'SME';
  const pans  = session.pans || [];
  const f = (n, o) => (window.fmtINR ? window.fmtINR(n, o) : '₹' + (n || 0));

  // Shares per lot, and one lot's rupee value, used to show share counts and the
  // per-category default lots. Fall back to lot_size × cut-off price if lot_value
  // wasn't captured on the IPO.
  const lotSize  = Number(ipo && ipo.lot_size)  || 0;
  const lotValue = Number(ipo && ipo.lot_value) || (lotSize * (Number(ipo && ipo.band_high) || 0)) || 0;

  // Per-PAN application state: { [panId]: { on, category, lots } }
  const [rows, setRows] = useState(() => {
    const init = {};
    pans.forEach(p => { init[p.id] = { on: false, category: isSME ? 'SME' : 'Retail', lots: 1 }; });
    return init;
  });
  const [appliedIds, setAppliedIds] = useState({});   // { [panId]: allot_status } — already-applied PANs
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const [done,    setDone]    = useState(null);   // { count, updated } after success

  // Load the member's existing applications for this IPO, so re-opening the link
  // edits the current application instead of starting blank.
  useEffect(() => {
    if (!ipo || !ipo.id) { setLoading(false); return; }
    let alive = true;
    window.MemberAPI.myIpoApplications(session.loginPan, ipo.id)
      .then(existing => {
        if (!alive) return;
        const applied = {};
        setRows(prev => {
          const next = { ...prev };
          (existing || []).forEach(a => {
            applied[a.pan_id] = a.allot_status || 'pending';
            if (next[a.pan_id]) next[a.pan_id] = { on: true, category: isSME ? 'SME' : (a.category || 'Retail'), lots: a.lots || 1 };
          });
          return next;
        });
        setAppliedIds(applied);
        setLoading(false);
      })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [ipo && ipo.id, session.loginPan]);

  const setRow = (id, patch) => setRows(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  const selected    = pans.filter(p => rows[p.id] && rows[p.id].on);
  const hasExisting = Object.keys(appliedIds).length > 0;

  const submit = async () => {
    if (!selected.length) { setErr('Select at least one PAN that applied.'); return; }
    setSaving(true); setErr('');
    try {
      const payload = selected.map(p => ({
        pan_id: p.id,
        category: isSME ? 'SME' : rows[p.id].category,
        lots: Math.max(1, parseInt(rows[p.id].lots, 10) || 1),
      }));
      const res = await window.MemberAPI.submitApplications(session.loginPan, ipo.id, payload);
      setDone({ count: (res && res.count) || payload.length, updated: hasExisting });
    } catch (e) {
      setErr(e.message || 'Could not save your application. Please try again.');
    }
    setSaving(false);
  };

  if (loading) return <Card pad={28} style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 13.5 }}>Loading…</Card>;

  if (done) {
    return (
      <Card pad={28} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--profit-soft)', color: 'var(--profit)', display: 'grid', placeItems: 'center' }}>
          <Icon name="check" size={26} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 800 }}>{done.updated ? 'Application updated' : 'Application recorded'}</div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-3)', maxWidth: 340, lineHeight: 1.6 }}>
          {done.updated ? 'Updated' : 'Saved'} <strong>{done.count} PAN{done.count === 1 ? '' : 's'}</strong> for <strong>{ipo.name}</strong>.
          The admin will update allotment results after listing.
        </div>
        <Button variant="ghost" onClick={() => setDone(null)}>Edit my application</Button>
      </Card>
    );
  }

  return (
    <Card pad={0}>
      <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 700 }}>
          Signed in as {session.holder || session.name}
          {session.holder && session.name && session.name !== session.holder && <span style={{ fontWeight: 600, color: 'var(--ink-4, var(--ink-3))' }}> · {session.name}'s pool</span>}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{ipo ? ipo.name : 'Apply'}</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3 }}>
          {hasExisting
            ? 'Your saved application is loaded below — adjust and update.'
            : <>Tick the PANs that applied{isSME ? '' : ', pick a category'} and the number of lots.</>}
        </div>
        {!isSME && lotValue > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {MEMBER_CATS.map(c => {
              const m = catMinLots(c, lotValue);
              return (
                <span key={c} style={{ fontSize: 11, fontWeight: 700, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 999, padding: '3px 10px', color: 'var(--ink-2)' }}>
                  {c} · {m} lot{m === 1 ? '' : 's'}
                  <span style={{ color: 'var(--ink-3)', fontWeight: 600 }}> · {(m * lotSize).toLocaleString('en-IN')} sh</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {pans.length === 0 && (
          <div style={{ padding: '22px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            No PANs are registered under your name yet. Ask the admin to add them.
          </div>
        )}
        {pans.map(p => {
          const r = rows[p.id] || {};
          return (
            <div key={p.id} style={{ padding: '13px 20px', borderTop: '1px solid var(--border)', background: r.on ? 'var(--brand-tint)' : 'transparent' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!r.on} onChange={e => setRow(p.id, { on: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: 'var(--brand)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{p.holder}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                    <Badge tone="neutral" style={{ fontSize: 10 }}>{p.relation}</Badge>
                    <span className="num" style={{ marginLeft: 8, letterSpacing: '.06em' }}>{p.pan_masked}</span>
                    {appliedIds[p.id] && (
                      <Badge tone={appliedIds[p.id] === 'allotted' ? 'profit' : 'info'} style={{ fontSize: 10, marginLeft: 8 }}>
                        {appliedIds[p.id] === 'allotted' ? 'Allotted' : 'Applied'}
                      </Badge>
                    )}
                  </div>
                </div>
              </label>

              {r.on && (() => {
                const lots   = Math.max(1, parseInt(r.lots, 10) || 1);
                const shares = lots * lotSize;
                const amount = lots * lotValue;
                return (
                <div style={{ display: 'flex', gap: 10, marginTop: 11, marginLeft: 29, flexWrap: 'wrap', alignItems: 'center' }}>
                  {!isSME && (
                    <select value={r.category}
                      onChange={e => { const cat = e.target.value; setRow(p.id, { category: cat, lots: catMinLots(cat, lotValue) }); }}
                      style={{ border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)', padding: '7px 10px', fontSize: 13, fontWeight: 600, background: 'var(--surface)', color: 'var(--ink)' }}>
                      {MEMBER_CATS.map(c => {
                        const m = catMinLots(c, lotValue);
                        return <option key={c} value={c}>{c}{m > 1 ? ' · min ' + m + ' lots' : ''}</option>;
                      })}
                    </select>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>Lots</span>
                    <input type="number" min="1" value={r.lots} onChange={e => setRow(p.id, { lots: e.target.value })}
                      style={{ width: 64, border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)', padding: '7px 10px', fontSize: 13, fontWeight: 700, background: 'var(--surface)', color: 'var(--ink)' }} />
                  </div>
                  {lotSize > 0 && (
                    <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>
                      = <strong style={{ color: 'var(--ink-2)' }}>{shares.toLocaleString('en-IN')}</strong> shares
                      {amount > 0 && <span> · {f(amount, { compact: true })}</span>}
                    </span>
                  )}
                </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        {err && <div style={{ color: 'var(--loss)', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>
            {selected.length} PAN{selected.length === 1 ? '' : 's'} selected
          </div>
          <Button variant="primary" icon="check" onClick={submit}
            style={{ opacity: saving || !selected.length ? .6 : 1, pointerEvents: saving || !selected.length ? 'none' : 'auto' }}>
            {saving ? 'Saving…' : (hasExisting ? 'Update application' : 'Submit application')}
          </Button>
        </div>
      </div>
    </Card>
  );
}

Object.assign(window, { MemberPortal, MemberSummary });
