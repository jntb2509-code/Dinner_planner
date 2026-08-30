'use client';

import { useMemo, useState } from 'react';
import { TAGS } from '@/core/taxonomy';
import type { TagKind } from '@/core/types';

const GROUP_LABELS: Record<TagKind, string> = {
  protein: 'בשר, דגים, ביצים וקטניות',
  dairy: 'חלב ומוצריו',
  grain: 'דגנים ופחמימות',
  vegetable: 'ירקות',
  fruit: 'פירות',
  nut: 'אגוזים וזרעים',
  other: 'אחר',
};

const GROUP_ORDER: TagKind[] = ['protein', 'dairy', 'grain', 'nut', 'vegetable', 'fruit', 'other'];

export type PickerVariant = 'block' | 'dislike' | 'love';

interface Props {
  variant: PickerVariant;
  selected: string[];
  onChange: (next: string[]) => void;
  /** תגיות שכבר נבחרו בקטגוריה חמורה יותר ולכן מושבתות כאן. */
  disabled?: Set<string>;
}

/**
 * בורר תגיות עם שני מצבים: רשימה מקוצרת של הנפוצות (ברירת מחדל), או
 * הרשימה המלאה מקובצת. רוב האנשים לא יפתחו את המלאה — ולכן מה שנמצא
 * ברשימה המקוצרת קובע כמה הטופס באמת שימושי.
 */
export default function TagPicker({ variant, selected, onChange, disabled }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState('');

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const visible = useMemo(() => {
    const term = query.trim();
    if (term) return TAGS.filter((tag) => tag.he.includes(term));
    // תגית שנבחרה תמיד נשארת גלויה, גם אם אינה ברשימה הנפוצה — אחרת
    // המשתמש בוחר משהו, סוגר את הרשימה המלאה, והבחירה נעלמת מהמסך.
    if (!showAll) return TAGS.filter((tag) => tag.common || selectedSet.has(tag.id));
    return TAGS;
  }, [query, showAll, selectedSet]);

  const grouped = useMemo(() => {
    const map = new Map<TagKind, typeof TAGS>();
    for (const tag of visible) {
      const list = map.get(tag.kind);
      if (list) list.push(tag);
      else map.set(tag.kind, [tag]);
    }
    return GROUP_ORDER.filter((kind) => map.has(kind)).map(
      (kind) => [kind, map.get(kind)!] as const,
    );
  }, [visible]);

  function toggle(id: string) {
    onChange(selectedSet.has(id) ? selected.filter((t) => t !== id) : [...selected, id]);
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש מרכיב…"
          style={{ flex: '1 1 180px' }}
          aria-label="חיפוש מרכיב"
        />
        <button type="button" className="ghost small" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'הצג רק נפוצים' : 'הצג את כל המרכיבים'}
        </button>
      </div>

      {grouped.map(([kind, tags]) => (
        <div key={kind} style={{ marginBottom: 12 }}>
          <div className="muted" style={{ marginBottom: 5 }}>{GROUP_LABELS[kind]}</div>
          <div className="tags">
            {tags.map((tag) => {
              const isDisabled = disabled?.has(tag.id) ?? false;
              const isOn = selectedSet.has(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  className={`tag ${variant}`}
                  aria-pressed={isOn}
                  disabled={isDisabled && !isOn}
                  title={isDisabled ? 'כבר נבחר ברשימה אחרת' : undefined}
                  onClick={() => toggle(tag.id)}
                >
                  {tag.he}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {grouped.length === 0 && <p className="muted">לא נמצא מרכיב שמתאים לחיפוש.</p>}
    </div>
  );
}
