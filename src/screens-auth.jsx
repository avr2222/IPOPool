/* ============================================================
   IPO Pool — Auth (Login)
   ============================================================ */

function Logo({ size = 28, color = 'var(--brand)', light = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <div style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <rect x="1" y="1" width="30" height="30" rx="9" fill={light ? 'rgba(255,255,255,.18)' : color} />
          <circle cx="9"  cy="23" r="2" fill="rgba(255,255,255,.6)" />
          <circle cx="16" cy="23" r="2" fill="rgba(255,255,255,.6)" />
          <circle cx="23" cy="23" r="2" fill="rgba(255,255,255,.6)" />
          <path d="M9 21L16 14M16 21L16 14M23 21L16 14"
            stroke="rgba(255,255,255,.38)" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="16" cy="12" r="4" fill="rgba(255,255,255,.18)" stroke="#fff" strokeWidth="1.5" />
          <path d="M16 10V7M14 8.5L16 6.5L18 8.5"
            stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span style={{ fontSize: size * 0.62, fontWeight: 800, letterSpacing: '-.02em', color: light ? '#fff' : 'var(--ink)' }}>
        IPO<span style={{ color: light ? '#fff' : 'var(--brand)' }}>Pool</span>
      </span>
    </div>
  );
}

// One tappable option on the login chooser (Admin Login / Member Login).
function ChooserOption({ icon, title, subtitle, onClick, style }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
        border: '1.5px solid ' + (h ? 'var(--brand)' : 'var(--border-strong)'), borderRadius: 'var(--r-md)',
        padding: '16px 16px', background: h ? 'var(--brand-tint)' : 'var(--surface)', cursor: 'pointer', transition: 'all .15s',
        ...style,
      }}>
      <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: 'var(--brand-tint)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={19} color="var(--brand)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 1 }}>{subtitle}</div>
      </div>
      <Icon name="chevR" size={16} color="var(--ink-3)" style={{ flexShrink: 0 }} />
    </button>
  );
}

function LoginScreen({ onLogin }) {
  const [mode,     setMode]     = useState(null);   // null = chooser, 'admin' = email/password form
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState('');

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit  = validEmail && password.length >= 1 && !loading;

  const handleLogin = async () => {
    if (!canSubmit) { setErr('Enter your email and password.'); return; }
    setLoading(true);
    setErr('');
    try {
      const { error } = await window.sb.auth.signInWithPassword({ email, password });
      if (error) {
        setErr(
          error.message.includes('Invalid login credentials')
            ? 'Invalid email or password.'
            : error.message
        );
        setLoading(false);
      } else {
        await onLogin();   // loadDB() + set authed in app.jsx
      }
    } catch (e) {
      setErr('Connection error. Check your internet and try again.');
      setLoading(false);
    }
  };

  const inputWrap = {
    display: 'flex', alignItems: 'center', gap: 10,
    border: '1.5px solid var(--border-strong)',
    borderRadius: 'var(--r-md)', padding: '13px 15px',
    background: 'var(--surface)', transition: 'border-color .15s',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', background: 'var(--bg)' }} className="login-grid">

      {/* Brand panel */}
      <div className="login-brand" style={{
        background: 'linear-gradient(160deg, #0B8A4B 0%, #086B3A 64%, #064d2a 100%)', color: '#fff',
        padding: '48px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 460, height: 460, borderRadius: '50%', background: 'rgba(255,255,255,.06)', top: -160, right: -120 }} />
        <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,.05)', bottom: -120, left: -80 }} />
        <Logo light size={30} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.12, letterSpacing: '-.02em' }}>
            Apply together.<br />Profit together.
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,.82)', maxWidth: 380, marginTop: 18 }}>
            Pool PAN accounts across friends and family, apply for every SME &amp; Mainboard IPO,
            and split listing-day profits equally — tracked automatically.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div style={{ display: 'grid', placeItems: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div className="login-mobile-logo" style={{ marginBottom: 28, display: 'none' }}><Logo size={28} /></div>

          {mode === null ? (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 6px' }}>Welcome</h1>
              <p style={{ color: 'var(--ink-3)', fontSize: 14.5, margin: '0 0 26px' }}>Choose how you'd like to sign in.</p>

              <ChooserOption icon="shield" title="Admin Login" subtitle="Manage IPOs, allotments and the pool"
                onClick={() => setMode('admin')} />
              <ChooserOption icon="pan" title="Member Login" subtitle="Check your own PAN's profits"
                onClick={() => { window.location.hash = '#/me'; window.location.reload(); }} style={{ marginTop: 12 }} />
            </>
          ) : (
            <>
              <button onClick={() => setMode(null)}
                style={{ border: 'none', background: 'none', padding: 0, marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--ink-3)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <Icon name="chevL" size={14} /> Back
              </button>

              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 6px' }}>Welcome back</h1>
              <p style={{ color: 'var(--ink-3)', fontSize: 14.5, margin: '0 0 26px' }}>Login with the email linked to your PAN pool.</p>

              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 8 }}>Email address</label>
              <div style={{ ...inputWrap, borderColor: validEmail ? 'var(--brand)' : 'var(--border-strong)', marginBottom: 14 }}>
                <Icon name="mail" size={16} color="var(--ink-2)" style={{ flexShrink: 0 }} />
                <input value={email} onChange={e => { setEmail(e.target.value); setErr(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="you@example.com" type="email"
                  style={{ border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, width: '100%', background: 'transparent', color: 'var(--ink)' }} />
              </div>

              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 8 }}>Password</label>
              <div style={{ ...inputWrap, borderColor: password ? 'var(--brand)' : 'var(--border-strong)', marginBottom: err ? 10 : 22 }}>
                <Icon name="lock" size={16} color="var(--ink-2)" style={{ flexShrink: 0 }} />
                <input value={password} onChange={e => { setPassword(e.target.value); setErr(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••" type={showPw ? 'text' : 'password'}
                  style={{ border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, width: '100%', background: 'transparent', color: 'var(--ink)' }} />
                <button onClick={() => setShowPw(v => !v)}
                  style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: 'var(--ink-3)', display: 'grid', placeItems: 'center' }}>
                  <Icon name={showPw ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </div>

              {err && <div style={{ color: 'var(--loss)', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{err}</div>}

              <Button variant="primary" size="lg" full onClick={handleLogin} iconRight={loading ? undefined : 'chevR'}
                style={{ opacity: loading ? .7 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
                {loading ? 'Signing in…' : 'Login'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, Logo });
