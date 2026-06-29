/* ============================================================
   IPO Pool — SVG charts (no external libs)
   ============================================================ */
const { useState, useId, useMemo } = React;

// ---- Area / line chart ----
function AreaChart({ data, w = 520, h = 180, pad = 8, color = 'var(--brand)', fmt }) {
  const uid = useId().replace(/:/g, '');
  const vals = data.map(d => d.v);
  const max = Math.max(...vals) * 1.12, min = Math.min(0, ...vals);
  const innerH = h - 28;
  const x = i => pad + (i * (w - pad * 2)) / (data.length - 1);
  const y = v => innerH - ((v - min) / (max - min)) * (innerH - 10) + 4;
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${innerH + 4} L${x(0).toFixed(1)},${innerH + 4} Z`;
  const [hi, setHi] = useState(null);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.18" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1={pad} x2={w - pad} y1={4 + (innerH - 4) * t} y2={4 + (innerH - 4) * t}
          stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4" />
      ))}
      <path d={area} fill={`url(#g${uid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ '--len': '1200', strokeDasharray: 1200, animation: 'drawLine 1.1s ease forwards' }} />
      {data.map((d, i) => (
        <g key={i} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)} style={{ cursor: 'pointer' }}>
          <rect x={x(i) - (w / data.length) / 2} y="0" width={w / data.length} height={h} fill="transparent" />
          <circle cx={x(i)} cy={y(d.v)} r={hi === i ? 5 : 3} fill="var(--surface)" stroke={color} strokeWidth="2.5" />
          <text x={x(i)} y={h - 2} textAnchor="middle" fontSize="11" fill="var(--ink-3)" fontWeight="600">{d.m}</text>
          {hi === i && (
            <g>
              <rect x={x(i) - 34} y={y(d.v) - 32} width="68" height="22" rx="6" fill="var(--ink)" />
              <text x={x(i)} y={y(d.v) - 17} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">{fmt ? fmt(d.v) : d.v}</text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

// ---- Grouped bar chart ----
function BarChart({ data, keys, colors, w = 520, h = 190, fmt }) {
  const max = Math.max(...data.flatMap(d => keys.map(k => d[k]))) * 1.15;
  const innerH = h - 26, pad = 6;
  const groupW = (w - pad * 2) / data.length;
  const bw = Math.min(18, (groupW - 16) / keys.length);
  const [hi, setHi] = useState(null);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      {[0.5, 1].map(t => (
        <line key={t} x1={pad} x2={w - pad} y1={4 + (innerH - 4) * (1 - t)} y2={4 + (innerH - 4) * (1 - t)}
          stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4" />
      ))}
      {data.map((d, i) => {
        const gx = pad + i * groupW + groupW / 2;
        const totalW = keys.length * bw + (keys.length - 1) * 5;
        return (
          <g key={i} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)}>
            {keys.map((k, j) => {
              const bh = (d[k] / max) * (innerH - 6);
              const bx = gx - totalW / 2 + j * (bw + 5);
              return (
                <rect key={k} x={bx} y={innerH - bh + 4} width={bw} height={Math.max(bh, 1)} rx="3"
                  fill={colors[j]} opacity={hi === null || hi === i ? 1 : 0.45}>
                  <title>{k}: {fmt ? fmt(d[k]) : d[k]}</title>
                </rect>
              );
            })}
            <text x={gx} y={h - 2} textAnchor="middle" fontSize="11" fill="var(--ink-3)" fontWeight="600">{d.m}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---- Donut ----
function Donut({ segments, size = 168, stroke = 22, centerLabel, centerSub }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.v, 0);
  let acc = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const frac = s.v / total;
          const dash = `${frac * c} ${c}`;
          const off = -acc * c;
          acc += frac;
          return (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
              strokeDasharray={dash} strokeDashoffset={off} strokeLinecap="butt"
              style={{ '--circ': c, animation: `sweep 1s ${i * 0.12}s ease both` }} />
          );
        })}
      </svg>
      {centerLabel != null && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <div className="num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{centerLabel}</div>
            {centerSub && <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, marginTop: 2 }}>{centerSub}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Sparkline ----
function Sparkline({ data, w = 96, h = 30, color = 'var(--brand)', up = true }) {
  const max = Math.max(...data), min = Math.min(...data);
  const x = i => (i * w) / (data.length - 1);
  const y = v => h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
  const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const col = up ? 'var(--profit)' : 'var(--loss)';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={line} fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---- Horizontal progress / subscription meter ----
function Meter({ value, max = 1, color = 'var(--brand)', track = 'var(--border)', h = 8 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ background: track, borderRadius: 999, height: h, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 999, transition: 'width .8s cubic-bezier(.2,.7,.3,1)' }} />
    </div>
  );
}

Object.assign(window, { AreaChart, BarChart, Donut, Sparkline, Meter });
