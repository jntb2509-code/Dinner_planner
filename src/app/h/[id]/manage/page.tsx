'use client';

import { Suspense, use, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ShareBox from '@/components/ShareBox';
import { shareBaseUrl } from '@/lib/baseUrl';
import { DIET_BY_ID, tagName } from '@/core/taxonomy';
import type { Household } from '@/lib/model';

export default function ManagePageWrapper({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main><p className="muted">טוען…</p></main>}>
      <ManagePage params={params} />
    </Suspense>
  );
}

function ManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const token = useSearchParams().get('t') ?? '';

  const [household, setHousehold] = useState<Household | null>(null);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);

  // טופס פתיחת ארוחה
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [minDishes, setMinDishes] = useState(2);
  const [minMains, setMinMains] = useState(1);
  const [attending, setAttending] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [newEvent, setNewEvent] = useState<{ id: string; cookToken: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/households/${id}?token=${encodeURIComponent(token)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'שגיאה');
      if (!body.household) throw new Error('הלינק אינו תקין — חסר או שגוי הקוד שלך.');
      setHousehold(body.household);
      // כברירת מחדל כולם מגיעים. זה המצב הנפוץ, והורדת מי שלא בא
      // מהירה יותר מסימון כל מי שכן.
      setAttending(new Set(body.household.people.map((p: { id: string }) => p.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינה');
    }
  }, [id, token]);

  useEffect(() => { void load(); }, [load]);

  async function removePerson(personId: string, name: string) {
    if (!confirm(`להסיר את ${name} מהקבוצה? ההעדפות שמילא/ה יימחקו.`)) return;
    setRemoving(personId);
    try {
      const res = await fetch(
        `/api/households/${id}/people/${personId}?token=${encodeURIComponent(token)}`,
        { method: 'DELETE' },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'שגיאה בהסרה');
      setHousehold(body.household);
      setAttending((prev) => {
        const next = new Set(prev);
        next.delete(personId);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהסרה');
    } finally {
      setRemoving(null);
    }
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const res = await fetch(`/api/households/${id}/events?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title,
          date: date || undefined,
          attendeeIds: [...attending],
          minDishesPerPerson: minDishes,
          minMainsPerPerson: minMains,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'שגיאה');
      setNewEvent(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת הארוחה');
    } finally {
      setCreating(false);
    }
  }

  if (error && !household) {
    return (
      <main>
        <div className="alert bad">{error}</div>
        <p className="muted">ודא שהעתקת את הלינק שלך במלואו, כולל החלק שאחרי ‎?t=‎.</p>
      </main>
    );
  }
  if (!household) return <main><p className="muted">טוען…</p></main>;

  const origin = shareBaseUrl();

  if (newEvent) {
    const cookLink = `${origin}/e/${newEvent.id}/cook?t=${newEvent.cookToken}`;
    return (
      <main>
        <h1>הארוחה מוכנה 🎉</h1>
        <div className="alert good">
          <strong>אין את מי לחכות.</strong>
          ההעדפות של כולם כבר במערכת — לוח הבקרה מוכן ברגע זה.
        </div>
        <div className="card">
          <h3>לוח הבקרה של הארוחה</h3>
          <ShareBox url={cookLink} />
          <p style={{ marginTop: 12 }}>
            <a href={cookLink}>
              <button type="button" className="primary">פתח את לוח הבקרה →</button>
            </a>
          </p>
        </div>
        <button type="button" onClick={() => { setNewEvent(null); setTitle(''); }}>
          ← חזרה לקבוצה
        </button>
      </main>
    );
  }

  return (
    <main>
      <h1>{household.name}</h1>
      <p className="muted">{household.people.length} אנשים בקבוצה</p>

      {error && <div className="alert bad">{error}</div>}

      <div className="card">
        <h3>הלינק למשפחה</h3>
        <p className="muted">מי שעוד לא הצטרף — שלח לו את זה. צריך למלא רק פעם אחת.</p>
        <ShareBox url={`${origin}/h/${household.id}`} />
      </div>

      {/* ------------------------------ ארוחה חדשה ------------------------------ */}
      <h2>פתח ארוחה</h2>
      {household.people.length === 0 ? (
        <p className="muted">
          עוד אף אחד לא הצטרף לקבוצה. שלח את הלינק שלמעלה, ואז אפשר יהיה לפתוח ארוחה.
        </p>
      ) : (
        <form onSubmit={createEvent} className="card">
          <div style={{ marginBottom: 14 }}>
            <label htmlFor="title">שם הארוחה</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="למשל: ליל הסדר אצל סבתא"
              required
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label htmlFor="date">תאריך (לא חובה)</label>
            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <label>מי מגיע?</label>
          <p className="muted">
            הכל מסומן כברירת מחדל. הורד את מי שלא בא — {attending.size} מתוך{' '}
            {household.people.length} מסומנים.
          </p>
          <div className="tags" style={{ marginBottom: 16 }}>
            {household.people.map((p) => (
              <button
                key={p.id}
                type="button"
                className="tag love"
                aria-pressed={attending.has(p.id)}
                onClick={() =>
                  setAttending((prev) => {
                    const next = new Set(prev);
                    if (next.has(p.id)) next.delete(p.id);
                    else next.add(p.id);
                    return next;
                  })
                }
              >
                {p.name}
              </button>
            ))}
          </div>

          <details>
            <summary className="muted" style={{ cursor: 'pointer', marginBottom: 10 }}>
              מה נחשב &quot;יש לו מה לאכול&quot;? (ברירת המחדל מתאימה לרוב הארוחות)
            </summary>
            <div className="grid2">
              <div>
                <label htmlFor="minDishes">מנות אפשריות לכל אחד, לפחות</label>
                <input
                  id="minDishes"
                  type="number"
                  min={1}
                  max={10}
                  value={minDishes}
                  onChange={(e) => setMinDishes(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 16 }}
                />
              </div>
              <div>
                <label htmlFor="minMains">מתוכן, מנות עיקריות לפחות</label>
                <input
                  id="minMains"
                  type="number"
                  min={0}
                  max={5}
                  value={minMains}
                  onChange={(e) => setMinMains(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 16 }}
                />
              </div>
            </div>
          </details>

          <button
            type="submit"
            className="primary"
            disabled={creating || attending.size === 0}
            style={{ marginTop: 18 }}
          >
            {creating ? 'פותח…' : 'פתח ארוחה'}
          </button>
          {attending.size === 0 && <span className="muted" style={{ marginInlineStart: 10 }}>סמן לפחות אדם אחד</span>}
        </form>
      )}

      {/* ------------------------------ האנשים ------------------------------ */}
      <h2>האנשים בקבוצה</h2>
      <ul className="list">
        {household.people.map((p) => (
          <li key={p.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>{p.name}</strong>
              <button
                type="button"
                className="ghost small"
                disabled={removing === p.id}
                onClick={() => void removePerson(p.id, p.name)}
              >
                {removing === p.id ? 'מסיר…' : 'הסר'}
              </button>
            </div>
            {p.diets.length > 0 && (
              <div className="muted">{p.diets.map((d) => DIET_BY_ID.get(d)?.he ?? d).join(' · ')}</div>
            )}
            {p.blocked.length > 0 && (
              <div style={{ color: 'var(--danger)', fontSize: '0.88rem' }}>
                ❌ {p.blocked.map(tagName).join(', ')}
              </div>
            )}
            {p.disliked.length > 0 && <div className="muted">😕 {p.disliked.map(tagName).join(', ')}</div>}
            {p.loved.length > 0 && <div className="muted">😍 {p.loved.map(tagName).join(', ')}</div>}
            {p.notes && <div style={{ fontSize: '0.9rem' }}>💬 {p.notes}</div>}
          </li>
        ))}
      </ul>
    </main>
  );
}
