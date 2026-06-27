'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function CategorySelect({ activeKey, dropdownGroups }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(key) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('cat', key);
    router.push(`/history/records?${params.toString()}`);
  }

  return (
    <select
      value={activeKey}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border-strong)',
        color: 'var(--text)',
        padding: '8px 12px',
        fontSize: '13px',
        borderRadius: 'var(--radius-sm)',
        outline: 'none',
        cursor: 'pointer'
      }}
    >
      {dropdownGroups.map(g => (
        <optgroup key={g.title} label={g.title}>
          {g.cats.map(c => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
