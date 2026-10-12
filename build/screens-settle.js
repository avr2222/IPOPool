// GENERATED from src/screens-settle.jsx by build.js — do not edit.
function UpiPay({
  receiver,
  amount,
  payer,
  note
}) {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const f = n => window.DB ? window.DB.fmtINR(n) : '₹' + n;
  const vpa = receiver && receiver.upiId;
  if (!vpa) {
    return React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: 'var(--warn)',
        fontWeight: 600
      }
    }, "No UPI ID — add in Members");
  }
  const uri = window.buildUpiUri({
    vpa: vpa,
    name: receiver.name,
    amount: amount,
    note: note || 'IPO settlement'
  });
  const copy = () => {
    try {
      navigator.clipboard.writeText(vpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {}
  };
  const waLink = payer && payer.phone ? window.waReminder(payer.phone, `Please pay ${f(amount)} to ${receiver.name} · UPI: ${vpa} (IPO settlement)`) : '';
  const btn = {
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--r-sm)',
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 700,
    background: 'var(--surface)',
    color: 'var(--ink-2)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5
  };
  const payBtn = {
    ...btn,
    border: '1px solid var(--profit)',
    background: 'var(--profit-soft)',
    color: 'var(--profit)'
  };
  return React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: 'flex-end'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      justifyContent: 'flex-end'
    }
  }, React.createElement("a", {
    href: uri,
    style: payBtn
  }, "↗ Pay via UPI"), React.createElement("button", {
    onClick: () => setShowQr(s => !s),
    style: {
      ...btn,
      background: showQr ? 'var(--surface-2)' : 'var(--surface)'
    }
  }, "▤ QR"), React.createElement("button", {
    onClick: copy,
    style: btn
  }, copied ? '✓ Copied' : '⧉ Copy UPI'), waLink && React.createElement("a", {
    href: waLink,
    target: "_blank",
    rel: "noopener noreferrer",
    style: btn
  }, "Remind")), showQr && React.createElement("div", {
    style: {
      background: '#fff',
      padding: 10,
      borderRadius: 10,
      border: '1px solid var(--border)'
    }
  }, React.createElement("div", {
    style: {
      width: 140,
      height: 140
    },
    dangerouslySetInnerHTML: {
      __html: window.qrToSvg ? window.qrToSvg(uri) : ''
    }
  }), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: '#555',
      textAlign: 'center',
      marginTop: 4
    }
  }, f(amount), " → ", receiver.name)));
}
function TransferPlanCard({
  D,
  f,
  transferPlan,
  netPositions,
  title,
  subtitle,
  naiveCount,
  footnote,
  estimate
}) {
  if (!transferPlan.length) return null;
  return React.createElement(Card, {
    pad: 0
  }, React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 10
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, title, estimate && React.createElement(Badge, {
    tone: "warn"
  }, "Estimate · not finalized")), React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, subtitle, " · ", transferPlan.length, " transfer", transferPlan.length !== 1 ? 's' : '', " needed"), estimate && React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--warn)',
      fontWeight: 600,
      marginTop: 4
    }
  }, "Worked out from the current allotments and settings. Amounts can still change — finalize payouts before anyone transfers money.")), naiveCount > 0 && React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)',
      fontWeight: 600
    }
  }, "(without pooling this would be ", naiveCount, " transfers)")), React.createElement("div", {
    style: {
      padding: '8px 18px 18px'
    }
  }, transferPlan.map((t, i) => {
    const payer = D.member(t.from);
    const receiver = D.member(t.to);
    if (!payer || !receiver) return null;
    return React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderBottom: i < transferPlan.length - 1 ? '1px solid var(--border)' : 'none',
        flexWrap: 'wrap'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 130
      }
    }, React.createElement(Avatar, {
      name: payer.name,
      hue: payer.avatarHue,
      size: 36
    }), React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700
      }
    }, payer.name), React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: 'var(--loss)',
        fontWeight: 600
      }
    }, "Pays"))), React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        minWidth: 120
      }
    }, React.createElement("div", {
      className: "num",
      style: {
        fontSize: 18,
        fontWeight: 900,
        color: 'var(--ink)'
      }
    }, f(t.amount)), React.createElement("div", {
      style: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 0
      }
    }, React.createElement("div", {
      style: {
        flex: 1,
        height: 2,
        background: 'var(--border)'
      }
    }), React.createElement("div", {
      style: {
        fontSize: 16,
        color: 'var(--ink-3)',
        lineHeight: 1,
        padding: '0 4px'
      }
    }, "→"), React.createElement("div", {
      style: {
        flex: 1,
        height: 2,
        background: 'var(--brand)',
        opacity: .5
      }
    })), React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        fontWeight: 600
      }
    }, "UPI / bank")), React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 130,
        justifyContent: 'flex-end',
        flexDirection: 'row-reverse'
      }
    }, React.createElement(Avatar, {
      name: receiver.name,
      hue: receiver.avatarHue,
      size: 36
    }), React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700
      }
    }, receiver.name), React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: 'var(--profit)',
        fontWeight: 600
      }
    }, "Receives"))), React.createElement("div", {
      style: {
        flexBasis: '100%',
        display: 'flex',
        justifyContent: 'flex-end'
      }
    }, React.createElement(UpiPay, {
      receiver: receiver,
      payer: payer,
      amount: t.amount
    })));
  })), React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border)',
      padding: '12px 18px'
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: 'var(--ink-3)',
      textTransform: 'uppercase',
      letterSpacing: '.04em',
      marginBottom: 10
    }
  }, "Net positions"), React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, (() => {
    const entries = Object.entries(netPositions).filter(([id]) => D.member(id));
    const maxBar = Math.max(1, ...entries.map(([, net]) => Math.abs(net)));
    return entries.map(([id, net]) => {
      const m = D.member(id);
      const isPayer = net > 0;
      const barPct = Math.abs(net) / maxBar * 100;
      return React.createElement("div", {
        key: id,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }
      }, React.createElement(Avatar, {
        name: m.name,
        hue: m.avatarHue,
        size: 28
      }), React.createElement("div", {
        style: {
          width: 100,
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0
        }
      }, m.name), React.createElement("div", {
        style: {
          flex: 1,
          height: 6,
          background: 'var(--border)',
          borderRadius: 999,
          overflow: 'hidden'
        }
      }, React.createElement("div", {
        style: {
          height: '100%',
          width: barPct + '%',
          background: isPayer ? 'var(--loss)' : 'var(--profit)',
          borderRadius: 999
        }
      })), React.createElement("div", {
        className: "num",
        style: {
          fontSize: 13,
          fontWeight: 800,
          color: isPayer ? 'var(--loss)' : 'var(--profit)',
          width: 90,
          textAlign: 'right'
        }
      }, isPayer ? '−' : '+', f(Math.abs(net))), React.createElement("div", {
        style: {
          fontSize: 11.5,
          color: 'var(--ink-3)',
          width: 50,
          textAlign: 'right',
          fontWeight: 600
        }
      }, isPayer ? 'pays' : 'gets'));
    });
  })()), React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 12,
      color: 'var(--ink-3)'
    }
  }, footnote)));
}
function SettlementLedger({
  navigate,
  id
}) {
  const D = window.DB;
  const f = (n, o) => D.fmtINR(n, o);
  const activeTabPools = D.pools.filter(p => p.status !== 'Settled');
  const settledPools = D.pools.filter(p => p.status === 'Settled');
  const [selIpo, setSelIpo] = useState(id || activeTabPools[0]?.ipo || D.pools[0]?.ipo);
  const [showSettled, setShowSettled] = useState(false);
  const effectiveShow = showSettled || activeTabPools.length === 0;
  const visiblePools = effectiveShow ? [...activeTabPools, ...settledPools] : activeTabPools;
  const pool = D.pools.find(p => p.ipo === selIpo) || D.pools[0] || null;
  const me = D.members.find(m => m.you);
  if (!pool) return React.createElement(Card, {
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
    name: "ledger",
    size: 26,
    color: "var(--ink-3)"
  })), React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 800
    }
  }, "No settlements yet"), React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-3)',
      maxWidth: 360,
      lineHeight: 1.6
    }
  }, "Go to ", React.createElement("strong", null, "Profit Pool"), ", review the calculated splits, then click ", React.createElement("strong", null, "Finalize payouts"), " to generate the settlement ledger."), React.createElement(Button, {
    variant: "primary",
    icon: "pool",
    onClick: () => window.__navigate && window.__navigate('pooling')
  }, "Go to Profit Pool"));
  const ipo = D.ipo(pool.ipo);
  const rates = window.ratesForIpo(selIpo);
  const stcgRate = rates.stcg;
  const brokerageAmt = rates.brok;
  const bonusRate = rates.bonus;
  const ipoAllots = D.allotsOfIpo(selIpo);
  const CAT_ORDER = ['SME', 'Retail', 'sHNI', 'bHNI'];
  const categories = CAT_ORDER.filter(c => ipoAllots.some(a => a.category === c));
  const panToMember = panId => {
    const p = D.pan(panId);
    return p ? p.member : null;
  };
  const catSummaries = categories.map(cat => {
    const ca = ipoAllots.filter(a => a.category === cat);
    const cr = window.ratesForCategory(selIpo, cat);
    const m = window.PoolMath.category(ca, cr.stcg, cr.brok, cr.bonus);
    return {
      cat,
      net: m.net,
      bonusTotal: m.bonusTotal,
      perPan: m.perPan,
      total: m.total
    };
  });
  const totalNet = catSummaries.reduce((s, d) => s + d.net, 0);
  const totalBonus = catSummaries.reduce((s, d) => s + d.bonusTotal, 0);
  const catBonusByMember = {};
  categories.forEach(cat => {
    const ca = ipoAllots.filter(a => a.category === cat);
    const cr = window.ratesForCategory(selIpo, cat);
    catBonusByMember[cat] = window.PoolMath.memberBonuses(ca, cr.stcg, cr.brok, cr.bonus, panToMember);
  });
  const myPanIds = D.pans.filter(p => p.member === me?.id).map(p => p.id);
  const isSME = ipo?.type === 'SME';
  const myCatAmounts = {};
  const livePansByRow = {};
  (() => {
    const pay = window.buildFinalizePayload(selIpo);
    pay.rows.forEach(r => {
      livePansByRow[r.memberId + '|' + r.category] = r.pans;
    });
    pay.rows.filter(r => r.memberId === me?.id).forEach(r => {
      myCatAmounts[r.category] = {
        amount: r.amount,
        pans: r.pans,
        bonus: r.bonusAmount || 0
      };
    });
  })();
  const myShare = Object.keys(myCatAmounts).reduce((s, c) => s + myCatAmounts[c].amount, 0);
  const [rows, setRows] = useState(D.settlements.filter(s => s.ipo === selIpo));
  const ledgerStale = useMemo(() => {
    if (!rows.length) return false;
    const pay = window.buildFinalizePayload(selIpo);
    const expected = {};
    pay.rows.forEach(r => {
      expected[r.memberId + '|' + r.category] = r.amount;
    });
    const seen = new Set();
    for (const r of rows) {
      const k = r.member + '|' + r.category;
      seen.add(k);
      if (expected[k] === undefined || expected[k] !== r.amount) return true;
    }
    return Object.keys(expected).some(k => !seen.has(k));
  }, [rows, ipoAllots, categories, selIpo]);
  const computeNetPositionsForIpo = ipoId => {
    const allots = D.allotsOfIpo(ipoId);
    const settleRows = D.settlements.filter(s => s.ipo === ipoId);
    const cats = CAT_ORDER.filter(c => allots.some(a => a.category === c));
    const memberOwed = {};
    settleRows.forEach(r => {
      memberOwed[r.member] = (memberOwed[r.member] || 0) + r.amount;
    });
    const memberReceived = {};
    allots.forEach(a => {
      if (a.status !== 'allotted') return;
      const panObj = D.pan(a.pan);
      if (panObj) memberReceived[panObj.member] = (memberReceived[panObj.member] || 0) + (a.gain || 0);
    });
    let grossTotal = 0,
      costTotal = 0;
    cats.forEach(cat => {
      const cr = window.ratesForCategory(ipoId, cat);
      const m = window.PoolMath.category(allots.filter(a => a.category === cat), cr.stcg, cr.brok, cr.bonus);
      grossTotal += m.gross;
      costTotal += m.stcgAmt + cr.brok;
    });
    const ids = new Set([...Object.keys(memberOwed), ...Object.keys(memberReceived)]);
    const out = {};
    ids.forEach(id => {
      const received = memberReceived[id] || 0;
      const costShare = grossTotal !== 0 ? costTotal * (received / grossTotal) : 0;
      out[id] = Math.round(received - costShare - (memberOwed[id] || 0));
    });
    return out;
  };
  const netPositions = useMemo(() => computeNetPositionsForIpo(selIpo), [rows, ipoAllots, categories, stcgRate, brokerageAmt, bonusRate, selIpo]);
  const greedyTransferPlan = netPos => {
    const entries = Object.entries(netPos).filter(([, net]) => Math.abs(net) > 5).map(([id, net]) => ({
      id,
      net
    }));
    const payers = entries.filter(n => n.net > 0).map(n => ({
      ...n,
      bal: n.net
    })).sort((a, b) => b.bal - a.bal);
    const receivers = entries.filter(n => n.net < 0).map(n => ({
      ...n,
      bal: -n.net
    })).sort((a, b) => b.bal - a.bal);
    const transfers = [];
    let pi = 0,
      ri = 0;
    while (pi < payers.length && ri < receivers.length) {
      const p = payers[pi],
        r = receivers[ri];
      const amt = Math.min(p.bal, r.bal);
      transfers.push({
        from: p.id,
        to: r.id,
        amount: amt
      });
      p.bal -= amt;
      r.bal -= amt;
      if (p.bal < 5) pi++;
      if (r.bal < 5) ri++;
    }
    return transfers;
  };
  const transferPlan = useMemo(() => greedyTransferPlan(netPositions), [netPositions]);
  const [tab, setTab] = useState('All');
  const [marking, setMarking] = useState(null);
  const pendingRows = rows.filter(r => r.status === 'Pending');
  const paidRows = rows.filter(r => r.status === 'Paid');
  const pendingPayout = pendingRows.reduce((s, r) => s + r.amount, 0);
  const paidPayout = paidRows.reduce((s, r) => s + r.amount, 0);
  const settledCount = paidRows.length;
  const filteredBase = tab === 'All' ? rows : tab === 'Pending' ? pendingRows : paidRows;
  const ledgerCols = [{
    key: 'member',
    label: 'Member',
    align: 'left',
    get: r => (D.member(r.member) || {}).name || ''
  }, {
    key: 'category',
    label: 'Category',
    align: 'left',
    get: r => r.category || ''
  }, {
    key: 'pans',
    label: 'PANs',
    align: 'right',
    get: r => r.pans || 0,
    defDir: 'desc'
  }, {
    key: 'amount',
    label: 'Amount',
    align: 'right',
    get: r => r.amount || 0,
    defDir: 'desc'
  }, {
    key: 'status',
    label: 'Status',
    align: 'right',
    get: r => r.status || ''
  }, {
    key: 'date',
    label: 'Date',
    align: 'right',
    get: r => r.date || '',
    defDir: 'desc'
  }];
  const [ledgerSort, onLedgerSort] = useSortState(null);
  const filtered = sortRows(filteredBase, ledgerSort, ledgerCols);
  const isSettled = pool?.status === 'Settled' || rows.length > 0 && pendingRows.length === 0;
  const lastPaidDate = paidRows.map(r => r.date).filter(Boolean).sort().slice(-1)[0] || null;
  useEffect(() => {
    if (!pool || pool.status === 'Settled' || !D.me?.isAdmin) return;
    if (rows.length === 0 || rows.some(r => r.status !== 'Paid')) return;
    D.mutations.markPoolSettled(pool.ipo).catch(e => console.warn('[IPOPool] auto-settle failed', e));
  }, [pool?.ipo, pool?.status, rows]);
  const [payErr, setPayErr] = useState('');
  const markPaid = async settlementId => {
    setMarking(settlementId);
    setPayErr('');
    try {
      await D.mutations.markSettlementPaid(settlementId);
      const updated = D.settlements.filter(s => s.ipo === selIpo);
      setRows(updated);
      if (updated.length > 0 && updated.every(s => s.status === 'Paid')) {
        await D.mutations.markPoolSettled(selIpo);
      }
    } catch (e) {
      console.error(e);
      setPayErr(e.message || 'Could not mark this payment as paid.');
    }
    setMarking(null);
  };
  const [markingAll, setMarkingAll] = useState(false);
  const markAllPaid = async () => {
    const pending = rows.filter(r => r.status === 'Pending');
    if (!pending.length) return;
    setMarkingAll(true);
    setPayErr('');
    try {
      for (const r of pending) {
        await D.mutations.markSettlementPaid(r.id);
      }
      const updated = D.settlements.filter(s => s.ipo === selIpo);
      setRows(updated);
      if (updated.length > 0 && updated.every(s => s.status === 'Paid')) {
        await D.mutations.markPoolSettled(selIpo);
      }
    } catch (e) {
      console.error(e);
      setPayErr(e.message || 'Could not mark these payments as paid.');
    }
    setMarkingAll(false);
  };
  const exportCSV = () => {
    const esc = v => `"${String(v).replace(/"/g, '""')}"`;
    const header = ['Member', 'Category', 'PANs', 'Amount', 'Status', 'Date'];
    const lines = filtered.map(r => {
      const m = D.member(r.member);
      return [m?.name || r.member, r.category, r.pans, r.amount, r.status, r.date || ''].map(esc).join(',');
    });
    const csv = [header.map(esc).join(','), ...lines].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `settlements-${ipo?.short || selIpo}-${tab}.csv`;
    a.click();
  };
  const [combineMode, setCombineMode] = useState(false);
  const [combineTick, setCombineTick] = useState(0);
  const poolsWithPending = activeTabPools.filter(p => D.settlements.some(s => s.ipo === p.ipo && s.status === 'Pending'));
  const combinedRows = (() => {
    const poolIds = new Set(activeTabPools.map(p => p.ipo));
    return D.settlements.filter(s => poolIds.has(s.ipo));
  })();
  const combinedPendingGroups = (() => {
    const map = {};
    combinedRows.forEach(r => {
      if (r.status !== 'Pending') return;
      if (!map[r.member]) map[r.member] = {
        member: r.member,
        pending: 0,
        ipoAmounts: {}
      };
      map[r.member].pending += r.amount;
      map[r.member].ipoAmounts[r.ipo] = (map[r.member].ipoAmounts[r.ipo] || 0) + r.amount;
    });
    return Object.values(map).sort((a, b) => Math.abs(b.pending) - Math.abs(a.pending));
  })();
  const combinedTotal = combinedRows.reduce((s, r) => s + r.amount, 0);
  const combinedPending = combinedRows.filter(r => r.status === 'Pending').reduce((s, r) => s + r.amount, 0);
  const combinedPaid = combinedRows.filter(r => r.status === 'Paid').reduce((s, r) => s + r.amount, 0);
  const combinedNetPositions = (() => {
    const totals = {};
    activeTabPools.forEach(p => {
      Object.entries(computeNetPositionsForIpo(p.ipo)).forEach(([mid, net]) => {
        totals[mid] = (totals[mid] || 0) + net;
      });
    });
    return totals;
  })();
  const combinedTransferPlan = greedyTransferPlan(combinedNetPositions);
  const settlePoolsIfComplete = async () => {
    for (const p of activeTabPools) {
      const poolRows = D.settlements.filter(s => s.ipo === p.ipo);
      if (poolRows.length > 0 && poolRows.every(s => s.status === 'Paid')) {
        await D.mutations.markPoolSettled(p.ipo);
      }
    }
  };
  const [combineMarking, setCombineMarking] = useState(null);
  const markMemberCombinedPaid = async memberId => {
    setCombineMarking(memberId);
    setPayErr('');
    try {
      const pending = combinedRows.filter(r => r.member === memberId && r.status === 'Pending');
      for (const r of pending) await D.mutations.markSettlementPaid(r.id);
      await settlePoolsIfComplete();
      setCombineTick(t => t + 1);
    } catch (e) {
      console.error(e);
      setPayErr(e.message || 'Could not mark this payment as paid.');
    }
    setCombineMarking(null);
  };
  const markAllCombinedPaid = async () => {
    const pending = combinedRows.filter(r => r.status === 'Pending');
    if (!pending.length) return;
    setCombineMarking('all');
    setPayErr('');
    try {
      for (const r of pending) await D.mutations.markSettlementPaid(r.id);
      await settlePoolsIfComplete();
      setCombineTick(t => t + 1);
    } catch (e) {
      console.error(e);
      setPayErr(e.message || 'Could not mark these payments as paid.');
    }
    setCombineMarking(null);
  };
  const exportCombinedCSV = () => {
    const esc = v => `"${String(v).replace(/"/g, '""')}"`;
    const header = ['Member', 'IPO', 'Category', 'PANs', 'Amount', 'Status', 'Date'];
    const lines = combinedRows.map(r => {
      const m = D.member(r.member);
      const ip = D.ipo(r.ipo);
      return [m?.name || r.member, ip?.short || r.ipo, r.category, r.pans, r.amount, r.status, r.date || ''].map(esc).join(',');
    });
    const csv = [header.map(esc).join(','), ...lines].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `settlements-combined-${window.localDateStr()}.csv`;
    a.click();
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
      gap: 8,
      overflowX: 'auto',
      paddingBottom: 2,
      alignItems: 'center'
    }
  }, poolsWithPending.length > 1 && React.createElement("button", {
    onClick: () => setCombineMode(true),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 14px',
      borderRadius: 'var(--r-md)',
      flexShrink: 0,
      border: '1px solid',
      borderColor: combineMode ? 'var(--brand)' : 'var(--border)',
      background: combineMode ? 'var(--brand-tint)' : 'var(--surface)',
      cursor: 'pointer'
    }
  }, React.createElement(Icon, {
    name: "ledger",
    size: 16,
    color: combineMode ? 'var(--brand)' : 'var(--ink-3)'
  }), React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: combineMode ? 'var(--brand)' : 'var(--ink)'
    }
  }, "Combine pending (", poolsWithPending.length, ")")), D.pools.length > 8 && React.createElement(JumpToIpo, {
    pools: D.pools,
    value: combineMode ? '' : selIpo,
    onChange: ipoId => {
      if (settledPools.some(p => p.ipo === ipoId)) setShowSettled(true);
      setCombineMode(false);
      setSelIpo(ipoId);
      setRows(D.settlements.filter(s => s.ipo === ipoId));
      setTab('All');
    }
  }), stripPools(visiblePools, combineMode ? null : selIpo).map(p => {
    const ip = D.ipo(p.ipo);
    const active = !combineMode && p.ipo === selIpo;
    return React.createElement("button", {
      key: p.ipo,
      onClick: () => {
        setCombineMode(false);
        setSelIpo(p.ipo);
        setRows(D.settlements.filter(s => s.ipo === p.ipo));
        setTab('All');
      },
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
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
      size: 24
    }), React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: active ? 'var(--brand)' : 'var(--ink)'
      }
    }, ip.short), React.createElement(Badge, {
      tone: p.status === 'Settled' ? 'profit' : 'warn',
      style: {
        fontSize: 10.5
      }
    }, p.status));
  }), settledPools.length > 0 && activeTabPools.length > 0 && React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    style: {
      flexShrink: 0
    },
    onClick: () => {
      const next = !showSettled;
      setShowSettled(next);
      if (!next && settledPools.some(p => p.ipo === selIpo)) {
        const a = activeTabPools[0]?.ipo;
        if (a) {
          setSelIpo(a);
          setRows(D.settlements.filter(s => s.ipo === a));
          setTab('All');
        }
      }
    }
  }, effectiveShow ? 'Hide settled' : `Show settled (${settledPools.length})`)), payErr && React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 20px',
      background: 'var(--loss-soft)',
      borderRadius: 'var(--r-lg)',
      border: '1px solid var(--loss)'
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 18,
    color: "var(--loss)"
  }), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--loss)'
    }
  }, payErr), React.createElement("button", {
    onClick: () => setPayErr(''),
    style: {
      border: 'none',
      background: 'none',
      color: 'var(--ink-3)',
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      flexShrink: 0
    }
  }, "Dismiss")), combineMode && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "kpi-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14
    }
  }, React.createElement(Card, {
    pad: 18
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-2)',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 7
    }
  }, React.createElement(Icon, {
    name: "wallet",
    size: 15,
    color: combinedTotal >= 0 ? 'var(--profit)' : 'var(--loss)'
  }), " Total across ", activeTabPools.length, " pools"), React.createElement("div", {
    className: "num",
    style: {
      fontSize: 28,
      fontWeight: 800,
      color: combinedTotal >= 0 ? 'var(--profit)' : 'var(--loss)',
      margin: '8px 0 2px'
    }
  }, f(combinedTotal)), React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)'
    }
  }, combinedRows.length, " settlement rows · ", activeTabPools.map(p => D.ipo(p.ipo).short).join(' · '))), React.createElement(Card, {
    pad: 18
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-2)',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 7
    }
  }, React.createElement(Icon, {
    name: "clock",
    size: 15,
    color: "var(--warn)"
  }), " Still to transfer"), React.createElement("div", {
    className: "num",
    style: {
      fontSize: 28,
      fontWeight: 800,
      color: 'var(--warn)',
      margin: '8px 0 2px'
    }
  }, f(combinedPending)), React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)'
    }
  }, combinedPendingGroups.length, " member", combinedPendingGroups.length !== 1 ? 's' : '', " to pay")), React.createElement(Card, {
    pad: 18
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-2)',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 7
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 15,
    color: "var(--brand)"
  }), " Transferred"), React.createElement("div", {
    className: "num",
    style: {
      fontSize: 28,
      fontWeight: 800,
      margin: '8px 0 2px'
    }
  }, f(combinedPaid)), React.createElement(Meter, {
    value: combinedRows.filter(r => r.status === 'Paid').length,
    max: combinedRows.length,
    color: "var(--brand)",
    style: {
      marginTop: 8
    }
  }))), combinedPendingGroups.length === 0 ? React.createElement(Card, {
    pad: 28,
    style: {
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 26,
    color: "var(--profit)"
  }), React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800
    }
  }, "Nothing pending across these ", activeTabPools.length, " pools"), React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-3)'
    }
  }, "Every member is already settled in each open IPO.")) : React.createElement(Card, {
    pad: 0
  }, React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800
    }
  }, "Combined distribution ledger"), React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, "One pending total per member, summed across every open IPO")), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, React.createElement(Button, {
    variant: "primary",
    size: "sm",
    icon: "check",
    onClick: markAllCombinedPaid,
    style: {
      opacity: combineMarking ? .7 : 1,
      pointerEvents: combineMarking ? 'none' : 'auto'
    }
  }, combineMarking === 'all' ? 'Marking…' : `Mark all paid (${combinedPendingGroups.length})`), React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    icon: "download",
    onClick: exportCombinedCSV
  }, "Export"))), React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: 560
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)',
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, React.createElement("th", {
    style: {
      padding: '11px 18px',
      textAlign: 'left'
    }
  }, "Member"), React.createElement("th", {
    style: {
      padding: '11px 18px',
      textAlign: 'left'
    }
  }, "IPOs"), React.createElement("th", {
    style: {
      padding: '11px 18px',
      textAlign: 'right'
    }
  }, "Amount"), React.createElement("th", {
    style: {
      padding: '11px 18px',
      textAlign: 'right'
    }
  }, "Action"))), React.createElement("tbody", null, combinedPendingGroups.map(g => {
    const m = D.member(g.member);
    if (!m) return null;
    const breakdown = Object.entries(g.ipoAmounts).map(([ipoId, amt]) => `${D.ipo(ipoId).short} ${f(amt, {
      compact: true
    })}`).join(' · ');
    const ipoCount = Object.keys(g.ipoAmounts).length;
    return React.createElement("tr", {
      key: g.member,
      style: {
        borderTop: '1px solid var(--border)'
      }
    }, React.createElement("td", {
      style: {
        padding: '12px 18px'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, React.createElement(Avatar, {
      name: m.name,
      hue: m.avatarHue,
      size: 32
    }), React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 700
      }
    }, m.name), React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: 'var(--ink-3)'
      }
    }, m.email)))), React.createElement("td", {
      style: {
        padding: '12px 18px'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--ink-2)',
        fontWeight: 600
      }
    }, ipoCount, " IPO", ipoCount === 1 ? '' : 's'), React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        marginTop: 2
      }
    }, breakdown)), React.createElement("td", {
      className: "num",
      style: {
        padding: '12px 18px',
        textAlign: 'right',
        fontWeight: 800,
        color: g.pending < 0 ? 'var(--loss)' : 'var(--ink)'
      }
    }, f(g.pending)), React.createElement("td", {
      style: {
        padding: '12px 18px',
        textAlign: 'right'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'flex-end'
      }
    }, g.pending > 0 && React.createElement(UpiPay, {
      receiver: m,
      amount: g.pending,
      note: `IPO settlement · ${ipoCount} pools`
    }), React.createElement("button", {
      onClick: () => markMemberCombinedPaid(g.member),
      disabled: !!combineMarking,
      style: {
        border: '1px solid var(--profit)',
        borderRadius: 'var(--r-sm)',
        padding: '5px 12px',
        background: 'var(--profit-soft)',
        color: 'var(--profit)',
        fontWeight: 700,
        fontSize: 12.5,
        cursor: 'pointer',
        opacity: combineMarking ? .6 : 1
      }
    }, combineMarking === g.member ? '…' : g.pending < 0 ? '✓ Mark settled' : '✓ Mark paid'))));
  }))))), React.createElement(TransferPlanCard, {
    D: D,
    f: f,
    transferPlan: combinedTransferPlan,
    netPositions: combinedNetPositions,
    title: "Minimal transfer plan",
    subtitle: `Fewest transfers to settle all balances across ${activeTabPools.length} pools`,
    naiveCount: combinedRows.filter(r => r.amount !== 0).length,
    footnote: "Net = allotted gain − STCG − charges − pool share, combined across every open IPO (each using its own finalized rates). Positive = owes others; negative = owed by others."
  })), !combineMode && ledgerStale && React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 20px',
      background: 'var(--loss-soft)',
      borderRadius: 'var(--r-lg)',
      border: '1px solid var(--loss)'
    }
  }, React.createElement(Icon, {
    name: "refresh",
    size: 18,
    color: "var(--loss)"
  }), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: 'var(--loss)'
    }
  }, "This ledger is out of date"), React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)'
    }
  }, "Allotments for this IPO changed after payouts were finalized, so the amounts below no longer match the profit pool. Re-finalize on the Profit Pool screen to bring them back in step.")), React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    style: {
      flexShrink: 0
    },
    onClick: () => navigate('pooling', {
      id: selIpo
    })
  }, "Profit Pool")), !combineMode && React.createElement(React.Fragment, null, isSettled && rows.length > 0 && React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 20px',
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
  }, "All payouts settled", lastPaidDate ? ` · ${lastPaidDate}` : ''), React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)'
    }
  }, "Every transfer for this IPO has been marked paid. The ledger is now read-only."))), myShare > 0 && React.createElement("div", {
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
      fontWeight: 700
    }
  }, "Your retained share"), React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)'
    }
  }, Object.keys(myCatAmounts).map(cat => {
    const r = myCatAmounts[cat];
    return `${cat}: ${r.pans} PAN${r.pans > 1 ? 's' : ''} · ${f(r.amount)}`;
  }).join(' · '), bonusRate > 0 && React.createElement("span", {
    style: {
      color: 'var(--warn)',
      fontWeight: 700
    }
  }, " · includes your allotted-PAN bonus"), " — already in your account")), React.createElement("div", {
    className: "num",
    style: {
      fontSize: 28,
      fontWeight: 800,
      color: 'var(--brand)'
    }
  }, f(myShare))), rows.length > 0 && React.createElement("div", {
    className: "kpi-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14
    }
  }, React.createElement(Card, {
    pad: 18
  }, (() => {
    const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
    const tone = totalAmount >= 0 ? 'var(--profit)' : 'var(--loss)';
    return React.createElement(React.Fragment, null, React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--ink-2)',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 7
      }
    }, React.createElement(Icon, {
      name: "wallet",
      size: 15,
      color: tone
    }), " ", totalAmount >= 0 ? 'Total payout to group' : 'Total owed back to pool'), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 28,
        fontWeight: 800,
        color: tone,
        margin: '8px 0 2px'
      }
    }, f(totalAmount)));
  })(), React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)'
    }
  }, rows.length, " recipient", rows.length !== 1 ? 's' : '', " · ", catSummaries.map(d => isSME ? `${d.cat} ${f(d.net, {
    compact: true
  })}` : `${d.cat} ₹${d.perPan.toLocaleString('en-IN')}/PAN`).join(' · '))), React.createElement(Card, {
    pad: 18
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-2)',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 7
    }
  }, React.createElement(Icon, {
    name: "clock",
    size: 15,
    color: "var(--warn)"
  }), " Still to transfer"), React.createElement("div", {
    className: "num",
    style: {
      fontSize: 28,
      fontWeight: 800,
      color: 'var(--warn)',
      margin: '8px 0 2px'
    }
  }, f(pendingPayout)), React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)'
    }
  }, rows.filter(r => r.status === 'Pending').length, " pending transfers")), React.createElement(Card, {
    pad: 18
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-2)',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 7
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 15,
    color: "var(--brand)"
  }), " Transferred"), React.createElement("div", {
    className: "num",
    style: {
      fontSize: 28,
      fontWeight: 800,
      margin: '8px 0 2px'
    }
  }, f(paidPayout)), React.createElement(Meter, {
    value: settledCount,
    max: rows.length,
    color: "var(--brand)",
    style: {
      marginTop: 8
    }
  }))), rows.length === 0 && React.createElement(Card, {
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
      width: 48,
      height: 48,
      borderRadius: 14,
      background: 'var(--surface-2)',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--ink-3)'
    }
  }, React.createElement(Icon, {
    name: "ledger",
    size: 24
  })), React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800
    }
  }, "No payouts generated yet"), React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-3)',
      maxWidth: 340
    }
  }, "Go to the Profit Pool screen, review the calculated splits, then click ", React.createElement("strong", null, "Finalize payouts"), " to generate the settlement ledger."), React.createElement(Button, {
    variant: "primary",
    icon: "pool",
    onClick: () => window.__navigate && window.__navigate('pooling', {
      id: selIpo
    })
  }, "Go to Profit Pool")), rows.length > 0 && React.createElement(Card, {
    pad: 0
  }, React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, "Distribution ledger", isSettled && React.createElement(Badge, {
    tone: "profit"
  }, "🔒 Settled · read-only")), React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, ipo.name, " · ", catSummaries.map(d => `${d.cat}: ${f(d.net, {
    compact: true
  })} net`).join(' · '))), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, React.createElement(Segmented, {
    options: [`All (${rows.length})`, `Pending (${pendingRows.length})`, `Paid (${paidRows.length})`],
    value: tab === 'All' ? `All (${rows.length})` : tab === 'Pending' ? `Pending (${pendingRows.length})` : `Paid (${paidRows.length})`,
    onChange: v => setTab(v.split(' ')[0]),
    size: "sm"
  }), pendingRows.length > 0 && !isSettled && React.createElement(Button, {
    variant: "primary",
    size: "sm",
    icon: "check",
    onClick: markAllPaid,
    style: {
      opacity: markingAll ? .7 : 1,
      pointerEvents: markingAll ? 'none' : 'auto'
    }
  }, markingAll ? 'Marking…' : `Mark all paid (${pendingRows.length})`), React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    icon: "download",
    onClick: exportCSV
  }, "Export"))), React.createElement("div", {
    className: "table-desktop",
    style: {
      overflowX: 'auto'
    }
  }, React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: 560
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)',
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, ledgerCols.map(c => React.createElement(SortTh, {
    key: c.key,
    col: c,
    sort: ledgerSort,
    onSort: onLedgerSort,
    style: {
      padding: '11px 18px'
    }
  })))), React.createElement("tbody", null, filtered.map(r => {
    const m = D.member(r.member);
    if (!m) return null;
    const isPaid = r.status === 'Paid';
    const catMeta = (window.CAT_META || {})[r.category] || {
      label: r.category || '—',
      tone: 'neutral'
    };
    const catPerPan = catSummaries.find(d => d.cat === r.category)?.perPan || 0;
    const bonus = r.bonusAmount || (catBonusByMember[r.category] || {})[r.member] || 0;
    const panCount = livePansByRow[r.member + '|' + r.category] ?? r.pans;
    return React.createElement("tr", {
      key: r.id,
      style: {
        borderTop: '1px solid var(--border)'
      }
    }, React.createElement("td", {
      style: {
        padding: '12px 18px'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, React.createElement(Avatar, {
      name: m.name,
      hue: m.avatarHue,
      size: 32
    }), React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 700
      }
    }, m.name), React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: 'var(--ink-3)'
      }
    }, m.email)))), React.createElement("td", {
      style: {
        padding: '12px 18px'
      }
    }, React.createElement(Badge, {
      tone: catMeta.tone
    }, catMeta.label)), React.createElement("td", {
      style: {
        padding: '12px 18px',
        textAlign: 'right'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 3
      }
    }, Array.from({
      length: panCount
    }).map((_, i) => React.createElement("div", {
      key: i,
      style: {
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: `hsl(${m.avatarHue} 55% 52%)`
      }
    }))), bonus !== 0 ? React.createElement(React.Fragment, null, React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        marginTop: 2,
        textAlign: 'right'
      }
    }, f(r.amount - bonus), " pool share"), React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--warn)',
        marginTop: 1,
        textAlign: 'right',
        fontWeight: 700
      }
    }, "+", f(bonus), " bonus")) : React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        marginTop: 2,
        textAlign: 'right'
      }
    }, !isSME && catPerPan > 0 && Math.abs(panCount * catPerPan - r.amount) <= panCount ? `${panCount} × ${f(catPerPan)}` : `${panCount} PAN${panCount !== 1 ? 's' : ''}`)), React.createElement("td", {
      className: "num",
      style: {
        padding: '12px 18px',
        textAlign: 'right',
        fontWeight: 800,
        color: r.amount < 0 ? 'var(--loss)' : 'var(--ink)'
      }
    }, f(r.amount)), React.createElement("td", {
      style: {
        padding: '12px 18px',
        textAlign: 'right'
      }
    }, isPaid ? React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontWeight: 700,
        fontSize: 13,
        color: 'var(--profit)'
      }
    }, React.createElement(StatusDot, {
      tone: "profit"
    }), " Paid") : isSettled ? React.createElement("span", {
      style: {
        fontSize: 13,
        color: 'var(--ink-3)',
        fontWeight: 600
      }
    }, "Pending") : React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'flex-end'
      }
    }, r.amount > 0 && React.createElement(UpiPay, {
      receiver: m,
      amount: r.amount
    }), React.createElement("button", {
      onClick: () => markPaid(r.id),
      disabled: marking === r.id,
      style: {
        border: '1px solid var(--profit)',
        borderRadius: 'var(--r-sm)',
        padding: '5px 12px',
        background: 'var(--profit-soft)',
        color: 'var(--profit)',
        fontWeight: 700,
        fontSize: 12.5,
        cursor: 'pointer',
        opacity: marking === r.id ? .6 : 1
      }
    }, marking === r.id ? '…' : r.amount < 0 ? '✓ Mark settled' : '✓ Mark paid'))), React.createElement("td", {
      className: "num",
      style: {
        padding: '12px 18px',
        textAlign: 'right',
        color: 'var(--ink-3)',
        fontSize: 13
      }
    }, r.date || '—'));
  }), filtered.length === 0 && React.createElement("tr", null, React.createElement("td", {
    colSpan: 5,
    style: {
      padding: '28px 18px',
      textAlign: 'center',
      color: 'var(--ink-3)',
      fontSize: 13
    }
  }, "No entries for this filter."))))), React.createElement("div", {
    className: "cards-mobile"
  }, filtered.length === 0 && React.createElement("div", {
    style: {
      padding: '28px 18px',
      textAlign: 'center',
      color: 'var(--ink-3)',
      fontSize: 13
    }
  }, "No entries for this filter."), filtered.map(r => {
    const m = D.member(r.member);
    if (!m) return null;
    const isPaid = r.status === 'Paid';
    const catMeta = (window.CAT_META || {})[r.category] || {
      label: r.category || '—',
      tone: 'neutral'
    };
    const catPerPan = catSummaries.find(d => d.cat === r.category)?.perPan || 0;
    const bonus = r.bonusAmount || (catBonusByMember[r.category] || {})[r.member] || 0;
    const panCount = livePansByRow[r.member + '|' + r.category] ?? r.pans;
    return React.createElement("div", {
      key: r.id,
      style: {
        borderTop: '1px solid var(--border)',
        padding: '14px 16px'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        minWidth: 0
      }
    }, React.createElement(Avatar, {
      name: m.name,
      hue: m.avatarHue,
      size: 34
    }), React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, m.name), React.createElement("div", {
      style: {
        marginTop: 3
      }
    }, React.createElement(Badge, {
      tone: catMeta.tone
    }, catMeta.label)))), React.createElement("div", {
      style: {
        textAlign: 'right',
        flexShrink: 0
      }
    }, React.createElement("div", {
      className: "num",
      style: {
        fontSize: 17,
        fontWeight: 800,
        color: r.amount < 0 ? 'var(--loss)' : 'var(--ink)'
      }
    }, f(r.amount)), bonus !== 0 ? React.createElement(React.Fragment, null, React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)'
      }
    }, f(r.amount - bonus), " pool"), React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--warn)',
        fontWeight: 700
      }
    }, "+", f(bonus), " bonus")) : React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)'
      }
    }, !isSME && catPerPan > 0 && Math.abs(panCount * catPerPan - r.amount) <= panCount ? `${panCount} × ${f(catPerPan)}` : `${panCount} PAN${panCount !== 1 ? 's' : ''}`))), React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
        flexWrap: 'wrap'
      }
    }, React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--ink-3)'
      }
    }, r.date || (isPaid ? '' : 'Not paid yet')), React.createElement("div", null, isPaid ? React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontWeight: 700,
        fontSize: 13,
        color: 'var(--profit)'
      }
    }, React.createElement(StatusDot, {
      tone: "profit"
    }), " Paid") : isSettled ? React.createElement("span", {
      style: {
        fontSize: 13,
        color: 'var(--ink-3)',
        fontWeight: 600
      }
    }, "Pending") : React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'flex-end'
      }
    }, r.amount > 0 && React.createElement(UpiPay, {
      receiver: m,
      amount: r.amount
    }), React.createElement("button", {
      onClick: () => markPaid(r.id),
      disabled: marking === r.id,
      style: {
        border: '1px solid var(--profit)',
        borderRadius: 'var(--r-sm)',
        padding: '7px 14px',
        background: 'var(--profit-soft)',
        color: 'var(--profit)',
        fontWeight: 700,
        fontSize: 13,
        cursor: 'pointer',
        opacity: marking === r.id ? .6 : 1
      }
    }, marking === r.id ? '…' : r.amount < 0 ? '✓ Mark settled' : '✓ Mark paid')))));
  }))), React.createElement(TransferPlanCard, {
    D: D,
    f: f,
    transferPlan: transferPlan,
    netPositions: netPositions,
    title: rows.length === 0 ? 'Estimated transfer plan' : 'Minimal transfer plan',
    subtitle: "Fewest transfers to settle all balances",
    estimate: rows.length === 0,
    naiveCount: rows.filter(r => r.amount !== 0).length,
    footnote: `Net = allotted gain − ${stcgRate}% STCG − charges − pool share. Positive = owes others; negative = owed by others.`
  })));
}
Object.assign(window, {
  SettlementLedger
});