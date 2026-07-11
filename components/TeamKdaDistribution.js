'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { api } from '../lib/api';
import { img as imgUrl } from '../lib/images';
import { RoleImg } from './Images';

// Team-wide Kill / Death / Assist map distribution. The team version of the PH
// per-player kda-distribution: every roster member's K/D/A events, geolocated to
// the acting member's position and keyed by the OPPOSING role involved. Backend
// does the event derivation; this only draws. Rich (MSC 2026) data only.

const ROLES = ['EXP LANE', 'JUNGLE', 'MID LANE', 'ROAM', 'GOLD LANE'];
const ROLE_COLOR = { 'EXP LANE': '#c8e6c9', 'JUNGLE': '#ff8a4c', 'MID LANE': '#64b5f6', 'ROAM': '#ce93d8', 'GOLD LANE': '#ffd54f' };
const CATEGORIES = [
  { key: 'kill',   label: 'Kills',   noun: 'KILL COUNT',   help: 'Enemy roles the team killed' },
  { key: 'death',  label: 'Deaths',  noun: 'DEATH COUNT',  help: 'Enemy roles that killed the team' },
  { key: 'assist', label: 'Assists', noun: 'ASSIST COUNT', help: 'Enemy roles killed when the team assisted' },
];

// Same ±37.5 map frame + isometric transform as MapReview. Raw API coords; red
// side (camp 2) is flipped so the team's own base always sits bottom-left.
const MIN = -37.5, MAX = 37.5;
const S   = Math.SQRT2 / 2;
const apiToMap = (x, y) => ({ map_x: S * (x - y), map_y: S * (x + y) });
const toPx = (coord, isY, size) => { const n = (coord - MIN) / (MAX - MIN); return (isY ? 1 - n : n) * size; };

// Manual SVG donut (avoids adding a charting dependency).
function Donut({ dist, total, size = 200 }) {
  const r = size / 2, inner = r * 0.58, cx = r, cy = r;
  if (!total) return null;
  let acc = 0;
  const arc = (frac0, frac1) => {
    const a0 = frac0 * 2 * Math.PI - Math.PI / 2;
    const a1 = frac1 * 2 * Math.PI - Math.PI / 2;
    const large = frac1 - frac0 > 0.5 ? 1 : 0;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const xi1 = cx + inner * Math.cos(a1), yi1 = cy + inner * Math.sin(a1);
    const xi0 = cx + inner * Math.cos(a0), yi0 = cy + inner * Math.sin(a0);
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${inner} ${inner} 0 ${large} 0 ${xi0} ${yi0} Z`;
  };
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ display: 'block' }} role="img" aria-label="Team K/D/A distribution by opposing role">
      {dist.map(d => {
        const frac = d.value / total;
        const path = arc(acc, acc + frac);
        acc += frac;
        return <path key={d.role} d={path} fill={d.color} stroke="var(--surface2)" strokeWidth={2} />;
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" fontFamily="var(--font-display)" fontSize={26} fontWeight={900} fill="var(--text)">{total}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={9} fill="var(--muted)">EVENTS</text>
    </svg>
  );
}

export function TeamKdaDistribution({ teamKey, buildQ }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('kill');
  const [fromMin, setFromMin] = useState(0);
  const [toMin, setToMin] = useState(99);

  const canvasRef = useRef(null);
  const [imgVersion, setImgVersion] = useState(0);
  const imgCache = useRef({});
  function loadImg(url) {
    if (!url) return null;
    if (!imgCache.current[url]) {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => setImgVersion(v => v + 1);
      im.src = url;
      imgCache.current[url] = im;
    }
    return imgCache.current[url];
  }

  useEffect(() => {
    setLoading(true);
    setData(null);
    api.teamKdaDistribution(teamKey, buildQ())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setData({ events: [] }); setLoading(false); });
  }, [teamKey, buildQ]);

  const filtered = useMemo(() => {
    const events = data?.events || [];
    return events.filter(e => {
      if (e.type !== category) return false;
      if (e.t < fromMin * 60 || e.t > toMin * 60) return false;
      return true;
    });
  }, [data, category, fromMin, toMin]);

  const { dist, total } = useMemo(() => {
    const counts = Object.fromEntries(ROLES.map(r => [r, 0]));
    let tot = 0;
    filtered.forEach(e => {
      if (counts[e.role] == null) counts[e.role] = 0;
      counts[e.role]++;
      tot++;
    });
    return { dist: ROLES.map(r => ({ role: r, value: counts[r], color: ROLE_COLOR[r] })).filter(d => d.value > 0), total: tot };
  }, [filtered]);

  const points = useMemo(() => filtered
    .filter(e => e.x != null && e.y != null)
    .map(e => {
      let x = Number(e.x), y = Number(e.y);
      if (e.campid === 2) { x = -x; y = -y; }
      const mm = apiToMap(x, y);
      return { mx: mm.map_x, my: mm.map_y, color: ROLE_COLOR[e.role] || '#fff' };
    }), [filtered]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const size = canvas.parentElement?.clientWidth || 360;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    const mapImg = loadImg(imgUrl.mapCanvas(0));
    if (mapImg?.complete && mapImg.naturalWidth > 0) ctx.drawImage(mapImg, 0, 0, size, size);
    else { ctx.fillStyle = '#161a24'; ctx.fillRect(0, 0, size, size); }

    points.forEach(p => {
      const px = toPx(p.mx, false, size);
      const py = toPx(p.my, true, size);
      ctx.save();
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#10141d';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }, [points, imgVersion]);

  const cat = CATEGORIES.find(c => c.key === category);
  const windowLabel = fromMin <= 0 && toMin >= 99 ? 'full game' : `${fromMin}–${toMin}m`;

  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: '20px', borderRadius: 4 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '.12em', textTransform: 'uppercase' }}>// KILL / DEATH / ASSIST DISTRIBUTION</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: '4px 0 18px 0', color: 'var(--text)' }}>Where it happens & against whom</h3>

      {loading ? <div className="loading" /> : (
        <div className="kda-dist-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.06em', marginBottom: 6 }}>CATEGORY</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {CATEGORIES.map(c => (
                  <button key={c.key} onClick={() => setCategory(c.key)} className={`filter-btn ${category === c.key ? 'active' : ''}`} style={{ flex: 1, padding: '7px 6px', fontSize: 11 }}>{c.label}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.06em', marginBottom: 6 }}>TIME WINDOW (MIN)</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="number" min={0} max={99} value={fromMin} onChange={e => setFromMin(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: 56, fontFamily: 'var(--font-mono)', fontSize: 11, padding: '5px 6px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 2 }} />
                <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>–</span>
                <input type="number" min={0} max={99} value={toMin} onChange={e => setToMin(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: 56, fontFamily: 'var(--font-mono)', fontSize: 11, padding: '5px 6px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '14px 16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '.06em' }}>{cat.noun}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: 'var(--accent)', lineHeight: 1.1 }}>{total}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{cat.help} · {windowLabel}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dist.length === 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>// none</div>}
              {dist.map(d => (
                <div key={d.role} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, background: d.color, borderRadius: 2, flexShrink: 0 }} />
                  <RoleImg role={d.role} size={16} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,.75)' }}>{d.role}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--text)', marginLeft: 'auto' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {total === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>// No {cat.label.toLowerCase()} for this filter.</div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ minWidth: 480 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1.2fr) minmax(200px, 0.8fr)', gap: 20, alignItems: 'center' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 16 }} role="img" aria-label="Team event locations geolocated on the game map">
                <canvas ref={canvasRef} style={{ width: '100%', display: 'block', borderRadius: 2 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 8 }}>
                  <span>Own Base: Bottom-Left</span>
                  <span>{points.length} located · dot = enemy role</span>
                  <span>Enemy Base: Top-Right</span>
                </div>
              </div>
              <div style={{ width: '100%' }}>
                <Donut dist={dist} total={total} />
              </div>
            </div>
            </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
