/* ============================================================
   IPO Pool — Settings
   ============================================================ */

function SettingsScreen() {
  const D = window.DB;
  const me = D.members.find(m => m.you);

  const [stcg,      setStcg]      = useState(() => parseFloat(localStorage.getItem('stcg')      || '15'));
  const [brokerage, setBrokerage] = useState(() => parseFloat(localStorage.getItem('brokerage')  || '0'));
  const [saved,     setSaved]     = useState(false);

  const handleSave = () => {
    localStorage.setItem('stcg',      String(stcg));
    localStorage.setItem('brokerage', String(brokerage));
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  // Live preview of how settings affect a sample profit
  const sampleGross = 100000;
  const sampleStcg  = Math.round(sampleGross * stcg / 100);
  const sampleNet   = Math.max(0, sampleGross - sampleStcg - brokerage);

  const Field = ({ label, sub, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{label}</div>
      {children}
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );

  const inputStyle = {
    fontSize: 15, fontWeight: 700, padding: '10px 13px', border: '1.5px solid var(--border)',
    borderRadius: 'var(--r-md)', background: 'var(--bg)', color: 'var(--ink)',
    outline: 'none', width: '100%',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 560 }}>

      {/* Pool info */}
      <Card pad={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={me?.name || 'You'} hue={me?.avatarHue || 152} size={48} you />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{me?.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{me?.email} · Pool Admin</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 16, padding: '14px 0', borderTop: '1px solid var(--border)' }}>
          {[
            [D.members.length,                               'Members'],
            [D.pans.length,                                  'PANs in pool'],
            [D.ipos.filter(i => i.status === 'Listed').length, 'IPOs listed'],
          ].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div className="num" style={{ fontSize: 22, fontWeight: 800 }}>{v}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tax & costs */}
      <Card pad={24}>
        <SectionTitle title="Tax & cost settings" sub="Deducted from gross profit before the per-PAN share is calculated" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>

          <Field
            label="Short-Term Capital Gains (STCG) tax"
            sub="Budget 2024 raised STCG to 20% (for listed equity sold after 23 Jul 2024). Set to 0 if you're calculating manually or already deducted."
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number" min="0" max="40" step="0.5"
                value={stcg}
                onChange={e => setStcg(parseFloat(e.target.value) || 0)}
                style={{ ...inputStyle, maxWidth: 100 }}
              />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-2)' }}>%</span>
              {stcg === 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--warn)', background: 'var(--warn-soft)', borderRadius: 'var(--r-sm)', padding: '3px 9px' }}>
                  Profit shows pre-tax — default is 15%
                </span>
              )}
            </div>
          </Field>

          <Field
            label="Brokerage / sell charges (per IPO)"
            sub="Flat amount deducted per IPO sell. Zerodha/Groww typically charge ₹20–50 per order."
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-2)' }}>₹</span>
              <input
                type="number" min="0" step="1"
                value={brokerage}
                onChange={e => setBrokerage(parseFloat(e.target.value) || 0)}
                style={{ ...inputStyle, maxWidth: 120 }}
              />
            </div>
          </Field>
        </div>

        {/* Live preview */}
        <div style={{ marginTop: 20, padding: 16, background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Preview on ₹1,00,000 gross profit</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['Gross profit',         sampleGross,  'var(--ink)'],
              [`STCG (${stcg}%)`,      -sampleStcg,  'var(--loss)'],
              ['Brokerage',            -brokerage,   'var(--loss)'],
              ['Net distributable',    sampleNet,    'var(--brand)'],
            ].map(([l, v, c]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: v === sampleNet ? 800 : 600 }}>
                <span style={{ color: 'var(--ink-2)' }}>{l}</span>
                <span className="num" style={{ color: c }}>{v < 0 ? '-' : ''}{D.fmtINR(Math.abs(v))}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          <Button variant="primary" icon={saved ? 'check' : undefined} onClick={handleSave} style={{ minWidth: 140 }}>
            {saved ? 'Saved!' : 'Save settings'}
          </Button>
          <button onClick={() => { setStcg(15); setBrokerage(0); }} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
            Reset to defaults (15% STCG, ₹0 brokerage)
          </button>
          {saved && <span style={{ fontSize: 13, color: 'var(--profit)', fontWeight: 600 }}>Settings applied to all profit calculations.</span>}
        </div>
      </Card>

    </div>
  );
}

Object.assign(window, { SettingsScreen });
