// GENERATED from src/screens-manage.jsx by build.js — do not edit.
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
function panError(pan) {
  const v = (pan || '').toUpperCase().trim();
  if (!v) return 'PAN is required.';
  if (!PAN_RE.test(v)) return 'Enter a valid PAN (5 letters, 4 digits, 1 letter — e.g. ABCDE1234F).';
  return null;
}
function duplicatePanHolder(pan, excludeId) {
  const v = (pan || '').toUpperCase().trim();
  const hit = (window.DB.pans || []).find(p => (p.pan || '').toUpperCase() === v && p.id !== excludeId);
  return hit ? hit.holder || 'another member' : null;
}
function friendlyDbError(e) {
  const m = e && e.message || String(e);
  if (/duplicate key|already exists|unique constraint/i.test(m)) {
    if (/pan/i.test(m)) return 'This PAN is already registered in the pool.';
    if (/email/i.test(m)) return 'That email is already used by another member.';
    return 'That entry already exists.';
  }
  return m;
}
function LotSplitToggle({
  value,
  onChange
}) {
  return React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '12px 14px',
      background: 'var(--surface-2)',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)'
    }
  }, React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700
    }
  }, "SME lot-based pooling"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)',
      marginTop: 2,
      lineHeight: 1.5
    }
  }, value ? 'Participating — shares SME profit by lots applied with the pool.' : 'Opted out — always takes the plain equal share of its own category.')), React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": value,
    onClick: () => onChange(!value),
    style: {
      flexShrink: 0,
      width: 44,
      height: 26,
      borderRadius: 999,
      border: 'none',
      cursor: 'pointer',
      position: 'relative',
      background: value ? 'var(--brand)' : 'var(--border-strong)',
      transition: 'background .15s',
      marginTop: 2
    }
  }, React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: value ? 21 : 3,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: '#fff',
      transition: 'left .15s',
      boxShadow: '0 1px 3px rgba(0,0,0,.25)'
    }
  })));
}
function SmeLotCaps({
  retail,
  shni,
  onRetail,
  onShni
}) {
  return React.createElement("div", {
    style: {
      padding: '12px 14px',
      background: 'var(--surface-2)',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700
    }
  }, "SME split lot levels"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)',
      lineHeight: 1.5,
      marginTop: -4
    }
  }, "Lots each category's applicants commit. Retail profit splits per head, sHNI caps bHNI down to the sHNI level, bHNI is never capped. Leave blank to auto-detect from applications."), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, React.createElement(Field, {
    label: "Retail lots"
  }, React.createElement("input", {
    style: inputSt,
    type: "number",
    min: "1",
    value: retail,
    onChange: e => onRetail(e.target.value),
    placeholder: "auto"
  })), React.createElement(Field, {
    label: "sHNI lots"
  }, React.createElement("input", {
    style: inputSt,
    type: "number",
    min: "1",
    value: shni,
    onChange: e => onShni(e.target.value),
    placeholder: "auto"
  }))));
}
function FundingGroupModal({
  appId,
  holderPanId,
  ipoId,
  holderName,
  category,
  onClose,
  onDone
}) {
  const D = window.DB;
  const f = n => D.fmtINR(n);
  const existing = D.fundingFor(appId);
  const [mode, setMode] = useState(existing.mode === 'pans' ? 'equal' : existing.mode || 'off');
  const seedRows = () => {
    const rows = existing.contributors.map(c => {
      let panId = c.pan;
      if (!panId && c.member) {
        const sp = (D.pans || []).find(p => p.member === c.member);
        panId = sp ? sp.id : null;
      }
      return {
        panId,
        amount: c.amount != null ? String(c.amount) : ''
      };
    }).filter(r => r.panId);
    if (!rows.some(r => r.panId === holderPanId)) rows.unshift({
      panId: holderPanId,
      amount: ''
    });
    return rows;
  };
  const [rows, setRows] = useState(seedRows());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const MODE_LABEL = {
    off: 'Off',
    equal: 'Equal',
    amount: 'By ₹',
    percent: 'By %'
  };
  const LABEL_MODE = {
    'Off': 'off',
    'Equal': 'equal',
    'By ₹': 'amount',
    'By %': 'percent'
  };
  const proportional = mode === 'amount' || mode === 'percent';
  const panShare = (() => {
    try {
      const r = (window.buildFinalizePayload(ipoId).panRows || []).find(x => x.panId === holderPanId);
      return r ? r.poolShare : null;
    } catch (e) {
      return null;
    }
  })();
  const panInfo = pid => {
    const p = D.pan(pid);
    const m = p ? D.member(p.member) : null;
    return {
      holder: p?.holder || '—',
      owner: m?.name || '',
      hue: m?.avatarHue || 200,
      ownerId: p?.member
    };
  };
  const used = new Set(rows.map(r => r.panId));
  const available = (D.pans || []).filter(p => !used.has(p.id));
  const addPan = pid => {
    if (pid) setRows(rs => [...rs, {
      panId: pid,
      amount: ''
    }]);
  };
  const removePan = pid => setRows(rs => rs.filter(r => r.panId !== pid));
  const setAmount = (pid, v) => setRows(rs => rs.map(r => r.panId === pid ? {
    ...r,
    amount: v
  } : r));
  const weightTotal = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const pctOff = mode === 'percent' && Math.round(weightTotal) !== 100;
  const save = async () => {
    if (pctOff) {
      setErr(`Percentages must total 100% (currently ${Math.round(weightTotal)}%).`);
      return;
    }
    setSaving(true);
    setErr('');
    try {
      if (mode === 'off') await D.mutations.setFunding(appId, null, []);else await D.mutations.setFunding(appId, mode, rows.map(r => ({
        panId: r.panId,
        memberId: panInfo(r.panId).ownerId,
        amount: proportional ? r.amount : null
      })));
      onDone();
    } catch (e) {
      setErr(friendlyDbError(e));
      setSaving(false);
    }
  };
  return React.createElement(Modal, {
    title: `Funding group — ${holderName}`,
    onClose: onClose
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-3)',
      lineHeight: 1.5
    }
  }, "Split this PAN's ", React.createElement("strong", null, "pool share"), panShare != null && panShare !== 0 ? React.createElement(React.Fragment, null, " (", React.createElement("strong", {
    style: {
      color: 'var(--brand)'
    }
  }, f(panShare)), ")") : null, " among the PANs that funded it. Each funder's slice is paid to the member who owns that PAN; the holder keeps the allotted-PAN bonus."), React.createElement(Segmented, {
    options: ['Off', 'Equal', 'By ₹', 'By %'],
    value: MODE_LABEL[mode],
    onChange: v => setMode(LABEL_MODE[v]),
    size: "sm"
  }), mode !== 'off' && React.createElement("div", {
    style: {
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden'
    }
  }, rows.map((r, i) => {
    const info = panInfo(r.panId);
    const isHolder = r.panId === holderPanId;
    const w = parseFloat(r.amount) || 0;
    return React.createElement("div", {
      key: r.panId,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderTop: i === 0 ? 'none' : '1px solid var(--border)'
      }
    }, React.createElement(Avatar, {
      name: info.holder,
      hue: info.hue,
      size: 28
    }), React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, info.holder, isHolder && React.createElement("span", {
      style: {
        color: 'var(--brand)',
        fontWeight: 600
      }
    }, " · this PAN")), React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)'
      }
    }, "paid to ", info.owner, proportional && weightTotal > 0 && w > 0 ? ` · ${Math.round(w / weightTotal * 100)}% of pool` : '')), proportional && React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 4
      }
    }, React.createElement("input", {
      type: "number",
      min: "0",
      step: "any",
      value: r.amount,
      onChange: e => setAmount(r.panId, e.target.value),
      placeholder: mode === 'amount' ? '₹ in' : '%',
      style: {
        ...inputSt,
        width: 78,
        padding: '6px 8px',
        fontSize: 13,
        textAlign: 'right'
      }
    }), React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: 'var(--ink-3)',
        width: 12
      }
    }, mode === 'percent' ? '%' : '₹')), !isHolder ? React.createElement(IconButton, {
      name: "x",
      size: 26,
      tip: "Remove",
      onClick: () => removePan(r.panId)
    }) : React.createElement("div", {
      style: {
        width: 26
      }
    }));
  }), available.length > 0 && React.createElement("div", {
    style: {
      padding: '8px 12px',
      borderTop: '1px solid var(--border)',
      background: 'var(--surface-2)'
    }
  }, React.createElement("select", {
    value: "",
    onChange: e => {
      addPan(e.target.value);
      e.target.value = '';
    },
    style: {
      ...inputSt,
      padding: '7px 8px',
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer'
    }
  }, React.createElement("option", {
    value: ""
  }, "+ Add a funding PAN…"), available.map(p => {
    const m = D.member(p.member);
    return React.createElement("option", {
      key: p.id,
      value: p.id
    }, p.holder, m && m.name !== p.holder ? ` — ${m.name}` : '');
  })))), mode === 'equal' && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)'
    }
  }, "Split equally per PAN. Add a member's PANs more than once to weight them by PAN count."), proportional && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: pctOff ? 'var(--loss)' : 'var(--ink-3)',
      fontWeight: pctOff ? 700 : 400
    }
  }, mode === 'amount' && 'Amounts are the capital each PAN put in. 0 (or blank) gets no slice.', mode === 'percent' && `Percentages must total 100% — currently ${Math.round(weightTotal)}%.`), err && React.createElement("div", {
    style: {
      color: 'var(--loss)',
      fontSize: 13,
      fontWeight: 600
    }
  }, err), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end'
    }
  }, React.createElement(Button, {
    variant: "ghost",
    onClick: onClose
  }, "Cancel"), React.createElement(Button, {
    variant: "primary",
    onClick: save,
    style: {
      opacity: saving || pctOff ? .55 : 1,
      pointerEvents: saving || pctOff ? 'none' : 'auto'
    }
  }, saving ? 'Saving…' : mode === 'off' ? 'Turn off pooling' : 'Save funding group')));
}
function Modal({
  title,
  onClose,
  children
}) {
  return React.createElement("div", {
    className: "modal-overlay",
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,.45)',
      zIndex: 65,
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
      maxWidth: 460,
      maxHeight: 'calc(100dvh - 32px)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--sh-pop)',
      overflow: 'hidden',
      animation: 'popIn .22s cubic-bezier(.2,.7,.3,1)'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 22px',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800
    }
  }, title), React.createElement(IconButton, {
    name: "x",
    size: 32,
    onClick: onClose
  })), React.createElement("div", {
    style: {
      padding: '20px 22px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      overflowY: 'auto',
      minHeight: 0
    }
  }, children)));
}
function Field({
  label,
  children
}) {
  return React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, React.createElement("label", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: 'var(--ink-2)'
    }
  }, label), children);
}
const inputSt = {
  fontSize: 14,
  fontWeight: 600,
  padding: '10px 12px',
  width: '100%',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--r-md)',
  background: 'var(--bg)',
  color: 'var(--ink)',
  outline: 'none'
};
function withAutoDates(form, closeDate) {
  const t = closeDate && window.ipoTimeline ? window.ipoTimeline(closeDate) : null;
  if (!t) return {
    ...form,
    closeDate
  };
  return {
    ...form,
    closeDate,
    openDate: t.open,
    allotDate: t.allot,
    listDate: t.list
  };
}
function AutoDateNote({
  closeDate
}) {
  const t = closeDate && window.ipoTimeline ? window.ipoTimeline(closeDate) : null;
  return React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)',
      lineHeight: 1.5,
      marginTop: -4
    }
  }, "Enter the close date — open, allotment and listing fill in automatically (T+3, skipping Saturdays, Sundays and fixed-date holidays like 26 Jan, 15 Aug, 2 Oct). Festival holidays aren't included, so adjust those weeks by hand.", t?.closeWarning && React.createElement("div", {
    style: {
      color: 'var(--warn)',
      fontWeight: 700,
      marginTop: 3
    }
  }, "⚠ ", t.closeWarning, " — check the close date."));
}
function LotsInput({
  value,
  onChange,
  cat,
  ipo,
  disabled,
  compact
}) {
  const warn = !disabled && window.lotsWarning ? window.lotsWarning(cat, value, ipo) : null;
  const lotSize = Number(ipo?.lotSize) || 0;
  const n = parseInt(value, 10) || 0;
  return React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: compact ? 'flex-end' : 'flex-start',
      gap: 2
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, React.createElement("input", {
    type: "number",
    min: "1",
    value: value,
    disabled: disabled,
    "aria-label": "Lots applied",
    onChange: e => onChange(e.target.value),
    style: {
      width: 52,
      padding: '5px 6px',
      fontSize: 12.5,
      fontWeight: 700,
      textAlign: 'right',
      border: '1px solid ' + (warn ? 'var(--warn)' : 'var(--border)'),
      borderRadius: 'var(--r-sm)',
      background: 'var(--bg)',
      color: 'var(--ink)',
      opacity: disabled ? .35 : 1
    }
  }), React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--ink-3)',
      fontWeight: 600,
      opacity: disabled ? .35 : 1
    }
  }, "lot", n === 1 ? '' : 's')), !disabled && lotSize > 0 && n > 0 && React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: 'var(--ink-3)'
    }
  }, (n * lotSize).toLocaleString('en-IN'), " sh"), warn && React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: 'var(--warn)',
      fontWeight: 700,
      whiteSpace: 'nowrap'
    }
  }, warn));
}
function ConfirmDialog({
  dlg,
  onClose
}) {
  if (!dlg) return null;
  const btnSt = dlg.danger ? {
    background: 'var(--loss)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--r-md)',
    padding: '10px 18px',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer'
  } : {};
  return React.createElement("div", {
    className: "modal-overlay",
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,.5)',
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
      maxWidth: 380,
      boxShadow: 'var(--sh-pop)',
      overflow: 'hidden',
      animation: 'popIn .22s cubic-bezier(.2,.7,.3,1)'
    }
  }, React.createElement("div", {
    style: {
      padding: '18px 22px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, dlg.danger && React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      background: 'rgba(239,68,68,.12)',
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 16,
    color: "var(--loss)"
  })), React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800
    }
  }, dlg.title)), React.createElement("div", {
    style: {
      padding: '0 22px 20px',
      fontSize: 13.5,
      color: 'var(--ink-2)',
      lineHeight: 1.55
    }
  }, dlg.message), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end',
      padding: '14px 22px',
      borderTop: '1px solid var(--border)',
      background: 'var(--surface-2)'
    }
  }, React.createElement(Button, {
    variant: "ghost",
    onClick: onClose
  }, "Cancel"), dlg.danger ? React.createElement("button", {
    style: btnSt,
    onClick: () => {
      dlg.onConfirm();
      onClose();
    }
  }, dlg.confirmLabel || 'Delete') : React.createElement(Button, {
    variant: "primary",
    onClick: () => {
      dlg.onConfirm();
      onClose();
    }
  }, dlg.confirmLabel || 'Confirm'))));
}
function fmtXirrPct(rate) {
  if (rate == null || !isFinite(rate)) return '—';
  const pct = rate * 100;
  const r = Math.abs(pct) >= 1000 ? Math.round(pct) : +pct.toFixed(1);
  return (r > 0 ? '+' : '') + r + '%';
}
function PortfolioStat({
  label,
  value,
  color,
  sub
}) {
  return React.createElement("div", {
    style: {
      minWidth: 92
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
      whiteSpace: 'nowrap',
      marginTop: 2
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
function VsSolo({
  delta,
  f
}) {
  if (delta == null || delta === 0) return null;
  const up = delta > 0;
  return React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: up ? 'var(--profit)' : 'var(--loss)',
      whiteSpace: 'nowrap'
    }
  }, up ? '▲' : '▼', " ", f(Math.abs(delta), {
    compact: true
  }), " vs solo");
}
function PanManagement() {
  const D = window.DB;
  const f = (n, o) => D.fmtINR(n, o);
  const me = D.members.find(m => m.you);
  if (!me) return React.createElement(Card, {
    pad: 32,
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
    name: "pan",
    size: 24
  })), React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800
    }
  }, "No personal portfolio"), React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-3)',
      maxWidth: 340,
      lineHeight: 1.6
    }
  }, "You're signed in without a linked member profile, so there are no PANs or earnings to show here."));
  const pans = D.pans.filter(p => p.member === me.id);
  const myProfile = (D.memberProfits || []).find(m => m.you) || {
    profit: 0,
    soloProfit: null,
    xirr: null,
    iposApplied: 0
  };
  const myRank = (D.memberProfits || []).findIndex(m => m.you) + 1;
  const totalMembers = (D.memberProfits || []).length;
  const panProfitById = {};
  (D.panProfits || []).forEach(p => {
    panProfitById[p.id] = p;
  });
  const soloDelta = myProfile.soloProfit != null ? Math.round(myProfile.profit - myProfile.soloProfit) : null;
  const mySettles = (D.settlements || []).filter(s => s.member === me.id);
  const pendingSettles = mySettles.filter(s => s.status === 'Pending');
  const paidSettles = mySettles.filter(s => s.status === 'Paid');
  const pendingAmt = pendingSettles.reduce((s, r) => s + (r.amount || 0), 0);
  const paidAmt = paidSettles.reduce((s, r) => s + (r.amount || 0), 0);
  const earnings = D.memberIpoEarnings(me.id);
  const totalApplied = earnings.reduce((s, e) => s + e.applied, 0);
  const totalAllotted = earnings.reduce((s, e) => s + e.allotted, 0);
  const totalGross = earnings.reduce((s, e) => s + e.gross, 0);
  const hitRate = totalApplied > 0 ? Math.round(totalAllotted / totalApplied * 100) : 0;
  const relColors = {
    Self: 'brand',
    Spouse: 'info',
    Father: 'mainboard',
    Mother: 'sme',
    Son: 'profit',
    Daughter: 'profit',
    Brother: 'warn',
    Sister: 'warn',
    Friend: 'neutral'
  };
  const exportStatement = () => {
    const esc = v => `"${String(v).replace(/"/g, '""')}"`;
    const header = ['IPO', 'Board', 'Applied', 'Allotted', 'Gross gain', 'Your net share'];
    const lines = earnings.map(e => [e.name, e.type, e.applied, e.allotted, e.gross, e.net].map(esc).join(','));
    const totalRow = ['TOTAL', '', totalApplied, totalAllotted, totalGross, myProfile.profit].map(esc).join(',');
    const csv = [header.map(esc).join(','), ...lines, totalRow].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `my-ipo-statement-${(me.name || 'member').replace(/\s+/g, '-')}.csv`;
    a.click();
  };
  return React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, React.createElement(Card, {
    pad: 0,
    style: {
      overflow: 'hidden',
      borderColor: 'var(--brand)'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '16px 20px',
      background: 'var(--brand-tint)',
      flexWrap: 'wrap'
    }
  }, React.createElement(Avatar, {
    name: me.name || 'You',
    hue: me.avatarHue || 152,
    size: 48,
    you: true
  }), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 150
    }
  }, React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 800
    }
  }, me.name), React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)'
    }
  }, me.email || '—', " · ", pans.length, " PAN", pans.length !== 1 ? 's' : ''))), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 26,
      flexWrap: 'wrap',
      rowGap: 14,
      padding: '16px 20px'
    }
  }, React.createElement(PortfolioStat, {
    label: "Net profit",
    value: f(myProfile.profit, {
      compact: true
    }),
    color: myProfile.profit >= 0 ? 'var(--profit)' : 'var(--loss)',
    sub: soloDelta ? (soloDelta > 0 ? '+' : '−') + f(Math.abs(soloDelta), {
      compact: true
    }) + ' vs solo' : null
  }), React.createElement(PortfolioStat, {
    label: "Your rank",
    value: myRank > 0 ? '#' + myRank : '—',
    sub: 'of ' + totalMembers + ' members'
  }), React.createElement(PortfolioStat, {
    label: "Pending",
    value: f(pendingAmt, {
      compact: true
    }),
    color: pendingAmt > 0 ? 'var(--warn)' : 'var(--ink-3)',
    sub: pendingAmt > 0 ? 'to receive' : 'all settled'
  }), React.createElement(PortfolioStat, {
    label: "XIRR",
    value: fmtXirrPct(myProfile.xirr),
    color: myProfile.xirr == null ? 'var(--ink-3)' : myProfile.xirr >= 0 ? 'var(--profit)' : 'var(--loss)',
    sub: "annualised"
  }), React.createElement(PortfolioStat, {
    label: "Applications",
    value: totalApplied,
    sub: myProfile.iposApplied + ' IPO' + (myProfile.iposApplied === 1 ? '' : 's')
  }), React.createElement(PortfolioStat, {
    label: "Hit rate",
    value: hitRate + '%',
    sub: totalAllotted + ' allotted'
  }))), React.createElement("div", null, React.createElement(SectionTitle, {
    title: "My PANs",
    sub: `${pans.length} account${pans.length !== 1 ? 's' : ''} · profit shown is this PAN's share across all IPOs`
  }), React.createElement("div", {
    className: "pan-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))',
      gap: 14,
      marginTop: 12
    }
  }, pans.map((p, i) => {
    const pp = panProfitById[p.id] || {
      profit: 0,
      soloProfit: null,
      apps: 0
    };
    const allots = D.allotsOfPan(p.id);
    const applied = allots.length;
    const allotted = allots.filter(a => a.status === 'allotted').length;
    const pDelta = pp.soloProfit != null ? Math.round(pp.profit - pp.soloProfit) : null;
    return React.createElement(Card, {
      key: p.id,
      pad: 0,
      style: {
        overflow: 'hidden'
      }
    }, React.createElement("div", {
      style: {
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        alignItems: 'center'
      }
    }, React.createElement(Avatar, {
      name: p.holder,
      hue: (me.avatarHue + i * 40) % 360,
      size: 40
    }), React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 700
      }
    }, p.holder), React.createElement("div", {
      style: {
        display: 'flex',
        gap: 5,
        alignItems: 'center',
        flexWrap: 'wrap'
      }
    }, React.createElement(Badge, {
      tone: relColors[p.relation] || 'neutral'
    }, p.relation || 'Self'), p.lotOptOut && React.createElement(Badge, {
      tone: "warn"
    }, "Equal split (SME)"), pp.receivedFunding && React.createElement(Badge, {
      tone: "info"
    }, "Group-funded"), pp.isBacker && React.createElement(Badge, {
      tone: "info"
    }, "Backer")))), React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12,
        fontWeight: 700,
        color: p.status === 'Active' ? 'var(--profit)' : 'var(--warn)'
      }
    }, React.createElement(StatusDot, {
      tone: p.status === 'Active' ? 'profit' : 'warn'
    }), " ", p.status)), React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 12px',
        background: 'var(--surface-2)',
        borderRadius: 'var(--r-sm)'
      }
    }, React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        fontWeight: 600
      }
    }, "PAN NUMBER"), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 13.5,
        fontWeight: 700,
        letterSpacing: '.04em',
        marginTop: 2
      }
    }, p.pan)), React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        fontWeight: 600
      }
    }, "BANK"), React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        marginTop: 2
      }
    }, p.linkedBank || '—')))), React.createElement("div", {
      style: {
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '11px 16px',
        gap: 10,
        flexWrap: 'wrap'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column'
      }
    }, React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        fontWeight: 600
      }
    }, allotted, "/", applied, " allotted · ", applied, " application", applied !== 1 ? 's' : ''), React.createElement(VsSolo, {
      delta: pDelta,
      f: f
    })), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 16,
        fontWeight: 800,
        color: pp.profit > 0 ? 'var(--profit)' : 'var(--ink-3)',
        whiteSpace: 'nowrap'
      }
    }, pp.profit > 0 ? f(pp.profit, {
      compact: true
    }) : '—')));
  }), pans.length === 0 && React.createElement(Card, {
    pad: 24,
    style: {
      textAlign: 'center',
      color: 'var(--ink-3)',
      fontSize: 13
    }
  }, "No PANs linked to your profile yet. Ask your pool admin to add one."))), mySettles.length > 0 && React.createElement(Card, {
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
  }, "My payouts"), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, "Your settlement share per IPO")), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16
    }
  }, React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--ink-3)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, "To receive"), React.createElement("div", {
    className: "num",
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: pendingAmt > 0 ? 'var(--warn)' : 'var(--ink-3)'
    }
  }, f(pendingAmt, {
    compact: true
  }))), React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--ink-3)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, "Received"), React.createElement("div", {
    className: "num",
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: 'var(--profit)'
    }
  }, f(paidAmt, {
    compact: true
  }))))), React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: 460
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)',
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, ['IPO', 'Category', 'Amount', 'Status', 'Date'].map((h, i) => React.createElement("th", {
    key: h,
    style: {
      textAlign: i >= 2 ? 'right' : 'left',
      fontWeight: 700,
      padding: '10px 18px'
    }
  }, h)))), React.createElement("tbody", null, mySettles.map(s => {
    const ip = D.ipo(s.ipo);
    return React.createElement("tr", {
      key: s.id,
      style: {
        borderTop: '1px solid var(--border)'
      }
    }, React.createElement("td", {
      style: {
        padding: '11px 18px',
        fontWeight: 700,
        fontSize: 13.5
      }
    }, ip?.short || '—'), React.createElement("td", {
      style: {
        padding: '11px 18px'
      }
    }, React.createElement(Badge, {
      tone: "neutral"
    }, s.category)), React.createElement("td", {
      className: "num",
      style: {
        padding: '11px 18px',
        textAlign: 'right',
        fontWeight: 800
      }
    }, f(s.amount)), React.createElement("td", {
      style: {
        padding: '11px 18px',
        textAlign: 'right'
      }
    }, React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12.5,
        fontWeight: 700,
        color: s.status === 'Paid' ? 'var(--profit)' : 'var(--warn)'
      }
    }, React.createElement(StatusDot, {
      tone: s.status === 'Paid' ? 'profit' : 'warn'
    }), " ", s.status === 'Paid' ? 'Received' : 'Pending')), React.createElement("td", {
      className: "num",
      style: {
        padding: '11px 18px',
        textAlign: 'right',
        color: 'var(--ink-3)',
        fontSize: 13
      }
    }, s.date || '—'));
  }))))), earnings.length > 0 && React.createElement(Card, {
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
  }, "My IPO earnings"), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, "Your net share per IPO · across all your PANs")), React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    icon: "download",
    onClick: exportStatement
  }, "Download statement")), React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: 540
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)',
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, [['IPO', 'left'], ['Board', 'left'], ['Applied', 'right'], ['Allotted', 'right'], ['Gross', 'right'], ['Your net', 'right']].map(([h, al]) => React.createElement("th", {
    key: h,
    style: {
      textAlign: al,
      fontWeight: 700,
      padding: '10px 18px'
    }
  }, h)))), React.createElement("tbody", null, earnings.map(e => React.createElement(React.Fragment, {
    key: e.ipo
  }, React.createElement("tr", {
    style: {
      borderTop: '1px solid var(--border)'
    }
  }, React.createElement("td", {
    style: {
      padding: e.backed && e.backed.length ? '11px 18px 2px' : '11px 18px',
      fontWeight: 700,
      fontSize: 13.5
    }
  }, e.short), React.createElement("td", {
    style: {
      padding: '11px 18px'
    }
  }, React.createElement(Badge, {
    tone: e.type === 'SME' ? 'sme' : 'mainboard'
  }, e.type)), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      color: 'var(--ink-2)'
    }
  }, e.applied), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      color: 'var(--ink-2)'
    }
  }, e.allotted), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      color: 'var(--ink-2)'
    }
  }, e.gross > 0 ? f(e.gross, {
    compact: true
  }) : '—'), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      fontWeight: 800,
      color: e.net > 0 ? 'var(--profit)' : 'var(--ink-3)'
    }
  }, e.net > 0 ? f(e.net, {
    compact: true
  }) : '—')), e.backed && e.backed.length > 0 && React.createElement("tr", null, React.createElement("td", {
    colSpan: 6,
    style: {
      padding: '0 18px 10px',
      fontSize: 11.5,
      color: 'var(--ink-3)'
    }
  }, React.createElement("span", {
    style: {
      color: 'var(--brand)',
      fontWeight: 700
    }
  }, "↳ Backed"), ' ', e.backed.map((b, i) => React.createElement("span", {
    key: i
  }, i > 0 ? ' · ' : ' ', b.holder, " (", b.category, ") ", React.createElement("span", {
    style: {
      color: 'var(--profit)',
      fontWeight: 700
    }
  }, "+", f(b.amount, {
    compact: true
  })))))))), React.createElement("tr", {
    style: {
      borderTop: '2px solid var(--border-strong)',
      background: 'var(--surface-2)'
    }
  }, React.createElement("td", {
    style: {
      padding: '11px 18px',
      fontWeight: 800
    }
  }, "Total"), React.createElement("td", null), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      fontWeight: 800
    }
  }, totalApplied), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      fontWeight: 800
    }
  }, totalAllotted), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      fontWeight: 800
    }
  }, totalGross > 0 ? f(totalGross, {
    compact: true
  }) : '—'), React.createElement("td", {
    className: "num",
    style: {
      padding: '11px 18px',
      textAlign: 'right',
      fontWeight: 800,
      color: 'var(--profit)'
    }
  }, f(myProfile.profit, {
    compact: true
  }))))))));
}
function AdminPanel() {
  const D = window.DB;
  const f = (n, o) => D.fmtINR(n, o);
  const [tab, setTab] = useState('IPO Master');
  const tabs = ['IPO Master', 'Members'];
  const [ipos, setIpos] = useState(D.ipos);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingId, setRefreshingId] = useState(null);
  const [notice, setNotice] = useState(null);
  const showError = msg => setNotice(msg || 'Something went wrong.');
  const refreshData = async ipoId => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshingId(ipoId || 'all');
    try {
      await window.loadDB();
      setIpos([...window.DB.ipos]);
      setMembers([...window.DB.members]);
    } catch (e) {
      showError(friendlyDbError(e));
    }
    setRefreshing(false);
    setRefreshingId(null);
  };
  const [addIpoStep, setAddIpoStep] = useState(null);
  const [newIpoId, setNewIpoId] = useState(null);
  const [ipoForm, setIpoForm] = useState({
    name: '',
    shortName: '',
    type: 'SME',
    price: '',
    lotSize: '',
    retailLots: '',
    shniLots: '',
    openDate: '',
    closeDate: '',
    allotDate: '',
    listDate: ''
  });
  const [editIpoId, setEditIpoId] = useState(null);
  const [editIpoForm, setEditIpoForm] = useState({
    name: '',
    shortName: '',
    type: 'SME',
    price: '',
    lotSize: '',
    retailLots: '',
    shniLots: '',
    openDate: '',
    closeDate: '',
    allotDate: '',
    listDate: ''
  });
  const [editIpoSaving, setEditIpoSaving] = useState(false);
  const [editIpoErr, setEditIpoErr] = useState('');
  const [copiedIpo, setCopiedIpo] = useState(null);
  const [ipoSaving, setIpoSaving] = useState(false);
  const [ipoErr, setIpoErr] = useState('');
  const [applicantSel, setApplicantSel] = useState({});
  const [appSaving, setAppSaving] = useState(false);
  const [appErr, setAppErr] = useState('');
  const closeAddIpo = () => {
    setAddIpoStep(null);
    setNewIpoId(null);
    setApplicantSel({});
    setIpoErr('');
    setAppErr('');
    setIpoForm({
      name: '',
      shortName: '',
      type: 'SME',
      price: '',
      lotSize: '',
      retailLots: '',
      shniLots: '',
      openDate: '',
      closeDate: '',
      allotDate: '',
      listDate: ''
    });
  };
  const saveIpo = async () => {
    if (!ipoForm.name || !ipoForm.type) {
      setIpoErr('Name and type are required.');
      return;
    }
    setIpoSaving(true);
    setIpoErr('');
    try {
      const saved = await D.mutations.addIpo({
        name: ipoForm.name,
        shortName: ipoForm.shortName,
        type: ipoForm.type,
        bandHigh: parseFloat(ipoForm.price) || null,
        lotSize: parseInt(ipoForm.lotSize) || null,
        retailLots: parseInt(ipoForm.retailLots) || null,
        shniLots: parseInt(ipoForm.shniLots) || null,
        openDate: ipoForm.openDate || null,
        closeDate: ipoForm.closeDate || null,
        allotDate: ipoForm.allotDate || null,
        listDate: ipoForm.listDate || null
      });
      setIpos([...window.DB.ipos]);
      setNewIpoId(saved.id);
      const defaults = {};
      const lots0 = window.defaultLotsFor('Retail', saved);
      window.DB.pans.forEach(p => {
        defaults[p.id] = {
          selected: false,
          category: 'Retail',
          lots: lots0
        };
      });
      setApplicantSel(defaults);
      setAddIpoStep('applicants');
    } catch (e) {
      setIpoErr(e.message);
    }
    setIpoSaving(false);
  };
  const saveApplications = async () => {
    const rows = Object.entries(applicantSel).filter(([, v]) => v.selected).map(([panId, v]) => ({
      panId,
      category: v.category,
      lots: Math.max(1, parseInt(v.lots, 10) || 1)
    }));
    if (rows.length === 0) {
      closeAddIpo();
      return;
    }
    setAppSaving(true);
    setAppErr('');
    try {
      await D.mutations.addApplications(newIpoId, rows);
      closeAddIpo();
    } catch (e) {
      setAppErr(e.message);
    }
    setAppSaving(false);
  };
  const togglePan = panId => setApplicantSel(prev => ({
    ...prev,
    [panId]: {
      ...prev[panId],
      selected: !prev[panId]?.selected
    }
  }));
  const setCat = (panId, cat) => setApplicantSel(prev => ({
    ...prev,
    [panId]: {
      ...prev[panId],
      category: cat,
      lots: window.defaultLotsFor(cat, D.ipo(newIpoId))
    }
  }));
  const setLots = (panId, lots) => setApplicantSel(prev => ({
    ...prev,
    [panId]: {
      ...prev[panId],
      lots
    }
  }));
  const selectAll = () => setApplicantSel(prev => {
    const n = {
      ...prev
    };
    Object.keys(n).forEach(id => {
      n[id] = {
        ...n[id],
        selected: true
      };
    });
    return n;
  });
  const deselectAll = () => setApplicantSel(prev => {
    const n = {
      ...prev
    };
    Object.keys(n).forEach(id => {
      n[id] = {
        ...n[id],
        selected: false
      };
    });
    return n;
  });
  const deleteIpo = (id, name) => askConfirm(`Delete "${name}"?`, 'All applications and allotments for this IPO will also be permanently deleted.', async () => {
    try {
      await D.mutations.deleteIpo(id);
      setIpos([...window.DB.ipos]);
    } catch (e) {
      showError(e.message);
    }
  });
  const copyApplyLink = async ip => {
    const msg = window.buildApplyMessage ? window.buildApplyMessage(ip) : window.applyLinkFor(ip.id);
    try {
      await navigator.clipboard.writeText(msg);
    } catch (e) {
      window.prompt('Copy this apply message:', msg);
    }
    setCopiedIpo(ip.id);
    setTimeout(() => setCopiedIpo(c => c === ip.id ? null : c), 1600);
  };
  const openEditIpo = ip => {
    setEditIpoId(ip.id);
    setEditIpoForm({
      name: ip.name,
      shortName: ip.short || '',
      type: ip.type,
      price: ip.bandHigh || '',
      lotSize: ip.lotSize || '',
      retailLots: ip.retailLots || '',
      shniLots: ip.shniLots || '',
      openDate: (ip.open || '').slice(0, 10),
      closeDate: (ip.close || '').slice(0, 10),
      allotDate: (ip.allotDate || '').slice(0, 10),
      listDate: (ip.listDate || '').slice(0, 10)
    });
    setEditIpoErr('');
  };
  const saveEditIpo = async () => {
    if (!editIpoForm.name) {
      setEditIpoErr('Name is required.');
      return;
    }
    setEditIpoSaving(true);
    setEditIpoErr('');
    try {
      await D.mutations.updateIpo(editIpoId, {
        name: editIpoForm.name,
        shortName: editIpoForm.shortName,
        type: editIpoForm.type,
        bandHigh: parseFloat(editIpoForm.price) || null,
        lotSize: parseInt(editIpoForm.lotSize) || null,
        retailLots: parseInt(editIpoForm.retailLots) || null,
        shniLots: parseInt(editIpoForm.shniLots) || null,
        openDate: editIpoForm.openDate,
        closeDate: editIpoForm.closeDate,
        allotDate: editIpoForm.allotDate,
        listDate: editIpoForm.listDate
      });
      setIpos([...window.DB.ipos]);
      setEditIpoId(null);
    } catch (e) {
      setEditIpoErr(e.message);
    }
    setEditIpoSaving(false);
  };
  const openAddApplicants = ipoId => {
    const alreadyApplied = new Set(D.allotsOfIpo(ipoId).map(a => a.pan));
    const defaults = {};
    const lots0 = window.defaultLotsFor('Retail', D.ipo(ipoId));
    D.pans.filter(p => !alreadyApplied.has(p.id)).forEach(p => {
      defaults[p.id] = {
        selected: false,
        category: 'Retail',
        lots: lots0
      };
    });
    setAddAppSel(defaults);
    setAddAppIpoId(ipoId);
    setAddAppErr('');
  };
  const saveAddApplicants = async () => {
    const rows = Object.entries(addAppSel).filter(([, v]) => v.selected).map(([panId, v]) => ({
      panId,
      category: v.category,
      lots: Math.max(1, parseInt(v.lots, 10) || 1)
    }));
    if (rows.length === 0) {
      setAddAppIpoId(null);
      return;
    }
    setAddAppSaving(true);
    setAddAppErr('');
    try {
      await D.mutations.addApplications(addAppIpoId, rows);
      setAddAppIpoId(null);
    } catch (e) {
      setAddAppErr(e.message);
    }
    setAddAppSaving(false);
  };
  const [changes, setChanges] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [allotQuery, setAllotQuery] = useState('');
  const [allotSort, setAllotSort] = useState('name');
  const [allotFilter, setAllotFilter] = useState('all');
  const setChange = (id, field, val) => setChanges(prev => ({
    ...prev,
    [id]: {
      ...(prev[id] || {}),
      [field]: val
    }
  }));
  const saveChanges = async viewRows => {
    setSaving(true);
    setSaved(false);
    try {
      const dirty = viewRows.map(a => {
        const c = changes[a.id] || {};
        const status = c.status ?? a.status;
        const rawSp = c.sellPrice ?? (a.sellPrice != null ? String(a.sellPrice) : '');
        const sp = parseFloat(rawSp) || 0;
        const bandHigh = window.DB.ipo(a.ipo)?.bandHigh || 0;
        const allotted = status === 'allotted';
        const sh = allotted ? parseInt(c.shares ?? a.shares) || 0 : 0;
        const computedGain = sp > 0 && bandHigh > 0 ? window.rowGain(status, sp, bandHigh, sh) : allotted ? parseFloat(c.gain ?? a.gain) || 0 : 0;
        return {
          id: a.id,
          appId: a.appId,
          lots: Math.max(1, parseInt(c.lots ?? a.lots, 10) || 1),
          category: c.category ?? a.category,
          status: status,
          shares: sh,
          gain: computedGain,
          sellPrice: allotted && sp > 0 ? sp : null
        };
      }).filter((r, i) => {
        const a = viewRows[i];
        return r.lots !== (a.lots || 1) || r.category !== a.category || r.status !== a.status || r.shares !== a.shares || r.gain !== a.gain || r.sellPrice !== a.sellPrice;
      });
      if (dirty.length === 0) {
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        return;
      }
      await D.mutations.saveAllotmentChanges(dirty);
      setChanges({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      showError(e.message);
    }
    setSaving(false);
  };
  const [confirmDlg, setConfirmDlg] = useState(null);
  const askConfirm = (title, message, onConfirm, danger = true, confirmLabel) => setConfirmDlg({
    title,
    message,
    onConfirm,
    danger,
    confirmLabel
  });
  const [viewIpoId, setViewIpoId] = useState(null);
  const [fundingApp, setFundingApp] = useState(null);
  const [viewListPrice, setViewListPrice] = useState('');
  const [addAppIpoId, setAddAppIpoId] = useState(null);
  const [addAppSel, setAddAppSel] = useState({});
  const [addAppSaving, setAddAppSaving] = useState(false);
  const [addAppErr, setAddAppErr] = useState('');
  const [members, setMembers] = useState(D.members);
  const [profileMember, setProfileMember] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    upi: '',
    pan: '',
    bank: ''
  });
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberErr, setMemberErr] = useState('');
  const [showAddPan, setShowAddPan] = useState(null);
  const [panForm, setPanForm] = useState({
    pan: '',
    holderName: '',
    relation: 'Self',
    bank: ''
  });
  const [panSaving, setPanSaving] = useState(false);
  const [panErr, setPanErr] = useState('');
  const saveMember = async () => {
    if (!memberForm.name) {
      setMemberErr('Name is required.');
      return;
    }
    if (memberForm.pan) {
      const pe = panError(memberForm.pan);
      if (pe) {
        setMemberErr(pe);
        return;
      }
      const dup = duplicatePanHolder(memberForm.pan);
      if (dup) {
        setMemberErr(`This PAN is already registered to ${dup}.`);
        return;
      }
    }
    setMemberSaving(true);
    setMemberErr('');
    try {
      const added = await D.mutations.addMember({
        ...memberForm,
        upiId: memberForm.upi,
        avatarHue: Math.floor(Math.random() * 360)
      });
      if (memberForm.pan) {
        try {
          await D.mutations.addPan({
            memberId: added.id,
            pan: memberForm.pan,
            holderName: memberForm.name,
            relation: 'Self',
            bank: memberForm.bank || null
          });
        } catch (panErr) {
          try {
            await D.mutations.deleteMember(added.id);
          } catch (_) {}
          throw panErr;
        }
      }
      setMembers([...window.DB.members]);
      setShowAddMember(false);
      setMemberForm({
        name: '',
        email: '',
        phone: '',
        upi: '',
        pan: '',
        bank: ''
      });
    } catch (e) {
      setMemberErr(friendlyDbError(e));
    }
    setMemberSaving(false);
  };
  const savePan = async () => {
    if (!panForm.holderName) {
      setPanErr('Holder name is required.');
      return;
    }
    const pe = panError(panForm.pan);
    if (pe) {
      setPanErr(pe);
      return;
    }
    const dup = duplicatePanHolder(panForm.pan);
    if (dup) {
      setPanErr(`This PAN is already registered to ${dup}.`);
      return;
    }
    setPanSaving(true);
    setPanErr('');
    try {
      await D.mutations.addPan({
        memberId: showAddPan,
        ...panForm
      });
      setMembers([...window.DB.members]);
      setShowAddPan(null);
      setPanForm({
        pan: '',
        holderName: '',
        relation: 'Self',
        bank: ''
      });
    } catch (e) {
      setPanErr(friendlyDbError(e));
    }
    setPanSaving(false);
  };
  const deleteMember = (id, name) => {
    const memberPans = D.pans.filter(p => p.member === id);
    const panIds = memberPans.map(p => p.id);
    const allotCount = panIds.reduce((n, id) => n + D.allotsOfPan(id).length, 0);
    const memberSetts = D.settlements.filter(s => s.member === id);
    const paidCount = memberSetts.filter(s => s.status === 'Paid').length;
    const parts = [`${memberPans.length} PAN account${memberPans.length !== 1 ? 's' : ''}`];
    if (allotCount) parts.push(`${allotCount} application/allotment record${allotCount !== 1 ? 's' : ''}`);
    if (memberSetts.length) parts.push(`${memberSetts.length} settlement record${memberSetts.length !== 1 ? 's' : ''}${paidCount ? ` (including ${paidCount} already marked Paid)` : ''}`);
    askConfirm(`Remove "${name}"?`, `This permanently deletes their ${parts.join(', ')}. Their allotted gains will no longer count toward any pool, so every other member's profit split for those IPOs will be recalculated. This cannot be undone.`, async () => {
      try {
        await D.mutations.deleteMember(id);
        setMembers([...window.DB.members]);
      } catch (e) {
        showError(friendlyDbError(e));
      }
    });
  };
  const [editMember, setEditMember] = useState(null);
  const [editMemberForm, setEditMemberForm] = useState({});
  const [editMemberSaving, setEditMemberSaving] = useState(false);
  const [editMemberErr, setEditMemberErr] = useState('');
  const openEditMember = m => {
    setEditMember(m);
    setEditMemberForm({
      name: m.name,
      email: m.email || '',
      phone: m.phone || '',
      upiId: m.upiId || ''
    });
    setEditMemberErr('');
  };
  const saveEditMember = async () => {
    if (!editMemberForm.name) {
      setEditMemberErr('Name is required.');
      return;
    }
    setEditMemberSaving(true);
    setEditMemberErr('');
    try {
      await D.mutations.updateMember(editMember.id, editMemberForm);
      setMembers([...window.DB.members]);
      setEditMember(null);
    } catch (e) {
      setEditMemberErr(e.message);
    }
    setEditMemberSaving(false);
  };
  const [editPan, setEditPan] = useState(null);
  const [editPanForm, setEditPanForm] = useState({});
  const [editPanSaving, setEditPanSaving] = useState(false);
  const [editPanErr, setEditPanErr] = useState('');
  const openEditPan = p => {
    setEditPan(p);
    setEditPanForm({
      holderName: p.holder,
      relation: p.relation || 'Self',
      bank: p.linkedBank || '',
      status: p.status || 'Active',
      lotOptOut: !!p.lotOptOut
    });
    setEditPanErr('');
  };
  const saveEditPan = async () => {
    if (!editPanForm.holderName) {
      setEditPanErr('Holder name is required.');
      return;
    }
    setEditPanSaving(true);
    setEditPanErr('');
    try {
      await D.mutations.updatePan(editPan.id, editPanForm);
      setMembers([...window.DB.members]);
      setEditPan(null);
    } catch (e) {
      setEditPanErr(e.message);
    }
    setEditPanSaving(false);
  };
  const ipoRows = ipos.map(ip => {
    const rows = D.allotsOfIpo(ip.id);
    return {
      ...ip,
      applied: rows.length,
      allotted: rows.filter(a => a.status === 'allotted').length,
      pending: rows.filter(a => a.status === 'pending').length
    };
  });
  const awaitingResults = ip => ip.pending > 0 && ip.status !== 'Open' && ip.status !== 'Upcoming';
  const awaitingCount = ipoRows.filter(awaitingResults).length;
  const [ipoQuery, setIpoQuery] = useState('');
  const [ipoFilter, setIpoFilter] = useState('all');
  const IPO_FILTERS = [['all', 'All'], ['awaiting', 'Awaiting results'], ['open', 'Open / upcoming'], ['listed', 'Listed']];
  const IPO_FILTER_FN = {
    all: () => true,
    awaiting: awaitingResults,
    open: ip => ip.status === 'Open' || ip.status === 'Upcoming',
    listed: ip => ip.status === 'Listed'
  };
  const ipoFilterCount = key => ipoRows.filter(IPO_FILTER_FN[key]).length;
  const q = ipoQuery.trim().toLowerCase();
  const filteredIpoRows = ipoRows.filter(ip => IPO_FILTER_FN[ipoFilter](ip) && (!q || String(ip.name).toLowerCase().includes(q) || String(ip.short || '').toLowerCase().includes(q)));
  const showAwaiting = () => {
    setTab('IPO Master');
    setIpoFilter('awaiting');
    setIpoQuery('');
    setIpoPage(0);
  };
  const ipoSortKey = ip => ip.createdAt || ip.listDate || ip.allotDate || ip.close || ip.open || '';
  const recentFirst = [...filteredIpoRows].sort((a, b) => {
    const d = String(ipoSortKey(b)).localeCompare(String(ipoSortKey(a)));
    return d !== 0 ? d : String(a.name).localeCompare(String(b.name));
  });
  const ipoCols = [{
    key: 'name',
    label: 'IPO',
    align: 'left'
  }, {
    key: 'type',
    label: 'Board',
    align: 'left'
  }, {
    key: 'bandHigh',
    label: 'Price',
    align: 'right',
    get: r => r.bandHigh || 0,
    defDir: 'desc'
  }, {
    key: 'lotSize',
    label: 'Lot size',
    align: 'right',
    get: r => r.lotSize || 0,
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
  }];
  const [ipoSort, onIpoSortRaw] = useSortState(null);
  const sortedIpos = ipoSort.key ? sortRows(filteredIpoRows, ipoSort, ipoCols) : recentFirst;
  const IPO_PAGE = 20;
  const [ipoPage, setIpoPage] = useState(0);
  const onIpoSort = (...args) => {
    setIpoPage(0);
    onIpoSortRaw(...args);
  };
  const ipoPages = Math.max(1, Math.ceil(sortedIpos.length / IPO_PAGE));
  const curIpoPage = Math.min(ipoPage, ipoPages - 1);
  const pagedIpos = sortedIpos.slice(curIpoPage * IPO_PAGE, (curIpoPage + 1) * IPO_PAGE);
  const IpoSubline = ({
    ip
  }) => React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)',
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      marginTop: 1,
      flexWrap: 'wrap'
    }
  }, ip.short !== ip.name && React.createElement("span", null, ip.short), ip.status && React.createElement(StatusDot, {
    tone: ip.status === 'Listed' ? 'profit' : ip.status === 'Open' ? 'info' : 'neutral'
  }), ip.status && React.createElement("span", null, ip.status), awaitingResults(ip) && React.createElement("span", {
    style: {
      color: 'var(--warn)',
      fontWeight: 700,
      whiteSpace: 'nowrap'
    }
  }, "· ", ip.pending, " awaiting result", ip.pending !== 1 ? 's' : ''));
  const IpoActions = ({
    ip,
    wide
  }) => React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: wide ? 'stretch' : 'flex-end',
      gap: 6,
      flexWrap: 'nowrap'
    }
  }, React.createElement(Button, {
    variant: "soft",
    size: "sm",
    icon: "allot",
    style: wide ? {
      flex: 1,
      justifyContent: 'center'
    } : undefined,
    onClick: () => {
      setViewIpoId(ip.id);
      setChanges({});
      setSaved(false);
    }
  }, "Allotments"), React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    icon: copiedIpo === ip.id ? 'check' : 'external',
    onClick: () => copyApplyLink(ip),
    style: wide ? {
      flex: 1,
      justifyContent: 'center'
    } : undefined
  }, copiedIpo === ip.id ? 'Copied!' : 'Apply link'), React.createElement(IconButton, {
    name: "refresh",
    size: 34,
    tip: "Refresh applied / allotted counts",
    spin: refreshingId === ip.id,
    disabled: refreshing,
    onClick: () => refreshData(ip.id)
  }), React.createElement(IconButton, {
    name: "edit",
    size: 34,
    tip: "Edit or delete IPO",
    onClick: () => openEditIpo(ip)
  }));
  return React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, React.createElement("div", {
    className: "kpi-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 14
    }
  }, [['IPOs tracked', ipos.length, 'calendar', 'neutral'], ['Members', members.length, 'groups', 'info'], ['Total PANs', D.pans.length, 'pan', 'brand'], ['Awaiting results', awaitingCount, 'clock', awaitingCount > 0 ? 'warn' : 'neutral', awaitingCount > 0 ? showAwaiting : undefined]].map(([l, v, ic, tone, onClick]) => React.createElement(KPICard, {
    key: l,
    icon: ic,
    label: onClick ? l + ' ›' : l,
    value: v,
    tone: tone,
    onClick: onClick
  }))), React.createElement(Card, {
    pad: 0
  }, React.createElement("div", {
    style: {
      padding: '12px 18px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      gap: 4,
      overflowX: 'auto'
    }
  }, tabs.map(t => React.createElement("button", {
    key: t,
    onClick: () => setTab(t),
    style: {
      border: 'none',
      background: tab === t ? 'var(--brand-tint)' : 'transparent',
      color: tab === t ? 'var(--brand)' : 'var(--ink-2)',
      fontWeight: 700,
      fontSize: 13,
      padding: '8px 14px',
      borderRadius: 'var(--r-md)',
      whiteSpace: 'nowrap',
      cursor: 'pointer'
    }
  }, t))), tab === 'IPO Master' && React.createElement("div", null, React.createElement("div", {
    style: {
      padding: '14px 18px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid var(--border)'
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-3)'
    }
  }, ipos.length, " IPO", ipos.length !== 1 ? 's' : '', " in master list"), React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, React.createElement(Button, {
    variant: "soft",
    size: "sm",
    icon: "refresh",
    disabled: refreshing,
    onClick: () => refreshData()
  }, refreshing ? 'Refreshing…' : 'Refresh'), React.createElement(Button, {
    variant: "primary",
    size: "sm",
    icon: "plus",
    onClick: () => setAddIpoStep('details')
  }, "New IPO"))), (() => {
    const CAT_TONE = {
      Retail: 'neutral',
      sHNI: 'info',
      bHNI: 'warn',
      SME: 'sme'
    };
    const cs = D.categoryStats || [];
    const byCat = {};
    cs.forEach(c => {
      byCat[c.cat] = c.applied;
    });
    const cats = ['Retail', 'sHNI', 'bHNI', 'SME'].filter(c => byCat[c]);
    const total = cs.reduce((s, c) => s + c.applied, 0);
    if (total === 0) return null;
    return React.createElement("div", {
      style: {
        padding: '11px 18px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface-2)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap'
      }
    }, React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--ink-3)',
        textTransform: 'uppercase',
        letterSpacing: '.04em'
      }
    }, "Applications by category"), cats.map(c => React.createElement("span", {
      key: c,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6
      }
    }, React.createElement(Badge, {
      tone: CAT_TONE[c]
    }, c), React.createElement("span", {
      className: "num",
      style: {
        fontSize: 14,
        fontWeight: 800
      }
    }, byCat[c]))), React.createElement("span", {
      style: {
        marginLeft: 'auto',
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--ink-2)'
      }
    }, "Total ", React.createElement("span", {
      className: "num",
      style: {
        fontSize: 15,
        fontWeight: 800,
        color: 'var(--ink)'
      }
    }, total), " applications"));
  })(), ipos.length > 0 && React.createElement("div", {
    style: {
      padding: '10px 18px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, React.createElement("input", {
    value: ipoQuery,
    onChange: e => {
      setIpoQuery(e.target.value);
      setIpoPage(0);
    },
    placeholder: "Search IPOs…",
    "aria-label": "Search IPOs",
    style: {
      ...inputSt,
      flex: '1 1 180px',
      maxWidth: 280,
      padding: '7px 11px',
      fontSize: 13
    }
  }), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 5,
      flexWrap: 'wrap'
    }
  }, IPO_FILTERS.map(([key, label]) => {
    const n = ipoFilterCount(key);
    const on = ipoFilter === key;
    return React.createElement("button", {
      key: key,
      onClick: () => {
        setIpoFilter(key);
        setIpoPage(0);
      },
      style: {
        border: '1px solid ' + (on ? 'var(--brand)' : 'var(--border)'),
        borderRadius: 999,
        background: on ? 'var(--brand-tint)' : 'var(--surface)',
        color: on ? 'var(--brand)' : 'var(--ink-2)',
        fontSize: 12,
        fontWeight: 700,
        padding: '5px 11px',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }
    }, label, key !== 'all' && React.createElement("span", {
      style: {
        opacity: .7,
        marginLeft: 4
      }
    }, n));
  }))), ipos.length === 0 ? React.createElement("div", {
    style: {
      padding: '32px 18px',
      textAlign: 'center',
      color: 'var(--ink-3)',
      fontSize: 13
    }
  }, "No IPOs yet. Add one above.") : sortedIpos.length === 0 ? React.createElement("div", {
    style: {
      padding: '28px 18px',
      textAlign: 'center',
      color: 'var(--ink-3)',
      fontSize: 13
    }
  }, "No IPOs match", ipoQuery ? React.createElement(React.Fragment, null, " “", React.createElement("strong", null, ipoQuery), "”") : '', ".", ' ', React.createElement("button", {
    onClick: () => {
      setIpoQuery('');
      setIpoFilter('all');
    },
    style: {
      border: 'none',
      background: 'none',
      color: 'var(--brand)',
      fontWeight: 700,
      cursor: 'pointer',
      padding: 0
    }
  }, "Clear filters")) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "ipo-table-desktop",
    style: {
      overflowX: 'auto'
    }
  }, React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: 760
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)',
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, ipoCols.map(c => React.createElement(SortTh, {
    key: c.key,
    col: c,
    sort: ipoSort,
    onSort: onIpoSort,
    style: {
      padding: '10px 18px'
    }
  })), React.createElement("th", {
    style: {
      padding: '10px 18px'
    }
  }))), React.createElement("tbody", null, pagedIpos.map(ip => React.createElement("tr", {
    key: ip.id,
    style: {
      borderTop: '1px solid var(--border)'
    }
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
    ipo: ip,
    size: 34
  }), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      whiteSpace: 'nowrap'
    }
  }, ip.name), React.createElement(IpoSubline, {
    ip: ip
  })))), React.createElement("td", {
    style: {
      padding: '13px 18px'
    }
  }, React.createElement(Badge, {
    tone: ip.type === 'SME' ? 'sme' : 'mainboard'
  }, ip.type)), React.createElement("td", {
    className: "num",
    style: {
      padding: '13px 18px',
      fontSize: 13
    }
  }, ip.bandHigh ? '₹' + Number(ip.bandHigh).toLocaleString('en-IN') : '—'), React.createElement("td", {
    className: "num",
    style: {
      padding: '13px 18px',
      textAlign: 'right',
      fontSize: 13
    }
  }, ip.lotSize || '—'), React.createElement("td", {
    className: "num",
    style: {
      padding: '13px 18px',
      textAlign: 'right',
      fontSize: 13,
      color: 'var(--ink-2)'
    }
  }, ip.applied || '—'), React.createElement("td", {
    className: "num",
    style: {
      padding: '13px 18px',
      textAlign: 'right',
      fontSize: 13,
      fontWeight: 700,
      color: ip.allotted > 0 ? 'var(--profit)' : 'var(--ink-3)'
    }
  }, ip.allotted || '—'), React.createElement("td", {
    style: {
      padding: '13px 18px'
    }
  }, React.createElement(IpoActions, {
    ip: ip
  }))))))), React.createElement("div", {
    className: "ipo-cards-mobile"
  }, pagedIpos.map(ip => React.createElement("div", {
    key: ip.id,
    style: {
      padding: '13px 14px',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11
    }
  }, React.createElement(IpoLogo, {
    ipo: ip,
    size: 38
  }), React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, ip.name), React.createElement(IpoSubline, {
    ip: ip
  })), React.createElement(Badge, {
    tone: ip.type === 'SME' ? 'sme' : 'mainboard'
  }, ip.type)), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 6,
      fontSize: 12
    }
  }, [['Price', ip.bandHigh ? '₹' + Number(ip.bandHigh).toLocaleString('en-IN') : '—'], ['Lot', ip.lotSize || '—'], ['Applied', ip.applied || '—'], ['Allotted', ip.allotted || '—']].map(([l, v]) => React.createElement("div", {
    key: l
  }, React.createElement("div", {
    style: {
      color: 'var(--ink-3)',
      fontWeight: 600,
      fontSize: 11
    }
  }, l), React.createElement("div", {
    className: "num",
    style: {
      fontWeight: 700,
      color: l === 'Allotted' && ip.allotted > 0 ? 'var(--profit)' : 'var(--ink)'
    }
  }, v)))), React.createElement(IpoActions, {
    ip: ip,
    wide: true
  }))))), ipoPages > 1 && (() => {
    const btn = (label, page, {
      active = false,
      disabled = false,
      key
    } = {}) => React.createElement("button", {
      key: key ?? label,
      disabled: disabled,
      onClick: () => setIpoPage(page),
      style: {
        minWidth: 32,
        height: 30,
        padding: '0 9px',
        borderRadius: 'var(--r-sm)',
        fontSize: 12.5,
        fontWeight: 700,
        border: '1px solid ' + (active ? 'var(--brand)' : 'var(--border)'),
        background: active ? 'var(--brand-tint)' : 'var(--surface)',
        color: active ? 'var(--brand)' : disabled ? 'var(--ink-4, var(--ink-3))' : 'var(--ink-2)',
        opacity: disabled ? .5 : 1,
        cursor: disabled ? 'default' : 'pointer'
      }
    }, label);
    const nums = [];
    for (let i = 0; i < ipoPages; i++) {
      if (i === 0 || i === ipoPages - 1 || Math.abs(i - curIpoPage) <= 1) nums.push(i);else if (nums[nums.length - 1] !== '…') nums.push('…');
    }
    const from = curIpoPage * IPO_PAGE + 1,
      to = Math.min(sortedIpos.length, (curIpoPage + 1) * IPO_PAGE);
    return React.createElement("div", {
      style: {
        padding: '12px 18px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--ink-3)'
      }
    }, "Showing ", React.createElement("strong", {
      style: {
        color: 'var(--ink-2)'
      }
    }, from, "–", to), " of ", sortedIpos.length), React.createElement("div", {
      style: {
        display: 'flex',
        gap: 5,
        flexWrap: 'wrap'
      }
    }, btn('‹ Prev', curIpoPage - 1, {
      disabled: curIpoPage === 0
    }), nums.map((n, i) => n === '…' ? React.createElement("span", {
      key: 'gap' + i,
      style: {
        alignSelf: 'center',
        color: 'var(--ink-3)',
        fontSize: 12.5,
        padding: '0 2px'
      }
    }, "…") : btn(String(n + 1), n, {
      active: n === curIpoPage
    })), btn('Next ›', curIpoPage + 1, {
      disabled: curIpoPage === ipoPages - 1
    })));
  })()), tab === 'Members' && React.createElement("div", {
    style: {
      padding: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--ink-3)'
    }
  }, members.length, " member", members.length !== 1 ? 's' : '', " · ", D.pans.length, " PANs"), React.createElement(Button, {
    variant: "primary",
    size: "sm",
    icon: "plus",
    onClick: () => setShowAddMember(true)
  }, "Add member")), members.length === 0 ? React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '28px 0',
      color: 'var(--ink-3)',
      fontSize: 13
    }
  }, "No members yet.") : React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, members.map(m => {
    const mPans = D.pans.filter(p => p.member === m.id);
    const contact = m.email || m.phone || null;
    return React.createElement(Card, {
      key: m.id,
      pad: 0,
      style: {
        overflow: 'hidden'
      }
    }, React.createElement("div", {
      style: {
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        justifyContent: 'space-between'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        minWidth: 0,
        cursor: 'pointer'
      },
      onClick: () => setProfileMember(m.id),
      title: "View profile"
    }, React.createElement(Avatar, {
      name: m.name,
      hue: m.avatarHue,
      size: 40,
      you: m.you
    }), React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        flexWrap: 'wrap'
      }
    }, React.createElement("span", {
      style: {
        fontSize: 14.5,
        fontWeight: 800,
        textDecoration: 'underline',
        textDecorationColor: 'transparent'
      },
      onMouseEnter: e => e.currentTarget.style.textDecorationColor = 'var(--ink-3)',
      onMouseLeave: e => e.currentTarget.style.textDecorationColor = 'transparent'
    }, m.name), m.you && React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: 'var(--brand)',
        fontWeight: 700,
        background: 'var(--brand-tint)',
        padding: '2px 7px',
        borderRadius: 999
      }
    }, "You"), React.createElement(Badge, {
      tone: m.role === 'Admin' ? 'brand' : 'neutral'
    }, m.role)), React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-3)',
        marginTop: 1
      }
    }, contact && React.createElement("span", null, contact, " · "), React.createElement("span", {
      style: {
        fontWeight: 600
      }
    }, mPans.length, " PAN", mPans.length !== 1 ? 's' : ''), m.upiId ? React.createElement("span", null, " · ", React.createElement("span", {
      className: "num",
      style: {
        color: 'var(--profit)',
        fontWeight: 600
      }
    }, m.upiId)) : React.createElement("button", {
      onClick: () => openEditMember(m),
      style: {
        marginLeft: 6,
        border: 'none',
        background: 'none',
        color: 'var(--warn)',
        fontWeight: 700,
        fontSize: 11.5,
        cursor: 'pointer',
        padding: 0
      }
    }, "+ Add UPI ID")))), React.createElement("div", {
      style: {
        display: 'flex',
        gap: 4,
        flexShrink: 0
      }
    }, React.createElement(IconButton, {
      name: "plus",
      size: 30,
      tip: "Add PAN",
      onClick: () => {
        setShowAddPan(m.id);
        setPanForm({
          pan: '',
          holderName: '',
          relation: 'Self',
          bank: ''
        });
      }
    }), React.createElement(IconButton, {
      name: "edit",
      size: 30,
      tip: "Edit member",
      onClick: () => openEditMember(m)
    }), !m.you && React.createElement(IconButton, {
      name: "trash",
      size: 30,
      tip: "Remove member",
      onClick: () => deleteMember(m.id, m.name)
    }))), mPans.length > 0 && React.createElement("div", {
      style: {
        borderTop: '1px solid var(--border)'
      }
    }, mPans.map((p, pi) => React.createElement("div", {
      key: p.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 16px 9px 52px',
        borderTop: pi === 0 ? 'none' : '1px solid var(--border)',
        background: p.status === 'Inactive' ? 'var(--surface-2)' : 'transparent'
      }
    }, React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        cursor: 'pointer'
      },
      onClick: () => setProfileMember(m.id),
      title: "View profile"
    }, React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: p.status === 'Inactive' ? 'var(--ink-3)' : 'var(--ink)'
      }
    }, p.holder), React.createElement(Badge, {
      tone: {
        Self: 'brand',
        Spouse: 'info',
        Friend: 'neutral'
      }[p.relation] || 'neutral'
    }, p.relation || 'Self'), p.lotOptOut && React.createElement(Badge, {
      tone: "warn"
    }, "Equal (SME)"), p.bank && React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: 'var(--ink-3)',
        background: 'var(--surface-2)',
        padding: '1px 7px',
        borderRadius: 6
      }
    }, p.bank)), React.createElement("span", {
      className: "num",
      style: {
        fontSize: 12.5,
        color: 'var(--ink-2)',
        letterSpacing: '.06em',
        fontWeight: 700
      }
    }, p.pan), React.createElement(StatusDot, {
      tone: p.status === 'Active' ? 'profit' : 'warn'
    }), React.createElement(IconButton, {
      name: "edit",
      size: 26,
      tip: "Edit PAN",
      onClick: () => openEditPan(p)
    })))), mPans.length === 0 && React.createElement("div", {
      style: {
        padding: '8px 16px 10px 52px',
        borderTop: '1px solid var(--border)',
        fontSize: 12,
        color: 'var(--ink-3)',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, "No PAN accounts yet", React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      onClick: () => {
        setShowAddPan(m.id);
        setPanForm({
          pan: '',
          holderName: '',
          relation: 'Self',
          bank: ''
        });
      }
    }, "+ Add PAN")));
  })))), addIpoStep === 'details' && React.createElement(Modal, {
    title: "New IPO",
    onClose: closeAddIpo
  }, React.createElement(Field, {
    label: "Company name *"
  }, React.createElement("input", {
    style: inputSt,
    value: ipoForm.name,
    onChange: e => setIpoForm(p => ({
      ...p,
      name: e.target.value
    })),
    placeholder: "e.g. Tata Technologies",
    autoFocus: true
  })), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, React.createElement(Field, {
    label: "Short name"
  }, React.createElement("input", {
    style: inputSt,
    value: ipoForm.shortName,
    onChange: e => setIpoForm(p => ({
      ...p,
      shortName: e.target.value
    })),
    placeholder: "e.g. Tata Tech"
  })), React.createElement(Field, {
    label: "Board *"
  }, React.createElement("select", {
    style: inputSt,
    value: ipoForm.type,
    onChange: e => setIpoForm(p => ({
      ...p,
      type: e.target.value
    }))
  }, React.createElement("option", {
    value: "SME"
  }, "SME"), React.createElement("option", {
    value: "Mainboard"
  }, "Mainboard")))), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, React.createElement(Field, {
    label: "Price (₹)"
  }, React.createElement("input", {
    style: inputSt,
    type: "number",
    value: ipoForm.price,
    onChange: e => setIpoForm(p => ({
      ...p,
      price: e.target.value
    })),
    placeholder: "950"
  })), React.createElement(Field, {
    label: "Lot size"
  }, React.createElement("input", {
    style: inputSt,
    type: "number",
    value: ipoForm.lotSize,
    onChange: e => setIpoForm(p => ({
      ...p,
      lotSize: e.target.value
    })),
    placeholder: "15"
  }))), ipoForm.type === 'SME' && React.createElement(SmeLotCaps, {
    retail: ipoForm.retailLots,
    shni: ipoForm.shniLots,
    onRetail: v => setIpoForm(p => ({
      ...p,
      retailLots: v
    })),
    onShni: v => setIpoForm(p => ({
      ...p,
      shniLots: v
    }))
  }), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, React.createElement(Field, {
    label: "Open date"
  }, React.createElement("input", {
    style: inputSt,
    type: "date",
    value: ipoForm.openDate,
    onChange: e => setIpoForm(p => ({
      ...p,
      openDate: e.target.value
    }))
  })), React.createElement(Field, {
    label: "Close date"
  }, React.createElement("input", {
    style: inputSt,
    type: "date",
    value: ipoForm.closeDate,
    onChange: e => setIpoForm(p => withAutoDates(p, e.target.value))
  }))), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, React.createElement(Field, {
    label: "Allotment date"
  }, React.createElement("input", {
    style: inputSt,
    type: "date",
    value: ipoForm.allotDate,
    onChange: e => setIpoForm(p => ({
      ...p,
      allotDate: e.target.value
    }))
  })), React.createElement(Field, {
    label: "Listing date"
  }, React.createElement("input", {
    style: inputSt,
    type: "date",
    value: ipoForm.listDate,
    onChange: e => setIpoForm(p => ({
      ...p,
      listDate: e.target.value
    }))
  }))), React.createElement(AutoDateNote, {
    closeDate: ipoForm.closeDate
  }), ipoErr && React.createElement("div", {
    style: {
      color: 'var(--loss)',
      fontSize: 13,
      fontWeight: 600
    }
  }, ipoErr), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end'
    }
  }, React.createElement(Button, {
    variant: "ghost",
    onClick: closeAddIpo
  }, "Cancel"), React.createElement(Button, {
    variant: "primary",
    icon: "chevR",
    onClick: saveIpo,
    style: {
      opacity: ipoSaving ? .7 : 1,
      pointerEvents: ipoSaving ? 'none' : 'auto'
    }
  }, ipoSaving ? 'Creating…' : 'Next: Who applied?'))), addIpoStep === 'applicants' && (() => {
    const newIpo = window.DB.ipos.find(i => i.id === newIpoId);
    const isSME = (newIpo?.type || 'SME') === 'SME';
    const cats = ['Retail', 'sHNI', 'bHNI'];
    const catLabel = c => isSME && c === 'Retail' ? 'Individual' : c;
    const selected = Object.values(applicantSel).filter(v => v.selected).length;
    const allPans = D.pans.map(p => ({
      ...p,
      mem: D.member(p.member)
    }));
    const toggle2 = panId => togglePan(panId);
    return React.createElement(Modal, {
      title: `Step 2 of 2: Who applied? (${newIpo?.short || ''})`,
      onClose: closeAddIpo
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10
      }
    }, React.createElement("span", {
      style: {
        fontSize: 13,
        color: 'var(--ink-3)'
      }
    }, React.createElement("strong", {
      style: {
        color: 'var(--ink)'
      }
    }, selected), " of ", allPans.length, " selected · tap a row to select"), React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6
      }
    }, React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      onClick: selectAll
    }, "All"), React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      onClick: deselectAll
    }, "None"))), React.createElement("div", {
      style: {
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        maxHeight: 400,
        overflowY: 'auto'
      }
    }, allPans.map((p, i) => {
      const sel = applicantSel[p.id] || {
        selected: false,
        category: cats[0]
      };
      return React.createElement("div", {
        key: p.id,
        onClick: () => toggle2(p.id),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '11px 16px',
          borderTop: i === 0 ? 'none' : '1px solid var(--border)',
          background: sel.selected ? 'var(--brand-tint)' : 'transparent',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background .12s'
        }
      }, React.createElement("div", {
        style: {
          width: 22,
          height: 22,
          borderRadius: '50%',
          flexShrink: 0,
          border: sel.selected ? '2px solid var(--brand)' : '2px solid var(--border)',
          background: sel.selected ? 'var(--brand)' : 'transparent',
          display: 'grid',
          placeItems: 'center',
          transition: 'all .12s'
        }
      }, sel.selected && React.createElement("svg", {
        width: "12",
        height: "12",
        viewBox: "0 0 12 12",
        fill: "none",
        stroke: "#fff",
        strokeWidth: "2.5",
        strokeLinecap: "round"
      }, React.createElement("polyline", {
        points: "2,6 5,9 10,3"
      }))), React.createElement(Avatar, {
        name: p.holder,
        hue: p.mem?.avatarHue || 200,
        size: 34
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
      }, p.holder), React.createElement("div", {
        className: "num",
        style: {
          fontSize: 11.5,
          color: 'var(--ink-3)',
          letterSpacing: '.04em',
          fontWeight: 700
        }
      }, p.pan), React.createElement("div", {
        style: {
          fontSize: 11.5,
          color: 'var(--ink-3)',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          flexWrap: 'wrap'
        }
      }, p.mem && React.createElement("span", null, p.mem.name), p.mem?.you && React.createElement("span", {
        style: {
          color: 'var(--brand)',
          fontWeight: 700
        }
      }, "· You"), React.createElement(Badge, {
        tone: {
          Self: 'brand',
          Spouse: 'info',
          Friend: 'neutral'
        }[p.relation] || 'neutral'
      }, p.relation || 'Self'))), React.createElement("select", {
        style: {
          ...inputSt,
          width: 96,
          padding: '5px 7px',
          fontSize: 12.5,
          opacity: sel.selected ? 1 : .35
        },
        value: sel.category,
        disabled: !sel.selected,
        onClick: e => e.stopPropagation(),
        onChange: e => {
          e.stopPropagation();
          setCat(p.id, e.target.value);
        }
      }, cats.map(c => React.createElement("option", {
        key: c,
        value: c
      }, catLabel(c)))), React.createElement(LotsInput, {
        value: sel.lots ?? 1,
        onChange: v => setLots(p.id, v),
        cat: sel.category,
        ipo: D.ipo(newIpoId),
        disabled: !sel.selected,
        compact: true
      }));
    })), appErr && React.createElement("div", {
      style: {
        color: 'var(--loss)',
        fontSize: 13,
        fontWeight: 600
      }
    }, appErr), React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        justifyContent: 'flex-end'
      }
    }, React.createElement(Button, {
      variant: "ghost",
      onClick: closeAddIpo
    }, "Skip"), React.createElement(Button, {
      variant: "primary",
      onClick: saveApplications,
      style: {
        opacity: appSaving || selected === 0 ? .6 : 1,
        pointerEvents: appSaving || selected === 0 ? 'none' : 'auto'
      }
    }, appSaving ? 'Saving…' : selected > 0 ? `Save ${selected} application${selected !== 1 ? 's' : ''}` : 'Select applicants')));
  })(), profileMember && (() => {
    const m = D.members.find(x => x.id === profileMember);
    if (!m) return null;
    const mPans = D.pans.filter(p => p.member === m.id);
    const mPanIds = mPans.map(p => p.id);
    const memberProfit = (D.memberProfits || []).find(mp => mp.id === m.id) || {
      profit: 0,
      soloProfit: 0,
      pans: 0
    };
    const panProfitMap = {};
    (D.panProfits || []).forEach(pp => {
      panProfitMap[pp.id] = pp;
    });
    const memberAllots = mPanIds.flatMap(id => D.allotsOfPan(id));
    const appliedCount = memberAllots.length;
    const allottedCount = memberAllots.filter(a => a.status === 'allotted').length;
    const allotRate = appliedCount > 0 ? Math.round(allottedCount / appliedCount * 100) : 0;
    const iposApplied = new Set(memberAllots.map(a => a.ipo)).size;
    const memberSettlements = D.settlements.filter(s => s.member === m.id);
    const paidTotal = memberSettlements.filter(s => s.status === 'Paid').reduce((s, r) => s + (r.amount || 0), 0);
    const pendingTotal = memberSettlements.filter(s => s.status === 'Pending').reduce((s, r) => s + (r.amount || 0), 0);
    const delta = Math.round(memberProfit.profit - memberProfit.soloProfit);
    const ipoOrder = {};
    D.ipos.forEach((ip, i) => {
      ipoOrder[ip.id] = i;
    });
    const appRows = memberAllots.slice().sort((a, b) => (ipoOrder[a.ipo] ?? 999) - (ipoOrder[b.ipo] ?? 999));
    const STATUS_META = {
      allotted: {
        label: 'Allotted',
        tone: 'profit'
      },
      not_allotted: {
        label: 'Not allotted',
        tone: 'loss'
      },
      pending: {
        label: 'Pending',
        tone: 'neutral'
      }
    };
    return React.createElement("div", {
      className: "modal-overlay",
      style: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        zIndex: 65,
        display: 'grid',
        placeItems: 'center',
        padding: 12
      }
    }, React.createElement("div", {
      className: "modal-card",
      style: {
        background: 'var(--surface)',
        borderRadius: 'var(--r-lg)',
        width: '100%',
        maxWidth: 760,
        boxShadow: 'var(--sh-pop)',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'popIn .22s cubic-bezier(.2,.7,.3,1)'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }
    }, React.createElement(Avatar, {
      name: m.name,
      hue: m.avatarHue,
      size: 40,
      you: m.you
    }), React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 15.5,
        fontWeight: 800
      }
    }, m.name, m.you && React.createElement("span", {
      style: {
        color: 'var(--brand)',
        fontWeight: 600
      }
    }, " · You")), React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-3)'
      }
    }, m.email || m.phone || 'No contact on file', " · ", mPans.length, " PAN", mPans.length !== 1 ? 's' : ''))), React.createElement(IconButton, {
      name: "x",
      size: 32,
      onClick: () => setProfileMember(null)
    })), React.createElement("div", {
      style: {
        padding: '18px 20px 22px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 18
      }
    }, React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4,1fr)',
        gap: 10
      }
    }, React.createElement("div", {
      style: {
        padding: 14,
        borderRadius: 'var(--r-md)',
        background: 'var(--surface-2)'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        fontWeight: 600
      }
    }, "Total profit"), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 19,
        fontWeight: 800,
        color: memberProfit.profit >= 0 ? 'var(--profit)' : 'var(--loss)'
      }
    }, f(memberProfit.profit, {
      compact: true
    })), delta !== 0 && React.createElement("div", {
      style: {
        fontSize: 10.5,
        fontWeight: 700,
        color: delta > 0 ? 'var(--profit)' : 'var(--loss)',
        marginTop: 2
      }
    }, delta > 0 ? '▲' : '▼', " ", f(Math.abs(delta), {
      compact: true
    }), " vs solo")), React.createElement("div", {
      style: {
        padding: 14,
        borderRadius: 'var(--r-md)',
        background: 'var(--surface-2)'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        fontWeight: 600
      }
    }, "IPOs applied"), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 19,
        fontWeight: 800
      }
    }, iposApplied)), React.createElement("div", {
      style: {
        padding: 14,
        borderRadius: 'var(--r-md)',
        background: 'var(--surface-2)'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        fontWeight: 600
      }
    }, "Allotments"), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 19,
        fontWeight: 800
      }
    }, allottedCount, React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--ink-3)',
        fontWeight: 600
      }
    }, " / ", appliedCount))), React.createElement("div", {
      style: {
        padding: 14,
        borderRadius: 'var(--r-md)',
        background: 'var(--surface-2)'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        fontWeight: 600
      }
    }, "Allotment rate"), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 19,
        fontWeight: 800
      }
    }, allotRate, "%"))), (paidTotal !== 0 || pendingTotal !== 0) && React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10
      }
    }, React.createElement("div", {
      style: {
        flex: 1,
        padding: '10px 14px',
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--profit)',
        background: 'var(--profit-soft)'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-2)',
        fontWeight: 600
      }
    }, "Paid"), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 15,
        fontWeight: 800,
        color: 'var(--profit)'
      }
    }, f(paidTotal))), React.createElement("div", {
      style: {
        flex: 1,
        padding: '10px 14px',
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--warn)',
        background: 'var(--warn-soft)'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-2)',
        fontWeight: 600
      }
    }, "Pending"), React.createElement("div", {
      className: "num",
      style: {
        fontSize: 15,
        fontWeight: 800,
        color: 'var(--warn)'
      }
    }, f(pendingTotal)))), mPans.length > 1 && React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 800,
        marginBottom: 8
      }
    }, "Per-PAN breakdown"), React.createElement("div", {
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
        fontSize: 10.5,
        color: 'var(--ink-3)',
        textTransform: 'uppercase',
        letterSpacing: '.04em'
      }
    }, React.createElement("th", {
      style: {
        textAlign: 'left',
        padding: '6px 8px',
        fontWeight: 700
      }
    }, "PAN"), React.createElement("th", {
      style: {
        textAlign: 'right',
        padding: '6px 8px',
        fontWeight: 700
      }
    }, "Applications"), React.createElement("th", {
      style: {
        textAlign: 'right',
        padding: '6px 8px',
        fontWeight: 700
      }
    }, "Profit"))), React.createElement("tbody", null, mPans.map(p => {
      const pp = panProfitMap[p.id] || {
        profit: 0,
        soloProfit: 0,
        apps: 0
      };
      const d = Math.round(pp.profit - pp.soloProfit);
      return React.createElement("tr", {
        key: p.id,
        style: {
          borderTop: '1px solid var(--border)'
        }
      }, React.createElement("td", {
        style: {
          padding: '8px 8px'
        }
      }, React.createElement("div", {
        style: {
          fontSize: 12.5,
          fontWeight: 700
        }
      }, p.holder), React.createElement("div", {
        style: {
          fontSize: 10.5,
          color: 'var(--ink-3)'
        }
      }, p.relation)), React.createElement("td", {
        className: "num",
        style: {
          padding: '8px 8px',
          textAlign: 'right',
          color: 'var(--ink-2)'
        }
      }, pp.apps), React.createElement("td", {
        className: "num",
        style: {
          padding: '8px 8px',
          textAlign: 'right'
        }
      }, React.createElement("div", {
        style: {
          fontWeight: 800,
          color: pp.profit >= 0 ? 'var(--profit)' : 'var(--loss)'
        }
      }, f(pp.profit, {
        compact: true
      })), d !== 0 && React.createElement("div", {
        style: {
          fontSize: 10,
          fontWeight: 700,
          color: d > 0 ? 'var(--profit)' : 'var(--loss)'
        }
      }, d > 0 ? '▲' : '▼', " ", f(Math.abs(d), {
        compact: true
      }), " vs solo")));
    }))))), React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 800,
        marginBottom: 8
      }
    }, "Applications & allotments"), appRows.length === 0 ? React.createElement("div", {
      style: {
        padding: '16px 0',
        textAlign: 'center',
        color: 'var(--ink-3)',
        fontSize: 12.5
      }
    }, "No applications yet.") : React.createElement("div", {
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
        fontSize: 10.5,
        color: 'var(--ink-3)',
        textTransform: 'uppercase',
        letterSpacing: '.04em'
      }
    }, React.createElement("th", {
      style: {
        textAlign: 'left',
        padding: '6px 8px',
        fontWeight: 700
      }
    }, "IPO"), React.createElement("th", {
      style: {
        textAlign: 'left',
        padding: '6px 8px',
        fontWeight: 700
      }
    }, "PAN"), React.createElement("th", {
      style: {
        textAlign: 'left',
        padding: '6px 8px',
        fontWeight: 700
      }
    }, "Category"), React.createElement("th", {
      style: {
        textAlign: 'center',
        padding: '6px 8px',
        fontWeight: 700
      }
    }, "Status"), React.createElement("th", {
      style: {
        textAlign: 'right',
        padding: '6px 8px',
        fontWeight: 700
      }
    }, "Shares"), React.createElement("th", {
      style: {
        textAlign: 'right',
        padding: '6px 8px',
        fontWeight: 700
      }
    }, "Gain"))), React.createElement("tbody", null, appRows.map(a => {
      const ipoObj = D.ipo(a.ipo);
      const panObj = D.pan(a.pan);
      const catMeta = (window.CAT_META || {})[a.category] || {
        label: a.category || '—',
        tone: 'neutral'
      };
      const st = STATUS_META[a.status] || STATUS_META.pending;
      return React.createElement("tr", {
        key: a.id,
        style: {
          borderTop: '1px solid var(--border)'
        }
      }, React.createElement("td", {
        style: {
          padding: '8px 8px'
        }
      }, React.createElement("div", {
        style: {
          fontSize: 12.5,
          fontWeight: 700
        }
      }, ipoObj?.short || ipoObj?.name || '—'), React.createElement("div", {
        style: {
          fontSize: 10.5,
          color: 'var(--ink-3)'
        }
      }, ipoObj?.type)), React.createElement("td", {
        style: {
          padding: '8px 8px',
          fontSize: 12,
          color: 'var(--ink-2)'
        }
      }, panObj?.holder || '—'), React.createElement("td", {
        style: {
          padding: '8px 8px'
        }
      }, React.createElement(Badge, {
        tone: catMeta.tone,
        style: {
          fontSize: 10
        }
      }, catMeta.label)), React.createElement("td", {
        style: {
          padding: '8px 8px',
          textAlign: 'center'
        }
      }, React.createElement(Badge, {
        tone: st.tone,
        style: {
          fontSize: 10
        }
      }, st.label)), React.createElement("td", {
        className: "num",
        style: {
          padding: '8px 8px',
          textAlign: 'right',
          color: 'var(--ink-2)'
        }
      }, a.shares || '—'), React.createElement("td", {
        className: "num",
        style: {
          padding: '8px 8px',
          textAlign: 'right',
          fontWeight: 700,
          color: a.gain > 0 ? 'var(--profit)' : a.gain < 0 ? 'var(--loss)' : 'var(--ink-3)'
        }
      }, a.gain ? f(a.gain, {
        compact: true
      }) : '—'));
    }))))))));
  })(), showAddMember && React.createElement(Modal, {
    title: "Add member",
    onClose: () => {
      setShowAddMember(false);
      setMemberErr('');
      setMemberForm({
        name: '',
        email: '',
        phone: '',
        pan: '',
        bank: ''
      });
    }
  }, React.createElement(Field, {
    label: "Full name *"
  }, React.createElement("input", {
    style: inputSt,
    value: memberForm.name,
    onChange: e => setMemberForm(p => ({
      ...p,
      name: e.target.value
    })),
    placeholder: "Priya Sharma"
  })), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, React.createElement(Field, {
    label: "PAN number (Self)"
  }, React.createElement("input", {
    style: {
      ...inputSt,
      textTransform: 'uppercase',
      letterSpacing: '.05em'
    },
    maxLength: 10,
    value: memberForm.pan,
    onChange: e => setMemberForm(p => ({
      ...p,
      pan: e.target.value.toUpperCase()
    })),
    placeholder: "ABCDE1234F"
  })), React.createElement(Field, {
    label: "Bank / Broker"
  }, React.createElement("input", {
    style: inputSt,
    value: memberForm.bank,
    onChange: e => setMemberForm(p => ({
      ...p,
      bank: e.target.value
    })),
    placeholder: "HDFC, Zerodha…"
  }))), React.createElement(Field, {
    label: "Email"
  }, React.createElement("input", {
    style: inputSt,
    type: "email",
    value: memberForm.email,
    onChange: e => setMemberForm(p => ({
      ...p,
      email: e.target.value
    })),
    placeholder: "priya@example.com"
  })), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, React.createElement(Field, {
    label: "Phone"
  }, React.createElement("input", {
    style: inputSt,
    value: memberForm.phone,
    onChange: e => setMemberForm(p => ({
      ...p,
      phone: e.target.value
    })),
    placeholder: "+91 98765 43210"
  })), React.createElement(Field, {
    label: "UPI ID"
  }, React.createElement("input", {
    style: inputSt,
    value: memberForm.upi,
    onChange: e => setMemberForm(p => ({
      ...p,
      upi: e.target.value.trim()
    })),
    placeholder: "name@okhdfcbank",
    autoCapitalize: "none",
    spellCheck: false
  }))), memberErr && React.createElement("div", {
    style: {
      color: 'var(--loss)',
      fontSize: 13,
      fontWeight: 600
    }
  }, memberErr), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end'
    }
  }, React.createElement(Button, {
    variant: "ghost",
    onClick: () => {
      setShowAddMember(false);
      setMemberErr('');
      setMemberForm({
        name: '',
        email: '',
        phone: '',
        pan: '',
        bank: ''
      });
    }
  }, "Cancel"), React.createElement(Button, {
    variant: "primary",
    onClick: saveMember,
    style: {
      opacity: memberSaving ? .7 : 1,
      pointerEvents: memberSaving ? 'none' : 'auto'
    }
  }, memberSaving ? 'Adding…' : 'Add member'))), editIpoId && React.createElement(Modal, {
    title: "Edit IPO",
    onClose: () => setEditIpoId(null)
  }, React.createElement(Field, {
    label: "Company name *"
  }, React.createElement("input", {
    style: inputSt,
    value: editIpoForm.name,
    onChange: e => setEditIpoForm(p => ({
      ...p,
      name: e.target.value
    })),
    autoFocus: true
  })), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, React.createElement(Field, {
    label: "Short name"
  }, React.createElement("input", {
    style: inputSt,
    value: editIpoForm.shortName,
    onChange: e => setEditIpoForm(p => ({
      ...p,
      shortName: e.target.value
    }))
  })), React.createElement(Field, {
    label: "Board *"
  }, React.createElement("select", {
    style: inputSt,
    value: editIpoForm.type,
    onChange: e => setEditIpoForm(p => ({
      ...p,
      type: e.target.value
    }))
  }, React.createElement("option", {
    value: "SME"
  }, "SME"), React.createElement("option", {
    value: "Mainboard"
  }, "Mainboard")))), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, React.createElement(Field, {
    label: "Price (₹)"
  }, React.createElement("input", {
    style: inputSt,
    type: "number",
    value: editIpoForm.price,
    onChange: e => setEditIpoForm(p => ({
      ...p,
      price: e.target.value
    })),
    placeholder: "950"
  })), React.createElement(Field, {
    label: "Lot size"
  }, React.createElement("input", {
    style: inputSt,
    type: "number",
    value: editIpoForm.lotSize,
    onChange: e => setEditIpoForm(p => ({
      ...p,
      lotSize: e.target.value
    })),
    placeholder: "15"
  }))), editIpoForm.type === 'SME' && React.createElement(SmeLotCaps, {
    retail: editIpoForm.retailLots,
    shni: editIpoForm.shniLots,
    onRetail: v => setEditIpoForm(p => ({
      ...p,
      retailLots: v
    })),
    onShni: v => setEditIpoForm(p => ({
      ...p,
      shniLots: v
    }))
  }), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, React.createElement(Field, {
    label: "Open date"
  }, React.createElement("input", {
    style: inputSt,
    type: "date",
    value: editIpoForm.openDate,
    onChange: e => setEditIpoForm(p => ({
      ...p,
      openDate: e.target.value
    }))
  })), React.createElement(Field, {
    label: "Close date"
  }, React.createElement("input", {
    style: inputSt,
    type: "date",
    value: editIpoForm.closeDate,
    onChange: e => setEditIpoForm(p => withAutoDates(p, e.target.value))
  }))), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, React.createElement(Field, {
    label: "Allotment date"
  }, React.createElement("input", {
    style: inputSt,
    type: "date",
    value: editIpoForm.allotDate,
    onChange: e => setEditIpoForm(p => ({
      ...p,
      allotDate: e.target.value
    }))
  })), React.createElement(Field, {
    label: "Listing date"
  }, React.createElement("input", {
    style: inputSt,
    type: "date",
    value: editIpoForm.listDate,
    onChange: e => setEditIpoForm(p => ({
      ...p,
      listDate: e.target.value
    }))
  }))), React.createElement(AutoDateNote, {
    closeDate: editIpoForm.closeDate
  }), editIpoErr && React.createElement("div", {
    style: {
      color: 'var(--loss)',
      fontSize: 13,
      fontWeight: 600
    }
  }, editIpoErr), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end',
      alignItems: 'center'
    }
  }, React.createElement("button", {
    onClick: () => {
      const ip = D.ipo(editIpoId);
      setEditIpoId(null);
      deleteIpo(editIpoId, ip?.short || ip?.name);
    },
    style: {
      marginRight: 'auto',
      border: 'none',
      background: 'none',
      color: 'var(--loss)',
      fontWeight: 700,
      fontSize: 13,
      cursor: 'pointer',
      padding: 0
    }
  }, "Delete IPO…"), React.createElement(Button, {
    variant: "ghost",
    onClick: () => setEditIpoId(null)
  }, "Cancel"), React.createElement(Button, {
    variant: "primary",
    onClick: saveEditIpo,
    style: {
      opacity: editIpoSaving ? .7 : 1,
      pointerEvents: editIpoSaving ? 'none' : 'auto'
    }
  }, editIpoSaving ? 'Saving…' : 'Save changes'))), showAddPan && React.createElement(Modal, {
    title: "Add PAN account",
    onClose: () => {
      setShowAddPan(null);
      setPanErr('');
    }
  }, React.createElement(Field, {
    label: "PAN number *"
  }, React.createElement("input", {
    style: {
      ...inputSt,
      textTransform: 'uppercase',
      letterSpacing: '.05em'
    },
    value: panForm.pan,
    onChange: e => setPanForm(p => ({
      ...p,
      pan: e.target.value.toUpperCase()
    })),
    placeholder: "ABCDE1234F",
    maxLength: 10
  })), React.createElement(Field, {
    label: "Holder name *"
  }, React.createElement("input", {
    style: inputSt,
    value: panForm.holderName,
    onChange: e => setPanForm(p => ({
      ...p,
      holderName: e.target.value
    })),
    placeholder: "Name as on PAN card"
  })), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, React.createElement(Field, {
    label: "Relation to member"
  }, React.createElement("input", {
    style: inputSt,
    list: "rel-opts",
    value: panForm.relation,
    onChange: e => setPanForm(p => ({
      ...p,
      relation: e.target.value
    })),
    placeholder: "Self, Friend, Spouse…"
  }), React.createElement("datalist", {
    id: "rel-opts"
  }, ['Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Friend', 'Other'].map(r => React.createElement("option", {
    key: r,
    value: r
  })))), React.createElement(Field, {
    label: "Bank / Broker"
  }, React.createElement("input", {
    style: inputSt,
    value: panForm.bank,
    onChange: e => setPanForm(p => ({
      ...p,
      bank: e.target.value
    })),
    placeholder: "HDFC, Zerodha…"
  }))), React.createElement(LotSplitToggle, {
    value: !panForm.lotOptOut,
    onChange: v => setPanForm(p => ({
      ...p,
      lotOptOut: !v
    }))
  }), panErr && React.createElement("div", {
    style: {
      color: 'var(--loss)',
      fontSize: 13,
      fontWeight: 600
    }
  }, panErr), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end'
    }
  }, React.createElement(Button, {
    variant: "ghost",
    onClick: () => {
      setShowAddPan(null);
      setPanErr('');
    }
  }, "Cancel"), React.createElement(Button, {
    variant: "primary",
    onClick: savePan,
    style: {
      opacity: panSaving ? .7 : 1,
      pointerEvents: panSaving ? 'none' : 'auto'
    }
  }, panSaving ? 'Adding…' : 'Add PAN'))), editMember && React.createElement(Modal, {
    title: "Edit member",
    onClose: () => {
      setEditMember(null);
      setEditMemberErr('');
    }
  }, React.createElement(Field, {
    label: "Full name *"
  }, React.createElement("input", {
    style: inputSt,
    value: editMemberForm.name,
    onChange: e => setEditMemberForm(p => ({
      ...p,
      name: e.target.value
    }))
  })), React.createElement(Field, {
    label: "Email"
  }, React.createElement("input", {
    style: inputSt,
    type: "email",
    value: editMemberForm.email,
    onChange: e => setEditMemberForm(p => ({
      ...p,
      email: e.target.value
    }))
  })), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, React.createElement(Field, {
    label: "Phone"
  }, React.createElement("input", {
    style: inputSt,
    value: editMemberForm.phone,
    onChange: e => setEditMemberForm(p => ({
      ...p,
      phone: e.target.value
    }))
  })), React.createElement(Field, {
    label: "UPI ID"
  }, React.createElement("input", {
    style: inputSt,
    value: editMemberForm.upiId,
    onChange: e => setEditMemberForm(p => ({
      ...p,
      upiId: e.target.value.trim()
    })),
    placeholder: "name@okhdfcbank",
    autoCapitalize: "none",
    spellCheck: false
  }))), editMemberErr && React.createElement("div", {
    style: {
      color: 'var(--loss)',
      fontSize: 13,
      fontWeight: 600
    }
  }, editMemberErr), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end'
    }
  }, React.createElement(Button, {
    variant: "ghost",
    onClick: () => {
      setEditMember(null);
      setEditMemberErr('');
    }
  }, "Cancel"), React.createElement(Button, {
    variant: "primary",
    onClick: saveEditMember,
    style: {
      opacity: editMemberSaving ? .7 : 1,
      pointerEvents: editMemberSaving ? 'none' : 'auto'
    }
  }, editMemberSaving ? 'Saving…' : 'Save changes'))), editPan && React.createElement(Modal, {
    title: "Edit PAN account",
    onClose: () => {
      setEditPan(null);
      setEditPanErr('');
    }
  }, React.createElement("div", {
    style: {
      padding: '10px 14px',
      background: 'var(--surface-2)',
      borderRadius: 'var(--r-md)',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--ink-3)',
      textTransform: 'uppercase',
      letterSpacing: '.05em'
    }
  }, "PAN"), React.createElement("span", {
    className: "num",
    style: {
      fontSize: 14,
      fontWeight: 800,
      letterSpacing: '.06em'
    }
  }, editPan.pan), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: 'var(--ink-3)',
      marginLeft: 'auto'
    }
  }, "cannot be changed")), React.createElement(Field, {
    label: "Holder name *"
  }, React.createElement("input", {
    style: inputSt,
    value: editPanForm.holderName,
    onChange: e => setEditPanForm(p => ({
      ...p,
      holderName: e.target.value
    }))
  })), React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, React.createElement(Field, {
    label: "Relation to member"
  }, React.createElement("input", {
    style: inputSt,
    list: "edit-rel-opts",
    value: editPanForm.relation,
    onChange: e => setEditPanForm(p => ({
      ...p,
      relation: e.target.value
    }))
  }), React.createElement("datalist", {
    id: "edit-rel-opts"
  }, ['Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Friend', 'Other'].map(r => React.createElement("option", {
    key: r,
    value: r
  })))), React.createElement(Field, {
    label: "Bank / Broker"
  }, React.createElement("input", {
    style: inputSt,
    value: editPanForm.bank,
    onChange: e => setEditPanForm(p => ({
      ...p,
      bank: e.target.value
    })),
    placeholder: "HDFC, Zerodha…"
  }))), React.createElement(Field, {
    label: "Status"
  }, React.createElement("select", {
    style: inputSt,
    value: editPanForm.status,
    onChange: e => setEditPanForm(p => ({
      ...p,
      status: e.target.value
    }))
  }, React.createElement("option", {
    value: "Active"
  }, "Active"), React.createElement("option", {
    value: "Inactive"
  }, "Inactive"))), React.createElement(LotSplitToggle, {
    value: !editPanForm.lotOptOut,
    onChange: v => setEditPanForm(p => ({
      ...p,
      lotOptOut: !v
    }))
  }), editPanErr && React.createElement("div", {
    style: {
      color: 'var(--loss)',
      fontSize: 13,
      fontWeight: 600
    }
  }, editPanErr), React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end'
    }
  }, React.createElement(Button, {
    variant: "ghost",
    onClick: () => {
      setEditPan(null);
      setEditPanErr('');
    }
  }, "Cancel"), React.createElement(Button, {
    variant: "primary",
    onClick: saveEditPan,
    style: {
      opacity: editPanSaving ? .7 : 1,
      pointerEvents: editPanSaving ? 'none' : 'auto'
    }
  }, editPanSaving ? 'Saving…' : 'Save changes'))), viewIpoId && (() => {
    const vIpo = D.ipo(viewIpoId);
    const vIsSME = vIpo?.type === 'SME';
    const vCatLabel = c => vIsSME && c === 'Retail' ? 'Individual' : c === 'SME' ? 'SME (legacy)' : c;
    const vCats = ['Retail', 'sHNI', 'bHNI'];
    const vAllots = D.allotsOfIpo(viewIpoId);
    const countBy = s => vAllots.filter(a => (changes[a.id]?.status ?? a.status) === s).length;
    const allotted = countBy('allotted'),
      notAllot = countBy('not_allotted'),
      pending = countBy('pending');
    const hasDirty = vAllots.some(a => changes[a.id]);
    const discardView = () => {
      setViewIpoId(null);
      setChanges({});
      setSaved(false);
      setViewListPrice('');
      setPasteOpen(false);
      setPasteText('');
      setAllotQuery('');
      setAllotFilter('all');
    };
    const rowInfo = a => {
      const p = D.pan(a.pan),
        m = p ? D.member(p.member) : null;
      return {
        holder: p?.holder || '',
        member: m?.name || '',
        pan: p?.pan || ''
      };
    };
    const CAT_RANK = {
      bHNI: 0,
      sHNI: 1,
      Retail: 2,
      SME: 3
    };
    const STATUS_RANK = {
      pending: 0,
      allotted: 1,
      not_allotted: 2
    };
    const byName = (a, b) => rowInfo(a).holder.localeCompare(rowInfo(b).holder, 'en', {
      sensitivity: 'base',
      numeric: true
    });
    const ALLOT_SORTS = {
      name: ['Name A–Z', byName],
      member: ['Member', (a, b) => rowInfo(a).member.localeCompare(rowInfo(b).member, 'en', {
        sensitivity: 'base',
        numeric: true
      }) || byName(a, b)],
      category: ['Category', (a, b) => (CAT_RANK[a.category] ?? 9) - (CAT_RANK[b.category] ?? 9) || byName(a, b)],
      status: ['Status', (a, b) => (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9) || byName(a, b)],
      lots: ['Lots applied', (a, b) => (b.lots || 1) - (a.lots || 1) || byName(a, b)]
    };
    const curStatus = a => changes[a.id]?.status ?? a.status;
    const ALLOT_FILTERS = [['all', 'All'], ['pending', '— Pending'], ['allotted', '✓ Got'], ['not_allotted', '✗ Not got']];
    const aq = allotQuery.trim().toLowerCase();
    const shownAllots = vAllots.filter(a => allotFilter === 'all' || curStatus(a) === allotFilter).filter(a => {
      if (!aq) return true;
      const r = rowInfo(a);
      return (r.holder + ' ' + r.member + ' ' + r.pan).toLowerCase().includes(aq);
    }).sort((ALLOT_SORTS[allotSort] || ALLOT_SORTS.name)[1]);
    const closeView = () => hasDirty ? askConfirm('Discard unsaved changes?', `You've changed ${vAllots.filter(a => changes[a.id]).length} row(s) in ${vIpo?.name || 'this IPO'} without saving. Close and lose them?`, discardView, true, 'Discard') : discardView();
    const lp = parseFloat(viewListPrice) || 0;
    const issuePrice = vIpo?.bandHigh || 0;
    const autoGain = sharesVal => lp > 0 && issuePrice > 0 ? window.rowGain('allotted', lp, issuePrice, sharesVal) : null;
    const markStatus = (a, val) => {
      if (val === 'allotted') {
        const cur = parseInt(changes[a.id]?.shares ?? a.shares) || 0;
        const sh = cur > 0 ? cur : (vIpo?.lotSize || 0) * (parseInt(changes[a.id]?.lots ?? a.lots, 10) || 1);
        const g = autoGain(sh);
        setChanges(prev => ({
          ...prev,
          [a.id]: {
            ...(prev[a.id] || {}),
            status: val,
            shares: sh,
            ...(g !== null ? {
              gain: g
            } : {})
          }
        }));
      } else {
        setChanges(prev => ({
          ...prev,
          [a.id]: {
            ...(prev[a.id] || {}),
            status: val,
            shares: 0,
            gain: 0,
            sellPrice: ''
          }
        }));
      }
    };
    const updateShares = (a, val) => {
      const sh = parseInt(val) || 0;
      const cur = changes[a.id]?.status ?? a.status;
      const st = sh > 0 ? 'allotted' : cur;
      const curSp = changes[a.id]?.sellPrice ?? (a.sellPrice != null ? String(a.sellPrice) : '');
      const rsp = parseFloat(curSp) || lp;
      const g = st === 'allotted' ? window.rowGain(st, rsp, issuePrice, sh) : 0;
      setChanges(prev => ({
        ...prev,
        [a.id]: {
          ...(prev[a.id] || {}),
          status: st,
          shares: val,
          gain: g,
          ...(st === 'allotted' && !parseFloat(curSp) && lp > 0 ? {
            sellPrice: String(lp)
          } : {})
        }
      }));
    };
    const updateAllotLots = (a, val) => {
      const ls = Math.max(0, parseInt(val) || 0);
      updateShares(a, String(ls * (vIpo?.lotSize || 0)));
    };
    const markAllotted = () => setChanges(prev => {
      const n = {
        ...prev
      };
      vAllots.forEach(a => {
        const cur = parseInt(n[a.id]?.shares ?? a.shares) || 0;
        const sh = cur > 0 ? cur : (vIpo?.lotSize || 0) * (parseInt(n[a.id]?.lots ?? a.lots, 10) || 1);
        const g = autoGain(sh);
        n[a.id] = {
          ...(n[a.id] || {}),
          status: 'allotted',
          shares: sh,
          ...(lp > 0 ? {
            sellPrice: String(lp)
          } : {}),
          ...(g !== null ? {
            gain: g
          } : {})
        };
      });
      return n;
    });
    const markNone = () => setChanges(prev => {
      const n = {
        ...prev
      };
      vAllots.forEach(a => {
        n[a.id] = {
          ...(n[a.id] || {}),
          status: 'not_allotted',
          shares: 0,
          gain: 0,
          sellPrice: ''
        };
      });
      return n;
    });
    const pasteParsed = window.parseAllotmentPaste(pasteText);
    const panIndex = {};
    vAllots.forEach(a => {
      const p = D.pan(a.pan);
      if (p?.pan) panIndex[String(p.pan).toUpperCase()] = a;
    });
    const pasteMatched = pasteParsed.rows.filter(r => panIndex[r.pan]);
    const pasteUnknown = pasteParsed.rows.filter(r => !panIndex[r.pan]);
    const pasteGot = pasteMatched.filter(r => r.shares > 0).length;
    const applyPaste = () => {
      const next = {};
      pasteMatched.forEach(r => {
        const a = panIndex[r.pan];
        if (r.shares > 0) {
          const cur = changes[a.id]?.sellPrice ?? (a.sellPrice != null ? String(a.sellPrice) : '');
          const sp = parseFloat(cur) || lp;
          next[a.id] = {
            ...(changes[a.id] || {}),
            status: 'allotted',
            shares: r.shares,
            sellPrice: sp > 0 ? String(sp) : '',
            gain: window.rowGain('allotted', sp, issuePrice, r.shares)
          };
        } else {
          next[a.id] = {
            ...(changes[a.id] || {}),
            status: 'not_allotted',
            shares: 0,
            gain: 0,
            sellPrice: ''
          };
        }
      });
      setChanges(prev => ({
        ...prev,
        ...next
      }));
      setPasteOpen(false);
      setPasteText('');
    };
    return React.createElement("div", {
      className: "modal-overlay",
      style: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        zIndex: 65,
        display: 'grid',
        placeItems: 'center',
        padding: 12
      }
    }, React.createElement("div", {
      className: "modal-card",
      style: {
        background: 'var(--surface)',
        borderRadius: 'var(--r-lg)',
        width: '100%',
        maxWidth: 680,
        boxShadow: 'var(--sh-pop)',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'popIn .22s cubic-bezier(.2,.7,.3,1)'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, React.createElement(IpoLogo, {
      ipo: vIpo,
      size: 34
    }), React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 800
      }
    }, vIpo?.name), React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-3)',
        display: 'flex',
        gap: 8
      }
    }, React.createElement("span", null, vAllots.length, " applied"), allotted > 0 && React.createElement("span", {
      style: {
        color: 'var(--profit)',
        fontWeight: 700
      }
    }, "· ✓ ", allotted, " allotted"), notAllot > 0 && React.createElement("span", {
      style: {
        color: 'var(--loss)',
        fontWeight: 700
      }
    }, "· ✗ ", notAllot, " not allotted"), pending > 0 && React.createElement("span", {
      style: {
        color: 'var(--warn)',
        fontWeight: 700
      }
    }, "· ⏳ ", pending, " pending")), (() => {
      const byCat = {},
        allotByCat = {};
      vAllots.forEach(a => {
        const c = changes[a.id]?.category ?? a.category;
        byCat[c] = (byCat[c] || 0) + 1;
        if ((changes[a.id]?.status ?? a.status) === 'allotted') allotByCat[c] = (allotByCat[c] || 0) + 1;
      });
      const cats = ['Retail', 'sHNI', 'bHNI', 'SME'].filter(c => byCat[c]);
      if (!cats.length) return null;
      return React.createElement("div", {
        style: {
          display: 'flex',
          gap: 5,
          flexWrap: 'wrap',
          marginTop: 6
        }
      }, cats.map(c => React.createElement("span", {
        key: c,
        style: {
          fontSize: 10.5,
          fontWeight: 700,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 999,
          padding: '2px 9px',
          color: 'var(--ink-2)'
        }
      }, vCatLabel(c), " · ", React.createElement("span", {
        style: {
          color: allotByCat[c] ? 'var(--profit)' : 'var(--ink-2)'
        }
      }, allotByCat[c] || 0), "/", byCat[c])));
    })())), React.createElement(IconButton, {
      name: "x",
      size: 32,
      onClick: closeView
    })), vAllots.length > 0 && React.createElement("div", {
      style: {
        padding: '10px 20px',
        background: 'var(--surface-2)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--ink-2)',
        fontWeight: 700
      }
    }, "Common sell price"), React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: 'var(--ink-3)',
        fontWeight: 600
      }
    }, "fills all via \"✓ All got\"")), React.createElement("input", {
      type: "number",
      min: "0",
      step: "0.05",
      value: viewListPrice,
      onChange: e => setViewListPrice(e.target.value),
      placeholder: "e.g. 415.00",
      style: {
        ...inputSt,
        width: 110,
        padding: '5px 9px',
        fontSize: 13,
        textAlign: 'right'
      }
    }), issuePrice > 0 && React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--ink-3)',
        fontWeight: 600
      }
    }, "Issue: ₹", issuePrice), lp > 0 && issuePrice > 0 && React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        color: lp >= issuePrice ? 'var(--profit)' : 'var(--loss)'
      }
    }, lp >= issuePrice ? '+' : '', Math.round((lp - issuePrice) / issuePrice * 100), "%")), React.createElement("div", {
      style: {
        marginLeft: 'auto',
        display: 'flex',
        gap: 6
      }
    }, React.createElement("button", {
      onClick: () => setPasteOpen(o => !o),
      style: {
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--r-sm)',
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 700,
        background: pasteOpen ? 'var(--bg)' : 'transparent',
        color: 'var(--ink-2)',
        cursor: 'pointer'
      }
    }, "⇥ Paste results"), React.createElement("button", {
      onClick: markAllotted,
      style: {
        border: '1px solid var(--profit)',
        borderRadius: 'var(--r-sm)',
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 700,
        background: 'var(--profit-soft)',
        color: 'var(--profit)',
        cursor: 'pointer'
      }
    }, "✓ All got"), React.createElement("button", {
      onClick: markNone,
      style: {
        border: '1px solid var(--loss)',
        borderRadius: 'var(--r-sm)',
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 700,
        background: 'var(--loss-soft)',
        color: 'var(--loss)',
        cursor: 'pointer'
      }
    }, "✗ None got"))), pasteOpen && vAllots.length > 0 && React.createElement("div", {
      style: {
        padding: '12px 20px',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        color: 'var(--ink-2)'
      }
    }, "Paste the registrar's allotment results"), React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        marginTop: 2,
        marginBottom: 8
      }
    }, "One PAN per line with the shares allotted — commas, tabs or spaces all work. Zero or no number means not allotted. Headings and totals are ignored."), React.createElement("textarea", {
      value: pasteText,
      onChange: e => setPasteText(e.target.value),
      rows: 5,
      placeholder: 'ABCDE1234F\t30\nFGHIJ5678K\t0',
      style: {
        ...inputSt,
        width: '100%',
        fontSize: 12.5,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        resize: 'vertical'
      }
    }), pasteText.trim() && React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginTop: 8,
        flexWrap: 'wrap'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-2)',
        fontWeight: 600,
        flex: 1,
        minWidth: 200
      }
    }, pasteMatched.length === 0 ? React.createElement("span", {
      style: {
        color: 'var(--loss)'
      }
    }, "No pasted PAN matches an applicant for this IPO.") : React.createElement(React.Fragment, null, React.createElement("strong", null, pasteMatched.length), " of ", vAllots.length, " applicants matched", ' · ', React.createElement("span", {
      style: {
        color: 'var(--profit)',
        fontWeight: 700
      }
    }, "✓ ", pasteGot), ' · ', React.createElement("span", {
      style: {
        color: 'var(--loss)',
        fontWeight: 700
      }
    }, "✗ ", pasteMatched.length - pasteGot), pasteUnknown.length > 0 && React.createElement("div", {
      style: {
        color: 'var(--warn)',
        fontSize: 11,
        fontWeight: 600,
        marginTop: 3
      }
    }, pasteUnknown.length, " PAN", pasteUnknown.length !== 1 ? 's' : '', " not in this IPO — skipped: ", pasteUnknown.slice(0, 3).map(r => r.pan).join(', '), pasteUnknown.length > 3 ? '…' : ''), pasteParsed.skipped.length > 0 && React.createElement("div", {
      style: {
        color: 'var(--ink-3)',
        fontSize: 11,
        marginTop: 2
      }
    }, pasteParsed.skipped.length, " line", pasteParsed.skipped.length !== 1 ? 's' : '', " without a PAN ignored"))), React.createElement(Button, {
      variant: "primary",
      size: "sm",
      disabled: pasteMatched.length === 0,
      onClick: applyPaste
    }, "Fill ", pasteMatched.length, " row", pasteMatched.length !== 1 ? 's' : '')), React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        marginTop: 6
      }
    }, "Nothing is saved yet — review the table below, then click Save changes.")), vAllots.length > 1 && React.createElement("div", {
      style: {
        padding: '8px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        flexShrink: 0
      }
    }, React.createElement("input", {
      value: allotQuery,
      onChange: e => setAllotQuery(e.target.value),
      placeholder: "Search name, member or PAN…",
      "aria-label": "Search applicants",
      style: {
        ...inputSt,
        flex: '1 1 160px',
        maxWidth: 230,
        padding: '6px 10px',
        fontSize: 13
      }
    }), React.createElement("select", {
      value: allotSort,
      onChange: e => setAllotSort(e.target.value),
      "aria-label": "Sort applicants",
      style: {
        ...inputSt,
        width: 'auto',
        padding: '6px 8px',
        fontSize: 12.5,
        fontWeight: 700,
        cursor: 'pointer'
      }
    }, Object.entries(ALLOT_SORTS).map(([k, [label]]) => React.createElement("option", {
      key: k,
      value: k
    }, "Sort: ", label))), React.createElement("div", {
      style: {
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap'
      }
    }, ALLOT_FILTERS.map(([k, label]) => {
      const n = k === 'all' ? vAllots.length : vAllots.filter(a => curStatus(a) === k).length;
      const on = allotFilter === k;
      return React.createElement("button", {
        key: k,
        onClick: () => setAllotFilter(k),
        style: {
          border: '1px solid ' + (on ? 'var(--brand)' : 'var(--border)'),
          borderRadius: 999,
          background: on ? 'var(--brand-tint)' : 'var(--surface)',
          color: on ? 'var(--brand)' : 'var(--ink-2)',
          fontSize: 11.5,
          fontWeight: 700,
          padding: '4px 9px',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }
      }, label, " ", React.createElement("span", {
        style: {
          opacity: .7
        }
      }, n));
    }))), React.createElement("div", {
      style: {
        overflowY: 'auto',
        flex: 1
      }
    }, vAllots.length === 0 ? React.createElement("div", {
      style: {
        padding: '40px 22px',
        textAlign: 'center',
        color: 'var(--ink-3)',
        fontSize: 13
      }
    }, "No applications recorded yet. Use \"Who applied?\" when adding the IPO.") : React.createElement(React.Fragment, null, React.createElement("table", {
      className: "table-desktop",
      style: {
        width: '100%',
        borderCollapse: 'collapse'
      }
    }, React.createElement("thead", null, React.createElement("tr", {
      style: {
        fontSize: 11,
        color: 'var(--ink-3)',
        textTransform: 'uppercase',
        letterSpacing: '.04em',
        background: 'var(--surface-2)',
        position: 'sticky',
        top: 0,
        zIndex: 1
      }
    }, React.createElement("th", {
      style: {
        fontWeight: 700,
        padding: '9px 8px 9px 16px',
        textAlign: 'left'
      }
    }, "Applicant"), React.createElement("th", {
      style: {
        fontWeight: 700,
        padding: '9px 8px',
        textAlign: 'left',
        width: 96
      }
    }, "Cat"), React.createElement("th", {
      style: {
        fontWeight: 700,
        padding: '9px 8px',
        textAlign: 'center'
      }
    }, "Status"), React.createElement("th", {
      style: {
        fontWeight: 700,
        padding: '9px 8px',
        textAlign: 'right'
      }
    }, React.createElement("div", null, "Allotted"), React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--ink-3)',
        marginTop: 1
      }
    }, "lots or shares")), React.createElement("th", {
      style: {
        fontWeight: 700,
        padding: '9px 8px',
        textAlign: 'right'
      }
    }, React.createElement("div", null, "Sell Price ₹/share"), React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--ink-3)',
        marginTop: 1
      }
    }, "per allottee")), React.createElement("th", {
      style: {
        width: 36
      }
    }))), React.createElement("tbody", null, shownAllots.length === 0 && React.createElement("tr", null, React.createElement("td", {
      colSpan: 6,
      style: {
        padding: '24px 16px',
        textAlign: 'center',
        color: 'var(--ink-3)',
        fontSize: 13
      }
    }, "No applicants match.", ' ', React.createElement("button", {
      onClick: () => {
        setAllotQuery('');
        setAllotFilter('all');
      },
      style: {
        border: 'none',
        background: 'none',
        color: 'var(--brand)',
        fontWeight: 700,
        cursor: 'pointer',
        padding: 0
      }
    }, "Show all"))), shownAllots.map(a => {
      const panObj = D.pan(a.pan);
      const mem = panObj ? D.member(panObj.member) : null;
      const category = changes[a.id]?.category ?? a.category;
      const status = changes[a.id]?.status ?? a.status;
      const shares = changes[a.id]?.shares ?? a.shares;
      const gain = changes[a.id]?.gain ?? a.gain;
      const sellPrice = changes[a.id]?.sellPrice ?? (a.sellPrice != null ? String(a.sellPrice) : '');
      const rowBg = status === 'allotted' ? 'var(--profit-soft)' : status === 'not_allotted' ? 'var(--loss-soft)' : 'transparent';
      const sp = parseFloat(sellPrice) || 0;
      const computedGain = sp > 0 && issuePrice > 0 ? window.rowGain(status, sp, issuePrice, shares) : gain;
      return React.createElement("tr", {
        key: a.id,
        style: {
          borderTop: '1px solid var(--border)',
          background: rowBg
        }
      }, React.createElement("td", {
        style: {
          padding: '10px 8px 10px 16px'
        }
      }, React.createElement("div", {
        style: {
          fontSize: 13,
          fontWeight: 700
        }
      }, panObj?.holder || '—'), React.createElement("div", {
        style: {
          fontSize: 11.5,
          color: 'var(--ink-3)'
        }
      }, mem?.name, panObj?.pan ? ' · ' + panObj.pan : '')), React.createElement("td", {
        style: {
          padding: '10px 8px'
        }
      }, (() => {
        const options = vCats.includes(category) ? vCats : [...vCats, category];
        return React.createElement("select", {
          value: category,
          onChange: e => setChange(a.id, 'category', e.target.value),
          style: {
            ...inputSt,
            width: 96,
            padding: '5px 6px',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer'
          }
        }, options.map(c => React.createElement("option", {
          key: c,
          value: c
        }, vCatLabel(c))));
      })()), React.createElement("td", {
        style: {
          padding: '10px 8px',
          textAlign: 'center'
        }
      }, React.createElement("div", {
        style: {
          display: 'inline-flex',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: 3,
          gap: 2
        }
      }, [['allotted', '✓', 'var(--profit)', 'var(--profit-soft)'], ['not_allotted', '✗', 'var(--loss)', 'var(--loss-soft)'], ['pending', '—', 'var(--ink-2)', 'var(--surface-2)']].map(([val, lbl, col, bg]) => React.createElement("button", {
        key: val,
        onClick: () => markStatus(a, val),
        style: {
          border: 'none',
          borderRadius: 'calc(var(--r-md) - 3px)',
          padding: '5px 10px',
          fontSize: 14,
          fontWeight: 800,
          background: status === val ? bg : 'transparent',
          color: status === val ? col : 'var(--ink-3)',
          boxShadow: status === val ? 'var(--sh-sm)' : 'none',
          cursor: 'pointer',
          transition: 'all .15s'
        }
      }, lbl)))), React.createElement("td", {
        style: {
          padding: '8px',
          textAlign: 'right'
        }
      }, React.createElement("div", {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 3
        }
      }, React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          opacity: status === 'allotted' ? 1 : 0.45
        }
      }, React.createElement("span", {
        style: {
          fontSize: 10,
          color: 'var(--ink-3)',
          fontWeight: 700,
          marginRight: 1
        }
      }, "got"), vIpo?.lotSize > 0 && React.createElement(React.Fragment, null, React.createElement("input", {
        type: "number",
        min: "0",
        "aria-label": "Lots allotted",
        title: "Lots allotted — converts to shares",
        value: parseInt(shares) > 0 && parseInt(shares) % vIpo.lotSize === 0 ? parseInt(shares) / vIpo.lotSize : '',
        onChange: e => updateAllotLots(a, e.target.value),
        placeholder: "0",
        style: {
          ...inputSt,
          width: 42,
          padding: '5px 5px',
          fontSize: 13,
          textAlign: 'right'
        }
      }), React.createElement("span", {
        style: {
          fontSize: 10,
          color: 'var(--ink-3)'
        }
      }, "lots"), React.createElement("span", {
        style: {
          fontSize: 12,
          color: 'var(--ink-3)',
          margin: '0 1px'
        }
      }, "=")), React.createElement("input", {
        type: "number",
        min: "0",
        "aria-label": "Shares allotted",
        value: status !== 'allotted' && !(parseInt(shares) > 0) ? '' : shares,
        onChange: e => updateShares(a, e.target.value),
        placeholder: "0",
        style: {
          ...inputSt,
          width: 66,
          padding: '5px 7px',
          fontSize: 13,
          textAlign: 'right'
        }
      }), React.createElement("span", {
        style: {
          fontSize: 10,
          color: 'var(--ink-3)'
        }
      }, "sh")), React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }
      }, React.createElement("span", {
        style: {
          fontSize: 10,
          color: 'var(--ink-3)'
        }
      }, "applied"), React.createElement(LotsInput, {
        value: changes[a.id]?.lots ?? a.lots ?? 1,
        cat: category,
        ipo: vIpo,
        compact: true,
        onChange: v => setChange(a.id, 'lots', v)
      }), React.createElement("span", {
        style: {
          fontSize: 10,
          color: 'var(--ink-3)'
        }
      }, "lots")))), React.createElement("td", {
        style: {
          padding: '6px 8px',
          textAlign: 'right'
        }
      }, status === 'allotted' ? React.createElement(React.Fragment, null, React.createElement("input", {
        type: "number",
        min: "0",
        step: "0.05",
        value: sellPrice,
        onChange: e => {
          const sp = parseFloat(e.target.value) || 0;
          const sh = parseInt(changes[a.id]?.shares ?? a.shares) || 0;
          const g = window.rowGain(status, sp, issuePrice, sh);
          setChanges(prev => ({
            ...prev,
            [a.id]: {
              ...(prev[a.id] || {}),
              sellPrice: e.target.value,
              gain: g
            }
          }));
        },
        placeholder: lp > 0 ? String(lp) : 'e.g. 415.00',
        style: {
          ...inputSt,
          width: 104,
          padding: '6px 8px',
          fontSize: 13,
          textAlign: 'right'
        }
      }), computedGain !== 0 && React.createElement("div", {
        className: "num",
        style: {
          fontSize: 11.5,
          color: computedGain > 0 ? 'var(--profit)' : 'var(--loss)',
          fontWeight: 700,
          marginTop: 2
        }
      }, "= ", computedGain > 0 ? '+' : '−', D.fmtINR(Math.abs(computedGain), {
        compact: true
      }), " ", computedGain > 0 ? 'gain' : 'loss')) : React.createElement("span", {
        style: {
          color: 'var(--ink-3)',
          fontSize: 14
        }
      }, "—")), React.createElement("td", {
        style: {
          padding: '6px 8px 6px 4px',
          textAlign: 'center'
        }
      }, React.createElement("div", {
        style: {
          display: 'inline-flex',
          gap: 2,
          alignItems: 'center'
        }
      }, React.createElement(IconButton, {
        name: "groups",
        size: 22,
        active: !!D.fundingFor(a.appId).mode,
        tip: D.fundingFor(a.appId).mode ? 'Funding group set — edit' : 'Set funding group (who funded this PAN)',
        onClick: () => setFundingApp(a)
      }), status === 'pending' && React.createElement(IconButton, {
        name: "trash",
        size: 22,
        tip: "Remove applicant",
        onClick: () => askConfirm('Remove applicant', `Remove ${panObj?.holder || 'this applicant'} from ${vIpo?.name}? This cannot be undone.`, async () => {
          await D.mutations.removeApplicant(a.id);
          setViewIpoId(null);
          setChanges({});
          setSaved(false);
        }, true, 'Remove')
      }))));
    }))), React.createElement("div", {
      className: "cards-mobile"
    }, shownAllots.length === 0 && React.createElement("div", {
      style: {
        padding: '24px 16px',
        textAlign: 'center',
        color: 'var(--ink-3)',
        fontSize: 13
      }
    }, "No applicants match.", ' ', React.createElement("button", {
      onClick: () => {
        setAllotQuery('');
        setAllotFilter('all');
      },
      style: {
        border: 'none',
        background: 'none',
        color: 'var(--brand)',
        fontWeight: 700,
        cursor: 'pointer',
        padding: 0
      }
    }, "Show all")), shownAllots.map(a => {
      const panObj = D.pan(a.pan);
      const mem = panObj ? D.member(panObj.member) : null;
      const category = changes[a.id]?.category ?? a.category;
      const status = changes[a.id]?.status ?? a.status;
      const shares = changes[a.id]?.shares ?? a.shares;
      const gain = changes[a.id]?.gain ?? a.gain;
      const sellPrice = changes[a.id]?.sellPrice ?? (a.sellPrice != null ? String(a.sellPrice) : '');
      const rowBg = status === 'allotted' ? 'var(--profit-soft)' : status === 'not_allotted' ? 'var(--loss-soft)' : 'var(--surface)';
      const sp = parseFloat(sellPrice) || 0;
      const computedGain = sp > 0 && issuePrice > 0 ? window.rowGain(status, sp, issuePrice, shares) : gain;
      const catOptions = vCats.includes(category) ? vCats : [...vCats, category];
      return React.createElement("div", {
        key: a.id,
        style: {
          borderTop: '1px solid var(--border)',
          background: rowBg,
          padding: '12px 14px'
        }
      }, React.createElement("div", {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8
        }
      }, React.createElement("div", {
        style: {
          minWidth: 0
        }
      }, React.createElement("div", {
        style: {
          fontSize: 14,
          fontWeight: 700
        }
      }, panObj?.holder || '—'), React.createElement("div", {
        style: {
          fontSize: 11.5,
          color: 'var(--ink-3)'
        }
      }, mem?.name, panObj?.pan ? ' · ' + panObj.pan : '')), React.createElement("div", {
        style: {
          display: 'inline-flex',
          gap: 4,
          alignItems: 'center',
          flexShrink: 0
        }
      }, React.createElement(IconButton, {
        name: "groups",
        size: 26,
        active: !!D.fundingFor(a.appId).mode,
        tip: D.fundingFor(a.appId).mode ? 'Funding group set — edit' : 'Set funding group (who funded this PAN)',
        onClick: () => setFundingApp(a)
      }), status === 'pending' && React.createElement(IconButton, {
        name: "trash",
        size: 26,
        tip: "Remove applicant",
        onClick: () => askConfirm('Remove applicant', `Remove ${panObj?.holder || 'this applicant'} from ${vIpo?.name}? This cannot be undone.`, async () => {
          await D.mutations.removeApplicant(a.id);
          setViewIpoId(null);
          setChanges({});
          setSaved(false);
        }, true, 'Remove')
      }))), React.createElement("div", {
        style: {
          display: 'flex',
          gap: 8,
          marginTop: 10,
          flexWrap: 'wrap',
          alignItems: 'center'
        }
      }, React.createElement("div", {
        style: {
          display: 'inline-flex',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: 3,
          gap: 2
        }
      }, [['allotted', '✓', 'var(--profit)', 'var(--profit-soft)'], ['not_allotted', '✗', 'var(--loss)', 'var(--loss-soft)'], ['pending', '—', 'var(--ink-2)', 'var(--surface-2)']].map(([val, lbl, col, bg]) => React.createElement("button", {
        key: val,
        onClick: () => markStatus(a, val),
        style: {
          border: 'none',
          borderRadius: 'calc(var(--r-md) - 3px)',
          padding: '7px 15px',
          fontSize: 15,
          fontWeight: 800,
          background: status === val ? bg : 'transparent',
          color: status === val ? col : 'var(--ink-3)',
          boxShadow: status === val ? 'var(--sh-sm)' : 'none',
          cursor: 'pointer'
        }
      }, lbl))), React.createElement("select", {
        value: category,
        onChange: e => setChange(a.id, 'category', e.target.value),
        style: {
          ...inputSt,
          width: 'auto',
          padding: '7px 8px',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer'
        }
      }, catOptions.map(c => React.createElement("option", {
        key: c,
        value: c
      }, vCatLabel(c))))), React.createElement("div", {
        style: {
          display: 'flex',
          gap: 16,
          marginTop: 10,
          flexWrap: 'wrap',
          alignItems: 'flex-end'
        }
      }, React.createElement("div", null, React.createElement("div", {
        style: {
          fontSize: 10,
          color: 'var(--ink-3)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '.04em',
          marginBottom: 4
        }
      }, "Allotted"), React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          opacity: status === 'allotted' ? 1 : 0.5
        }
      }, React.createElement("span", {
        style: {
          fontSize: 10.5,
          color: 'var(--ink-3)',
          fontWeight: 700
        }
      }, "got"), vIpo?.lotSize > 0 && React.createElement(React.Fragment, null, React.createElement("input", {
        type: "number",
        min: "0",
        "aria-label": "Lots allotted",
        value: parseInt(shares) > 0 && parseInt(shares) % vIpo.lotSize === 0 ? parseInt(shares) / vIpo.lotSize : '',
        onChange: e => updateAllotLots(a, e.target.value),
        placeholder: "0",
        style: {
          ...inputSt,
          width: 48,
          padding: '7px 6px',
          fontSize: 14,
          textAlign: 'right'
        }
      }), React.createElement("span", {
        style: {
          fontSize: 10.5,
          color: 'var(--ink-3)'
        }
      }, "lots"), React.createElement("span", {
        style: {
          fontSize: 12,
          color: 'var(--ink-3)'
        }
      }, "=")), React.createElement("input", {
        type: "number",
        min: "0",
        "aria-label": "Shares allotted",
        value: status !== 'allotted' && !(parseInt(shares) > 0) ? '' : shares,
        onChange: e => updateShares(a, e.target.value),
        placeholder: "0",
        style: {
          ...inputSt,
          width: 74,
          padding: '7px 8px',
          fontSize: 14,
          textAlign: 'right'
        }
      }), React.createElement("span", {
        style: {
          fontSize: 10.5,
          color: 'var(--ink-3)'
        }
      }, "sh")), React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginTop: 5
        }
      }, React.createElement("span", {
        style: {
          fontSize: 10.5,
          color: 'var(--ink-3)'
        }
      }, "applied"), React.createElement(LotsInput, {
        value: changes[a.id]?.lots ?? a.lots ?? 1,
        cat: category,
        ipo: vIpo,
        compact: true,
        onChange: v => setChange(a.id, 'lots', v)
      }), React.createElement("span", {
        style: {
          fontSize: 10.5,
          color: 'var(--ink-3)'
        }
      }, "lots"))), status === 'allotted' && React.createElement("div", null, React.createElement("div", {
        style: {
          fontSize: 10,
          color: 'var(--ink-3)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '.04em',
          marginBottom: 4
        }
      }, "Sell ₹/share"), React.createElement("input", {
        type: "number",
        min: "0",
        step: "0.05",
        value: sellPrice,
        onChange: e => {
          const sp2 = parseFloat(e.target.value) || 0;
          const sh = parseInt(changes[a.id]?.shares ?? a.shares) || 0;
          const g = window.rowGain(status, sp2, issuePrice, sh);
          setChanges(prev => ({
            ...prev,
            [a.id]: {
              ...(prev[a.id] || {}),
              sellPrice: e.target.value,
              gain: g
            }
          }));
        },
        placeholder: lp > 0 ? String(lp) : 'e.g. 415.00',
        style: {
          ...inputSt,
          width: 112,
          padding: '7px 8px',
          fontSize: 14,
          textAlign: 'right'
        }
      }), computedGain !== 0 && React.createElement("div", {
        className: "num",
        style: {
          fontSize: 11.5,
          color: computedGain > 0 ? 'var(--profit)' : 'var(--loss)',
          fontWeight: 700,
          marginTop: 3
        }
      }, "= ", computedGain > 0 ? '+' : '−', D.fmtINR(Math.abs(computedGain), {
        compact: true
      }), " ", computedGain > 0 ? 'gain' : 'loss'))));
    })))), React.createElement("div", {
      style: {
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        background: 'var(--surface-2)',
        gap: 10,
        flexWrap: 'wrap'
      }
    }, React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--ink-3)'
      }
    }, saved && React.createElement("span", {
      style: {
        color: 'var(--profit)',
        fontWeight: 700
      }
    }, "✓ Changes saved"), !saved && hasDirty && React.createElement("span", {
      style: {
        color: 'var(--warn)',
        fontWeight: 600
      }
    }, "Unsaved changes")), React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        marginLeft: 'auto'
      }
    }, React.createElement(Button, {
      variant: "ghost",
      icon: "plus",
      onClick: () => openAddApplicants(viewIpoId)
    }, "Add applicants"), React.createElement(Button, {
      variant: "ghost",
      onClick: closeView
    }, "Close"), vAllots.length > 0 && React.createElement(Button, {
      variant: "primary",
      icon: saved ? 'check' : 'upload',
      onClick: () => saveChanges(vAllots),
      style: {
        opacity: saving ? .7 : 1,
        pointerEvents: saving ? 'none' : 'auto'
      }
    }, saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes')))));
  })(), addAppIpoId && (() => {
    const aIpo = D.ipo(addAppIpoId);
    const isSME = aIpo?.type === 'SME';
    const cats = ['Retail', 'sHNI', 'bHNI'];
    const catLabel = c => isSME && c === 'Retail' ? 'Individual' : c;
    const panIds = Object.keys(addAppSel);
    const selCount = Object.values(addAppSel).filter(v => v.selected).length;
    const flatPans = D.pans.filter(p => panIds.includes(p.id)).map(p => ({
      ...p,
      mem: D.member(p.member)
    }));
    const toggle = panId => setAddAppSel(prev => ({
      ...prev,
      [panId]: {
        ...prev[panId],
        selected: !prev[panId]?.selected
      }
    }));
    return React.createElement(Modal, {
      title: `Add applicants — ${aIpo?.name || ''}`,
      onClose: () => setAddAppIpoId(null)
    }, flatPans.length === 0 ? React.createElement("div", {
      style: {
        padding: '12px 0',
        textAlign: 'center',
        color: 'var(--ink-3)',
        fontSize: 13
      }
    }, "All PANs have already applied to this IPO.") : React.createElement(React.Fragment, null, React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, React.createElement("span", {
      style: {
        fontSize: 13,
        color: 'var(--ink-3)'
      }
    }, React.createElement("strong", {
      style: {
        color: 'var(--ink)'
      }
    }, selCount), " of ", flatPans.length, " selected · tap a row to select"), React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6
      }
    }, React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      onClick: () => setAddAppSel(p => {
        const n = {
          ...p
        };
        Object.keys(n).forEach(id => {
          n[id] = {
            ...n[id],
            selected: true
          };
        });
        return n;
      })
    }, "All"), React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      onClick: () => setAddAppSel(p => {
        const n = {
          ...p
        };
        Object.keys(n).forEach(id => {
          n[id] = {
            ...n[id],
            selected: false
          };
        });
        return n;
      })
    }, "None"))), React.createElement("div", {
      style: {
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        maxHeight: 'min(380px, 45dvh)',
        overflowY: 'auto'
      }
    }, flatPans.map((p, i) => {
      const sel = addAppSel[p.id] || {
        selected: false,
        category: cats[0]
      };
      return React.createElement("div", {
        key: p.id,
        onClick: () => toggle(p.id),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '11px 16px',
          borderTop: i === 0 ? 'none' : '1px solid var(--border)',
          background: sel.selected ? 'var(--brand-tint)' : 'transparent',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background .12s'
        }
      }, React.createElement("div", {
        style: {
          width: 22,
          height: 22,
          borderRadius: '50%',
          flexShrink: 0,
          border: sel.selected ? '2px solid var(--brand)' : '2px solid var(--border)',
          background: sel.selected ? 'var(--brand)' : 'transparent',
          display: 'grid',
          placeItems: 'center',
          transition: 'all .12s'
        }
      }, sel.selected && React.createElement("svg", {
        width: "12",
        height: "12",
        viewBox: "0 0 12 12",
        fill: "none",
        stroke: "#fff",
        strokeWidth: "2.5",
        strokeLinecap: "round"
      }, React.createElement("polyline", {
        points: "2,6 5,9 10,3"
      }))), React.createElement(Avatar, {
        name: p.holder,
        hue: p.mem?.avatarHue || 200,
        size: 34
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
      }, p.holder), React.createElement("div", {
        className: "num",
        style: {
          fontSize: 11.5,
          color: 'var(--ink-3)',
          letterSpacing: '.04em',
          fontWeight: 700
        }
      }, p.pan), React.createElement("div", {
        style: {
          fontSize: 11.5,
          color: 'var(--ink-3)',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          flexWrap: 'wrap'
        }
      }, p.mem && React.createElement("span", null, p.mem.name), React.createElement(Badge, {
        tone: {
          Self: 'brand',
          Spouse: 'info',
          Friend: 'neutral'
        }[p.relation] || 'neutral'
      }, p.relation || 'Self'))), React.createElement("select", {
        style: {
          ...inputSt,
          width: 96,
          padding: '5px 7px',
          fontSize: 12.5,
          opacity: sel.selected ? 1 : .35
        },
        value: sel.category,
        disabled: !sel.selected,
        onClick: e => e.stopPropagation(),
        onChange: e => {
          e.stopPropagation();
          const cat = e.target.value;
          setAddAppSel(prev => ({
            ...prev,
            [p.id]: {
              ...prev[p.id],
              category: cat,
              lots: window.defaultLotsFor(cat, D.ipo(addAppIpoId))
            }
          }));
        }
      }, cats.map(c => React.createElement("option", {
        key: c,
        value: c
      }, catLabel(c)))), React.createElement(LotsInput, {
        value: sel.lots ?? 1,
        onChange: v => setAddAppSel(prev => ({
          ...prev,
          [p.id]: {
            ...prev[p.id],
            lots: v
          }
        })),
        cat: sel.category,
        ipo: D.ipo(addAppIpoId),
        disabled: !sel.selected,
        compact: true
      }));
    }))), addAppErr && React.createElement("div", {
      style: {
        color: 'var(--loss)',
        fontSize: 13,
        fontWeight: 600
      }
    }, addAppErr), React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        justifyContent: 'flex-end'
      }
    }, React.createElement(Button, {
      variant: "ghost",
      onClick: () => setAddAppIpoId(null)
    }, "Cancel"), flatPans.length > 0 && React.createElement(Button, {
      variant: "primary",
      onClick: saveAddApplicants,
      style: {
        opacity: addAppSaving || selCount === 0 ? .6 : 1,
        pointerEvents: addAppSaving || selCount === 0 ? 'none' : 'auto'
      }
    }, addAppSaving ? 'Adding…' : selCount > 0 ? `Add ${selCount} applicant${selCount !== 1 ? 's' : ''}` : 'Select applicants')));
  })(), fundingApp && (() => {
    const p = D.pan(fundingApp.pan);
    return React.createElement(FundingGroupModal, {
      appId: fundingApp.appId,
      holderPanId: fundingApp.pan,
      ipoId: fundingApp.ipo,
      holderName: p?.holder || 'this PAN',
      category: fundingApp.category,
      onClose: () => setFundingApp(null),
      onDone: () => {
        setFundingApp(null);
        setIpos([...window.DB.ipos]);
      }
    });
  })(), React.createElement(ConfirmDialog, {
    dlg: confirmDlg,
    onClose: () => setConfirmDlg(null)
  }), notice && React.createElement("div", {
    role: "alert",
    style: {
      position: 'fixed',
      left: 16,
      right: 16,
      bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
      zIndex: 80,
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'none'
    }
  }, React.createElement("div", {
    style: {
      pointerEvents: 'auto',
      maxWidth: 520,
      width: '100%',
      background: 'var(--surface)',
      border: '1px solid var(--loss)',
      borderLeft: '4px solid var(--loss)',
      borderRadius: 'var(--r-md)',
      boxShadow: 'var(--sh-pop)',
      padding: '12px 14px',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 13.5,
      color: 'var(--ink)',
      lineHeight: 1.5
    }
  }, React.createElement("div", {
    style: {
      fontWeight: 800,
      color: 'var(--loss)',
      marginBottom: 2
    }
  }, "Couldn't complete that"), notice), React.createElement(IconButton, {
    name: "x",
    size: 28,
    tip: "Dismiss",
    onClick: () => setNotice(null)
  }))));
}
Object.assign(window, {
  PanManagement,
  AdminPanel
});