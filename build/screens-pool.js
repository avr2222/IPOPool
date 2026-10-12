// GENERATED from src/screens-pool.jsx by build.js — do not edit.
const CAT_META = {
  SME: {
    label: 'SME',
    tone: 'sme',
    desc: 'All applicants — single pool',
    textColor: 'var(--sme)'
  },
  Retail: {
    label: 'Retail',
    tone: 'neutral',
    desc: 'Up to ₹2L application (1 lot)',
    textColor: 'var(--ink-2)'
  },
  sHNI: {
    label: 'sHNI',
    tone: 'info',
    desc: '₹2L – ₹10L application',
    textColor: 'var(--info)'
  },
  bHNI: {
    label: 'bHNI',
    tone: 'warn',
    desc: 'Above ₹10L application',
    textColor: 'var(--warn)'
  }
};
function MemberSharesTable({
  D,
  shares,
  f,
  bonuses,
  roles
}) {
  const hasBonus = bonuses && Object.values(bonuses).some(b => b > 0);
  const rows = Object.entries(shares || {}).map(([mid, row]) => ({
    mid,
    m: D.member(mid),
    pans: row.pans,
    share: row.share,
    bonus: bonuses && bonuses[mid] || 0
  })).filter(r => r.m);
  const cols = [{
    key: 'member',
    label: 'Member',
    align: 'left',
    get: r => r.m.name || ''
  }, {
    key: 'pans',
    label: 'PANs',
    align: 'center',
    get: r => r.pans || 0,
    defDir: 'desc'
  }, ...(hasBonus ? [{
    key: 'bonus',
    label: 'Bonus',
    align: 'right',
    get: r => r.bonus || 0,
    defDir: 'desc'
  }] : []), {
    key: 'share',
    label: hasBonus ? 'Total' : 'Share',
    align: 'right',
    get: r => (r.share || 0) + (r.bonus || 0),
    defDir: 'desc'
  }];
  const [sort, onSort] = useSortState('share', 'desc');
  const sorted = sortRows(rows, sort, cols);
  return React.createElement("table", {
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
  }, cols.map((c, i) => React.createElement(SortTh, {
    key: c.key,
    col: c,
    sort: sort,
    onSort: onSort,
    style: {
      padding: i === 0 ? '6px 20px' : '6px 8px'
    }
  })))), React.createElement("tbody", null, sorted.map(({
    mid,
    m,
    pans,
    share,
    bonus
  }) => React.createElement("tr", {
    key: mid,
    style: {
      borderTop: '1px solid var(--border)',
      background: m.you ? 'var(--brand-tint)' : 'transparent'
    }
  }, React.createElement("td", {
    style: {
      padding: '10px 20px'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, React.createElement(Avatar, {
    name: m.name,
    hue: m.avatarHue,
    size: 28,
    you: m.you
  }), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700
    }
  }, m.name.split(' ')[0], m.you && React.createElement("span", {
    style: {
      color: 'var(--brand)',
      fontWeight: 600
    }
  }, " · You")), roles && roles[mid] && (() => {
    const r = roles[mid];
    return React.createElement("div", {
      style: {
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
        marginTop: 3
      }
    }, r.allotted && React.createElement(Badge, {
      tone: "profit",
      icon: "check",
      style: {
        fontSize: 9.5,
        padding: '1px 6px'
      }
    }, "Allotted"), r.applied && !r.allotted && React.createElement(Badge, {
      tone: "info",
      icon: "pan",
      style: {
        fontSize: 9.5,
        padding: '1px 6px'
      }
    }, "Pooled"), r.backer && React.createElement(Badge, {
      tone: "brand",
      icon: "groups",
      style: {
        fontSize: 9.5,
        padding: '1px 6px'
      }
    }, "Backer"));
  })()))), React.createElement("td", {
    style: {
      textAlign: 'center',
      padding: '10px 8px'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      gap: 3
    }
  }, Array.from({
    length: pans
  }).map((_, i) => React.createElement("div", {
    key: i,
    style: {
      width: 9,
      height: 9,
      borderRadius: '50%',
      background: `hsl(${m.avatarHue} 55% 52%)`
    }
  })))), hasBonus && React.createElement("td", {
    className: "num",
    style: {
      padding: '10px 8px',
      textAlign: 'right',
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--warn)'
    }
  }, bonus > 0 ? f(bonus) : '—'), React.createElement("td", {
    className: "num",
    style: {
      padding: '10px 20px',
      textAlign: 'right',
      fontSize: 14,
      fontWeight: 800,
      color: m.you ? 'var(--brand)' : share + bonus < 0 ? 'var(--loss)' : 'var(--profit)'
    }
  }, f(share + bonus))))));
}
function ProfitPooling({
  navigate,
  id
}) {
  const D = window.DB;
  const f = (n, o) => D.fmtINR(n, o);
  const listedPools = D.pools;
  const activeTabPools = listedPools.filter(p => p.status !== 'Settled');
  const settledPools = listedPools.filter(p => p.status === 'Settled');
  const [sel, setSel] = useState(id || activeTabPools[0]?.ipo || listedPools[0]?.ipo);
  const [showSettled, setShowSettled] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalErr, setFinalErr] = useState('');
  const [confirmFinal, setConfirmFinal] = useState(false);
  const effectiveShow = showSettled || activeTabPools.length === 0;
  const visiblePools = effectiveShow ? [...activeTabPools, ...settledPools] : activeTabPools;
  if (!listedPools.length) return React.createElement(Card, {
    pad: 32,
    style: {
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 14
    }
  }, React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 14,
      background: 'var(--surface-2)',
      display: 'grid',
      placeItems: 'center'
    }
  }, React.createElement(Icon, {
    name: "pool",
    size: 26,
    color: "var(--ink-3)"
  })), React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 800
    }
  }, "No profit pools yet"), React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-3)',
      maxWidth: 360,
      lineHeight: 1.6
    }
  }, "Pools are created when you finalize allotments. Go to ", React.createElement("strong", null, "IPO Master → eye icon"), ", mark allotment results for a closed IPO, then return here and click ", React.createElement("strong", null, "Finalize payouts"), "."), React.createElement(Button, {
    variant: "primary",
    icon: "settings",
    onClick: () => navigate('admin')
  }, "Go to Admin Panel"));
  const ipo = D.ipo(sel);
  const pool = D.pools.find(p => p.ipo === sel);
  const ipoAllots = D.allotsOfIpo(sel);
  const me = D.members.find(m => m.you);
  const rates = window.ratesForIpo(sel);
  const stcgRate = rates.stcg;
  const brokerageAmt = rates.brok;
  const bonusRate = rates.bonus;
  const CAT_ORDER = ['SME', 'Retail', 'sHNI', 'bHNI'];
  const categories = CAT_ORDER.filter(c => ipoAllots.some(a => a.category === c));
  const panToMember = panId => {
    const p = D.pan(panId);
    return p ? p.member : null;
  };
  const catData = categories.map(cat => {
    const catAllots = ipoAllots.filter(a => a.category === cat);
    const cr = window.ratesForCategory(sel, cat);
    const math = window.PoolMath.category(catAllots, cr.stcg, cr.brok, cr.bonus);
    const memberShares = window.PoolMath.memberShares(catAllots, cr.stcg, cr.brok, panToMember, cr.bonus);
    const memberBonuses = window.PoolMath.memberBonuses(catAllots, cr.stcg, cr.brok, cr.bonus, panToMember);
    return {
      cat,
      catAllots,
      ...math,
      brok: cr.brok,
      bonusRate: cr.bonus,
      memberShares,
      memberBonuses
    };
  });
  const isSME = ipo?.type === 'SME';
  const smeMemberShares = {},
    smeMemberBonuses = {};
  {
    const payload = window.buildFinalizePayload(sel);
    const byCat = {};
    payload.rows.forEach(r => {
      (byCat[r.category] = byCat[r.category] || {})[r.memberId] = r;
    });
    catData.forEach(d => {
      const ms = {},
        mb = {};
      Object.keys(byCat[d.cat] || {}).forEach(mid => {
        const r = byCat[d.cat][mid];
        ms[mid] = {
          pans: r.pans,
          share: r.amount - r.bonusAmount
        };
        mb[mid] = r.bonusAmount;
      });
      d.memberShares = ms;
      d.memberBonuses = mb;
    });
    if (isSME) {
      payload.rows.forEach(r => {
        if (!smeMemberShares[r.memberId]) smeMemberShares[r.memberId] = {
          pans: 0,
          share: 0
        };
        smeMemberShares[r.memberId].pans += r.pans;
        smeMemberShares[r.memberId].share += r.amount - r.bonusAmount;
        smeMemberBonuses[r.memberId] = (smeMemberBonuses[r.memberId] || 0) + r.bonusAmount;
      });
    }
  }
  const memberRoles = isSME ? window.memberPoolRoles(sel) : {};
  const myPoolShare = catData.reduce((s, d) => s + (d.memberShares[me?.id]?.share || 0), 0);
  const myBonus = catData.reduce((s, d) => s + (d.memberBonuses[me?.id] || 0), 0);
  const myTotal = myPoolShare + myBonus;
  const myPanCount = catData.reduce((s, d) => s + (d.memberShares[me?.id]?.pans || 0), 0);
  const totalPans = ipoAllots.length;
  const totalAllotted = ipoAllots.filter(a => a.status === 'allotted').length;
  const totalNet = catData.reduce((s, d) => s + d.net, 0);
  const totalBonus = catData.reduce((s, d) => s + d.bonusTotal, 0);
  const finalizePayouts = async () => {
    setFinalizing(true);
    setFinalErr('');
    try {
      const payload = window.buildFinalizePayload(sel);
      if (payload.rows.length === 0 && totalAllotted === 0) {
        setFinalErr('Nothing to distribute yet — mark the allotment results first.');
        setFinalizing(false);
        return;
      }
      await D.mutations.createSettlements(sel, payload.rows, payload.rates, payload.panRows);
      navigate('settlement', {
        id: sel
      });
    } catch (e) {
      setFinalErr(e.message || 'Failed to save settlements.');
      setFinalizing(false);
    }
  };
  return React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      overflowX: 'auto',
      paddingBottom: 2,
      alignItems: 'center'
    }
  }, listedPools.length > 8 && React.createElement(JumpToIpo, {
    pools: listedPools,
    value: sel,
    onChange: ipoId => {
      if (settledPools.some(p => p.ipo === ipoId)) setShowSettled(true);
      setSel(ipoId);
    }
  }), stripPools(visiblePools, sel).map(p => {
    const ip = D.ipo(p.ipo);
    const active = p.ipo === sel;
    return React.createElement("button", {
      key: p.ipo,
      onClick: () => setSel(p.ipo),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 'var(--r-md)',
        flexShrink: 0,
        border: '1px solid',
        borderColor: active ? 'var(--brand)' : 'var(--border)',
        background: active ? 'var(--brand-tint)' : 'var(--surface)',
        cursor: 'pointer',
        opacity: p.status === 'Settled' ? 0.72 : 1
      }
    }, React.createElement(IpoLogo, {
      ipo: ip,
      size: 30
    }), React.createElement("div", {
      style: {
        textAlign: 'left'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: active ? 'var(--brand)' : 'var(--ink)'
      }
    }, ip.short), React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        display: 'flex',
        gap: 4,
        marginTop: 2
      }
    }, React.createElement(Badge, {
      tone: ip.type === 'SME' ? 'sme' : 'mainboard',
      style: {
        fontSize: 10
      }
    }, ip.type), React.createElement(Badge, {
      tone: p.status === 'Settled' ? 'profit' : 'warn',
      style: {
        fontSize: 10
      }
    }, p.status))));
  }), settledPools.length > 0 && activeTabPools.length > 0 && React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    style: {
      flexShrink: 0
    },
    onClick: () => {
      const next = !showSettled;
      setShowSettled(next);
      if (!next && settledPools.some(p => p.ipo === sel)) setSel(activeTabPools[0]?.ipo);
    }
  }, effectiveShow ? 'Hide settled' : `Show settled (${settledPools.length})`)), pool?.status === 'Settled' && React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 18px',
      background: 'var(--profit-soft)',
      borderRadius: 'var(--r-lg)',
      border: '1px solid var(--profit)'
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 18,
    color: "var(--profit)"
  }), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: 'var(--profit)'
    }
  }, "This pool is fully settled"), React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)'
    }
  }, "All payouts have been distributed. This pool is read-only.")), React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    icon: "ledger",
    onClick: () => navigate('settlement', {
      id: sel
    })
  }, "View ledger")), myTotal !== 0 && React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 20px',
      background: 'var(--brand-tint)',
      borderRadius: 'var(--r-lg)',
      border: '1.5px solid var(--brand)'
    }
  }, React.createElement(Avatar, {
    name: me.name,
    hue: me.avatarHue,
    size: 44,
    you: true
  }), React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-2)',
      fontWeight: 600
    }
  }, "Your combined share across all categories"), React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, catData.filter(d => d.memberShares[me?.id]).map(d => {
    const r = d.memberShares[me.id];
    if (isSME) return `${CAT_META[d.cat]?.label || d.cat}: ${f(r.share)}${r.pans > 1 ? ` (${r.pans} PANs)` : ''}`;
    const extra = (r.share || 0) - r.pans * d.perPan;
    return `${CAT_META[d.cat]?.label || d.cat}: ${r.pans} PAN${r.pans > 1 ? 's' : ''} × ${f(d.perPan)}` + (extra !== 0 ? ` + ${f(extra)} rounding` : '');
  }).join(' · '), myBonus > 0 && React.createElement("span", {
    style: {
      color: 'var(--warn)',
      fontWeight: 700
    }
  }, " · +", f(myBonus), " allotted-PAN bonus"))), React.createElement("div", {
    className: "num",
    style: {
      fontSize: 30,
      fontWeight: 800,
      color: 'var(--brand)'
    }
  }, f(myTotal))), React.createElement("div", {
    className: "pool-summary",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14
    }
  }, [{
    label: 'PANs applied',
    value: totalPans,
    icon: 'pan',
    tone: 'neutral'
  }, {
    label: 'Allotted',
    value: totalAllotted,
    icon: 'check',
    tone: 'info'
  }, {
    label: 'Net profit',
    value: f(totalNet + totalBonus, {
      compact: true
    }),
    icon: 'trend',
    tone: totalNet + totalBonus >= 0 ? 'profit' : 'loss'
  }, {
    label: 'Your share',
    value: f(myTotal),
    icon: 'wallet',
    tone: 'brand'
  }].map(s => React.createElement(Card, {
    key: s.label,
    pad: 16,
    style: {
      background: s.tone === 'brand' ? 'var(--brand-tint)' : 'var(--surface)',
      borderColor: s.tone === 'brand' ? 'var(--brand)' : 'var(--border)'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10
    }
  }, React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 7,
      background: s.tone === 'brand' ? 'var(--brand)' : 'var(--bg)',
      color: s.tone === 'brand' ? '#fff' : 'var(--ink-2)',
      display: 'grid',
      placeItems: 'center'
    }
  }, React.createElement(Icon, {
    name: s.icon,
    size: 15
  })), React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink-2)',
      fontWeight: 600
    }
  }, s.label)), React.createElement("div", {
    className: "num",
    style: {
      fontSize: 22,
      fontWeight: 800,
      color: s.tone === 'profit' ? 'var(--profit)' : s.tone === 'loss' ? 'var(--loss)' : s.tone === 'brand' ? 'var(--brand)' : 'var(--ink)'
    }
  }, s.value)))), totalNet !== 0 && React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '11px 18px',
      background: totalNet > 0 ? 'var(--profit-soft)' : 'var(--loss-soft)',
      borderRadius: 'var(--r-md)',
      border: `1px solid ${totalNet > 0 ? 'var(--profit)' : 'var(--loss)'}`
    }
  }, React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      color: 'var(--ink-2)'
    }
  }, totalNet > 0 ? 'Total net profit across all categories' : 'Total net loss across all categories'), React.createElement("span", {
    className: "num",
    style: {
      fontSize: 20,
      fontWeight: 800,
      color: totalNet > 0 ? 'var(--profit)' : 'var(--loss)'
    }
  }, f(totalNet))), totalNet === 0 && totalBonus === 0 && totalAllotted > 0 && React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 18px',
      background: 'var(--surface-2)',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)'
    }
  }, React.createElement(Icon, {
    name: "info",
    size: 18,
    color: "var(--ink-3)"
  }), React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-2)'
    }
  }, React.createElement("strong", null, "No profit on this IPO."), " The allotted shares sold at cost, so there's nothing to distribute or settle here.")), isSME && React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      padding: '11px 16px',
      background: 'var(--info-soft)',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--info)',
      alignItems: 'flex-start'
    }
  }, React.createElement(Icon, {
    name: "pool",
    size: 16,
    color: "var(--info)"
  }), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-2)',
      lineHeight: 1.55
    }
  }, React.createElement("strong", null, "SME lot-based pooling."), " Each category's profit is shared across the opted-in pool by lots, capped at that category's lot level: Retail is per head, sHNI caps everyone at the sHNI level (so sHNI and bHNI tie), and bHNI uses full lots applied. PANs opted out (set on the PAN) take only the equal share of their own category.")), catData.map(d => {
    const meta = CAT_META[d.cat] || {
      label: d.cat,
      tone: 'neutral',
      desc: '',
      textColor: 'var(--ink-2)'
    };
    const hasProfit = d.net !== 0 || d.bonusTotal > 0;
    return React.createElement(Card, {
      key: d.cat,
      pad: 0,
      style: {
        borderColor: hasProfit ? 'var(--border)' : 'var(--border)',
        overflow: 'hidden'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        background: hasProfit ? 'var(--surface-2)' : 'var(--surface)'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }
    }, React.createElement(Badge, {
      tone: meta.tone,
      style: {
        fontSize: 13,
        padding: '4px 12px',
        fontWeight: 800
      }
    }, meta.label), React.createElement("span", {
      style: {
        fontSize: 13,
        color: 'var(--ink-3)'
      }
    }, meta.desc)), React.createElement("div", {
      style: {
        display: 'flex',
        gap: 18
      }
    }, React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: 'var(--ink-3)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '.04em'
      }
    }, "PANs applied"), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 18,
        fontWeight: 800
      }
    }, d.total)), React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: 'var(--ink-3)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '.04em'
      }
    }, "Allotted"), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 18,
        fontWeight: 800,
        color: d.allotted > 0 ? 'var(--profit)' : 'var(--ink-3)'
      }
    }, d.allotted)), hasProfit && !isSME && React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: 'var(--ink-3)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '.04em'
      }
    }, "Per PAN"), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 18,
        fontWeight: 800,
        color: meta.textColor
      }
    }, f(d.perPan))), hasProfit && isSME && React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: 'var(--ink-3)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '.04em'
      }
    }, "Net profit"), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 18,
        fontWeight: 800,
        color: meta.textColor
      }
    }, f(d.net))))), !hasProfit ? React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '18px 20px',
        color: 'var(--ink-3)'
      }
    }, React.createElement("div", {
      style: {
        width: 36,
        height: 36,
        borderRadius: 9,
        background: 'var(--bg)',
        display: 'grid',
        placeItems: 'center'
      }
    }, React.createElement(Icon, {
      name: "x",
      size: 18
    })), React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 700
      }
    }, d.allotted > 0 ? `${meta.label}: allotted, but no profit` : `No allotments in ${meta.label} category`), React.createElement("div", {
      style: {
        fontSize: 12,
        marginTop: 2
      }
    }, isSME ? `${d.total} PAN${d.total !== 1 ? 's' : ''} applied — these still share the SME pool (see Member payouts below).` : d.allotted > 0 ? `${d.allotted} PAN${d.allotted !== 1 ? 's' : ''} allotted but sold at cost — nothing to distribute for this group.` : `${d.total} PAN${d.total !== 1 ? 's' : ''} applied — no profit distribution for this group.`))) : React.createElement("div", {
      className: "pool-main",
      style: {
        display: 'grid',
        gridTemplateColumns: isSME ? '1fr' : '1fr 1fr',
        gap: 0
      }
    }, React.createElement("div", {
      style: {
        padding: '16px 20px',
        borderRight: isSME ? 'none' : '1px solid var(--border)'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 800,
        marginBottom: 12
      }
    }, "Profit breakdown"), React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 0
      }
    }, [['Gross profit', d.gross, 'var(--ink)'], [`STCG (${stcgRate}%)`, -d.stcgAmt, 'var(--loss)'], ...(d.bonusTotal > 0 ? [[`Allotted-PAN bonus (${d.bonusRate}%, kept personally)`, -d.bonusTotal, 'var(--warn)']] : []), [categories.length > 1 ? 'Brokerage (share)' : 'Brokerage', -d.brok, 'var(--loss)']].map(([l, v, c]) => React.createElement("div", {
      key: l,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '9px 0',
        borderBottom: '1px solid var(--border)'
      }
    }, React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: 'var(--ink-2)',
        fontWeight: 600
      }
    }, l), React.createElement("span", {
      className: "num",
      style: {
        fontSize: 13,
        fontWeight: 800,
        color: c
      }
    }, v < 0 ? '-' : '', f(Math.abs(v)))))), React.createElement("div", {
      style: {
        marginTop: 10,
        padding: '10px 14px',
        background: 'var(--brand-tint)',
        borderRadius: 'var(--r-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline'
      }
    }, isSME ? React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-2)',
        fontWeight: 600
      }
    }, "Split ", d.cat === 'bHNI' ? 'by lots applied' : d.cat === 'sHNI' ? 'by lots, capped at sHNI level' : 'per head (equal)'), React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        marginTop: 2
      }
    }, "shared across the opted-in pool")), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 20,
        fontWeight: 800,
        color: 'var(--brand)'
      }
    }, f(d.net))) : React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-2)',
        fontWeight: 600
      }
    }, "Net ÷ ", d.total, " PANs"), d.remainder > 0 && React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        marginTop: 2
      }
    }, d.remainder, " PAN", d.remainder !== 1 ? 's' : '', " get ₹1 extra so every rupee is shared")), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 22,
        fontWeight: 800,
        color: 'var(--brand)'
      }
    }, f(d.perPan), React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--ink-3)'
      }
    }, "/PAN"))))), !isSME && React.createElement("div", null, React.createElement("div", {
      style: {
        padding: '16px 20px 10px',
        fontSize: 13,
        fontWeight: 800
      }
    }, "Member shares (", meta.label, ")"), React.createElement(MemberSharesTable, {
      D: D,
      shares: d.memberShares,
      bonuses: d.memberBonuses,
      f: f
    }))));
  }), isSME && Object.keys(smeMemberShares).length > 0 && React.createElement(Card, {
    pad: 0,
    style: {
      overflow: 'hidden'
    }
  }, React.createElement("div", {
    style: {
      padding: '14px 20px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface-2)'
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800
    }
  }, "Member payouts"), React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, "Each member's total share across the SME pool"), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
      marginTop: 8
    }
  }, React.createElement(Badge, {
    tone: "profit",
    icon: "check",
    style: {
      fontSize: 9.5,
      padding: '1px 6px'
    }
  }, "Allotted"), React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: 'var(--ink-3)'
    }
  }, "got an allotment"), React.createElement(Badge, {
    tone: "info",
    icon: "pan",
    style: {
      fontSize: 9.5,
      padding: '1px 6px'
    }
  }, "Pooled"), React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: 'var(--ink-3)'
    }
  }, "share from own application"), React.createElement(Badge, {
    tone: "brand",
    icon: "groups",
    style: {
      fontSize: 9.5,
      padding: '1px 6px'
    }
  }, "Backer"), React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: 'var(--ink-3)'
    }
  }, "share from funding another PAN"))), React.createElement(MemberSharesTable, {
    D: D,
    shares: smeMemberShares,
    bonuses: smeMemberBonuses,
    f: f,
    roles: memberRoles
  })), ipoAllots.some(a => a.status === 'allotted') && React.createElement(Card, {
    pad: 20
  }, React.createElement(SectionTitle, {
    title: "Allotted PANs",
    sub: "Shares received and sold on listing day"
  }), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(230px,1fr))',
      gap: 12,
      marginTop: 12
    }
  }, ipoAllots.filter(a => a.status === 'allotted').map((a, i) => {
    const panObj = D.pan(a.pan);
    const m = panObj ? D.member(panObj.member) : null;
    const meta = CAT_META[a.category] || {
      label: a.category,
      tone: 'neutral'
    };
    return React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        background: 'var(--surface-2)'
      }
    }, React.createElement("div", {
      style: {
        width: 38,
        height: 38,
        borderRadius: 10,
        background: m ? `hsl(${m.avatarHue} 55% 52%)` : 'var(--brand)',
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 800,
        fontSize: 12,
        flexShrink: 0
      }
    }, panObj ? D.initials(panObj.holder) : '?'), React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700
      }
    }, panObj?.holder || a.pan), React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: 'var(--ink-3)',
        display: 'flex',
        gap: 5,
        alignItems: 'center',
        marginTop: 2
      }
    }, React.createElement(Badge, {
      tone: meta.tone,
      style: {
        fontSize: 10
      }
    }, meta.label), a.shares.toLocaleString('en-IN'), " shares · ", m?.name.split(' ')[0])), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 14,
        fontWeight: 800,
        color: a.gain < 0 ? 'var(--loss)' : 'var(--profit)',
        whiteSpace: 'nowrap'
      }
    }, a.gain > 0 ? '+' : '', f(a.gain, {
      compact: true
    })));
  }))), totalAllotted > 0 && pool?.status !== 'Settled' && (() => {
    const noProfit = totalNet === 0 && totalBonus === 0;
    return React.createElement("div", {
      style: {
        padding: '16px 20px',
        background: noProfit ? 'var(--surface-2)' : 'var(--brand-tint)',
        borderRadius: 'var(--r-lg)',
        border: `1.5px solid ${noProfit ? 'var(--border)' : 'var(--brand)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap'
      }
    }, React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 800
      }
    }, noProfit ? 'Close out this IPO' : totalNet >= 0 ? 'Ready to distribute' : 'Ready to settle (loss)'), React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--ink-2)',
        marginTop: 3
      }
    }, noProfit ? 'No profit to distribute — finalizing records zero payouts and marks the pool settled, so it moves out of the active list.' : isSME ? catData.filter(d => d.net !== 0).map(d => `${d.cat}: ${f(d.net)} ${d.cat === 'bHNI' ? 'by lots' : d.cat === 'sHNI' ? 'capped lots' : 'per head'}`).join(' · ') : catData.filter(d => d.net !== 0).map(d => `${d.cat}: ${f(d.perPan)}/PAN × ${d.total} applicants`).join(' · ')), finalErr && React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--loss)',
        marginTop: 4,
        fontWeight: 600
      }
    }, finalErr)), React.createElement(Button, {
      variant: noProfit ? 'ghost' : 'primary',
      icon: "check",
      onClick: () => setConfirmFinal(true),
      style: {
        flexShrink: 0
      }
    }, noProfit ? 'Mark settled →' : 'Finalize payouts →'));
  })(), confirmFinal && React.createElement("div", {
    className: "modal-overlay",
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,.45)',
      zIndex: 70,
      display: 'grid',
      placeItems: 'center',
      padding: 16
    }
  }, React.createElement("div", {
    className: "modal-card",
    style: {
      background: 'var(--surface)',
      borderRadius: 'var(--r-lg)',
      width: '100%',
      maxWidth: 400,
      padding: 24,
      boxShadow: 'var(--sh-pop)',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      animation: 'popIn .22s cubic-bezier(.2,.7,.3,1)'
    }
  }, React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 800
    }
  }, totalNet === 0 && totalBonus === 0 ? 'Mark this IPO settled?' : 'Finalize payouts?'), React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-2)',
      lineHeight: 1.6
    }
  }, totalNet === 0 && totalBonus === 0 ? React.createElement(React.Fragment, null, "This IPO made ", React.createElement("strong", null, "no profit"), " (allotted shares sold at cost), so there are no payouts to record. Finalizing marks the pool settled and moves it out of the active list.") : React.createElement(React.Fragment, null, "This will create settlement records for ", React.createElement("strong", null, catData.reduce((s, d) => s + Object.keys(d.memberShares).length, 0), " members"), " totalling ", React.createElement("strong", null, f(totalNet)), ". This cannot be easily undone.")), finalErr && React.createElement("div", {
    style: {
      color: 'var(--loss)',
      fontSize: 13,
      fontWeight: 600
    }
  }, finalErr), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end'
    }
  }, React.createElement("button", {
    onClick: () => setConfirmFinal(false),
    style: {
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      padding: '9px 16px',
      background: 'var(--surface)',
      fontWeight: 700,
      fontSize: 13.5,
      cursor: 'pointer'
    }
  }, "Cancel"), React.createElement("button", {
    onClick: async () => {
      await finalizePayouts();
      setConfirmFinal(false);
    },
    style: {
      border: 'none',
      borderRadius: 'var(--r-md)',
      padding: '9px 18px',
      background: 'var(--brand)',
      color: '#fff',
      fontWeight: 700,
      fontSize: 13.5,
      cursor: 'pointer',
      opacity: finalizing ? .7 : 1
    }
  }, finalizing ? 'Saving…' : 'Yes, finalize')))), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, pool?.status === 'Settled' ? React.createElement(Button, {
    variant: "primary",
    icon: "ledger",
    onClick: () => navigate('settlement', {
      id: sel
    })
  }, "View settlement ledger") : React.createElement(Button, {
    variant: "ghost",
    icon: "ledger",
    onClick: () => navigate('settlement', {
      id: sel
    })
  }, "Go to settlement ledger"), React.createElement(Button, {
    variant: "ghost",
    icon: "settings",
    onClick: () => navigate('settings')
  }, "Tax & brokerage settings")));
}
Object.assign(window, {
  ProfitPooling,
  CAT_META
});