// GENERATED from src/screens-member.jsx by build.js — do not edit.
const MEMBER_CATS = ['Retail', 'sHNI', 'bHNI'];
const MEMBER_SESSION_KEY = 'ipopool_member';
const CAT_FLOOR = {
  sHNI: 200000,
  bHNI: 1000000
};
const SME_INDIVIDUAL_MAX_LOTS_FALLBACK = 2;
function memberCatMinLots(cat, lotValue, isSME) {
  if (window.catMinLots) return window.catMinLots(cat, lotValue, isSME);
  if (cat === 'Retail' || cat === 'SME') return 1;
  const floor = CAT_FLOOR[cat];
  const valueFloor = floor && lotValue ? Math.floor(floor / lotValue) + 1 : 1;
  if (cat === 'sHNI' && isSME) return Math.max(3, valueFloor);
  return valueFloor;
}
function MemberPortal({
  ipoId
}) {
  const applyMode = !!ipoId;
  const [ipo, setIpo] = useState(null);
  const [ipoErr, setIpoErr] = useState('');
  const [tab, setTab] = useState(applyMode ? 'apply' : 'summary');
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(MEMBER_SESSION_KEY) || 'null');
    } catch (e) {
      return null;
    }
  });
  useEffect(() => {
    if (!applyMode) return;
    let alive = true;
    window.MemberAPI.getApplyIpo(ipoId).then(d => {
      if (alive) {
        if (d) setIpo(d);else setIpoErr('This IPO could not be found.');
      }
    }).catch(() => alive && setIpoErr('Could not load this IPO. Check your connection.'));
    return () => {
      alive = false;
    };
  }, [ipoId]);
  const onLogin = s => {
    setSession(s);
    try {
      sessionStorage.setItem(MEMBER_SESSION_KEY, JSON.stringify(s));
    } catch (e) {}
  };
  const onLogout = () => {
    setSession(null);
    try {
      sessionStorage.removeItem(MEMBER_SESSION_KEY);
    } catch (e) {}
  };
  return React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'radial-gradient(1100px 480px at 50% -8%, var(--brand-tint), transparent 62%), var(--bg)',
      display: 'grid',
      placeItems: 'center',
      padding: '28px 14px calc(28px + env(safe-area-inset-bottom, 0px))'
    }
  }, React.createElement("div", {
    className: "animate member-portal",
    style: {
      width: '100%'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20
    }
  }, React.createElement(Logo, {
    size: 26
  }), session && React.createElement("button", {
    onClick: onLogout,
    style: {
      border: 'none',
      background: 'none',
      color: 'var(--ink-3)',
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer'
    }
  }, "Log out")), ipoErr && !ipo ? React.createElement(Card, {
    pad: 28,
    style: {
      textAlign: 'center'
    }
  }, React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      marginBottom: 6
    }
  }, "Can't open this link"), React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-3)'
    }
  }, ipoErr)) : !session ? React.createElement(MemberLogin, {
    ipo: ipo,
    onLogin: onLogin
  }) : React.createElement(React.Fragment, null, applyMode && React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      padding: 4,
      marginBottom: 16
    }
  }, [['apply', 'Apply'], ['summary', 'My profits']].map(([key, label]) => React.createElement("button", {
    key: key,
    onClick: () => setTab(key),
    style: {
      flex: 1,
      border: 'none',
      borderRadius: 'var(--r-sm)',
      padding: '9px 12px',
      cursor: 'pointer',
      fontSize: 13.5,
      fontWeight: 700,
      background: tab === key ? 'var(--surface)' : 'transparent',
      color: tab === key ? 'var(--brand)' : 'var(--ink-3)',
      boxShadow: tab === key ? 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,.06))' : 'none'
    }
  }, label))), applyMode && tab === 'apply' ? React.createElement(MemberApply, {
    ipo: ipo,
    session: session
  }) : React.createElement(MemberSummary, {
    session: session
  }))));
}
function MemberSummary({
  session
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [iposSort, onIposSort] = useSortState('profit', 'desc');
  const [pansSort, onPansSort] = useSortState('total', 'desc');
  const f = (n, o) => window.fmtINR ? window.fmtINR(n, o) : '₹' + (n || 0);
  const cashflows = data && data.cashflows;
  const xirr = useMemo(() => {
    if (!window.xirr || !cashflows || !cashflows.length) return null;
    return window.xirr(cashflows.map(c => ({
      date: new Date(c.date),
      amount: c.amount
    })));
  }, [cashflows]);
  useEffect(() => {
    let alive = true;
    window.MemberAPI.summary(session.loginPan).then(d => {
      if (alive) {
        setData(d || {});
        setLoading(false);
      }
    }).catch(() => {
      if (alive) {
        setErr('Could not load your profits. Please try again.');
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [session.loginPan]);
  if (loading) return React.createElement(Card, {
    pad: 28,
    style: {
      textAlign: 'center',
      color: 'var(--ink-3)',
      fontSize: 13.5
    }
  }, "Loading your profits…");
  if (err) return React.createElement(Card, {
    pad: 28,
    style: {
      textAlign: 'center',
      color: 'var(--loss)',
      fontSize: 13.5,
      fontWeight: 600
    }
  }, err);
  const d = data || {};
  const ipos = d.ipos || [];
  const applied = d.pans_applied || 0;
  const allot = d.allotments || 0;
  const rate = applied > 0 ? Math.round(allot / applied * 100) : 0;
  const isFamily = d.scope ? d.scope === 'family' : !!session.isHead;
  const xirrLabel = xirr == null ? '—' : (xirr >= 0 ? '+' : '') + (Math.abs(xirr * 100) >= 1000 ? Math.round(xirr * 100) : +(xirr * 100).toFixed(1)) + '%';
  const SETTLE = {
    paid: {
      label: 'Paid',
      tone: 'profit'
    },
    partly: {
      label: 'Part paid',
      tone: 'info'
    },
    pending: {
      label: 'Pending',
      tone: 'warn'
    },
    awaiting: {
      label: 'Awaiting',
      tone: 'neutral'
    },
    '-': {
      label: '—',
      tone: 'neutral'
    }
  };
  const Stat = ({
    label,
    value,
    sub,
    tone
  }) => React.createElement(Card, {
    pad: 16,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)',
      fontWeight: 600
    }
  }, label), React.createElement("span", {
    className: "num",
    style: {
      fontSize: 20,
      fontWeight: 800,
      color: tone || 'var(--ink)'
    }
  }, value), sub && React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--ink-3)'
    }
  }, sub));
  const cols = [{
    key: 'short',
    label: 'IPO',
    align: 'left',
    get: p => p.short || ''
  }, {
    key: 'applied',
    label: 'Applied',
    align: 'right',
    get: p => p.applied || 0,
    defDir: 'desc'
  }, {
    key: 'allotted',
    label: 'Allotted',
    align: 'right',
    get: p => p.allotted || 0,
    defDir: 'desc'
  }, {
    key: 'profit',
    label: 'Profit',
    align: 'right',
    get: p => p.profit || 0,
    defDir: 'desc'
  }, {
    key: 'settle_status',
    label: 'Status',
    align: 'right',
    get: p => p.settle_status || ''
  }];
  const sortedIpos = sortRows(ipos, iposSort, cols);
  const totalBonus = d.total_bonus || 0;
  const totalPoolShare = (d.total_profit || 0) - totalBonus;
  const familyPans = d.pans || null;
  return React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-3)',
      fontWeight: 700
    }
  }, "Signed in as ", session.holder || d.login_holder || d.name || session.name, (() => {
    const pool = d.name || session.name;
    const who = session.holder || d.login_holder;
    return pool && who && pool !== who ? React.createElement("span", {
      style: {
        fontWeight: 600,
        color: 'var(--ink-4, var(--ink-3))'
      }
    }, " · ", pool, "'s pool") : null;
  })()), d.rank && d.total_members > 1 && React.createElement(Card, {
    pad: 16,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: d.rank === 1 ? 'var(--profit-soft)' : 'var(--surface)',
      border: d.rank === 1 ? '1px solid var(--profit)' : undefined
    }
  }, React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 12,
      flexShrink: 0,
      display: 'grid',
      placeItems: 'center',
      fontSize: 18,
      fontWeight: 800,
      background: d.rank === 1 ? 'var(--profit)' : 'var(--brand-tint)',
      color: d.rank === 1 ? '#fff' : 'var(--brand)'
    }
  }, d.rank <= 3 ? '🏆' : '#' + d.rank), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800
    }
  }, d.rank === 1 ? "You're #1" : `Ranked #${d.rank}`, " of ", d.total_members, " members"), React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)'
    }
  }, "by total profit across the pool"))), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, React.createElement(Stat, {
    label: isFamily ? 'Profit till date' : 'Your profit',
    value: f(d.total_profit, {
      compact: true
    }),
    tone: d.total_profit >= 0 ? 'var(--profit)' : 'var(--loss)',
    sub: totalBonus !== 0 ? `${f(totalPoolShare, {
      compact: true
    })} pool share + ${f(totalBonus, {
      compact: true
    })} bonus` : d.pending_profit !== 0 ? f(d.pending_profit, {
      compact: true
    }) + ' pending' : 'all settled'
  }), totalBonus !== 0 && React.createElement(Stat, {
    label: "Allotted-PAN bonus",
    value: f(totalBonus, {
      compact: true
    }),
    tone: "var(--warn)",
    sub: "kept personally, on top of your pool share"
  }), xirr != null && React.createElement(Stat, {
    label: "Your XIRR",
    value: xirrLabel,
    tone: xirr >= 0 ? 'var(--profit)' : 'var(--loss)',
    sub: "annualised return"
  }), React.createElement(Stat, {
    label: "IPOs applied",
    value: d.ipos_applied || 0
  }), React.createElement(Stat, {
    label: "Allotments",
    value: allot,
    sub: applied + (isFamily ? ' PAN applications' : ' applications')
  }), React.createElement(Stat, {
    label: "Allotment rate",
    value: rate + '%'
  })), React.createElement(Card, {
    pad: 0
  }, React.createElement("div", {
    style: {
      padding: '14px 16px',
      borderBottom: '1px solid var(--border)',
      fontSize: 14,
      fontWeight: 800
    }
  }, isFamily ? 'Your IPOs' : 'Your applications'), React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: 420
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      fontSize: 11,
      color: 'var(--ink-3)',
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, cols.map(c => React.createElement(SortTh, {
    key: c.key,
    col: c,
    sort: iposSort,
    onSort: onIposSort,
    style: {
      padding: '10px 16px'
    }
  })))), React.createElement("tbody", null, sortedIpos.map(p => {
    const st = SETTLE[p.settle_status] || SETTLE['-'];
    return React.createElement("tr", {
      key: p.ipo_id,
      style: {
        borderTop: '1px solid var(--border)'
      }
    }, React.createElement("td", {
      style: {
        padding: '11px 16px'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700
      }
    }, p.short), React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)'
      }
    }, p.type)), React.createElement("td", {
      className: "num",
      style: {
        padding: '11px 16px',
        textAlign: 'right',
        color: 'var(--ink-2)'
      }
    }, p.applied), React.createElement("td", {
      className: "num",
      style: {
        padding: '11px 16px',
        textAlign: 'right',
        color: 'var(--ink-2)'
      }
    }, p.allotted || '—'), React.createElement("td", {
      className: "num",
      style: {
        padding: '11px 16px',
        textAlign: 'right',
        fontWeight: 700,
        color: p.profit > 0 ? 'var(--profit)' : p.profit < 0 ? 'var(--loss)' : 'var(--ink-3)'
      }
    }, p.profit !== 0 ? f(p.profit, {
      compact: true
    }) : '—'), React.createElement("td", {
      style: {
        padding: '11px 16px',
        textAlign: 'right'
      }
    }, React.createElement(Badge, {
      tone: st.tone,
      style: {
        fontSize: 10
      }
    }, st.label)));
  }), ipos.length === 0 && React.createElement("tr", {
    style: {
      borderTop: '1px solid var(--border)'
    }
  }, React.createElement("td", {
    colSpan: cols.length,
    style: {
      padding: '18px',
      textAlign: 'center',
      color: 'var(--ink-3)',
      fontSize: 13
    }
  }, "No applications yet.")))))), isFamily && familyPans && familyPans.length > 0 && (() => {
    const hasAnyBonus = familyPans.some(p => (p.bonus || 0) !== 0);
    const pansCols = [{
      key: 'holder',
      label: 'Member',
      align: 'left',
      get: p => p.holder || ''
    }, ...(hasAnyBonus ? [{
      key: 'bonus',
      label: 'Bonus',
      align: 'right',
      get: p => p.bonus || 0,
      defDir: 'desc'
    }] : []), {
      key: 'total',
      label: hasAnyBonus ? 'Total' : 'Profit',
      align: 'right',
      get: p => p.total || 0,
      defDir: 'desc'
    }];
    const sortedPans = sortRows(familyPans, pansSort, pansCols);
    return React.createElement(Card, {
      pad: 0
    }, React.createElement("div", {
      style: {
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 800
      }
    }, "Individual profit"), React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: 'var(--ink-3)',
        marginTop: 2
      }
    }, "Each family PAN's own pool share", hasAnyBonus ? ' + allotted-PAN bonus' : '', ", all-time")), React.createElement("div", {
      style: {
        overflowX: 'auto'
      }
    }, React.createElement("table", {
      style: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: 380
      }
    }, React.createElement("thead", null, React.createElement("tr", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        textTransform: 'uppercase',
        letterSpacing: '.04em'
      }
    }, pansCols.map(c => React.createElement(SortTh, {
      key: c.key,
      col: c,
      sort: pansSort,
      onSort: onPansSort,
      style: {
        padding: '10px 16px'
      }
    })))), React.createElement("tbody", null, sortedPans.map(p => React.createElement("tr", {
      key: p.pan_id,
      style: {
        borderTop: '1px solid var(--border)'
      }
    }, React.createElement("td", {
      style: {
        padding: '11px 16px'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700
      }
    }, p.holder), React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)'
      }
    }, p.relation)), hasAnyBonus && React.createElement("td", {
      className: "num",
      style: {
        padding: '11px 16px',
        textAlign: 'right',
        fontWeight: 700,
        color: 'var(--warn)'
      }
    }, p.bonus ? f(p.bonus, {
      compact: true
    }) : '—'), React.createElement("td", {
      className: "num",
      style: {
        padding: '11px 16px',
        textAlign: 'right',
        fontWeight: 800,
        color: p.total > 0 ? 'var(--profit)' : p.total < 0 ? 'var(--loss)' : 'var(--ink-3)'
      }
    }, p.total !== 0 ? f(p.total, {
      compact: true
    }) : '—')))))));
  })());
}
function MemberLogin({
  ipo,
  onLogin
}) {
  const [pan, setPan] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const clean = pan.trim().toUpperCase();
  const looksValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(clean);
  const submit = async () => {
    if (!clean) {
      setErr('Enter your PAN number.');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const res = await window.MemberAPI.login(clean);
      if (!res || !res.member_id) {
        setErr("That PAN isn't registered in this pool. Ask the admin to add it.");
        setLoading(false);
        return;
      }
      onLogin({
        loginPan: clean,
        memberId: res.member_id,
        name: res.name,
        holder: res.login_holder || '',
        isHead: !!res.is_head,
        pans: res.pans || []
      });
    } catch (e) {
      setErr('Could not verify your PAN. Check your connection and try again.');
      setLoading(false);
    }
  };
  return React.createElement(Card, {
    pad: 26
  }, ipo && React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 18,
      paddingBottom: 16,
      borderBottom: '1px solid var(--border)'
    }
  }, React.createElement(IpoLogo, {
    ipo: {
      hue: 220,
      logo: (ipo.short || ipo.name || '?').slice(0, 2).toUpperCase()
    },
    size: 40
  }), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800
    }
  }, ipo.name), React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)',
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, React.createElement(Badge, {
    tone: ipo.type === 'SME' ? 'sme' : 'mainboard'
  }, ipo.type), ipo.band_high ? React.createElement("span", null, "₹", ipo.band_low, "–", ipo.band_high) : null))), React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 800,
      letterSpacing: '-.01em'
    }
  }, "Record your application"), React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-3)',
      margin: '4px 0 20px'
    }
  }, "Already applied in your Demat? Enter your PAN to fill in which of your family PANs applied. No password needed."), React.createElement("label", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--ink-2)',
      display: 'block',
      marginBottom: 8
    }
  }, "Your PAN number"), React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      border: '1.5px solid',
      borderColor: looksValid ? 'var(--brand)' : 'var(--border-strong)',
      borderRadius: 'var(--r-md)',
      padding: '13px 15px',
      background: 'var(--surface)',
      marginBottom: err ? 10 : 20
    }
  }, React.createElement(Icon, {
    name: "pan",
    size: 16,
    color: "var(--ink-2)",
    style: {
      flexShrink: 0
    }
  }), React.createElement("input", {
    value: pan,
    onChange: e => {
      setPan(e.target.value);
      setErr('');
    },
    onKeyDown: e => e.key === 'Enter' && submit(),
    placeholder: "ABCDE1234F",
    autoCapitalize: "characters",
    autoCorrect: "off",
    spellCheck: false,
    style: {
      border: 'none',
      outline: 'none',
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: '.06em',
      width: '100%',
      background: 'transparent',
      color: 'var(--ink)',
      textTransform: 'uppercase'
    }
  })), err && React.createElement("div", {
    style: {
      color: 'var(--loss)',
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 12
    }
  }, err), React.createElement(Button, {
    variant: "primary",
    size: "lg",
    full: true,
    onClick: submit,
    iconRight: loading ? undefined : 'chevR',
    style: {
      opacity: loading ? .7 : 1,
      pointerEvents: loading ? 'none' : 'auto'
    }
  }, loading ? 'Checking…' : 'Continue'), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-4, var(--ink-3))',
      textAlign: 'center',
      marginTop: 14
    }
  }, "Only PANs the admin has registered can apply."));
}
function MemberApply({
  ipo,
  session
}) {
  const isSME = ipo && ipo.type === 'SME';
  const pans = session.pans || [];
  const f = (n, o) => window.fmtINR ? window.fmtINR(n, o) : '₹' + (n || 0);
  const lotSize = Number(ipo && ipo.lot_size) || 0;
  const lotValue = Number(ipo && ipo.lot_value) || lotSize * (Number(ipo && ipo.band_high) || 0) || 0;
  const [rows, setRows] = useState(() => {
    const init = {};
    const smeMax = window.SME_INDIVIDUAL_MAX_LOTS || SME_INDIVIDUAL_MAX_LOTS_FALLBACK;
    pans.forEach(p => {
      init[p.id] = {
        on: false,
        category: 'Retail',
        lots: isSME ? smeMax : 1
      };
    });
    return init;
  });
  const [appliedIds, setAppliedIds] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  useEffect(() => {
    if (!ipo || !ipo.id) {
      setLoading(false);
      return;
    }
    let alive = true;
    window.MemberAPI.myIpoApplications(session.loginPan, ipo.id).then(existing => {
      if (!alive) return;
      const applied = {};
      setRows(prev => {
        const next = {
          ...prev
        };
        (existing || []).forEach(a => {
          applied[a.pan_id] = a.allot_status || 'pending';
          if (next[a.pan_id]) next[a.pan_id] = {
            on: true,
            category: a.category || 'Retail',
            lots: a.lots || 1
          };
        });
        return next;
      });
      setAppliedIds(applied);
      setLoading(false);
    }).catch(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [ipo && ipo.id, session.loginPan]);
  const setRow = (id, patch) => setRows(prev => ({
    ...prev,
    [id]: {
      ...prev[id],
      ...patch
    }
  }));
  const selected = pans.filter(p => rows[p.id] && rows[p.id].on);
  const hasExisting = Object.keys(appliedIds).length > 0;
  const isClosed = ipo && ipo.close_date && new Date(ipo.close_date) < new Date(new Date().toDateString());
  const submit = async () => {
    if (!selected.length) {
      setErr('Select at least one PAN that applied.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      const payload = selected.map(p => ({
        pan_id: p.id,
        category: rows[p.id].category,
        lots: Math.max(1, parseInt(rows[p.id].lots, 10) || 1)
      }));
      const res = await window.MemberAPI.submitApplications(session.loginPan, ipo.id, payload);
      setDone({
        count: res && res.count || payload.length,
        updated: hasExisting
      });
    } catch (e) {
      setErr(e.message || 'Could not save your application. Please try again.');
    }
    setSaving(false);
  };
  if (loading) return React.createElement(Card, {
    pad: 28,
    style: {
      textAlign: 'center',
      color: 'var(--ink-3)',
      fontSize: 13.5
    }
  }, "Loading…");
  if (isClosed && !hasExisting) {
    return React.createElement(Card, {
      pad: 28,
      style: {
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12
      }
    }, React.createElement("div", {
      style: {
        width: 52,
        height: 52,
        borderRadius: 14,
        background: 'var(--warn-soft)',
        color: 'var(--warn)',
        display: 'grid',
        placeItems: 'center'
      }
    }, React.createElement(Icon, {
      name: "lock",
      size: 24
    })), React.createElement("div", {
      style: {
        fontSize: 17,
        fontWeight: 800
      }
    }, "Applications closed"), React.createElement("div", {
      style: {
        fontSize: 13.5,
        color: 'var(--ink-3)',
        maxWidth: 340,
        lineHeight: 1.6
      }
    }, ipo.name, " stopped accepting applications on ", React.createElement("strong", null, new Date(ipo.close_date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })), ". Contact the admin if you still need to apply."));
  }
  if (done) {
    return React.createElement(Card, {
      pad: 28,
      style: {
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12
      }
    }, React.createElement("div", {
      style: {
        width: 52,
        height: 52,
        borderRadius: 14,
        background: 'var(--profit-soft)',
        color: 'var(--profit)',
        display: 'grid',
        placeItems: 'center'
      }
    }, React.createElement(Icon, {
      name: "check",
      size: 26
    })), React.createElement("div", {
      style: {
        fontSize: 17,
        fontWeight: 800
      }
    }, done.updated ? 'Application updated' : 'Application recorded'), React.createElement("div", {
      style: {
        fontSize: 13.5,
        color: 'var(--ink-3)',
        maxWidth: 340,
        lineHeight: 1.6
      }
    }, done.updated ? 'Updated' : 'Saved', " ", React.createElement("strong", null, done.count, " PAN", done.count === 1 ? '' : 's'), " for ", React.createElement("strong", null, ipo.name), ". The admin will update allotment results after listing."), React.createElement(Button, {
      variant: "ghost",
      onClick: () => setDone(null)
    }, "Edit my application"));
  }
  return React.createElement(React.Fragment, null, React.createElement(Card, {
    pad: 0
  }, React.createElement("div", {
    style: {
      padding: '18px 20px',
      borderBottom: '1px solid var(--border)'
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-3)',
      fontWeight: 700
    }
  }, "Signed in as ", session.holder || session.name, session.holder && session.name && session.name !== session.holder && React.createElement("span", {
    style: {
      fontWeight: 600,
      color: 'var(--ink-4, var(--ink-3))'
    }
  }, " · ", session.name, "'s pool")), React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 800,
      marginTop: 2
    }
  }, ipo ? ipo.name : 'Apply'), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-3)',
      marginTop: 3
    }
  }, isClosed ? React.createElement(React.Fragment, null, "Applications closed on ", React.createElement("strong", null, new Date(ipo.close_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })), " — your saved application below is read-only.") : hasExisting ? 'Your saved application is loaded below — adjust and update.' : 'Tick the PANs that applied, pick a category and the number of lots.'), !isClosed && lotValue > 0 && React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      marginTop: 10
    }
  }, MEMBER_CATS.map(c => {
    const smeMax = window.SME_INDIVIDUAL_MAX_LOTS || SME_INDIVIDUAL_MAX_LOTS_FALLBACK;
    const isSmeRetail = isSME && c === 'Retail';
    const m = isSmeRetail ? smeMax : memberCatMinLots(c, lotValue, isSME);
    const label = isSmeRetail ? 'Individual' : c;
    return React.createElement("span", {
      key: c,
      style: {
        fontSize: 11,
        fontWeight: 700,
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 999,
        padding: '3px 10px',
        color: 'var(--ink-2)'
      }
    }, label, " · ", isSmeRetail ? `${m} lots` : `${m} lot${m === 1 ? '' : 's'}`, React.createElement("span", {
      style: {
        color: 'var(--ink-3)',
        fontWeight: 600
      }
    }, " · ", (m * lotSize).toLocaleString('en-IN'), " sh"));
  }))), React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, pans.length === 0 && React.createElement("div", {
    style: {
      padding: '22px 20px',
      textAlign: 'center',
      color: 'var(--ink-3)',
      fontSize: 13
    }
  }, "No PANs are registered under your name yet. Ask the admin to add them."), (isClosed ? pans.filter(p => appliedIds[p.id]) : pans).map(p => {
    const r = rows[p.id] || {};
    return React.createElement("div", {
      key: p.id,
      style: {
        padding: '13px 20px',
        borderTop: '1px solid var(--border)',
        background: r.on ? 'var(--brand-tint)' : 'transparent'
      }
    }, React.createElement("label", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        cursor: isClosed ? 'default' : 'pointer'
      }
    }, React.createElement("input", {
      type: "checkbox",
      checked: !!r.on,
      disabled: isClosed,
      onChange: e => setRow(p.id, {
        on: e.target.checked
      }),
      style: {
        width: 18,
        height: 18,
        accentColor: 'var(--brand)',
        flexShrink: 0
      }
    }), React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 700
      }
    }, p.holder), React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: 'var(--ink-3)'
      }
    }, React.createElement(Badge, {
      tone: "neutral",
      style: {
        fontSize: 10
      }
    }, p.relation), React.createElement("span", {
      className: "num",
      style: {
        marginLeft: 8,
        letterSpacing: '.06em'
      }
    }, p.pan_masked), appliedIds[p.id] && React.createElement(Badge, {
      tone: appliedIds[p.id] === 'allotted' ? 'profit' : 'info',
      style: {
        fontSize: 10,
        marginLeft: 8
      }
    }, appliedIds[p.id] === 'allotted' ? 'Allotted' : 'Applied')))), r.on && (() => {
      const lots = Math.max(1, parseInt(r.lots, 10) || 1);
      const shares = lots * lotSize;
      const amount = lots * lotValue;
      return React.createElement("div", {
        style: {
          display: 'flex',
          gap: 10,
          marginTop: 11,
          marginLeft: 29,
          flexWrap: 'wrap',
          alignItems: 'center'
        }
      }, (() => {
        const smeMax = window.SME_INDIVIDUAL_MAX_LOTS || SME_INDIVIDUAL_MAX_LOTS_FALLBACK;
        const defaultLots = cat => isSME && cat === 'Retail' ? smeMax : memberCatMinLots(cat, lotValue, isSME);
        const options = MEMBER_CATS.includes(r.category) ? MEMBER_CATS : [...MEMBER_CATS, r.category];
        return React.createElement("select", {
          value: r.category,
          disabled: isClosed,
          onChange: e => {
            const cat = e.target.value;
            setRow(p.id, {
              category: cat,
              lots: defaultLots(cat)
            });
          },
          style: {
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--r-sm)',
            padding: '7px 10px',
            fontSize: 13,
            fontWeight: 600,
            background: 'var(--surface)',
            color: 'var(--ink)',
            opacity: isClosed ? .75 : 1,
            cursor: isClosed ? 'default' : 'pointer'
          }
        }, options.map(c => {
          if (c === 'SME') return React.createElement("option", {
            key: c,
            value: c
          }, "SME (legacy)");
          const isSmeRetail = isSME && c === 'Retail';
          const m = isSmeRetail ? smeMax : memberCatMinLots(c, lotValue, isSME);
          const label = isSmeRetail ? 'Individual' : c;
          const hint = isSmeRetail ? ' · ' + m + ' lots (fixed)' : m > 1 ? ' · min ' + m + ' lots' : '';
          return React.createElement("option", {
            key: c,
            value: c
          }, label, hint);
        }));
      })(), React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 7
        }
      }, React.createElement("span", {
        style: {
          fontSize: 12.5,
          color: 'var(--ink-3)',
          fontWeight: 600
        }
      }, "Lots"), React.createElement("input", {
        type: "number",
        min: "1",
        value: r.lots,
        disabled: isClosed,
        onChange: e => setRow(p.id, {
          lots: e.target.value
        }),
        style: {
          width: 64,
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-sm)',
          padding: '7px 10px',
          fontSize: 13,
          fontWeight: 700,
          background: 'var(--surface)',
          color: 'var(--ink)',
          opacity: isClosed ? .75 : 1
        }
      })), lotSize > 0 && React.createElement("span", {
        style: {
          fontSize: 12.5,
          color: 'var(--ink-3)',
          fontWeight: 600
        }
      }, "= ", React.createElement("strong", {
        style: {
          color: 'var(--ink-2)'
        }
      }, shares.toLocaleString('en-IN')), " shares", amount > 0 && React.createElement("span", null, " · ", f(amount, {
        compact: true
      }))));
    })());
  })), React.createElement("div", {
    style: {
      padding: '16px 20px',
      borderTop: '1px solid var(--border)'
    }
  }, isClosed ? React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      fontSize: 12.5,
      color: 'var(--ink-3)',
      fontWeight: 600
    }
  }, React.createElement(Icon, {
    name: "lock",
    size: 14,
    style: {
      flexShrink: 0
    }
  }), "Locked in — contact the admin if this needs to change.") : React.createElement(React.Fragment, null, err && React.createElement("div", {
    style: {
      color: 'var(--loss)',
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 10
    }
  }, err), React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-3)',
      fontWeight: 600
    }
  }, selected.length, " PAN", selected.length === 1 ? '' : 's', " selected"), React.createElement(Button, {
    variant: "primary",
    icon: "check",
    onClick: submit,
    style: {
      opacity: saving || !selected.length ? .6 : 1,
      pointerEvents: saving || !selected.length ? 'none' : 'auto'
    }
  }, saving ? 'Saving…' : hasExisting ? 'Update application' : 'Submit application'))))), ipo && ipo.id && React.createElement(IpoApplicantsGrid, {
    ipo: ipo,
    session: session
  }));
}
function IpoApplicantsGrid({
  ipo,
  session
}) {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [sort, onSort] = useSortState('holder', 'asc');
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr('');
    window.MemberAPI.ipoApplicants(session.loginPan, ipo.id).then(d => {
      if (alive) {
        setRows(d || []);
        setLoading(false);
      }
    }).catch(() => {
      if (alive) {
        setErr('Could not load applicants. Please try again.');
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [ipo.id, session.loginPan]);
  const cols = [{
    key: 'holder',
    label: 'Applicant',
    align: 'left',
    get: r => r.holder || ''
  }, {
    key: 'category',
    label: 'Category',
    align: 'left',
    get: r => r.category || ''
  }];
  const sortedRows = sortRows(rows || [], sort, cols);
  return React.createElement(Card, {
    pad: 0,
    style: {
      marginTop: 14
    }
  }, React.createElement("div", {
    style: {
      padding: '14px 16px',
      borderBottom: '1px solid var(--border)',
      fontSize: 14,
      fontWeight: 800
    }
  }, "Who's applied"), loading ? React.createElement("div", {
    style: {
      padding: '22px 16px',
      textAlign: 'center',
      color: 'var(--ink-3)',
      fontSize: 13
    }
  }, "Loading…") : err ? React.createElement("div", {
    style: {
      padding: '22px 16px',
      textAlign: 'center',
      color: 'var(--loss)',
      fontSize: 13,
      fontWeight: 600
    }
  }, err) : React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse'
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      fontSize: 11,
      color: 'var(--ink-3)',
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, cols.map(c => React.createElement(SortTh, {
    key: c.key,
    col: c,
    sort: sort,
    onSort: onSort,
    style: {
      padding: '10px 16px'
    }
  })))), React.createElement("tbody", null, sortedRows.map(r => {
    const catMeta = (window.CAT_META || {})[r.category] || {
      label: r.category || '—',
      tone: 'neutral'
    };
    return React.createElement("tr", {
      key: r.pan_id,
      style: {
        borderTop: '1px solid var(--border)'
      }
    }, React.createElement("td", {
      style: {
        padding: '11px 16px'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700
      }
    }, r.holder), React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)'
      }
    }, r.member_name, r.pan_masked ? ' · ' + r.pan_masked : '')), React.createElement("td", {
      style: {
        padding: '11px 16px'
      }
    }, React.createElement(Badge, {
      tone: catMeta.tone
    }, catMeta.label)));
  }), sortedRows.length === 0 && React.createElement("tr", null, React.createElement("td", {
    colSpan: cols.length,
    style: {
      padding: '18px',
      textAlign: 'center',
      color: 'var(--ink-3)',
      fontSize: 13
    }
  }, "No one has applied yet."))))));
}
Object.assign(window, {
  MemberPortal,
  MemberSummary
});