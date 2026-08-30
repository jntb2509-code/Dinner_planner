'use client';

import { Suspense, use, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TagPicker from '@/components/TagPicker';
import { DIET_BY_ID, tagName } from '@/core/taxonomy';
import { DISH_LIBRARY } from '@/core/library';
import type { CoverageReport, Dish, DishVerdict, MealEvent } from '@/core/types';
import ShareBox from '@/components/ShareBox';

interface CookData {
  event: MealEvent;
  coverage: CoverageReport;
  matrix: Record<string, Record<string, DishVerdict>>;
}

const STATUS_ICON: Record<DishVerdict['status'], string> = {
  blocked: '✕',
  uncertain: '?',
  disliked: '~',
  ok: '·',
  loved: '★',
};

const STATUS_LABEL: Record<DishVerdict['status'], string> = {
  blocked: 'לא יכול/ה לאכול',
  uncertain: 'לא בטוח — עלול להכיל מרכיב חסום',
  disliked: 'יכול/ה, אבל לא אוהב/ת',
  ok: 'בסדר',
  loved: 'אוהב/ת במיוחד',
};

export default function CookPageWrapper({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main><p className="muted">טוען…</p></main>}>
      <CookPage params={params} />
    </Suspense>
  );
}

function CookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const token = useSearchParams().get('t') ?? '';

  const [data, setData] = useState<CookData | null>(null);
  const [error, setError] = useState('');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<
    { dish: Dish; helps: string[]; reason: string }[] | null
  >(null);
  const [suggesting, setSuggesting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${id}?token=${encodeURIComponent(token)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'שגיאה');
      if (!body.event) throw new Error('הלינק אינו תקין — חסר או שגוי קוד הטבח.');
      setData(body);
      setDishes(body.event.dishes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינה');
    }
  }, [id, token]);

  useEffect(() => { void load(); }, [load]);

  async function saveDishes(next: Dish[]) {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${id}/dishes?token=${encodeURIComponent(token)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dishes: next }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'שגיאה בשמירה');
      setData(body);
      setDishes(body.event.dishes);
      setDirty(false);
      setSuggestions(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }

  async function fetchSuggestions(extras: boolean) {
    setSuggesting(true);
    try {
      const res = await fetch(
        `/api/events/${id}/suggest?token=${encodeURIComponent(token)}&extras=${extras ? '1' : '0'}`,
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'שגיאה');
      setSuggestions(body.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהצעות');
    } finally {
      setSuggesting(false);
    }
  }

  async function removeParticipant(participantId: string, name: string) {
    if (!confirm(`להסיר את ${name} מהארוחה? ההעדפות שמילא/ה יימחקו.`)) return;
    setRemoving(participantId);
    try {
      const res = await fetch(
        `/api/events/${id}/participants/${participantId}?token=${encodeURIComponent(token)}`,
        { method: 'DELETE' },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'שגיאה בהסרה');
      setData(body);
      // התפריט הלא-שמור נשאר כפי שהוא; רק רשימת המשתתפים השתנתה.
      if (!dirty) setDishes(body.event.dishes);
      setSuggestions(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהסרה');
    } finally {
      setRemoving(null);
    }
  }

  function updateDish(index: number, patch: Partial<Dish>) {
    setDishes((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
    setDirty(true);
  }

  function addDish(dish?: Dish) {
    const base: Dish = dish
      ? { ...dish, id: `d${Date.now()}${dishes.length}` }
      : { id: `d${Date.now()}${dishes.length}`, name: '', tags: [], isMain: true };
    setDishes((prev) => [...prev, base]);
    setDirty(true);
  }

  if (error && !data) {
    return (
      <main>
        <div className="alert bad">{error}</div>
        <p className="muted">ודא שהעתקת את לינק הטבח במלואו, כולל החלק שאחרי ‎?t=‎.</p>
      </main>
    );
  }
  if (!data) return <main><p className="muted">טוען…</p></main>;

  const { event, coverage, matrix } = data;
  const origin = typeof window === 'undefined' ? '' : window.location.origin;

  // שמות זהים כמעט תמיד מסמנים מילוי כפול משני מכשירים, לא שני אנשים
  // שונים במקרה — ולכן שווה להתריע במקום להשאיר את הטבח לגלות לבד.
  const nameCounts = new Map<string, number>();
  for (const p of event.participants) {
    const key = p.name.trim();
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  }
  const duplicateNames = [...nameCounts].filter(([, n]) => n > 1).map(([name]) => name);

  return (
    <main>
      <h1>{event.title}</h1>
      <p className="muted">
        {event.participants.length} משתתפים מילאו · דורש {event.minDishesPerPerson} מנות לכל אחד,
        מתוכן {event.minMainsPerPerson} עיקריות
      </p>

      {error && <div className="alert bad">{error}</div>}

      {/* ------------------------------- התראות ------------------------------- */}
      {event.dishes.length === 0 ? (
        <div className="alert warn">
          <strong>עוד לא הוספת מנות.</strong>
          הוסף מנות למטה, או תן למערכת להציע לך תפריט שמתאים לכולם.
        </div>
      ) : coverage.allCovered ? (
        <div className="alert good">
          <strong>לכולם יש מה לאכול ✓</strong>
          כל {event.participants.length} המשתתפים עומדים בסף שהגדרת.
        </div>
      ) : (
        <div className="alert bad">
          <strong>{coverage.uncovered.length} משתתפים בבעיה:</strong>
          <ul style={{ margin: '6px 0 0', paddingInlineStart: 20 }}>
            {coverage.uncovered.map((c) => (
              <li key={c.participantId}>
                <strong>{c.name}</strong> — {c.problems.join('; ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ------------------------------ שיתוף ------------------------------ */}
      <div className="card">
        <h3>הלינק למשפחה</h3>
        <p className="muted">מי שעוד לא מילא — שלח לו את זה שוב.</p>
        <ShareBox url={`${origin}/e/${event.id}`} />
      </div>

      {/* ------------------------------ התפריט ------------------------------ */}
      <h2>התפריט</h2>
      {dishes.map((dish, index) => (
        <div className="card" key={dish.id}>
          <div className="row" style={{ marginBottom: 10 }}>
            <input
              type="text"
              value={dish.name}
              onChange={(e) => updateDish(index, { name: e.target.value })}
              placeholder="שם המנה"
              style={{ flex: '1 1 200px' }}
              list="dish-library"
              aria-label="שם המנה"
            />
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', margin: 0, fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={dish.isMain}
                onChange={(e) => updateDish(index, { isMain: e.target.checked })}
              />
              מנה עיקרית
            </label>
            <button
              type="button"
              className="ghost small"
              onClick={() => {
                setDishes((prev) => prev.filter((_, i) => i !== index));
                setDirty(true);
              }}
            >
              הסר
            </button>
          </div>

          <details open={dish.tags.length === 0}>
            <summary className="muted" style={{ cursor: 'pointer', marginBottom: 8 }}>
              מרכיבים ({dish.tags.length}){' '}
              {dish.tags.length > 0 && `— ${dish.tags.map(tagName).join(', ')}`}
            </summary>
            <TagPicker
              variant="block"
              selected={dish.tags}
              onChange={(tags) => updateDish(index, { tags })}
            />
            <div className="muted" style={{ margin: '10px 0 6px' }}>
              עלול להכיל (לא בטוח שנמצא במנה):
            </div>
            <TagPicker
              variant="dislike"
              selected={dish.mayContain ?? []}
              onChange={(mayContain) => updateDish(index, { mayContain })}
            />
          </details>

          {event.participants.length > 0 && dish.tags.length > 0 && (
            <DishImpact dish={dish} event={event} matrix={matrix} />
          )}
        </div>
      ))}

      <datalist id="dish-library">
        {DISH_LIBRARY.map((d) => <option key={d.id} value={d.name} />)}
      </datalist>

      <div className="row" style={{ marginBottom: 20 }}>
        <button type="button" onClick={() => addDish()}>+ הוסף מנה</button>
        <button
          type="button"
          className="primary"
          disabled={!dirty || saving}
          onClick={() => void saveDishes(dishes)}
        >
          {saving ? 'שומר…' : dirty ? 'שמור ובדוק' : 'שמור'}
        </button>
        {dirty && <span className="muted">יש שינויים שלא נשמרו — הבדיקה למטה עדיין לא כוללת אותם.</span>}
      </div>

      {/* ------------------------------ הצעות ------------------------------ */}
      <h2>הצעות</h2>
      <div className="row" style={{ marginBottom: 12 }}>
        <button type="button" onClick={() => void fetchSuggestions(false)} disabled={suggesting}>
          {suggesting ? 'מחשב…' : 'השלם לי את החורים'}
        </button>
        <button type="button" className="ghost" onClick={() => void fetchSuggestions(true)} disabled={suggesting}>
          הצע עוד מנות שכולם אוהבים
        </button>
      </div>

      {suggestions?.length === 0 && (
        <p className="muted">אין מה להוסיף — כל המשתתפים כבר מכוסים.</p>
      )}
      {suggestions?.map((s) => (
        <div className="card" key={s.dish.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <strong>{s.dish.name}</strong>
              {s.dish.isMain && <span className="pill ok" style={{ marginInlineStart: 8 }}>עיקרית</span>}
              <div className="muted">{s.reason}</div>
              <div className="muted">מרכיבים: {s.dish.tags.map(tagName).join(', ')}</div>
            </div>
            <button type="button" className="small primary" onClick={() => addDish(s.dish)}>
              הוסף לתפריט
            </button>
          </div>
        </div>
      ))}

      {/* ------------------------------ המטריצה ------------------------------ */}
      {event.dishes.length > 0 && event.participants.length > 0 && (
        <>
          <h2>מי יכול לאכול מה</h2>
          <div className="matrix-wrap">
            <table className="matrix">
              <thead>
                <tr>
                  <th className="dish">מנה</th>
                  {event.participants.map((p) => <th key={p.id}>{p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {event.dishes.map((dish) => (
                  <tr key={dish.id}>
                    <th className="dish">
                      {dish.name}
                      {dish.isMain && <span className="muted"> (עיקרית)</span>}
                    </th>
                    {event.participants.map((p) => {
                      const verdict = matrix[p.id]?.[dish.id];
                      if (!verdict) return <td key={p.id} />;
                      const why = [
                        ...verdict.blockedBy.map((t) => `חסום: ${t}`),
                        ...verdict.uncertainBy.map((t) => `עלול להכיל: ${t}`),
                        ...verdict.dislikedBy.map((t) => `לא אוהב: ${t}`),
                        ...verdict.lovedBy.map((t) => `אוהב: ${t}`),
                      ];
                      return (
                        <td key={p.id}>
                          <span
                            className={`cell ${verdict.status}`}
                            title={`${p.name} — ${STATUS_LABEL[verdict.status]}${why.length ? `\n${why.join('\n')}` : ''}`}
                          >
                            {STATUS_ICON[verdict.status]}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="legend">
            <span>★ אוהב</span>
            <span>· בסדר</span>
            <span>~ לא אוהב</span>
            <span>? עלול להכיל</span>
            <span>✕ לא יכול לאכול</span>
            <span className="muted">(רחף מעל תא כדי לראות למה)</span>
          </div>
        </>
      )}

      {/* ------------------------------ המשתתפים ------------------------------ */}
      <h2>המשתתפים</h2>
      {duplicateNames.length > 0 && (
        <div className="alert warn">
          <strong>יש שמות שמופיעים יותר מפעם אחת: {duplicateNames.join(', ')}</strong>
          כנראה מילאו פעמיים משני מכשירים. משתתף כפול נספר פעמיים בדוח הכיסוי —
          הסר את הרשומה הישנה.
        </div>
      )}
      {event.participants.length === 0 && (
        <p className="muted">עוד אף אחד לא מילא. שלח את הלינק שלמעלה.</p>
      )}
      <ul className="list">
        {event.participants.map((p) => {
          const cov = coverage.perParticipant.find((c) => c.participantId === p.id);
          return (
            <li key={p.id}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{p.name}</strong>
                <span className="row" style={{ gap: 8 }}>
                  {cov && (
                    <span className={`pill ${cov.ok ? 'ok' : 'bad'}`}>
                      {cov.safeDishIds.length} מנות · {cov.safeMainDishIds.length} עיקריות
                    </span>
                  )}
                  <button
                    type="button"
                    className="ghost small"
                    disabled={removing === p.id}
                    onClick={() => void removeParticipant(p.id, p.name)}
                  >
                    {removing === p.id ? 'מסיר…' : 'הסר'}
                  </button>
                </span>
              </div>
              {p.diets.length > 0 && (
                <div className="muted">{p.diets.map((d) => DIET_BY_ID.get(d)?.he ?? d).join(' · ')}</div>
              )}
              {p.blocked.length > 0 && (
                <div style={{ color: 'var(--danger)', fontSize: '0.88rem' }}>
                  ❌ {p.blocked.map(tagName).join(', ')}
                </div>
              )}
              {p.disliked.length > 0 && (
                <div className="muted">😕 {p.disliked.map(tagName).join(', ')}</div>
              )}
              {p.loved.length > 0 && (
                <div className="muted">😍 {p.loved.map(tagName).join(', ')}</div>
              )}
              {p.notes && <div style={{ fontSize: '0.9rem' }}>💬 {p.notes}</div>}
            </li>
          );
        })}
      </ul>
    </main>
  );
}

/** סיכום מיידי מתחת לכל מנה — כמה אנשים היא משרתת וכמה היא מוציאה. */
function DishImpact({
  dish,
  event,
  matrix,
}: {
  dish: Dish;
  event: MealEvent;
  matrix: Record<string, Record<string, DishVerdict>>;
}) {
  const summary = useMemo(() => {
    const blocked: string[] = [];
    let eats = 0;
    for (const p of event.participants) {
      const verdict = matrix[p.id]?.[dish.id];
      if (!verdict) continue;
      if (verdict.status === 'blocked' || verdict.status === 'uncertain') blocked.push(p.name);
      else eats++;
    }
    return { blocked, eats };
  }, [dish.id, event.participants, matrix]);

  // מנה שנוספה זה עתה עדיין לא נשמרה, ולכן אין לה שורה במטריצה.
  if (!matrix[event.participants[0]?.id]?.[dish.id]) return null;

  return (
    <div className="muted" style={{ marginTop: 8, fontSize: '0.85rem' }}>
      {summary.eats} מתוך {event.participants.length} יכולים לאכול
      {summary.blocked.length > 0 && ` · לא מתאים ל: ${summary.blocked.join(', ')}`}
    </div>
  );
}
