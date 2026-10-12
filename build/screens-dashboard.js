// GENERATED from src/screens-dashboard.jsx by build.js — do not edit.
function KPICard({
  icon,
  label,
  value,
  delta,
  tone = 'neutral',
  spark,
  sparkUp = true,
  big = false,
  onClick
}) {
  const toneColor = {
    profit: 'var(--profit)',
    loss: 'var(--loss)',
    info: 'var(--info)',
    brand: 'var(--brand)',
    warn: 'var(--warn)',
    neutral: 'var(--ink)'
  };
  const toneSoft = {
    profit: 'var(--profit-soft)',
    loss: 'var(--loss-soft)',
    info: 'var(--info-soft)',
    brand: 'var(--brand-tint)',
    warn: 'var(--warn-soft)',
    neutral: 'var(--bg)'
  };
  return React.createElement(Card, {
    pad: 16,
    hover: true,
    onClick: onClick,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: big ? 14 : 10,
      cursor: onClick ? 'pointer' : undefined
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9
    }
  }, React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      background: toneSoft[tone],
      color: toneColor[tone],
      display: 'grid',
      placeItems: 'center'
    }
  }, React.createElement(Icon, {
    name: icon,
    size: 17,
    stroke: 2.2
  })), React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--ink-2)',
      fontWeight: 600
    }
  }, label)), spark && React.createElement(Sparkline, {
    data: spark,
    up: sparkUp,
    w: 64,
    h: 24
  })), React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 8,
      flexWrap: 'wrap',
      rowGap: 6
    }
  }, React.createElement("span", {
    className: "num",
    style: {
      fontSize: big ? 30 : 23,
      fontWeight: 800,
      letterSpacing: '-.02em',
      whiteSpace: 'nowrap',
      color: toneColor[tone] === 'var(--ink)' ? 'var(--ink)' : tone === 'profit' || tone === 'loss' ? toneColor[tone] : 'var(--ink)'
    }
  }, value), delta && React.createElement(Badge, {
    tone: delta.tone,
    icon: delta.tone === 'profit' ? 'arrowUp' : delta.tone === 'loss' ? 'arrowDown' : undefined
  }, delta.label)));
}
function ChartCard({
  title,
  sub,
  right,
  children,
  style
}) {
  return React.createElement(Card, {
    pad: 18,
    style: style
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 16
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800,
      whiteSpace: 'nowrap'
    }
  }, title), sub && React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, sub)), right), children);
}
function Legend({
  items
}) {
  return React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      flexWrap: 'wrap'
    }
  }, items.map(it => React.createElement("div", {
    key: it.label,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 12.5,
      color: 'var(--ink-2)',
      fontWeight: 600
    }
  }, React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 3,
      background: it.color
    }
  }), " ", it.label, it.value && React.createElement("span", {
    className: "num",
    style: {
      color: 'var(--ink)',
      fontWeight: 800
    }
  }, it.value))));
}
function YouStat({
  label,
  value,
  sub,
  color
}) {
  return React.createElement("div", {
    style: {
      textAlign: 'right',
      minWidth: 84
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: 'var(--ink-3)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, label), React.createElement("div", {
    className: "num",
    style: {
      fontSize: 20,
      fontWeight: 800,
      color: color || 'var(--ink)',
      whiteSpace: 'nowrap'
    }
  }, value), sub && React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--ink-3)',
      whiteSpace: 'nowrap',
      marginTop: 1
    }
  }, sub));
}
const CAT_TONE = {
  Retail: 'info',
  sHNI: 'brand',
  bHNI: 'warn',
  SME: 'sme'
};
const CAT_COLOR = {
  Retail: 'var(--info)',
  sHNI: 'var(--brand)',
  bHNI: 'var(--warn)',
  SME: 'var(--sme)'
};
function xirrLabel(rate) {
  if (rate == null || !isFinite(rate)) return '—';
  const pct = rate * 100;
  const rounded = Math.abs(pct) >= 1000 ? Math.round(pct) : +pct.toFixed(1);
  return (rounded > 0 ? '+' : '') + rounded + '%';
}
function limitRows(rows, limit, expanded) {
  if (expanded || rows.length <= limit) return rows;
  const head = rows.slice(0, limit);
  const mine = rows.slice(limit).filter(r => r.you);
  return head.concat(mine);
}
function ShowAllToggle({
  total,
  limit,
  expanded,
  onToggle,
  noun
}) {
  if (total <= limit) return null;
  return React.createElement("button", {
    onClick: onToggle,
    style: {
      width: '100%',
      border: 'none',
      borderTop: '1px solid var(--border)',
      background: 'var(--surface-2)',
      color: 'var(--brand)',
      fontWeight: 700,
      fontSize: 13,
      padding: '11px 18px',
      cursor: 'pointer'
    }
  }, expanded ? 'Show fewer' : `Show all ${total} ${noun}`);
}
function ProfitByIpoCard({
  D,
  navigate,
  f
}) {
  const cols = [{
    key: 'short',
    label: 'IPO',
    align: 'left'
  }, {
    key: 'type',
    label: 'Board',
    align: 'left'
  }, {
    key: 'applied',
    label: 'Applied',
    align: 'right',
    defDir: 'desc'
  }, {
    key: 'allotted',
    label: 'Allotted',
    align: 'right',
    defDir: 'desc'
  }, {
    key: 'gross',
    label: 'Gross gain',
    align: 'right',
    defDir: 'desc'
  }, {
    key: 'net',
    label: 'Net profit',
    align: 'right',
    defDir: 'desc'
  }];
  const [sort, onSort] = useSortState('net', 'desc');
  const [expanded, setExpanded] = useState(false);
  const IPO_LIMIT = 8;
  const allRows = sortRows(D.profitByIpo || [], sort, cols);
  const rows = limitRows(allRows, IPO_LIMIT, expanded);
  const tot = (D.profitByIpo || []).reduce((s, p) => ({
    gross: s.gross + p.gross,
    net: s.net + p.net,
    applied: s.applied + p.applied,
    allotted: s.allotted + p.allotted
  }), {
    gross: 0,
    net: 0,
    applied: 0,
    allotted: 0
  });
  return React.createElement(Card, {
    pad: 0
  }, React.createElement("div", {
    style: {
      padding: '16px 18px',
      borderBottom: '1px solid var(--border)'
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800
    }
  }, "Profit by IPO"), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, "Net profit per IPO · Applied & Allotted count PAN applications · tap a heading to sort")), React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: 640
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      fontSize: 11.5,
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
      padding: '11px 18px'
    }
  })))), React.createElement("tbody", null, rows.map(p => React.createElement("tr", {
    key: p.id,
    onClick: () => navigate('ipo', {
      id: p.id
    }),
    style: {
      borderTop: '1px solid var(--border)',
      cursor: 'pointer'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'var(--surface-2)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent'
  }, React.createElement("td", {
    style: {
      padding: '12px 18px',
      fontWeight: 700,
      fontSize: 13.5
    }
  }, React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      flexWrap: 'wrap'
    }
  }, p.short, D.pools.some(pl => pl.ipo === p.id && pl.status === 'Settled') && React.createElement(Badge, {
    tone: "profit"
  }, "Settled"))), React.createElement("td", {
    style: {
      padding: '12px 18px'
    }
  }, React.createElement(Badge, {
    tone: p.type === 'SME' ? 'sme' : 'mainboard'
  }, p.type)), React.createElement("td", {
    className: "num",
    style: {
      padding: '12px 18px',
      textAlign: 'right',
      color: 'var(--ink-2)'
    }
  }, p.applied), React.createElement("td", {
    className: "num",
    style: {
      padding: '12px 18px',
      textAlign: 'right',
      color: 'var(--ink-2)'
    }
  }, p.allotted), React.createElement("td", {
    className: "num",
    style: {
      padding: '12px 18px',
      textAlign: 'right',
      color: 'var(--ink-2)'
    }
  }, p.gross > 0 ? f(p.gross, {
    compact: true
  }) : '—'), React.createElement("td", {
    className: "num",
    style: {
      padding: '12px 18px',
      textAlign: 'right',
      fontWeight: 700,
      color: p.net > 0 ? 'var(--profit)' : p.net < 0 ? 'var(--loss)' : 'var(--ink-3)'
    }
  }, p.net !== 0 ? f(p.net, {
    compact: true
  }) : '—'))), allRows.length > IPO_LIMIT && React.createElement("tr", {
    style: {
      borderTop: '1px solid var(--border)'
    }
  }, React.createElement("td", {
    colSpan: cols.length,
    style: {
      padding: 0
    }
  }, React.createElement(ShowAllToggle, {
    total: allRows.length,
    limit: IPO_LIMIT,
    expanded: expanded,
    onToggle: () => setExpanded(e => !e),
    noun: "IPOs"
  }))), rows.length > 0 && React.createElement("tr", {
    style: {
      borderTop: '2px solid var(--border-strong)',
      background: 'var(--surface-2)'
    }
  }, React.createElement("td", {
    style: {
      padding: '12px 18px',
      fontWeight: 800,
      fontSize: 13.5
    }
  }, "All IPOs together"), React.createElement("td", {
    style: {
      padding: '12px 18px'
    }
  }), React.createElement("td", {
    className: "num",
    style: {
      padding: '12px 18px',
      textAlign: 'right',
      fontWeight: 800
    }
  }, tot.applied), React.createElement("td", {
    className: "num",
    style: {
      padding: '12px 18px',
      textAlign: 'right',
      fontWeight: 800
    }
  }, tot.allotted), React.createElement("td", {
    className: "num",
    style: {
      padding: '12px 18px',
      textAlign: 'right',
      fontWeight: 800
    }
  }, tot.gross > 0 ? f(tot.gross, {
    compact: true
  }) : '—'), React.createElement("td", {
    className: "num",
    style: {
      padding: '12px 18px',
      textAlign: 'right',
      fontWeight: 800,
      color: tot.net < 0 ? 'var(--loss)' : 'var(--profit)'
    }
  }, tot.net !== 0 ? f(tot.net, {
    compact: true
  }) : '—')), rows.length === 0 && React.createElement("tr", {
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
  }, "No applications yet."))))));
}
function CategoryCard({
  D,
  f
}) {
  const cats = D.categoryStats || [];
  const cols = [{
    key: 'cat',
    label: 'Category',
    align: 'left'
  }, {
    key: 'ipos',
    label: 'IPOs',
    align: 'right',
    defDir: 'desc'
  }, {
    key: 'applied',
    label: 'Applied',
    align: 'right',
    defDir: 'desc'
  }, {
    key: 'allotted',
    label: 'Allotted',
    align: 'right',
    defDir: 'desc'
  }, {
    key: 'allotRate',
    label: 'Rate',
    align: 'right',
    defDir: 'desc'
  }, {
    key: 'gross',
    label: 'Gross',
    align: 'right',
    defDir: 'desc'
  }, {
    key: 'net',
    label: 'Net',
    align: 'right',
    defDir: 'desc'
  }];
  const [sort, onSort] = useSortState('net', 'desc');
  const rows = sortRows(cats, sort, cols);
  const tot = cats.reduce((s, c) => ({
    ipos: s.ipos + c.ipos,
    applied: s.applied + c.applied,
    allotted: s.allotted + c.allotted,
    gross: s.gross + c.gross,
    net: s.net + c.net
  }), {
    ipos: 0,
    applied: 0,
    allotted: 0,
    gross: 0,
    net: 0
  });
  const barData = cats.map(c => ({
    m: c.cat,
    applied: c.applied,
    allot: c.allotted
  }));
  return React.createElement(Card, {
    pad: 0
  }, React.createElement("div", {
    style: {
      padding: '16px 18px',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      borderBottom: '1px solid var(--border)',
      flexWrap: 'wrap'
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800
    }
  }, "By category"), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, "Applications, allotments & net profit per category")), React.createElement(Legend, {
    items: [{
      label: 'Applied',
      color: 'var(--border-strong)'
    }, {
      label: 'Allotted',
      color: 'var(--brand)'
    }]
  })), cats.length === 0 ? React.createElement("div", {
    style: {
      padding: '26px 18px',
      textAlign: 'center',
      color: 'var(--ink-3)',
      fontSize: 13
    }
  }, "No applications yet.") : React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      padding: '14px 18px',
      display: 'grid',
      gap: 10,
      borderBottom: '1px solid var(--border)'
    }
  }, (() => {
    const maxNet = Math.max(1, ...cats.map(c => c.net));
    return cats.map(c => React.createElement("div", {
      key: c.cat,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }
    }, React.createElement("div", {
      style: {
        width: 58,
        flexShrink: 0
      }
    }, React.createElement(Badge, {
      tone: CAT_TONE[c.cat] || 'neutral'
    }, c.cat)), React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement(Meter, {
      value: c.net,
      max: maxNet,
      color: CAT_COLOR[c.cat] || 'var(--brand)',
      style: {
        height: 8
      }
    })), React.createElement("div", {
      className: "num",
      style: {
        width: 72,
        textAlign: 'right',
        fontSize: 13,
        fontWeight: 800,
        color: c.net > 0 ? 'var(--profit)' : c.net < 0 ? 'var(--loss)' : 'var(--ink-3)'
      }
    }, c.net !== 0 ? f(c.net, {
      compact: true
    }) : '—')));
  })()), React.createElement("div", {
    style: {
      padding: '14px 18px 4px'
    }
  }, React.createElement(BarChart, {
    data: barData,
    keys: ['applied', 'allot'],
    colors: ['var(--border-strong)', 'var(--brand)'],
    h: 150
  })), React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: 520
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      fontSize: 11.5,
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
      padding: '10px 18px'
    }
  })))), React.createElement("tbody", null, rows.map(c => React.createElement("tr", {
    key: c.cat,
    style: {
      borderTop: '1px solid var(--border)'
    }
  }, React.createElement("td", {
    style: {
      padding: '11px 18px'
    }
  }, React.createElement(Badge, {
    tone: CAT_TONE[c.cat] || 'neutral'
  }, c.cat)), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      color: 'var(--ink-2)'
    }
  }, c.ipos), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      color: 'var(--ink-2)'
    }
  }, c.applied), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      color: 'var(--ink-2)'
    }
  }, c.allotted), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      color: 'var(--ink-2)'
    }
  }, c.allotRate, "%"), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      color: 'var(--ink-2)'
    }
  }, c.gross > 0 ? f(c.gross, {
    compact: true
  }) : '—'), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      fontWeight: 700,
      color: c.net > 0 ? 'var(--profit)' : c.net < 0 ? 'var(--loss)' : 'var(--ink-3)'
    }
  }, c.net !== 0 ? f(c.net, {
    compact: true
  }) : '—'))), React.createElement("tr", {
    style: {
      borderTop: '2px solid var(--border-strong)',
      background: 'var(--surface-2)'
    }
  }, React.createElement("td", {
    style: {
      padding: '11px 18px',
      fontWeight: 800
    }
  }, "All"), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      fontWeight: 800
    }
  }, tot.ipos), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      fontWeight: 800
    }
  }, tot.applied), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      fontWeight: 800
    }
  }, tot.allotted), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      fontWeight: 800
    }
  }, tot.applied > 0 ? Math.round(tot.allotted / tot.applied * 100) : 0, "%"), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      fontWeight: 800
    }
  }, tot.gross > 0 ? f(tot.gross, {
    compact: true
  }) : '—'), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      fontWeight: 800,
      color: tot.net < 0 ? 'var(--loss)' : 'var(--profit)'
    }
  }, tot.net !== 0 ? f(tot.net, {
    compact: true
  }) : '—')))))));
}
function Dashboard({
  navigate,
  tweaks
}) {
  const D = window.DB;
  const layout = tweaks && tweaks.dashLayout || 'kpi';
  const f = (n, o) => D.fmtINR(n, o);
  const kpiCards = [{
    icon: 'calendar',
    label: 'IPOs Applied',
    value: D.kpis.applied,
    tone: 'neutral',
    nav: 'admin'
  }, {
    icon: 'check',
    label: 'IPOs Allotted',
    value: D.kpis.allotments,
    tone: 'neutral',
    nav: 'admin'
  }, {
    icon: 'spark',
    label: 'IPO Hit Rate',
    value: D.kpis.allotRate + '%',
    tone: 'neutral',
    nav: 'admin'
  }, {
    icon: 'wallet',
    label: 'Total Investment',
    value: f(D.kpis.invested, {
      compact: true
    }),
    tone: 'neutral',
    nav: 'pooling',
    delta: {
      tone: 'neutral',
      label: 'this season'
    }
  }, {
    icon: 'trend',
    label: 'Total Profit',
    value: f(D.kpis.profit, {
      compact: true
    }),
    tone: D.kpis.profit >= 0 ? 'profit' : 'loss',
    nav: 'pooling',
    delta: D.kpis.roi > 0 ? {
      tone: 'profit',
      label: '+' + D.kpis.roi + '% ROI'
    } : D.kpis.roi < 0 ? {
      tone: 'loss',
      label: D.kpis.roi + '% ROI'
    } : undefined
  }, {
    icon: 'rupee',
    label: 'Tax Set Aside',
    value: f(D.kpis.taxSetAside, {
      compact: true
    }),
    tone: 'warn',
    nav: 'settings',
    delta: D.kpis.grossProfit > 0 ? {
      tone: 'neutral',
      label: Math.round(D.kpis.taxSetAside / D.kpis.grossProfit * 100) + '% of gross'
    } : undefined
  }, {
    icon: 'spark',
    label: 'Portfolio XIRR',
    value: xirrLabel(D.kpis.xirr),
    tone: D.kpis.xirr == null ? 'neutral' : D.kpis.xirr >= 0 ? 'profit' : 'loss',
    nav: 'pooling'
  }, {
    icon: 'ledger',
    label: 'Pending Settlements',
    value: D.kpis.pending,
    tone: 'warn',
    nav: 'settlement',
    delta: D.kpis.pendingAmount > 0 ? {
      tone: 'warn',
      label: f(D.kpis.pendingAmount, {
        compact: true
      })
    } : undefined
  }];
  const me = (D.memberProfits || []).find(m => m.you);
  const myRank = (D.memberProfits || []).findIndex(m => m.you) + 1;
  const myPending = me ? (D.settlements || []).filter(s => s.member === me.id && s.status === 'Pending').reduce((s, r) => s + (r.amount || 0), 0) : 0;
  const YouBand = me ? React.createElement(Card, {
    pad: 0,
    hover: true,
    onClick: () => navigate('pooling'),
    style: {
      cursor: 'pointer',
      overflow: 'hidden'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '15px 20px',
      background: 'var(--brand-tint)',
      border: '1px solid var(--brand)',
      borderRadius: 'var(--r-lg)',
      flexWrap: 'wrap'
    }
  }, React.createElement(Avatar, {
    name: me.name,
    hue: me.avatarHue,
    size: 46,
    you: true
  }), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 150
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-2)',
      fontWeight: 600
    }
  }, "Your pooled position"), React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 800,
      marginTop: 2
    }
  }, me.name, React.createElement("span", {
    style: {
      color: 'var(--brand)',
      fontWeight: 600
    }
  }, " · You")), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, me.iposApplied, " IPO", me.iposApplied === 1 ? '' : 's', " applied · ", me.pans, " PAN", me.pans === 1 ? '' : 's')), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      flexWrap: 'wrap',
      rowGap: 10
    }
  }, React.createElement(YouStat, {
    label: "Net profit",
    value: f(me.profit, {
      compact: true
    }),
    color: me.profit >= 0 ? 'var(--profit)' : 'var(--loss)',
    sub: me.xirr != null ? xirrLabel(me.xirr) + ' XIRR' : null
  }), React.createElement(YouStat, {
    label: "Your rank",
    value: myRank > 0 ? '#' + myRank : '—',
    sub: 'of ' + (D.memberProfits || []).length + ' members'
  }), React.createElement(YouStat, {
    label: "Your pending",
    value: f(myPending, {
      compact: true
    }),
    color: myPending > 0 ? 'var(--warn)' : 'var(--ink-3)',
    sub: myPending > 0 ? 'awaiting transfer' : 'all settled'
  })))) : null;
  const ProfitTrend = React.createElement(ChartCard, {
    title: "Monthly profit trend",
    sub: "Pooled net profit · last 6 months",
    right: null
  }, React.createElement(AreaChart, {
    data: D.monthlyProfit,
    h: 184,
    fmt: v => f(v, {
      compact: true
    })
  }));
  const SmeVsMain = React.createElement(ChartCard, {
    title: "SME vs Mainboard",
    sub: "Profit split by board"
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 22
    }
  }, React.createElement(Donut, {
    size: 150,
    stroke: 20,
    segments: [{
      v: D.smeVsMain.sme,
      color: 'var(--sme)'
    }, {
      v: D.smeVsMain.mainboard,
      color: 'var(--mainboard)'
    }],
    centerLabel: f(D.smeVsMain.sme + D.smeVsMain.mainboard, {
      compact: true
    }),
    centerSub: "net profit"
  }), React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, [['SME', D.smeVsMain.sme, 'var(--sme)'], ['Mainboard', D.smeVsMain.mainboard, 'var(--mainboard)']].map(([l, v, c]) => React.createElement("div", {
    key: l
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 13,
      fontWeight: 700
    }
  }, React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 3,
      background: c
    }
  }), " ", l), React.createElement("div", {
    className: "num",
    style: {
      fontSize: 19,
      fontWeight: 800,
      marginTop: 3
    }
  }, f(v, {
    compact: true
  })), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)'
    }
  }, (() => {
    const t = D.smeVsMain.sme + D.smeVsMain.mainboard;
    return t > 0 ? Math.round(v / t * 100) + '% of total' : '—';
  })()))))));
  const AllotHistory = React.createElement(ChartCard, {
    title: "Allotment history",
    sub: "Applications vs allotments",
    right: React.createElement(Legend, {
      items: [{
        label: 'Applied',
        color: 'var(--border-strong)'
      }, {
        label: 'Allotted',
        color: 'var(--brand)'
      }]
    })
  }, React.createElement(BarChart, {
    data: D.allotHistory,
    keys: ['applied', 'allot'],
    colors: ['var(--border-strong)', 'var(--brand)'],
    h: 184
  }));
  const ProfitByIpo = React.createElement(ProfitByIpoCard, {
    D: D,
    navigate: navigate,
    f: f
  });
  const ByCategory = React.createElement(CategoryCard, {
    D: D,
    f: f
  });
  const recentActivity = (D.profitByIpo || []).map(p => ({
    ...p,
    ipo: D.ipo(p.id)
  })).filter(r => r.ipo).sort((a, b) => String(b.month || '').localeCompare(String(a.month || ''))).slice(0, 5);
  const RecentTable = React.createElement(Card, {
    pad: 0
  }, React.createElement("div", {
    style: {
      padding: '16px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border)'
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800
    }
  }, "Recent IPO activity"), React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: () => navigate('admin')
  }, "View all →")), React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: 640
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)',
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, ['IPO', 'Board', 'Applied', 'Allotted', 'Profit', 'Status'].map((h, i) => React.createElement("th", {
    key: h,
    style: {
      textAlign: i > 1 ? 'right' : 'left',
      fontWeight: 700,
      padding: '11px 18px'
    }
  }, h)))), React.createElement("tbody", null, recentActivity.map(({
    ipo,
    applied,
    allotted,
    net
  }) => React.createElement("tr", {
    key: ipo.id,
    onClick: () => navigate('ipo', {
      id: ipo.id
    }),
    style: {
      borderTop: '1px solid var(--border)',
      cursor: 'pointer'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'var(--surface-2)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent'
  }, React.createElement("td", {
    style: {
      padding: '13px 18px'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11
    }
  }, React.createElement(IpoLogo, {
    ipo: ipo,
    size: 36
  }), React.createElement("div", null, React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 13.5
    }
  }, ipo.short), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)'
    }
  }, ipo.sector)))), React.createElement("td", {
    style: {
      padding: '13px 18px'
    }
  }, React.createElement(Badge, {
    tone: ipo.type === 'SME' ? 'sme' : 'mainboard'
  }, ipo.type)), React.createElement("td", {
    className: "num",
    style: {
      padding: '13px 18px',
      textAlign: 'right',
      color: 'var(--ink-2)'
    }
  }, applied || '—'), React.createElement("td", {
    className: "num",
    style: {
      padding: '13px 18px',
      textAlign: 'right',
      color: 'var(--ink-2)'
    }
  }, allotted || '—'), React.createElement("td", {
    className: "num",
    style: {
      padding: '13px 18px',
      textAlign: 'right',
      fontWeight: 700,
      color: net > 0 ? 'var(--profit)' : net < 0 ? 'var(--loss)' : 'var(--ink-3)'
    }
  }, net !== 0 ? f(net, {
    compact: true
  }) : '—'), React.createElement("td", {
    style: {
      padding: '13px 18px',
      textAlign: 'right'
    }
  }, React.createElement(Badge, {
    tone: ipo.status === 'Listed' ? 'profit' : ipo.status === 'Open' ? 'info' : 'neutral'
  }, ipo.status)))), recentActivity.length === 0 && React.createElement("tr", {
    style: {
      borderTop: '1px solid var(--border)'
    }
  }, React.createElement("td", {
    colSpan: 6,
    style: {
      padding: '18px',
      textAlign: 'center',
      color: 'var(--ink-3)',
      fontSize: 13
    }
  }, "No IPO activity yet."))))));
  const SoloDelta = ({
    profit,
    soloProfit
  }) => {
    if (soloProfit == null) return null;
    const delta = Math.round(profit - soloProfit);
    if (delta === 0) return null;
    const up = delta > 0;
    return React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: up ? 'var(--profit)' : 'var(--loss)',
        whiteSpace: 'nowrap'
      }
    }, up ? '▲' : '▼', " ", f(Math.abs(delta), {
      compact: true
    }), " vs solo");
  };
  const XirrTag = ({
    xirr
  }) => {
    if (xirr == null) return null;
    return React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--ink-3)',
        whiteSpace: 'nowrap'
      }
    }, xirrLabel(xirr), " XIRR");
  };
  const memberRanks = (D.memberProfits || []).filter(m => m.profit > 0);
  const BOARD_LIMIT = 10;
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [showAllPans, setShowAllPans] = useState(false);
  const topProfit = memberRanks.length ? memberRanks[0].profit : 0;
  const MemberLeaderboard = React.createElement(Card, {
    pad: 0
  }, React.createElement("div", {
    style: {
      padding: '16px 18px',
      borderBottom: '1px solid var(--border)'
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800
    }
  }, "Member leaderboard"), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, "Net profit earned per member · across all IPOs")), memberRanks.length > 0 ? React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '16px 18px',
      background: 'var(--profit-soft)',
      borderBottom: '1px solid var(--border)'
    }
  }, React.createElement(Avatar, {
    name: memberRanks[0].name,
    hue: memberRanks[0].avatarHue,
    size: 44,
    you: memberRanks[0].you
  }), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement(Badge, {
    tone: "profit",
    icon: "spark"
  }, "Top earner"), React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      marginTop: 5
    }
  }, memberRanks[0].name, memberRanks[0].you && React.createElement("span", {
    style: {
      color: 'var(--brand)',
      fontWeight: 600
    }
  }, " · You")), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)'
    }
  }, memberRanks[0].iposApplied, " IPO", memberRanks[0].iposApplied === 1 ? '' : 's', " applied · ", memberRanks[0].pans, " PAN", memberRanks[0].pans === 1 ? '' : 's')), React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, React.createElement("div", {
    className: "num",
    style: {
      fontSize: 24,
      fontWeight: 800,
      color: 'var(--profit)',
      whiteSpace: 'nowrap'
    }
  }, f(memberRanks[0].profit)), React.createElement(SoloDelta, {
    profit: memberRanks[0].profit,
    soloProfit: memberRanks[0].soloProfit
  }), React.createElement(XirrTag, {
    xirr: memberRanks[0].xirr
  }))), limitRows(memberRanks, BOARD_LIMIT, showAllMembers).map(m => {
    const i = memberRanks.indexOf(m);
    return React.createElement("div", {
      key: m.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 18px',
        borderTop: i === 0 ? 'none' : '1px solid var(--border)',
        background: m.you ? 'var(--brand-tint)' : 'transparent'
      }
    }, React.createElement("span", {
      className: "num",
      style: {
        width: 18,
        textAlign: 'right',
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--ink-3)'
      }
    }, i + 1), React.createElement(Avatar, {
      name: m.name,
      hue: m.avatarHue,
      size: 30,
      you: m.you
    }), React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, m.name, m.you && React.createElement("span", {
      style: {
        color: 'var(--brand)',
        fontWeight: 600
      }
    }, " · You")), React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        marginTop: 1
      }
    }, m.iposApplied, " IPO", m.iposApplied === 1 ? '' : 's'), React.createElement("div", {
      style: {
        marginTop: 5
      }
    }, React.createElement(Meter, {
      value: m.profit,
      max: topProfit,
      color: "var(--profit)",
      style: {
        height: 6
      }
    }))), React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, React.createElement("div", {
      className: "num",
      style: {
        fontSize: 14,
        fontWeight: 800,
        whiteSpace: 'nowrap'
      }
    }, f(m.profit, {
      compact: true
    })), React.createElement(SoloDelta, {
      profit: m.profit,
      soloProfit: m.soloProfit
    }), React.createElement(XirrTag, {
      xirr: m.xirr
    })));
  }), React.createElement(ShowAllToggle, {
    total: memberRanks.length,
    limit: BOARD_LIMIT,
    expanded: showAllMembers,
    onToggle: () => setShowAllMembers(e => !e),
    noun: "members"
  })) : React.createElement("div", {
    style: {
      padding: '18px',
      textAlign: 'center',
      color: 'var(--ink-3)',
      fontSize: 13
    }
  }, "No member profits yet."));
  const panRanks = (D.panProfits || []).filter(p => p.profit > 0);
  const topPanProfit = panRanks.length ? panRanks[0].profit : 0;
  const PanLeaderboard = React.createElement(Card, {
    pad: 0
  }, React.createElement("div", {
    style: {
      padding: '16px 18px',
      borderBottom: '1px solid var(--border)'
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800
    }
  }, "PAN leaderboard"), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, "Net profit earned per PAN · across all IPOs")), panRanks.length > 0 ? React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '16px 18px',
      background: 'var(--profit-soft)',
      borderBottom: '1px solid var(--border)'
    }
  }, React.createElement(Avatar, {
    name: panRanks[0].holder,
    hue: panRanks[0].avatarHue,
    size: 44,
    you: panRanks[0].you
  }), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement(Badge, {
    tone: "profit",
    icon: "spark"
  }, "Top earner"), React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      marginTop: 5
    }
  }, panRanks[0].holder, panRanks[0].you && React.createElement("span", {
    style: {
      color: 'var(--brand)',
      fontWeight: 600
    }
  }, " · You")), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)'
    }
  }, panRanks[0].memberName, " · ", panRanks[0].isBacker ? 'Backer' : `${panRanks[0].apps} IPO${panRanks[0].apps === 1 ? '' : 's'}`, panRanks[0].receivedFunding && ' · group-funded')), React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, React.createElement("div", {
    className: "num",
    style: {
      fontSize: 24,
      fontWeight: 800,
      color: 'var(--profit)',
      whiteSpace: 'nowrap'
    }
  }, f(panRanks[0].profit)), React.createElement(SoloDelta, {
    profit: panRanks[0].profit,
    soloProfit: panRanks[0].soloProfit
  }), React.createElement(XirrTag, {
    xirr: panRanks[0].xirr
  }))), limitRows(panRanks, BOARD_LIMIT, showAllPans).map(p => {
    const i = panRanks.indexOf(p);
    return React.createElement("div", {
      key: p.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 18px',
        borderTop: i === 0 ? 'none' : '1px solid var(--border)',
        background: p.you ? 'var(--brand-tint)' : 'transparent'
      }
    }, React.createElement("span", {
      className: "num",
      style: {
        width: 18,
        textAlign: 'right',
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--ink-3)'
      }
    }, i + 1), React.createElement(Avatar, {
      name: p.holder,
      hue: p.avatarHue,
      size: 30,
      you: p.you
    }), React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, p.holder, p.you && React.createElement("span", {
      style: {
        color: 'var(--brand)',
        fontWeight: 600
      }
    }, " · You"), React.createElement("span", {
      style: {
        fontWeight: 600,
        color: 'var(--ink-3)'
      }
    }, " · ", p.memberName)), React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        marginTop: 1
      }
    }, p.isBacker ? 'Backer' : `${p.apps} IPO${p.apps === 1 ? '' : 's'}`, p.receivedFunding && React.createElement("span", {
      style: {
        color: 'var(--brand)',
        fontWeight: 600
      }
    }, " · group-funded")), React.createElement("div", {
      style: {
        marginTop: 5
      }
    }, React.createElement(Meter, {
      value: p.profit,
      max: topPanProfit,
      color: "var(--profit)",
      style: {
        height: 6
      }
    }))), React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, React.createElement("div", {
      className: "num",
      style: {
        fontSize: 14,
        fontWeight: 800,
        whiteSpace: 'nowrap'
      }
    }, f(p.profit, {
      compact: true
    })), React.createElement(SoloDelta, {
      profit: p.profit,
      soloProfit: p.soloProfit
    }), React.createElement(XirrTag, {
      xirr: p.xirr
    })));
  }), React.createElement(ShowAllToggle, {
    total: panRanks.length,
    limit: BOARD_LIMIT,
    expanded: showAllPans,
    onToggle: () => setShowAllPans(e => !e),
    noun: "PANs"
  })) : React.createElement("div", {
    style: {
      padding: '18px',
      textAlign: 'center',
      color: 'var(--ink-3)',
      fontSize: 13
    }
  }, "No PAN profits yet."));
  return React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, layout === 'spotlight' && React.createElement("div", {
    className: "dash-spotlight"
  }, React.createElement(Card, {
    pad: 24,
    style: {
      background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-700) 100%)',
      border: 'none',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden'
    }
  }, React.createElement("div", {
    style: {
      position: 'absolute',
      width: 280,
      height: 280,
      borderRadius: '50%',
      background: 'rgba(255,255,255,.08)',
      top: -120,
      right: -60
    }
  }), React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'rgba(255,255,255,.8)'
    }
  }, "Total pooled profit · this season"), React.createElement("div", {
    className: "num",
    style: {
      fontSize: 44,
      fontWeight: 800,
      letterSpacing: '-.02em',
      margin: '6px 0'
    }
  }, f(D.kpis.profit)), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, D.kpis.roi > 0 && React.createElement(Badge, {
    tone: "neutral",
    icon: "arrowUp"
  }, React.createElement("span", {
    style: {
      color: '#fff'
    }
  }, "+", D.kpis.roi, "% ROI")), D.kpis.xirr != null && React.createElement("span", {
    style: {
      background: 'rgba(255,255,255,.16)',
      borderRadius: 999,
      padding: '3px 11px',
      fontSize: 12,
      fontWeight: 700
    }
  }, xirrLabel(D.kpis.xirr), " XIRR"), React.createElement("span", {
    style: {
      background: 'rgba(255,255,255,.16)',
      borderRadius: 999,
      padding: '3px 11px',
      fontSize: 12,
      fontWeight: 700
    }
  }, D.kpis.allotments, " IPOs allotted"), D.kpis.pendingAmount > 0 && React.createElement("span", {
    style: {
      background: 'rgba(255,255,255,.16)',
      borderRadius: 999,
      padding: '3px 11px',
      fontSize: 12,
      fontWeight: 700
    }
  }, f(D.kpis.pendingAmount, {
    compact: true
  }), " pending")))), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2,1fr)',
      gap: 14
    }
  }, kpiCards.slice(0, 4).map((k, i) => React.createElement(KPICard, {
    key: i,
    ...k
  })))), layout !== 'spotlight' && React.createElement("div", {
    className: "kpi-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: layout === 'compact' ? 'repeat(3,1fr)' : `repeat(${kpiCards.length},1fr)`,
      gap: 12
    }
  }, kpiCards.map((k, i) => React.createElement(KPICard, {
    key: i,
    ...k,
    onClick: k.nav ? () => navigate(k.nav) : undefined
  }))), YouBand, layout === 'compact' ? React.createElement("div", {
    className: "dash-charts-2",
    style: {
      display: 'grid',
      gridTemplateColumns: '1.3fr 1fr',
      gap: 18
    }
  }, ProfitTrend, SmeVsMain, React.createElement("div", {
    style: {
      gridColumn: '1 / -1'
    }
  }, AllotHistory)) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "dash-charts-2",
    style: {
      display: 'grid',
      gridTemplateColumns: '1.5fr 1fr',
      gap: 18
    }
  }, ProfitTrend, SmeVsMain), React.createElement("div", {
    className: "dash-charts-2",
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: 18
    }
  }, AllotHistory)), ByCategory, ProfitByIpo, MemberLeaderboard, PanLeaderboard, RecentTable);
}
Object.assign(window, {
  Dashboard,
  KPICard,
  ChartCard,
  Legend
});