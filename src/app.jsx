/* ============================================================
   IPO Pool — App shell, routing, tweaks
   ============================================================ */
const { useEffect: useEffectA } = React;

const ACCENTS = {
  Emerald: ['#0B8A4B', '#0A7A42', '#086B3A', '#E8F5EE', '#D6EEE0'],
  Indigo: ['#4F46E5', '#4338CA', '#3730A3', '#ECEBFD', '#DDDBFA'],
  Royal: ['#1E63E9', '#1A56D0', '#1544A8', '#E7F0FE', '#D4E4FD'],
  Teal: ['#0E7C86', '#0B6970', '#08555B', '#E2F4F5', '#CDEBED'],
};

const NAV = [
  { section: 'Overview', items: [['dashboard', 'Dashboard', 'dashboard']] },
  { section: 'Pooling',  items: [['pooling', 'Profit Pool', 'pool'], ['settlement', 'Settlement', 'ledger']] },
  { section: 'Manage',   items: [['pan', 'My PANs', 'pan']] },
  { section: 'System',   items: [['admin', 'Admin Panel', 'admin'], ['settings', 'Settings', 'settings']] },
];
const TITLES = {
  dashboard:  ['Dashboard',     'Your pooled IPO performance at a glance'],
  ipo:        ['IPO Details',   'Applications, allotment & listing performance'],
  pooling:    ['Profit Pool',   'How listing-day profit is split across PANs applied'],
  settlement: ['Settlement',    'Track and record profit distributions'],
  pan:        ['My PANs',       'PAN accounts you manage in this pool'],
  admin:      ['Admin Panel',   'Manage members, IPOs and allotments'],
  settings:   ['Settings',      'Tax rates, brokerage and pool preferences'],
};

function NavItem({ icon, label, active, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '9px 12px', borderRadius: 'var(--r-md)',
      border: 'none', background: active ? 'var(--brand-tint)' : h ? 'var(--surface-2)' : 'transparent',
      color: active ? 'var(--brand)' : 'var(--ink-2)', fontWeight: active ? 700 : 600, fontSize: 14, transition: 'all .14s', textAlign: 'left',
    }}>
      <Icon name={icon} size={19} stroke={active ? 2.3 : 2} />
      {label}
    </button>
  );
}

function PoolBadge() {
  const D = window.DB;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--brand-tint)', display: 'grid', placeItems: 'center', fontSize: 16 }}>🤝</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>IPO Pool</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{D.pans.length} PANs · {D.members.length} members</div>
      </div>
    </div>
  );
}

function Sidebar({ route, navigate }) {
  const D = window.DB;
  return (
    <aside className="sidebar" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
      <div style={{ padding: '18px 16px 14px' }}><Logo size={26} /></div>
      <div style={{ padding: '0 14px 12px' }}><PoolBadge /></div>
      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }}>
        {NAV.map(sec => (
          <div key={sec.section} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '0 12px 6px' }}>{sec.section}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sec.items.map(([r, label, icon]) => (
                <NavItem key={r} icon={icon} label={label} active={route === r || (r === 'pooling' && route === 'pooling')} onClick={() => navigate(r)} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div style={{ borderTop: '1px solid var(--border)', padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px' }}>
          <Avatar name={D.me?.name || '?'} hue={D.me?.avatarHue || 200} size={36} you />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{D.me?.name || 'You'}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{D.me?.role || 'Member'}</div>
          </div>
          <IconButton name="logout" size={32} tip="Logout" onClick={() => navigate('logout')} />
        </div>
      </div>
    </aside>
  );
}

function Topbar({ route, navigate, dark, setDark }) {
  const [title, sub] = TITLES[route] || ['', ''];
  return (
    <header className="topbar" style={{ height: 'var(--header-h)', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 30, gap: 16 }}>
      <div className="topbar-title">
        <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.01em' }}>{title}</div>
        <div className="topbar-sub" style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="topbar-search" title="Search coming soon" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '8px 13px', width: 220, opacity: .5, cursor: 'not-allowed' }}>
          <Icon name="search" size={16} color="var(--ink-3)" />
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Search coming soon…</span>
        </div>
        {window.DB?.kpis?.profit > 0 && (
          <div className="topbar-profit" style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--profit-soft)', borderRadius: 'var(--r-md)', padding: '7px 12px' }}>
            <Icon name="trend" size={15} color="var(--profit)" />
            <span className="num" style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--profit)' }}>+{window.DB.fmtINR(window.DB.kpis.profit, { compact: true })}</span>
          </div>
        )}
        <IconButton name={dark ? 'sun' : 'moon'} onClick={() => setDark(!dark)} tip="Toggle theme" />
        <IconButton name="bell" tip="No notifications" onClick={() => {}} />
      </div>
    </header>
  );
}

function BottomNav({ route, navigate }) {
  const items = [
    ['dashboard', 'Home',    'dashboard'],
    ['pooling',   'Pool',    'pool'],
    ['settlement','Settle',  'ledger'],
    ['admin',     'Admin',   'admin'],
    ['settings',  'Settings','settings'],
  ];
  return (
    <nav className="bottomnav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 60, background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'none', alignItems: 'center', justifyContent: 'space-around', zIndex: 60 }}>
      {items.map(([r, label, icon]) => {
        const active = route === r;
        return (
          <button key={r} onClick={() => navigate(r)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, border: 'none', background: 'none', color: active ? 'var(--brand)' : 'var(--ink-3)', fontWeight: 700, fontSize: 10.5, padding: '6px 12px', flex: 1, minHeight: 44 }}>
            <Icon name={icon} size={21} stroke={active ? 2.3 : 2} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

function MobileTopbar({ route, dark, setDark }) {
  const [title] = TITLES[route] || [''];
  return (
    <header className="mobile-topbar" style={{ display: 'none', height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', position: 'sticky', top: 0, zIndex: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--brand-tint)', display: 'grid', placeItems: 'center', fontSize: 15 }}>🤝</div>
        <div style={{ fontSize: 15, fontWeight: 800 }}>{title || 'IPO Pool'}</div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <IconButton name={dark ? 'sun' : 'moon'} size={36} onClick={() => setDark(!dark)} tip="Toggle theme" />
        <IconButton name="bell" size={36} />
      </div>
    </header>
  );
}


const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "Emerald",
  "dashLayout": "kpi",
  "poolViz": "flow",
  "dark": false,
  "preview": "Web"
}/*EDITMODE-END*/;

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Logo size={36} />
        <div style={{ fontSize: 13.5, color: 'var(--ink-3)', fontWeight: 600 }}>Loading your pool…</div>
        <div style={{ width: 180, height: 3, borderRadius: 999, background: 'var(--border)', overflow: 'hidden', marginTop: 4 }}>
          <div style={{ height: '100%', width: '40%', background: 'var(--brand)', borderRadius: 999, animation: 'loadingBar 1.2s ease-in-out infinite alternate' }} />
        </div>
        <style>{`@keyframes loadingBar { from { width: 10%; margin-left: 0 } to { width: 50%; margin-left: 50% } }`}</style>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onRetry, onLogout, retrying }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, maxWidth: 380, textAlign: 'center' }}>
        <Logo size={34} />
        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--loss-soft)', color: 'var(--loss)', display: 'grid', placeItems: 'center' }}>
          <Icon name="x" size={24} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 800 }}>Couldn't load your pool</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
          The data didn't load, so nothing is shown rather than risk showing a wrong or partial picture. Check your connection and try again.
        </div>
        {message && <div style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'monospace', wordBreak: 'break-word', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 8, width: '100%' }}>{message}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Button variant="primary" onClick={onRetry} style={{ opacity: retrying ? .7 : 1, pointerEvents: retrying ? 'none' : 'auto' }}>
            {retrying ? 'Retrying…' : 'Retry'}
          </Button>
          <Button variant="ghost" onClick={onLogout}>Sign out</Button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [authed,   setAuthed]  = useState(false);
  const [dbError,  setDbError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [dbReady,  setDbReady] = useState(false);   // true once loadDB() has resolved
  const [booting,  setBooting] = useState(true);    // true on first mount while checking session
  const [route, setRoute] = useState('dashboard');
  const [params, setParams] = useState({});
  const [dataVersion, setDataVersion] = useState(0);  // bumps when data changes externally

  // Check for existing session on mount
  useEffectA(() => {
    window.sb.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setAuthed(true);   // session is valid; a load failure is not a sign-out
        try { await window.loadDB(); setDbReady(true); }
        catch(e) { console.error(e); setDbError(e.message || 'Failed to load data.'); }
      }
      setBooting(false);
    });

    // Keep auth state in sync (e.g. token expiry, sign-out in another tab)
    const { data: { subscription } } = window.sb.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { setAuthed(false); setDbReady(false); setRoute('dashboard'); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Live sync: when another device changes any table, debounce-reload the DB
  // and remount the current screen so everyone sees the same data.
  useEffectA(() => {
    if (!authed || !dbReady) return;
    let timer = null;
    const reload = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try { await window.loadDB(); setDataVersion(v => v + 1); }
        catch (e) { console.error('[IPOPool] realtime reload failed', e); }
      }, 500);
    };
    const channel = window.sb
      .channel('pool-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, reload)
      .subscribe();
    return () => { clearTimeout(timer); window.sb.removeChannel(channel); };
  }, [authed, dbReady]);

  const navigate = (r, p = {}) => {
    if (r === 'logout') {
      window.sb.auth.signOut();
      setAuthed(false); setDbReady(false);
      return;
    }
    setRoute(r); setParams(p);
    const main = document.querySelector('.content'); if (main) main.scrollTop = 0;
  };
  window.__navigate = navigate;

  // theme + accent
  useEffectA(() => {
    document.documentElement.setAttribute('data-theme', t.dark ? 'dark' : 'light');
  }, [t.dark]);
  useEffectA(() => {
    const a = ACCENTS[t.accent] || ACCENTS.Emerald;
    const root = document.documentElement;
    if (!t.dark) {
      root.style.setProperty('--brand', a[0]); root.style.setProperty('--brand-600', a[1]);
      root.style.setProperty('--brand-700', a[2]); root.style.setProperty('--brand-tint', a[3]); root.style.setProperty('--brand-tint-2', a[4]);
      root.style.setProperty('--profit', a[0]); root.style.setProperty('--profit-soft', a[3]);
    } else {
      root.style.removeProperty('--brand'); root.style.removeProperty('--brand-600'); root.style.removeProperty('--brand-700');
      root.style.removeProperty('--brand-tint'); root.style.removeProperty('--brand-tint-2'); root.style.removeProperty('--profit'); root.style.removeProperty('--profit-soft');
    }
    // Keep the mobile browser status bar in sync with the live theme: the accent
    // brand in light mode, the app's dark background in dark mode.
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', t.dark ? '#0B0E12' : a[0]);
  }, [t.accent, t.dark]);

  // Per-screen browser tab title, so multiple open tabs are distinguishable.
  useEffectA(() => {
    let label = TITLES[route] ? TITLES[route][0] : '';
    if (route === 'ipo' && params.id && window.DB) {
      const ip = window.DB.ipo(params.id);
      if (ip) label = ip.short || ip.name;
    }
    document.title = (authed && label) ? `${label} · IPO Pool` : 'IPO Pool';
  }, [route, params.id, authed]);

  const login = async () => {
    await window.loadDB();
    setDbReady(true); setAuthed(true); setDbError(null); setRoute('dashboard');
  };

  const retryLoad = async () => {
    setRetrying(true);
    try { await window.loadDB(); setDbReady(true); setDbError(null); }
    catch(e) { console.error(e); setDbError(e.message || 'Failed to load data.'); }
    setRetrying(false);
  };

  const screen = () => {
    switch (route) {
      case 'dashboard': return <Dashboard navigate={navigate} tweaks={t} />;
      case 'ipo': return <IpoDetails id={params.id} navigate={navigate} />;
      case 'pooling': return <ProfitPooling navigate={navigate} tweaks={t} id={params.id} />;
      case 'settlement': return <SettlementLedger navigate={navigate} id={params.id} />;
      case 'pan': return <PanManagement />;
      case 'admin': return <AdminPanel />;
      case 'settings': return <SettingsScreen />;
      default: return <Dashboard navigate={navigate} tweaks={t} />;
    }
  };

  const Panel = (
    <TweaksPanel>
      <TweakSection label="Theme" />
      <TweakColor label="Accent" value={t.accent === 'Emerald' ? '#0B8A4B' : t.accent === 'Indigo' ? '#4F46E5' : t.accent === 'Royal' ? '#1E63E9' : '#0E7C86'}
        options={['#0B8A4B', '#4F46E5', '#1E63E9', '#0E7C86']}
        onChange={(v) => setTweak('accent', v === '#0B8A4B' ? 'Emerald' : v === '#4F46E5' ? 'Indigo' : v === '#1E63E9' ? 'Royal' : 'Teal')} />
      <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak('dark', v)} />
      <TweakSection label="Dashboard layout" />
      <TweakRadio label="Layout" value={t.dashLayout} options={['kpi', 'spotlight', 'compact']} onChange={(v) => setTweak('dashLayout', v)} />
      <TweakSection label="Preview" />
      <TweakRadio label="Device" value={t.preview} options={['Web', 'Mobile']} onChange={(v) => setTweak('preview', v)} />
    </TweaksPanel>
  );

  if (booting)           return <LoadingScreen />;
  if (authed && dbError) return <ErrorScreen message={dbError} retrying={retrying} onRetry={retryLoad} onLogout={() => { setDbError(null); navigate('logout'); }} />;
  if (!authed || !dbReady) return (<><LoginScreen onLogin={login} />{Panel}</>);

  const shell = (
    <div className={'shell' + (t.preview === 'Mobile' ? ' force-mobile' : '')}>
      <Sidebar route={route} navigate={navigate} />
      <div className="main" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar route={route} navigate={navigate} dark={t.dark} setDark={(v) => setTweak('dark', v)} />
        <MobileTopbar route={route} dark={t.dark} setDark={(v) => setTweak('dark', v)} />
        <div className="content" style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }} key={route + (params.id || '') + '#' + dataVersion}>
            {screen()}
          </div>
        </div>
        <BottomNav route={route} navigate={navigate} />
      </div>
    </div>
  );

  if (t.preview === 'Mobile') {
    return (
      <>
        <div style={{ minHeight: '100vh', background: '#1A1F29', display: 'grid', placeItems: 'center', padding: '28px 16px' }}>
          <div style={{ width: 402, maxWidth: '100%', height: 844, maxHeight: '92vh', background: 'var(--bg)', borderRadius: 40, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.5)', border: '10px solid #0b0e12', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', transform: 'translateZ(0)' }}>{shell}</div>
          </div>
        </div>
        {Panel}
      </>
    );
  }

  return (<>{shell}{Panel}</>);
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
