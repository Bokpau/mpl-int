'use client';

/**
 * Hero SKILL KIT display.
 *
 * Renders what a hero actually does — passive, skills, ultimate — from the
 * backend's /api/intl/heroes/:heroid/skills (table `hero_skills`).
 *
 * PORTED FROM mpl-ph-s17/components/HeroSkills.js. The only intended difference
 * is the fetch path. This site's proxy is scoped to /api/intl/* on purpose
 * (security-rules.md Rule 3 — widening it would turn this deployment into an
 * authenticated open proxy for the whole PH backend), so the backend carries a
 * namespaced route instead of the proxy carrying a hole. Keep the two files in
 * step when changing presentation.
 *
 * NOT the same thing as <SkillImg> in components/Images.js. That one takes
 * Moonton's numeric in-game `skillid` and points at mlbb-tool/SKILL/. This is
 * wiki-sourced kit data keyed by (heroid, slot), with its own icon set under
 * mlbb-tool/hero_skill_icon/. The two never join — do not pass one's id to the
 * other.
 *
 * The kit is a STATIC hero fact: it does not move when the page's phase / week
 * / patch filters change, which is why this fetches on heroid alone and sits
 * above the filter-dependent tables.
 *
 * Text is from the MLBB Fandom wiki and is CC BY-SA, so the section carries an
 * attribution line. Keep it if you move this component.
 *
 * Styling follows HeroClass.js: outlined mono chips, neutral colours. Gold is
 * the one accent on this site and it belongs to the section header, not to
 * twenty tag chips.
 */

import { useState, useEffect } from 'react';
import { cdnify } from '../lib/images';

const SLOT_LABEL = {
  passive: 'Passive',
  s1:      'Skill 1',
  s2:      'Skill 2',
  s3:      'Skill 3',
  ult:     'Ultimate',
  special: 'Special',
};

const chipBase = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  padding: '2px 5px',
  border: '1px solid var(--border)',
  borderRadius: 3,
  whiteSpace: 'nowrap',
  lineHeight: 1.4,
  color: 'var(--muted2)',
};

const metaText = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--muted2)',
  letterSpacing: '.04em',
};

function SkillIcon({ url, size = 44 }) {
  if (!url) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 6,
        background: 'var(--surface2)', border: '1px solid var(--border)', flexShrink: 0,
      }} />
    );
  }
  return (
    <img
      src={cdnify(url)}
      alt=""
      loading="lazy"
      decoding="async"
      // alt is intentionally empty: the skill name is rendered as text right
      // beside this, so announcing it twice is noise for a screen reader.
      onError={(e) => { e.target.style.visibility = 'hidden'; e.target.onerror = null; }}
      style={{
        width: size, height: size, borderRadius: 6, objectFit: 'cover',
        border: '1px solid var(--border)', background: 'var(--surface2)', flexShrink: 0,
      }}
    />
  );
}

/** One skill: icon, name, slot + tags, cooldown/cost, description. */
function SkillRow({ skill, variantOf }) {
  const cd = skill.cooldown;
  const mana = skill.mana_cost;

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '12px 0',
      borderTop: '1px solid var(--border)',
      // Alternate forms are indented and dimmed so the base kit still reads
      // as the primary structure.
      paddingLeft: variantOf ? 24 : 0,
    }}>
      <SkillIcon url={skill.icon_url} size={variantOf ? 34 : 44} />

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Skill names are never clipped (design-rules): they wrap instead. */}
          <span style={{
            fontWeight: 600,
            fontSize: variantOf ? 13 : 14,
            color: 'var(--text)',
            wordBreak: 'break-word',
          }}>
            {skill.name}
          </span>

          {!variantOf && (
            <span style={{ ...chipBase, color: 'var(--text)', borderColor: 'var(--border-strong)' }}>
              {SLOT_LABEL[skill.slot] || skill.slot}
            </span>
          )}

          {(skill.tags || []).map((t) => (
            <span key={t} style={chipBase}>{t}</span>
          ))}
        </div>

        {(cd || mana) && (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 5 }}>
            {cd && <span style={metaText} title="Cooldown per skill level">CD {cd}</span>}
            {mana && <span style={metaText} title="Mana cost per skill level">COST {mana}</span>}
          </div>
        )}

        <p style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.65, color: 'var(--muted)' }}>
          {skill.description}
        </p>
      </div>
    </div>
  );
}

/**
 * A slot and any alternate forms of it, collapsed behind a toggle.
 *
 * Most heroes have exactly one form per slot and never render the button.
 * The ones that do not are the reason this exists: Beatrix carries four
 * ultimates (one per gun), Julian an Enhanced version of every skill, Sora
 * stance variants. Showing all of them inline pushes the actual stats far down
 * the page on exactly the heroes people open most.
 */
function SkillGroup({ base, variants }) {
  const [open, setOpen] = useState(false);
  const n = variants.length;

  return (
    <div>
      <SkillRow skill={base} />
      {n > 0 && (
        <div style={{ paddingLeft: 56, paddingBottom: open ? 0 : 10, marginTop: -4 }}>
          <button
            type="button"
            className="filter-btn"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            style={{ fontSize: 10 }}
          >
            {open ? '− Hide' : `+ ${n} more form${n > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
      {open && variants.map((v) => (
        <SkillRow key={`${v.slot}-${v.variant}`} skill={v} variantOf={base} />
      ))}
    </div>
  );
}

export default function HeroSkills({ heroid }) {
  const [skills, setSkills] = useState(null);   // null = loading, [] = none
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!heroid) return;
    let cancelled = false;
    setSkills(null);
    setFailed(false);

    fetch(`/api/intl/heroes/${heroid}/skills`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => { if (!cancelled) setSkills(Array.isArray(d?.skills) ? d.skills : []); })
      .catch(() => { if (!cancelled) { setSkills([]); setFailed(true); } });

    return () => { cancelled = true; };
  }, [heroid]);

  // Stay silent while loading or if the kit is unavailable. This sits above the
  // stats, and a broken/empty box there would be worse than no box at all —
  // the page's job is the numbers below.
  if (skills === null || failed || !skills.length) return null;

  // Group by slot: variant 1 is the base form, the rest are alternates.
  // Order comes from the API (sort_order), so no re-sorting here.
  const groups = [];
  const bySlot = new Map();
  for (const s of skills) {
    if (!bySlot.has(s.slot)) {
      const g = { base: s, variants: [] };
      bySlot.set(s.slot, g);
      groups.push(g);
    } else {
      bySlot.get(s.slot).variants.push(s);
    }
  }

  return (
    <div style={{ marginBottom: 28 }}>
      <div className="section-header">Skills</div>

      <div>
        {groups.map((g) => (
          <SkillGroup key={g.base.slot} base={g.base} variants={g.variants} />
        ))}
      </div>

      <div style={{ ...metaText, marginTop: 10, color: 'var(--muted2)', opacity: 0.8 }}>
        Skill data from the{' '}
        <a
          href="https://mobile-legends.fandom.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          Mobile Legends Wiki
        </a>
        , licensed CC BY-SA.
      </div>
    </div>
  );
}
