/* ============================================================
   IPO Pool — PAN Management & Admin Panel
   ============================================================ */

// Indian PAN: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
function panError(pan) {
  const v = (pan || '').toUpperCase().trim();
  if (!v) return 'PAN is required.';
  if (!PAN_RE.test(v)) return 'Enter a valid PAN (5 letters, 4 digits, 1 letter — e.g. ABCDE1234F).';
  return null;
}
// Is this PAN already registered? Returns the existing holder name, or null.
function duplicatePanHolder(pan, excludeId) {
  const v = (pan || '').toUpperCase().trim();
  const hit = (window.DB.pans || []).find(p => (p.pan || '').toUpperCase() === v && p.id !== excludeId);
  return hit ? (hit.holder || 'another member') : null;
}
// Turn a raw Postgres/Supabase error into something a pool admin can act on.
function friendlyDbError(e) {
  const m = (e && e.message) || String(e);
  if (/duplicate key|already exists|unique constraint/i.test(m)) {
    if (/pan/i.test(m))   return 'This PAN is already registered in the pool.';
    if (/email/i.test(m)) return 'That email is already used by another member.';
    return 'That entry already exists.';
  }
  return m;
}

// ── Shared modal wrapper ──────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 65, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div className="modal-card" style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', width: '100%', maxWidth: 460, boxShadow: 'var(--sh-pop)', overflow: 'hidden', animation: 'popIn .22s cubic-bezier(.2,.7,.3,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{title}</div>
          <IconButton name="x" size={32} onClick={onClose} />
        </div>
        <div style={{ padding: '20px 22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)' }}>{label}</label>
      {children}
    </div>
  );
}

const inputSt = {
  fontSize: 14, fontWeight: 600, padding: '10px 12px', width: '100%',
  border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)',
  background: 'var(--bg)', color: 'var(--ink)', outline: 'none',
};

// ── Confirm dialog (replaces browser confirm()) ───────────────────────────────
// Entering the close date fills open / allotment / listing from SEBI's T+3
// timeline (window.ipoTimeline, db.js), skipping weekends and fixed-date holidays.
// The filled dates stay editable for the odd issue that runs longer.
function withAutoDates(form, closeDate) {
  const t = closeDate && window.ipoTimeline ? window.ipoTimeline(closeDate) : null;
  if (!t) return { ...form, closeDate };
  return { ...form, closeDate, openDate: t.open, allotDate: t.allot, listDate: t.list };
}
function AutoDateNote({ closeDate }) {
  const t = closeDate && window.ipoTimeline ? window.ipoTimeline(closeDate) : null;
  return (
    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5, marginTop: -4 }}>
      Enter the close date — open, allotment and listing fill in automatically (T+3, skipping Saturdays, Sundays and fixed-date holidays like 26 Jan, 15 Aug, 2 Oct). Festival holidays aren't included, so adjust those weeks by hand.
      {t?.closeWarning && <div style={{ color: 'var(--warn)', fontWeight: 700, marginTop: 3 }}>⚠ {t.closeWarning} — check the close date.</div>}
    </div>
  );
}

// Lots box used wherever the admin records an application. Pre-filled from
// defaultLotsFor (SME Individual = 2, sHNI/bHNI = their minimum) and warns —
// without blocking — when the number doesn't fit the category.
function LotsInput({ value, onChange, cat, ipo, disabled, compact }) {
  const warn = !disabled && window.lotsWarning ? window.lotsWarning(cat, value, ipo) : null;
  const lotSize = Number(ipo?.lotSize) || 0;
  const n = parseInt(value, 10) || 0;
  return (
    <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: compact ? 'flex-end' : 'flex-start', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input type="number" min="1" value={value} disabled={disabled} aria-label="Lots applied"
          onChange={e => onChange(e.target.value)}
          style={{ width: 52, padding: '5px 6px', fontSize: 12.5, fontWeight: 700, textAlign: 'right', border: '1px solid ' + (warn ? 'var(--warn)' : 'var(--border)'),
                   borderRadius: 'var(--r-sm)', background: 'var(--bg)', color: 'var(--ink)', opacity: disabled ? .35 : 1 }} />
        <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, opacity: disabled ? .35 : 1 }}>lot{n === 1 ? '' : 's'}</span>
      </div>
      {!disabled && lotSize > 0 && n > 0 && <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{(n * lotSize).toLocaleString('en-IN')} sh</span>}
      {warn && <span style={{ fontSize: 10.5, color: 'var(--warn)', fontWeight: 700, whiteSpace: 'nowrap' }}>{warn}</span>}
    </div>
  );
}

function ConfirmDialog({ dlg, onClose }) {
  if (!dlg) return null;
  const btnSt = dlg.danger
    ? { background: 'var(--loss)', color: '#fff', border: 'none', borderRadius: 'var(--r-md)', padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }
    : {};
  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 70, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div className="modal-card" style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', width: '100%', maxWidth: 380, boxShadow: 'var(--sh-pop)', overflow: 'hidden', animation: 'popIn .22s cubic-bezier(.2,.7,.3,1)' }}>
        <div style={{ padding: '18px 22px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {dlg.danger && <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239,68,68,.12)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="trash" size={16} color="var(--loss)" /></div>}
          <div style={{ fontSize: 15, fontWeight: 800 }}>{dlg.title}</div>
        </div>
        <div style={{ padding: '0 22px 20px', fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>{dlg.message}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {dlg.danger
            ? <button style={btnSt} onClick={() => { dlg.onConfirm(); onClose(); }}>{dlg.confirmLabel || 'Delete'}</button>
            : <Button variant="primary" onClick={() => { dlg.onConfirm(); onClose(); }}>{dlg.confirmLabel || 'Confirm'}</Button>
          }
        </div>
      </div>
    </div>
  );
}

// ── PAN Management (view own PANs) ────────────────────────────────────────────
function PanManagement() {
  const D    = window.DB;
  const me   = D.members.find(m => m.you);
  const pans = D.pans.filter(p => p.member === me?.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card pad={18} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Avatar name={me?.name || 'You'} hue={me?.avatarHue || 152} size={44} you />
        <div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{me?.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{me?.email} · {pans.length} PAN{pans.length !== 1 ? 's' : ''}</div>
        </div>
      </Card>

      <div className="pan-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))', gap: 14 }}>
        {pans.map((p, i) => {
          const apps = D.allotsOfPan(p.id).length;
          const relColors = { Self: 'brand', Spouse: 'info', Father: 'mainboard', Mother: 'sme', Son: 'profit', Daughter: 'profit', Brother: 'warn', Sister: 'warn', Friend: 'neutral' };
          return (
            <Card key={p.id} pad={0} style={{ overflow: 'hidden' }}>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Avatar name={p.holder} hue={(me.avatarHue + i * 40) % 360} size={40} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{p.holder}</div>
                      <Badge tone={relColors[p.relation] || 'neutral'}>{p.relation || 'Self'}</Badge>
                    </div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: p.status === 'Active' ? 'var(--profit)' : 'var(--warn)' }}>
                    <StatusDot tone={p.status === 'Active' ? 'profit' : 'warn'} /> {p.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>PAN NUMBER</div>
                    <div className="num" style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '.04em', marginTop: 2 }}>{p.pan}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>BANK</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{p.linkedBank || '—'}</div>
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
                <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>
                  <strong className="num" style={{ color: 'var(--ink)' }}>{apps}</strong> applications
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel() {
  const D   = window.DB;
  const f   = (n, o) => D.fmtINR(n, o);
  const [tab, setTab]   = useState('IPO Master');
  const tabs = ['IPO Master', 'Members'];

  // ── IPO Master state ──
  const [ipos, setIpos]         = useState(D.ipos);
  const [refreshing, setRefreshing]     = useState(false);
  const [refreshingId, setRefreshingId] = useState(null);   // ipo id being refreshed, or 'all'

  // Pull the latest data from Supabase (members apply via the shared link, so the
  // applied/allotted counts here can go stale). Reloads the whole dataset — there's
  // no per-IPO endpoint — but a per-row spinner shows which row was refreshed.
  // In-app error notice instead of the browser's alert() box: it stays on
  // screen above any open dialog until dismissed, and doesn't block the page.
  const [notice, setNotice] = useState(null);
  const showError = (msg) => setNotice(msg || 'Something went wrong.');

  const refreshData = async (ipoId) => {
    if (refreshing) return;
    setRefreshing(true); setRefreshingId(ipoId || 'all');
    try {
      await window.loadDB();
      setIpos([...window.DB.ipos]);
      setMembers([...window.DB.members]);
    } catch (e) { showError(friendlyDbError(e)); }
    setRefreshing(false); setRefreshingId(null);
  };
  const [addIpoStep, setAddIpoStep] = useState(null); // null | 'details' | 'applicants'
  const [newIpoId,  setNewIpoId]  = useState(null);
  const [ipoForm, setIpoForm]   = useState({ name: '', shortName: '', type: 'SME', price: '', lotSize: '', openDate: '', closeDate: '', allotDate: '', listDate: '' });
  const [editIpoId,   setEditIpoId]   = useState(null);
  const [editIpoForm, setEditIpoForm] = useState({ name: '', shortName: '', type: 'SME', price: '', lotSize: '', openDate: '', closeDate: '', allotDate: '', listDate: '' });
  const [editIpoSaving, setEditIpoSaving] = useState(false);
  const [editIpoErr,    setEditIpoErr]    = useState('');
  const [copiedIpo,     setCopiedIpo]     = useState(null);
  const [ipoSaving, setIpoSaving] = useState(false);
  const [ipoErr, setIpoErr]     = useState('');

  // applicant selections for step 2: { [panId]: { selected: bool, category: string } }
  const [applicantSel, setApplicantSel] = useState({});
  const [appSaving,    setAppSaving]    = useState(false);
  const [appErr,       setAppErr]       = useState('');

  const closeAddIpo = () => {
    setAddIpoStep(null); setNewIpoId(null); setApplicantSel({}); setIpoErr(''); setAppErr('');
    setIpoForm({ name: '', shortName: '', type: 'SME', price: '', lotSize: '', openDate: '', closeDate: '', allotDate: '', listDate: '' });
  };

  const saveIpo = async () => {
    if (!ipoForm.name || !ipoForm.type) { setIpoErr('Name and type are required.'); return; }
    setIpoSaving(true); setIpoErr('');
    try {
      const saved = await D.mutations.addIpo({ name: ipoForm.name, shortName: ipoForm.shortName, type: ipoForm.type, bandHigh: parseFloat(ipoForm.price)||null, lotSize: parseInt(ipoForm.lotSize)||null, openDate: ipoForm.openDate || null, closeDate: ipoForm.closeDate || null, allotDate: ipoForm.allotDate || null, listDate: ipoForm.listDate || null });
      setIpos([...window.DB.ipos]);
      setNewIpoId(saved.id);
      // Pre-populate applicant selections — all unchecked, default category by board type
      // Default category is always 'Retail' -- SME and Mainboard share the same
      // Retail/sHNI/bHNI category set since SEBI's 1 Jul 2025 rule, 'SME' is not
      // a selectable category value (see cats below).
      const defaults = {};
      const lots0 = window.defaultLotsFor('Retail', saved);
      window.DB.pans.forEach(p => { defaults[p.id] = { selected: false, category: 'Retail', lots: lots0 }; });
      setApplicantSel(defaults);
      setAddIpoStep('applicants');
    } catch(e) { setIpoErr(e.message); }
    setIpoSaving(false);
  };

  const saveApplications = async () => {
    const rows = Object.entries(applicantSel)
      .filter(([, v]) => v.selected)
      .map(([panId, v]) => ({ panId, category: v.category, lots: Math.max(1, parseInt(v.lots, 10) || 1) }));
    if (rows.length === 0) { closeAddIpo(); return; }
    setAppSaving(true); setAppErr('');
    try {
      await D.mutations.addApplications(newIpoId, rows);
      closeAddIpo();
    } catch(e) { setAppErr(e.message); }
    setAppSaving(false);
  };

  const togglePan  = (panId) => setApplicantSel(prev => ({ ...prev, [panId]: { ...prev[panId], selected: !prev[panId]?.selected } }));
  // Changing the category re-fills lots with that category's default.
  const setCat     = (panId, cat) => setApplicantSel(prev => ({ ...prev, [panId]: { ...prev[panId], category: cat, lots: window.defaultLotsFor(cat, D.ipo(newIpoId)) } }));
  const setLots    = (panId, lots) => setApplicantSel(prev => ({ ...prev, [panId]: { ...prev[panId], lots } }));
  const selectAll  = () => setApplicantSel(prev => { const n = {...prev}; Object.keys(n).forEach(id => { n[id] = {...n[id], selected: true}; }); return n; });
  const deselectAll = () => setApplicantSel(prev => { const n = {...prev}; Object.keys(n).forEach(id => { n[id] = {...n[id], selected: false}; }); return n; });

  const deleteIpo = (id, name) => askConfirm(
    `Delete "${name}"?`,
    'All applications and allotments for this IPO will also be permanently deleted.',
    async () => { try { await D.mutations.deleteIpo(id); setIpos([...window.DB.ipos]); } catch(e) { showError(e.message); } }
  );

  // Copy the shareable member apply link (#/apply/<ipoId>) to post in the group.
  const copyApplyLink = async (ip) => {
    // Copy a ready-to-send message (name, per-category lots/shares, link) rather
    // than just the bare URL, so the admin can paste it straight into WhatsApp.
    const msg = window.buildApplyMessage ? window.buildApplyMessage(ip) : window.applyLinkFor(ip.id);
    try { await navigator.clipboard.writeText(msg); }
    catch (e) { window.prompt('Copy this apply message:', msg); }
    setCopiedIpo(ip.id);
    setTimeout(() => setCopiedIpo(c => (c === ip.id ? null : c)), 1600);
  };

  const openEditIpo = (ip) => {
    setEditIpoId(ip.id);
    setEditIpoForm({ name: ip.name, shortName: ip.short || '', type: ip.type, price: ip.bandHigh || '', lotSize: ip.lotSize || '',
      openDate:  (ip.open      || '').slice(0, 10),
      closeDate: (ip.close     || '').slice(0, 10),
      allotDate: (ip.allotDate || '').slice(0, 10),
      listDate:  (ip.listDate  || '').slice(0, 10) });
    setEditIpoErr('');
  };

  const saveEditIpo = async () => {
    if (!editIpoForm.name) { setEditIpoErr('Name is required.'); return; }
    setEditIpoSaving(true); setEditIpoErr('');
    try {
      await D.mutations.updateIpo(editIpoId, {
        name: editIpoForm.name,
        shortName: editIpoForm.shortName,
        type: editIpoForm.type,
        bandHigh: parseFloat(editIpoForm.price) || null,
        lotSize: parseInt(editIpoForm.lotSize) || null,
        openDate: editIpoForm.openDate,
        closeDate: editIpoForm.closeDate,
        allotDate: editIpoForm.allotDate,
        listDate: editIpoForm.listDate,
      });
      setIpos([...window.DB.ipos]);
      setEditIpoId(null);
    } catch(e) { setEditIpoErr(e.message); }
    setEditIpoSaving(false);
  };

  const openAddApplicants = (ipoId) => {
    const alreadyApplied = new Set(D.allotsOfIpo(ipoId).map(a => a.pan));
    // Default category is always 'Retail' -- SME and Mainboard share the same
    // Retail/sHNI/bHNI category set since SEBI's 1 Jul 2025 rule, 'SME' is not
    // a selectable category value (see cats in the modal below).
    const defaults = {};
    const lots0 = window.defaultLotsFor('Retail', D.ipo(ipoId));
    D.pans.filter(p => !alreadyApplied.has(p.id)).forEach(p => {
      defaults[p.id] = { selected: false, category: 'Retail', lots: lots0 };
    });
    setAddAppSel(defaults);
    setAddAppIpoId(ipoId);
    setAddAppErr('');
  };

  const saveAddApplicants = async () => {
    const rows = Object.entries(addAppSel)
      .filter(([, v]) => v.selected)
      .map(([panId, v]) => ({ panId, category: v.category, lots: Math.max(1, parseInt(v.lots, 10) || 1) }));
    if (rows.length === 0) { setAddAppIpoId(null); return; }
    setAddAppSaving(true); setAddAppErr('');
    try {
      await D.mutations.addApplications(addAppIpoId, rows);
      setAddAppIpoId(null);
    } catch(e) { setAddAppErr(e.message); }
    setAddAppSaving(false);
  };

  // ── Allotment inline-edit state (used in the IPO applicants view modal) ──
  const [changes, setChanges] = useState({});
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  // Bulk paste of registrar results (see parseAllotmentPaste in db.js)
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  // Allotments window: search / sort / status filter for long applicant lists.
  const [allotQuery,  setAllotQuery]  = useState('');
  const [allotSort,   setAllotSort]   = useState('name');
  const [allotFilter, setAllotFilter] = useState('all');

  const setChange = (id, field, val) =>
    setChanges(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: val } }));

  const saveChanges = async (viewRows) => {
    setSaving(true); setSaved(false);
    try {
      const dirty = viewRows
        .map(a => {
          const c  = changes[a.id] || {};
          const status = c.status ?? a.status;
          const rawSp = c.sellPrice ?? (a.sellPrice != null ? String(a.sellPrice) : '');
          const sp = parseFloat(rawSp) || 0;
          const bandHigh = window.DB.ipo(a.ipo)?.bandHigh || 0;
          // Anything not allotted carries no shares, gain or sell price — an
          // application that got nothing must not survive as profit.
          const allotted = status === 'allotted';
          const sh = allotted ? (parseInt(c.shares ?? a.shares) || 0) : 0;
          const computedGain = sp > 0 && bandHigh > 0
            ? window.rowGain(status, sp, bandHigh, sh)
            : (allotted ? parseFloat(c.gain ?? a.gain) || 0 : 0);
          return {
            id:        a.id,
            appId:     a.appId,
            lots:      Math.max(1, parseInt(c.lots ?? a.lots, 10) || 1),
            category:  c.category ?? a.category,
            status:    status,
            shares:    sh,
            gain:      computedGain,
            sellPrice: allotted && sp > 0 ? sp : null,
          };
        })
        .filter((r, i) => {
          const a = viewRows[i];
          return r.lots !== (a.lots || 1) || r.category !== a.category || r.status !== a.status || r.shares !== a.shares || r.gain !== a.gain || r.sellPrice !== a.sellPrice;
        });
      if (dirty.length === 0) { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); return; }
      await D.mutations.saveAllotmentChanges(dirty);
      setChanges({});
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch(e) { showError(e.message); }
    setSaving(false);
  };

  // ── Confirm dialog ──
  const [confirmDlg, setConfirmDlg] = useState(null);
  const askConfirm = (title, message, onConfirm, danger = true, confirmLabel) =>
    setConfirmDlg({ title, message, onConfirm, danger, confirmLabel });

  // ── IPO applicants view ──
  const [viewIpoId,    setViewIpoId]    = useState(null);
  const [viewListPrice, setViewListPrice] = useState('');

  // ── Add applicants to existing IPO ──
  const [addAppIpoId,  setAddAppIpoId]  = useState(null);
  const [addAppSel,    setAddAppSel]    = useState({});
  const [addAppSaving, setAddAppSaving] = useState(false);
  const [addAppErr,    setAddAppErr]    = useState('');

  // ── Members state ──
  const [members, setMembers] = useState(D.members);
  const [profileMember, setProfileMember] = useState(null);   // member id, for the profile modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: '', email: '', phone: '', upi: '', pan: '', bank: '' });
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberErr, setMemberErr] = useState('');

  const [showAddPan, setShowAddPan]     = useState(null);   // member id
  const [panForm, setPanForm]           = useState({ pan: '', holderName: '', relation: 'Self', bank: '' });
  const [panSaving, setPanSaving]       = useState(false);
  const [panErr, setPanErr]             = useState('');

  const saveMember = async () => {
    if (!memberForm.name) { setMemberErr('Name is required.'); return; }
    if (memberForm.pan) {
      const pe = panError(memberForm.pan);
      if (pe) { setMemberErr(pe); return; }
      const dup = duplicatePanHolder(memberForm.pan);
      if (dup) { setMemberErr(`This PAN is already registered to ${dup}.`); return; }
    }
    setMemberSaving(true); setMemberErr('');
    try {
      const added = await D.mutations.addMember({ ...memberForm, upiId: memberForm.upi, avatarHue: Math.floor(Math.random() * 360) });
      if (memberForm.pan) {
        try {
          await D.mutations.addPan({ memberId: added.id, pan: memberForm.pan, holderName: memberForm.name, relation: 'Self', bank: memberForm.bank || null });
        } catch (panErr) {
          // The PAN insert failed — roll back the just-created member so we
          // don't leave an orphan member with no PAN.
          try { await D.mutations.deleteMember(added.id); } catch (_) {}
          throw panErr;
        }
      }
      setMembers([...window.DB.members]);
      setShowAddMember(false);
      setMemberForm({ name: '', email: '', phone: '', upi: '', pan: '', bank: '' });
    } catch(e) { setMemberErr(friendlyDbError(e)); }
    setMemberSaving(false);
  };

  const savePan = async () => {
    if (!panForm.holderName) { setPanErr('Holder name is required.'); return; }
    const pe = panError(panForm.pan);
    if (pe) { setPanErr(pe); return; }
    const dup = duplicatePanHolder(panForm.pan);
    if (dup) { setPanErr(`This PAN is already registered to ${dup}.`); return; }
    setPanSaving(true); setPanErr('');
    try {
      await D.mutations.addPan({ memberId: showAddPan, ...panForm });
      setMembers([...window.DB.members]); // refresh to show updated PAN counts
      setShowAddPan(null);
      setPanForm({ pan: '', holderName: '', relation: 'Self', bank: '' });
    } catch(e) { setPanErr(friendlyDbError(e)); }
    setPanSaving(false);
  };

  const deleteMember = (id, name) => {
    const memberPans   = D.pans.filter(p => p.member === id);
    const panIds       = memberPans.map(p => p.id);
    const allotCount   = panIds.reduce((n, id) => n + D.allotsOfPan(id).length, 0);
    const memberSetts  = D.settlements.filter(s => s.member === id);
    const paidCount    = memberSetts.filter(s => s.status === 'Paid').length;

    const parts = [`${memberPans.length} PAN account${memberPans.length !== 1 ? 's' : ''}`];
    if (allotCount)  parts.push(`${allotCount} application/allotment record${allotCount !== 1 ? 's' : ''}`);
    if (memberSetts.length) parts.push(`${memberSetts.length} settlement record${memberSetts.length !== 1 ? 's' : ''}${paidCount ? ` (including ${paidCount} already marked Paid)` : ''}`);

    askConfirm(
      `Remove "${name}"?`,
      `This permanently deletes their ${parts.join(', ')}. Their allotted gains will no longer count toward any pool, so every other member's profit split for those IPOs will be recalculated. This cannot be undone.`,
      async () => { try { await D.mutations.deleteMember(id); setMembers([...window.DB.members]); } catch(e) { showError(friendlyDbError(e)); } }
    );
  };

  // ── Edit member ──
  const [editMember, setEditMember]         = useState(null);
  const [editMemberForm, setEditMemberForm] = useState({});
  const [editMemberSaving, setEditMemberSaving] = useState(false);
  const [editMemberErr, setEditMemberErr]   = useState('');

  const openEditMember = (m) => { setEditMember(m); setEditMemberForm({ name: m.name, email: m.email || '', phone: m.phone || '', upiId: m.upiId || '' }); setEditMemberErr(''); };

  const saveEditMember = async () => {
    if (!editMemberForm.name) { setEditMemberErr('Name is required.'); return; }
    setEditMemberSaving(true); setEditMemberErr('');
    try {
      await D.mutations.updateMember(editMember.id, editMemberForm);
      setMembers([...window.DB.members]);
      setEditMember(null);
    } catch(e) { setEditMemberErr(e.message); }
    setEditMemberSaving(false);
  };

  // ── Edit PAN ──
  const [editPan, setEditPan]         = useState(null);
  const [editPanForm, setEditPanForm] = useState({});
  const [editPanSaving, setEditPanSaving] = useState(false);
  const [editPanErr, setEditPanErr]   = useState('');

  const openEditPan = (p) => { setEditPan(p); setEditPanForm({ holderName: p.holder, relation: p.relation || 'Self', bank: p.linkedBank || '', status: p.status || 'Active' }); setEditPanErr(''); };

  const saveEditPan = async () => {
    if (!editPanForm.holderName) { setEditPanErr('Holder name is required.'); return; }
    setEditPanSaving(true); setEditPanErr('');
    try {
      await D.mutations.updatePan(editPan.id, editPanForm);
      setMembers([...window.DB.members]);
      setEditPan(null);
    } catch(e) { setEditPanErr(e.message); }
    setEditPanSaving(false);
  };

  // Rows carry their applied/allotted counts so those columns are sortable too.
  const ipoRows = ipos.map(ip => {
    const rows = D.allotsOfIpo(ip.id);
    return {
      ...ip,
      applied:  rows.length,
      allotted: rows.filter(a => a.status === 'allotted').length,
      pending:  rows.filter(a => a.status === 'pending').length,
    };
  });
  // "Awaiting results": applications have closed but some PANs still have no
  // ✓/✗ — the admin's actual to-do list. Pending rows on an IPO that is still
  // open for applications aren't actionable yet, so they don't count.
  const awaitingResults = ip => ip.pending > 0 && ip.status !== 'Open' && ip.status !== 'Upcoming';
  const awaitingCount   = ipoRows.filter(awaitingResults).length;

  const [ipoQuery,  setIpoQuery]  = useState('');
  const [ipoFilter, setIpoFilter] = useState('all');
  const IPO_FILTERS = [['all', 'All'], ['awaiting', 'Awaiting results'], ['open', 'Open / upcoming'], ['listed', 'Listed']];
  const IPO_FILTER_FN = {
    all:      () => true,
    awaiting: awaitingResults,
    open:     ip => ip.status === 'Open' || ip.status === 'Upcoming',
    listed:   ip => ip.status === 'Listed',
  };
  const ipoFilterCount = key => ipoRows.filter(IPO_FILTER_FN[key]).length;
  const q = ipoQuery.trim().toLowerCase();
  const filteredIpoRows = ipoRows.filter(ip => IPO_FILTER_FN[ipoFilter](ip)
    && (!q || String(ip.name).toLowerCase().includes(q) || String(ip.short || '').toLowerCase().includes(q)));
  const showAwaiting = () => { setTab('IPO Master'); setIpoFilter('awaiting'); setIpoQuery(''); setIpoPage(0); };
  // Default (no active sort): newest-added IPO on top (created_at), falling back
  // to the most relevant date, then name — so the master list leads with new IPOs.
  const ipoSortKey = ip => ip.createdAt || ip.listDate || ip.allotDate || ip.close || ip.open || '';
  const recentFirst = [...filteredIpoRows].sort((a, b) => {
    const d = String(ipoSortKey(b)).localeCompare(String(ipoSortKey(a)));
    return d !== 0 ? d : String(a.name).localeCompare(String(b.name));
  });
  const ipoCols = [
    { key: 'name',     label: 'IPO',      align: 'left'  },
    { key: 'type',     label: 'Board',    align: 'left'  },
    { key: 'bandHigh', label: 'Price',    align: 'right', get: r => r.bandHigh || 0, defDir: 'desc' },
    { key: 'lotSize',  label: 'Lot size', align: 'right', get: r => r.lotSize || 0, defDir: 'desc' },
    { key: 'applied',  label: 'Applied',  align: 'right', defDir: 'desc' },
    { key: 'allotted', label: 'Allotted', align: 'right', defDir: 'desc' },
  ];
  const [ipoSort, onIpoSortRaw] = useSortState(null);
  const sortedIpos = ipoSort.key ? sortRows(filteredIpoRows, ipoSort, ipoCols) : recentFirst;
  // The master list keeps growing; show IPO_PAGE rows at a time. Page 1 is the
  // newest IPOs (or the top of the active sort) — re-sorting jumps back to it.
  const IPO_PAGE = 20;
  const [ipoPage, setIpoPage] = useState(0);
  const onIpoSort = (...args) => { setIpoPage(0); onIpoSortRaw(...args); };
  const ipoPages   = Math.max(1, Math.ceil(sortedIpos.length / IPO_PAGE));
  const curIpoPage = Math.min(ipoPage, ipoPages - 1);   // clamp after a delete
  const pagedIpos  = sortedIpos.slice(curIpoPage * IPO_PAGE, (curIpoPage + 1) * IPO_PAGE);

  const IpoSubline = ({ ip }) => (
    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', gap: 6, alignItems: 'center', marginTop: 1, flexWrap: 'wrap' }}>
      {ip.short !== ip.name && <span>{ip.short}</span>}
      {ip.status && <StatusDot tone={ip.status === 'Listed' ? 'profit' : ip.status === 'Open' ? 'info' : 'neutral'} />}
      {ip.status && <span>{ip.status}</span>}
      {awaitingResults(ip) && <span style={{ color: 'var(--warn)', fontWeight: 700, whiteSpace: 'nowrap' }}>· {ip.pending} awaiting result{ip.pending !== 1 ? 's' : ''}</span>}
    </div>
  );
  // Row actions. Delete lives in the Edit dialog (it wiped every application
  // for the IPO and sat one tap away from Edit).
  const IpoActions = ({ ip, wide }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: wide ? 'stretch' : 'flex-end', gap: 6, flexWrap: 'nowrap' }}>
      <Button variant="soft" size="sm" icon="allot" style={wide ? { flex: 1, justifyContent: 'center' } : undefined}
        onClick={() => { setViewIpoId(ip.id); setChanges({}); setSaved(false); }}>
        Allotments
      </Button>
      <Button variant="ghost" size="sm" icon={copiedIpo === ip.id ? 'check' : 'external'} onClick={() => copyApplyLink(ip)}
        style={wide ? { flex: 1, justifyContent: 'center' } : undefined}>
        {copiedIpo === ip.id ? 'Copied!' : 'Apply link'}
      </Button>
      <IconButton name="refresh" size={34} tip="Refresh applied / allotted counts"
        spin={refreshingId === ip.id} disabled={refreshing}
        onClick={() => refreshData(ip.id)} />
      <IconButton name="edit" size={34} tip="Edit or delete IPO" onClick={() => openEditIpo(ip)} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* KPIs */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          ['IPOs tracked',   ipos.length,              'calendar', 'neutral'],
          ['Members',        members.length,            'groups',   'info'],
          ['Total PANs',     D.pans.length,             'pan',      'brand'],
          ['Awaiting results', awaitingCount,           'clock',    awaitingCount > 0 ? 'warn' : 'neutral', awaitingCount > 0 ? showAwaiting : undefined],
        ].map(([l, v, ic, tone, onClick]) => (
          <KPICard key={l} icon={ic} label={onClick ? l + ' ›' : l} value={v} tone={tone} onClick={onClick} />
        ))}
      </div>

      <Card pad={0}>
        {/* Tabs */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 4, overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ border: 'none', background: tab === t ? 'var(--brand-tint)' : 'transparent', color: tab === t ? 'var(--brand)' : 'var(--ink-2)', fontWeight: 700, fontSize: 13, padding: '8px 14px', borderRadius: 'var(--r-md)', whiteSpace: 'nowrap', cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {/* ── IPO Master ── */}
        {tab === 'IPO Master' && (
          <div>
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>{ipos.length} IPO{ipos.length !== 1 ? 's' : ''} in master list</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Button variant="soft" size="sm" icon="refresh" disabled={refreshing}
                  onClick={() => refreshData()}>{refreshing ? 'Refreshing…' : 'Refresh'}</Button>
                <Button variant="primary" size="sm" icon="plus" onClick={() => setAddIpoStep('details')}>New IPO</Button>
              </div>
            </div>
            {(() => {
              // Applications by category across every IPO — a quick "as of now"
              // snapshot. Reuses D.categoryStats (applied = PAN applications).
              const CAT_TONE = { Retail: 'neutral', sHNI: 'info', bHNI: 'warn', SME: 'sme' };
              const cs = D.categoryStats || [];
              const byCat = {}; cs.forEach(c => { byCat[c.cat] = c.applied; });
              const cats = ['Retail', 'sHNI', 'bHNI', 'SME'].filter(c => byCat[c]);
              const total = cs.reduce((s, c) => s + c.applied, 0);
              if (total === 0) return null;
              return (
                <div style={{ padding: '11px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Applications by category</span>
                  {cats.map(c => (
                    <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Badge tone={CAT_TONE[c]}>{c}</Badge>
                      <span className="num" style={{ fontSize: 14, fontWeight: 800 }}>{byCat[c]}</span>
                    </span>
                  ))}
                  <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>
                    Total <span className="num" style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>{total}</span> applications
                  </span>
                </div>
              );
            })()}
            {ipos.length > 0 && (
              // Search + status filters. Applied before paging, so page 1 is
              // always the top of what you searched for.
              <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input value={ipoQuery} onChange={e => { setIpoQuery(e.target.value); setIpoPage(0); }}
                  placeholder="Search IPOs…" aria-label="Search IPOs"
                  style={{ ...inputSt, flex: '1 1 180px', maxWidth: 280, padding: '7px 11px', fontSize: 13 }} />
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {IPO_FILTERS.map(([key, label]) => {
                    const n = ipoFilterCount(key);
                    const on = ipoFilter === key;
                    return (
                      <button key={key} onClick={() => { setIpoFilter(key); setIpoPage(0); }} style={{
                        border: '1px solid ' + (on ? 'var(--brand)' : 'var(--border)'), borderRadius: 999,
                        background: on ? 'var(--brand-tint)' : 'var(--surface)', color: on ? 'var(--brand)' : 'var(--ink-2)',
                        fontSize: 12, fontWeight: 700, padding: '5px 11px', cursor: 'pointer', whiteSpace: 'nowrap',
                      }}>{label}{key !== 'all' && <span style={{ opacity: .7, marginLeft: 4 }}>{n}</span>}</button>
                    );
                  })}
                </div>
              </div>
            )}
            {ipos.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No IPOs yet. Add one above.</div>
            ) : sortedIpos.length === 0 ? (
              <div style={{ padding: '28px 18px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                No IPOs match{ipoQuery ? <> “<strong>{ipoQuery}</strong>”</> : ''}.{' '}
                <button onClick={() => { setIpoQuery(''); setIpoFilter('all'); }} style={{ border: 'none', background: 'none', color: 'var(--brand)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Clear filters</button>
              </div>
            ) : (
              <>
              {/* Desktop / tablet: sortable table */}
              <div className="ipo-table-desktop" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                  <thead><tr style={{ fontSize: 11.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    {ipoCols.map(c => <SortTh key={c.key} col={c} sort={ipoSort} onSort={onIpoSort} style={{ padding: '10px 18px' }} />)}
                    <th style={{ padding: '10px 18px' }}></th>
                  </tr></thead>
                  <tbody>
                    {pagedIpos.map(ip => (
                      <tr key={ip.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '13px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <IpoLogo ipo={ip} size={34} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{ip.name}</div>
                              <IpoSubline ip={ip} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '13px 18px' }}><Badge tone={ip.type === 'SME' ? 'sme' : 'mainboard'}>{ip.type}</Badge></td>
                        <td className="num" style={{ padding: '13px 18px', fontSize: 13 }}>{ip.bandHigh ? '₹' + Number(ip.bandHigh).toLocaleString('en-IN') : '—'}</td>
                        <td className="num" style={{ padding: '13px 18px', textAlign: 'right', fontSize: 13 }}>{ip.lotSize || '—'}</td>
                        <td className="num" style={{ padding: '13px 18px', textAlign: 'right', fontSize: 13, color: 'var(--ink-2)' }}>{ip.applied || '—'}</td>
                        <td className="num" style={{ padding: '13px 18px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: ip.allotted > 0 ? 'var(--profit)' : 'var(--ink-3)' }}>{ip.allotted || '—'}</td>
                        <td style={{ padding: '13px 18px' }}><IpoActions ip={ip} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Phones: one card per IPO, every number and button visible
                  without scrolling sideways. */}
              <div className="ipo-cards-mobile">
                {pagedIpos.map(ip => (
                  <div key={ip.id} style={{ padding: '13px 14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <IpoLogo ipo={ip} size={38} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ip.name}</div>
                        <IpoSubline ip={ip} />
                      </div>
                      <Badge tone={ip.type === 'SME' ? 'sme' : 'mainboard'}>{ip.type}</Badge>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, fontSize: 12 }}>
                      {[['Price', ip.bandHigh ? '₹' + Number(ip.bandHigh).toLocaleString('en-IN') : '—'],
                        ['Lot', ip.lotSize || '—'],
                        ['Applied', ip.applied || '—'],
                        ['Allotted', ip.allotted || '—']].map(([l, v]) => (
                        <div key={l}>
                          <div style={{ color: 'var(--ink-3)', fontWeight: 600, fontSize: 11 }}>{l}</div>
                          <div className="num" style={{ fontWeight: 700, color: l === 'Allotted' && ip.allotted > 0 ? 'var(--profit)' : 'var(--ink)' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <IpoActions ip={ip} wide />
                  </div>
                ))}
              </div>
              </>
            )}
            {ipoPages > 1 && (() => {
              const btn = (label, page, { active = false, disabled = false, key } = {}) => (
                <button key={key ?? label} disabled={disabled} onClick={() => setIpoPage(page)} style={{
                  minWidth: 32, height: 30, padding: '0 9px', borderRadius: 'var(--r-sm)', fontSize: 12.5, fontWeight: 700,
                  border: '1px solid ' + (active ? 'var(--brand)' : 'var(--border)'),
                  background: active ? 'var(--brand-tint)' : 'var(--surface)',
                  color: active ? 'var(--brand)' : disabled ? 'var(--ink-4, var(--ink-3))' : 'var(--ink-2)',
                  opacity: disabled ? .5 : 1, cursor: disabled ? 'default' : 'pointer',
                }}>{label}</button>
              );
              // First, last and the pages around the current one; gaps become "…".
              const nums = [];
              for (let i = 0; i < ipoPages; i++) {
                if (i === 0 || i === ipoPages - 1 || Math.abs(i - curIpoPage) <= 1) nums.push(i);
                else if (nums[nums.length - 1] !== '…') nums.push('…');
              }
              const from = curIpoPage * IPO_PAGE + 1, to = Math.min(sortedIpos.length, (curIpoPage + 1) * IPO_PAGE);
              return (
                <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                    Showing <strong style={{ color: 'var(--ink-2)' }}>{from}–{to}</strong> of {sortedIpos.length}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {btn('‹ Prev', curIpoPage - 1, { disabled: curIpoPage === 0 })}
                    {nums.map((n, i) => n === '…'
                      ? <span key={'gap' + i} style={{ alignSelf: 'center', color: 'var(--ink-3)', fontSize: 12.5, padding: '0 2px' }}>…</span>
                      : btn(String(n + 1), n, { active: n === curIpoPage }))}
                    {btn('Next ›', curIpoPage + 1, { disabled: curIpoPage === ipoPages - 1 })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Members ── */}
        {tab === 'Members' && (
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>{members.length} member{members.length !== 1 ? 's' : ''} · {D.pans.length} PANs</div>
              <Button variant="primary" size="sm" icon="plus" onClick={() => setShowAddMember(true)}>Add member</Button>
            </div>
            {members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--ink-3)', fontSize: 13 }}>No members yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {members.map(m => {
                  const mPans = D.pans.filter(p => p.member === m.id);
                  const contact = m.email || m.phone || null;
                  return (
                    <Card key={m.id} pad={0} style={{ overflow: 'hidden' }}>
                      {/* Member header */}
                      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0, cursor: 'pointer' }} onClick={() => setProfileMember(m.id)} title="View profile">
                          <Avatar name={m.name} hue={m.avatarHue} size={40} you={m.you} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 14.5, fontWeight: 800, textDecoration: 'underline', textDecorationColor: 'transparent' }} onMouseEnter={e => e.currentTarget.style.textDecorationColor = 'var(--ink-3)'} onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'transparent'}>{m.name}</span>
                              {m.you && <span style={{ fontSize: 10.5, color: 'var(--brand)', fontWeight: 700, background: 'var(--brand-tint)', padding: '2px 7px', borderRadius: 999 }}>You</span>}
                              <Badge tone={m.role === 'Admin' ? 'brand' : 'neutral'}>{m.role}</Badge>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>
                              {contact && <span>{contact} · </span>}
                              <span style={{ fontWeight: 600 }}>{mPans.length} PAN{mPans.length !== 1 ? 's' : ''}</span>
                              {m.upiId
                                ? <span> · <span className="num" style={{ color: 'var(--profit)', fontWeight: 600 }}>{m.upiId}</span></span>
                                : <button onClick={() => openEditMember(m)} style={{ marginLeft: 6, border: 'none', background: 'none', color: 'var(--warn)', fontWeight: 700, fontSize: 11.5, cursor: 'pointer', padding: 0 }}>+ Add UPI ID</button>}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <IconButton name="plus" size={30} tip="Add PAN" onClick={() => { setShowAddPan(m.id); setPanForm({ pan: '', holderName: '', relation: 'Self', bank: '' }); }} />
                          <IconButton name="edit" size={30} tip="Edit member" onClick={() => openEditMember(m)} />
                          {!m.you && <IconButton name="trash" size={30} tip="Remove member" onClick={() => deleteMember(m.id, m.name)} />}
                        </div>
                      </div>

                      {/* PAN rows */}
                      {mPans.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border)' }}>
                          {mPans.map((p, pi) => (
                            <div key={p.id} style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px 9px 52px',
                              borderTop: pi === 0 ? 'none' : '1px solid var(--border)',
                              background: p.status === 'Inactive' ? 'var(--surface-2)' : 'transparent',
                            }}>
                              {/* Name + relation */}
                              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }} onClick={() => setProfileMember(m.id)} title="View profile">
                                <span style={{ fontSize: 13, fontWeight: 700, color: p.status === 'Inactive' ? 'var(--ink-3)' : 'var(--ink)' }}>{p.holder}</span>
                                <Badge tone={{ Self: 'brand', Spouse: 'info', Friend: 'neutral' }[p.relation] || 'neutral'}>{p.relation || 'Self'}</Badge>
                                {p.bank && <span style={{ fontSize: 11.5, color: 'var(--ink-3)', background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 6 }}>{p.bank}</span>}
                              </div>
                              {/* PAN number */}
                              <span className="num" style={{ fontSize: 12.5, color: 'var(--ink-2)', letterSpacing: '.06em', fontWeight: 700 }}>{p.pan}</span>
                              {/* Status dot only */}
                              <StatusDot tone={p.status === 'Active' ? 'profit' : 'warn'} />
                              <IconButton name="edit" size={26} tip="Edit PAN" onClick={() => openEditPan(p)} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No PANs nudge */}
                      {mPans.length === 0 && (
                        <div style={{ padding: '8px 16px 10px 52px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          No PAN accounts yet
                          <Button variant="ghost" size="sm" onClick={() => { setShowAddPan(m.id); setPanForm({ pan: '', holderName: '', relation: 'Self', bank: '' }); }}>+ Add PAN</Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Step 1: IPO details ── */}
      {addIpoStep === 'details' && (
        <Modal title="New IPO" onClose={closeAddIpo}>
          <Field label="Company name *">
            <input style={inputSt} value={ipoForm.name} onChange={e => setIpoForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Tata Technologies" autoFocus />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Short name">
              <input style={inputSt} value={ipoForm.shortName} onChange={e => setIpoForm(p => ({ ...p, shortName: e.target.value }))} placeholder="e.g. Tata Tech" />
            </Field>
            <Field label="Board *">
              <select style={inputSt} value={ipoForm.type} onChange={e => setIpoForm(p => ({ ...p, type: e.target.value }))}>
                <option value="SME">SME</option>
                <option value="Mainboard">Mainboard</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Price (₹)">
              <input style={inputSt} type="number" value={ipoForm.price} onChange={e => setIpoForm(p => ({ ...p, price: e.target.value }))} placeholder="950" />
            </Field>
            <Field label="Lot size">
              <input style={inputSt} type="number" value={ipoForm.lotSize} onChange={e => setIpoForm(p => ({ ...p, lotSize: e.target.value }))} placeholder="15" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Open date">
              <input style={inputSt} type="date" value={ipoForm.openDate} onChange={e => setIpoForm(p => ({ ...p, openDate: e.target.value }))} />
            </Field>
            <Field label="Close date">
              <input style={inputSt} type="date" value={ipoForm.closeDate} onChange={e => setIpoForm(p => withAutoDates(p, e.target.value))} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Allotment date">
              <input style={inputSt} type="date" value={ipoForm.allotDate} onChange={e => setIpoForm(p => ({ ...p, allotDate: e.target.value }))} />
            </Field>
            <Field label="Listing date">
              <input style={inputSt} type="date" value={ipoForm.listDate} onChange={e => setIpoForm(p => ({ ...p, listDate: e.target.value }))} />
            </Field>
          </div>
          <AutoDateNote closeDate={ipoForm.closeDate} />
          {ipoErr && <div style={{ color: 'var(--loss)', fontSize: 13, fontWeight: 600 }}>{ipoErr}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={closeAddIpo}>Cancel</Button>
            <Button variant="primary" icon="chevR" onClick={saveIpo} style={{ opacity: ipoSaving ? .7 : 1, pointerEvents: ipoSaving ? 'none' : 'auto' }}>
              {ipoSaving ? 'Creating…' : 'Next: Who applied?'}
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Step 2: Applicant selection ── */}
      {addIpoStep === 'applicants' && (() => {
        const newIpo   = window.DB.ipos.find(i => i.id === newIpoId);
        // Since SEBI's ICDR amendment (1 Jul 2025), SME IPOs split applicants
        // into Individual/S-HNI/B-HNI exactly like Mainboard — same category set
        // for both board types now (see db.js catMinLots for the SME-specific
        // lot-count thresholds this labelling matches).
        const isSME    = (newIpo?.type || 'SME') === 'SME';
        const cats     = ['Retail', 'sHNI', 'bHNI'];
        const catLabel = (c) => (isSME && c === 'Retail') ? 'Individual' : c;
        const selected = Object.values(applicantSel).filter(v => v.selected).length;
        const allPans  = D.pans.map(p => ({ ...p, mem: D.member(p.member) }));
        const toggle2  = (panId) => togglePan(panId);
        return (
          <Modal title={`Step 2 of 2: Who applied? (${newIpo?.short || ''})`} onClose={closeAddIpo}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                <strong style={{ color: 'var(--ink)' }}>{selected}</strong> of {allPans.length} selected · tap a row to select
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button variant="ghost" size="sm" onClick={selectAll}>All</Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>None</Button>
              </div>
            </div>

            {/* Flat clickable PAN list */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden', maxHeight: 400, overflowY: 'auto' }}>
              {allPans.map((p, i) => {
                const sel = applicantSel[p.id] || { selected: false, category: cats[0] };
                return (
                  <div key={p.id}
                    onClick={() => toggle2(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                      background: sel.selected ? 'var(--brand-tint)' : 'transparent',
                      cursor: 'pointer', userSelect: 'none', transition: 'background .12s',
                    }}>
                    {/* Tick circle */}
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      border: sel.selected ? '2px solid var(--brand)' : '2px solid var(--border)',
                      background: sel.selected ? 'var(--brand)' : 'transparent',
                      display: 'grid', placeItems: 'center', transition: 'all .12s',
                    }}>
                      {sel.selected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="2,6 5,9 10,3"/></svg>}
                    </div>
                    <Avatar name={p.holder} hue={p.mem?.avatarHue || 200} size={34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.holder}</div>
                      <div className="num" style={{ fontSize: 11.5, color: 'var(--ink-3)', letterSpacing: '.04em', fontWeight: 700 }}>{p.pan}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        {p.mem && <span>{p.mem.name}</span>}
                        {p.mem?.you && <span style={{ color: 'var(--brand)', fontWeight: 700 }}>· You</span>}
                        <Badge tone={{ Self: 'brand', Spouse: 'info', Friend: 'neutral' }[p.relation] || 'neutral'}>{p.relation || 'Self'}</Badge>
                      </div>
                    </div>
                    <select
                      style={{ ...inputSt, width: 96, padding: '5px 7px', fontSize: 12.5, opacity: sel.selected ? 1 : .35 }}
                      value={sel.category} disabled={!sel.selected}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); setCat(p.id, e.target.value); }}>
                      {cats.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
                    </select>
                    <LotsInput value={sel.lots ?? 1} onChange={v => setLots(p.id, v)} cat={sel.category} ipo={D.ipo(newIpoId)} disabled={!sel.selected} compact />
                  </div>
                );
              })}
            </div>

            {appErr && <div style={{ color: 'var(--loss)', fontSize: 13, fontWeight: 600 }}>{appErr}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={closeAddIpo}>Skip</Button>
              <Button variant="primary" onClick={saveApplications}
                style={{ opacity: (appSaving || selected === 0) ? .6 : 1, pointerEvents: (appSaving || selected === 0) ? 'none' : 'auto' }}>
                {appSaving ? 'Saving…' : selected > 0 ? `Save ${selected} application${selected !== 1 ? 's' : ''}` : 'Select applicants'}
              </Button>
            </div>
          </Modal>
        );
      })()}

      {/* ── Member profile modal ── */}
      {profileMember && (() => {
        const m = D.members.find(x => x.id === profileMember);
        if (!m) return null;
        const mPans   = D.pans.filter(p => p.member === m.id);
        const mPanIds = mPans.map(p => p.id);
        const memberProfit = (D.memberProfits || []).find(mp => mp.id === m.id) || { profit: 0, soloProfit: 0, pans: 0 };
        const panProfitMap = {};
        (D.panProfits || []).forEach(pp => { panProfitMap[pp.id] = pp; });
        const memberAllots = mPanIds.flatMap(id => D.allotsOfPan(id));
        const appliedCount  = memberAllots.length;
        const allottedCount = memberAllots.filter(a => a.status === 'allotted').length;
        const allotRate     = appliedCount > 0 ? Math.round(allottedCount / appliedCount * 100) : 0;
        const iposApplied   = new Set(memberAllots.map(a => a.ipo)).size;
        const memberSettlements = D.settlements.filter(s => s.member === m.id);
        const paidTotal    = memberSettlements.filter(s => s.status === 'Paid').reduce((s, r) => s + (r.amount || 0), 0);
        const pendingTotal = memberSettlements.filter(s => s.status === 'Pending').reduce((s, r) => s + (r.amount || 0), 0);
        const delta = Math.round(memberProfit.profit - memberProfit.soloProfit);

        // Newest IPO first (D.ipos is already ordered by open_date desc from loadDB).
        const ipoOrder = {};
        D.ipos.forEach((ip, i) => { ipoOrder[ip.id] = i; });
        const appRows = memberAllots.slice().sort((a, b) => (ipoOrder[a.ipo] ?? 999) - (ipoOrder[b.ipo] ?? 999));

        const STATUS_META = {
          allotted:     { label: 'Allotted',     tone: 'profit' },
          not_allotted: { label: 'Not allotted', tone: 'loss' },
          pending:      { label: 'Pending',      tone: 'neutral' },
        };

        return (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 65, display: 'grid', placeItems: 'center', padding: 12 }}>
            <div className="modal-card" style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', width: '100%', maxWidth: 760, boxShadow: 'var(--sh-pop)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', animation: 'popIn .22s cubic-bezier(.2,.7,.3,1)' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={m.name} hue={m.avatarHue} size={40} you={m.you} />
                  <div>
                    <div style={{ fontSize: 15.5, fontWeight: 800 }}>{m.name}{m.you && <span style={{ color: 'var(--brand)', fontWeight: 600 }}> · You</span>}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{m.email || m.phone || 'No contact on file'} · {mPans.length} PAN{mPans.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <IconButton name="x" size={32} onClick={() => setProfileMember(null)} />
              </div>

              {/* Body (scrollable) */}
              <div style={{ padding: '18px 20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* KPI stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                  <div style={{ padding: 14, borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>Total profit</div>
                    <div className="num" style={{ fontSize: 19, fontWeight: 800, color: memberProfit.profit >= 0 ? 'var(--profit)' : 'var(--loss)' }}>{f(memberProfit.profit, { compact: true })}</div>
                    {delta !== 0 && (
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: delta > 0 ? 'var(--profit)' : 'var(--loss)', marginTop: 2 }}>
                        {delta > 0 ? '▲' : '▼'} {f(Math.abs(delta), { compact: true })} vs solo
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 14, borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>IPOs applied</div>
                    <div className="num" style={{ fontSize: 19, fontWeight: 800 }}>{iposApplied}</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>Allotments</div>
                    <div className="num" style={{ fontSize: 19, fontWeight: 800 }}>{allottedCount}<span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}> / {appliedCount}</span></div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>Allotment rate</div>
                    <div className="num" style={{ fontSize: 19, fontWeight: 800 }}>{allotRate}%</div>
                  </div>
                </div>

                {/* Settlement status */}
                {(paidTotal !== 0 || pendingTotal !== 0) && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--profit)', background: 'var(--profit-soft)' }}>
                      <div style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 600 }}>Paid</div>
                      <div className="num" style={{ fontSize: 15, fontWeight: 800, color: 'var(--profit)' }}>{f(paidTotal)}</div>
                    </div>
                    <div style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--warn)', background: 'var(--warn-soft)' }}>
                      <div style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 600 }}>Pending</div>
                      <div className="num" style={{ fontSize: 15, fontWeight: 800, color: 'var(--warn)' }}>{f(pendingTotal)}</div>
                    </div>
                  </div>
                )}

                {/* Per-PAN breakdown, only when there's more than one PAN */}
                {mPans.length > 1 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Per-PAN breakdown</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                            <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700 }}>PAN</th>
                            <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 700 }}>Applications</th>
                            <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 700 }}>Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mPans.map(p => {
                            const pp = panProfitMap[p.id] || { profit: 0, soloProfit: 0, apps: 0 };
                            const d = Math.round(pp.profit - pp.soloProfit);
                            return (
                              <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                                <td style={{ padding: '8px 8px' }}>
                                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{p.holder}</div>
                                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{p.relation}</div>
                                </td>
                                <td className="num" style={{ padding: '8px 8px', textAlign: 'right', color: 'var(--ink-2)' }}>{pp.apps}</td>
                                <td className="num" style={{ padding: '8px 8px', textAlign: 'right' }}>
                                  <div style={{ fontWeight: 800, color: pp.profit >= 0 ? 'var(--profit)' : 'var(--loss)' }}>{f(pp.profit, { compact: true })}</div>
                                  {d !== 0 && <div style={{ fontSize: 10, fontWeight: 700, color: d > 0 ? 'var(--profit)' : 'var(--loss)' }}>{d > 0 ? '▲' : '▼'} {f(Math.abs(d), { compact: true })} vs solo</div>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Applications & allotments */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Applications &amp; allotments</div>
                  {appRows.length === 0 ? (
                    <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 12.5 }}>No applications yet.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                        <thead>
                          <tr style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                            <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700 }}>IPO</th>
                            <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700 }}>PAN</th>
                            <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 700 }}>Category</th>
                            <th style={{ textAlign: 'center', padding: '6px 8px', fontWeight: 700 }}>Status</th>
                            <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 700 }}>Shares</th>
                            <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 700 }}>Gain</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appRows.map(a => {
                            const ipoObj  = D.ipo(a.ipo);
                            const panObj  = D.pan(a.pan);
                            const catMeta = (window.CAT_META || {})[a.category] || { label: a.category || '—', tone: 'neutral' };
                            const st      = STATUS_META[a.status] || STATUS_META.pending;
                            return (
                              <tr key={a.id} style={{ borderTop: '1px solid var(--border)' }}>
                                <td style={{ padding: '8px 8px' }}>
                                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{ipoObj?.short || ipoObj?.name || '—'}</div>
                                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{ipoObj?.type}</div>
                                </td>
                                <td style={{ padding: '8px 8px', fontSize: 12, color: 'var(--ink-2)' }}>{panObj?.holder || '—'}</td>
                                <td style={{ padding: '8px 8px' }}><Badge tone={catMeta.tone} style={{ fontSize: 10 }}>{catMeta.label}</Badge></td>
                                <td style={{ padding: '8px 8px', textAlign: 'center' }}><Badge tone={st.tone} style={{ fontSize: 10 }}>{st.label}</Badge></td>
                                <td className="num" style={{ padding: '8px 8px', textAlign: 'right', color: 'var(--ink-2)' }}>{a.shares || '—'}</td>
                                <td className="num" style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 700, color: a.gain > 0 ? 'var(--profit)' : a.gain < 0 ? 'var(--loss)' : 'var(--ink-3)' }}>{a.gain ? f(a.gain, { compact: true }) : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add member modal ── */}
      {showAddMember && (
        <Modal title="Add member" onClose={() => { setShowAddMember(false); setMemberErr(''); setMemberForm({ name: '', email: '', phone: '', pan: '', bank: '' }); }}>
          <Field label="Full name *">
            <input style={inputSt} value={memberForm.name} onChange={e => setMemberForm(p => ({ ...p, name: e.target.value }))} placeholder="Priya Sharma" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="PAN number (Self)">
              <input style={{ ...inputSt, textTransform: 'uppercase', letterSpacing: '.05em' }} maxLength={10}
                value={memberForm.pan} onChange={e => setMemberForm(p => ({ ...p, pan: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" />
            </Field>
            <Field label="Bank / Broker">
              <input style={inputSt} value={memberForm.bank} onChange={e => setMemberForm(p => ({ ...p, bank: e.target.value }))} placeholder="HDFC, Zerodha…" />
            </Field>
          </div>
          <Field label="Email">
            <input style={inputSt} type="email" value={memberForm.email} onChange={e => setMemberForm(p => ({ ...p, email: e.target.value }))} placeholder="priya@example.com" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Phone">
              <input style={inputSt} value={memberForm.phone} onChange={e => setMemberForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </Field>
            <Field label="UPI ID">
              <input style={inputSt} value={memberForm.upi} onChange={e => setMemberForm(p => ({ ...p, upi: e.target.value.trim() }))} placeholder="name@okhdfcbank" autoCapitalize="none" spellCheck={false} />
            </Field>
          </div>
          {memberErr && <div style={{ color: 'var(--loss)', fontSize: 13, fontWeight: 600 }}>{memberErr}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => { setShowAddMember(false); setMemberErr(''); setMemberForm({ name: '', email: '', phone: '', pan: '', bank: '' }); }}>Cancel</Button>
            <Button variant="primary" onClick={saveMember} style={{ opacity: memberSaving ? .7 : 1, pointerEvents: memberSaving ? 'none' : 'auto' }}>
              {memberSaving ? 'Adding…' : 'Add member'}
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Edit IPO modal ── */}
      {editIpoId && (
        <Modal title="Edit IPO" onClose={() => setEditIpoId(null)}>
          <Field label="Company name *">
            <input style={inputSt} value={editIpoForm.name} onChange={e => setEditIpoForm(p => ({ ...p, name: e.target.value }))} autoFocus />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Short name">
              <input style={inputSt} value={editIpoForm.shortName} onChange={e => setEditIpoForm(p => ({ ...p, shortName: e.target.value }))} />
            </Field>
            <Field label="Board *">
              <select style={inputSt} value={editIpoForm.type} onChange={e => setEditIpoForm(p => ({ ...p, type: e.target.value }))}>
                <option value="SME">SME</option>
                <option value="Mainboard">Mainboard</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Price (₹)">
              <input style={inputSt} type="number" value={editIpoForm.price} onChange={e => setEditIpoForm(p => ({ ...p, price: e.target.value }))} placeholder="950" />
            </Field>
            <Field label="Lot size">
              <input style={inputSt} type="number" value={editIpoForm.lotSize} onChange={e => setEditIpoForm(p => ({ ...p, lotSize: e.target.value }))} placeholder="15" />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Open date">
              <input style={inputSt} type="date" value={editIpoForm.openDate} onChange={e => setEditIpoForm(p => ({ ...p, openDate: e.target.value }))} />
            </Field>
            <Field label="Close date">
              <input style={inputSt} type="date" value={editIpoForm.closeDate} onChange={e => setEditIpoForm(p => withAutoDates(p, e.target.value))} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Allotment date">
              <input style={inputSt} type="date" value={editIpoForm.allotDate} onChange={e => setEditIpoForm(p => ({ ...p, allotDate: e.target.value }))} />
            </Field>
            <Field label="Listing date">
              <input style={inputSt} type="date" value={editIpoForm.listDate} onChange={e => setEditIpoForm(p => ({ ...p, listDate: e.target.value }))} />
            </Field>
          </div>
          <AutoDateNote closeDate={editIpoForm.closeDate} />
          {editIpoErr && <div style={{ color: 'var(--loss)', fontSize: 13, fontWeight: 600 }}>{editIpoErr}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
            <button onClick={() => { const ip = D.ipo(editIpoId); setEditIpoId(null); deleteIpo(editIpoId, ip?.short || ip?.name); }}
              style={{ marginRight: 'auto', border: 'none', background: 'none', color: 'var(--loss)', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0 }}>
              Delete IPO…
            </button>
            <Button variant="ghost" onClick={() => setEditIpoId(null)}>Cancel</Button>
            <Button variant="primary" onClick={saveEditIpo} style={{ opacity: editIpoSaving ? .7 : 1, pointerEvents: editIpoSaving ? 'none' : 'auto' }}>
              {editIpoSaving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Add PAN modal ── */}
      {showAddPan && (
        <Modal title="Add PAN account" onClose={() => { setShowAddPan(null); setPanErr(''); }}>
          <Field label="PAN number *">
            <input style={{ ...inputSt, textTransform: 'uppercase', letterSpacing: '.05em' }}
              value={panForm.pan} onChange={e => setPanForm(p => ({ ...p, pan: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" maxLength={10} />
          </Field>
          <Field label="Holder name *">
            <input style={inputSt} value={panForm.holderName} onChange={e => setPanForm(p => ({ ...p, holderName: e.target.value }))} placeholder="Name as on PAN card" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Relation to member">
              <input style={inputSt} list="rel-opts" value={panForm.relation}
                onChange={e => setPanForm(p => ({ ...p, relation: e.target.value }))}
                placeholder="Self, Friend, Spouse…" />
              <datalist id="rel-opts">
                {['Self','Spouse','Father','Mother','Son','Daughter','Brother','Sister','Friend','Other'].map(r =>
                  <option key={r} value={r} />)}
              </datalist>
            </Field>
            <Field label="Bank / Broker">
              <input style={inputSt} value={panForm.bank} onChange={e => setPanForm(p => ({ ...p, bank: e.target.value }))} placeholder="HDFC, Zerodha…" />
            </Field>
          </div>
          {panErr && <div style={{ color: 'var(--loss)', fontSize: 13, fontWeight: 600 }}>{panErr}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => { setShowAddPan(null); setPanErr(''); }}>Cancel</Button>
            <Button variant="primary" onClick={savePan} style={{ opacity: panSaving ? .7 : 1, pointerEvents: panSaving ? 'none' : 'auto' }}>
              {panSaving ? 'Adding…' : 'Add PAN'}
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Edit member modal ── */}
      {editMember && (
        <Modal title="Edit member" onClose={() => { setEditMember(null); setEditMemberErr(''); }}>
          <Field label="Full name *">
            <input style={inputSt} value={editMemberForm.name} onChange={e => setEditMemberForm(p => ({ ...p, name: e.target.value }))} />
          </Field>
          <Field label="Email">
            <input style={inputSt} type="email" value={editMemberForm.email} onChange={e => setEditMemberForm(p => ({ ...p, email: e.target.value }))} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Phone">
              <input style={inputSt} value={editMemberForm.phone} onChange={e => setEditMemberForm(p => ({ ...p, phone: e.target.value }))} />
            </Field>
            <Field label="UPI ID">
              <input style={inputSt} value={editMemberForm.upiId} onChange={e => setEditMemberForm(p => ({ ...p, upiId: e.target.value.trim() }))} placeholder="name@okhdfcbank" autoCapitalize="none" spellCheck={false} />
            </Field>
          </div>
          {editMemberErr && <div style={{ color: 'var(--loss)', fontSize: 13, fontWeight: 600 }}>{editMemberErr}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => { setEditMember(null); setEditMemberErr(''); }}>Cancel</Button>
            <Button variant="primary" onClick={saveEditMember} style={{ opacity: editMemberSaving ? .7 : 1, pointerEvents: editMemberSaving ? 'none' : 'auto' }}>
              {editMemberSaving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Edit PAN modal ── */}
      {editPan && (
        <Modal title="Edit PAN account" onClose={() => { setEditPan(null); setEditPanErr(''); }}>
          <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>PAN</span>
            <span className="num" style={{ fontSize: 14, fontWeight: 800, letterSpacing: '.06em' }}>{editPan.pan}</span>
            <span style={{ fontSize: 11.5, color: 'var(--ink-3)', marginLeft: 'auto' }}>cannot be changed</span>
          </div>
          <Field label="Holder name *">
            <input style={inputSt} value={editPanForm.holderName} onChange={e => setEditPanForm(p => ({ ...p, holderName: e.target.value }))} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Relation to member">
              <input style={inputSt} list="edit-rel-opts" value={editPanForm.relation}
                onChange={e => setEditPanForm(p => ({ ...p, relation: e.target.value }))} />
              <datalist id="edit-rel-opts">
                {['Self','Spouse','Father','Mother','Son','Daughter','Brother','Sister','Friend','Other'].map(r => <option key={r} value={r} />)}
              </datalist>
            </Field>
            <Field label="Bank / Broker">
              <input style={inputSt} value={editPanForm.bank} onChange={e => setEditPanForm(p => ({ ...p, bank: e.target.value }))} placeholder="HDFC, Zerodha…" />
            </Field>
          </div>
          <Field label="Status">
            <select style={inputSt} value={editPanForm.status} onChange={e => setEditPanForm(p => ({ ...p, status: e.target.value }))}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>
          {editPanErr && <div style={{ color: 'var(--loss)', fontSize: 13, fontWeight: 600 }}>{editPanErr}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => { setEditPan(null); setEditPanErr(''); }}>Cancel</Button>
            <Button variant="primary" onClick={saveEditPan} style={{ opacity: editPanSaving ? .7 : 1, pointerEvents: editPanSaving ? 'none' : 'auto' }}>
              {editPanSaving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </Modal>
      )}

      {/* ── IPO applicants modal (view + mark allotments) ── */}
      {viewIpoId && (() => {
        const vIpo    = D.ipo(viewIpoId);
        // Since SEBI's ICDR amendment (1 Jul 2025), SME IPOs split applicants
        // into Individual/S-HNI/B-HNI exactly like Mainboard. Rows recorded
        // before this app added that split may still carry the old single
        // 'SME' category value — 'SME' stays a selectable option (never forced
        // or silently rewritten) so those legacy rows keep displaying correctly.
        const vIsSME    = vIpo?.type === 'SME';
        const vCatLabel = (c) => (vIsSME && c === 'Retail') ? 'Individual' : (c === 'SME' ? 'SME (legacy)' : c);
        const vCats     = ['Retail', 'sHNI', 'bHNI'];
        const vAllots = D.allotsOfIpo(viewIpoId);
        const countBy = s => vAllots.filter(a => (changes[a.id]?.status ?? a.status) === s).length;
        const allotted = countBy('allotted'), notAllot = countBy('not_allotted'), pending = countBy('pending');
        const hasDirty = vAllots.some(a => changes[a.id]);
        const discardView = () => { setViewIpoId(null); setChanges({}); setSaved(false); setViewListPrice(''); setPasteOpen(false); setPasteText(''); setAllotQuery(''); setAllotFilter('all'); };

        // ── Search / sort / filter (display only — counts, Save and "All got"
        // still cover every applicant). Sorting uses the SAVED status and
        // category, not unsaved edits, so a row doesn't jump away the moment
        // you tap ✓ or change its category.
        const rowInfo = (a) => {
          const p = D.pan(a.pan), m = p ? D.member(p.member) : null;
          return { holder: p?.holder || '', member: m?.name || '', pan: p?.pan || '' };
        };
        const CAT_RANK = { bHNI: 0, sHNI: 1, Retail: 2, SME: 3 };
        const STATUS_RANK = { pending: 0, allotted: 1, not_allotted: 2 };
        const byName = (a, b) => rowInfo(a).holder.localeCompare(rowInfo(b).holder, 'en', { sensitivity: 'base', numeric: true });
        const ALLOT_SORTS = {
          name:     ['Name A–Z',      byName],
          member:   ['Member',        (a, b) => rowInfo(a).member.localeCompare(rowInfo(b).member, 'en', { sensitivity: 'base', numeric: true }) || byName(a, b)],
          category: ['Category',      (a, b) => (CAT_RANK[a.category] ?? 9) - (CAT_RANK[b.category] ?? 9) || byName(a, b)],
          status:   ['Status',        (a, b) => (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9) || byName(a, b)],
          lots:     ['Lots applied',  (a, b) => (b.lots || 1) - (a.lots || 1) || byName(a, b)],
        };
        const curStatus = a => changes[a.id]?.status ?? a.status;
        const ALLOT_FILTERS = [['all', 'All'], ['pending', '— Pending'], ['allotted', '✓ Got'], ['not_allotted', '✗ Not got']];
        const aq = allotQuery.trim().toLowerCase();
        const shownAllots = vAllots
          .filter(a => allotFilter === 'all' || curStatus(a) === allotFilter)
          .filter(a => { if (!aq) return true; const r = rowInfo(a); return (r.holder + ' ' + r.member + ' ' + r.pan).toLowerCase().includes(aq); })
          .sort((ALLOT_SORTS[allotSort] || ALLOT_SORTS.name)[1]);
        // Typed-in results are only in memory until Save — don't drop them on a stray tap.
        const closeView = () => hasDirty
          ? askConfirm('Discard unsaved changes?',
              `You've changed ${vAllots.filter(a => changes[a.id]).length} row(s) in ${vIpo?.name || 'this IPO'} without saving. Close and lose them?`,
              discardView, true, 'Discard')
          : discardView();
        const lp = parseFloat(viewListPrice) || 0;
        const issuePrice = vIpo?.bandHigh || 0;
        const autoGain = (sharesVal) => lp > 0 && issuePrice > 0 ? window.rowGain('allotted', lp, issuePrice, sharesVal) : null;
        const markStatus = (a, val) => {
          if (val === 'allotted') {
            const cur = parseInt(changes[a.id]?.shares ?? a.shares) || 0;
            const sh  = cur > 0 ? cur : ((vIpo?.lotSize || 0) * (parseInt(changes[a.id]?.lots ?? a.lots, 10) || 1));
            const g   = autoGain(sh);
            setChanges(prev => ({ ...prev, [a.id]: { ...(prev[a.id] || {}), status: val, shares: sh, ...(g !== null ? { gain: g } : {}) } }));
          } else {
            // Clear the money as well as the flag. "✓ All got" fills a sell
            // price on every row, so correcting one PAN to ✗/pending must drop
            // that row's shares, gain and sell price or it keeps paying out.
            setChanges(prev => ({ ...prev, [a.id]: { ...(prev[a.id] || {}), status: val, shares: 0, gain: 0, sellPrice: '' } }));
          }
        };
        const updateShares = (a, val) => {
          const sh  = parseInt(val) || 0;
          const cur = changes[a.id]?.status ?? a.status;
          // Typing a share count is the admin saying "this PAN got these" —
          // leaving the row pending made Save quietly drop the shares (only
          // allotted rows keep any), so the entry never showed up afterwards.
          const st  = sh > 0 ? 'allotted' : cur;
          const curSp = changes[a.id]?.sellPrice ?? (a.sellPrice != null ? String(a.sellPrice) : '');
          const rsp = parseFloat(curSp) || lp; // row sell price or global
          const g   = st === 'allotted' ? window.rowGain(st, rsp, issuePrice, sh) : 0;
          setChanges(prev => ({ ...prev, [a.id]: { ...(prev[a.id] || {}), status: st, shares: val, gain: g,
            ...(st === 'allotted' && !parseFloat(curSp) && lp > 0 ? { sellPrice: String(lp) } : {}) } }));
        };
        const markAllotted = () => setChanges(prev => {
          const n = { ...prev };
          vAllots.forEach(a => {
            const cur = parseInt(n[a.id]?.shares ?? a.shares) || 0;
            const sh  = cur > 0 ? cur : ((vIpo?.lotSize || 0) * (parseInt(n[a.id]?.lots ?? a.lots, 10) || 1));
            const g   = autoGain(sh);
            n[a.id]   = { ...(n[a.id] || {}), status: 'allotted', shares: sh,
              ...(lp > 0 ? { sellPrice: String(lp) } : {}),
              ...(g !== null ? { gain: g } : {}) };
          });
          return n;
        });
        const markNone = () => setChanges(prev => {
          const n = { ...prev };
          vAllots.forEach(a => { n[a.id] = { ...(n[a.id] || {}), status: 'not_allotted', shares: 0, gain: 0, sellPrice: '' }; });
          return n;
        });

        // ── Bulk paste of registrar results ──────────────────────────────────
        // Parsed live so the admin sees what will happen before committing, and
        // applied into `changes` rather than straight to the database: the
        // normal review-then-Save path already handles status, gain and sell
        // price consistently, so the paste gets those guarantees for free.
        const pasteParsed = window.parseAllotmentPaste(pasteText);
        const panIndex = {};
        vAllots.forEach(a => { const p = D.pan(a.pan); if (p?.pan) panIndex[String(p.pan).toUpperCase()] = a; });
        const pasteMatched = pasteParsed.rows.filter(r => panIndex[r.pan]);
        const pasteUnknown = pasteParsed.rows.filter(r => !panIndex[r.pan]);
        const pasteGot     = pasteMatched.filter(r => r.shares > 0).length;
        const applyPaste = () => {
          const next = {};
          pasteMatched.forEach(r => {
            const a = panIndex[r.pan];
            if (r.shares > 0) {
              const cur = changes[a.id]?.sellPrice ?? (a.sellPrice != null ? String(a.sellPrice) : '');
              const sp  = parseFloat(cur) || lp;
              next[a.id] = { ...(changes[a.id] || {}), status: 'allotted', shares: r.shares,
                sellPrice: sp > 0 ? String(sp) : '',
                gain: window.rowGain('allotted', sp, issuePrice, r.shares) };
            } else {
              next[a.id] = { ...(changes[a.id] || {}), status: 'not_allotted', shares: 0, gain: 0, sellPrice: '' };
            }
          });
          setChanges(prev => ({ ...prev, ...next }));
          setPasteOpen(false); setPasteText('');
        };

        return (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 65, display: 'grid', placeItems: 'center', padding: 12 }}>
            <div className="modal-card" style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', width: '100%', maxWidth: 680, boxShadow: 'var(--sh-pop)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', animation: 'popIn .22s cubic-bezier(.2,.7,.3,1)' }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IpoLogo ipo={vIpo} size={34} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{vIpo?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', display: 'flex', gap: 8 }}>
                      <span>{vAllots.length} applied</span>
                      {allotted > 0 && <span style={{ color: 'var(--profit)', fontWeight: 700 }}>· ✓ {allotted} allotted</span>}
                      {notAllot > 0 && <span style={{ color: 'var(--loss)', fontWeight: 700 }}>· ✗ {notAllot} not allotted</span>}
                      {pending  > 0 && <span style={{ color: 'var(--warn)', fontWeight: 700 }}>· ⏳ {pending} pending</span>}
                    </div>
                    {(() => {
                      const byCat = {};
                      vAllots.forEach(a => { const c = changes[a.id]?.category ?? a.category; byCat[c] = (byCat[c] || 0) + 1; });
                      const cats = ['Retail', 'sHNI', 'bHNI', 'SME'].filter(c => byCat[c]);
                      if (!cats.length) return null;
                      return (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                          {cats.map(c => (
                            <span key={c} style={{ fontSize: 10.5, fontWeight: 700, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 999, padding: '2px 9px', color: 'var(--ink-2)' }}>
                              {vCatLabel(c)} · {byCat[c]}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <IconButton name="x" size={32} onClick={closeView} />
              </div>

              {/* Sell price toolbar */}
              {vAllots.length > 0 && (
                <div style={{ padding: '10px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 700 }}>Common sell price</div>
                      <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600 }}>fills all via "✓ All got"</div>
                    </div>
                    <input type="number" min="0" step="0.05" value={viewListPrice} onChange={e => setViewListPrice(e.target.value)}
                      placeholder="e.g. 415.00"
                      style={{ ...inputSt, width: 110, padding: '5px 9px', fontSize: 13, textAlign: 'right' }} />
                    {issuePrice > 0 && <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>Issue: ₹{issuePrice}</span>}
                    {lp > 0 && issuePrice > 0 && (
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: lp >= issuePrice ? 'var(--profit)' : 'var(--loss)' }}>
                        {lp >= issuePrice ? '+' : ''}{Math.round((lp - issuePrice) / issuePrice * 100)}%
                      </span>
                    )}
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <button onClick={() => setPasteOpen(o => !o)} style={{ border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)', padding: '4px 10px', fontSize: 12, fontWeight: 700, background: pasteOpen ? 'var(--bg)' : 'transparent', color: 'var(--ink-2)', cursor: 'pointer' }}>⇥ Paste results</button>
                    <button onClick={markAllotted} style={{ border: '1px solid var(--profit)', borderRadius: 'var(--r-sm)', padding: '4px 10px', fontSize: 12, fontWeight: 700, background: 'var(--profit-soft)', color: 'var(--profit)', cursor: 'pointer' }}>✓ All got</button>
                    <button onClick={markNone}     style={{ border: '1px solid var(--loss)',   borderRadius: 'var(--r-sm)', padding: '4px 10px', fontSize: 12, fontWeight: 700, background: 'var(--loss-soft)',   color: 'var(--loss)',   cursor: 'pointer' }}>✗ None got</button>
                  </div>
                </div>
              )}

              {/* Bulk paste panel */}
              {pasteOpen && vAllots.length > 0 && (
                <div style={{ padding: '12px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)' }}>Paste the registrar's allotment results</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, marginBottom: 8 }}>
                    One PAN per line with the shares allotted — commas, tabs or spaces all work. Zero or no number means not allotted. Headings and totals are ignored.
                  </div>
                  <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={5}
                    placeholder={'ABCDE1234F\t30\nFGHIJ5678K\t0'}
                    style={{ ...inputSt, width: '100%', fontSize: 12.5, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', resize: 'vertical' }} />
                  {pasteText.trim() && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, flex: 1, minWidth: 200 }}>
                        {pasteMatched.length === 0 ? (
                          <span style={{ color: 'var(--loss)' }}>No pasted PAN matches an applicant for this IPO.</span>
                        ) : (
                          <>
                            <strong>{pasteMatched.length}</strong> of {vAllots.length} applicants matched
                            {' · '}<span style={{ color: 'var(--profit)', fontWeight: 700 }}>✓ {pasteGot}</span>
                            {' · '}<span style={{ color: 'var(--loss)', fontWeight: 700 }}>✗ {pasteMatched.length - pasteGot}</span>
                            {pasteUnknown.length > 0 && (
                              <div style={{ color: 'var(--warn)', fontSize: 11, fontWeight: 600, marginTop: 3 }}>
                                {pasteUnknown.length} PAN{pasteUnknown.length !== 1 ? 's' : ''} not in this IPO — skipped: {pasteUnknown.slice(0, 3).map(r => r.pan).join(', ')}{pasteUnknown.length > 3 ? '…' : ''}
                              </div>
                            )}
                            {pasteParsed.skipped.length > 0 && (
                              <div style={{ color: 'var(--ink-3)', fontSize: 11, marginTop: 2 }}>
                                {pasteParsed.skipped.length} line{pasteParsed.skipped.length !== 1 ? 's' : ''} without a PAN ignored
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <Button variant="primary" size="sm" disabled={pasteMatched.length === 0} onClick={applyPaste}>
                        Fill {pasteMatched.length} row{pasteMatched.length !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
                    Nothing is saved yet — review the table below, then click Save changes.
                  </div>
                </div>
              )}

              {/* Search / sort / filter */}
              {vAllots.length > 1 && (
                <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
                  <input value={allotQuery} onChange={e => setAllotQuery(e.target.value)} placeholder="Search name, member or PAN…" aria-label="Search applicants"
                    style={{ ...inputSt, flex: '1 1 160px', maxWidth: 230, padding: '6px 10px', fontSize: 13 }} />
                  <select value={allotSort} onChange={e => setAllotSort(e.target.value)} aria-label="Sort applicants"
                    style={{ ...inputSt, width: 'auto', padding: '6px 8px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                    {Object.entries(ALLOT_SORTS).map(([k, [label]]) => <option key={k} value={k}>Sort: {label}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {ALLOT_FILTERS.map(([k, label]) => {
                      const n = k === 'all' ? vAllots.length : vAllots.filter(a => curStatus(a) === k).length;
                      const on = allotFilter === k;
                      return (
                        <button key={k} onClick={() => setAllotFilter(k)} style={{
                          border: '1px solid ' + (on ? 'var(--brand)' : 'var(--border)'), borderRadius: 999,
                          background: on ? 'var(--brand-tint)' : 'var(--surface)', color: on ? 'var(--brand)' : 'var(--ink-2)',
                          fontSize: 11.5, fontWeight: 700, padding: '4px 9px', cursor: 'pointer', whiteSpace: 'nowrap',
                        }}>{label} <span style={{ opacity: .7 }}>{n}</span></button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Body — editable table */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {vAllots.length === 0 ? (
                  <div style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                    No applications recorded yet. Use "Who applied?" when adding the IPO.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em', background: 'var(--surface-2)', position: 'sticky', top: 0, zIndex: 1 }}>
                        <th style={{ fontWeight: 700, padding: '9px 8px 9px 16px', textAlign: 'left' }}>Applicant</th>
                        <th style={{ fontWeight: 700, padding: '9px 8px', textAlign: 'left', width: 96 }}>Cat</th>
                        <th style={{ fontWeight: 700, padding: '9px 8px', textAlign: 'center' }}>Status</th>
                        <th style={{ fontWeight: 700, padding: '9px 8px', textAlign: 'right' }}>Shares</th>
                        <th style={{ fontWeight: 700, padding: '9px 8px', textAlign: 'right' }}>
                          <div>Sell Price ₹/share</div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', marginTop: 1 }}>per allottee</div>
                        </th>
                        <th style={{ width: 36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {shownAllots.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                          No applicants match.{' '}
                          <button onClick={() => { setAllotQuery(''); setAllotFilter('all'); }} style={{ border: 'none', background: 'none', color: 'var(--brand)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Show all</button>
                        </td></tr>
                      )}
                      {shownAllots.map(a => {
                        const panObj  = D.pan(a.pan);
                        const mem     = panObj ? D.member(panObj.member) : null;
                        const category  = changes[a.id]?.category  ?? a.category;
                        const status    = changes[a.id]?.status    ?? a.status;
                        const shares    = changes[a.id]?.shares    ?? a.shares;
                        const gain      = changes[a.id]?.gain      ?? a.gain;
                        const sellPrice = changes[a.id]?.sellPrice ?? (a.sellPrice != null ? String(a.sellPrice) : '');
                        const rowBg     = status === 'allotted' ? 'var(--profit-soft)' : status === 'not_allotted' ? 'var(--loss-soft)' : 'transparent';
                        const sp = parseFloat(sellPrice) || 0;
                        const computedGain = sp > 0 && issuePrice > 0 ? window.rowGain(status, sp, issuePrice, shares) : gain;
                        return (
                          <tr key={a.id} style={{ borderTop: '1px solid var(--border)', background: rowBg }}>
                            <td style={{ padding: '10px 8px 10px 16px' }}>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{panObj?.holder || '—'}</div>
                              <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{mem?.name}{panObj?.pan ? ' · ' + panObj.pan : ''}</div>
                            </td>
                            <td style={{ padding: '10px 8px' }}>
                              {(() => {
                                // Keep a legacy 'SME' value selectable rather than
                                // forcing/hiding it — see the vCats comment above.
                                const options = vCats.includes(category) ? vCats : [...vCats, category];
                                return (
                                  <select value={category}
                                    onChange={e => setChange(a.id, 'category', e.target.value)}
                                    style={{ ...inputSt, width: 96, padding: '5px 6px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                                    {options.map(c => <option key={c} value={c}>{vCatLabel(c)}</option>)}
                                  </select>
                                );
                              })()}
                            </td>
                            <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 3, gap: 2 }}>
                                {[['allotted', '✓', 'var(--profit)', 'var(--profit-soft)'], ['not_allotted', '✗', 'var(--loss)', 'var(--loss-soft)'], ['pending', '—', 'var(--ink-2)', 'var(--surface-2)']].map(([val, lbl, col, bg]) => (
                                  <button key={val} onClick={() => markStatus(a, val)} style={{
                                    border: 'none', borderRadius: 'calc(var(--r-md) - 3px)', padding: '5px 10px', fontSize: 14, fontWeight: 800,
                                    background: status === val ? bg : 'transparent',
                                    color: status === val ? col : 'var(--ink-3)',
                                    boxShadow: status === val ? 'var(--sh-sm)' : 'none', cursor: 'pointer', transition: 'all .15s',
                                  }}>{lbl}</button>
                                ))}
                              </div>
                            </td>
                            <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                              {/* Until a row is allotted it has no shares of its own; show the
                                  applied quantity as the hint instead of a bare "0". */}
                              <input type="number" min="0" value={status !== 'allotted' && !(parseInt(shares) > 0) ? '' : shares}
                                onChange={e => updateShares(a, e.target.value)}
                                placeholder={vIpo?.lotSize ? String((parseInt(changes[a.id]?.lots ?? a.lots, 10) || 1) * vIpo.lotSize) : '0'}
                                style={{ ...inputSt, width: 74, padding: '6px 8px', fontSize: 13, textAlign: 'right' }} />
                              {/* Lots applied — editable (stored on the application). */}
                              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: 4, marginTop: 4 }}>
                                <span style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 6 }}>applied</span>
                                <LotsInput value={changes[a.id]?.lots ?? a.lots ?? 1} cat={category} ipo={vIpo} compact
                                  onChange={v => setChange(a.id, 'lots', v)} />
                              </div>
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                              {status === 'allotted' ? (
                                <>
                                  <input type="number" min="0" step="0.05" value={sellPrice}
                                    onChange={e => {
                                      const sp = parseFloat(e.target.value) || 0;
                                      const sh = parseInt(changes[a.id]?.shares ?? a.shares) || 0;
                                      const g  = window.rowGain(status, sp, issuePrice, sh);
                                      setChanges(prev => ({ ...prev, [a.id]: { ...(prev[a.id] || {}), sellPrice: e.target.value, gain: g } }));
                                    }}
                                    placeholder={lp > 0 ? String(lp) : 'e.g. 415.00'}
                                    style={{ ...inputSt, width: 104, padding: '6px 8px', fontSize: 13, textAlign: 'right' }} />
                                  {computedGain !== 0 && (
                                    <div className="num" style={{ fontSize: 11.5, color: computedGain > 0 ? 'var(--profit)' : 'var(--loss)', fontWeight: 700, marginTop: 2 }}>
                                      = {computedGain > 0 ? '+' : '−'}{D.fmtINR(Math.abs(computedGain), { compact: true })} {computedGain > 0 ? 'gain' : 'loss'}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span style={{ color: 'var(--ink-3)', fontSize: 14 }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: '6px 8px 6px 4px', textAlign: 'center' }}>
                              {status === 'pending' && (
                                <IconButton name="trash" size={22} tip="Remove applicant"
                                  onClick={() => askConfirm(
                                    'Remove applicant',
                                    `Remove ${panObj?.holder || 'this applicant'} from ${vIpo?.name}? This cannot be undone.`,
                                    async () => { await D.mutations.removeApplicant(a.id); setViewIpoId(null); setChanges({}); setSaved(false); },
                                    true, 'Remove'
                                  )}
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'var(--surface-2)', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                  {saved && <span style={{ color: 'var(--profit)', fontWeight: 700 }}>✓ Changes saved</span>}
                  {!saved && hasDirty && <span style={{ color: 'var(--warn)', fontWeight: 600 }}>Unsaved changes</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                  <Button variant="ghost" icon="plus" onClick={() => openAddApplicants(viewIpoId)}>Add applicants</Button>
                  <Button variant="ghost" onClick={closeView}>Close</Button>
                  {vAllots.length > 0 && (
                    <Button variant="primary" icon={saved ? 'check' : 'upload'}
                      onClick={() => saveChanges(vAllots)}
                      style={{ opacity: saving ? .7 : 1, pointerEvents: saving ? 'none' : 'auto' }}>
                      {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add applicants to existing IPO modal ── */}
      {addAppIpoId && (() => {
        const aIpo     = D.ipo(addAppIpoId);
        // Same three-way split for SME as Mainboard since SEBI's 1 Jul 2025 rule.
        const isSME    = aIpo?.type === 'SME';
        const cats     = ['Retail', 'sHNI', 'bHNI'];
        const catLabel = (c) => (isSME && c === 'Retail') ? 'Individual' : c;
        const panIds   = Object.keys(addAppSel);
        const selCount = Object.values(addAppSel).filter(v => v.selected).length;
        // flat list of all available PANs (not yet applied), with their member info
        const flatPans = D.pans.filter(p => panIds.includes(p.id)).map(p => ({
          ...p, mem: D.member(p.member)
        }));
        const toggle = (panId) => setAddAppSel(prev => ({ ...prev, [panId]: { ...prev[panId], selected: !prev[panId]?.selected } }));
        return (
          <Modal title={`Add applicants — ${aIpo?.name || ''}`} onClose={() => setAddAppIpoId(null)}>
            {flatPans.length === 0 ? (
              <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                All PANs have already applied to this IPO.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                    <strong style={{ color: 'var(--ink)' }}>{selCount}</strong> of {flatPans.length} selected · tap a row to select
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button variant="ghost" size="sm" onClick={() => setAddAppSel(p => { const n={...p}; Object.keys(n).forEach(id => { n[id]={...n[id],selected:true}; }); return n; })}>All</Button>
                    <Button variant="ghost" size="sm" onClick={() => setAddAppSel(p => { const n={...p}; Object.keys(n).forEach(id => { n[id]={...n[id],selected:false}; }); return n; })}>None</Button>
                  </div>
                </div>

                {/* Flat, fully-clickable PAN list */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden', maxHeight: 380, overflowY: 'auto' }}>
                  {flatPans.map((p, i) => {
                    const sel = addAppSel[p.id] || { selected: false, category: cats[0] };
                    return (
                      <div key={p.id}
                        onClick={() => toggle(p.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
                          borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                          background: sel.selected ? 'var(--brand-tint)' : 'transparent',
                          cursor: 'pointer', userSelect: 'none', transition: 'background .12s',
                        }}>
                        {/* Tick circle */}
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          border: sel.selected ? '2px solid var(--brand)' : '2px solid var(--border)',
                          background: sel.selected ? 'var(--brand)' : 'transparent',
                          display: 'grid', placeItems: 'center', transition: 'all .12s',
                        }}>
                          {sel.selected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="2,6 5,9 10,3"/></svg>}
                        </div>

                        {/* Avatar */}
                        <Avatar name={p.holder} hue={p.mem?.avatarHue || 200} size={34} />

                        {/* Name + sub */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.holder}</div>
                          <div className="num" style={{ fontSize: 11.5, color: 'var(--ink-3)', letterSpacing: '.04em', fontWeight: 700 }}>{p.pan}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                            {p.mem && <span>{p.mem.name}</span>}
                            <Badge tone={{ Self: 'brand', Spouse: 'info', Friend: 'neutral' }[p.relation] || 'neutral'}>{p.relation || 'Self'}</Badge>
                          </div>
                        </div>


                        {/* Category — stop click propagation so dropdown doesn't toggle row */}
                        <select
                          style={{ ...inputSt, width: 96, padding: '5px 7px', fontSize: 12.5, opacity: sel.selected ? 1 : .35 }}
                          value={sel.category}
                          disabled={!sel.selected}
                          onClick={e => e.stopPropagation()}
                          onChange={e => { e.stopPropagation(); const cat = e.target.value; setAddAppSel(prev => ({ ...prev, [p.id]: { ...prev[p.id], category: cat, lots: window.defaultLotsFor(cat, D.ipo(addAppIpoId)) } })); }}>
                          {cats.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
                        </select>
                        <LotsInput value={sel.lots ?? 1} onChange={v => setAddAppSel(prev => ({ ...prev, [p.id]: { ...prev[p.id], lots: v } }))}
                          cat={sel.category} ipo={D.ipo(addAppIpoId)} disabled={!sel.selected} compact />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {addAppErr && <div style={{ color: 'var(--loss)', fontSize: 13, fontWeight: 600 }}>{addAppErr}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setAddAppIpoId(null)}>Cancel</Button>
              {flatPans.length > 0 && (
                <Button variant="primary" onClick={saveAddApplicants}
                  style={{ opacity: (addAppSaving || selCount === 0) ? .6 : 1, pointerEvents: (addAppSaving || selCount === 0) ? 'none' : 'auto' }}>
                  {addAppSaving ? 'Adding…' : selCount > 0 ? `Add ${selCount} applicant${selCount !== 1 ? 's' : ''}` : 'Select applicants'}
                </Button>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* ── Confirm dialog ── */}
      <ConfirmDialog dlg={confirmDlg} onClose={() => setConfirmDlg(null)} />
      {notice && (
        <div role="alert" style={{ position: 'fixed', left: 16, right: 16, bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))', zIndex: 80, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto', maxWidth: 520, width: '100%', background: 'var(--surface)', border: '1px solid var(--loss)', borderLeft: '4px solid var(--loss)', borderRadius: 'var(--r-md)', boxShadow: 'var(--sh-pop)', padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 800, color: 'var(--loss)', marginBottom: 2 }}>Couldn't complete that</div>
              {notice}
            </div>
            <IconButton name="x" size={28} tip="Dismiss" onClick={() => setNotice(null)} />
          </div>
        </div>
      )}

    </div>
  );
}

Object.assign(window, { PanManagement, AdminPanel });
