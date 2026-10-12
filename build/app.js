// GENERATED from src/app.jsx by build.js — do not edit.
const {
  useEffect: useEffectA
} = React;
function parseApplyLink() {
  try {
    var m = (location.hash || '').match(/#\/apply\/([^/?#]+)/);
    if (m) return decodeURIComponent(m[1]);
    var q = new URLSearchParams(location.search).get('apply');
    return q || null;
  } catch (e) {
    return null;
  }
}
function isMemberHome() {
  try {
    return /#\/me\/?$/.test(location.hash || '');
  } catch (e) {
    return false;
  }
}
function applyLinkFor(ipoId) {
  return location.origin + location.pathname + '#/apply/' + encodeURIComponent(ipoId);
}
window.applyLinkFor = applyLinkFor;
function memberHomeLink() {
  return location.origin + location.pathname + '#/me';
}
window.memberHomeLink = memberHomeLink;
const ACCENTS = {
  Emerald: ['#0B8A4B', '#0A7A42', '#086B3A', '#E8F5EE', '#D6EEE0'],
  Indigo: ['#4F46E5', '#4338CA', '#3730A3', '#ECEBFD', '#DDDBFA'],
  Royal: ['#1E63E9', '#1A56D0', '#1544A8', '#E7F0FE', '#D4E4FD'],
  Teal: ['#0E7C86', '#0B6970', '#08555B', '#E2F4F5', '#CDEBED']
};
const NAV = [{
  section: 'Overview',
  items: [['dashboard', 'Dashboard', 'dashboard']]
}, {
  section: 'Pooling',
  items: [['pooling', 'Profit Pool', 'pool'], ['settlement', 'Settlement', 'ledger']]
}, {
  section: 'Manage',
  items: [['pan', 'My PANs', 'pan']]
}, {
  section: 'System',
  items: [['admin', 'Admin Panel', 'admin'], ['settings', 'Settings', 'settings']]
}];
const TITLES = {
  dashboard: ['Dashboard', 'Your pooled IPO performance at a glance'],
  ipo: ['IPO Details', 'Applications, allotment & listing performance'],
  pooling: ['Profit Pool', 'How listing-day profit is split across PANs applied'],
  settlement: ['Settlement', 'Track and record profit distributions'],
  pan: ['My PANs', 'PAN accounts you manage in this pool'],
  admin: ['Admin Panel', 'Manage members, IPOs and allotments'],
  settings: ['Settings', 'Tax rates, brokerage and pool preferences']
};
function NavItem({
  icon,
  label,
  active,
  onClick
}) {
  const [h, setH] = useState(false);
  return React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      width: '100%',
      padding: '9px 12px',
      borderRadius: 'var(--r-md)',
      border: 'none',
      background: active ? 'var(--brand-tint)' : h ? 'var(--surface-2)' : 'transparent',
      color: active ? 'var(--brand)' : 'var(--ink-2)',
      fontWeight: active ? 700 : 600,
      fontSize: 14,
      transition: 'all .14s',
      textAlign: 'left'
    }
  }, React.createElement(Icon, {
    name: icon,
    size: 19,
    stroke: active ? 2.3 : 2
  }), label);
}
function PoolBadge() {
  const D = window.DB;
  return React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 11px',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)',
      background: 'var(--surface)'
    }
  }, React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      background: 'var(--brand-tint)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 16
    }
  }, "🤝"), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700
    }
  }, "IPO Pool"), React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--ink-3)'
    }
  }, D.pans.length, " PANs · ", D.members.length, " members")));
}
function Sidebar({
  route,
  navigate
}) {
  const D = window.DB;
  return React.createElement("aside", {
    className: "sidebar",
    style: {
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh'
    }
  }, React.createElement("div", {
    style: {
      padding: '18px 16px 14px'
    }
  }, React.createElement(Logo, {
    size: 26
  })), React.createElement("div", {
    style: {
      padding: '0 14px 12px'
    }
  }, React.createElement(PoolBadge, null)), React.createElement("nav", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '4px 12px'
    }
  }, NAV.map(sec => React.createElement("div", {
    key: sec.section,
    style: {
      marginBottom: 14
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      color: 'var(--ink-3)',
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      padding: '0 12px 6px'
    }
  }, sec.section), React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, sec.items.map(([r, label, icon]) => React.createElement(NavItem, {
    key: r,
    icon: icon,
    label: label,
    active: route === r || r === 'pooling' && route === 'pooling',
    onClick: () => navigate(r)
  })))))), React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border)',
      padding: 12
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 8px'
    }
  }, React.createElement(Avatar, {
    name: D.me?.name || '?',
    hue: D.me?.avatarHue || 200,
    size: 36,
    you: true
  }), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, D.me?.name || 'You'), React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--ink-3)'
    }
  }, D.me?.role || 'Member')), React.createElement(IconButton, {
    name: "logout",
    size: 32,
    tip: "Logout",
    onClick: () => navigate('logout')
  }))));
}
function Topbar({
  route,
  navigate,
  dark,
  setDark
}) {
  const [title, sub] = TITLES[route] || ['', ''];
  return React.createElement("header", {
    className: "topbar",
    style: {
      height: 'var(--header-h)',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      gap: 16
    }
  }, React.createElement("div", {
    className: "topbar-title"
  }, React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: 700,
      color: 'var(--ink)',
      letterSpacing: '-.01em'
    }
  }, title), React.createElement("div", {
    className: "topbar-sub",
    style: {
      fontSize: 13,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, sub)), React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, window.DB?.kpis?.profit > 0 && React.createElement("div", {
    className: "topbar-profit",
    title: "Net profit across every IPO, after tax and charges",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      background: 'var(--profit-soft)',
      borderRadius: 'var(--r-md)',
      padding: '7px 12px'
    }
  }, React.createElement(Icon, {
    name: "trend",
    size: 15,
    color: "var(--profit)"
  }), React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: 'var(--profit)',
      opacity: .8
    }
  }, "Total profit"), React.createElement("span", {
    className: "num",
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: 'var(--profit)'
    }
  }, "+", window.DB.fmtINR(window.DB.kpis.profit, {
    compact: true
  }))), React.createElement(IconButton, {
    name: dark ? 'sun' : 'moon',
    onClick: () => setDark(!dark),
    tip: "Toggle theme"
  })));
}
function BottomNav({
  route,
  navigate
}) {
  const items = [['dashboard', 'Home', 'dashboard'], ['pooling', 'Pool', 'pool'], ['settlement', 'Settle', 'ledger'], ['pan', 'PANs', 'pan'], ['admin', 'Admin', 'admin'], ['settings', 'Settings', 'settings']];
  return React.createElement("nav", {
    className: "bottomnav",
    style: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 60
    }
  }, items.map(([r, label, icon]) => {
    const active = route === r;
    return React.createElement("button", {
      key: r,
      onClick: () => navigate(r),
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        border: 'none',
        background: 'none',
        color: active ? 'var(--brand)' : 'var(--ink-3)',
        fontWeight: 700,
        fontSize: 10.5,
        padding: '6px 4px',
        flex: 1,
        minHeight: 48
      }
    }, React.createElement("span", {
      style: {
        display: 'grid',
        placeItems: 'center',
        width: 46,
        height: 30,
        borderRadius: 999,
        background: active ? 'var(--brand-tint)' : 'transparent',
        transition: 'background .2s, transform .2s',
        transform: active ? 'translateY(-1px)' : 'none'
      }
    }, React.createElement(Icon, {
      name: icon,
      size: 21,
      stroke: active ? 2.4 : 2
    })), label);
  }));
}
function MobileTopbar({
  route,
  dark,
  setDark
}) {
  const [title] = TITLES[route] || [''];
  return React.createElement("header", {
    className: "mobile-topbar",
    style: {
      display: 'none',
      height: 56,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      background: 'var(--brand-tint)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 15
    }
  }, "🤝"), React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800
    }
  }, title || 'IPO Pool')), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, React.createElement(IconButton, {
    name: dark ? 'sun' : 'moon',
    size: 36,
    onClick: () => setDark(!dark),
    tip: "Toggle theme"
  })));
}
const TWEAK_DEFAULTS = {
  "accent": "Emerald",
  "dashLayout": "kpi",
  "poolViz": "flow",
  "dark": false,
  "preview": "Web"
};
function LoadingScreen() {
  return React.createElement("div", {
    style: {
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'var(--bg)'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16
    }
  }, React.createElement(Logo, {
    size: 36
  }), React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-3)',
      fontWeight: 600
    }
  }, "Loading your pool…"), React.createElement("div", {
    style: {
      width: 180,
      height: 3,
      borderRadius: 999,
      background: 'var(--border)',
      overflow: 'hidden',
      marginTop: 4
    }
  }, React.createElement("div", {
    style: {
      height: '100%',
      width: '40%',
      background: 'var(--brand)',
      borderRadius: 999,
      animation: 'loadingBar 1.2s ease-in-out infinite alternate'
    }
  })), React.createElement("style", null, `@keyframes loadingBar { from { width: 10%; margin-left: 0 } to { width: 50%; margin-left: 50% } }`)));
}
function ErrorScreen({
  message,
  onRetry,
  onLogout,
  retrying
}) {
  return React.createElement("div", {
    style: {
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'var(--bg)',
      padding: 20
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 14,
      maxWidth: 380,
      textAlign: 'center'
    }
  }, React.createElement(Logo, {
    size: 34
  }), React.createElement("div", {
    style: {
      width: 46,
      height: 46,
      borderRadius: 12,
      background: 'var(--loss-soft)',
      color: 'var(--loss)',
      display: 'grid',
      placeItems: 'center'
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 24
  })), React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 800
    }
  }, "Couldn't load your pool"), React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-3)',
      lineHeight: 1.6
    }
  }, "The data didn't load, so nothing is shown rather than risk showing a wrong or partial picture. Check your connection and try again."), message && React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)',
      fontFamily: 'monospace',
      wordBreak: 'break-word',
      background: 'var(--surface-2)',
      padding: '8px 12px',
      borderRadius: 8,
      width: '100%'
    }
  }, message), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 4
    }
  }, React.createElement(Button, {
    variant: "primary",
    onClick: onRetry,
    style: {
      opacity: retrying ? .7 : 1,
      pointerEvents: retrying ? 'none' : 'auto'
    }
  }, retrying ? 'Retrying…' : 'Retry'), React.createElement(Button, {
    variant: "ghost",
    onClick: onLogout
  }, "Sign out"))));
}
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [authed, setAuthed] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [booting, setBooting] = useState(true);
  const [route, setRoute] = useState('dashboard');
  const [params, setParams] = useState({});
  const [dataVersion, setDataVersion] = useState(0);
  const [memberApplyIpo] = useState(parseApplyLink);
  const [memberHome] = useState(isMemberHome);
  useEffectA(() => {
    if (memberApplyIpo || memberHome) {
      setBooting(false);
      return;
    }
    window.sb.auth.getSession().then(async ({
      data: {
        session
      }
    }) => {
      if (session) {
        setAuthed(true);
        try {
          await window.loadDB();
          setDbReady(true);
        } catch (e) {
          console.error(e);
          setDbError(e.message || 'Failed to load data.');
        }
      }
      setBooting(false);
    }).catch(e => {
      console.error(e);
      setDbError(e.message || 'Could not reach the server.');
      setBooting(false);
    });
    const {
      data: {
        subscription
      }
    } = window.sb.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        setAuthed(false);
        setDbReady(false);
        setRoute('dashboard');
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffectA(() => {
    if (!authed || !dbReady) return;
    let timer = null;
    const reload = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (Date.now() - (window.__lastLocalWriteAt || 0) < 3000) return;
        try {
          await window.loadDB();
          setDataVersion(v => v + 1);
        } catch (e) {
          console.error('[IPOPool] realtime reload failed', e);
        }
      }, 500);
    };
    const channel = window.sb.channel('pool-changes').on('postgres_changes', {
      event: '*',
      schema: 'public'
    }, reload).subscribe();
    return () => {
      clearTimeout(timer);
      window.sb.removeChannel(channel);
    };
  }, [authed, dbReady]);
  const navigate = (r, p = {}) => {
    if (r === 'logout') {
      window.sb.auth.signOut();
      setAuthed(false);
      setDbReady(false);
      return;
    }
    setRoute(r);
    setParams(p);
    const main = document.querySelector('.content');
    if (main) main.scrollTop = 0;
  };
  window.__navigate = navigate;
  useEffectA(() => {
    document.documentElement.setAttribute('data-theme', t.dark ? 'dark' : 'light');
  }, [t.dark]);
  useEffectA(() => {
    const a = ACCENTS[t.accent] || ACCENTS.Emerald;
    const root = document.documentElement;
    if (!t.dark) {
      root.style.setProperty('--brand', a[0]);
      root.style.setProperty('--brand-600', a[1]);
      root.style.setProperty('--brand-700', a[2]);
      root.style.setProperty('--brand-tint', a[3]);
      root.style.setProperty('--brand-tint-2', a[4]);
      root.style.setProperty('--profit', a[0]);
      root.style.setProperty('--profit-soft', a[3]);
    } else {
      root.style.removeProperty('--brand');
      root.style.removeProperty('--brand-600');
      root.style.removeProperty('--brand-700');
      root.style.removeProperty('--brand-tint');
      root.style.removeProperty('--brand-tint-2');
      root.style.removeProperty('--profit');
      root.style.removeProperty('--profit-soft');
    }
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', t.dark ? '#0C0F0D' : a[0]);
  }, [t.accent, t.dark]);
  useEffectA(() => {
    let label = TITLES[route] ? TITLES[route][0] : '';
    if (route === 'ipo' && params.id && window.DB) {
      const ip = window.DB.ipo(params.id);
      if (ip) label = ip.short || ip.name;
    }
    document.title = authed && label ? `${label} · IPO Pool` : 'IPO Pool';
  }, [route, params.id, authed]);
  const login = async () => {
    await window.loadDB();
    setDbReady(true);
    setAuthed(true);
    setDbError(null);
    setRoute('dashboard');
  };
  const retryLoad = async () => {
    setRetrying(true);
    try {
      await window.loadDB();
      setDbReady(true);
      setDbError(null);
    } catch (e) {
      console.error(e);
      setDbError(e.message || 'Failed to load data.');
    }
    setRetrying(false);
  };
  const screen = () => {
    switch (route) {
      case 'dashboard':
        return React.createElement(Dashboard, {
          navigate: navigate,
          tweaks: t
        });
      case 'ipo':
        return React.createElement(IpoDetails, {
          id: params.id,
          navigate: navigate
        });
      case 'pooling':
        return React.createElement(ProfitPooling, {
          navigate: navigate,
          tweaks: t,
          id: params.id
        });
      case 'settlement':
        return React.createElement(SettlementLedger, {
          navigate: navigate,
          id: params.id
        });
      case 'pan':
        return React.createElement(PanManagement, null);
      case 'admin':
        return React.createElement(AdminPanel, null);
      case 'settings':
        return React.createElement(SettingsScreen, null);
      default:
        return React.createElement(Dashboard, {
          navigate: navigate,
          tweaks: t
        });
    }
  };
  const Panel = React.createElement(TweaksPanel, null, React.createElement(TweakSection, {
    label: "Theme"
  }), React.createElement(TweakColor, {
    label: "Accent",
    value: t.accent === 'Emerald' ? '#0B8A4B' : t.accent === 'Indigo' ? '#4F46E5' : t.accent === 'Royal' ? '#1E63E9' : '#0E7C86',
    options: ['#0B8A4B', '#4F46E5', '#1E63E9', '#0E7C86'],
    onChange: v => setTweak('accent', v === '#0B8A4B' ? 'Emerald' : v === '#4F46E5' ? 'Indigo' : v === '#1E63E9' ? 'Royal' : 'Teal')
  }), React.createElement(TweakToggle, {
    label: "Dark mode",
    value: t.dark,
    onChange: v => setTweak('dark', v)
  }), React.createElement(TweakSection, {
    label: "Dashboard layout"
  }), React.createElement(TweakRadio, {
    label: "Layout",
    value: t.dashLayout,
    options: ['kpi', 'spotlight', 'compact'],
    onChange: v => setTweak('dashLayout', v)
  }), React.createElement(TweakSection, {
    label: "Preview"
  }), React.createElement(TweakRadio, {
    label: "Device",
    value: t.preview,
    options: ['Web', 'Mobile'],
    onChange: v => setTweak('preview', v)
  }));
  if (memberApplyIpo) return React.createElement(MemberPortal, {
    ipoId: memberApplyIpo
  });
  if (memberHome) return React.createElement(MemberPortal, {
    ipoId: null
  });
  if (booting) return React.createElement(LoadingScreen, null);
  if (authed && dbError) return React.createElement(ErrorScreen, {
    message: dbError,
    retrying: retrying,
    onRetry: retryLoad,
    onLogout: () => {
      setDbError(null);
      navigate('logout');
    }
  });
  if (!authed || !dbReady) return React.createElement(React.Fragment, null, React.createElement(LoginScreen, {
    onLogin: login
  }), Panel);
  const shell = React.createElement("div", {
    className: 'shell' + (t.preview === 'Mobile' ? ' force-mobile' : '')
  }, React.createElement(Sidebar, {
    route: route,
    navigate: navigate
  }), React.createElement("div", {
    className: "main",
    style: {
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, React.createElement(Topbar, {
    route: route,
    navigate: navigate,
    dark: t.dark,
    setDark: v => setTweak('dark', v)
  }), React.createElement(MobileTopbar, {
    route: route,
    dark: t.dark,
    setDark: v => setTweak('dark', v)
  }), React.createElement("div", {
    className: "content",
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 24
    }
  }, React.createElement("div", {
    className: "screen-enter",
    style: {
      maxWidth: 1240,
      margin: '0 auto'
    },
    key: route + (params.id || '') + '#' + dataVersion
  }, screen())), React.createElement(BottomNav, {
    route: route,
    navigate: navigate
  })));
  if (t.preview === 'Mobile') {
    return React.createElement(React.Fragment, null, React.createElement("div", {
      style: {
        minHeight: '100vh',
        background: '#1A1F29',
        display: 'grid',
        placeItems: 'center',
        padding: '28px 16px'
      }
    }, React.createElement("div", {
      style: {
        width: 402,
        maxWidth: '100%',
        height: 844,
        maxHeight: '92vh',
        background: 'var(--bg)',
        borderRadius: 40,
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,.5)',
        border: '10px solid #0b0e12',
        position: 'relative'
      }
    }, React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        overflowY: 'auto',
        transform: 'translateZ(0)'
      }
    }, shell))), Panel);
  }
  return React.createElement(React.Fragment, null, shell, Panel);
}
async function hardReset() {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if (navigator.serviceWorker) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
  } catch (e) {}
  location.reload();
}
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      failed: false,
      msg: ''
    };
  }
  static getDerivedStateFromError(err) {
    return {
      failed: true,
      msg: err && err.message || String(err)
    };
  }
  componentDidCatch(err) {
    try {
      console.error('[IPOPool] render error', err);
    } catch (e) {}
  }
  render() {
    if (!this.state.failed) return this.props.children;
    const wrap = {
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#f6f7f9',
      padding: 20,
      fontFamily: 'system-ui, sans-serif'
    };
    const card = {
      maxWidth: 380,
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      color: '#1a1f29'
    };
    const btn = {
      border: 'none',
      borderRadius: 10,
      padding: '11px 20px',
      fontSize: 14,
      fontWeight: 700,
      background: '#0B8A4B',
      color: '#fff',
      cursor: 'pointer'
    };
    return React.createElement("div", {
      style: wrap
    }, React.createElement("div", {
      style: card
    }, React.createElement("div", {
      style: {
        fontSize: 20,
        fontWeight: 800
      }
    }, "IPO Pool"), React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 800
      }
    }, "Couldn't load the app"), React.createElement("div", {
      style: {
        fontSize: 13,
        color: '#5b6472',
        lineHeight: 1.6
      }
    }, "A part of the app failed to load — this is usually a stale cached version. Reloading fresh almost always fixes it."), this.state.msg && React.createElement("div", {
      style: {
        fontSize: 11,
        color: '#8a94a3',
        fontFamily: 'monospace',
        wordBreak: 'break-word',
        background: '#eceef1',
        padding: '8px 12px',
        borderRadius: 8,
        width: '100%'
      }
    }, this.state.msg), React.createElement("button", {
      style: btn,
      onClick: hardReset
    }, "Reload the app")));
  }
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ErrorBoundary, null, React.createElement(App, null)));