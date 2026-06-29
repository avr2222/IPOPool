/* ============================================================
   IPO Pool — PAN Management & Admin Panel
   ============================================================ */

// ── Shared modal wrapper ──────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 60, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', width: '100%', maxWidth: 460, boxShadow: '0 24px 64px rgba(0,0,0,.2)', overflow: 'hidden' }}>
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
function ConfirmDialog({ dlg, onClose }) {
  if (!dlg) return null;
  const btnSt = dlg.danger
    ? { background: 'var(--loss)', color: '#fff', border: 'none', borderRadius: 'var(--r-md)', padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }
    : {};
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 70, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,.25)', overflow: 'hidden' }}>
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
          const apps = D.allotments.filter(a => a.pan === p.id).length;
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
  const [addIpoStep, setAddIpoStep] = useState(null); // null | 'details' | 'applicants'
  const [newIpoId,  setNewIpoId]  = useState(null);
  const [ipoForm, setIpoForm]   = useState({ name: '', shortName: '', type: 'SME', price: '', lotSize: '', openDate: '', closeDate: '', allotDate: '', listDate: '' });
  const [editIpoId,   setEditIpoId]   = useState(null);
  const [editIpoForm, setEditIpoForm] = useState({ name: '', shortName: '', type: 'SME', price: '', lotSize: '' });
  const [editIpoSaving, setEditIpoSaving] = useState(false);
  const [editIpoErr,    setEditIpoErr]    = useState('');
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
      const defaults = {};
      window.DB.pans.forEach(p => { defaults[p.id] = { selected: false, category: saved.type === 'SME' ? 'SME' : 'Retail' }; });
      setApplicantSel(defaults);
      setAddIpoStep('applicants');
    } catch(e) { setIpoErr(e.message); }
    setIpoSaving(false);
  };

  const saveApplications = async () => {
    const rows = Object.entries(applicantSel)
      .filter(([, v]) => v.selected)
      .map(([panId, v]) => ({ panId, category: v.category }));
    if (rows.length === 0) { closeAddIpo(); return; }
    setAppSaving(true); setAppErr('');
    try {
      await D.mutations.addApplications(newIpoId, rows);
      closeAddIpo();
    } catch(e) { setAppErr(e.message); }
    setAppSaving(false);
  };

  const togglePan  = (panId) => setApplicantSel(prev => ({ ...prev, [panId]: { ...prev[panId], selected: !prev[panId]?.selected } }));
  const setCat     = (panId, cat) => setApplicantSel(prev => ({ ...prev, [panId]: { ...prev[panId], category: cat } }));
  const selectAll  = () => setApplicantSel(prev => { const n = {...prev}; Object.keys(n).forEach(id => { n[id] = {...n[id], selected: true}; }); return n; });
  const deselectAll = () => setApplicantSel(prev => { const n = {...prev}; Object.keys(n).forEach(id => { n[id] = {...n[id], selected: false}; }); return n; });

  const deleteIpo = (id, name) => askConfirm(
    `Delete "${name}"?`,
    'All applications and allotments for this IPO will also be permanently deleted.',
    async () => { try { await D.mutations.deleteIpo(id); setIpos([...window.DB.ipos]); } catch(e) { alert(e.message); } }
  );

  const openEditIpo = (ip) => {
    setEditIpoId(ip.id);
    setEditIpoForm({ name: ip.name, shortName: ip.short || '', type: ip.type, price: ip.bandHigh || '', lotSize: ip.lotSize || '' });
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
      });
      setIpos([...window.DB.ipos]);
      setEditIpoId(null);
    } catch(e) { setEditIpoErr(e.message); }
    setEditIpoSaving(false);
  };

  const openAddApplicants = (ipoId) => {
    const ipoType = D.ipo(ipoId)?.type || 'SME';
    const alreadyApplied = new Set(D.allotments.filter(a => a.ipo === ipoId).map(a => a.pan));
    const defaults = {};
    D.pans.filter(p => !alreadyApplied.has(p.id)).forEach(p => {
      defaults[p.id] = { selected: false, category: ipoType === 'SME' ? 'SME' : 'Retail' };
    });
    setAddAppSel(defaults);
    setAddAppIpoId(ipoId);
    setAddAppErr('');
  };

  const saveAddApplicants = async () => {
    const rows = Object.entries(addAppSel)
      .filter(([, v]) => v.selected)
      .map(([panId, v]) => ({ panId, category: v.category }));
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

  const setChange = (id, field, val) =>
    setChanges(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: val } }));

  const saveChanges = async (viewRows) => {
    setSaving(true); setSaved(false);
    try {
      const dirty = viewRows
        .map(a => {
          const c  = changes[a.id] || {};
          const sh = parseInt(c.shares ?? a.shares) || 0;
          const rawSp = c.sellPrice ?? (a.sellPrice != null ? String(a.sellPrice) : '');
          const sp = parseFloat(rawSp) || 0;
          const bandHigh = window.DB.ipo(a.ipo)?.bandHigh || 0;
          const computedGain = sp > 0 && bandHigh > 0 ? Math.max(0, Math.round((sp - bandHigh) * sh)) : parseFloat(c.gain ?? a.gain) || 0;
          return {
            id:        a.id,
            status:    c.status ?? a.status,
            shares:    sh,
            gain:      computedGain,
            sellPrice: sp > 0 ? sp : null,
          };
        })
        .filter((r, i) => {
          const a = viewRows[i];
          return r.status !== a.status || r.shares !== a.shares || r.gain !== a.gain || r.sellPrice !== a.sellPrice;
        });
      if (dirty.length === 0) { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); return; }
      await D.mutations.saveAllotmentChanges(dirty);
      setChanges({});
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch(e) { alert(e.message); }
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
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: '', email: '', phone: '', pan: '', bank: '' });
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberErr, setMemberErr] = useState('');

  const [showAddPan, setShowAddPan]     = useState(null);   // member id
  const [panForm, setPanForm]           = useState({ pan: '', holderName: '', relation: 'Self', bank: '' });
  const [panSaving, setPanSaving]       = useState(false);
  const [panErr, setPanErr]             = useState('');

  const saveMember = async () => {
    if (!memberForm.name) { setMemberErr('Name is required.'); return; }
    if (memberForm.pan && memberForm.pan.length !== 10) { setMemberErr('PAN must be exactly 10 characters.'); return; }
    setMemberSaving(true); setMemberErr('');
    try {
      const added = await D.mutations.addMember({ ...memberForm, avatarHue: Math.floor(Math.random() * 360) });
      if (memberForm.pan) {
        await D.mutations.addPan({ memberId: added.id, pan: memberForm.pan, holderName: memberForm.name, relation: 'Self', bank: memberForm.bank || null });
      }
      setMembers([...window.DB.members]);
      setShowAddMember(false);
      setMemberForm({ name: '', email: '', phone: '', pan: '', bank: '' });
    } catch(e) { setMemberErr(e.message); }
    setMemberSaving(false);
  };

  const savePan = async () => {
    if (!panForm.pan || !panForm.holderName) { setPanErr('PAN and holder name are required.'); return; }
    setPanSaving(true); setPanErr('');
    try {
      await D.mutations.addPan({ memberId: showAddPan, ...panForm });
      setMembers([...window.DB.members]); // refresh to show updated PAN counts
      setShowAddPan(null);
      setPanForm({ pan: '', holderName: '', relation: 'Self', bank: '' });
    } catch(e) { setPanErr(e.message); }
    setPanSaving(false);
  };

  const deleteMember = (id, name) => askConfirm(
    `Remove "${name}"?`,
    'This member and all their PAN accounts will be permanently removed from the pool.',
    async () => { try { await D.mutations.deleteMember(id); setMembers([...window.DB.members]); } catch(e) { alert(e.message); } }
  );

  // ── Edit member ──
  const [editMember, setEditMember]         = useState(null);
  const [editMemberForm, setEditMemberForm] = useState({});
  const [editMemberSaving, setEditMemberSaving] = useState(false);
  const [editMemberErr, setEditMemberErr]   = useState('');

  const openEditMember = (m) => { setEditMember(m); setEditMemberForm({ name: m.name, email: m.email || '', phone: m.phone || '' }); setEditMemberErr(''); };

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

  const pendingAllots = D.allotments.filter(a => a.status === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* KPIs */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          ['IPOs tracked',   ipos.length,              'calendar', 'neutral'],
          ['Members',        members.length,            'groups',   'info'],
          ['Total PANs',     D.pans.length,             'pan',      'brand'],
          ['Pending allots', pendingAllots,             'clock',    pendingAllots > 0 ? 'warn' : 'neutral'],
        ].map(([l, v, ic, tone]) => (
          <KPICard key={l} icon={ic} label={l} value={v} tone={tone} />
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
              <Button variant="primary" size="sm" icon="plus" onClick={() => setAddIpoStep('details')}>New IPO</Button>
            </div>
            {ipos.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No IPOs yet. Add one above.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                  <thead><tr style={{ fontSize: 11.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    {['IPO', 'Board', 'Price', 'Lot size', ''].map((h, i) => (
                      <th key={i} style={{ textAlign: i > 2 ? 'right' : 'left', fontWeight: 700, padding: '10px 18px' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {ipos.map(ip => (
                      <tr key={ip.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '11px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <IpoLogo ipo={ip} size={30} />
                            <div>
                              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{ip.name}</div>
                              {ip.short !== ip.name && <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{ip.short}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '11px 18px' }}><Badge tone={ip.type === 'SME' ? 'sme' : 'mainboard'}>{ip.type}</Badge></td>
                        <td className="num" style={{ padding: '11px 18px', fontSize: 13 }}>{ip.bandHigh ? '₹' + Number(ip.bandHigh).toLocaleString('en-IN') : '—'}</td>
                        <td className="num" style={{ padding: '11px 18px', textAlign: 'right', fontSize: 13 }}>{ip.lotSize || '—'}</td>
                        <td style={{ padding: '11px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <Button variant="primary" size="sm" icon="allot"
                            onClick={() => { setViewIpoId(ip.id); setChanges({}); setSaved(false); }}
                            style={{ marginRight: 6 }}>
                            Allotments
                          </Button>
                          <IconButton name="edit" size={30} tip="Edit IPO" onClick={() => openEditIpo(ip)} />
                          <IconButton name="trash" size={30} tip="Delete" onClick={() => deleteIpo(ip.id, ip.short)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                          <Avatar name={m.name} hue={m.avatarHue} size={40} you={m.you} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 14.5, fontWeight: 800 }}>{m.name}</span>
                              {m.you && <span style={{ fontSize: 10.5, color: 'var(--brand)', fontWeight: 700, background: 'var(--brand-tint)', padding: '2px 7px', borderRadius: 999 }}>You</span>}
                              <Badge tone={m.role === 'Admin' ? 'brand' : 'neutral'}>{m.role}</Badge>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>
                              {contact && <span>{contact} · </span>}
                              <span style={{ fontWeight: 600 }}>{mPans.length} PAN{mPans.length !== 1 ? 's' : ''}</span>
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
                              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
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
              <input style={inputSt} type="date" value={ipoForm.closeDate} onChange={e => setIpoForm(p => ({ ...p, closeDate: e.target.value }))} />
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
        const isSME    = (newIpo?.type || 'SME') === 'SME';
        const cats     = isSME ? ['SME'] : ['Retail', 'sHNI', 'bHNI'];
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
                      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{p.holder}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {p.mem && <span>{p.mem.name}</span>}
                        {p.mem?.you && <span style={{ color: 'var(--brand)', fontWeight: 700 }}>· You</span>}
                        <Badge tone={{ Self: 'brand', Spouse: 'info', Friend: 'neutral' }[p.relation] || 'neutral'}>{p.relation || 'Self'}</Badge>
                      </div>
                    </div>
                    <span className="num" style={{ fontSize: 12.5, color: 'var(--ink-3)', letterSpacing: '.05em', fontWeight: 700 }}>{p.pan}</span>
                    {!isSME ? (
                      <select
                        style={{ ...inputSt, width: 86, padding: '5px 7px', fontSize: 12.5, opacity: sel.selected ? 1 : .35 }}
                        value={sel.category} disabled={!sel.selected}
                        onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); setCat(p.id, e.target.value); }}>
                        {cats.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', minWidth: 36, textAlign: 'right' }}>SME</span>
                    )}
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
          <Field label="Phone">
            <input style={inputSt} value={memberForm.phone} onChange={e => setMemberForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
          </Field>
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
          {editIpoErr && <div style={{ color: 'var(--loss)', fontSize: 13, fontWeight: 600 }}>{editIpoErr}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
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
          <Field label="Phone">
            <input style={inputSt} value={editMemberForm.phone} onChange={e => setEditMemberForm(p => ({ ...p, phone: e.target.value }))} />
          </Field>
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
        const vAllots = D.allotments.filter(a => a.ipo === viewIpoId);
        const countBy = s => vAllots.filter(a => (changes[a.id]?.status ?? a.status) === s).length;
        const allotted = countBy('allotted'), notAllot = countBy('not_allotted'), pending = countBy('pending');
        const hasDirty = vAllots.some(a => changes[a.id]);
        const closeView = () => { setViewIpoId(null); setChanges({}); setSaved(false); setViewListPrice(''); };
        const lp = parseFloat(viewListPrice) || 0;
        const issuePrice = vIpo?.bandHigh || 0;
        const autoGain = (sharesVal) => lp > 0 && issuePrice > 0 ? Math.max(0, Math.round((lp - issuePrice) * sharesVal)) : null;
        const markStatus = (a, val) => {
          if (val === 'allotted') {
            const cur = parseInt(changes[a.id]?.shares ?? a.shares) || 0;
            const sh  = cur > 0 ? cur : (vIpo?.lotSize || 0);
            const g   = autoGain(sh);
            setChanges(prev => ({ ...prev, [a.id]: { ...(prev[a.id] || {}), status: val, shares: sh, ...(g !== null ? { gain: g } : {}) } }));
          } else {
            setChange(a.id, 'status', val);
          }
        };
        const updateShares = (a, val) => {
          const sh  = parseInt(val) || 0;
          const st  = changes[a.id]?.status ?? a.status;
          const rsp = parseFloat(changes[a.id]?.sellPrice) || lp; // row sell price or global
          const g   = st === 'allotted' && rsp > 0 && issuePrice > 0
            ? Math.max(0, Math.round((rsp - issuePrice) * sh))
            : autoGain(sh);
          setChanges(prev => ({ ...prev, [a.id]: { ...(prev[a.id] || {}), shares: val, ...(g !== null ? { gain: g } : {}) } }));
        };
        const markAllotted = () => setChanges(prev => {
          const n = { ...prev };
          vAllots.forEach(a => {
            const cur = parseInt(n[a.id]?.shares ?? a.shares) || 0;
            const sh  = cur > 0 ? cur : (vIpo?.lotSize || 0);
            const g   = autoGain(sh);
            n[a.id]   = { ...(n[a.id] || {}), status: 'allotted', shares: sh,
              ...(lp > 0 ? { sellPrice: String(lp) } : {}),
              ...(g !== null ? { gain: g } : {}) };
          });
          return n;
        });
        const markNone = () => setChanges(prev => {
          const n = { ...prev };
          vAllots.forEach(a => { n[a.id] = { ...(n[a.id] || {}), status: 'not_allotted' }; });
          return n;
        });
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 60, display: 'grid', placeItems: 'center', padding: 12 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', width: '100%', maxWidth: 680, boxShadow: '0 24px 64px rgba(0,0,0,.25)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

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
                    <button onClick={markAllotted} style={{ border: '1px solid var(--profit)', borderRadius: 'var(--r-sm)', padding: '4px 10px', fontSize: 12, fontWeight: 700, background: 'var(--profit-soft)', color: 'var(--profit)', cursor: 'pointer' }}>✓ All got</button>
                    <button onClick={markNone}     style={{ border: '1px solid var(--loss)',   borderRadius: 'var(--r-sm)', padding: '4px 10px', fontSize: 12, fontWeight: 700, background: 'var(--loss-soft)',   color: 'var(--loss)',   cursor: 'pointer' }}>✗ None got</button>
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
                        <th style={{ fontWeight: 700, padding: '9px 8px', textAlign: 'left' }}>Cat</th>
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
                      {vAllots.map(a => {
                        const panObj  = D.pan(a.pan);
                        const mem     = panObj ? D.member(panObj.member) : null;
                        const catMeta = (window.CAT_META || {})[a.category] || { label: a.category, tone: 'neutral' };
                        const status    = changes[a.id]?.status    ?? a.status;
                        const shares    = changes[a.id]?.shares    ?? a.shares;
                        const gain      = changes[a.id]?.gain      ?? a.gain;
                        const sellPrice = changes[a.id]?.sellPrice ?? (a.sellPrice != null ? String(a.sellPrice) : '');
                        const rowBg     = status === 'allotted' ? 'var(--profit-soft)' : status === 'not_allotted' ? 'var(--loss-soft)' : 'transparent';
                        const sp = parseFloat(sellPrice) || 0;
                        const computedGain = sp > 0 && issuePrice > 0 ? Math.max(0, Math.round((sp - issuePrice) * (parseInt(shares) || 0))) : gain;
                        return (
                          <tr key={a.id} style={{ borderTop: '1px solid var(--border)', background: rowBg }}>
                            <td style={{ padding: '10px 8px 10px 16px' }}>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{panObj?.holder || '—'}</div>
                              <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{mem?.name}{panObj?.pan ? ' · ' + panObj.pan : ''}</div>
                            </td>
                            <td style={{ padding: '10px 8px' }}><Badge tone={catMeta.tone}>{catMeta.label}</Badge></td>
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
                              <input type="number" min="0" value={shares}
                                onChange={e => updateShares(a, e.target.value)}
                                style={{ ...inputSt, width: 74, padding: '6px 8px', fontSize: 13, textAlign: 'right' }} />
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                              {status === 'allotted' ? (
                                <>
                                  <input type="number" min="0" step="0.05" value={sellPrice}
                                    onChange={e => {
                                      const sp = parseFloat(e.target.value) || 0;
                                      const sh = parseInt(changes[a.id]?.shares ?? a.shares) || 0;
                                      const g  = sp > 0 && issuePrice > 0 ? Math.max(0, Math.round((sp - issuePrice) * sh)) : 0;
                                      setChanges(prev => ({ ...prev, [a.id]: { ...(prev[a.id] || {}), sellPrice: e.target.value, gain: g } }));
                                    }}
                                    placeholder={lp > 0 ? String(lp) : 'e.g. 415.00'}
                                    style={{ ...inputSt, width: 104, padding: '6px 8px', fontSize: 13, textAlign: 'right' }} />
                                  {computedGain > 0 && (
                                    <div className="num" style={{ fontSize: 11.5, color: 'var(--profit)', fontWeight: 700, marginTop: 2 }}>
                                      = +{D.fmtINR(computedGain, { compact: true })} gain
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
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'var(--surface-2)', gap: 10 }}>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                  {saved && <span style={{ color: 'var(--profit)', fontWeight: 700 }}>✓ Changes saved</span>}
                  {!saved && hasDirty && <span style={{ color: 'var(--warn)', fontWeight: 600 }}>Unsaved changes</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
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
        const isSME    = aIpo?.type === 'SME';
        const cats     = isSME ? ['SME'] : ['Retail', 'sHNI', 'bHNI'];
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
                          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{p.holder}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            {p.mem && <span>{p.mem.name}</span>}
                            <Badge tone={{ Self: 'brand', Spouse: 'info', Friend: 'neutral' }[p.relation] || 'neutral'}>{p.relation || 'Self'}</Badge>
                          </div>
                        </div>

                        {/* PAN number */}
                        <span className="num" style={{ fontSize: 12.5, color: 'var(--ink-3)', letterSpacing: '.05em', fontWeight: 700 }}>{p.pan}</span>

                        {/* Category — stop click propagation so dropdown doesn't toggle row */}
                        {!isSME ? (
                          <select
                            style={{ ...inputSt, width: 86, padding: '5px 7px', fontSize: 12.5, opacity: sel.selected ? 1 : .35 }}
                            value={sel.category}
                            disabled={!sel.selected}
                            onClick={e => e.stopPropagation()}
                            onChange={e => { e.stopPropagation(); setAddAppSel(prev => ({ ...prev, [p.id]: { ...prev[p.id], category: e.target.value } })); }}>
                            {cats.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', minWidth: 36, textAlign: 'right' }}>SME</span>
                        )}
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

    </div>
  );
}

Object.assign(window, { PanManagement, AdminPanel });
