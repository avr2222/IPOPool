/* ============================================================
   IPO Pool — UI primitives + icons
   ============================================================ */

// ---------- Icons (stroke, 24 grid) ----------
const ICONS = {
  dashboard: 'M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z',
  calendar: 'M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
  allot: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  pool: 'M12 2v20M2 12h20M5 5l14 14M19 5L5 19',
  ledger: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h5',
  pan: 'M3 5h18v14H3zM3 9h18M7 14h4',
  groups: 'M16 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0ZM3 21v-1a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v1',
  analytics: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  admin: 'M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4Z',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  plus: 'M12 5v14M5 12h14',
  chevR: 'M9 18l6-6-6-6',
  chevD: 'M6 9l6 6 6-6',
  chevL: 'M15 18l-6-6 6-6',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
  arrowDown: 'M12 5v14M19 12l-7 7-7-7',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18M6 6l12 12',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z',
  trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  download: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  filter: 'M3 4h18l-7 8v6l-4 2v-8L3 4Z',
  wallet: 'M3 7h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12v4M17 13h.01',
  trend: 'M3 17l6-6 4 4 8-8M21 7h-5M21 7v5',
  rupee: 'M6 3h12M6 8h12M14 21L6 12c5 0 8-1 8-4',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M6 6L4.5 4.5M19.5 19.5 18 18M18 6l1.5-1.5M4.5 19.5 6 18M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM22 6l-10 7L2 6',
  shield: 'M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4Z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  dot: 'M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
  spark: 'M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z',
  upload: 'M12 21V9M7 14l5-5 5 5M5 3h14',
  external: 'M15 3h6v6M10 14L21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5',
  menu: 'M3 12h18M3 6h18M3 18h18',
  lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2ZM7 11V7a5 5 0 0 1 10 0v4',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  eyeOff: 'M17.9 17.4A10.1 10.1 0 0 1 12 20c-7 0-11-8-11-8a18.1 18.1 0 0 1 5.1-5.9M10.6 5.1A9.3 9.3 0 0 1 12 5c7 0 11 8 11 8a18.2 18.2 0 0 1-2.2 3.1M1 1l22 22M14.1 14.1a3 3 0 0 1-4.2-4.2',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z',
};
function Icon({ name, size = 20, stroke = 2, color = 'currentColor', style }) {
  const filled = name === 'dot';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}
      stroke={filled ? 'none' : color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={ICONS[name] || ''} />
    </svg>
  );
}

// ---------- Card ----------
function Card({ children, pad = 18, className = '', style = {}, hover = false, onClick }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className={className}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
        padding: pad, boxShadow: hover && h ? 'var(--sh-md)' : 'var(--sh-sm)',
        transition: 'box-shadow .2s, transform .2s, border-color .2s',
        transform: hover && h ? 'translateY(-2px)' : 'none',
        borderColor: hover && h ? 'var(--border-strong)' : 'var(--border)',
        cursor: onClick ? 'pointer' : 'default', ...style,
      }}>
      {children}
    </div>
  );
}

// ---------- Badge / Pill ----------
function Badge({ children, tone = 'neutral', size = 'sm', icon }) {
  const tones = {
    neutral: ['var(--ink-2)', 'var(--bg)'],
    profit: ['var(--profit)', 'var(--profit-soft)'],
    loss: ['var(--loss)', 'var(--loss-soft)'],
    info: ['var(--info)', 'var(--info-soft)'],
    warn: ['var(--warn)', 'var(--warn-soft)'],
    sme: ['var(--sme)', 'var(--sme-soft)'],
    mainboard: ['var(--mainboard)', 'var(--mainboard-soft)'],
    brand: ['var(--brand)', 'var(--brand-tint)'],
  };
  const [c, bg] = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, color: c, background: bg,
      fontWeight: 700, fontSize: size === 'sm' ? 11.5 : 13, padding: size === 'sm' ? '3px 9px' : '5px 12px',
      borderRadius: 999, lineHeight: 1.3, whiteSpace: 'nowrap',
    }}>
      {icon && <Icon name={icon} size={size === 'sm' ? 12 : 14} stroke={2.4} />}
      {children}
    </span>
  );
}

// ---------- Button ----------
function Button({ children, variant = 'primary', size = 'md', icon, iconRight, onClick, full, style = {}, disabled }) {
  const [h, setH] = useState(false);
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700,
    borderRadius: 'var(--r-md)', border: '1px solid transparent', transition: 'all .15s', whiteSpace: 'nowrap',
    fontSize: size === 'sm' ? 13 : size === 'lg' ? 16 : 14, padding: size === 'sm' ? '7px 13px' : size === 'lg' ? '13px 22px' : '10px 17px',
    width: full ? '100%' : 'auto', opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto',
  };
  const variants = {
    primary: { background: h ? 'var(--brand-600)' : 'var(--brand)', color: '#fff', boxShadow: 'var(--sh-sm)' },
    dark: { background: h ? '#000' : 'var(--ink)', color: 'var(--surface)' },
    ghost: { background: h ? 'var(--bg)' : 'transparent', color: 'var(--ink)', borderColor: 'var(--border-strong)' },
    soft: { background: h ? 'var(--brand-tint-2)' : 'var(--brand-tint)', color: 'var(--brand)' },
    danger: { background: h ? 'var(--loss)' : 'var(--loss-soft)', color: h ? '#fff' : 'var(--loss)' },
    plain: { background: 'transparent', color: 'var(--ink-2)' },
  };
  return (
    <button onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} stroke={2.3} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 15 : 17} stroke={2.3} />}
    </button>
  );
}

function IconButton({ name, onClick, active, size = 38, tip }) {
  const [h, setH] = useState(false);
  return (
    <button onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick} title={tip}
      style={{
        width: size, height: size, display: 'grid', placeItems: 'center', borderRadius: 'var(--r-md)',
        border: '1px solid', borderColor: active ? 'var(--brand)' : h ? 'var(--border-strong)' : 'var(--border)',
        background: active ? 'var(--brand-tint)' : h ? 'var(--surface-2)' : 'var(--surface)',
        color: active ? 'var(--brand)' : 'var(--ink-2)', transition: 'all .15s', position: 'relative',
      }}>
      <Icon name={name} size={19} />
    </button>
  );
}

// ---------- Avatar ----------
function Avatar({ name, hue = 200, size = 36, you = false }) {
  const init = (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, hsl(${hue} 60% 52%), hsl(${hue + 24} 64% 42%))`,
      color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: size * 0.38,
      boxShadow: you ? '0 0 0 2px var(--surface), 0 0 0 4px var(--brand)' : 'none',
    }}>{init}</div>
  );
}

// ---------- IPO logo tile ----------
function IpoLogo({ ipo, size = 44 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 'var(--r-md)', flexShrink: 0,
      background: `hsl(${ipo.hue} 70% 96%)`, color: `hsl(${ipo.hue} 64% 38%)`,
      border: `1px solid hsl(${ipo.hue} 50% 88%)`,
      display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: size * 0.34, letterSpacing: '-.02em',
    }}>{ipo.logo}</div>
  );
}

// ---------- Section header ----------
function SectionTitle({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.01em' }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

// ---------- Status dot ----------
function StatusDot({ tone }) {
  const map = { profit: 'var(--profit)', loss: 'var(--loss)', warn: 'var(--warn)', info: 'var(--info)', neutral: 'var(--ink-3)' };
  return <span style={{ width: 8, height: 8, borderRadius: 999, background: map[tone] || map.neutral, display: 'inline-block', flexShrink: 0 }} />;
}

// ---------- Segmented control ----------
function Segmented({ options, value, onChange, size = 'md' }) {
  return (
    <div style={{ display: 'inline-flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 3, gap: 2 }}>
      {options.map(o => {
        const v = typeof o === 'string' ? o : o.v;
        const label = typeof o === 'string' ? o : o.label;
        const active = v === value;
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            border: 'none', borderRadius: 'calc(var(--r-md) - 3px)', padding: size === 'sm' ? '5px 11px' : '7px 15px',
            fontSize: size === 'sm' ? 12.5 : 13.5, fontWeight: 700, transition: 'all .15s',
            background: active ? 'var(--surface)' : 'transparent', color: active ? 'var(--ink)' : 'var(--ink-3)',
            boxShadow: active ? 'var(--sh-sm)' : 'none',
          }}>{label}</button>
        );
      })}
    </div>
  );
}

// ---------- Meter (progress bar) ----------
function Meter({ value = 0, max = 1, color = 'var(--brand)', style = {} }) {
  const pct = max > 0 ? Math.min(100, Math.round(value / max * 100)) : 0;
  return (
    <div style={{ height: 4, borderRadius: 999, background: 'var(--border)', overflow: 'hidden', ...style }}>
      <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 999, transition: 'width .4s' }} />
    </div>
  );
}

Object.assign(window, { Icon, Card, Badge, Button, IconButton, Avatar, IpoLogo, SectionTitle, StatusDot, Segmented, Meter });
