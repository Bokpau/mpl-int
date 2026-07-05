'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { img as imgUrl } from '../lib/images';
import { JUNGLE_CAMPS } from '../lib/jungleCamps';

const MIN  = -37.5;
const MAX  =  37.5;
const BLUE = '#4da6ff';
const RED  = '#ff4757';

// Jungle camp marker styling (the kill timeline comes from the backend).
const CAMP_ABBR = {
  'Purple Buff': 'PB', 'Orange Buff': 'OB', 'Horned Lizard': 'HL',
  'Lava Golem': 'LG', 'Fire Beetle': 'FB', 'Gold Crab': 'GC',
};
const CAMP_COLOR = (name) =>
  name === 'Purple Buff' ? '#ab47bc' : name === 'Orange Buff' ? '#ff9800'
  : name === 'Gold Crab' ? '#ffca28' : '#cddc39';

// Resolve a camp's live state at game-time T from its sorted clear times.
//   prespawn    — before the camp first appears (countdown to firstSpawn)
//   alive       — creep(s) up
//   respawning  — cleared and within respawn window (countdown to return)
function campStateAt(camp, clears, T) {
  let lastClear = null;
  for (const t of clears) { if (t <= T) lastClear = t; else break; }
  if (lastClear == null) {
    if (T < camp.firstSpawn) return { phase: 'prespawn', secs: Math.ceil(camp.firstSpawn - T) };
    return { phase: 'alive' };
  }
  const respawnAt = lastClear + camp.respawn;
  if (T < respawnAt) return { phase: 'respawning', secs: Math.ceil(respawnAt - T) };
  return { phase: 'alive' };
}

const C1_SHADES = ['#4da6ff', '#3a9af0', '#60b4ff', '#2d8ae0', '#74c0ff'];
const C2_SHADES = ['#ff4757', '#e83345', '#ff6070', '#d52535', '#ff8090'];
const API  = '';

function big(n)     { return n != null && n !== '' ? Math.round(n).toLocaleString() : '--'; }
function fmtCC(ms)  { return ms ? (ms / 1000).toFixed(1) + 's' : '--'; }

const GOLD_SOURCES = [
  { key: 'gold_map_1', label: 'Minions',       color: '#66bb6a' },
  { key: 'gold_map_2', label: 'Jungle',         color: '#26c6da' },
  { key: 'gold_map_3', label: 'Turtle+Lord',    color: '#e8b800' },
  { key: 'gold_map_4', label: 'Turrets',        color: '#42a5f5' },
  { key: 'gold_map_5', label: 'Roam Equip',     color: '#ab47bc' },
  { key: 'gold_map_6', label: 'Kills+Assists',  color: '#ef5350' },
  { key: 'gold_map_9', label: 'Roam Vision',    color: '#78909c' },
];

function apiToMap(x, y) {
  const s = Math.SQRT2 / 2;
  return { map_x: s * (x - y), map_y: s * (x + y) };
}
function toPx(coord, isY, size) {
  const n = (coord - MIN) / (MAX - MIN);
  return isY ? size * (1 - n) : size * n;
}
function normalizeTowerName(name) {
  if (!name || typeof name !== 'string') return '';
  let n = name.toLowerCase().trim();
  n = n.replace(/turret_|tower_|turret|tower/g, '');
  n = n.replace(/[^a-z0-9]/g, '_');
  n = n.replace(/_+/g, '_');
  n = n.replace(/^_|_$/g, '');
  n = n.replace(/bottom/g, 'down');
  n = n.replace(/upper/g, 'up');
  n = n.replace(/middle/g, 'mid');
  return n;
}
function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// TOWER_COORDS are in the MLBB API campid convention (camp "1" = top-right / red territory,
// camp "2" = bottom-left / blue territory). MPL-PH data uses campid=1=Blue, campid=2=Red,
// so we swap with (3 - coordCampId) when assigning icons / checking events.
const SPAWN_POINTS = [
  { x:  14, y: -14 },
  { x: -13.5, y:  14.5 },
];

const TOWER_COORDS = {
  down_inner: { 1: { x: 17.50, y:  32.50 }, 2: { x: -17.50, y: -32.50 } },
  mid_inner:  { 1: { x: 22.50, y:  22.50 }, 2: { x: -22.50, y: -22.50 } },
  up_inner:   { 1: { x: 32.50, y:  17.50 }, 2: { x: -32.50, y: -17.50 } },
  down_mid:   { 1: { x:  2.50, y:  32.50 }, 2: { x:  -2.50, y: -32.50 } },
  mid_mid:    { 1: { x: 15.00, y:  15.00 }, 2: { x: -15.00, y: -15.00 } },
  up_mid:     { 1: { x: 32.50, y:  -2.50 }, 2: { x: -32.50, y:   2.50 } },
  down_outer: { 1: { x:-17.50, y:  32.50 }, 2: { x:  17.50, y: -32.50 } },
  mid_outer:  { 1: { x:  7.50, y:   7.50 }, 2: { x:  -7.50, y:  -7.50 } },
  up_outer:   { 1: { x: 32.50, y: -17.50 }, 2: { x: -32.50, y:  17.50 } },
};

export function MapReview({
  battleId, mapId = 0,
  camp1Code, camp2Code,
  matchEvents = [],
  selectedEvent = null,
  onEventSelect,
  onTimeChange,
  players = [],
  camp1 = null,
  camp2 = null,
  inspectedRoleIds = new Set(),
  onInspectChange,
  onFrameChange,
  showJungle = false,
  onJungleChange,
}) {
  const [snapshots, setSnapshots]   = useState(null);
  const [times, setTimes]           = useState([]);
  const [curIdx, setCurIdx]         = useState(0);
  const [showMovements, setShowMovements] = useState(true);
  const [imgVersion, setImgVersion] = useState(0);
  const [hmPositions, setHmPositions] = useState(null); // per-second positions for heatmap
  const [jungle, setJungle] = useState(null); // { [campId]: [clearTime,...] } from backend

  // view mode + filters
  const [showHeatmap,    setShowHeatmap]    = useState(false);
  const [showPathing,    setShowPathing]    = useState(false);
  // showJungle is lifted to MatchViewer (it also gates the buff/litho timeline rows).
  const [showCamp1,      setShowCamp1]      = useState(true);
  const [showCamp2,      setShowCamp2]      = useState(true);
  const [hiddenRoles,    setHiddenRoles]    = useState(new Set());

  const canvasRef = useRef(null);
  const imgCache  = useRef({});

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

  // Fetch per-second heatmap positions (lightweight, positions only)
  useEffect(() => {
    setHmPositions(null);
    fetch(`${API}/api/intl/matches/${battleId}/heatmap-positions`)
      .then(r => r.json())
      .then(d => setHmPositions(d.positions || []))
      .catch(() => setHmPositions([]));
  }, [battleId]);

  // Fetch the per-camp jungle clear timeline (kill inference is server-side).
  useEffect(() => {
    setJungle(null);
    fetch(`${API}/api/intl/matches/${battleId}/jungle-state`)
      .then(r => r.json())
      .then(d => setJungle(d.byCamp || {}))
      .catch(() => setJungle({}));
  }, [battleId]);

  // Fetch snapshots
  useEffect(() => {
    fetch(`${API}/api/intl/matches/${battleId}/map-data`)
      .then(r => r.json())
      .then(d => {
        const byTime = new Map();
        for (const snap of (d.snapshots || [])) {
          if (!byTime.has(snap.game_time)) byTime.set(snap.game_time, []);
          byTime.get(snap.game_time).push(snap);
        }
        const sorted = [...byTime.keys()].sort((a, b) => a - b);
        setSnapshots(byTime);
        setTimes(sorted);
        setCurIdx(0);
      })
      .catch(() => { setSnapshots(new Map()); setTimes([]); });
  }, [battleId]);

  // Pre-compute death marker positions from kill_hero events
  const deathPositions = useMemo(() => {
    if (!snapshots) return [];
    return matchEvents
      .filter(e => e.event_type === 'kill_hero' && e.killed_id != null)
      .map(ev => {
        for (let t = ev.game_time; t >= Math.max(0, ev.game_time - 10); t -= 5) {
          const frame = snapshots.get(t);
          if (!frame) continue;
          const p = frame.find(f => String(f.roleid) === String(ev.killed_id));
          if (p?.map_pos_x != null) {
            const { map_x, map_y } = apiToMap(p.map_pos_x, p.map_pos_y);
            return { game_time: ev.game_time, map_x, map_y, campid: p.campid, ev };
          }
        }
        return null;
      })
      .filter(Boolean);
  }, [snapshots, matchEvents]);

  // Boss (Turtle / Lord) spawn windows derived from kill events + killer position snapping
  const bossWindows = useMemo(() => {
    if (!snapshots) return { turtle: [], lord: [] };

    const bossKills = matchEvents
      .filter(e => e.event_type === 'kill_boss')
      .sort((a, b) => a.game_time - b.game_time);

    function resolveSpawn(ev) {
      // Find the snapshot time closest to ev.game_time (snapshots are stored at
      // 5s intervals but kill events can fire on any second — exact lookups miss).
      let bestTime = null, bestDiff = Infinity;
      for (const t of snapshots.keys()) {
        const diff = Math.abs(t - ev.game_time);
        if (diff < bestDiff) { bestDiff = diff; bestTime = t; }
      }
      const frame = (bestTime != null && bestDiff <= 10) ? snapshots.get(bestTime) : [];

      // Find the specific killer by roleid, fall back to all killer_camp players
      const killerPlayer = ev.killer_id != null
        ? frame.find(p => String(p.roleid) === String(ev.killer_id) && p.map_pos_x != null)
        : null;
      const candidates = killerPlayer
        ? [killerPlayer]
        : frame.filter(p => p.campid === ev.killer_camp && p.map_pos_x != null);

      // Snap killer position to the nearest of the two possible spawn locations
      let closestSnap = null, closestDist = Infinity;
      for (const p of candidates) {
        const { map_x, map_y } = apiToMap(p.map_pos_x, p.map_pos_y);
        for (const sp of SPAWN_POINTS) {
          const d = Math.hypot(map_x - sp.x, map_y - sp.y);
          if (d < closestDist) { closestDist = d; closestSnap = sp; }
        }
      }
      return closestSnap ?? SPAWN_POINTS[0];
    }

    const turtleKills = bossKills.filter(e => e.boss_name === 'tortoise');
    const lordKills   = bossKills.filter(e => e.boss_name === 'lord');

    // Pre-resolve all kill positions so we can look ahead for next-spawn coordinates
    const turtleResolved = turtleKills.map(ev => ({ ev, sp: resolveSpawn(ev) }));
    const lordResolved   = lordKills.map(ev => ({ ev, sp: resolveSpawn(ev) }));

    const turtle = [];
    // Pre-spawn countdown: 15s before first turtle appears, at the first turtle's spawn point
    if (turtleResolved.length > 0) {
      const firstSp = turtleResolved[0].sp;
      turtle.push({ prespawn: true, start: 105, end: 120, x: firstSp.x, y: firstSp.y });
    }
    let tSpawn = 120;
    for (let i = 0; i < turtleResolved.length; i++) {
      if (tSpawn >= 480) break;
      const { ev, sp } = turtleResolved[i];
      const nextSp = turtleResolved[i + 1]?.sp;
      const nextSpawnTime = Math.min(ev.game_time + 120, 480);
      turtle.push({ start: tSpawn, end: ev.game_time, nextSpawn: nextSpawnTime, x: sp.x, y: sp.y, nextX: nextSp?.x ?? sp.x, nextY: nextSp?.y ?? sp.y });
      tSpawn = nextSpawnTime;
    }
    if (tSpawn < 480) {
      turtle.push({ start: tSpawn, end: 480, nextSpawn: 480, x: SPAWN_POINTS[0].x, y: SPAWN_POINTS[0].y });
    }

    const lord = [];
    let lSpawn = 480;
    let lastLordSp = SPAWN_POINTS[1];
    for (let i = 0; i < lordResolved.length; i++) {
      const { ev, sp } = lordResolved[i];
      const nextSp = lordResolved[i + 1]?.sp;
      const respawn = ev.game_time + (ev.game_time < 1080 ? 180 : 120);
      lord.push({ start: lSpawn, end: ev.game_time, nextSpawn: respawn, x: sp.x, y: sp.y, nextX: nextSp?.x ?? sp.x, nextY: nextSp?.y ?? sp.y });
      lSpawn = respawn;
      lastLordSp = sp;
    }
    lord.push({ start: lSpawn, end: Infinity, nextSpawn: Infinity, x: lastLordSp.x, y: lastLordSp.y });

    return { turtle, lord };
  }, [matchEvents, snapshots]);

  // Derive stable player list from first snapshot frame
  const playerList = useMemo(() => {
    if (!snapshots || !times.length) return [];
    const frame = snapshots.get(times[0]) || [];
    return [...frame].sort((a, b) => a.campid - b.campid || String(a.roleid).localeCompare(String(b.roleid)));
  }, [snapshots, times]);

  // isVisible helper (used in effects — defined as a plain function, not hook)
  const isVisible = (p) =>
    (p.campid === 1 ? showCamp1 : showCamp2) && !hiddenRoles.has(String(p.roleid));

  // Jump to selected event's time
  useEffect(() => {
    if (!selectedEvent || times.length === 0) return;
    const target = selectedEvent.game_time;
    let idx = 0, minDiff = Infinity;
    times.forEach((t, i) => {
      const d = Math.abs(t - target);
      if (d < minDiff) { minDiff = d; idx = i; }
    });
    setCurIdx(idx);
  }, [selectedEvent, times]);

  const toggleInspect = (roleid) => {
    const next = new Set(inspectedRoleIds);
    if (next.has(roleid)) next.delete(roleid);
    else next.add(roleid);
    onInspectChange?.(next);
  };

  // Click on canvas hero icon → toggle inspect for that player
  function handleCanvasClick(e) {
    if (!snapshots || !times.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect  = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top)  * scaleY;
    const size = canvas.width;
    const hs   = Math.max(20, size * 0.055);
    const hitR = hs * 0.72;

    const frame = snapshots.get(times[curIdx] ?? 0) || [];
    for (const p of frame) {
      if (!p.map_pos_x) continue;
      const { map_x, map_y } = apiToMap(p.map_pos_x, p.map_pos_y);
      const px = toPx(map_x, false, size);
      const py = toPx(map_y, true,  size);
      if (Math.hypot(cx - px, cy - py) < hitR) {
        toggleInspect(String(p.roleid));
        return;
      }
    }
    // Click empty area only clears if clicking away intentionally (do nothing — keep selections)
  }

  // ── Canvas draw ──────────────────────────────────────────────
  useEffect(() => {
    if (!snapshots || !times.length) return;
    const time   = times[curIdx] ?? 0;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Build roleid → skillid map from static player data
    const skillMap = {};
    for (const pl of players) {
      if (pl.roleid && pl.skillid) skillMap[String(pl.roleid)] = pl.skillid;
    }

    const size = canvas.parentElement?.clientWidth || 440;
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    // 1 · Map background
    const mapImg = loadImg(imgUrl.mapCanvas(mapId ?? 0));
    if (mapImg?.complete && mapImg.naturalWidth > 0) {
      ctx.drawImage(mapImg, 0, 0, size, size);
    } else {
      ctx.fillStyle = '#1a1f2e';
      ctx.fillRect(0, 0, size, size);
    }

    // 2 · Towers
    const towerSize = Math.max(12, size * 0.033);
    for (const [tKey, camps] of Object.entries(TOWER_COORDS)) {
      for (const [campStr, coords] of Object.entries(camps)) {
        const coordCampId = parseInt(campStr);
        const campId = 3 - coordCampId; // TOWER_COORDS camp "1" = MPL-PH campid=2 (Red)
        const destroyed = matchEvents.some(e =>
          e.event_type === 'kill_tower' &&
          e.game_time <= time &&
          normalizeTowerName(e.tower_name) === tKey &&
          e.killer_camp != null && (3 - parseInt(e.killer_camp)) === campId
        );
        if (destroyed) continue;

        const px = toPx(coords.x, false, size);
        const py = toPx(coords.y, true,  size);

        // Highlight the destroyed tower when that event is selected
        const isEventTower = selectedEvent?.event_type === 'kill_tower' &&
          normalizeTowerName(selectedEvent.tower_name) === tKey &&
          selectedEvent.killer_camp != null && (3 - parseInt(selectedEvent.killer_camp)) === campId;

        const towerImg = loadImg(imgUrl.icon(campId === 1 ? 'tower-blue' : 'tower-red'));
        ctx.save();
        if (isEventTower) {
          ctx.shadowColor = '#42a5f5';
          ctx.shadowBlur  = 14;
        }
        if (towerImg?.complete && towerImg.naturalWidth > 0) {
          ctx.drawImage(towerImg, px - towerSize / 2, py - towerSize / 2, towerSize, towerSize);
        } else {
          ctx.fillStyle = campId === 1 ? BLUE : RED;
          ctx.fillRect(px - 4, py - 4, 8, 8);
        }
        ctx.restore();
      }
    }

    const heroSize = Math.max(20, size * 0.055);
    const xR       = Math.max(4, heroSize * 0.38);

    // 2b · Turtle & Lord markers
    function renderBoss(windows, iconKey) {
      for (const w of windows) {
        if (time >= w.start && time < w.end) {
          // prespawn window or alive window
          if (w.prespawn) {
            drawBossMarker(w.x, w.y, iconKey, false, Math.ceil(w.end - time));
          } else {
            drawBossMarker(w.x, w.y, iconKey, true, 0);
          }
          return;
        }
        if (!w.prespawn && time >= w.end && time < w.nextSpawn) {
          // Respawning: draw countdown at the NEXT spawn position
          drawBossMarker(w.nextX ?? w.x, w.nextY ?? w.y, iconKey, false, Math.ceil(w.nextSpawn - time));
          return;
        }
      }
    }
    renderBoss(bossWindows.turtle, 'TURTLE');
    renderBoss(bossWindows.lord,   'LORD');

    // 2c · Jungle camp markers — alive / respawning, from backend-inferred clears.
    // Gold Crab: both mirror spots can pick up gold, but only one is the real Gold
    // Crab (the other is the EXP Crab / noise). Render only the side with the most
    // clears; skip the other for now. (EXP Crab isn't tracked — gives EXP, no gold.)
    if (showJungle && jungle) {
      const crabBlue = (jungle['Gold Crab_blue'] || []).length;
      const crabRed  = (jungle['Gold Crab_red']  || []).length;
      const goldCrabId = crabBlue === 0 && crabRed === 0 ? null
        : crabBlue >= crabRed ? 'Gold Crab_blue' : 'Gold Crab_red';
      for (const camp of JUNGLE_CAMPS) {
        if (camp.name === 'Gold Crab' && camp.id !== goldCrabId) continue;
        drawCampMarker(camp, campStateAt(camp, jungle[camp.id] || [], time));
      }
    }

    // 3 · Death markers — all kills up to current time, fade with age
    for (const d of deathPositions) {
      if (d.game_time > time) continue;
      const px   = toPx(d.map_x, false, size);
      const py   = toPx(d.map_y, true,  size);
      const age  = time - d.game_time;
      // fade: 0-10s bright, 10-60s medium, >60s faint
      const alpha = age < 10  ? Math.max(0.30, 1 - age / 10 * 0.70)
                  : age < 60  ? 0.30 - (age - 10) / 50 * 0.18
                  : 0.12;
      const circR = Math.max(6, heroSize * 0.52);

      ctx.save();
      ctx.globalAlpha = alpha;
      if (age < 10) {
        ctx.beginPath();
        ctx.arc(px, py, circR, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(px - xR, py - xR); ctx.lineTo(px + xR, py + xR);
      ctx.moveTo(px + xR, py - xR); ctx.lineTo(px - xR, py + xR);
      ctx.strokeStyle = '#ff4757';
      ctx.lineWidth = age < 10 ? 2 : 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // helper: draw a jungle camp marker at its map coords for the given state
    function drawCampMarker(camp, st) {
      const { map_x, map_y } = apiToMap(camp.x, camp.y);
      const px = toPx(map_x, false, size);
      const py = toPx(map_y, true,  size);
      const color = CAMP_COLOR(camp.name);
      const r = Math.max(7, size * 0.019);
      const abbr = CAMP_ABBR[camp.name] || '?';
      const isBeetle = camp.name === 'Fire Beetle';

      ctx.save();
      if (st.phase === 'alive') {
        // creep(s) up: colored ring + dark disc + abbreviation
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(10,13,20,0.7)';
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.max(8, r * 0.95)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(abbr, px, py);
      } else {
        // prespawn or respawning: dark disc + dashed ring + countdown. Fire
        // Beetle's respawn window is the small beetle in place → smaller, tinted.
        const small = isBeetle && st.phase === 'respawning';
        const rr = small ? r * 0.68 : r;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(px, py, rr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(10,10,10,0.7)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, rr + 3, 0, Math.PI * 2);
        ctx.strokeStyle = small ? color : '#888';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (st.secs > 0) {
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${Math.max(7, rr * 0.9)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = '#000';
          ctx.shadowBlur = 3;
          ctx.fillText(String(st.secs), px, py);
          ctx.shadowBlur = 0;
        }
      }
      ctx.restore();
    }

    // helper: draw a boss (Turtle / Lord) marker at map coords
    function drawBossMarker(mapX, mapY, iconKey, alive, secondsLeft) {
      const bSize = Math.max(18, size * 0.048);
      const px = toPx(mapX, false, size);
      const py = toPx(mapY, true,  size);
      const bossImg = loadImg(imgUrl.icon(iconKey));

      ctx.save();

      if (alive) {
        // Alive: full icon with gold ring
        ctx.globalAlpha = 0.92;
        ctx.beginPath();
        ctx.arc(px, py, bSize / 2 + 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#e8b800';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, bSize / 2, 0, Math.PI * 2);
        ctx.clip();
        if (bossImg?.complete && bossImg.naturalWidth > 0) {
          ctx.drawImage(bossImg, px - bSize / 2, py - bSize / 2, bSize, bSize);
        } else {
          ctx.fillStyle = '#e8b800';
          ctx.fill();
        }
        ctx.restore();
      } else {
        // Respawning: dark filled circle + grey dashed ring + countdown
        ctx.globalAlpha = 0.82;
        ctx.beginPath();
        ctx.arc(px, py, bSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(10,10,10,0.72)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, bSize / 2 + 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (secondsLeft > 0) {
          ctx.font = `bold ${Math.max(8, bSize * 0.45)}px sans-serif`;
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = '#000';
          ctx.shadowBlur = 4;
          ctx.fillText(String(secondsLeft), px, py);
          ctx.shadowBlur = 0;
        }
      }

      ctx.restore();
    }

    // helper: draw a hero icon at (px, py)
    function drawHeroIcon(p, px, py, hs, role = 'normal') {
      const color     = p.campid === 1 ? BLUE : RED;
      const alpha     = role === 'dim' ? 0.55 : 1;
      const ringColor = role === 'killed' ? '#ff4757'
                      : role === 'killer' ? '#FFD700'
                      : role === 'assist' ? '#FFEB3B'
                      : color;
      const ringW = (role !== 'normal' && role !== 'dim') ? 3.5 : 2;
      const ringR = hs / 2 + (role !== 'normal' && role !== 'dim' ? 4 : 2);

      ctx.save();
      ctx.globalAlpha = alpha;

      // Inspected players: outer accent glow ring
      if (inspectedRoleIds.size > 0 && inspectedRoleIds.has(String(p.roleid))) {
        ctx.beginPath();
        ctx.arc(px, py, hs / 2 + 13, 0, Math.PI * 2);
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth   = 2.5;
        ctx.globalAlpha = 0.9;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(px, py, hs / 2 + 16, 0, Math.PI * 2);
        ctx.strokeStyle = '#00e5ff44';
        ctx.lineWidth   = 6;
        ctx.stroke();
        ctx.globalAlpha = alpha;
      }

      if (role === 'killed' || role === 'killer' || role === 'assist') {
        ctx.beginPath();
        ctx.arc(px, py, hs / 2 + 9, 0, Math.PI * 2);
        ctx.strokeStyle = ringColor + '44';
        ctx.lineWidth   = 8;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(px, py, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = ringColor;
      ctx.lineWidth   = ringW;
      ctx.stroke();

      const isDead    = (p.revive_left_time || 0) > 0;
      const heroImg   = loadImg(imgUrl.hero(p.heroid));
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, hs / 2, 0, Math.PI * 2);
      ctx.clip();
      if (heroImg?.complete && heroImg.naturalWidth > 0) {
        if (isDead) ctx.filter = 'grayscale(1)';
        ctx.drawImage(heroImg, px - hs / 2, py - hs / 2, hs, hs);
        ctx.filter = 'none';
      } else {
        ctx.fillStyle = color + '99';
        ctx.fill();
      }
      // Dead overlay + respawn countdown
      if (isDead) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.arc(px, py, hs / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alpha;
        const secs = p.revive_left_time;
        ctx.font         = `bold ${Math.max(9, hs * 0.44)}px sans-serif`;
        ctx.fillStyle    = '#ffffff';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor  = '#000';
        ctx.shadowBlur   = 4;
        ctx.fillText(secs > 0 ? String(secs) : '', px, py);
        ctx.shadowBlur = 0;
      }
      ctx.restore();  // end clip region

      if (!isDead) {
        const indR  = Math.max(4, hs * 0.22);
        const indX  = px - hs * 0.36;
        const indY  = py - hs * 0.36;
        const ultCD = (p.major_left_time || 0);

        // ── Ultimate indicator (upper-left) ──
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(indX, indY, indR, 0, Math.PI * 2);
        ctx.fillStyle = ultCD === 0 ? '#66bb6a' : 'rgba(10,10,10,0.88)';
        ctx.fill();
        ctx.strokeStyle = ultCD === 0 ? 'rgba(255,255,255,0.6)' : '#aaa';
        ctx.lineWidth = 1;
        ctx.stroke();
        if (ultCD > 0) {
          ctx.fillStyle    = '#fff';
          ctx.font         = `bold ${Math.max(5, indR * 1.15)}px sans-serif`;
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor  = '#000';
          ctx.shadowBlur   = 3;
          ctx.fillText(String(ultCD), indX, indY);
          ctx.shadowBlur   = 0;
        }
        ctx.restore();

        // ── Skill icon badge (lower-right) — always shown when skillid available ──
        const skillid = skillMap[String(p.roleid)];
        if (skillid) {
          const badgeR   = Math.max(4, hs * 0.2);
          const badgeX   = px + hs * 0.38;
          const badgeY   = py + hs * 0.38;
          const skillCD  = p.skill_left_time || 0;
          const skillImg = loadImg(imgUrl.skill(skillid));
          ctx.save();
          ctx.globalAlpha = alpha;
          // Badge circle background
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(10,10,10,0.88)';
          ctx.fill();
          // Skill icon clipped to badge circle
          if (skillImg?.complete && skillImg.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(skillImg, badgeX - badgeR, badgeY - badgeR, badgeR * 2, badgeR * 2);
            ctx.restore();
          }
          // Dark overlay + timer only when on cooldown
          if (skillCD > 0) {
            ctx.beginPath();
            ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fill();
          }
          // Border: yellow on CD, green when ready
          ctx.strokeStyle = skillCD > 0 ? '#e8b800' : '#66bb6a';
          ctx.lineWidth   = 1;
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
          ctx.stroke();
          // Timer number when on cooldown
          if (skillCD > 0) {
            ctx.fillStyle    = '#fff';
            ctx.font         = `bold ${Math.max(5, badgeR * 1.15)}px sans-serif`;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor  = '#000';
            ctx.shadowBlur   = 3;
            ctx.fillText(String(skillCD), badgeX, badgeY);
            ctx.shadowBlur   = 0;
          }
          ctx.restore();
        }
      }

      if (!isDead && role === 'killed') {
        ctx.font = `bold ${Math.max(10, hs * 0.62)}px sans-serif`;
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000'; ctx.shadowBlur = 6;
        ctx.fillText('✕', px, py);
      }
      if (!isDead && role === 'killer') {
        ctx.font = `${Math.max(9, hs * 0.52)}px sans-serif`;
        ctx.fillStyle = '#FFD700'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
        ctx.fillText('⚔', px, py + hs / 2 + 2);
      }
      ctx.restore();
    }

    // helper: compute role for selectedEvent highlighting
    function heroRole(p) {
      // In overlay mode with an active selection, fade out non-selected players
      if ((showHeatmap || showPathing) && inspectedRoleIds.size > 0 && !inspectedRoleIds.has(String(p.roleid))) {
        return 'dim';
      }
      if (!selectedEvent) return 'normal';
      const rid = String(p.roleid);
      const isKilled = selectedEvent.killed_id != null && rid === String(selectedEvent.killed_id);
      const isKiller = selectedEvent.heroid != null &&
        p.heroid == selectedEvent.heroid &&
        (selectedEvent.killer_camp == null || p.campid == selectedEvent.killer_camp);
      const isAssist = [
        selectedEvent.assister_1_id, selectedEvent.assister_2_id,
        selectedEvent.assister_3_id, selectedEvent.assister_4_id,
      ].some(aid => aid != null && rid === String(aid));
      return isKilled ? 'killed' : isKiller ? 'killer' : isAssist ? 'assist' : 'dim';
    }

    // 4 · Overlay rendering (heatmap and/or pathing, independently toggled)
    const frame     = snapshots.get(time) || [];
    const pastTimes = times.slice(0, curIdx + 1);

    // Whether a player participates in the overlay (respects inspect selection filter)
    const inOverlay = (p) => inspectedRoleIds.size === 0 || inspectedRoleIds.has(String(p.roleid));

    // 4a · Heat Map layer — per-second density grid with blur for intensity
    if (showHeatmap && hmPositions) {
      const GRID = 50;
      const d1   = new Float32Array(GRID * GRID); // camp1 visit counts
      const d2   = new Float32Array(GRID * GRID); // camp2 visit counts

      for (const p of hmPositions) {
        if (p.game_time > time) break; // sorted by game_time — safe to early-exit
        if (!isVisible(p) || !inOverlay(p)) continue;
        const { map_x, map_y } = apiToMap(p.map_pos_x, p.map_pos_y);
        const gx = Math.min(GRID - 1, Math.max(0, Math.floor(toPx(map_x, false, GRID))));
        const gy = Math.min(GRID - 1, Math.max(0, Math.floor(toPx(map_y, true, GRID))));
        (p.campid === 1 ? d1 : d2)[gy * GRID + gx]++;
      }

      let maxD = 1;
      for (let i = 0; i < GRID * GRID; i++) maxD = Math.max(maxD, d1[i], d2[i]);

      // Draw density blobs onto a temp canvas, then composite with blur
      const tmp  = document.createElement('canvas');
      tmp.width  = size;
      tmp.height = size;
      const tc   = tmp.getContext('2d');
      const cw   = size / GRID;
      const cr   = cw * 2.8; // blob radius > 1 cell so adjacent cells blend

      for (let i = 0; i < GRID * GRID; i++) {
        const gx = i % GRID;
        const gy = Math.floor(i / GRID);
        const cx = (gx + 0.5) * cw;
        const cy = (gy + 0.5) * cw;
        for (const [cnt, rgb] of [[d1[i], '77,166,255'], [d2[i], '255,71,87']]) {
          if (cnt === 0) continue;
          const t = Math.sqrt(cnt / maxD); // sqrt: low densities remain visible
          const grad = tc.createRadialGradient(cx, cy, 0, cx, cy, cr);
          grad.addColorStop(0,   `rgba(${rgb},${Math.min(0.9, t * 0.75 + 0.22)})`);
          grad.addColorStop(0.5, `rgba(${rgb},${t * 0.28})`);
          grad.addColorStop(1,   `rgba(${rgb},0)`);
          tc.fillStyle = grad;
          tc.beginPath();
          tc.arc(cx, cy, cr, 0, Math.PI * 2);
          tc.fill();
        }
      }

      ctx.save();
      ctx.filter      = `blur(${Math.max(4, Math.round(cw * 0.7))}px)`;
      ctx.globalAlpha = 0.82;
      ctx.drawImage(tmp, 0, 0);
      ctx.restore();
    }

    // 4b · Pathing layer — sliding 60s window, breaks only on death (null position)
    if (showPathing) {
      const AS       = Math.max(4, size * 0.012);
      const WINDOW_S = 60;
      const curTime  = times[curIdx] ?? 0;
      const windowTimes = pastTimes.filter(t => t >= curTime - WINDOW_S);

      const firstFrame = snapshots.get(times[0]) || [];
      for (const player of firstFrame) {
        if (!isVisible(player) || !inOverlay(player)) continue;
        const color = player.campid === 1 ? BLUE : RED;

        const positions = windowTimes.map(t => {
          const p = (snapshots.get(t) || []).find(f => String(f.roleid) === String(player.roleid));
          if (!p?.map_pos_x) return null;   // null = dead / no data → breaks the line
          const { map_x, map_y } = apiToMap(p.map_pos_x, p.map_pos_y);
          return { x: toPx(map_x, false, size), y: toPx(map_y, true, size) };
        });

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1.5;
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        let started = false;
        for (const pos of positions) {
          if (!pos) { started = false; continue; }
          if (!started) { ctx.moveTo(pos.x, pos.y); started = true; }
          else ctx.lineTo(pos.x, pos.y);
        }
        ctx.stroke();

        // direction arrowheads — only when player actually moved
        for (let i = 4; i < positions.length; i += 4) {
          const cur = positions[i];
          const prv = positions[i - 1] ?? positions[i - 2] ?? positions[i - 3];
          if (!cur || !prv) continue;
          const dx = cur.x - prv.x, dy = cur.y - prv.y;
          const d  = Math.hypot(dx, dy);
          if (d < 1) continue;
          ctx.save();
          ctx.translate(cur.x, cur.y);
          ctx.rotate(Math.atan2(dy, dx));
          ctx.globalAlpha = 0.85;
          ctx.fillStyle   = color;
          ctx.beginPath();
          ctx.moveTo(AS, 0);
          ctx.lineTo(-AS * 0.6, -AS * 0.5);
          ctx.lineTo(-AS * 0.6,  AS * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    // 4c · Hero icons — always shown when overlays active; in live mode respects showMovements
    if (showHeatmap || showPathing || showMovements || selectedEvent != null) {
      const hs = showHeatmap && !showPathing ? Math.max(16, heroSize * 0.78) : heroSize;
      for (const p of frame) {
        if (!isVisible(p) || p.map_pos_x == null) continue;
        const { map_x, map_y } = apiToMap(p.map_pos_x, p.map_pos_y);
        drawHeroIcon(p, toPx(map_x, false, size), toPx(map_y, true, size), hs, heroRole(p));
      }
    }
  }, [curIdx, snapshots, matchEvents, times, mapId, imgVersion, selectedEvent, showMovements,
      deathPositions, showHeatmap, showPathing, showJungle, jungle, showCamp1, showCamp2, hiddenRoles, inspectedRoleIds, players, hmPositions, bossWindows]);

  useEffect(() => {
    if (times.length) onTimeChange?.(times[curIdx] ?? 0);
  }, [curIdx, times]);

  useEffect(() => {
    if (!snapshots || !times.length) return;
    onFrameChange?.(snapshots.get(times[curIdx] ?? 0) || []);
  }, [curIdx, times, snapshots]);

  // ── Render ──────────────────────────────────────────────────
  if (snapshots === null) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
        Loading map data…
      </div>
    );
  }
  if (!times.length) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
        No realtime snapshot data available for this match.
      </div>
    );
  }

  const curTime    = times[curIdx] ?? 0;
  const maxTime    = times[times.length - 1];
  const curFrame   = snapshots.get(curTime) || [];
  const c1Players  = [...curFrame.filter(p => p.campid === 1)].sort((a, b) => String(a.roleid).localeCompare(String(b.roleid)));
  const c2Players  = [...curFrame.filter(p => p.campid === 2)].sort((a, b) => String(a.roleid).localeCompare(String(b.roleid)));
  const c1Kills    = c1Players.reduce((s, p) => s + (p.kill_num || 0), 0);
  const c2Kills    = c2Players.reduce((s, p) => s + (p.kill_num || 0), 0);
  const totalKills = c1Kills + c2Kills;
  const c1Turtles  = matchEvents.filter(e => e.event_type === 'kill_boss' && e.boss_name === 'tortoise' && e.game_time <= curTime && e.killer_camp === 1).length;
  const c2Turtles  = matchEvents.filter(e => e.event_type === 'kill_boss' && e.boss_name === 'tortoise' && e.game_time <= curTime && e.killer_camp === 2).length;
  const c1Lords    = matchEvents.filter(e => e.event_type === 'kill_boss' && e.boss_name === 'lord'     && e.game_time <= curTime && e.killer_camp === 1).length;
  const c2Lords    = matchEvents.filter(e => e.event_type === 'kill_boss' && e.boss_name === 'lord'     && e.game_time <= curTime && e.killer_camp === 2).length;
  const c1Towers   = matchEvents.filter(e => e.event_type === 'kill_tower' && e.game_time <= curTime && e.killer_camp === 1).length;
  const c2Towers   = matchEvents.filter(e => e.event_type === 'kill_tower' && e.game_time <= curTime && e.killer_camp === 2).length;
  const c1Gold     = c1Players.reduce((s, p) => s + (p.gold || 0), 0);
  const c2Gold     = c2Players.reduce((s, p) => s + (p.gold || 0), 0);
  const goldDiff   = c1Gold - c2Gold;
  const c1Dmg      = c1Players.reduce((s, p) => s + (p.total_damage || 0), 0);
  const c2Dmg      = c2Players.reduce((s, p) => s + (p.total_damage || 0), 0);
  const totalDmg   = c1Dmg + c2Dmg;
  const c1ByDmg    = [...c1Players].sort((a, b) => (b.total_damage || 0) - (a.total_damage || 0));
  const c2ByDmg    = [...c2Players].sort((a, b) => (b.total_damage || 0) - (a.total_damage || 0));

  const btnStyle = (active) => ({
    fontFamily: 'var(--font-mono)', fontSize: 10, padding: '4px 12px',
    background: active ? 'var(--accent)' : 'var(--surface2)',
    color: active ? '#000' : 'var(--muted)',
    border: '1px solid var(--border)', cursor: 'pointer', letterSpacing: '.06em',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Row 1: Scrubber */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 800, color: 'var(--accent)', minWidth: 54 }}>
          {fmtTime(curTime)}
        </span>
        <input
          type="range" min={0} max={times.length - 1} value={curIdx}
          aria-label="Match timeline scrubber"
          onChange={e => setCurIdx(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--accent)' }}
        />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', minWidth: 40, textAlign: 'right' }}>
          {fmtTime(maxTime)}
        </span>
      </div>

      {/* Row 2: View mode + team filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* LIVE clears overlays */}
        <button onClick={() => { setShowHeatmap(false); setShowPathing(false); }}
          style={btnStyle(!showHeatmap && !showPathing)}>
          LIVE
        </button>
        <button onClick={() => setShowHeatmap(v => !v)} style={btnStyle(showHeatmap)}>
          HEAT MAP
        </button>
        <button onClick={() => setShowPathing(v => !v)} style={btnStyle(showPathing)}>
          PATHING
        </button>
        <button onClick={() => onJungleChange?.(!showJungle)} style={btnStyle(showJungle)}>
          🌿 JUNGLE
        </button>

        <span style={{ color: 'var(--border)', fontSize: 12, margin: '0 4px' }}>|</span>

        {/* Team toggles */}
        <button onClick={() => setShowCamp1(v => !v)}
          style={{ ...btnStyle(showCamp1), color: showCamp1 ? BLUE : 'var(--muted)', borderColor: showCamp1 ? BLUE : 'var(--border)' }}>
          ● {camp1Code || 'BLUE'}
        </button>
        <button onClick={() => setShowCamp2(v => !v)}
          style={{ ...btnStyle(showCamp2), color: showCamp2 ? RED : 'var(--muted)', borderColor: showCamp2 ? RED : 'var(--border)' }}>
          ● {camp2Code || 'RED'}
        </button>

        <span style={{ color: 'var(--border)', fontSize: 12, margin: '0 4px' }}>|</span>

        {/* Movements toggle (live only) */}
        {!showHeatmap && !showPathing && (
          <button onClick={() => setShowMovements(m => !m)} style={btnStyle(showMovements)}>
            {showMovements ? 'HIDE' : 'SHOW'}
          </button>
        )}
      </div>

      {/* Row 3: Multi-player inspect */}
      {playerList.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: '.08em', flexShrink: 0 }}>
            PLAYERS
          </span>
          {/* Select All */}
          <button
            onClick={() => onInspectChange?.(new Set(playerList.map(p => String(p.roleid))))}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', padding: '2px 8px', cursor: 'pointer', borderRadius: 2 }}>
            ALL
          </button>
          {playerList.map(p => {
            const isInspected = inspectedRoleIds.has(String(p.roleid));
            const teamHidden  = p.campid === 1 ? !showCamp1 : !showCamp2;
            const ring = p.campid === 1 ? BLUE : RED;
            return (
              <button
                key={p.roleid}
                title={`${p.player_name} — click to inspect`}
                onClick={() => toggleInspect(String(p.roleid))}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  opacity: teamHidden ? 0.25 : 1,
                  transition: 'opacity .15s',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  boxShadow: isInspected
                    ? `0 0 0 2.5px var(--accent), 0 0 7px var(--accent)`
                    : `0 0 0 2px ${ring}`,
                  overflow: 'hidden',
                  transition: 'box-shadow .15s',
                }}>
                  <img
                    src={imgUrl.hero(p.heroid)}
                    alt={p.player_name}
                    width={28} height={28}
                    style={{ display: 'block', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              </button>
            );
          })}
          {inspectedRoleIds.size > 0 && (
            <button
              onClick={() => onInspectChange?.(new Set())}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--accent)', background: 'none', border: '1px solid var(--accent)', padding: '2px 8px', cursor: 'pointer', borderRadius: 2 }}>
              CLEAR
            </button>
          )}
        </div>
      )}

      {/* ── Snapshot: Team Kills + Gold ── */}
      {curFrame.length > 0 && (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 2, padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {/* Kills + objectives row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: '.06em', flexShrink: 0 }}>KILLS</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: BLUE }}>{c1Kills}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>–</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: RED }}>{c2Kills}</span>

            <span style={{ color: 'var(--border)', fontSize: 11, margin: '0 2px' }}>|</span>

            <span style={{ fontSize: 13 }}>🐢</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: BLUE }}>{c1Turtles}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>–</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: RED }}>{c2Turtles}</span>

            <span style={{ color: 'var(--border)', fontSize: 11, margin: '0 2px' }}>|</span>

            <span style={{ fontSize: 13 }}>⚔️</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: BLUE }}>{c1Lords}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>–</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: RED }}>{c2Lords}</span>

            <span style={{ color: 'var(--border)', fontSize: 11, margin: '0 2px' }}>|</span>

            <span style={{ fontSize: 13 }}>🏰</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: BLUE }}>{c1Towers}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>–</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: RED }}>{c2Towers}</span>
          </div>
          {/* Gold row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: '.06em', width: 28, flexShrink: 0 }}>GOLD</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: BLUE }}>{c1Gold.toLocaleString()}</span>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: goldDiff === 0 ? 'var(--muted)' : goldDiff > 0 ? BLUE : RED }}>
                {goldDiff === 0 ? 'EVEN' : `${goldDiff > 0 ? '+' : ''}${Math.abs(goldDiff).toLocaleString()}`}
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: RED }}>{c2Gold.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Selected event banner */}
      {selectedEvent && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', background: 'rgba(0,229,255,.07)', border: '1px solid rgba(0,229,255,.25)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚡ Highlighting event at {fmtTime(selectedEvent.game_time)}</span>
          <span style={{ color: 'var(--muted)', fontSize: 9 }}>
            {selectedEvent.event_type === 'kill_hero'  && '— Killer (⚔ gold) · Killed (✕ red) · Assists (yellow) · Others dimmed'}
            {selectedEvent.event_type === 'kill_tower' && '— Tower destroyed highlighted (blue glow)'}
            {selectedEvent.event_type === 'kill_boss'  && '— Killer team highlighted'}
          </span>
          <button
            onClick={() => onEventSelect?.(selectedEvent)}
            style={{ marginLeft: 'auto', ...btnStyle(false), fontSize: 9, padding: '2px 8px' }}>
            ✕ CLEAR
          </button>
        </div>
      )}

      {/* Map canvas */}
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#1a1f2e', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
        />
        {players.length > 0 && (
          <div style={{ position: 'absolute', bottom: 6, right: 6, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,.35)', pointerEvents: 'none' }}>
            click hero for stats
          </div>
        )}
      </div>

      {/* ── Below canvas: Team Damage + HP/Mana ── */}
      {curFrame.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Stacked damage bar */}
          {totalDmg > 0 && (
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: '.07em' }}>TEAM DAMAGE</span>
              <div style={{ display: 'flex', height: 14, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                {c1ByDmg.map((p, i) => {
                  const w = (p.total_damage || 0) / totalDmg * 100;
                  return w > 0 ? <div key={p.roleid} style={{ flexBasis: `${w}%`, flexShrink: 0, background: C1_SHADES[i % 5], minWidth: 2 }} /> : null;
                })}
                <div style={{ width: 2, background: 'var(--surface2)', flexShrink: 0 }} />
                {c2ByDmg.map((p, i) => {
                  const w = (p.total_damage || 0) / totalDmg * 100;
                  return w > 0 ? <div key={p.roleid} style={{ flexBasis: `${w}%`, flexShrink: 0, background: C2_SHADES[i % 5], minWidth: 2 }} /> : null;
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: BLUE }}>{c1Dmg.toLocaleString()}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)' }}>vs</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: RED }}>{c2Dmg.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* HP / Mana bars with hero icon below */}
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: '.07em' }}>HP / MANA</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {[c1Players, c2Players].map((campPs, ci) => {
                const teamColor = ci === 0 ? BLUE : RED;
                if (campPs.length === 0) return null;
                return (
                  <div key={ci} style={{ display: 'flex', gap: 4 }}>
                    {campPs.map(p => {
                      const isDead = (p.revive_left_time || 0) > 0;
                      const hp     = isDead ? 0 : (p.hp_percentage || 0);
                      const mp     = p.mana_percentage || 0;
                      const hpCol  = hp > 0.5 ? '#66bb6a' : hp > 0.25 ? '#e8b800' : '#ef5350';
                      return (
                        <div key={p.roleid} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <div style={{ width: '100%', height: 5, background: 'var(--surface)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${hp * 100}%`, background: hpCol, borderRadius: 2 }} />
                          </div>
                          <div style={{ width: '100%', height: 3, background: 'var(--surface)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${mp * 100}%`, background: '#4da6ff', borderRadius: 2 }} />
                          </div>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', boxShadow: `0 0 0 1.5px ${isDead ? '#555' : teamColor}`, marginTop: 1 }}>
                            <img
                              src={imgUrl.hero(p.heroid)}
                              width={22} height={22}
                              style={{ display: 'block', objectFit: 'cover', filter: isDead ? 'grayscale(1)' : 'none' }}
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', flexWrap: 'wrap' }}>
        <span><span style={{ color: BLUE }}>●</span> {camp1Code || 'Blue'}</span>
        <span><span style={{ color: RED  }}>●</span> {camp2Code || 'Red'}</span>
        <span><span style={{ color: '#ff4757' }}>✕</span> Death</span>
        {!showHeatmap && !showPathing && selectedEvent && <>
          <span><span style={{ color: '#FFD700' }}>⚔</span> Killer</span>
          <span><span style={{ color: '#FFEB3B' }}>●</span> Assist</span>
        </>}
        {showHeatmap && <span>heat = time in area</span>}
        {showPathing && <span>arrows = direction</span>}
        <span style={{ marginLeft: 'auto' }}>✕ fades over 60s</span>
      </div>
    </div>
  );
}
