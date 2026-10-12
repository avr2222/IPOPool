// GENERATED from src/screens-ipo.jsx by build.js — do not edit.
function Stat({
  label,
  value,
  tone,
  sub
}) {
  const c = {
    profit: 'var(--profit)',
    loss: 'var(--loss)',
    info: 'var(--info)'
  }[tone] || 'var(--ink)';
  return React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)',
      fontWeight: 600
    }
  }, label), React.createElement("div", {
    className: "num",
    style: {
      fontSize: 18,
      fontWeight: 800,
      marginTop: 3,
      color: c
    }
  }, value), sub && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)',
      marginTop: 1
    }
  }, sub));
}
function IpoDetails({
  id,
  navigate
}) {
  const D = window.DB;
  const ipo = D.ipo(id);
  const f = (n, o) => D.fmtINR(n, o);
  const allotsBase = D.allotsOfIpo(id);
  const applicantCols = [{
    key: 'holder',
    label: 'PAN holder',
    align: 'left',
    get: a => {
      const p = D.pans.find(x => x.id === a.pan);
      return p ? p.holder : '';
    }
  }, {
    key: 'category',
    label: 'Category',
    align: 'left',
    get: a => a.category || ''
  }, {
    key: 'status',
    label: 'Status',
    align: 'right',
    get: a => a.status || ''
  }, {
    key: 'shares',
    label: 'Shares',
    align: 'right',
    get: a => a.shares || 0,
    defDir: 'desc'
  }, {
    key: 'invest',
    label: 'Invested',
    align: 'right',
    get: a => a.invest || 0,
    defDir: 'desc'
  }, {
    key: 'gain',
    label: 'Listing gain',
    align: 'right',
    get: a => a.gain || 0,
    defDir: 'desc'
  }];
  const [applicantSort, onApplicantSort] = useSortState(null);
  const allots = sortRows(allotsBase, applicantSort, applicantCols);
  const pool = D.pools.find(p => p.ipo === id);
  const poolNetProfit = window.groupNetProfit(allotsBase);
  const allottedCount = allots.filter(a => a.status === 'allotted').length;
  const exportCSV = () => {
    const esc = v => `"${String(v).replace(/"/g, '""')}"`;
    const header = ['PAN holder', 'PAN', 'Category', 'Status', 'Lots', 'Shares', 'Invested', 'Sell price', 'Gain'];
    const lines = allots.map(a => {
      const p = D.pan(a.pan);
      return [p?.holder || '', p?.pan || '', a.category || '', a.status || '', a.lots || 1, a.shares || 0, a.invest || 0, a.sellPrice ?? '', a.gain || 0].map(esc).join(',');
    });
    const csv = [header.map(esc).join(','), ...lines].join('\n');
    const el = document.createElement('a');
    el.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    el.download = `applicants-${ipo.short || ipo.name}.csv`;
    el.click();
  };
  const timeline = [['Open', ipo.open, true], ['Close', ipo.close, true], ['Allotment', ipo.allotDate, ipo.status === 'Listed' || ipo.status === 'Closed'], ['Listing', ipo.listDate, ipo.status === 'Listed']];
  return React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, React.createElement("button", {
    onClick: () => navigate('dashboard'),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      border: 'none',
      background: 'none',
      color: 'var(--ink-2)',
      fontWeight: 700,
      fontSize: 13.5,
      padding: 0
    }
  }, React.createElement(Icon, {
    name: "chevL",
    size: 16
  }), " Dashboard"), React.createElement(Card, {
    pad: 22
  }, React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 18
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'center'
    }
  }, React.createElement(IpoLogo, {
    ipo: ipo,
    size: 62
  }), React.createElement("div", null, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      flexWrap: 'wrap'
    }
  }, React.createElement("h1", {
    style: {
      fontSize: 23,
      fontWeight: 800,
      margin: 0,
      letterSpacing: '-.02em'
    }
  }, ipo.name), React.createElement(Badge, {
    tone: ipo.type === 'SME' ? 'sme' : 'mainboard'
  }, ipo.type), React.createElement(Badge, {
    tone: ipo.status === 'Listed' ? 'profit' : ipo.status === 'Open' ? 'info' : 'neutral'
  }, ipo.status)), React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-3)',
      marginTop: 5
    }
  }, ipo.sector, " · Price band ", ipo.band, " · ", ipo.lotSize ? `Lot ${ipo.lotSize.toLocaleString('en-IN')} shares` : ''))), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center'
    }
  }, ipo.status === 'Open' && React.createElement(Button, {
    variant: "primary",
    icon: "check",
    onClick: () => navigate('admin')
  }, "Track applicants"), ipo.status === 'Listed' && React.createElement(Button, {
    variant: "primary",
    icon: "trend",
    onClick: () => navigate('pooling', {
      id
    })
  }, "View profit pool"), React.createElement(IconButton, {
    name: "download",
    tip: "Export applicants CSV",
    onClick: exportCSV
  }))), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 0,
      marginTop: 22,
      position: 'relative'
    },
    className: "ipo-timeline"
  }, timeline.map(([label, date, done], i) => React.createElement("div", {
    key: label,
    style: {
      position: 'relative',
      textAlign: i === 0 ? 'left' : 'center',
      paddingTop: 22
    }
  }, i < 3 && React.createElement("div", {
    style: {
      position: 'absolute',
      top: 6,
      left: i === 0 ? 10 : '50%',
      right: i === 2 ? 10 : '-50%',
      height: 2,
      background: done ? 'var(--brand)' : 'var(--border)'
    }
  }), React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: i === 0 ? 4 : '50%',
      transform: i === 0 ? 'none' : 'translateX(-50%)',
      width: 13,
      height: 13,
      borderRadius: 999,
      background: done ? 'var(--brand)' : 'var(--surface)',
      border: `2px solid ${done ? 'var(--brand)' : 'var(--border-strong)'}`
    }
  }), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)',
      fontWeight: 600,
      paddingLeft: i === 0 ? 2 : 0
    }
  }, label), React.createElement("div", {
    className: "num",
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      marginTop: 1
    }
  }, date))))), React.createElement("div", {
    className: "ipo-detail-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 18
    }
  }, React.createElement(Card, {
    pad: 20
  }, React.createElement(SectionTitle, {
    title: "IPO information"
  }), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: '20px 16px'
    }
  }, React.createElement(Stat, {
    label: "Subscription",
    value: ipo.sub ? ipo.sub + 'x' : '—',
    sub: ipo.sub ? 'oversubscribed' : 'not open'
  }), React.createElement(Stat, {
    label: "Lot value",
    value: f(ipo.lotValue, {
      compact: true
    }),
    sub: "per application"
  }), React.createElement(Stat, {
    label: "Listing gain",
    value: ipo.listGain ? `${ipo.listGain}%` : '—',
    tone: ipo.listGain ? 'profit' : undefined,
    sub: ipo.listGain ? 'actual' : 'pending listing'
  }), React.createElement(Stat, {
    label: "Profit / lot",
    value: ipo.listGain ? f(Math.round(ipo.lotValue * ipo.listGain / 100), {
      compact: true
    }) : '—',
    tone: ipo.listGain ? 'profit' : undefined
  }), React.createElement(Stat, {
    label: "Listing price",
    value: ipo.listPrice ? `₹${ipo.listPrice}` : '—',
    tone: ipo.listPrice ? 'profit' : undefined
  })), React.createElement("div", {
    style: {
      marginTop: 20,
      padding: 14,
      background: 'var(--brand-tint)',
      borderRadius: 'var(--r-md)',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 9,
      background: 'var(--brand)',
      color: '#fff',
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "spark",
    size: 18
  })), React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-2)'
    }
  }, "Pool applied with ", React.createElement("strong", {
    style: {
      color: 'var(--ink)'
    }
  }, allots.length, " PANs"), ". ", ipo.listGain ? React.createElement(React.Fragment, null, "Net pooled profit (after STCG & charges) is ", React.createElement("strong", {
    className: "num",
    style: {
      color: 'var(--brand)'
    }
  }, f(poolNetProfit, {
    compact: true
  })), ".") : 'Allotment results will be visible after listing.'))), React.createElement(Card, {
    pad: 20
  }, React.createElement(SectionTitle, {
    title: "Applications summary"
  }), React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, [['PANs applied', allots.length, 'neutral'], ['Allotted', allottedCount, 'profit'], ['Not allotted', allots.length - allottedCount, 'loss']].map(([l, v, t]) => React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-2)',
      fontWeight: 600
    }
  }, l), React.createElement("span", {
    className: "num",
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: t === 'profit' ? 'var(--profit)' : t === 'loss' ? 'var(--loss)' : 'var(--ink)'
    }
  }, v))), React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--border)'
    }
  }), React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-2)',
      fontWeight: 600
    }
  }, "Total invested"), React.createElement("span", {
    className: "num",
    style: {
      fontSize: 17,
      fontWeight: 800
    }
  }, f(allots.reduce((s, a) => s + (a.invest || 0), 0), {
    compact: true
  }))), pool && React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-2)',
      fontWeight: 600
    }
  }, "Net pooled profit"), React.createElement("span", {
    className: "num",
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: 'var(--profit)'
    }
  }, f(poolNetProfit, {
    compact: true
  })))))), React.createElement(Card, {
    pad: 0
  }, React.createElement("div", {
    style: {
      padding: '16px 20px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800
    }
  }, "Applied PAN accounts & allotment results"), pool && React.createElement(Button, {
    variant: "soft",
    size: "sm",
    icon: "pool",
    onClick: () => navigate('pooling', {
      id
    })
  }, "Profit pooling")), React.createElement("div", {
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
  }, applicantCols.map(c => React.createElement(SortTh, {
    key: c.key,
    col: c,
    sort: applicantSort,
    onSort: onApplicantSort,
    style: {
      padding: '11px 20px'
    }
  })))), React.createElement("tbody", null, allots.map((a, i) => {
    const pan = D.pans.find(p => p.id === a.pan);
    const mem = pan ? D.member(pan.member) : null;
    const catMeta = (window.CAT_META || {})[a.category] || {
      label: a.category || '—',
      tone: 'neutral'
    };
    return React.createElement("tr", {
      key: i,
      style: {
        borderTop: '1px solid var(--border)'
      }
    }, React.createElement("td", {
      style: {
        padding: '13px 20px'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, React.createElement(Avatar, {
      name: pan?.holder || '?',
      hue: mem?.avatarHue ?? i * 47 % 360,
      size: 32
    }), React.createElement("div", null, React.createElement("div", {
      style: {
        fontWeight: 700,
        fontSize: 13.5
      }
    }, pan?.holder || '—'), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 11.5,
        color: 'var(--ink-3)'
      }
    }, pan?.pan || '')))), React.createElement("td", {
      style: {
        padding: '13px 20px'
      }
    }, React.createElement(Badge, {
      tone: catMeta.tone
    }, catMeta.label)), React.createElement("td", {
      style: {
        padding: '13px 20px',
        textAlign: 'right'
      }
    }, React.createElement(Badge, {
      tone: a.status === 'allotted' ? 'profit' : 'loss',
      icon: a.status === 'allotted' ? 'check' : 'x'
    }, a.status === 'allotted' ? 'Allotted' : 'Not allotted')), React.createElement("td", {
      className: "num",
      style: {
        padding: '13px 20px',
        textAlign: 'right',
        color: 'var(--ink-2)'
      }
    }, a.shares || '—'), React.createElement("td", {
      className: "num",
      style: {
        padding: '13px 20px',
        textAlign: 'right',
        color: 'var(--ink-2)'
      }
    }, a.invest ? f(a.invest) : '—'), React.createElement("td", {
      className: "num",
      style: {
        padding: '13px 20px',
        textAlign: 'right',
        fontWeight: 700,
        color: a.gain ? 'var(--profit)' : 'var(--ink-3)'
      }
    }, a.gain ? '+' + f(a.gain) : '—'));
  }))))));
}
Object.assign(window, {
  IpoDetails
});