/* ============================================================
   IPO Pool — Member self-service portal (PAN login, no password)
   Opened via the shared deep link  #/apply/<ipoId>
   Talks ONLY to window.MemberAPI (SECURITY DEFINER RPCs); never
   loads the full admin dataset.
   ============================================================ */

const MEMBER_CATS = ['Retail', 'sHNI', 'bHNI'];
const MEMBER_SESSION_KEY = 'ipopool_member';

function MemberPortal({ ipoId }) {
  const [ipo,     setIpo]     = useState(null);
  const [ipoErr,  setIpoErr]  = useState('');
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'grid', placeItems: 'center', padding: '32px 16px' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
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
            : <MemberApply ipo={ipo} session={session} />}
      </div>
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
      onLogin({ loginPan: clean, memberId: res.member_id, name: res.name, pans: res.pans || [] });
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

  // Per-PAN application state: { [panId]: { on, category, lots } }
  const [rows, setRows] = useState(() => {
    const init = {};
    pans.forEach(p => { init[p.id] = { on: false, category: isSME ? 'SME' : 'Retail', lots: 1 }; });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');
  const [done,   setDone]   = useState(null);   // { count } after success

  const setRow = (id, patch) => setRows(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  const selected = pans.filter(p => rows[p.id] && rows[p.id].on);

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
      setDone({ count: (res && res.count) || payload.length });
    } catch (e) {
      setErr(e.message || 'Could not save your application. Please try again.');
    }
    setSaving(false);
  };

  if (done) {
    return (
      <Card pad={28} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--profit-soft)', color: 'var(--profit)', display: 'grid', placeItems: 'center' }}>
          <Icon name="check" size={26} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 800 }}>Application recorded</div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-3)', maxWidth: 340, lineHeight: 1.6 }}>
          Saved <strong>{done.count} PAN{done.count === 1 ? '' : 's'}</strong> for <strong>{ipo.name}</strong>.
          The admin will update allotment results after listing.
        </div>
        <Button variant="ghost" onClick={() => setDone(null)}>Edit my application</Button>
      </Card>
    );
  }

  return (
    <Card pad={0}>
      <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 700 }}>Signed in as {session.name}</div>
        <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{ipo ? ipo.name : 'Apply'}</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3 }}>
          Tick the PANs that applied{isSME ? '' : ', pick a category'} and the number of lots.
        </div>
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
                  </div>
                </div>
              </label>

              {r.on && (
                <div style={{ display: 'flex', gap: 10, marginTop: 11, marginLeft: 29, flexWrap: 'wrap' }}>
                  {!isSME && (
                    <select value={r.category} onChange={e => setRow(p.id, { category: e.target.value })}
                      style={{ border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)', padding: '7px 10px', fontSize: 13, fontWeight: 600, background: 'var(--surface)', color: 'var(--ink)' }}>
                      {MEMBER_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>Lots</span>
                    <input type="number" min="1" value={r.lots} onChange={e => setRow(p.id, { lots: e.target.value })}
                      style={{ width: 64, border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)', padding: '7px 10px', fontSize: 13, fontWeight: 700, background: 'var(--surface)', color: 'var(--ink)' }} />
                  </div>
                </div>
              )}
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
            {saving ? 'Saving…' : 'Submit application'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

Object.assign(window, { MemberPortal });
