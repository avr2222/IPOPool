/* ============================================================
   IPO Pool — Settings
   ============================================================ */

function SettingsScreen() {
  const D = window.DB;
  const me = D.members.find(m => m.you);

  const [stcg,       setStcg]       = useState(() => parseFloat(localStorage.getItem('stcg')       || '15'));
  const [brokerage,  setBrokerage]  = useState(() => parseFloat(localStorage.getItem('brokerage')   || '0'));
  const [bonusRate,  setBonusRate]  = useState(() => parseFloat(localStorage.getItem('allotBonus')  || '0'));
  const [idleRate,   setIdleRate]   = useState(() => parseFloat(localStorage.getItem('idleRate')    || '2.5'));
  const [saved,      setSaved]      = useState(false);

  // Repairs settlement_pans (migration 011's per-PAN settlement breakdown)
  // for any IPO finalized before that table existed -- those pools have real
  // `settlements` rows (so the member portal's family total is correct) but
  // no per-PAN rows, so a member's "Individual profit" table there silently
  // undercounts. Safe to run any time: createSettlements never touches an
  // already-Paid settlement's amount, this only adds/fixes the breakdown.
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);
  const [backfillErr, setBackfillErr] = useState('');
  const runBackfill = async () => {
    setBackfilling(true); setBackfillErr(''); setBackfillResult(null);
    try {
      const result = await D.mutations.backfillSettlementBreakdown();
      setBackfillResult(result);
    } catch (e) {
      setBackfillErr(e.message || 'Backfill failed.');
    }
    setBackfilling(false);
  };

  const handleSave = () => {
    localStorage.setItem('stcg',       String(stcg));
    localStorage.setItem('brokerage',  String(brokerage));
    localStorage.setItem('allotBonus', String(bonusRate));
    localStorage.setItem('idleRate',   String(idleRate));
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  // Live preview of how settings affect a sample profit
  const sampleGross    = 100000;
  const sampleStcg     = Math.round(sampleGross * stcg / 100);
  const sampleAfterTax = Math.max(0, sampleGross - sampleStcg);
  const sampleBonus    = bonusRate > 0 ? Math.round(sampleAfterTax * bonusRate / 100) : 0;
  const sampleNet      = Math.max(0, sampleAfterTax - sampleBonus - brokerage);

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
        <SectionTitle title="Tax & cost settings" sub="STCG and brokerage are deducted before the pool is split; the bonus is kept by whoever was allotted, on top of their pool share" />
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

          <Field
            label="Allotted-PAN bonus"
            sub="A reward for whoever actually got allotment: this % of THEIR OWN after-tax gain is kept by that PAN personally, on top of their normal equal pool share — the rest still goes into the pool. Set to 0 to split everything equally as before."
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number" min="0" max="100" step="0.5"
                value={bonusRate}
                onChange={e => setBonusRate(parseFloat(e.target.value) || 0)}
                style={{ ...inputStyle, maxWidth: 100 }}
              />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-2)' }}>%</span>
            </div>
          </Field>
        </div>

        {/* Live preview */}
        <div style={{ marginTop: 20, padding: 16, background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Preview on ₹1,00,000 gross profit</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['Gross profit',                             sampleGross,  'var(--ink)'],
              [`STCG (${stcg}%)`,                           -sampleStcg,  'var(--loss)'],
              ...(bonusRate > 0 ? [[`Allotted-PAN bonus (${bonusRate}% of after-tax, kept personally)`, -sampleBonus, 'var(--loss)']] : []),
              ['Brokerage',                                 -brokerage,   'var(--loss)'],
              ['Net distributable (equal pool split)',      sampleNet,    'var(--brand)'],
            ].map(([l, v, c]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: v === sampleNet ? 800 : 600 }}>
                <span style={{ color: 'var(--ink-2)' }}>{l}</span>
                <span className="num" style={{ color: c }}>{v < 0 ? '-' : ''}{D.fmtINR(Math.abs(v))}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* XIRR settings */}
      <Card pad={24}>
        <SectionTitle title="XIRR settings" sub="How annualised return is estimated for time your capital isn't blocked in an IPO" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 4 }}>
          <Field
            label="Idle capital interest rate"
            sub="While your money isn't blocked in an IPO, XIRR assumes it earns this rate in a savings account — like a fixed deposit or sweep account. Doesn't affect any actual profit split, only how XIRR is calculated. Set to 0 to ignore idle time entirely."
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number" min="0" max="15" step="0.1"
                value={idleRate}
                onChange={e => setIdleRate(parseFloat(e.target.value) || 0)}
                style={{ ...inputStyle, maxWidth: 100 }}
              />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-2)' }}>%</span>
            </div>
          </Field>
        </div>
      </Card>

      {/* Data repair */}
      <Card pad={24}>
        <SectionTitle title="Data repair" sub="One-time fixes for data written before a feature existed" />
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field
            label="Backfill per-PAN settlement breakdown"
            sub="IPOs finalized before the per-PAN breakdown feature shipped have a correct family total but no per-PAN split, so a member's 'Individual profit' table on their own portal can add up to less than the total shown above it. Safe to run any time — it never changes an already-paid amount, it only fills in or corrects the per-PAN breakdown."
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Button variant="ghost" icon={backfilling ? undefined : 'refresh'} onClick={runBackfill}
                style={{ opacity: backfilling ? .7 : 1, pointerEvents: backfilling ? 'none' : 'auto' }}>
                {backfilling ? 'Repairing…' : 'Backfill now'}
              </Button>
              {backfillResult && (
                <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                  Checked {backfillResult.total} IPO{backfillResult.total === 1 ? '' : 's'} · repaired {backfillResult.updated} · {backfillResult.skipped} had nothing to distribute
                  {backfillResult.failed.length > 0 && <span style={{ color: 'var(--loss)', fontWeight: 700 }}> · {backfillResult.failed.length} failed</span>}
                </span>
              )}
            </div>
            {backfillErr && <div style={{ color: 'var(--loss)', fontSize: 12.5, fontWeight: 600, marginTop: 6 }}>{backfillErr}</div>}
            {backfillResult && backfillResult.failed.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--loss)' }}>
                {backfillResult.failed.map(f => `${D.ipo(f.ipo)?.short || f.ipo}: ${f.message}`).join(' · ')}
              </div>
            )}
          </Field>
        </div>
      </Card>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Button variant="primary" icon={saved ? 'check' : undefined} onClick={handleSave} style={{ minWidth: 140 }}>
          {saved ? 'Saved!' : 'Save settings'}
        </Button>
        <button onClick={() => { setStcg(15); setBrokerage(0); setBonusRate(0); setIdleRate(2.5); }} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
          Reset to defaults (15% STCG, ₹0 brokerage, 0% bonus, 2.5% idle rate)
        </button>
        {saved && <span style={{ fontSize: 13, color: 'var(--profit)', fontWeight: 600 }}>Settings applied to all profit and XIRR calculations.</span>}
      </div>

    </div>
  );
}

Object.assign(window, { SettingsScreen });
